#!/usr/bin/env node
const ngrok = require('ngrok');

(async () => {
  const port = process.env.PORT || 3000;
  try {
    console.log(`Starting ngrok tunnel to http://localhost:${port} ...`);
    const url = await ngrok.connect({ addr: port, authtoken: process.env.NGROK_AUTH_TOKEN });
    console.log('ngrok tunnel established at', url);
    console.log('ngrok web UI: http://127.0.0.1:4040');
    console.log('Press Ctrl+C to stop the tunnel.');
  } catch (err) {
    console.error('Failed to start ngrok:', err);
    process.exit(1);
  }
})();
