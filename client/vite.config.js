import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the React client.
//
// This is now the WHOLE app — there is no backend. `npm run build` emits static
// files (client/dist) that can be dropped on any static host (Cloudflare Pages,
// GitHub Pages, Netlify, …) for $0. No API proxy is needed because every call is
// answered locally (see src/api.js -> store.js/engine.js).
//
// NOTE: if you deploy to a GitHub *project* page (served from /<repo>/ instead of
// the domain root), set `base: '/<repo-name>/'` here so asset URLs resolve.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // @camt/ui is linked from ../packages/ui, which has its own copy of React in
    // node_modules. Dedupe forces a single React instance so hooks work (two
    // Reacts would cause "invalid hook call" errors).
    dedupe: ['react', 'react-dom'],
  },
});
