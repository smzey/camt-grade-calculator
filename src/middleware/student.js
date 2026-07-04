// src/middleware/student.js
// Identifies the "current student" from an anonymous browser cookie.
//
// We're not building logins. Instead, the first time a browser hits the API it
// gets a random, unguessable id which we store in a cookie. The browser then
// sends that cookie automatically on every later request, so the server always
// knows "which anonymous user is this" without any account. The grade data
// itself still lives in Postgres, keyed by this id — the cookie is just the key.
//
// This runs as middleware: a function with (req, res, next) that Express calls
// on every request before the route handlers. Calling next() passes control on;
// forgetting to call it would hang the request forever.

const crypto = require('crypto'); // Node built-in; no dependency needed

const COOKIE_NAME = 'student_id';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function attachStudent(req, res, next) {
  // req.cookies is populated by the cookie-parser middleware (registered before
  // this one in app.js). It's an object of the request's cookies.
  let id = req.cookies[COOKIE_NAME];

  if (!id) {
    // No cookie yet -> brand-new visitor. Mint a random id. randomUUID() is
    // cryptographically strong, so ids can't be guessed to read someone else's
    // data. The 'u_' prefix is just to make ids recognizable in the DB.
    id = 'u_' + crypto.randomUUID();

    // res.cookie(name, value, options) queues a Set-Cookie response header.
    res.cookie(COOKIE_NAME, id, {
      httpOnly: true, // JS in the browser can't read it -> safer against XSS
      sameSite: 'lax', // don't send on cross-site requests -> basic CSRF hardening
      secure: process.env.NODE_ENV === 'production', // HTTPS-only once deployed
      maxAge: ONE_YEAR_MS, // persist ~1 year instead of dying when the tab closes
    });
  }

  // Hand the id to downstream route handlers via a custom request property.
  req.studentId = id;
  next();
}

module.exports = attachStudent;
