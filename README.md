<p align="center">
  <img src="docs/camt-logo.jpg" alt="CAMT — College of Arts, Media and Technology, Chiang Mai University" width="480">
</p>

# CAMT Grade Calculator

A Node.js + Express + PostgreSQL backend that replaces the fragile Excel-based
degree-progress / grade tracker handed out in the **CAMT MMIT** program. The
original spreadsheet used array formulas and manual dropdowns to track which
courses a student took, what grade they earned, whether each category's credit
requirement was met, and their GPA — hard to use and easy to break. This project
rebuilds that logic as a proper API.

> Built as a learning project for Node.js/Express/PostgreSQL, using the raw `pg`
> driver (no ORM) so the SQL stays front-and-center. Code is heavily commented.

<!--
Add a picture (schema diagram, ERD, or a Postman screenshot) here once you have one:
drop the file in docs/ and uncomment the line below.

![Schema diagram](docs/schema.png)
-->

## Stack

- **Node.js + Express 5** — HTTP API
- **PostgreSQL** via the raw `pg` driver — no ORM
- **cookie-parser** — anonymous per-browser student identity (no logins)
- **dotenv** — config via `.env`
- Dev: **nodemon**; Tests: Node's built-in `node --test` + **supertest**

## Domain model

Mirrors the original spreadsheet's sheets (full DDL in [`sql/schema.sql`](sql/schema.sql)):

| Table | What it holds |
| --- | --- |
| `groups` | The curriculum category tree (self-referencing via `parent_code`). Required credits differ per plan: `req_wil` vs `req_is`. |
| `subjects` | Course catalog. One `group_code` each. `is_title` rows are section headers (not real courses). `grade_type` restricts valid grades; `plan` restricts a subject to WIL/IS or both. |
| `grades` | Grade letter → GPA point lookup, with flags: `is_cal` (counts toward GPA), `is_keep` (counts as earned credit), `is_planning` (`x`-prefixed what-if grades). |
| `enrollments` | **New** — one row per course a student actually took (`student_id`, `subject_code`, `term`, `grade`). Unique on `(student_id, subject_code)`. |

The program has two plans: **WIL** (Work-Integrated-Learning) and **IS**
(Independent Study), with different per-category requirements.

## API

Every request carries an anonymous `student_id` cookie, minted automatically on
first contact ([`src/middleware/student.js`](src/middleware/student.js)) — so a
student only ever reads/writes their own data, with no login.

| Method & path | Description |
| --- | --- |
| `GET /health` | Server up + Postgres reachable. |
| `GET /groups` | The whole category tree. |
| `GET /subjects?group=<code>` | Course catalog, optionally filtered by group. |
| `POST /enrollments` | Record or update a grade — upsert on `(student_id, subject_code)`. Body: `{ subject_code, term, grade }`. |
| `GET /gpa` | Credit-weighted GPA. Returns both `gpa_actual` (recorded grades) and `gpa_projected` (incl. planning grades). |
| `GET /progress?plan=WIL\|IS` | Per-category credit audit — earned vs required across each group's whole subtree (recursive CTE). |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (not committed — see .gitignore)
#    Create .env with:
#      DATABASE_URL=postgres://user:pass@localhost:5432/grade_calculator
#      PORT=3000

# 3. Create the schema and seed the catalog (19 groups, 23 grades, 142 subjects)
psql "$DATABASE_URL" -f sql/schema.sql
psql "$DATABASE_URL" -f sql/seed.sql

# 4. Run
npm run dev      # nodemon, auto-restart on change
# or
npm start
```

Then check it's alive:

```bash
curl http://localhost:3000/health
# { "status": "ok", "db": "connected" }
```

## Testing

```bash
npm test
```

Uses Node's built-in test runner with **supertest** against the exported app
([`src/app.js`](src/app.js)) — no real port is opened. Splitting `app.js` (wires
the app) from `server.js` (starts listening) is what makes this possible.

## Project layout

```text
sql/
  schema.sql        # tables (applied)
  seed.sql          # catalog data from the original xlsx
src/
  db.js             # pg Pool wrapper: db.query(text, params)
  app.js            # builds + exports the Express app (no listen)
  server.js         # thin entry point: app.listen()
  middleware/
    student.js      # anonymous student_id cookie
  routes/
    catalog.js      # GET /groups, /subjects
    enrollments.js  # POST /enrollments (upsert)
    gpa.js          # GET /gpa
    progress.js     # GET /progress
test/
  api.test.js
```
