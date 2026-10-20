# ThaiLearning 專案規範

將 `legacy/` 多語學習機中的泰文部分，搬遷為 Vue 3 + TypeScript 專案（Vite、Tailwind CSS v4、Pinia、Vue Router history 模式、vite-plugin-pwa）。

## 接手必讀
- **`docs/MIGRATION.md`**：搬遷計畫、已確認決策、目前進度、技術處理慣例、每頁工作流程（開始工作前先讀）
- `TODO.md`：原版照搬的怪異行為與部署待辦
- **`docs/LESSONS.md`**：每週課程（`/lessons`）的新增流程與資料格式（使用者給新一課的照片時先讀）

## 溝通
- 所有回覆、計畫、說明一律使用**繁體中文**（程式碼識別字維持英文）

## 程式風格
- 函式一律使用 arrow function，不使用 `function` 宣告
- Vue 元件一律使用 `<script setup lang="ts">`

## 環境與工具
- 套件管理使用 **pnpm**
- 開發環境是 **Windows**
- 指令：`pnpm dev`、`pnpm build`（含 `vue-tsc` 型別檢查）、`pnpm preview`（測試 Service Worker／離線功能需使用 build 後的 preview）

## 用瀏覽器檢查畫面（開發用跳過登入）
- 改了畫面，**自己先用 headless Chrome 檢查過**（截圖看過、需要時量 DOM），再請使用者確認
- 需要登入的頁面用「開發用跳過登入」：`VITE_DEV_SKIP_AUTH=1 pnpm dev --port 5199 --strictPort`（環境變數也可以寫在 `.env.local`，但會影響使用者自己的 `pnpm dev`，所以用指令列＋5199，不動使用者的 5173）
  - 只在 `import.meta.env.DEV` 且 `VITE_DEV_SKIP_AUTH=1` 時生效（`src/dev/`）：假使用者 `dev@local`，白名單、管理員都視為通過（可進 /path）；`services/db.ts` 不讀寫 Firestore（只用 localStorage）；畫面頂端有紅色提示條
  - 使用處一律寫 `if (import.meta.env.DEV && DEV_SKIP_AUTH)`，production build 會整段移除；`pnpm build` 最後的 `scripts/check-dist.mjs` 檢查 dist 不含開發用程式（含 `/dev/vowel-guides`）
- 操作瀏覽器：`scripts/dev-browser/run.mjs`（Chrome DevTools Protocol，可點擊、量 DOM、截圖），步驟檔範例 `scripts/dev-browser/thai-vowels.mjs`
  - Chrome 要先在 bash 啟動（從 Node spawn 起不來）：`("/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --remote-debugging-port=9333 --user-data-dir=<scratchpad>/chrome-profile --window-size=1280,900 about:blank > /dev/null 2>&1 &)`
  - `node scripts/dev-browser/run.mjs <步驟檔> <scratchpad 輸出資料夾>`，截圖放 scratchpad，不進 git
  - 用完關掉 Chrome（9333）和 dev server（5199）

## legacy/
- `legacy/` 是**唯讀參考來源**，不可修改或刪除其中任何檔案
- 搬遷時以原版行為為準：版面、顏色、字體、間距、動畫、音效、按鈕行為、題目順序與計分邏輯都要一致；不自行新增功能或「順便優化」，想改的地方先列出來詢問
- 舊網站是從另一個原本的專案資料夾部署，`legacy/` 只是參考副本；改白名單時 `legacy/` 仍維持唯讀，不需要修改
- 之後新增或修改筆順（`strokes`）一律在新版 `/path` 做，資料直接改 `src/data/thai.ts`，不再動 `legacy/`

## 白名單（allowedEmails）
- 改白名單時要同時改三處：`src/config.ts`、`firestore.rules`，以及**舊網站原本專案的 `js/config.js`**
- 舊網站的 `js/config.js` 不在這個 repo 裡，必須**提醒使用者手動修改並重新部署舊網站**
- 改完 `firestore.rules` 要部署（`firebase deploy --only firestore:rules`），規則由新舊網站共用

## Git
- 每完成一個步驟或搬完一頁就 commit 一次
- commit message 使用繁體中文

* 一律使用繁體中文回覆，包含計畫與說明
* 程式碼註解使用繁體中文
* 專有名詞與程式碼識別字維持英文
* 執行指令或編輯檔案時附帶的說明文字（description）也使用繁體中文