# 泰文學習機搬遷文件（legacy → Vue 3）

> 本文件供後續對話接手使用：記錄搬遷計畫、已確認的決策、目前進度、技術慣例與每頁工作流程。
> 專案規範見根目錄 `CLAUDE.md`；原版照搬的怪異行為與部署待辦見 `TODO.md`。

---

## 0. 目前進度（2026-10-13）

| 項目 | 狀態 | commit |
|---|---|---|
| 第 1 步 盤點 | ✅ | — |
| 第 2 步 搬遷計畫 | ✅ | — |
| 第 3 步 專案骨架 | ✅ | `a86b922`、`cd87c62` |
| Home（`/`）+ 404 | ✅ 使用者已對照確認 | `1d056af` |
| 泰語學習機（`/thai`） | ✅ 使用者已對照確認 | `66fe35a` |
| `/thai` 原版 bug 修正（挑戰模式、翻牌通關、收藏範圍） | ✅ 使用者已測試通過 | `59d8edd` |
| `/thai` 數字鍵只在挑戰模式作答 | ✅ | `306b4e4` |
| 隨身聽（`/player`） | ✅ 使用者已對照確認 | `4d7da27` |
| `/player` 原版 bug 修正（離線語音彈窗、分類消失卡 LOADING、恢復分類不上傳、壞音檔寫回 localStorage） | ✅ | `fdb176a` |
| 撤銷 player 錯誤的顏色排序相容規則；確認 Home／thai 無顏色排序差異 | ✅ | `a96f880` |
| 打字練習（`/typing`） | ✅ 使用者已對照確認 | `b5c76c3` |
| `/typing` 原版 bug 修正（發音與 TTS 重疊、剩餘顯示、清空分類、雲端資料寫回 localStorage、同字多義用 id） | ✅ | `9aff9eb` |
| 音檔打包（`/downloader`） | ✅ 使用者已對照確認 | `ffa5aa4` |
| `/downloader` 原版 bug 修正（抓取失敗判斷、下載中鎖住選取、待抓數、已打包寫入時機、上傳失敗狀態、按鈕改名） | ✅ | `5fec2ba` |
| `/player` 同步失敗圖示（改看 `saveThai()` 回傳值） | ✅ | `db3e87c` |
| 筆順產生器（`/path`） | ✅ 使用者已對照確認 | `cb446d6` |
| `/path` 原版 bug 修正（連按複製、拖曳出界、雙擊多點、匯入失敗、單引號跳脫、Clipboard API） | ✅ | `a1c88cb` |
| 第 5 步 對照檢查（逐項對照盤點清單、TODO 一次決定） | ✅ | — |
| 第 5 步決定的修正：`/path` 匯入失敗保留內容 | ✅ | `178dd15` |
| 第 5 步決定的修正：`/thai` 錯題複習標籤、雲端資料寫回 localStorage、語速存數字 | ✅ | `a85be57` |
| 第 5 步決定的修正：`/player` 淺色模式播放光暈 | ✅ | `1d58a2d` |
| **SW／離線功能實測（`pnpm build && pnpm preview`）** | **下一步（使用者實測中）** | |
| 部署（Hosting 設定、Authorized domains） | 待辦，見 TODO.md | |

順序：**player → typing → downloader → path** → 第 5 步對照檢查（已完成）→ SW／離線實測 → 部署。

---

## 1. 每頁工作流程（必須遵守）

1. 讀 `legacy/` 原版頁面全文（HTML + script + style），逐行對照搬遷
2. 搬完執行 `pnpm build`（含 `vue-tsc` 型別檢查），必須通過；必要時用 `pnpm dev --port 5199 --strictPort` 以 curl 確認模組可編譯，結束後關閉 dev server
3. 發現原版怪異行為／bug：**照原版保留**，記入 `TODO.md` 對應頁面區塊，並在回報中列出，由使用者決定是否修正
4. `git commit`（繁體中文 message，結尾加 `Co-Authored-By` 行）
5. 回報：做了什麼、為還原 v4 差異做了哪些處理、發現的原版 bug、**逐項列出瀏覽器對照步驟**
6. **停下來等使用者確認**，確認後才搬下一頁
7. 使用者要求修正原版 bug 時：獨立 commit，同步更新 `TODO.md`（打勾並註明修正方式）

對照方式：
```bash
npx http-server legacy -p 5500 -c-1   # 原版：http://localhost:5500/thaiPlayer.html
pnpm dev                               # 新版：http://localhost:5173/player
```
兩者是不同 origin，localStorage 與登入狀態各自獨立。Service Worker／離線功能要用 `pnpm build && pnpm preview` 測。

---

## 2. 已確認的決策

### 範圍
- 只搬泰文；**移除所有日韓相關內容**（大廳 JP 快捷列、JP/KR 卡片、thai 頁首 JP/KR 切換鈕）
- `path.html` 要搬，選字表**只保留「泰語輔音／泰語元音」tab**（移除日語平假名／片假名）
- `404.html` 做成 Router catch-all route，畫面照原版
- 大廳 `<title>` 與畫面 h1 的「語言學習中心」改成「**泰語學習機**」，其他文字照原版
- manifest：`name 泰語學習機`、`short_name ThaiLearn`、`description 泰語學習機`、`lang zh-TW`

