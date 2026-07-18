import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Frontend component tests (jsdom). Mirrors tsconfig.app.json's scope —
// see vitest.server.config.ts for the backend counterpart, matching the
// existing tsconfig.app.json/tsconfig.server.json split.
export default defineConfig({
  plugins: [vue()],
  define: {
    // Login.vue/ForgotPassword.vue don't reference this, but Footer.vue
    // (and anything that mounts it transitively) does — see vite.config.ts.
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      // Distinct from vitest.server.config.ts's reportsDirectory — both
      // default to the same coverage/ dir otherwise, so running both in
      // one npm script (test:coverage) silently overwrites one report
      // with the other.
      reportsDirectory: 'coverage/unit',
    },
  },
})
