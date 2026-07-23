// client/src/store.js
// The database, replaced by the browser. Enrollments live in localStorage on the
// student's own device — no server, no account, nothing sent anywhere. This is
// the deliberate product choice ("save per-browser, not online") taken to its
// logical end: the whole app is now static files + this local store.
//
// Storage shape (one key): a plain object mapping subject_code -> { subject_code,
// term, grade }. Keying by subject_code gives us the old UNIQUE(student_id,
// subject_code) upsert semantics for free — one grade per subject.

import { subjectMap, gradeMap } from './catalog';

const KEY = 'camt.enrollments.v1';

// Read the raw map from localStorage (or {} if empty/corrupt — never throw, a
// broken value shouldn't brick the app).
function readMap() {
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

// All enrollments as a bare array — what the compute engine (GPA/progress) wants.
export function allEnrollments() {
  return Object.values(readMap());
}

// Sort a list into transcript reading order: term is "year/sem" text, so a plain
// sort would put "10/1" before "2/1". Split and compare numerically, then by code
// — same ORDER BY the old GET /enrollments used.
function byTerm(a, b) {
  const [ay, as] = a.term.split('/').map(Number);
  const [by, bs] = b.term.split('/').map(Number);
  return ay - by || as - bs || a.subject_code.localeCompare(b.subject_code);
}

// The joined + sorted list for the dashboard, matching the old API's rows: each
// enrollment enriched with its subject/grade fields (name, credit, point, flags).
export function listEnrollments() {
  return allEnrollments()
    .map((e) => {
      const s = subjectMap.get(e.subject_code) || {};
      const g = gradeMap.get(e.grade) || {};
      return {
        subject_code: e.subject_code,
        subject_name: s.name ?? e.name ?? null,
        credit: s.credit ?? e.credit ?? null,
        group_code: s.group_code ?? null,
        term: e.term,
        grade: e.grade,
        point: g.point ?? null,
        is_keep: g.is_keep ?? null,
        is_planning: g.is_planning ?? null,
      };
    })
    .sort(byTerm);
}

// Build the stored shape for one row. An empty grade is normalised to null —
// that's the "currently studying" state. A subject the catalog doesn't know
// keeps its own credit, since there's nothing to look it up from later.
function toRow({ subject_code, term, grade, credit, name }) {
  const g = grade == null || grade === '' ? null : grade;
  const row = { subject_code, term, grade: g };
  if (!subjectMap.has(subject_code)) {
    // Off-catalog course: the credit and the title came from the pasted
    // document and exist nowhere else, so they ride along on the row itself.
    const c = Number(credit);
    if (Number.isFinite(c) && c > 0) row.credit = c;
    if (name) row.name = String(name);
  }
  return row;
}

// Upsert one enrollment (insert or overwrite by subject_code).
export function upsert({ subject_code, term, grade, credit, name }) {
  const map = readMap();
  map[subject_code] = toRow({ subject_code, term, grade, credit, name });
  writeMap(map);
  return map[subject_code];
}

// Remove one; returns true if a row was actually there (so callers can 404-ish).
export function remove(subject_code) {
  const map = readMap();
  if (!(subject_code in map)) return false;
  delete map[subject_code];
  writeMap(map);
  return true;
}

// Wipe every recorded grade. Only the enrollments key — the plan, language and
// GPA-visibility preferences are settings, not data, and surviving a reset is
// the behaviour you want from them.
export function clearAll() {
  const n = Object.keys(readMap()).length;
  localStorage.removeItem(KEY);
  return n;
}

// Bulk upsert (transcript commit) — all or nothing isn't needed locally, but we
// write once at the end so a mid-loop failure can't leave a half-applied state.
export function upsertMany(rows) {
  const map = readMap();
  for (const r of rows) {
    map[r.subject_code] = toRow(r);
  }
  writeMap(map);
  return rows.length;
}

// --- Backup / restore (the "not online" safety net) ---------------------------
// Since data lives only in this browser, a student clearing site data loses it.
// These let them download a JSON backup and restore it here or on another device.

const BACKUP_VERSION = 1;

// Everything worth keeping, as a portable object (also grabs the plan toggle).
export function exportData() {
  return {
    app: 'camt-grade-calculator',
    version: BACKUP_VERSION,
    plan: localStorage.getItem('plan') || 'WIL',
    enrollments: allEnrollments(),
  };
}

// Restore from a parsed backup object. Only keeps rows for subjects/grades that
// still exist in the current catalog (a stale backup can't inject bad data).
// Returns the number of enrollments imported.
export function importData(data) {
  if (!data || data.app !== 'camt-grade-calculator' || !Array.isArray(data.enrollments)) {
    throw new Error('Not a valid CAMT Grade Calculator backup file.');
  }
  const map = {};
  for (const e of data.enrollments) {
    if (!e || !e.subject_code || !e.term || !e.grade) continue;
    if (!subjectMap.has(e.subject_code) || !gradeMap.has(e.grade)) continue;
    map[e.subject_code] = { subject_code: e.subject_code, term: e.term, grade: e.grade };
  }
  writeMap(map);
  if (data.plan === 'WIL' || data.plan === 'IS') localStorage.setItem('plan', data.plan);
  return Object.keys(map).length;
}