### 部署
- 部署到**新的 Firebase Hosting site**（舊站保留給日韓）→ 本機進度、已下載音檔歸零可接受，Firestore 雲端進度能延續即可
- 新網域：不做舊 `.html` 網址導向
- 不沿用 `legacy/.firebaserc`、`legacy/firebase.json`，部署設定使用者另外處理
- Firebase 設定沿用寫死方式（`src/config.ts`）
- 部署時要把新網域加入 Firebase Auth Authorized domains（已記在 TODO.md）

### PWA / Service Worker
- vite-plugin-pwa `injectManifest` + 手寫 `src/sw.ts`
- 程式本體：Workbox precache（檔名 hash，不手動遞增版號）
- **音檔：純 cache-first**，快取名稱 `lang-audio-cache-v3`；有快取直接回傳、不發任何網路請求；沒有快取才走網路並在 status 200 時寫入
  - 註：原版 sw.js 實際上會在回傳快取的同時背景 fetch 更新（fetch 在判斷前就發出），新版刻意改為純 cache-first
- 其他跨網域 GET：stale-while-revalidate 到 `lang-runtime-cache`；**排除 Firebase 請求**（`*.googleapis.com` 除 `fonts.googleapis.com`、`*.firebaseapp.com`、`*.firebasestorage.app`、`apis.google.com`）
- SW 在 `main.ts` 以原版寫法手動註冊（只在 production），不使用自動 reload
- 「離線語音」下載按鈕流程照原版：`downloadOfflineAudio()` 逐一 fetch 652 個 URL，由 SW 寫入音檔快取

### 登入
- 未登入一律導回 `/`：router `beforeEach` 等 `authStore.ready` 後檢查 `meta.requiresAuth`；`/path` 另有 `meta.requiresAdmin`（非管理員導回 `/`）
- `App.vue` 監看 `isLoggedIn`，停留頁面時登入失效也導回 `/`（等同原版各頁的 initAuthListener 失敗回呼）
- 白名單拒絕的錯誤訊息「抱歉，此帳號沒有存取權限」在登出後持續顯示，直到使用者再次點擊登入（原版會被清掉，已修正）

### 要修正的原版 bug（尚未搬到的頁面）
1. **`thai-mp3-history` 拆成兩個 key**
   - 壞音檔名單（Player 用）：localStorage `thai-broken-audio`、Firestore `thai.brokenAudio`
   - 已打包名單（Downloader 用）：localStorage `thai-mp3-history`、Firestore `thai.mp3History`
   - **雲端舊的 `mp3History` 全部歸到已打包**（`mp3History`），`brokenAudio` 從空的開始
2. **Typing 啟動時先讀 localStorage**（`thai-custom-list`、`thai-known-words`），未登入或雲端沒資料也要能正常開始，不可卡在 LOADING
3. **收藏／已學會一律用 `id` 比對**（Typing 改成和 Player 一樣）。舊資料沒有 `id` 時：先用 `th + zh` 比對；對不上再用 `th` 對應**第一筆**（`เย็น`→`th-0134`、`จอง`→`th-0112`）
4. Player 重複的 `watch(isDarkMode)` 合併成一個
5. Downloader 右下角通知**不加動畫**（原版 `animate-in slide-in-from-right-10` 本來就無效）
6. 缺少的 `zh_傍晚.mp3`、`zh_預訂.mp3` 照原版退回 TTS
7. `alert` / `confirm` 照原樣保留（第 5 步確認不改）

### 已修正的 /thai 原版 bug
- 「重置所有數據」只清除 thai 自己的 6 個 key（原版 `localStorage.clear()`）
- 聲調訓練「挑戰」按鈕可進入挑戰模式（`enterToneChallenge`）；數字鍵 1～5 只在挑戰模式作答
- 翻牌記憶全部 6 組配對完才顯示「恭喜通關」
- 測驗範圍新增「收藏」按鈕（樣式同範圍按鈕，`disabled:opacity-50 disabled:cursor-not-allowed`，沒有收藏時 disabled）
- 錯題複習：`quiz.filter` 記錄出題來源（`startQuiz` 時設定），`filter === 'mistakes'` 時 Mode 標籤顯示「錯題複習」並隱藏範圍按鈕（`currentMode` 不變，否則 QuizSection 會被卸載）
- 雲端載入的 `correctCounts`／`favorites`／`mistakeList` 寫回 localStorage（`ThaiView.vue` onMounted）
- 語速滑桿 `v-model.number`；store 讀入 `preferredRate` 時 `Number()` 轉換（相容舊的字串資料）

### /player 的決策與已修正 bug
- 壞音檔名單啟動時從 localStorage `thai-broken-audio` 讀取（原版不讀；使用者確認保留）；雲端有 `brokenAudio` 時覆蓋並寫回 localStorage（改由 `vocabProgress.applyCloudData()` 處理，見 /typing）
- 「離線語音」確認／成功彈窗放在 View 外層（原版誤包在單字清單彈窗內）
- `updatePlaylist` 遇到不存在的分類當空清單；已學會清空時比照自訂單字移除「已學會」分類
- 從雲端恢復分類時不觸發上傳（分類 watch 檢查 `isSyncingFromCloud`）
- `syncToCloud` 改看 `cloud.saveThai()` 回傳值，失敗時顯示「同步失敗」圖示（原版錯誤被吞掉，永遠不會出現）
- `.playing-glow` 規則改為 `:where(html.shell-player) .player-card.playing-glow`（權重 0,2,0 高於 `shadow-xl`），淺色模式也看得到光暈；深色模式規則不變
- 決定不修：隨機模式洗牌兩次（見 TODO.md）

