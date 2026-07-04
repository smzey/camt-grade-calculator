// test/transcriptParser.test.js
// Parser unit tests over a real pasted transcript (no DB needed).

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseTranscript } = require('../src/lib/transcriptParser');

// A trimmed but faithful copy of a real portal paste: 4 semesters, tab-separated,
// including the Thai headers, the English "Semester x/yyyy" line, and the summary
// blocks that must be ignored. One course (208262) has an F.
const SAMPLE = `ภาคการศึกษา 1 / 2567
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001101\tFundamental English 1\t3.00\tA
2\t140104\tCitizenship\t3.00\tA
3\t953111\tSoftware for Everyday Life\t3.00\tA
4\t954100\tInformation System for Organization Management\t3.00\tB+
5\t954140\tInformation Technology Literacy\t3.00\tA
6\t954142\tFundamental Computer Programming for Modern Management\t3.00\tA
ผลการศึกษา
ภาคการศึกษา / Semester 1/2567
18.00\t18.00\t18.00\t3.92\t3.92
ภาคการศึกษา 2 / 2567
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001102\tFundamental English 2\t3.00\tA
2\t261112\tGame Appreciation\t3.00\tA
3\t954143\tData Management\t3.00\tA
4\t954170\tElementary Business Process Modeling\t3.00\tB
5\t954246\tAdvanced Computer Programming for Modern Management\t3.00\tA
6\t954248\tInformation and Communication Technology\t3.00\tA
ภาคการศึกษา / Semester 2/2567
18.00\t18.00\t18.00\t3.83\t3.88
ภาคการศึกษา 1 / 2568
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001229\tEnglish for Media Arts\t3.00\tB+
2\t208262\tElementary Statistics for Science and Technology\t3.00\tF
3\t951100\tModern Life and Animation\t3.00\tA
ภาคการศึกษา / Semester 1/2568
9.00\t9.00\t6.00\t2.66\t3.50
ภาคการศึกษา 2 / 2568
No\tCourse no\tCourse Title\tCredit\tGrade
1\t001201\tCritical Reading and Effective Writing\t3.00\tB
2\t703103\tIntroduction to Entrepreneurship and Business\t3.00\tB
ภาคการศึกษา / Semester 2/2568
6.00\t6.00\t6.00\t3.00\t3.40`;

describe('parseTranscript', () => {
  const { semesters, courses } = parseTranscript(SAMPLE);

  it('finds all four semesters, de-duplicating the repeated header', () => {
    assert.equal(semesters.length, 4);
    assert.deepEqual(
      semesters.map((s) => s.label),
      ['1/2567', '2/2567', '1/2568', '2/2568']
    );
  });

  it('parses every course row and ignores summary/totals lines', () => {
    // 6 + 6 + 3 + 2 = 17 courses; zero summary/label lines leak in.
    assert.equal(courses.length, 17);
    assert.ok(courses.every((c) => /^\d{6}$/.test(c.code)));
  });

  it('infers study-year terms from the Buddhist years (2567->yr1, 2568->yr2)', () => {
    const bySem = Object.fromEntries(semesters.map((s) => [s.label, s.term]));
    assert.equal(bySem['1/2567'], '1/1');
    assert.equal(bySem['2/2567'], '1/2');
    assert.equal(bySem['1/2568'], '2/1');
    assert.equal(bySem['2/2568'], '2/2');
  });

  it('captures grades correctly, including the F and +-grades', () => {
    const find = (code) => courses.find((c) => c.code === code);
    assert.equal(find('001101').grade, 'A');
    assert.equal(find('954100').grade, 'B+');
    assert.equal(find('208262').grade, 'F');
    assert.equal(find('208262').term, '2/1'); // 1/2568 -> study year 2, sem 1
  });

  it('returns empty (not a crash) for junk input', () => {
    assert.deepEqual(parseTranscript('hello world\n\nnothing here').courses, []);
  });
});
