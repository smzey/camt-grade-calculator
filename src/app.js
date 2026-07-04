// src/app.js
// Builds and EXPORTS the configured Express app — but does NOT start listening.
//
// Why split this from server.js? So tests can import the fully-wired app and
// make fake requests against it (via supertest) without opening a real network
// port. server.js is now just the thin bit that calls app.listen().

require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./db');
const attachStudent = require('./middleware/student');

const catalogRoutes = require('./routes/catalog'); // GET /groups, /subjects
const enrollmentRoutes = require('./routes/enrollments'); // POST /enrollments
const gpaRoutes = require('./routes/gpa'); // GET /gpa
const progressRoutes = require('./routes/progress'); // GET /progress

const app = express();

// --- Middleware (runs on every request, in this order) ---
app.use(express.json()); // parse JSON bodies -> req.body
app.use(cookieParser()); // parse the Cookie header -> req.cookies
app.use(attachStudent); // set req.studentId from the cookie (mint if absent)

// --- Routes ---

// Health check: server up + can reach Postgres.
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// All mounted at '/', so their paths ('/groups', '/enrollments', ...) are used
// as-is. Order between routers doesn't matter here since their paths are distinct.
app.use('/', catalogRoutes);
app.use('/', enrollmentRoutes);
app.use('/', gpaRoutes);
app.use('/', progressRoutes);

module.exports = app;
