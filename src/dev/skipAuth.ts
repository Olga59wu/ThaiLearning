/**
 * 開發用跳過登入：只在 `pnpm dev`（import.meta.env.DEV）且 .env.local 設定 VITE_DEV_SKIP_AUTH=1 時為 true。
 * 用途：讓 headless 瀏覽器能測試需要登入的頁面。
 *
 * 使用處一律寫成 `if (import.meta.env.DEV && DEV_SKIP_AUTH)`：production build 的 import.meta.env.DEV 是 false，
 * 整段（含動態 import 的 devSession.ts、DevAuthBanner.vue）會被移除；`pnpm build` 最後的 scripts/check-dist.mjs 會檢查 dist。
 */
export const DEV_SKIP_AUTH: boolean = import.meta.env.DEV && import.meta.env.VITE_DEV_SKIP_AUTH === '1'
