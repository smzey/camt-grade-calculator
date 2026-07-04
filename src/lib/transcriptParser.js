// src/lib/transcriptParser.js
// Parse the text a student copy-pastes from the university grade portal into
// structured semesters. Pure functions — no DB, no I/O — so they're trivially
// testable and can't fail on anything but the text itself.
//
// The pasted text looks like (tab- or space-separated columns):
//
//   ภาคการศึกษา 1 / 2567
//   No  Course no  Course Title            Credit  Grade
//   1   001101     Fundamental English 1   3.00    A
//   ...
//   ภาคการศึกษา / Semester 1/2567
//   18.00  18.00  18.00  3.92  3.92          <- summary line, ignored
//
// Strategy: walk the lines top-to-bottom. A "semester header" line sets the
// current semester; a "course row" line (No, 6-digit code, title, credit, grade)
// gets attached to it. Everything else — column headers, Thai summary labels,
// the totals line — simply doesn't match either pattern and is skipped.

// Matches a semester header and captures (semester, buddhistYear). Handles both
// the Thai form "ภาคการศึกษา 1 / 2567" and the English "Semester 1/2567" (both
// appear in a single block; keying by year+sem dedupes them).
const HEADER_RE = /(?:ภาคการศึกษา|Semester)\s*(\d)\s*\/\s*(\d{4})/;

// Matches one course row. Anchored at both ends so summary/totals lines (which
// have no 6-digit code) can't match:
//   ^ <No> <6-digit code> <title...> <credit> <grade> $
// The credit+grade are pinned to the end, so the greedy title can't swallow them.
const COURSE_RE =
  /^\s*\d+\s+(\d{6})\s+.+\s+(\d+(?:\.\d+)?)\s+([A-D][+]?|F|S|U|V|W|X|I|P)\s*$/;

// Parse pasted text into ordered, de-duplicated semesters.
// Returns: [{ year, sem, label, courses: [{ code, grade, credit }] }]
function parseSemesters(text) {
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

// Map each semester's Buddhist academic year to a study year: the earliest year
// present is study-year 1, the next is 2, and so on. Then term = "studyYear/sem"
// (the app's format, e.g. "1/1"). This auto-solves the "which year is this?"
// problem for a normal continuous enrollment; a transfer student can override
// the term per row in the preview.
function assignTerms(semesters) {
  const years = [...new Set(semesters.map((s) => s.year))].sort((a, b) => a - b);
  const studyYearOf = new Map(years.map((y, i) => [y, i + 1]));
  return semesters.map((s) => ({
    ...s,
    studyYear: studyYearOf.get(s.year),
    term: `${studyYearOf.get(s.year)}/${s.sem}`,
  }));
}

// Convenience: parse + assign terms, and also flatten to one row per course
// (each carrying its resolved term) for easy matching downstream.
function parseTranscript(text) {
  const semesters = assignTerms(parseSemesters(text));
  const courses = [];
  for (const s of semesters) {
    for (const c of s.courses) {
      courses.push({ term: s.term, semesterLabel: s.label, ...c });
    }
  }
  return { semesters, courses };
}

module.exports = { parseTranscript, parseSemesters, assignTerms };
