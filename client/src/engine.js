// client/src/engine.js
// The calculations that used to run in Postgres, reimplemented in the browser.
// Each function takes the student's enrollments (plain array of { subject_code,
// term, grade }) and reads the bundled catalog. Kept faithful to the original SQL
// so results are identical — the tests in test/ still describe the same numbers.

import { groups, subjectMap, gradeMap } from './catalog';

const round2 = (x) => Math.round(x * 100) / 100;

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
    if (!s || !g || !g.is_cal) continue;
    denP += s.credit;
    if (g.point != null) numP += g.point * s.credit;
    if (!g.is_planning) {
      denA += s.credit;
      if (g.point != null) numA += g.point * s.credit;
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
  // Credits passed, bucketed by the subject's OWN group. is_keep = earned credit
  // (A–D, S, X; not F/U/W); skip title/header rows; respect plan-specific subjects.
  const earnedByGroup = new Map();
  for (const e of enrollments) {
    const s = subjectMap.get(e.subject_code);
    if (!s || s.is_title) continue;
    const g = gradeMap.get(e.grade);
    if (!g || !g.is_keep) continue;
    if (!(s.plan == null || s.plan === plan)) continue;
    earnedByGroup.set(s.group_code, (earnedByGroup.get(s.group_code) || 0) + s.credit);
  }

  // Adjacency: parent code -> child group codes, for the subtree walk.
  const children = new Map();
  for (const g of groups) {
    if (g.parent_code == null) continue;
    if (!children.has(g.parent_code)) children.set(g.parent_code, []);
    children.get(g.parent_code).push(g.code);
  }
  // Sum a group's own earned credits plus all of its descendants'.
  const subtreeEarned = (code) => {
    let total = earnedByGroup.get(code) || 0;
    for (const child of children.get(code) || []) total += subtreeEarned(child);
    return total;
  };

  // groups is already ordered by code (parent-first), same as the API returned.
  return groups.map((gr) => {
    const required = plan === 'IS' ? gr.req_is : gr.req_wil;
    const earned = subtreeEarned(gr.code);
    return {
      code: gr.code,
      name: gr.name,
      parent_code: gr.parent_code,
      required,
      earned,
      met: earned >= required,
      remaining: Math.max(0, required - earned),
    };
  });
}

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
      subject_name: subject ? subject.name : null,
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

  const okCount = rows.filter((r) => r.status === 'ok').length;
  return {
    rows,
    summary: { total: rows.length, ok: okCount, skipped: rows.length - okCount },
    computed: { gpa, credits: den },
  };
}
