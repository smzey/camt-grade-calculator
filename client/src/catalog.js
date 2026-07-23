// client/src/catalog.js
// The curriculum catalog, now bundled into the app instead of fetched from a DB.
// catalog.json is a build-time snapshot of the groups/subjects/grades tables
// (regenerate with `node scripts/dump-catalog.js`). Here we load it once and
// build lookup maps + the shared validation rule the rest of the app uses.

import data from './data/catalog.json' with { type: 'json' };

export const groups = data.groups; // [{ code, name, parent_code, req_wil, req_is }]
export const subjects = data.subjects; // [{ code, name, is_title, credit, group_code, grade_type, plan }]
export const grades = data.grades; // [{ grade, point, type, is_cal, is_keep, is_planning }]

// code -> subject / grade -> grade, so classification is O(1) instead of scanning.
export const subjectMap = new Map(subjects.map((s) => [s.code, s]));
export const gradeMap = new Map(grades.map((g) => [g.grade, g]));

// Anything the catalog doesn't know about still counts toward the degree as a
// Free Elective, so credits land in that top-level group rather than vanishing.
export const FREE_ELECTIVE_GROUP = 9000;

// Classify one { subject_code, grade } row against the catalog. This is the exact
// rule the old server enforced (POST /enrollments + import validation), moved
// verbatim to the client: subject exists, isn't a title/header row, grade exists,
// and the grade's type fits the subject's grade_type.
//
// Two statuses are NOT errors, they're states a row can legitimately be in:
//   in_progress   — a course with no grade yet (imported from a registration
//                   schedule). Counts as credits underway, not credits earned.
//   free_elective — a graded course outside the catalog; counts under group 9000.
export function classifyRow({ subject_code, grade }) {
  const s = subjectMap.get(subject_code);
  const noGrade = grade == null || grade === '';
  if (!s) {
    if (noGrade) {
      return { status: 'in_progress', message: `${subject_code} — currently studying (Free Elective)` };
    }
    return gradeMap.has(grade)
      ? { status: 'free_elective', message: `${subject_code} counts as a Free Elective` }
      : { status: 'unmatched_subject', message: `Course ${subject_code} is not in the curriculum catalog` };
  }
  if (s.is_title) {
    return { status: 'title_row', message: `${subject_code} is a section header, not a course` };
  }
  if (noGrade) {
    return { status: 'in_progress', message: `${subject_code} — currently studying` };
  }
  const g = gradeMap.get(grade);
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
