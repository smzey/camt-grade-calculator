// client/src/api.js
// Same interface the components already use — but there is no backend anymore.
// Every call is answered locally: catalog from the bundled JSON, calculations
// from ./engine, and the student's grades from ./store (localStorage). Keeping
// the method names/shapes identical meant App.jsx and TranscriptImport.jsx didn't
// have to change when we dropped the server.
//
// The methods stay `async` so callers' `await`/try-catch keep working unchanged;
// they just resolve instantly instead of doing a round-trip.

import * as catalog from './catalog';
import * as store from './store';
import { computeGpa, computeProgress, buildPreview, IMPORTABLE } from './engine';
import { parseTranscript } from './transcriptParser';

export const api = {
  // Used to exist to establish the cookie before parallel loads; now a no-op.
  session: async () => ({ student_id: 'local' }),

  // --- Catalog (was GET /groups, /subjects, /grades) ---
  groups: async () => catalog.groups,
  subjects: async () => catalog.subjects,
  grades: async () => catalog.grades,

  // --- Student data (was the cookie-scoped enrollment/GPA/progress endpoints) ---
  enrollments: async () => ({ enrollments: store.listEnrollments() }),
  gpa: async () => computeGpa(store.allEnrollments()),
  progress: async (plan) => {
    const p = (plan || 'WIL').toUpperCase();
    if (p !== 'WIL' && p !== 'IS') throw new Error("plan must be 'WIL' or 'IS'");
    return { plan: p, groups: computeProgress(store.allEnrollments(), p) };
  },

  // Record/replace one grade. Validate with the same rule the server used, so an
  // invalid combination surfaces the same error message in the UI banner.
  // credit/name are only meaningful for a course the catalog doesn't know: they
  // came from the pasted document and live on the row. They MUST be passed back
  // on every save, or changing the grade of a free elective silently erases its
  // title and credit.
  saveEnrollment: async ({ subject_code, term, grade, credit, name }) => {
    if (!subject_code || !term || !grade) throw new Error('subject_code, term and grade are required');
    const { status, message } = catalog.classifyRow({ subject_code, grade });
    if (!IMPORTABLE.has(status)) throw new Error(message);
    return store.upsert({ subject_code, term, grade, credit, name });
  },

  deleteEnrollment: async (subjectCode) => ({ deleted: store.remove(subjectCode) }),

  // --- Transcript import (was POST /import/preview + /commit) ---
  previewTranscript: async (text) => {
    if (!text || !text.trim()) throw new Error('Paste your transcript text first.');
    const { courses } = parseTranscript(text);
    if (courses.length === 0) {
      throw new Error(
        'No course rows found. Make sure you pasted the transcript table (the rows with course numbers and grades).'
      );
    }
    return buildPreview(courses, catalog.classifyRow);
  },

  commitImport: async (enrollments) => {
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      throw new Error('Nothing to import.');
    }
    // Re-validate every row (the UI only sends importable rows, but never trust
    // that). Grade may legitimately be absent — that's an in-progress course.
    for (const e of enrollments) {
      if (!e || !e.subject_code || !e.term) throw new Error('A row is missing subject/term.');
      const { status, message } = catalog.classifyRow(e);
      if (!IMPORTABLE.has(status)) throw new Error(message);
    }
    return { imported: store.upsertMany(enrollments) };
  },

  // --- Backup / restore (new; only possible because data is local) ---
  exportData: () => store.exportData(),
  importData: (data) => store.importData(data),

  // Delete every recorded grade. Irreversible — there's no server copy.
  resetData: () => ({ cleared: store.clearAll() }),
};
