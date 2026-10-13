import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function spaFallback404Plugin() {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const distDir = resolve(process.cwd(), 'dist');
      const indexHtml = resolve(distDir, 'index.html');
      const notFoundHtml = resolve(distDir, '404.html');
      if (existsSync(indexHtml)) {
        copyFileSync(indexHtml, notFoundHtml);
      }
    },
  };
}

export default defineConfig({
  base: '/Dashboard/',
  plugins: [react(), spaFallback404Plugin()],
  server: {
    host: true,
    port: 5173,
    open: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: { chunkSizeWarningLimit: 2500 },
});
