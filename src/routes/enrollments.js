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

module.exports = router;
