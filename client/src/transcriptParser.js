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
// The title is captured so a course outside the catalog can still be shown by
// name instead of as a bare code. Greedy + anchored, so backtracking lands the
// split on the LAST credit-like token — titles ending in a digit ("Fundamental
// English 1") still parse correctly.
const COURSE_RE =
  /^\s*\d+\s+(\d{6})\s+(.+)\s+(\d+(?:\.\d+)?)\s+([A-D][+]?|F|S|U|V|W|X|I|P)\s*$/;

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
        name: course[2].trim(),
        credit: Number(course[3]),
        grade: course[4].toUpperCase(),
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

// --- Registration schedule (courses currently being studied) -----------------
// A different document from the transcript: the class-registration / exam
// schedule, which lists the courses you're ENROLLED in — so there are no grades
// on it, and the columns are tab-separated with no leading row number:
//
//   208262<TAB>Elementary Statistics…<TAB>001<TAB>000<TAB>3.00<TAB>0.00<TAB>TuF<TAB>0930-1100<TAB>I<TAB>…
//
// Rows imported from here get grade = null, which the engine counts as
// "in progress" rather than earned.

const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

// Tell the two documents apart. Header/footer markers are the strong signal,
// but they're only present if the student happened to select them — a paste of
// just the course rows has none. So fall back to the row SHAPE: a schedule row
// leads with a bare 6-digit code in its own tab-separated column, where a
// transcript row always leads with a row number ("1  001101  …").
const SCHEDULE_MARKER_RE = /ตารางเรียน|ตารางสอบ|COURSENO|Total\s*credit/i;
const SCHEDULE_ROW_RE = /^\d{6}\t/;

export function isScheduleDoc(text) {
  if (SCHEDULE_MARKER_RE.test(text)) return true;
  return text.split(/\r?\n/).some((line) => SCHEDULE_ROW_RE.test(line));
}

// The schedule doesn't state its own term, so infer one: the student id's first
// two digits give the admission year (Buddhist), and an exam date gives the
// current year + which semester (Jun–Nov = semester 1, otherwise 2).
export function inferScheduleTerm(text) {
  const idMatch = text.match(/นักศึกษา\s*(\d{2})\d{6,}/) || text.match(/\b(\d{2})\d{6,}\b/);
  const admitYear = idMatch ? 2500 + Number(idMatch[1]) : null;

  const dateMatch = text.match(/\b(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})\b/i);
  const examYear = dateMatch ? Number(dateMatch[3]) + 543 : null; // AD -> Buddhist
  const month = dateMatch ? MONTHS[dateMatch[2].toUpperCase()] : null;
  const sem = month == null || (month >= 6 && month <= 11) ? 1 : 2;

  let studyYear = 1;
  if (admitYear && examYear) studyYear = Math.min(8, Math.max(1, examYear - admitYear + 1));

  return { term: `${studyYear}/${sem}`, label: examYear ? `${sem}/${examYear}` : `${studyYear}/${sem}` };
}

// One row per course. A course's credit is split across two columns (lecture +
// lab, e.g. "2.00" + "1.00" = 3), so we sum the first two numeric cells. Rows
// that wrap onto extra lines (two meeting times) don't start with a course code,
// so they're skipped; de-duping by code guards the rest.
export function parseSchedule(text) {
  const { term, label } = inferScheduleTerm(text);
  const seen = new Set();
  const courses = [];
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split('\t').map((c) => c.trim());
    if (!/^\d{6}$/.test(cols[0])) continue;
    const code = cols[0];
    if (seen.has(code)) continue;
    const nums = cols.filter((c) => /^\d+\.\d{1,2}$/.test(c)).map(Number);
    const credit = nums.length ? Math.round((nums[0] || 0) + (nums[1] || 0)) : 0;
    seen.add(code);
    // Column 2 is the course title. Kept so a course the catalog doesn't know
    // can still be listed by name rather than as an anonymous free elective.
    courses.push({ term, semesterLabel: label, code, name: (cols[1] || '').trim(), credit, grade: null });
  }
  return courses;
}

// Convenience: parse + assign terms, and flatten to one row per course.
// Dispatches on which document was pasted.
export function parseTranscript(text) {
  if (isScheduleDoc(text)) return { semesters: [], courses: parseSchedule(text) };
  const semesters = assignTerms(parseSemesters(text));
  const courses = [];
  for (const s of semesters) {
    for (const c of s.courses) {
      courses.push({ term: s.term, semesterLabel: s.label, ...c });
    }
  }
  // Last resort: nothing looked like a transcript, so try reading it as a
  // schedule anyway. Better to recognise an odd paste than to report "no
  // courses found" on a document that plainly has some.
  if (courses.length === 0) {
    const schedule = parseSchedule(text);
    if (schedule.length > 0) return { semesters: [], courses: schedule };
  }
  return { semesters, courses };
}
