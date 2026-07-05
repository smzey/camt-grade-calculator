// client/src/transcriptParser.js
// ESM copy of src/lib/transcriptParser.js — pure functions that turn the text a
// student pastes from the university grade portal into structured semesters.
// Now that the app is static this runs in the browser instead of on the server;
// the logic is identical (kept in sync with the backend copy / its tests).
//
// The pasted text looks like (tab- or space-separated columns):
//
//   ภาคการศึกษา 1 / 2567
//   No  Course no  Course Title            Credit  Grade
//   1   001101     Fundamental English 1   3.00    A
//   ...

// Matches a semester header, capturing (semester, buddhistYear). Handles both the
// Thai "ภาคการศึกษา 1 / 2567" and English "Semester 1/2567" forms.
const HEADER_RE = /(?:ภาคการศึกษา|Semester)\s*(\d)\s*\/\s*(\d{4})/;

// Matches one course row, anchored both ends so summary/total lines can't match:
//   ^ <No> <6-digit code> <title...> <credit> <grade> $
const COURSE_RE =
  /^\s*\d+\s+(\d{6})\s+.+\s+(\d+(?:\.\d+)?)\s+([A-D][+]?|F|S|U|V|W|X|I|P)\s*$/;

// Parse pasted text into ordered, de-duplicated semesters.
// Returns: [{ year, sem, label, courses: [{ code, grade, credit }] }]
export function parseSemesters(text) {
  const byKey = new Map(); // "year/sem" -> semester object (dedupe repeated headers)
  const order = []; // preserve first-seen order of semesters
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const header = rawLine.match(HEADER_RE);
    if (header) {
      const sem = Number(header[1]);
      const year = Number(header[2]);
      const key = `${year}/${sem}`;
      if (!byKey.has(key)) {
        const semester = { year, sem, label: `${sem}/${year}`, courses: [] };
        byKey.set(key, semester);
        order.push(semester);
      }
      current = byKey.get(key);
      continue;
    }

    const course = rawLine.match(COURSE_RE);
    if (course && current) {
      current.courses.push({
        code: course[1],
        credit: Number(course[2]),
        grade: course[3].toUpperCase(),
      });
    }
    // any other line (column headers, summary labels, totals) is ignored
  }

  return order;
}

// Map each semester's Buddhist academic year to a study year: earliest year = 1,
// next = 2, ... Then term = "studyYear/sem" (the app's format, e.g. "1/1").
export function assignTerms(semesters) {
  const years = [...new Set(semesters.map((s) => s.year))].sort((a, b) => a - b);
  const studyYearOf = new Map(years.map((y, i) => [y, i + 1]));
  return semesters.map((s) => ({
    ...s,
    studyYear: studyYearOf.get(s.year),
    term: `${studyYearOf.get(s.year)}/${s.sem}`,
  }));
}

// Convenience: parse + assign terms, and flatten to one row per course.
export function parseTranscript(text) {
  const semesters = assignTerms(parseSemesters(text));
  const courses = [];
  for (const s of semesters) {
    for (const c of s.courses) {
      courses.push({ term: s.term, semesterLabel: s.label, ...c });
    }
  }
  return { semesters, courses };
}
