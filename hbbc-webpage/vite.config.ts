import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Resolves to the exact tag (e.g. "v0.1.0") when built from a tagged
// release commit, or a short commit hash otherwise (local dev, or a
// build from main before any tag exists yet) — see deploy/04-auto-deploy.sh
// for how a tag actually gets deployed, and Footer.vue for where this
// is displayed.
const appVersion = (() => {
  try {
    return execSync('git describe --tags --always --dirty').toString().trim()
  } catch {
    return 'unknown'
  }
})()

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
