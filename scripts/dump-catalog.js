// scripts/dump-catalog.js
// One-time (re-runnable) export of the STATIC catalog from Postgres into a JSON
// file the client bundles at build time. Once the app goes fully static there is
// no database at runtime — the catalog (groups, subjects, grades) is fixed seed
// data, so we snapshot it here and ship it inside the JS bundle.
//
// Re-run this only if you change the seed data (sql/seed.sql) and want the static
// app to pick up the new catalog:  node scripts/dump-catalog.js

const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function main() {
  // Same columns/ordering the old /api/groups, /subjects, /grades returned, so
  // the client sees identical data — we're just moving it from HTTP to a bundle.
  const [groups, subjects, grades] = await Promise.all([
    db.query('SELECT code, name, parent_code, req_wil, req_is FROM groups ORDER BY code'),
    db.query(
      'SELECT code, name, is_title, credit, group_code, grade_type, plan FROM subjects ORDER BY code'
    ),
    db.query(
      `SELECT grade, point, type, is_cal, is_keep, is_planning
         FROM grades
        ORDER BY is_planning, point DESC NULLS LAST, grade`
    ),
  ]);

  // pg hands NUMERIC back as a string; convert point to a real number (or null)
  // so the bundled JSON matches what the API used to return.
  const catalog = {
    groups: groups.rows,
    subjects: subjects.rows,
    grades: grades.rows.map((g) => ({ ...g, point: g.point === null ? null : Number(g.point) })),
  };

  const outPath = path.join(__dirname, '..', 'client', 'src', 'data', 'catalog.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');

  console.log(
    `Wrote ${catalog.groups.length} groups, ${catalog.subjects.length} subjects, ` +
      `${catalog.grades.length} grades -> ${outPath}`
  );
  await db.pool.end();
}

main().catch((err) => {
  console.error('dump-catalog failed:', err);
  process.exit(1);
});