### /typing 的實作與決策
- `src/composables/typing/useTypingPage.ts`（`createTypingPage()` + provide／inject）、`useTypingSounds.ts`（WebAudio；每次進頁建立 AudioContext、離開時 `close()`，原版存在 `window.audioCtx`）
- 元件 `components/typing/{TypingHeader, TypingCard, TypingInputBar}.vue`；分類圖例與 `OfflineAudioModal` 直接寫在 View（原版位置：`#app` 的 `v-else` 內，LOADING 時不顯示）
- `styles/pages/typing.css`（`shell-typing`）：`@keyframes shake` 改名 `typing-shake`（原版沒用到）；原版 `@keyframes pulse` 與 Tailwind 內建完全相同，不重複定義
- 啟動：setup 時 `loadFromStorage()` + `migrateToId()`（遷移後寫回 localStorage）→ mount 載入雲端（`vocab.applyCloudData()`：有資料就覆蓋、遷移並寫回 localStorage，遷移後回寫雲端）→ **一律** `initGame(false)`（原版只有雲端有 thai 資料才開始）
- 收藏／已學會判斷、`initGame` 的已學會過濾、抽卡的 `inOtherCats`／`findIndex` 全部改用 `id`；清單去重與 Transition `:key` 也改用 `id`（使用者要求修正，同字多義兩個意思都會出現）
- 兩段重複的「抽掉卡片」程式合併為 `removeFromGame()`（行為相同）
- SPA 清理：離開頁面時被中斷的 `play()` 不再退回 TTS（`disposed` 檢查）
- 顏色排序掃描：無 DIFF
- 已修正 bug：
  - 播放加 `playToken` + 過濾 AbortError（同 Player），被中斷的播放不退回 TTS，延遲 70ms 的 TTS 也會檢查 token → 連續換題只念目前的字
  - 「剩餘」用 `remainingCount`（完成時 0）
  - `pruneEmptyCategory()`：自訂單字／已學會清空時從已選分類移除，沒有已選分類就回到「全部」並 `initGame(false)`（此時不再執行 `removeFromGame`，避免延遲 splice 到新清單）

### /downloader 的實作與決策
- 頁面小，邏輯直接寫在 `ThaiDownloaderView.vue`（不拆元件／composable）；`styles/pages/downloader.css`（`shell-downloader`），body class `p-4 md:p-8`
- `jszip`、`file-saver` 改用 npm 套件靜態 import（頁面本身已 lazy load）
- 已打包名單用 `vocabProgress.mp3History`（`thai-mp3-history`／雲端 `mp3History`）；不碰 `thai-broken-audio`
- 自訂單字照原版每次從 localStorage `thai-custom-list` 讀取並以 `th` 去重；雲端 `customList` 照原版寫回 localStorage（不做 id 遷移，其他頁載入時會遷移）
- SPA 清理：離開頁面時 `disposed` + `AbortController` 中止抓取迴圈與進行中的 fetch，不產生 ZIP、不寫入名單（等同原版換頁）；延遲改用 `useTimers().later()`
- 右下角通知照抄 `animate-in slide-in-from-right-10 duration-500`（v3／v4 都沒有前兩個 class，無動畫）
- 顏色排序掃描：無 DIFF；`hover:bg-blue-700` 在 `disabled:bg-slate-200` 之前、`border-white/30` 在 `border-t-white` 之前（同 v3）
- 已修正 bug：
  - 以 `successCount`（實際放進 ZIP 的檔案數）判斷，0 個 → 通知顯示「任務失敗」（`isFailed`）、不產生 ZIP；移除原版永遠不會觸發的「ZIP 檔過小」alert
  - 下載中鎖住選取：函式開頭 `if (isDownloading) return`，按鈕／勾選框 `:disabled` + `disabled:opacity-50 disabled:cursor-not-allowed`，列的游標改 `cursor-not-allowed`；迴圈走訪 `[...selectedWords]` 快照
  - 「待抓」= `pendingCount`（庫存中未打包的字）
  - 泰文與中文都抓到才記入 `completedWords`；`saveAs` 之後才寫入已打包名單、localStorage 並上傳
  - `saveProgressToCloud()` 改為回傳 `boolean`（其他呼叫端忽略回傳值，不影響）；`cloud.saveThai()` 一併回傳；失敗時 `isSyncFailed` → 紅點 + 「Sync Failed」，下次上傳成功即恢復
  - 「✨ 只選機械音」改名「✨ 只選未打包」

