// src/db.js
// One shared PostgreSQL connection pool for the whole app.

// `dotenv` reads the .env file and copies its keys into process.env.
// Calling .config() here (and again in server.js) is fine — it's idempotent.
// We need it in this file because db.js can be require()'d before server.js runs it.
require('dotenv').config();

// The `pg` driver exposes a `Pool`: a set of reusable DB connections.
// Opening a fresh TCP connection per query is slow, so instead we keep a small
// pool of open connections and borrow/return them automatically per query.
const { Pool } = require('pg');

// `connectionString` accepts the full postgresql://user:pass@host:port/db URL
// straight from .env — no need to spell out host/port/user separately.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// A pool can emit an 'error' event for an *idle* client (e.g. Postgres restarted,
// network dropped). Without a listener, Node treats it as an unhandled error and
// crashes the process. Logging it keeps the app alive; the pool will reconnect.
pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

// Export a thin `query` helper instead of the raw pool. Callers write
// `db.query('SELECT ...', [params])` and the pool handles borrowing/returning
// a connection under the hood. Passing values as the second arg ($1, $2, ...)
// is parameterized — the driver escapes them, which prevents SQL injection.
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // exported too, in case we later need transactions (pool.connect())
};
