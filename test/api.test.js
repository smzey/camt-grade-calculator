// test/api.test.js
// Integration tests for the whole API, run with `npm test` (node --test).
//
// These are INTEGRATION tests: they exercise the real Express app against the
// real seeded Postgres database — no mocks. supertest sends fake HTTP requests
// straight to the app object (imported from app.js) without opening a port.
//
// To avoid clobbering real data, every test acts as a student whose id starts
// with 'test-' (sent via the Cookie header), and we delete all 'test-%' rows
// before and after the run.

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const db = require('../src/db');

// Helpers: issue a request "as" a given student by presenting their cookie.
const asStudent = (id) => `student_id=${id}`;
const cleanTestData = () =>
  db.query("DELETE FROM enrollments WHERE student_id LIKE 'test-%'");

before(cleanTestData);
after(async () => {
  await cleanTestData();
  await db.pool.end(); // close DB connections so the test process can exit
});

describe('GET /health', () => {
  it('reports ok and db connected', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok', db: 'connected' });
  });
});

describe('catalog endpoints', () => {
  it('GET /groups returns all 19 groups', async () => {
    const res = await request(app).get('/api/groups');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 19);
  });

  it('GET /subjects returns all 142 subjects', async () => {
    const res = await request(app).get('/api/subjects');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 142);
  });

  it('GET /subjects?group=1111 filters to that group', async () => {
    const res = await request(app).get('/api/subjects?group=1111');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 3); // 2 real courses + 1 title row
    assert.ok(res.body.every((s) => s.group_code === 1111));
  });

  it('GET /grades returns the grade table with numeric points', async () => {
    const res = await request(app).get('/api/grades');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 23);
    const a = res.body.find((g) => g.grade === 'A');
    assert.equal(a.point, 4); // number, not the string "4"
  });
});

describe('session + SPA fallback', () => {
  it('GET /api/session returns and sets an anonymous student id', async () => {
    const res = await request(app).get('/api/session');
    assert.equal(res.status, 200);
    assert.match(res.body.student_id, /^u_/);
    assert.match(res.headers['set-cookie'].join(';'), /student_id=u_/);
  });

  it('unknown /api path returns a JSON 404, not the SPA', async () => {
    const res = await request(app).get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });
});

describe('cookie identity', () => {
  it('mints and sets a student_id cookie for a new visitor', async () => {
    const res = await request(app).get('/api/gpa'); // no Cookie sent
    const setCookie = res.headers['set-cookie'];
    assert.ok(setCookie, 'expected a Set-Cookie header');
    const header = setCookie.join(';');
    assert.match(header, /student_id=u_/); // minted id has the u_ prefix
    assert.match(header, /HttpOnly/i); // not readable by browser JS
  });

  it('does NOT re-set the cookie when one is already present', async () => {
    const res = await request(app).get('/api/gpa').set('Cookie', asStudent('test-existing'));
    assert.equal(res.headers['set-cookie'], undefined);
  });
});

describe('POST /enrollments — validation', () => {
  it('400s when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: '001101' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.includes('term is required'));
    assert.ok(res.body.errors.includes('grade is required'));
  });

  it("400s for a grade that doesn't exist", async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: '001101', term: '1/1', grade: 'Z' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /grade 'Z' does not exist/);
  });

  it("400s for a subject that doesn't exist", async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: 'NOPE', term: '1/1', grade: 'A' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /subject 'NOPE' does not exist/);
  });

  it('400s for an SU grade on an AF-only subject (grade_type mismatch)', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: '001202', term: '1/1', grade: 'S' }); // 001202 is AF
    assert.equal(res.status, 400);
    assert.match(res.body.error, /not valid for subject/);
  });

  it('400s for an AF grade on an SU-only subject', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: '954381', term: '1/1', grade: 'A' }); // 954381 is SU
    assert.equal(res.status, 400);
    assert.match(res.body.error, /not valid for subject/);
  });

  it('400s when enrolling in a title/section-header row', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: 'GE', term: '1/1', grade: 'A' }); // GE is is_title
    assert.equal(res.status, 400);
    assert.match(res.body.error, /section header/);
  });

  it('ALLOWS an SU grade on the matching SU subject', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: '954381', term: '1/1', grade: 'S' });
    assert.equal(res.status, 200);
    assert.equal(res.body.grade, 'S');
  });

  it('ALLOWS a type-less grade (W) on any subject — e.g. a withdrawal', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-val'))
      .send({ subject_code: '001202', term: '1/1', grade: 'W' }); // W has NULL type
    assert.equal(res.status, 200);
    assert.equal(res.body.grade, 'W');
  });
});