### /path 的實作與決策
- 邏輯直接寫在 `PathEditorView.vue`（一對一翻譯原版 script）；選字表拆成 `components/path/CharPickerModal.vue`（父層 `v-if` 控制，每次打開從「泰語輔音」開始，同原版 `openCharPicker`）
- `styles/pages/path.css`（`shell-common shell-path`），body class 照原版 `bg-gray-100 flex flex-col items-center p-4 h-screen overflow-hidden`；View 根元素是原版 body 內的兩個元素（主面板 + 選字表），沒有 #app
- 選字表只保留泰語輔音／元音；`jpData` 的查找（選字、匯入）全部移除
- canvas 繪圖、`strokes`、`currentCharObj` 等維持一般變數（非 reactive）；`#input-char`（contenteditable）以 ref 直接讀寫 `textContent`；字底圖、預覽 path `d`、輸出文字、圓潤度數值、匯入 placeholder、canvas `hovering-point` 改為 ref 綁定
- 複製按鈕：原版改 innerHTML + `classList.replace`，改用 `copyLabel`／`copyBg` 狀態
- 選字表原版有 `animate-slide-up`，但 path.html 的 Tailwind 沒定義（無動畫）；新版 `@theme` 為 index 定義了它，故移除此 class；`hidden` 改由 `v-if` 控制
- 計時器（畫布閃綠 150ms、複製 1 秒、匯入 placeholder 3 秒）用 `useTimers().later()`
- 顏色排序掃描：無 DIFF
- 已修正 bug：
  - 複製改用 `navigator.clipboard.writeText`（失敗時 console.error、按鈕不變）；連按時 `cancel(copyTimer)` 重新計時，固定恢復成原文字與 `bg-emerald-500`
  - `mouseleave` 呼叫 `endDrag()`（清 `isDragging` 與拖曳索引）並清除 hover 標示，移出畫布即結束拖曳
  - 雙擊斷筆：`mousedown` 以 `e.detail <= 1` 判斷新點擊序列、`clickAddedCount` 記錄在空白處新增的點數；`dblclick` 先從最後一筆畫尾端移除這些點再 `nextStroke()`
  - 匯入：先解析出 `parsedStrokes`，為空就不改動字底圖／`currentCharObj`／畫布；**保留匯入框內容**，失敗訊息以 `importError` 紅字顯示在匯入框下方（再次匯入或 `@input` 時清除）；成功訊息照原版用 placeholder（`showImportMessage()`，3 秒，連續匯入時重新計時）
  - 輸出用 `quote()` 跳脫 `\` 與 `'`；匯入的 `char` regex 支援跳脫字元並還原
- 決定不修：觸控支援（見 TODO）

### 第 5 步對照檢查結論（2026-10-13）
- 7 頁全部搬完並經使用者對照確認；§2 決策、§3 架構、§5 盤點項目逐項核對皆已實作
- 刻意差異（已決定）：音檔純 cache-first、Workbox precache、新網域本機資料歸零、無舊網址導向、Firebase 10.7.1 CDN → 13.x npm、JSZip 3.10.1 → 3.10.x npm、各頁已修正的原版 bug
- 技術上無法 100% 等同但視覺一致：Tailwind v3 → v4（§4.3～4.5 的處理）、SPA 換頁（手動清理、字型連結動態替換，首次進頁可能短暫顯示後備字體）、Typing 的 AudioContext 每頁建立
- 「離線語音」下載 652 個網址中 2 個不存在（`zh_傍晚`、`zh_預訂`），console 會有 2 筆警告，同原版
- TODO.md 的原版怪異行為已全部決定（修：/path 匯入保留內容、/thai 錯題標籤／雲端寫回／語速型別、/player 光暈；其餘不修）
- 剩下：SW／離線實測、部署（見 TODO.md「部署」）

### 給 /typing 的接手提示（已完成）
- 共用：`useOfflineAudioDownload()` + `<OfflineAudioModal :modal success-message="現在打字練習時，發音會更加流暢無延遲！" @close @confirm>`（Typing 原版彈窗本來就在 `#app` 第一層）
- 共用：`useVocabProgressStore()`（setup 時呼叫 `loadFromStorage()`，再用 `migrateToId()` 遷移，符合決策「Typing 啟動先讀 localStorage」與「一律用 id 比對」）、`useCloudStore()`（`loadThai()`／`saveThai()`）
- Typing 上傳欄位只有 `customList, knownWords`（展開快取）
- 參考 `src/composables/player/usePlayerPage.ts` 的寫法：`createXxxPage()` + provide／inject、`useTimers().later()`、`mount()`／`unmount()` 清理、`disposed` 旗標
- 搬完先跑 `docs/tools/scan-color-order.cjs`（見 §4.5）

---

## 3. 搬遷計畫（架構）

### 3.1 路由（`src/router/index.ts`，history 模式，全部 lazy import）

| Route | 元件 | 原檔 | meta |
|---|---|---|---|
| `/` | `HomeView` | index.html | title `泰語學習機`、fonts home、viewport noZoom |
| `/thai` | `ThaiView` | thai.html | requiresAuth、title `🇹🇭 泰語學習機`、favicon 🇹🇭 |
| `/player` | `ThaiPlayerView` | thaiPlayer.html | requiresAuth、title `泰文隨身聽 - 單字自動播放`、viewport noZoomCover、lang zh-Hant |
| `/typing` | `ThaiTypingView` | thaiTyping.html | requiresAuth、title `泰文單字大師`、viewport noZoomCover、lang zh-Hant |
| `/downloader` | `ThaiDownloaderView` | thaiDownloader.html | requiresAuth、title `泰文音檔同步 Pro - 穩定版`、lang zh-Hant |
| `/path` | `PathEditorView` | path.html | requiresAuth、requiresAdmin、title `筆順產生器`、favicon 🖋️ |
| `/:pathMatch(.*)*` | `NotFoundView` | 404.html | title `404 - 找不到頁面`、favicon 🚀 |

`router.afterEach` → `applyPageMeta()`（`src/router/pageMeta.ts`）：設定 title、`<html lang>`、viewport、favicon、**每頁的 Google Fonts 連結（字重與原版完全相同）**。

