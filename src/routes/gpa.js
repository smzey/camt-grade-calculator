// src/routes/gpa.js
// GET /gpa — compute a student's grade point average.
//
// GPA = SUM(point * credit) / SUM(credit), over courses whose grade counts
// toward the average (grades.is_cal = TRUE). Weighting by credit means a
// 3-credit A pulls the average more than a 1-credit A ("credit-weighted mean").
//
// The catch (see grades seed data): the planning grades xA, xB, ... also have
// is_cal = TRUE. They represent *expected future* grades for what-if planning,
// not real results. So we report TWO numbers:
//   - gpa_actual    : recorded grades only        (is_planning = FALSE)
//   - gpa_projected : recorded + planned grades   (all is_cal rows)
// A student mid-degree uses gpa_projected to answer "if I get these grades,
// where do I land?", and gpa_actual for "where am I right now?".

const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/gpa', async (req, res) => {
  const student_id = req.studentId; // from the cookie (attachStudent middleware)

  try {
    // Aggregate query — one row out, summarizing many enrollment rows.
    //
    // The FILTER (WHERE ...) clause is Postgres's way of applying different
    // row-subsets to different aggregates in the SAME query. Here it lets the
    // "actual" sums ignore planning grades while the "projected" sums include
    // them — no need for two separate queries.
    //
    // NULLIF(x, 0) returns NULL when x = 0, so dividing by it yields NULL
    // (instead of a divide-by-zero error) when the student has no qualifying
    // credits yet. ROUND(..., 2) trims to 2 decimal places.
    const sql = `
      SELECT
        ROUND(
          SUM(g.point * s.credit) FILTER (WHERE g.is_planning = FALSE)
          / NULLIF(SUM(s.credit)  FILTER (WHERE g.is_planning = FALSE), 0)
        , 2) AS gpa_actual,
        COALESCE(SUM(s.credit) FILTER (WHERE g.is_planning = FALSE), 0) AS credits_actual,

        ROUND(
          SUM(g.point * s.credit)
          / NULLIF(SUM(s.credit), 0)
        , 2) AS gpa_projected,
        COALESCE(SUM(s.credit), 0) AS credits_projected
      FROM enrollments e
      JOIN grades   g ON g.grade = e.grade          -- grade letter -> point + flags
      JOIN subjects s ON s.code  = e.subject_code   -- subject -> credit weight
      WHERE e.student_id = $1
        AND g.is_cal = TRUE                          -- only grades that count toward GPA
    `;

    const result = await db.query(sql, [student_id]);
    // Aggregates always return exactly one row, even when nothing matched
    // (the sums are just NULL/0 in that case). So rows[0] is always defined.
    const row = result.rows[0];

    res.json({
      student_id,
      // pg returns NUMERIC as a string to avoid float precision loss. Convert
      // to a JS number for the client — or leave null when there's no GPA yet.
      gpa_actual: row.gpa_actual === null ? null : Number(row.gpa_actual),
      credits_actual: Number(row.credits_actual),
      gpa_projected: row.gpa_projected === null ? null : Number(row.gpa_projected),
      credits_projected: Number(row.credits_projected),
    });
  } catch (err) {
    console.error('GET /gpa failed:', err);
    res.status(500).json({ error: 'Failed to compute GPA' });
  }
});

module.exports = router;