describe('POST /enrollments — upsert', () => {
  beforeEach(() => db.query("DELETE FROM enrollments WHERE student_id = 'test-upsert'"));

  it('updates the same row instead of duplicating on re-POST', async () => {
    const first = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-upsert'))
      .send({ subject_code: '001101', term: '1/1', grade: 'A' });
    assert.equal(first.status, 200);
    assert.equal(first.body.grade, 'A');

    const second = await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-upsert'))
      .send({ subject_code: '001101', term: '2/1', grade: 'B+' });
    assert.equal(second.status, 200);
    assert.equal(second.body.id, first.body.id); // SAME row id -> updated, not inserted
    assert.equal(second.body.grade, 'B+');
    assert.equal(second.body.term, '2/1');
  });
});

describe('GET /gpa', () => {
  before(async () => {
    await db.query("DELETE FROM enrollments WHERE student_id = 'test-gpa'");
    // A(4)*3cr, F(0)*3cr recorded; xA(4)*3cr planned.
    const post = (body) =>
      request(app).post('/api/enrollments').set('Cookie', asStudent('test-gpa')).send(body);
    await post({ subject_code: '001101', term: '1/1', grade: 'A' });
    await post({ subject_code: '001201', term: '1/1', grade: 'F' });
    await post({ subject_code: '001202', term: '1/2', grade: 'xA' });
  });

  it('separates actual (recorded) from projected (incl. planning) GPA', async () => {
    const res = await request(app).get('/api/gpa').set('Cookie', asStudent('test-gpa'));
    assert.equal(res.status, 200);
    // actual = (4*3 + 0*3) / 6 = 2.00 over 6 credits (F counts, xA excluded)
    assert.equal(res.body.gpa_actual, 2);
    assert.equal(res.body.credits_actual, 6);
    // projected = (12 + 0 + 12) / 9 = 2.67 over 9 credits
    assert.equal(res.body.gpa_projected, 2.67);
    assert.equal(res.body.credits_projected, 9);
  });

  it('returns null GPA for a student with no grades', async () => {
    const res = await request(app).get('/api/gpa').set('Cookie', asStudent('test-empty'));
    assert.equal(res.status, 200);
    assert.equal(res.body.gpa_actual, null);
    assert.equal(res.body.credits_actual, 0);
  });
});

describe('GET /progress', () => {
  before(async () => {
    await db.query("DELETE FROM enrollments WHERE student_id = 'test-prog'");
    const post = (body) =>
      request(app).post('/api/enrollments').set('Cookie', asStudent('test-prog')).send(body);
    await post({ subject_code: '001202', term: '1/1', grade: 'A' }); // group 1111, kept
    await post({ subject_code: '204100', term: '1/1', grade: 'A' }); // group 1112, kept
    await post({ subject_code: '954381', term: '1/1', grade: 'S' }); // group 2210, kept (SU)
    await post({ subject_code: '011151', term: '1/1', grade: 'F' }); // group 1120, NOT kept
  });

  const groupBy = (groups, code) => groups.find((g) => g.code === code);

  it('rolls earned credits up the group subtree (WIL plan)', async () => {
    const res = await request(app)
      .get('/api/progress?plan=WIL')
      .set('Cookie', asStudent('test-prog'));
    assert.equal(res.status, 200);
    const g = res.body.groups;
    assert.equal(groupBy(g, 1111).earned, 3); // direct
    assert.equal(groupBy(g, 1110).earned, 6); // 1111 (3) + 1112 (3) rolled up
    assert.equal(groupBy(g, 1120).earned, 0); // F did not count (is_keep = false)
    assert.equal(groupBy(g, 2210).earned, 3); // the S counts toward progress
    assert.equal(groupBy(g, 1111).met, true); // 3 >= required 3
  });

  it('swaps the requirement column based on plan', async () => {
    const wil = await request(app).get('/api/progress?plan=WIL').set('Cookie', asStudent('test-prog'));
    const is = await request(app).get('/api/progress?plan=IS').set('Cookie', asStudent('test-prog'));
    const wil2210 = wil.body.groups.find((g) => g.code === 2210).required;
    const is2210 = is.body.groups.find((g) => g.code === 2210).required;
    assert.equal(wil2210, 39);
    assert.equal(is2210, 33);
  });

  it('400s on an invalid plan', async () => {
    const res = await request(app)
      .get('/api/progress?plan=BOGUS')
      .set('Cookie', asStudent('test-prog'));
    assert.equal(res.status, 400);
  });
});

