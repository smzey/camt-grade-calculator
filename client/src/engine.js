// client/src/engine.js
// The calculations that used to run in Postgres, reimplemented in the browser.
// Each function takes the student's enrollments (plain array of { subject_code,
// term, grade }) and reads the bundled catalog. Kept faithful to the original SQL
// so results are identical — the tests in test/ still describe the same numbers.

import { groups, subjectMap, gradeMap, FREE_ELECTIVE_GROUP } from './catalog';

const round2 = (x) => Math.round(x * 100) / 100;

// Credit for a row the catalog doesn't know (a free elective). The importer
// carries the credit from the pasted document on the row itself, since there's
// no subject to look it up from.
const rowCredit = (e) => {
  const c = Number(e.credit);
  return Number.isFinite(c) && c > 0 ? c : 0;
};

// GPA — credit-weighted mean over grades that count toward the average
// (grades.is_cal). Mirrors src/routes/gpa.js: we report BOTH the actual GPA
// (recorded grades only, is_planning = false) and the projected GPA (including
// the what-if planning x-grades). Denominator includes every is_cal credit even
// if its point is null, exactly like SUM(credit) / SUM(point*credit) in SQL.
export function computeGpa(enrollments) {
  let numA = 0, denA = 0, numP = 0, denP = 0;
  for (const e of enrollments) {
    const s = subjectMap.get(e.subject_code);
    const g = gradeMap.get(e.grade);
    // No grade (in progress) => no entry in gradeMap => skipped, so courses
    // currently being studied move neither GPA.
    if (!g || !g.is_cal) continue;
    const credit = s ? s.credit : rowCredit(e);
    if (credit <= 0) continue;
    denP += credit;
    if (g.point != null) numP += g.point * credit;
    if (!g.is_planning) {
      denA += credit;
      if (g.point != null) numA += g.point * credit;
    }
  }
  return {
    gpa_actual: denA > 0 ? round2(numA / denA) : null,
    credits_actual: denA,
    gpa_projected: denP > 0 ? round2(numP / denP) : null,
    credits_projected: denP,
  };
}

// Category progress — for every group, how many credits the student has PASSED
// (grades.is_keep) within that group OR any group beneath it, vs what the plan
// requires. Mirrors src/routes/progress.js: the recursive CTE's subtree rollup
// becomes a DFS over the (tiny, ~19-node) group tree.
export function computeProgress(enrollments, plan) {
  // Two buckets, same shape: credits already PASSED, and credits currently being
  // studied (a row with no grade yet). They're kept apart all the way to the UI —
  // in-progress credits must never make a requirement look met.
  const earnedByGroup = new Map();
  const inProgressByGroup = new Map();
  const add = (map, code, credit) => map.set(code, (map.get(code) || 0) + credit);

  for (const e of enrollments) {
    const s = subjectMap.get(e.subject_code);

    // No grade yet => in progress. Unknown subjects land in Free Electives.
    if (e.grade == null || e.grade === '') {
      if (s) {
        if (s.is_title || !(s.plan == null || s.plan === plan)) continue;
        add(inProgressByGroup, s.group_code, s.credit);
      } else {
        const c = rowCredit(e);
        if (c > 0) add(inProgressByGroup, FREE_ELECTIVE_GROUP, c);
      }
      continue;
    }

    // is_keep = earned credit (A–D, S, X; not F/U/W).
    const g = gradeMap.get(e.grade);
    if (!g || !g.is_keep) continue;
    if (!s) {
      const c = rowCredit(e);
      if (c > 0) add(earnedByGroup, FREE_ELECTIVE_GROUP, c);
      continue;
    }
    if (s.is_title) continue;
    if (!(s.plan == null || s.plan === plan)) continue;
    add(earnedByGroup, s.group_code, s.credit);
  }

  // Adjacency: parent code -> child group codes, for the subtree walk.
  const children = new Map();
  for (const g of groups) {
    if (g.parent_code == null) continue;
    if (!children.has(g.parent_code)) children.set(g.parent_code, []);
    children.get(g.parent_code).push(g.code);
  }
  // Sum a group's own credits plus all of its descendants', for either bucket.
  const subtree = (map, code) => {
    let total = map.get(code) || 0;
    for (const child of children.get(code) || []) total += subtree(map, child);
    return total;
  };

  // groups is already ordered by code (parent-first), same as the API returned.
  return groups.map((gr) => {
    const required = plan === 'IS' ? gr.req_is : gr.req_wil;
    const earned = subtree(earnedByGroup, gr.code);
    return {
      code: gr.code,
      name: gr.name,
      parent_code: gr.parent_code,
      required,
      earned,
      inProgress: subtree(inProgressByGroup, gr.code),
      // Deliberately earned-only: enrolling in a course doesn't satisfy anything.
      met: earned >= required,
      remaining: Math.max(0, required - earned),
    };
  });
}

// Statuses that are still worth importing. 'ok' is a clean catalog match;
// 'free_elective' and 'in_progress' are valid states, not rejections (see
// classifyRow). Everything else — title rows, bad grades — gets skipped.
export const IMPORTABLE = new Set(['ok', 'free_elective', 'in_progress']);

// Import preview — parsed courses + catalog match + validation status, plus a
// credit-weighted GPA over EVERY parsed row with a GPA-counting grade (even ones
// not in our catalog) so the student can check it against the GPAX on their
// transcript. Mirrors buildPreview() in src/routes/import.js.
export function buildPreview(courses, classifyRow) {
  const rows = courses.map((c) => {
    const { status, message } = classifyRow({ subject_code: c.code, grade: c.grade });
    const subject = subjectMap.get(c.code);
    return {
      term: c.term,
      subject_code: c.code,
      // Catalog name wins; otherwise the title from the pasted document, so an
      // off-catalog course keeps its real name instead of showing as a code.
      subject_name: subject ? subject.name : c.name || null,
      credit: subject && subject.credit != null ? subject.credit : c.credit,
      grade: c.grade,
      status,
      message: status === 'ok' ? null : message,
    };
  });

  let num = 0, den = 0;
  for (const r of rows) {
    const g = gradeMap.get(r.grade);
    if (g && g.is_cal && !g.is_planning && g.point != null) {
      num += g.point * r.credit;
      den += r.credit;
    }
  }
  const gpa = den > 0 ? round2(num / den) : null;

  const okCount = rows.filter((r) => IMPORTABLE.has(r.status)).length;
  return {
    rows,
    summary: { total: rows.length, ok: okCount, skipped: rows.length - okCount },
    computed: { gpa, credits: den },
  };
}
