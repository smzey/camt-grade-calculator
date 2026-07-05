// scripts/verify-engine.mjs
// Runs the REAL client engine (the same modules the browser bundles) over a
// sample transcript, so we can confirm the SQL->JS port produces sane, consistent
// numbers without opening a browser. Node 24 imports the ESM modules + JSON
// directly.  Run:  node scripts/verify-engine.mjs

import { parseTranscript } from '../client/src/transcriptParser.js';
import { buildPreview, computeGpa, computeProgress } from '../client/src/engine.js';
import { classifyRow } from '../client/src/catalog.js';

const SAMPLE = `ภาคการศึกษา 1 / 2567
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001101\tFundamental English 1\t3.00\tA
2\t140104\tCitizenship\t3.00\tA
3\t953111\tSoftware for Everyday Life\t3.00\tA
4\t954100\tInformation System for Organization Management\t3.00\tB+
5\t954140\tInformation Technology Literacy\t3.00\tA
6\t954142\tFundamental Computer Programming for Modern Management\t3.00\tA
ภาคการศึกษา 2 / 2567
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001102\tFundamental English 2\t3.00\tA
2\t261112\tGame Appreciation\t3.00\tA
3\t954143\tData Management\t3.00\tA
4\t954170\tElementary Business Process Modeling\t3.00\tB
5\t954246\tAdvanced Computer Programming for Modern Management\t3.00\tA
6\t954248\tInformation and Communication Technology\t3.00\tA
ภาคการศึกษา 1 / 2568
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001229\tEnglish for Media Arts\t3.00\tB+
2\t208262\tElementary Statistics for Science and Technology\t3.00\tF
3\t951100\tModern Life and Animation\t3.00\tA
ภาคการศึกษา 2 / 2568
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001201\tCritical Reading and Effective Writing\t3.00\tB
2\t703103\tIntroduction to Entrepreneurship and Business\t3.00\tB`;

// 1) Preview (parse + match + cross-check GPA over every graded row).
const { courses } = parseTranscript(SAMPLE);
const preview = buildPreview(courses, classifyRow);
console.log('PREVIEW');
console.log('  parsed courses :', preview.summary.total);
console.log('  ok / skipped   :', preview.summary.ok, '/', preview.summary.skipped);
console.log('  cross-check GPA:', preview.computed.gpa, `(over ${preview.computed.credits} cr)`);
console.log('  skipped rows   :', preview.rows.filter((r) => r.status !== 'ok').map((r) => `${r.subject_code} (${r.status})`).join(', ') || 'none');

// 2) Commit the ok rows into a local-store-shaped array, then compute GPA + progress.
const committed = preview.rows
  .filter((r) => r.status === 'ok')
  .map((r) => ({ subject_code: r.subject_code, term: r.term, grade: r.grade }));

const gpa = computeGpa(committed);
console.log('\nGPA (committed', committed.length, 'rows)');
console.log('  actual   :', gpa.gpa_actual, `(${gpa.credits_actual} cr)`);
console.log('  projected:', gpa.gpa_projected, `(${gpa.credits_projected} cr)`);

console.log('\nPROGRESS (WIL) — top-level pillars');
const prog = computeProgress(committed, 'WIL');
for (const g of prog.filter((x) => x.parent_code == null)) {
  console.log(`  ${g.code} ${g.name}: ${g.earned}/${g.required}${g.met ? ' ✓' : ''}`);
}

// 3) A couple of hard assertions so this fails loudly if the port drifts.
import assert from 'node:assert/strict';
assert.equal(preview.summary.total, 17, 'should parse 17 courses');
assert.equal(preview.summary.skipped, 1, 'only 261112 (not in catalog) should skip');
assert.equal(preview.computed.gpa, 3.53, 'cross-check GPA should be 3.53 over 51 cr');
assert.equal(gpa.gpa_actual, 3.5, 'committed GPA should be 3.50 over 48 cr (drops the A for 261112)');
assert.equal(gpa.credits_actual, 48, 'committed GPA credits');
console.log('\n✅ all engine assertions passed');