describe('GET /enrollments', () => {
  before(async () => {
    await db.query("DELETE FROM enrollments WHERE student_id = 'test-list'");
    const post = (body) =>
      request(app).post('/api/enrollments').set('Cookie', asStudent('test-list')).send(body);
    // Insert out of order, and mix a single-digit and double-digit year so the
    // numeric-term sort is actually exercised.
    await post({ subject_code: '001101', term: '10/1', grade: 'A' });
    await post({ subject_code: '001102', term: '2/1', grade: 'B+' });
    await post({ subject_code: '001201', term: '1/1', grade: 'A' });
  });

  it("returns the student's grades joined with subject + grade info", async () => {
    const res = await request(app).get('/api/enrollments').set('Cookie', asStudent('test-list'));
    assert.equal(res.status, 200);
    assert.equal(res.body.enrollments.length, 3);
    const first = res.body.enrollments[0];
    // joined fields present
    assert.ok(first.subject_name);
    assert.equal(typeof first.credit, 'number');
    assert.equal(typeof first.point, 'number'); // NUMERIC converted from string
  });

  it('orders terms numerically (1/1, 2/1, 10/1) not lexically', async () => {
    const res = await request(app).get('/api/enrollments').set('Cookie', asStudent('test-list'));
    const terms = res.body.enrollments.map((e) => e.term);
    assert.deepEqual(terms, ['1/1', '2/1', '10/1']);
  });

  it('returns an empty list for a student with no grades', async () => {
    const res = await request(app).get('/api/enrollments').set('Cookie', asStudent('test-none'));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.enrollments, []);
  });
});

describe('DELETE /enrollments/:subject_code', () => {
  beforeEach(async () => {
    await db.query("DELETE FROM enrollments WHERE student_id IN ('test-del', 'test-del2')");
    await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-del'))
      .send({ subject_code: '001101', term: '1/1', grade: 'A' });
  });

  it('removes an existing grade and echoes the deleted row', async () => {
    const del = await request(app)
      .delete('/api/enrollments/001101')
      .set('Cookie', asStudent('test-del'));
    assert.equal(del.status, 200);
    assert.equal(del.body.deleted.subject_code, '001101');

    // confirm it's actually gone
    const list = await request(app).get('/api/enrollments').set('Cookie', asStudent('test-del'));
    assert.equal(list.body.enrollments.length, 0);
  });

  it('404s when the student has no grade for that subject', async () => {
    const res = await request(app)
      .delete('/api/enrollments/999999')
      .set('Cookie', asStudent('test-del'));
    assert.equal(res.status, 404);
  });

  it("cannot delete another student's grade", async () => {
    // test-del2 tries to delete 001101, which belongs to test-del
    const res = await request(app)
      .delete('/api/enrollments/001101')
      .set('Cookie', asStudent('test-del2'));
    assert.equal(res.status, 404); // not found *for this student*

    // test-del's row is untouched
    const list = await request(app).get('/api/enrollments').set('Cookie', asStudent('test-del'));
    assert.equal(list.body.enrollments.length, 1);
  });
});

describe('data isolation between cookies', () => {
  it("one student's grades do not appear in another's GPA", async () => {
    await request(app)
      .post('/api/enrollments')
      .set('Cookie', asStudent('test-iso-a'))
      .send({ subject_code: '001101', term: '1/1', grade: 'A' });

    const other = await request(app).get('/api/gpa').set('Cookie', asStudent('test-iso-b'));
    assert.equal(other.body.gpa_actual, null);
    assert.equal(other.body.credits_actual, 0);
  });
});
