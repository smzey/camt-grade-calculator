// src/routes/enrollments.js
// Write endpoint: record (or update) a student's grade for one subject.
//
// The enrollments table has UNIQUE (student_id, subject_code), meaning a student
// can hold at most one row per subject. So "record a grade" and "change a grade"
// are the same operation from the client's view — an UPSERT: insert if new,
// update if it already exists. We express that with INSERT ... ON CONFLICT.

const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /enrollments
// Expected JSON body: { subject_code, term, grade, student_id? }
//   - student_id is optional; defaults to 'me' (matches the schema default,
//     placeholder until real users/auth exist).
router.post('/enrollments', async (req, res) => {
  // req.body is populated by the express.json() middleware in server.js.
  // Destructure the fields we care about; missing ones come out as undefined.
  const { subject_code, term, grade } = req.body;
  const student_id = req.body.student_id || 'me';

  // --- Validation ---
  // Never trust the client. Reject bad input early with 400 (Bad Request)
  // and a clear message, before we ever touch the database.
  // We collect all problems so the client sees them in one response.
  const errors = [];
  if (!subject_code) errors.push('subject_code is required');
  if (!term) errors.push('term is required');
  if (!grade) errors.push('grade is required');

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // --- The upsert ---
    // ON CONFLICT (student_id, subject_code) names the unique constraint that
    // might be violated. When it is, instead of erroring we DO UPDATE the
    // existing row. EXCLUDED is a special table referring to the values we
    // *tried* to insert — so we copy the new term/grade onto the existing row.
    // We deliberately leave created_at untouched so it keeps the original date.
    // RETURNING * hands back the final row (inserted or updated) so we can
    // echo it to the client — no second SELECT needed.
    const result = await db.query(
      `INSERT INTO enrollments (student_id, subject_code, term, grade)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, subject_code)
       DO UPDATE SET term = EXCLUDED.term, grade = EXCLUDED.grade
       RETURNING *`,
      [student_id, subject_code, term, grade]
    );

    // 200 OK (rather than 201 Created) because this may have been an update.
    res.status(200).json(result.rows[0]);
  } catch (err) {
    // Postgres reports a foreign-key violation with SQLSTATE code '23503'.
    // That happens here if subject_code isn't a real subject, or grade isn't a
    // real grade (both are REFERENCES in the schema). It's the *client's* bad
    // input, not a server fault, so translate it to 400 with a useful message.
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'subject_code or grade does not exist in the catalog',
        detail: err.detail, // pg's own explanation, e.g. "Key (grade)=(Z) is not present..."
      });
    }
    // Anything else is a genuine server-side problem.
    console.error('POST /enrollments failed:', err);
    res.status(500).json({ error: 'Failed to save enrollment' });
  }
});

module.exports = router;
