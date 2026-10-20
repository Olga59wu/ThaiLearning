/// <reference types="vite/client" />

// build-plugins/audioManifest.ts：public/audio/TH/ 實際存在的音檔檔名
declare module 'virtual:audio-manifest' {
  const files: string[]
  export default files
}

interface ImportMetaEnv {
  /** 開發用跳過登入（src/dev/skipAuth.ts）：只在 pnpm dev 且設為 '1' 時生效 */
  readonly VITE_DEV_SKIP_AUTH?: string
}
