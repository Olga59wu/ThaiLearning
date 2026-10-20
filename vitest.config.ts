import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import { audioManifestPlugin } from './build-plugins/audioManifest.ts'

// 單元測試只跑純函式與資料檔，不需要 Vue／PWA plugin
export default defineConfig({
  plugins: [audioManifestPlugin(fileURLToPath(new URL('.', import.meta.url)))],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // 關閉轉換結果的磁碟快取（Vitest 5 預設開啟，存在 node_modules/.vitest-cache）：
    // 快取以檔案內容為 key，import.meta.glob 掃到的檔案清單不在 key 裡，
    // 新增 lesson-XX.ts 後 registry.ts 內容沒變，會沿用舊的 glob 結果（課程少一課，測試失敗）
    fsModuleCache: false,
  },
})
