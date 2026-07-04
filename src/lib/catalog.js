// src/lib/catalog.js
// Load the catalog once and classify parsed transcript rows against it. Shared by
// the import preview (flag issues for the user) and the commit (reject bad rows).

// Load subjects + grades into lookup maps in one shot (two small queries) so we
// can classify N rows in memory instead of N round-trips.
async function loadCatalog(db) {
  const [subs, grs] = await Promise.all([
    db.query('SELECT code, name, is_title, grade_type, credit FROM subjects'),
    db.query('SELECT grade, type, point, is_cal, is_keep, is_planning FROM grades'),
  ]);
  return {
    subjects: new Map(subs.rows.map((r) => [r.code, r])),
    grades: new Map(grs.rows.map((r) => [r.grade, r])),
  };
}

// Classify one { subject_code, grade } row. Returns { status, message } where
// status 'ok' means it's safe to record. Mirrors the single-POST validation
// rules (subject exists, not a title row, grade exists, grade_type fits).
function classifyRow({ subject_code, grade }, catalog) {
  const s = catalog.subjects.get(subject_code);
  if (!s) {
    return { status: 'unmatched_subject', message: `Course ${subject_code} is not in the curriculum catalog` };
  }
  if (s.is_title) {
    return { status: 'title_row', message: `${subject_code} is a section header, not a course` };
  }
  const g = catalog.grades.get(grade);
  if (!g) {
    return { status: 'unknown_grade', message: `Grade "${grade}" is not recognized` };
  }
  if (s.grade_type && g.type && s.grade_type !== g.type) {
    return {
      status: 'grade_type_mismatch',
      message: `Grade ${grade} (${g.type}) is not valid for ${subject_code} (accepts ${s.grade_type})`,
    };
  }
  return { status: 'ok' };
}

module.exports = { loadCatalog, classifyRow };