| fonts | 用於 | 內容 |
|---|---|---|
| `FONTS.home` | `/` | Noto Sans TC 400;500;700;900 |
| `FONTS.thai` | `/thai` | Sarabun 400;500;700 + Noto Sans TC 400;500;700 |
| `FONTS.sarabun` | `/player`、`/typing`、`/path` | Sarabun 400;700 |
| `FONTS.downloader` | `/downloader` | Sarabun 400;500;600;700;800 + Inter 400;600;700 |
| `FONTS.notFound` | 404 | Noto Sans TC 400;500;700 |

### 3.2 元件拆分

```
src/
├─ App.vue / main.ts / sw.ts / config.ts / env.d.ts
├─ router/{index.ts, pageMeta.ts}
├─ views/{Home,Thai,ThaiPlayer,ThaiTyping,ThaiDownloader,PathEditor,NotFound}View.vue
├─ components/
│  ├─ common/OfflineAudioModal.vue ✅  // Player/Typing 共用下載確認/成功彈窗（成功訊息以 successMessage prop 帶入）
│  ├─ thai/  ✅ ThaiHeader, LearnSection, ToneTrainingSection, QuizSection, SentenceSection,
│  │           MemoryGameSection, ToneCalcModal, HelpModal, HandwritingModal
│  ├─ player/ ✅ PlayerHeader, CategoryBar, PlayerCard, PlayerControls, WordListModal
│  ├─ typing/ ✅ TypingHeader, TypingCard, TypingInputBar
│  └─ path/ ✅ CharPickerModal
├─ composables/
│  ├─ usePageShell.ts ✅   useTimers.ts ✅   thai/useThaiPage.ts ✅
│  ├─ player/usePlayerPage.ts ✅（播放、滑動、Media Session、語音清單都在這裡）  useWakeLock.ts ✅  useOfflineAudioDownload.ts ✅
│  └─ typing/useTypingPage.ts ✅  typing/useTypingSounds.ts ✅
├─ stores/
│  ├─ auth.ts ✅        thaiLearn.ts ✅
│  └─ cloud.ts ✅  vocabProgress.ts ✅  playerSettings.ts ✅
├─ services/{firebase.ts ✅, db.ts ✅, offlineAudio.ts ✅}
├─ data/{thai.ts ✅, thaiVocab.ts ✅}       // 原文複製，只加型別標註；已用腳本驗證與原版一致
├─ types/thai.ts ✅
├─ utils/{storage.ts ✅（safeStorage）, shuffle.ts ✅（shuffleArray 回傳新陣列 / shuffleInPlace 原地）}
└─ styles/
   ├─ main.css ✅ v3-compat.css ✅ legacy-common.css ✅
   └─ pages/{home.css ✅, not-found.css ✅, learning.css ✅}   // 已新增 player.css ✅、typing.css ✅、downloader.css ✅、path.css ✅
```

原則：**DOM 結構與 class 一字不改**（只做 v3→v4 必要改名），只是把 template 切到子元件。

### 3.3 Pinia store

| Store | 狀態 | 對應原版 |
|---|---|---|
| `auth` ✅ | `user`、`isLoading`、`errorMessage`、`isLoggedIn`、`isAdmin`、`ready`（Promise）；`init()`、`login()`、`logout()` | `js/auth.js`、`config.js`、index.html |
| `thaiLearn` ✅ | `isDark`(`theme`)、`showPinyin`、`speechRate`(`preferredRate`)、`favorites`、`mistakeList`、`correctCounts`；`syncToCloud()`、`resetOwnData()` | thai.html |
| `cloud` ✅ | `cachedThai`（雲端 `thai` 快取）；`loadThai()`（每頁重抓、有 thai 才快取並回傳）、`saveThai(payload)`（`{...cachedThai, ...payload}`）；`syncStatus` 放在各頁（原版每頁從 synced 開始） | Player/Typing/Downloader 的 `cachedCloudThaiData` + `syncToCloud` |
| `vocabProgress` ✅ | `customList`、`knownWords`（id 比對）、`brokenAudio`、`mp3History`；`loadFromStorage()`（每頁 setup 時重讀）；匯出 `migrateToId()`（th+zh → th 第一筆）。`applyCloudData(thai)`：套用雲端收藏／已學會／壞音檔名單 → UUID 遷移 → 寫回 localStorage，回傳是否需回寫雲端（Player、Typing 共用）；其餘 localStorage 寫入由各頁處理 | Player/Typing/Downloader 共用清單 |
| `playerSettings` ✅ | `isShuffle`、`repeatMode`、`playbackRate`、`speakChineseOrder`、`isMultiSelect`、`hideKnownWords`、`isDarkMode`、`selectedVoice`、`isFlashcardMode`、`selectedCategories`；store 內 watch 負責寫 localStorage，**值格式維持原始字串**（`"true"`、`"0"`）；`thai-last-word-th` 照原版直接讀寫 localStorage | thaiPlayer.html |

- 頁面暫時狀態（quiz、memory、playlist、typing words/input）放在 View 或頁面 composable，換頁即重置（同原版）
- 每頁 mount 時重新從雲端載入（等同原版每頁重新載入）
- Firestore 欄位寫入：
  - thai：`correctCounts, favorites, mistakeList, lastPlayTime`（不展開快取，同原版）
  - Player：`customList, brokenAudio, knownWords, lastSelectedCategories, lastPlayedWord, playerLastUpdated`（展開快取）
  - Typing：`customList, knownWords`（展開快取）
  - Downloader：`mp3History, playerLastUpdated`（展開快取）
