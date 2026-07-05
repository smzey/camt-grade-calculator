# CAMT Grade Calculator — Project Context

## ⚡ ARCHITECTURE UPDATE (now a STATIC app — no server, no DB at runtime)
To deploy cheaply and survive going viral, the app was migrated to **100% static**:
- **No backend at runtime.** The React app (`client/`) is the whole thing. It's
  built to static files and hosted for **free** on GitHub Pages (see
  `.github/workflows/deploy-pages.yml`; base path `/camt-grade-calculator/`).
- **Data lives in the browser** (`localStorage`, key `camt.enrollments.v1`) via
  `client/src/store.js` — the logical end of the "save per-browser, not online"
  choice. A **Backup: Export/Restore JSON** button (`BackupMenu.jsx`) is the
  manual cross-device / don't-lose-it story.
- **The catalog is bundled**, not queried: `client/src/data/catalog.json` is a
  build-time snapshot of the groups/subjects/grades tables. Regenerate it with
  `node scripts/dump-catalog.js` if you change `sql/seed.sql`.
- **The SQL logic moved to the browser**: `client/src/engine.js` reimplements GPA
  (was `gpa.js`), category progress / subtree rollup (was `progress.js`'s
  recursive CTE), and the import preview (was `import.js`); `client/src/catalog.js`
  holds the validation rule (was `lib/catalog.js`); `client/src/transcriptParser.js`
  is the ESM copy of `lib/transcriptParser.js`. `client/src/api.js` keeps the SAME
  method names/shapes as the old fetch client, so `App.jsx`/`TranscriptImport.jsx`
  didn't change — they just call local functions now. Verified faithful to the SQL
  via `scripts/verify-engine.mjs`.
- **The Node/Express/Postgres backend (`src/`, `sql/`, `test/`) is KEPT** as the
  learning artifact and as the source for regenerating `catalog.json`. It is NOT
  part of the deploy anymore. Everything below describing "/api" endpoints is the
  original backend — still runnable locally, but the live app no longer uses it.

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

IMPORTANT: all API routes are now under **`/api`** (e.g. `GET /api/groups`). Express
serves the built React app (`client/dist`) for every non-`/api` path.

## Status / file inventory
- `package.json` — deps: express, pg, dotenv, cookie-parser. devDeps: nodemon,
  supertest. Scripts: `npm run dev` (backend nodemon), `npm start`, `npm test`
  (node --test), `npm run client` (Vite dev server), `npm run build` (build client).
- `.env` — `DATABASE_URL`, `PORT=3000`. (gitignored — don't commit)
- `sql/schema.sql` — applied (19 groups, 23 grades, 142 subjects).
- `sql/seed.sql` — applied.
- `src/db.js` — pg Pool wrapper (`db.query(text, params)`), exports `pool` too.
- `src/app.js` — builds + EXPORTS the Express app. Global middleware json +
  cookieParser; an `/api` router (attachStudent, `/health`, `/session`, all
  feature routers); a JSON 404 for unknown `/api/*`; then static serving of
  `client/dist` + SPA fallback to index.html. No `.listen` — that's server.js.
- `src/server.js` — thin entry point: `require('./app')` then `app.listen(PORT)`.
- `src/middleware/student.js` — `attachStudent` (mounted on the /api router only):
  reads the `student_id` cookie (mints a random `u_<uuid>` + Set-Cookie if absent),
  sets `req.studentId`. Anonymous per-browser identity — no login; data in Postgres
  keyed by this id. `GET /api/session` lets the client establish the cookie once
  on startup before firing parallel loads (avoids an id race).
- `src/routes/catalog.js` — `GET /groups`, `GET /subjects`, `GET /grades`.
- `src/routes/enrollments.js` — full enrollments resource, all cookie-scoped:
  `POST /enrollments` (upsert; validates presence, subject/grade exist, not a title
  row, grade_type vs subject.grade_type), `GET /enrollments` (list, joined with
  subject/grade info, numeric term sort), `DELETE /enrollments/:subject_code`
  (404 if the student has no such row). Student always comes from the cookie.
- `src/routes/gpa.js` — `GET /gpa` (step 4). Uses `req.studentId`. Returns
  gpa_actual (recorded only) AND gpa_projected (incl. planning x-grades).
- `src/routes/progress.js` — `GET /progress?plan=WIL|IS` (step 5). Uses
  `req.studentId`. Recursive CTE rolls each group's passed (is_keep) credits up
  its subtree; compares to req_wil/req_is; returns {required, earned, met, remaining}.
- `test/api.test.js` — 30 supertest integration tests over the real seeded DB;
  acts as `test-*` students (via Cookie header) and cleans them up. `npm test`.
- `client/` — Vite + React SPA (its own package.json). `client/src/api.js` wraps
  the /api endpoints (fetch, credentials:'include'); `client/src/App.jsx` is the
  dashboard (plan toggle, category tree with progress bars, per-subject grade
  dropdowns, live GPA panel). `vite.config.js` proxies /api -> :3000 in dev.
  `npm run build` emits `client/dist`, which Express serves in production.

## Dev workflow
Two processes in dev: `npm run dev` (backend :3000) + `npm run client` (Vite
:5173, open THIS in the browser — it hot-reloads and proxies /api to :3000).
For a prod-like single-origin run: `npm run build` then `npm start`, open :3000.

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
- **Cookie-based anonymous identity** — `student_id` comes from a per-browser
  cookie, not a hardcoded 'me'. No login; data stays in Postgres keyed by the
  cookie id. Deliberate product choice: "save user data per-browser, not online."
- **Automated test suite** — `npm test`, 30 supertest integration tests (DONE).
- **React frontend** — Vite SPA dashboard served same-origin under Express;
  API moved under `/api`. Verified end-to-end (build + client-style flow). (DONE)

Known open items / next candidates:

- Frontend is a FIRST version — not yet visually verified in a real browser by
  a human; worth a look to catch layout issues. Logic/endpoints are verified.
- Per-subject term: new entries use a single "active term" selector; there's no
  per-row term editor yet. Fine for v1; revisit if term accuracy matters.
- `NODE_ENV=production` on the VPS flips the cookie `secure` flag on (HTTPS) and
  is when Express serves `client/dist`. Remember `npm run build` in deploy.
- Tests hit the real dev DB; a dedicated test DB would isolate them fully.
- No user-facing way to see a flat transcript / clear-all; only the tree view.
