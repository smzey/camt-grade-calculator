// src/routes/catalog.js
// Read-only endpoints over the seeded catalog: groups and subjects.
//
// An express.Router() is a "mini-app": you attach routes to it here, then
// server.js mounts it with app.use(). This keeps route logic out of server.js
// so that file stays a thin bootstrap as the app grows.

const express = require('express');
const db = require('../db'); // note: ../ because we're one folder deeper now

const router = express.Router();

// GET /groups — the whole category tree.
// ORDER BY code gives a stable parent-first ordering (1000, 1100, 1110, ...),
// which mirrors how the tree nests, so the client can render it top-down.
router.get('/groups', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT code, name, parent_code, req_wil, req_is FROM groups ORDER BY code'
    );
    // `result.rows` is the array of row objects; `.rowCount` is how many.
    // We return the array directly as the JSON response body.
    res.json(result.rows);
  } catch (err) {
    console.error('GET /groups failed:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET /subjects — the course catalog.
// Supports an optional ?group=<code> filter (e.g. /subjects?group=1111) so the
// client can ask for just one category's courses instead of all 142 rows.
router.get('/subjects', async (req, res) => {
  try {
    // req.query holds parsed ?key=value pairs. Always arrives as a string
    // (or undefined if absent), so `group` is e.g. "1111" or undefined.
    const { group } = req.query;

    let sql =
      'SELECT code, name, is_title, credit, group_code, grade_type, plan FROM subjects';
    const params = [];

    if (group !== undefined) {
      // Parameterized: the value goes in `params`, never into the string.
      // $1 refers to params[0]. This is what prevents SQL injection.
      params.push(group);
      sql += ' WHERE group_code = $1';
    }

    sql += ' ORDER BY code';

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /subjects failed:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// GET /grades — the grade -> point lookup. The UI needs this to populate the
// grade dropdowns (and to know which grades are planning grades). Ordered so
// real grades come before their x-prefixed planning twins, best grade first.
router.get('/grades', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT grade, point, type, is_cal, is_keep, is_planning
       FROM grades
       ORDER BY is_planning, point DESC NULLS LAST, grade`
    );
    // point is NUMERIC -> string from pg; hand back a real number (or null).
    const grades = result.rows.map((g) => ({
      ...g,
      point: g.point === null ? null : Number(g.point),
    }));
    res.json(grades);
  } catch (err) {
    console.error('GET /grades failed:', err);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Export the router so server.js can mount it.
module.exports = router;
