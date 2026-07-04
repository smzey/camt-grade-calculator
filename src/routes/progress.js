// src/routes/progress.js
// GET /progress?student=me&plan=WIL — degree category-progress audit.
//
// For every group in the curriculum tree, report how many credits the student
// has PASSED (grades.is_keep = TRUE) within that group OR any group beneath it,
// versus how many that plan requires. This is the whole point of the app: the
// "have I satisfied each category?" view that the spreadsheet did with fragile
// array formulas.
//
// The hard part: requirements are hierarchical. A course in "English 4" (1111)
// also counts toward its ancestors "Learner Person" (1110) -> "GE-Required"
// (1100) -> "General Education" (1000). So each group's earned total must sum
// credits from its ENTIRE subtree, not just subjects directly attached to it.
// That subtree walk is what the RECURSIVE CTE below does.

const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/progress', async (req, res) => {
  const student_id = req.studentId; // from the cookie (attachStudent middleware)
  // Plan picks which requirement column to compare against (req_wil vs req_is)
  // and which plan-specific subjects count. Default WIL; reject anything else.
  const plan = (req.query.plan || 'WIL').toUpperCase();
  if (plan !== 'WIL' && plan !== 'IS') {
    return res.status(400).json({ error: "plan must be 'WIL' or 'IS'" });
  }

  try {
    const sql = `
      WITH RECURSIVE
      -- subtree: for every group ("root"), enumerate itself + all groups below it.
      --   Base case  : each group is its own descendant (a group satisfies its
      --                 own requirement, plus it's the seed for the recursion).
      --   Recursive  : for each (root, descendant) pair found so far, add the
      --                 descendant's direct children as further descendants.
      -- Postgres keeps iterating the recursive term until it yields no new rows.
      subtree AS (
        SELECT code AS root, code AS descendant
        FROM groups
        UNION ALL
        SELECT st.root, g.code
        FROM subtree st
        JOIN groups g ON g.parent_code = st.descendant
      ),
      -- earned: credits actually passed, bucketed by the subject's own group.
      -- is_keep = TRUE means the grade counts as earned credit (A-D, S, X; NOT
      -- F/U/W). is_title rows are section headers, never real courses. We also
      -- respect plan: a WIL-only subject shouldn't count for an IS student.
      earned AS (
        SELECT s.group_code, SUM(s.credit) AS credits
        FROM enrollments e
        JOIN subjects s ON s.code  = e.subject_code
        JOIN grades   g ON g.grade = e.grade
        WHERE e.student_id = $1
          AND g.is_keep = TRUE
          AND s.is_title = FALSE
          AND (s.plan IS NULL OR s.plan = $2)
        GROUP BY s.group_code
      )
      SELECT
        gr.code,
        gr.name,
        gr.parent_code,
        -- Pick the requirement column for this plan.
        CASE WHEN $2 = 'IS' THEN gr.req_is ELSE gr.req_wil END AS required,
        -- Sum earned credits across this group's whole subtree. LEFT JOIN so
        -- groups with zero passed credits still appear (as 0, via COALESCE).
        -- Cast to int: SUM of an integer column is bigint, which node-pg would
        -- otherwise hand back as a string.
        COALESCE(SUM(ea.credits), 0)::int AS earned
      FROM groups gr
      JOIN subtree st ON st.root = gr.code
      LEFT JOIN earned ea ON ea.group_code = st.descendant
      -- Group by the PK alone; Postgres lets us select gr.name/parent_code/req_*
      -- because they're functionally dependent on the primary key.
      GROUP BY gr.code
      ORDER BY gr.code
    `;

    const result = await db.query(sql, [student_id, plan]);

    // Add a convenience boolean per row so the client doesn't re-derive it.
    const groups = result.rows.map((r) => ({
      ...r,
      met: r.earned >= r.required,
      remaining: Math.max(0, r.required - r.earned),
    }));

    res.json({ student_id, plan, groups });
  } catch (err) {
    console.error('GET /progress failed:', err);
    res.status(500).json({ error: 'Failed to compute progress' });
  }
});

module.exports = router;
