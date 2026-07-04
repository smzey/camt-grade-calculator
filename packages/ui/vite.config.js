import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Library-mode build. Unlike the client (which builds an *app* that mounts to
// #root), this builds a *component library*: a bundle that other apps import
// from. `build.lib` tells Vite to emit importable modules instead of an
// index.html app.
export default defineConfig({
  // tailwindcss() scans our JSX for utility classes and emits only the CSS we
  // actually use into the library's stylesheet. react() compiles JSX.
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      // The barrel file whose exports become the library's public API.
      entry: 'src/index.js',
      // UMD global name — in a plain <script> the whole library is on
      // `window.CamtUI`. (This is the global claude.ai/design reads from.)
      name: 'CamtUI',
      // Emit both a modern ES module (for bundlers) and a UMD build (for
      // <script> tags / the design tool). fileName controls the output names.
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'camt-ui.js' : 'camt-ui.umd.cjs'),
      // Without this, Vite names the emitted stylesheet after the package's
      // short name (ui.css). Pin it so it matches the "./styles.css" export.
      cssFileName: 'camt-ui',
    },
    rollupOptions: {
      // Don't bundle React into the library — the consuming app provides it.
      // Otherwise two copies of React would collide (hooks break).
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // For the UMD build, tell Rollup what globals the externals map to
        // when loaded via <script>.
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
});
