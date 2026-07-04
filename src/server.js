// src/server.js
// The HTTP entry point. All the app wiring lives in app.js; this file's only
// job is to take that app and start listening on a port. Keeping "build the
// app" and "start the server" separate is what makes the app testable.

const app = require('./app');

// Fall back to 3000 if PORT isn't set. `||` catches undefined/empty string.
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${PORT}`);
});
