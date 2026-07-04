import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the React client.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // @camt/ui is linked from ../packages/ui, which has its own copy of React in
    // node_modules. Dedupe forces a single React instance so hooks work (two
    // Reacts would cause "invalid hook call" errors).
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // Dev-only proxy: while running `vite` (default port 5173), any request the
    // browser makes to /api/* is forwarded to the Express server on :3000. To
    // the browser everything is same-origin (5173), so the httpOnly cookie is
    // sent and set normally — no CORS. In production this proxy isn't used;
    // Express serves the built app and the API together on one origin.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
