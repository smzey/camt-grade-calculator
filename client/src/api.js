// client/src/api.js
// Thin wrappers around the backend endpoints. Every call goes to /api/... which
// Vite proxies to the Express server in dev, and Express serves directly in prod.
//
// credentials: 'include' makes the browser send/receive the student_id cookie.
// (Same-origin it would anyway, but being explicit keeps it correct if the
// origins ever diverge.)

const BASE = '/api';

// Shared response handler: throw a useful Error on non-2xx so callers can catch.
async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.error || (body.errors && body.errors.join(', ')) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  // DELETE/empty bodies: guard against no JSON.
  return res.status === 204 ? null : res.json();
}

const get = (path) => fetch(BASE + path, { credentials: 'include' }).then(handle);

const send = (method, path, body) =>
  fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(handle);

export const api = {
  session: () => get('/session'),
  groups: () => get('/groups'),
  subjects: () => get('/subjects'),
  grades: () => get('/grades'),
  enrollments: () => get('/enrollments'),
  gpa: () => get('/gpa'),
  progress: (plan) => get(`/progress?plan=${encodeURIComponent(plan)}`),
  saveEnrollment: (payload) => send('POST', '/enrollments', payload),
  deleteEnrollment: (subjectCode) =>
    send('DELETE', `/enrollments/${encodeURIComponent(subjectCode)}`),
};
