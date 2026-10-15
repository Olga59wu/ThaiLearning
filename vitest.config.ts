import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// 單元測試只跑純函式與資料檔，不需要 Vue／PWA plugin
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
