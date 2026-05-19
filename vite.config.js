import { defineConfig } from 'vite';

export default defineConfig({
  // Static-asset-heavy app — keep it simple. PWA service worker is registered
  // manually from src/main.js, not via a plugin, to keep dependencies minimal.
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'es2020',
    sourcemap: true
  }
});
