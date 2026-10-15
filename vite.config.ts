import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { audioManifestPlugin } from './build-plugins/audioManifest.ts'

export default defineConfig({
  plugins: [
    vue(),
    audioManifestPlugin(fileURLToPath(new URL('.', import.meta.url))),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // SW 註冊沿用原版寫法，在 main.ts 手動 register，不使用自動 reload
      injectRegister: false,
      // icon 已由 globPatterns 收進 precache，避免重複
      includeManifestIcons: false,
      manifestFilename: 'manifest.json',
      manifest: {
        name: '泰語學習機',
        short_name: 'ThaiLearn',
        description: '泰語學習機',
        lang: 'zh-TW',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#4f46e5',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        // 音檔不進 precache，由 SW 的 lang-audio-cache-v3 管理
        globIgnores: ['audio/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
})
