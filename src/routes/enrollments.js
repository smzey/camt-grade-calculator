// src/routes/enrollments.js
// Write endpoint: record (or update) the current student's grade for one subject.
//
// The enrollments table has UNIQUE (student_id, subject_code), meaning a student
// can hold at most one row per subject. So "record a grade" and "change a grade"
// are the same operation from the client's view — an UPSERT: insert if new,
// update if it already exists. We express that with INSERT ... ON CONFLICT.

const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /enrollments
// Body: { subject_code, term, grade }. The student is taken from the cookie
// (req.studentId), NOT the body — clients can only ever write their own data.
router.post('/enrollments', async (req, res) => {
  const { subject_code, term, grade } = req.body;
  const student_id = req.studentId; // set by the attachStudent middleware

  // --- 1. Presence validation (cheap, no DB) ---
  const errors = [];
  if (!subject_code) errors.push('subject_code is required');
  if (!term) errors.push('term is required');
  if (!grade) errors.push('grade is required');
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // --- 2. Semantic validation (needs the DB) ---
    // Foreign keys already guarantee subject_code/grade EXIST, but they can't
    // express two business rules, so we check them up front with one query:
    //   (a) you can't enrol in a title/section-header row (is_title = true), and
    //   (b) the grade's type must be allowed for the subject. A subject with
    //       grade_type 'AF' takes only letter grades; 'SU' takes only S/U;
    //       NULL takes anything. Grades whose own type is NULL (V/W/X — e.g.
    //       Withdraw) are allowed on any subject.
    // Scalar subqueries return NULL when the row doesn't exist, which also lets
    // us give a nicer "not found" message than the raw FK error.
    const check = await db.query(
      `SELECT
         (SELECT is_title   FROM subjects WHERE code  = $1) AS is_title,
         (SELECT grade_type FROM subjects WHERE code  = $1) AS subject_type,
         (SELECT type       FROM grades   WHERE grade = $2) AS grade_type,
         EXISTS(SELECT 1 FROM subjects WHERE code  = $1)    AS subject_exists,
         EXISTS(SELECT 1 FROM grades   WHERE grade = $2)    AS grade_exists`,
      [subject_code, grade]
    );
    const c = check.rows[0];

    if (!c.subject_exists) {
      return res.status(400).json({ error: `subject '${subject_code}' does not exist` });
    }
    if (!c.grade_exists) {
      return res.status(400).json({ error: `grade '${grade}' does not exist` });
    }
    if (c.is_title) {
      return res.status(400).json({
        error: `subject '${subject_code}' is a section header, not an enrollable course`,
      });
    }
    // The type-mismatch rule: only reject when BOTH sides declare a type and
    // they differ. (subject_type NULL = accepts anything; grade_type NULL = the
    // grade fits anywhere.)
    if (c.subject_type && c.grade_type && c.subject_type !== c.grade_type) {
      return res.status(400).json({
        error: `grade '${grade}' (type ${c.grade_type}) is not valid for subject ` +
          `'${subject_code}' (accepts ${c.subject_type})`,
      });
    }

    // --- 3. The upsert ---
    // ON CONFLICT names the unique constraint; on collision we UPDATE instead of
    // erroring. EXCLUDED holds the values we tried to insert. created_at is left
    // untouched so it keeps the original date. RETURNING * echoes the final row.
    const result = await db.query(
      `INSERT INTO enrollments (student_id, subject_code, term, grade)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, subject_code)
       DO UPDATE SET term = EXCLUDED.term, grade = EXCLUDED.grade
       RETURNING *`,
      [student_id, subject_code, term, grade]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    // Backstop: the FK check should be unreachable now (we pre-validate), but
    // keep translating 23503 to 400 just in case of a race.
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'subject_code or grade does not exist in the catalog',
        detail: err.detail,
      });
    }
    console.error('POST /enrollments failed:', err);
    res.status(500).json({ error: 'Failed to save enrollment' });
  }
});

// GET /enrollments — list the current student's recorded grades.
// Joined with subjects + grades so the client gets everything it needs to render
// a "my courses" table in one call (name, credit, GPA point, flags) instead of
// looking each one up separately.
router.get('/enrollments', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         e.subject_code,
         s.name       AS subject_name,
         s.credit,
         s.group_code,
         e.term,
         e.grade,
         g.point,
         g.is_keep,
         g.is_planning
       FROM enrollments e
       JOIN subjects s ON s.code  = e.subject_code
       JOIN grades   g ON g.grade = e.grade
       WHERE e.student_id = $1
       -- term is text like '1/1' or '10/3'. A plain text sort would order
       -- '10/1' before '2/1' ('1' < '2' char-by-char). Split into year/sem and
       -- cast to int so it sorts the way a human reads a transcript.
       ORDER BY split_part(e.term, '/', 1)::int,
                split_part(e.term, '/', 2)::int,
                e.subject_code`,
      [req.studentId]
    );

    // pg returns NUMERIC (point) as a string; convert to a real number (or keep
    // null for non-GPA grades like S/W). credit is INTEGER -> already a number.
    const enrollments = result.rows.map((r) => ({
      ...r,
      point: r.point === null ? null : Number(r.point),
    }));

    res.json({ student_id: req.studentId, enrollments });
  } catch (err) {
    console.error('GET /enrollments failed:', err);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// DELETE /enrollments/:subject_code — remove the current student's grade for one
// subject. The ':subject_code' is a ROUTE PARAMETER: Express matches any value in
// that path segment and exposes it as req.params.subject_code (e.g. a request to
// DELETE /enrollments/001201 gives subject_code = '001201'). We scope the delete
// to req.studentId so a client can only ever delete its OWN rows.
router.delete('/enrollments/:subject_code', async (req, res) => {
  const { subject_code } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM enrollments
       WHERE student_id = $1 AND subject_code = $2
       RETURNING *`,
      [req.studentId, subject_code]
    );

    // rowCount is how many rows the statement affected. 0 means this student had
    // no grade recorded for that subject -> 404 Not Found (nothing to delete).
    // (Some APIs return 204 here to make DELETE idempotent; we prefer 404 so the
    // caller learns the row wasn't there.)
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `no enrollment for subject '${subject_code}'` });
    }

    // Echo the deleted row so the client can confirm what went away.
    res.status(200).json({ deleted: result.rows[0] });
  } catch (err) {
    console.error('DELETE /enrollments failed:', err);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

module.exports = router;
