// src/app.js
// Builds and EXPORTS the configured Express app — but does NOT start listening.
// server.js requires this and calls app.listen(). Keeping "build app" separate
// from "start server" is what lets the tests import the app without a real port.

require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./db');
const attachStudent = require('./middleware/student');

const catalogRoutes = require('./routes/catalog'); // GET /groups, /subjects
const enrollmentRoutes = require('./routes/enrollments'); // POST/GET/DELETE /enrollments
const gpaRoutes = require('./routes/gpa'); // GET /gpa
const progressRoutes = require('./routes/progress'); // GET /progress

const app = express();

// Global middleware.
app.use(express.json()); // parse JSON bodies -> req.body
app.use(cookieParser()); // parse the Cookie header -> req.cookies

// --- API (everything under /api) ---
const api = express.Router();

// attachStudent runs ONLY for API routes (not for static assets). This avoids a
// race where several parallel asset requests on first load each mint a different
// anonymous id. Identity only matters when hitting the API anyway.
api.use(attachStudent);

// Health check: server up + can reach Postgres.
api.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Session: returns (and, via the middleware, establishes) the caller's anonymous
// id. The client awaits this FIRST on startup so the cookie is set exactly once
// before it fires the parallel data loads — no id race.
api.get('/session', (req, res) => {
  res.json({ student_id: req.studentId });
});

api.use('/', catalogRoutes);
api.use('/', enrollmentRoutes);
api.use('/', gpaRoutes);
api.use('/', progressRoutes);

app.use('/api', api);

// Any unmatched /api/* path is a real 404 for the API (JSON), not the SPA.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// --- Static React app (production) ---
// After `npm run build` in client/, Vite emits client/dist. Express serves those
// files, and any other GET falls back to index.html so the SPA can boot. In dev
// we don't use this path at all — the Vite dev server serves the app and proxies
// /api here. If dist doesn't exist yet, sendFile just errors -> normal 404.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next(); // dist not built (dev) -> fall through to default 404
  });
});

module.exports = app;