- 存到 Firestore 前用 `JSON.parse(JSON.stringify())` 去除 Vue proxy

### 3.4 型別（`src/types/thai.ts`）
`ThaiItem`、`ThaiItemType`、`ToneClass`、`Sentence`、`TonePracticeSeries`、`ToneExample`、`ToneKey`、`VocabWord {id, th, zh}`、`VocabCategories`、`ThaiCloudData`（含 `brokenAudio`、`mp3History`）。

### 3.5 資料與資源
- `public/audio/TH/*.mp3`（650 個，hash 已驗證）、`public/icon-192x192.png`、`public/icon-512x512.png`
- 音檔網址一律用 `getAudioUrl(text, 'th' | 'zh')`（`src/services/offlineAudio.ts`），產生 `${BASE_URL}audio/TH/{th|zh}_{文字}.mp3`（`/` 換成 `_`）

---

## 4. 技術處理慣例（照這些做）

### 4.1 掛載結構
- `index.html` 掛載點是 `<div id="root" style="display: contents">`；**每個 View 的根元素寫成原版的 `<div id="app" class="...">`**（原版 #app 有什麼 class 就照抄），讓原版針對 `#app` 的 CSS 與 body 的 flex 版面不變
- 原版沒有 #app 包裝的頁面（如 404）就直接寫原版的根元素

### 4.2 `<html>`／`<body>` 的 class：`usePageShell`
```ts
usePageShell({
  htmlClass: 'shell-common shell-learning',   // CSS 範圍用
  bodyClass: '原版 <body class="..."> 全文（做 v3→v4 改名）',
})
```
- `onBeforeMount` 加上、`onBeforeUnmount` 移除（必須用 onBeforeUnmount，確保在下一頁掛載前清掉）
- 原版有載入 `css/common.css` 的頁面（index、thai、path）要加 `shell-common`

### 4.3 CSS 圖層與權重（最重要）
- 原版 Tailwind v3 Play CDN 是**無圖層**的 CSS，衝突時依「權重 → 先後順序」決定；v4 utilities 在 `@layer utilities`
- 做法：所有原版自訂 CSS 以 `@import "./xxx.css" layer(utilities);` 放在 `@import "tailwindcss";` **之前**（`main.css` 開頭先宣告 `@layer theme, base, components, utilities;`），讓它們和 Tailwind 同圖層、排在前面 → 權重相同時 Tailwind 勝（同原版：CDN 的 style 在 link 之後）
- 每頁原版 `<style>` 或 css 檔 → `src/styles/pages/<page>.css`，並在 `main.css` 加 import
- **範圍限定方式（保持原版權重）**：
  - 一般規則：`:where(html.shell-xxx) .selector`（:where 權重 0）
  - 原版 `body {...}`：`:where(html.shell-xxx) body {...}`
  - 原版 `.dark .x`：`.dark:where(.shell-xxx) .x`（保留 `.dark` 的權重）
  - 原版 `body.dark-mode .x` 這類：依原權重改寫，例如 `:where(html.shell-player) .dark-mode .x`
  - 捲軸：`:where(html.shell-xxx)::-webkit-scrollbar` 與 `:where(html.shell-xxx) ::-webkit-scrollbar` 兩個都寫
- `@keyframes` 名稱是全域的；不同頁同名但內容不同時要改名（例如 404 的 `fadeIn` → `fadeInUp` / `animate-fade-in-up`）。注意 typing 頁也有 `@keyframes shake`（與 learning.css 的 `shake` 內容不同），搬 typing 時要改名

### 4.4 `main.css` 已有的全域設定
- `@source not "../../legacy";`（不掃描 legacy）
- `@custom-variant dark (&:is(.dark *));`（與 v3.4 `darkMode: 'class'` 權重相同）
- `@custom-variant hover (&:hover);`（v3 的 hover 在觸控裝置也生效）
- `@theme`：`--color-*: initial` 後定義 **v3 hex 色票**（14 色 × 11 階，不用 OKLCH）；`--font-sans` / `--font-mono` 為 v3 預設字體堆疊；`--default-ring-width: 3px`、`--default-ring-color: rgb(59 130 246 / 0.5)`；index/404 的自訂動畫
- `@layer base`：v3 preflight 相容（預設 `border-color` gray-200、placeholder gray-400、button `cursor: pointer`）

