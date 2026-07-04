// src/server.js
// The HTTP entry point: creates the Express app, wires up routes, and listens.

require('dotenv').config(); // load .env into process.env before anything reads it

const express = require('express');
const db = require('./db'); // our pool wrapper from db.js
const catalogRoutes = require('./routes/catalog'); // step 2: GET /groups, /subjects
const enrollmentRoutes = require('./routes/enrollments'); // step 3: POST /enrollments

// `express()` returns an app object — think of it as the request router +
// middleware stack. We attach routes and middleware to it, then start listening.
const app = express();

// Built-in middleware: parse incoming JSON request bodies into `req.body`.
// Without this, POST/PUT bodies (which we'll need in step 3) arrive as undefined.
// Middleware runs on every request, in the order it's registered.
app.use(express.json());

// --- Routes ---

// Health check: a cheap endpoint to confirm (a) the server is up and
// (b) it can actually reach Postgres. Load balancers, uptime monitors, and
// you-during-development all hit this to answer "is everything alive?".
// `async` because we await a DB round-trip inside.
app.get('/health', async (req, res) => {
  try {
    // `SELECT 1` is the standard "can I talk to the DB?" no-op query.
    await db.query('SELECT 1');
    // res.json() sets Content-Type: application/json and serializes the object.
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    // If the DB is unreachable, report 503 (Service Unavailable) rather than
    // letting the request hang or 500. Log the real error server-side.
    console.error('Health check failed:', err);
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Mount the catalog router. Its routes are defined with paths like '/groups',
// and here we mount at '/', so they're reachable at GET /groups and /subjects.
// (If we mounted at '/catalog', they'd become /catalog/groups — path prefixing.)
app.use('/', catalogRoutes);
app.use('/', enrollmentRoutes);

// --- Start listening ---

// Fall back to 3000 if PORT isn't set. `||` catches undefined/empty string.
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
