// src/routes/import.js
// Transcript import: paste text -> preview (no writes) -> commit (bulk upsert).

const express = require('express');
const db = require('../db');
const { parseTranscript } = require('../lib/transcriptParser');
const { loadCatalog, classifyRow } = require('../lib/catalog');

const router = express.Router();

// Build the per-row preview: parsed course + catalog match + validation status.
// Also compute the GPA over the 'ok' rows so the client can show it next to the
// transcript's own GPAX as a "did we read it right?" trust check.
function buildPreview(courses, catalog) {
  const rows = courses.map((c) => {
    const { status, message } = classifyRow(
      { subject_code: c.code, grade: c.grade },
      catalog
    );
    const subject = catalog.subjects.get(c.code);
    return {
      term: c.term,
      subject_code: c.code,
      subject_name: subject ? subject.name : null,
      credit: subject && subject.credit != null ? subject.credit : c.credit,
      grade: c.grade,
      status,
      message: status === 'ok' ? null : message,
    };
  });

  // Credit-weighted GPA over EVERY parsed course with a GPA-counting grade —
  // including ones not in our catalog (they still have a real grade + credit).
  // This is a "did we read your transcript right?" check: it should match the
  // GPAX printed on the transcript, even when some courses get skipped on import.
  let num = 0;
  let den = 0;
  for (const r of rows) {
    const g = catalog.grades.get(r.grade);
    if (g && g.is_cal && !g.is_planning && g.point != null) {
      num += Number(g.point) * r.credit;
      den += r.credit;
    }
  }
  const gpa = den > 0 ? Math.round((num / den) * 100) / 100 : null;

  const okCount = rows.filter((r) => r.status === 'ok').length;
  return {
    rows,
    summary: { total: rows.length, ok: okCount, skipped: rows.length - okCount },
    computed: { gpa, credits: den }, // compare against the transcript's GPAX
  };
}

// POST /import/preview  { text }  -> preview, writes NOTHING.
router.post('/import/preview', async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text (the pasted transcript) is required' });
  }

  try {
    const { courses } = parseTranscript(text);
    if (courses.length === 0) {
      return res.status(422).json({
        error: "No course rows found. Make sure you pasted the transcript table (the rows with course numbers and grades).",
      });
    }
    const catalog = await loadCatalog(db);
    res.json(buildPreview(courses, catalog));
  } catch (err) {
    console.error('POST /import/preview failed:', err);
    res.status(500).json({ error: 'Failed to parse transcript' });
  }
});

// POST /import/commit  { enrollments: [{ subject_code, term, grade }] }
// Records the confirmed rows for the current student, all-or-nothing in a
// transaction. Re-validates server-side (never trust the client's "ok").
router.post('/import/commit', async (req, res) => {
  const { enrollments } = req.body || {};
  if (!Array.isArray(enrollments) || enrollments.length === 0) {
    return res.status(400).json({ error: 'enrollments must be a non-empty array' });
  }

  try {
    const catalog = await loadCatalog(db);

    // Validate every row first; if any is bad, reject the whole batch (the client
    // should only send confirmed 'ok' rows, so this is a safety net).
    const problems = [];
    for (const e of enrollments) {
      if (!e || !e.subject_code || !e.term || !e.grade) {
        problems.push({ row: e, message: 'subject_code, term and grade are all required' });
        continue;
      }
      const { status, message } = classifyRow(e, catalog);
      if (status !== 'ok') problems.push({ subject_code: e.subject_code, message });
    }
    if (problems.length > 0) {
      return res.status(400).json({ error: 'Some rows are invalid', problems });
    }

    // All valid -> upsert in one transaction. Borrow a dedicated client so BEGIN
    // and COMMIT run on the same connection (the pool could otherwise hand
    // different queries to different connections).
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      for (const e of enrollments) {
        await client.query(
          `INSERT INTO enrollments (student_id, subject_code, term, grade)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (student_id, subject_code)
           DO UPDATE SET term = EXCLUDED.term, grade = EXCLUDED.grade`,
          [req.studentId, e.subject_code, e.term, e.grade]
        );
      }
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release(); // always return the connection to the pool
    }

    res.status(200).json({ imported: enrollments.length });
  } catch (err) {
    console.error('POST /import/commit failed:', err);
    res.status(500).json({ error: 'Failed to import enrollments' });
  }
});

module.exports = router;
