/// <reference types="vite/client" />

// build-plugins/audioManifest.ts：public/audio/TH/ 實際存在的音檔檔名
declare module 'virtual:audio-manifest' {
  const files: string[]
  export default files
}