### 4.5 Tailwind v3 → v4 class 對照
| v3（原版） | v4（新版寫法） | 說明 |
|---|---|---|
| `shadow-sm` | `shadow-xs` | 含 `hover:` 等變體 |
| `shadow`（無後綴） | `shadow` | v4 保留舊值，不用改 |
| `drop-shadow-sm` | `drop-shadow-xs` | |
| `drop-shadow`（無後綴） | `drop-shadow` | 不用改 |
| `rounded-sm` | `rounded-xs` | |
| `rounded`（無後綴） | `rounded` | 不用改 |
| `blur-sm` / `backdrop-blur-sm` | `blur-xs` / `backdrop-blur-xs` | |
| `backdrop-blur`（無後綴） | `backdrop-blur` | 不用改 |
| `outline-none` | `outline-hidden` | 含 `focus:`、`peer-focus:` |
| `bg-gradient-to-{dir}` | `bg-linear-to-{dir}/srgb` | `/srgb` 讓漸層以 sRGB 插值（v4 預設 oklab，顏色會不同） |
| `flex-grow` / `flex-shrink-0` | `grow` / `shrink-0` | |
| `space-x-2` | `v3-space-x-2` | v4 的 space-x 用 `:where()` 且設 margin-inline-end，與子元素 mr/mx 互動不同；相容 class 定義在 `src/styles/v3-compat.css`（其他數值需要時照樣新增） |
| `space-y-*` | `space-y-*` | 子元素沒有自己的 margin 時視覺相同，可不改；有衝突時比照 space-x 新增相容 class |
| `dark:bg-opacity-20`（及其他 `*-opacity-*`） | 在顏色上加 `/20`，例如 `dark:bg-green-100/20` | v4 已移除 opacity utilities |
| `ring`（無寬度） | `ring` | `--default-ring-width` 已設為 3px |
| `transform`、`filter` | 照抄 | v4 無作用但無害 |

另外：
- 原版 CSS 寫 `border: none` 的元素若同時有 Tailwind `border` class，v4 的 `.border` 會透過 `--tw-border-style` 把樣式設回 solid → 在該 CSS 規則加 `--tw-border-style: none;`（見 `learning.css` 的 `.active-tab`）
- 原版色票覆寫（`tailwind.config` 的 emerald/indigo/rose）與 v3 預設值相同，`@theme` 已涵蓋
- **同一元素有兩個同屬性的顏色 class**（例如 `bg-white` + `bg-emerald-100`）：已用 Tailwind v3.4.17 實際編譯驗證，**v3 與 v4 都依 class 名稱字母排序輸出**（`bg-black < bg-blue-* < … < bg-white`），勝出結果相同，**不需要處理**。Home、/thai、/player 全部組合已掃描確認一致（player 24 組、thai 52 組、index 無）
  - 搬新頁時用 `docs/tools/scan-color-order.cjs` 掃一次（使用方式寫在檔案開頭）；script 內組出來的 class 字串要人工確認
  - 注意：在 build 後的 CSS 用 grep 找位置時，`.bg-white` 會先比對到頁面自訂 CSS（如 `.dark-mode .bg-white`）或 `.bg-white\/50`，要找 Tailwind 區段的 `.bg-white{`

### 4.6 Safelist（`@source inline(...)`）
- Tailwind 會掃描 `.vue`／`.ts` 原始碼中的完整字串，所以寫在 template、TS 字串、`v-html` 內容字串裡的**完整 class 名**都抓得到
- **字串拼接**產生的 class（如 `'ring-' + color`）抓不到 → 加到 `main.css` 的 `@source inline("...")`（目前有 `ring-emerald-600 ring-blue-600 ring-gray-300 ring-gray-800`）

### 4.7 SPA 離開頁面的清理（原版換頁由瀏覽器處理，SPA 必須自己做）
- 所有 `setTimeout` 用 `useTimers()` 的 `later()` / `cancel()`，卸載時自動清除
- `onBeforeUnmount`：`speechSynthesis.cancel()`、暫停 `<audio>`、`speechSynthesis.onvoiceschanged = null`、移除 `keydown` 與其他 window/document listener、釋放 wake lock、清除 mediaSession handler、移除頁面加在 `<html>`／`<body>` 的狀態 class（如 `dark`、`dark-mode`、`ready`）
- 非同步載入（雲端資料）回來時檢查 `disposed` 旗標，頁面已卸載就不再寫入

### 4.8 頁面邏輯寫法
- 原版 `createApp({ setup() {...} })` 的內容盡量**一對一翻譯**成 TS（保留變數名、計時毫秒數、判斷順序、console 訊息）
- 頁面較大時：建立 `createXxxPage()` composable，在 View `provide`，子元件 `inject`（參考 `src/composables/thai/useThaiPage.ts`）
- template ref 綁到 inject 來的 ref 時，用函式 ref（`:ref="setEl"`），否則 vue-tsc 會報 unused
- localStorage 寫入：原版用 `safeStorage.set` 的用 `safeStorage.set`（JSON）；原版直接 `localStorage.setItem` 的（如 Player 的 `"true"` 字串）就照原格式
- 原版頁面內的 `<a href="xxx.html">` → `<RouterLink to="/xxx">`，class 照抄
- 一律 arrow function、`<script setup lang="ts">`

### 4.9 驗證技巧
- `pnpm build` 後可檢查 `dist/assets/index-*.css` 是否含預期規則（用 `grep -F -c`）
- data／音檔複製後用 hash 比對（scratchpad 的 verify 腳本做過一次）

---

## 5. 待搬頁面的重點摘要（來自第 1 步盤點）

