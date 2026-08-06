import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    /**
     * No manualChunks by design.
     *
     * A hand-rolled vendor split forced lazily-imported libraries (jsPDF, Recharts)
     * into the entry graph, so they were module-preloaded on first paint. Vite's
     * default chunking follows the dynamic-import boundaries we already have —
     * route-level lazy() plus an on-demand import of the PDF generator — and keeps
     * them out of the initial payload.
     */
    chunkSizeWarningLimit: 700,
  },
});
