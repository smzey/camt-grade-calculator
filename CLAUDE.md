# CAMT Grade Calculator — Project Context

## What this is
A backend (Node.js + Express + PostgreSQL) replacing a fragile Excel-based degree
progress / grade tracker my university teacher gave out (CAMT, MMIT program). The
xlsx used array formulas and manual dropdowns to track: which courses a student
took, what grade they got, whether they've met each category's credit requirement,
and their GPA. It's hard to use and easy to break. This project rebuilds that logic
as a proper website, backend first.

**I'm learning Node.js/Express/PostgreSQL by building this.** Please explain what
each piece of code does as you write it (briefly — I already know JS/React and
basic SQL, I'm specifically learning backend/Node conventions), keep code
well-commented, and prefer small incremental steps I can run and verify over
dumping a huge diff at once.

Stack preferences: Node.js, Express, PostgreSQL (raw `pg` driver, no ORM for now —
learning SQL directly is the point). Eventually this will be deployed to a VPS I
manage myself.

## Domain model (mirrors the original spreadsheet's sheets)

- **`groups`** — the curriculum's category tree (e.g. "General Education" ->
  "GE Required" -> "Learner Person"). Self-referencing via `parent_code`. Each
  group has a required credit count that differs by degree plan (`req_wil` vs
  `req_is` — the program has two plans, Work-Integrated-Learning or Independent
  Study, with different requirements per category).
- **`subjects`** — the course catalog. Each subject belongs to one `group_code`.
  `is_title = true` rows are section-header pseudo-rows (not real courses, e.g.
  code `'GE-Req'`), used for display/grouping only — filter them out of any
  "did the student pass this" logic. `grade_type` restricts which grades are
  valid for that course (`'AF'` = letter grades A-F, `'SU'` = Satisfactory/
  Unsatisfactory, `NULL` = either). `plan` restricts a subject to one plan
  (`'WIL'`/`'IS'`) or `NULL` = counts for both.
- **`grades`** — grade letter -> GPA point lookup (A=4, B+=3.5, ... S/U/V/W/X
  have `point = NULL`, they're non-GPA grades). Flags: `is_cal` = counts toward
  GPA average, `is_keep` = counts as a passed/earned credit, `is_planning` = true
  for the `x`-prefixed grades (xA, xB, ...) which represent a *planned/expected*
  future grade for what-if planning, not a real recorded one.
- **`enrollments`** — NEW table, didn't exist in the spreadsheet. One row per
  course a student has actually taken: `student_id`, `subject_code`, `term`
  (e.g. `'1/1'` = year 1 semester 1), `grade`. This is what replaces manually
  typing a letter into one of 30 term columns in Excel.

Full schema: `sql/schema.sql` (already run against local Postgres, db name
`grade_calculator`). Seed data extracted from the actual xlsx (19 groups, 23
grades, 142 subjects): `sql/seed.sql` (written, not yet run — run this next).

## Status / file inventory
- `package.json` — deps: express, pg, dotenv, cookie-parser. devDeps: nodemon,
  supertest. Scripts: `npm run dev` (nodemon), `npm start`, `npm test` (node --test).
- `.env` — `DATABASE_URL`, `PORT=3000`. (gitignored — don't commit)
- `sql/schema.sql` — applied (19 groups, 23 grades, 142 subjects).
- `sql/seed.sql` — applied.
- `src/db.js` — pg Pool wrapper (`db.query(text, params)`), exports `pool` too.
- `src/app.js` — builds + EXPORTS the Express app (middleware: json, cookieParser,
  attachStudent; `GET /health`; mounts all routers). No `.listen` here — that's
  what makes it testable.
- `src/server.js` — thin entry point: `require('./app')` then `app.listen(PORT)`.
- `src/middleware/student.js` — `attachStudent`: reads the `student_id` cookie
  (mints a random `u_<uuid>` + Set-Cookie if absent), sets `req.studentId`.
  This is the "anonymous per-browser identity" — no login; data still in Postgres
  keyed by this id.
- `src/routes/catalog.js` — `GET /groups`, `GET /subjects` (step 2).
- `src/routes/enrollments.js` — `POST /enrollments` (step 3). Student comes from
  the cookie (not the body). Validates: presence, subject/grade exist, not a
  title row, and grade_type vs subject.grade_type. Then upserts.
- `src/routes/gpa.js` — `GET /gpa` (step 4). Uses `req.studentId`. Returns
  gpa_actual (recorded only) AND gpa_projected (incl. planning x-grades).
- `src/routes/progress.js` — `GET /progress?plan=WIL|IS` (step 5). Uses
  `req.studentId`. Recursive CTE rolls each group's passed (is_keep) credits up
  its subtree; compares to req_wil/req_is; returns {required, earned, met, remaining}.
- `test/api.test.js` — 21 supertest integration tests over the real seeded DB;
  acts as `test-*` students (via Cookie header) and cleans them up. `npm test`.

## Remaining roadmap
1. **Express server + DB connection** (`src/db.js` — `pg` Pool using
   `DATABASE_URL` from `.env`; `src/server.js` — express app, health-check route)
2. **`GET /groups`, `GET /subjects`** — read-only endpoints over the catalog
3. **`POST /enrollments`** — record/update a student's grade for a subject+term
   (upsert on the `(student_id, subject_code)` unique constraint)
4. **GPA calculation** — join `enrollments` -> `grades`, filter `is_cal = true`,
   weight by `subjects.credit`, `SUM(point*credit)/SUM(credit)`
5. **Category-progress calculation** — for each `groups` row, sum `subjects.credit`
   for subjects in that group (and its descendant groups, via recursive CTE on
   `parent_code`) where the student has an enrollment with `grades.is_keep = true`,
   compare against `req_wil`/`req_is` depending on the student's chosen plan
6. **Testing** — verify all endpoints against the seeded data with curl/Postman

All roadmap steps #1–#6 done and verified. Since then also added:
- **grade_type + title-row validation** on `POST /enrollments` (DONE).
- **Cookie-based anonymous identity** — `student_id` now comes from a per-browser
  cookie, not a hardcoded 'me'. No login; data stays in Postgres keyed by the
  cookie id. This was a deliberate product choice: "save user data per-browser,
  not behind an online account."
- **Automated test suite** — `npm test`, 21 supertest integration tests (DONE).

Known open items / next candidates:

- No frontend yet — API only. A browser UI would consume these endpoints and rely
  on the cookie being sent automatically (fetch with `credentials: 'include'`).
- Cookie is httpOnly + sameSite=lax; `secure` flips on when `NODE_ENV=production`.
  On the VPS (HTTPS) remember to run with `NODE_ENV=production`.
- No `GET /enrollments` (list a student's recorded grades) — likely needed by a UI.
- Tests hit the real dev DB; fine for now, but a dedicated test DB would isolate
  them from local data entirely.