### 5.1 thaiPlayer.html → `/player`
- body：`text-slate-800`；`<style>` 中 body 為 `font-family: 'Sarabun', 'Microsoft JhengHei'`、`background-color: #f8fafc`、`height: 100dvh`、`overflow: hidden`、flex column；`body.dark-mode` 背景 `#0f172a !important` 與一組 `.dark-mode .bg-white {...!important}` 等覆寫；`.thai-text`、`.player-card`、`.card-transitioning`、`.playing-glow`、`.no-scrollbar`、`.progress-bar-inner`、3D 翻牌（`.perspective-1000`、`.transform-style-3d`、`.backface-hidden`、`.rotate-y-180`）
- `#app` class：`w-full max-w-md mx-auto h-full flex flex-col bg-white shadow-2xl relative`
- 兩個 `<audio>`：`#silent-audio`（無聲 wav loop，CarPlay／藍牙用）、`#main-player`（playsinline）→ 放進 View template，用 ref 取得
- 播放流程：`playMediaWithFallback` 播 mp3，失敗退回 TTS（`isResolved` 鎖、過濾 AbortError）；第一段 → 300ms → 第二段 → 200ms → `handleNextAuto`（500ms）；中→泰／泰→中；循環模式 0 全部／1 不循環／2 單曲；隨機；速度 0.7/1.0/1.2/1.5（播放中切換立即生效）
- 第一次播放：播放 silent audio、main-player 設 silent wav 並 play、`speechSynthesis.speak('')` 解鎖，50ms 後 `playCurrent`
- 切卡動畫：150ms 後換字，再 50ms 取消 transitioning
- Wake Lock、Media Session（metadata + play/pause/prev/next）、左右滑動 > 50px、鍵盤 Space／←／→（INPUT 內不觸發）
- 分類：全部、6 類、自訂單字、已學會；單選／複選；點擊後 100ms `scrollIntoView` 到 `.cat-btn-{cat}`
- 隱藏已學會、單字卡模式（3D 翻牌）、顯示中文、壞音檔回報（→ 改寫入 **`thai-broken-audio`**／`brokenAudio`，然後 TTS 念「บันทึกแล้ว」）
- 清單彈窗：搜尋（跨分類、以 th 去重）、分類 tab、重置進度（confirm／alert）
- 下載彈窗：確認 → 進度 x/y → 300ms 後成功彈窗（`downloadModal`）；失敗用 alert
- 雲端：Loading 直到雲端資料載入完成；恢復 `lastSelectedCategories`、`customList`、`knownWords`、`lastPlayedWord`（寫回 `thai-last-word-th`）；UUID 遷移（含雲端，遷移後回寫）；`restoreLastPosition()`
- localStorage key：`thai-custom-list`、`thai-known-words`、`thai-selected-cats`、`thai-last-word-th`、`thai-shuffle`、`thai-repeat`、`thai-rate`、`thai-speak-order`、`thai-multi`、`thai-hide-known`、`thai-dark`、`thai-voice`、`thai-flashcard`、（新）`thai-broken-audio`
- 修正：重複的 `watch(isDarkMode)` 合併

### 5.2 thaiTyping.html → `/typing`
- body：`position: fixed; height: 100dvh; overflow: hidden; width: 100%`、Sarabun、`#app { height:100%; display:flex; flex-direction:column }`
- 三層文字疊加（灰底／下一字閃爍 `guide-pulse 1.5s` + 底線／綠字或紅字）、`<Transition name="card">`（`.card-enter-active` 等 CSS）
- 輸入：`inputmode="search"`、blur 時 50ms 後重新 focus、WebAudio 打字聲（square 1200→200Hz 15ms）、正確音（sine 880→1200）、錯誤音（triangle 150→100）
- 打完整字自動驗證、空白鍵驗證；答對停留 `max(1200, 長度*150+500)` ms；答錯 300ms 後清除錯誤狀態
- 發音：`th_{th}.mp3`（1.0x），失敗 TTS（rate 0.9、延遲 70ms）
- 分類可複選但至少保留 1 個；「全部」= 清空
- 首次互動（click/touch/keydown）解鎖音訊並補念第一個字
- **修正**：啟動先讀 localStorage；未登入／雲端無資料也要 `initGame`；收藏／已學會改用 `id` 比對
- `@keyframes shake` 與 learning.css 同名 → 改名

### 5.3 thaiDownloader.html → `/downloader`
- JSZip 3.10、FileSaver 2.0.5（已安裝 npm 套件 `jszip`、`file-saver`）
- 經 `api.codetabs.com`／`api.allorigins.win` 代理抓 Google TTS；每檔間隔 1.2 秒、每 20 個多等 1 秒、重試 2 次；產生 `thai_audio_assets.zip`（內含 `audio/TH/...`）
- 只讀寫 **`thai-mp3-history`**（已打包名單）與讀取 `thai-custom-list`；雲端 `mp3History`
- 右下角通知不加動畫

### 5.4 path.html → `/path`
- 管理員限定；載入 common.css + path.css（`.thai-font`、canvas cursor、`.no-select`、`#guide-text` 位移）
- 選字表只保留泰語輔音／元音 tab；`jpData` 相關邏輯移除
- canvas 編輯（左鍵新增／拖曳、右鍵刪除、雙擊斷筆）、圓潤度、復原、清空、匯入解析、輸出完整物件、複製（`document.execCommand('copy')`）

---

## 6. 環境備註
- TypeScript 固定 `~6.0.3`（TS 7 與 vue-tsc 3.3 不相容）
- 主要套件：Vue 3.5、vue-router 5、Pinia 4、Firebase 13、Vite 8、Tailwind 4.3、vite-plugin-pwa 2
- build 會有 Firebase 造成的 chunk > 500 kB 警告、pnpm 略過 `@firebase/util`／`protobufjs` 安裝腳本，皆不影響
- `.gitattributes` 統一 LF
