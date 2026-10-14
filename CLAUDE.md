# ThaiLearning 專案規範

將 `legacy/` 多語學習機中的泰文部分，搬遷為 Vue 3 + TypeScript 專案（Vite、Tailwind CSS v4、Pinia、Vue Router history 模式、vite-plugin-pwa）。

## 接手必讀
- **`docs/MIGRATION.md`**：搬遷計畫、已確認決策、目前進度、技術處理慣例、每頁工作流程（開始工作前先讀）
- `TODO.md`：原版照搬的怪異行為與部署待辦

## 溝通
- 所有回覆、計畫、說明一律使用**繁體中文**（程式碼識別字維持英文）

## 程式風格
- 函式一律使用 arrow function，不使用 `function` 宣告
- Vue 元件一律使用 `<script setup lang="ts">`

## 環境與工具
- 套件管理使用 **pnpm**
- 開發環境是 **Windows**
- 指令：`pnpm dev`、`pnpm build`（含 `vue-tsc` 型別檢查）、`pnpm preview`（測試 Service Worker／離線功能需使用 build 後的 preview）

## legacy/
- `legacy/` 是**唯讀參考來源**，不可修改或刪除其中任何檔案
- 搬遷時以原版行為為準：版面、顏色、字體、間距、動畫、音效、按鈕行為、題目順序與計分邏輯都要一致；不自行新增功能或「順便優化」，想改的地方先列出來詢問
- 之後新增或修改筆順（`strokes`）一律在新版 `/path` 做，資料直接改 `src/data/thai.ts`，不再動 `legacy/`

## Git
- 每完成一個步驟或搬完一頁就 commit 一次
- commit message 使用繁體中文

* 一律使用繁體中文回覆，包含計畫與說明
* 程式碼註解使用繁體中文
* 專有名詞與程式碼識別字維持英文
* 執行指令或編輯檔案時附帶的說明文字（description）也使用繁體中文