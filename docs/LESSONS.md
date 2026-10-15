# 每週課程：新增課程流程

> 每週泰語課上完，用這份流程把當週內容加進泰語學習機（`/lessons`）。
> 資料結構見 `src/types/lesson.ts`，範例見 `src/data/lessons/lesson-01.ts`。

---

## 1. 流程

| # | 誰 | 做什麼 |
|---|---|---|
| 1 | 使用者 | 課本照片放進 `notes/lesson-XX/`（`notes/` 在 `.gitignore`，照片不進 git） |
| 2 | Claude | 讀照片，產生 `src/data/lessons/lesson-XX.ts`（格式見下方 §2） |
| 3 | Claude | **列出看不清楚或不確定的地方問使用者，不要猜**（特別是聲調、手寫字） |
| 4 | Claude | `pnpm test`、`pnpm build` 通過後 commit |
| 5 | 使用者 | 檢查內容：`pnpm dev` → `/lessons/XX`，對照課本確認拼音、聲調、中文 |
| 6 | Claude | 補音檔：`pnpm audio:fetch --dry-run` 列出缺檔給使用者確認 → `pnpm audio:fetch` 直接寫進 `public/audio/TH/`（失敗的再執行一次會重抓） |
| 7 | Claude | 使用者試聽沒問題後 commit 音檔 |
| 8 | 使用者 | 部署：`pnpm build && firebase deploy --only hosting:thai`（網址 https://thai-learning-og.web.app；新增課程不需要部署 `firestore:rules`） |

補充：
- 新增檔案就好，`registry.ts` 會自動收集 `lesson-*.ts`；大廳卡片的「最新一課」標籤也會自動更新
- 使用者目前**還沒學泰文字母**（只學過泰文數字）：畫面以「課本拼音＋聲調」為主，泰文字只當參考（可用頁首「泰文字」開關隱藏）。新增的說明文字不要直接寫泰文字
- 使用者的**鉛筆手寫補充一律不收**，只收課本印刷的內容

## 2. 資料檔格式

### 2.1 基本欄位
```ts
const lesson: Lesson = {
  no: 2,                 // 課次，網址 /lessons/2
  date: '2026-10-19',    // 上課日期（照片上沒有就問使用者）
  title: '主題',
  category: '第2課',     // 隨身聽／打字練習的分類名稱：固定「第N課」，不可有 emoji 或空白（測試會檢查）
  blocks: [ ... ],
}
export default lesson
```

### 2.2 音節：`sy('泰文 拼音 聲調')`
照課本寫法，一段一個音節，用 `|` 分隔；聲調符號：`—` 中、`ˇ` 低、`ˋ` 降、`~` 高、`/` 升（課本的「v」就是 `ˇ`）。
```ts
sy('ยี่ yi ˋ | สิบ sib ˇ | เอ็ด ed ˇ')
```
泰文欄用課本的**發音拼法**（例如 สวัสดี 拆成 `สะ`、`หวัด`、`ดี`），拼音用課本的拼法（`sib` 不是 `sip`）。

### 2.3 重複的字詞用 ref 連結，不要複製
先查現有資料：`src/data/thaiVocab.ts`（隨身聽單字，有 id）、`src/data/thai.ts` 的 `thaiData`（/thai 的字，用 `char`）、`sentenceData`（/thai 的句子，用 `thai`）。
```ts
// 現有單字：th／zh 自動帶入
{ kind: 'ref', ref: { vocabId: 'th-0207', thaiChar: '๑' }, num: 1, syllables: sy('หนึ่ง neung ˇ') }
// 新字：給固定 id，格式 lXX-NNNN（XX＝課次）
{ kind: 'new', id: 'l02-0001', th: '...', zh: '中文（分類顯示用，簡短）', syllables: sy('...') }
```
- **id 一旦 commit 就不能改**（收藏、已學會用 id 記錄）
- 新字的 th 不可和現有單字重複（測試會檢查，重複就改用 ref）
- `meaning`：課本上的完整中文（課程頁、考試用）；沒有時用 zh
- `num`：數字字詞的值，測試會比對 `numberToThai(num)` 與音節聲調
- `inCategory: false`：不放進「第N課」分類

### 2.4 區塊類型
| type | 用途 | 重點欄位 |
|---|---|---|
| `vocab` | 單字表 | `layout`: `numbers`（數字卡片，有 ✍️ 手寫）／`units`（表格）／`plain`；`titleTh` 泰文標題（小字） |
| `currency` | 貨幣 | `words`、`denominations`（唸法由數字函式產生） |
| `rules` | 規則 | `text` 裡的泰文用 `{泰文}` 標記（例如 `唸 {เอ็ด}`），畫面顯示成拼音；目前只支援數字詞，其他字要擴充 `numberWordSyllables` |
| `phrases` | 常用語 | `base`（原形，不含 ครับ/ค่ะ）、`particles`、`variants`（放進分類的語尾版本與 id）、`confusableWith`（意思重疊的句子 id，雙向都要寫） |
| `notes` | 筆記 | 純文字，不含泰文字 |
| `homework` | 作業 | `numbers` 範圍（格子可翻開唸法、✍️ 練寫） |
| `practice` | 練習設定 | `numberReading` 數字範圍 |
| `exam` | 考試設定 | `numbers` 數字範圍、`questions` 題型與題數 |

### 2.5 考試題型
| 題型 | 內容 | 資料來源 |
|---|---|---|
| `digitChoice` | 數字 → 選泰文數字（易混淆 ๒/๓、๔/๕、๘/๙） | `exam.numbers` |
| `digitInput` | 泰文數字 → 輸入數字 | `exam.numbers` |
| `digitHandwrite` | 數字 → 手寫泰文數字，看答案後自評 | `exam.numbers` |
| `readingChoice` | 數字 → 選唸法（常見錯誤 song-sib 等） | `exam.numbers` |
| `listenNumber` | 聽發音 → 選數字 | `exam.numbers` |
| `unitMeaning` | 單位 → 選中文 | 有 `placeValue` 的字詞 |
| `phraseMeaning` | 常用語 → 選中文 | `phrases` 區塊 |

新的內容類型（例如一般單字 → 中文）需要新增題型時，改 `ExamQuestionType`（`types/lesson.ts`）、`utils/lessonExam.ts` 的出題、`ExamQuestionCard.vue` 的顯示，並補測試。
累積考：題型取第 1 課到本課的聯集，題數取各課設定的最大值。

## 3. 音檔
- 「第N課」分類裡的字（`inCategory` 的單字、常用語原形、`variants`）會出現在 `/downloader` 的「待抓」，打包後放 `public/audio/TH/`
- **`pnpm audio:fetch`**（`scripts/audio-fetch.ts`）：掃描 `ALL_VOCAB_CATEGORIES` 與 `public/audio/TH/`，從 Node 直接請求 Google TTS（同 /downloader 的來源與語速：`translate_tts`、`client=tw-ob`、泰文 `th`、中文 `zh-TW`），每個檔案間隔 1.2 秒、每 20 個多休息 1 秒、失敗重試 2 次；`--dry-run` 只列出缺檔；完成後列出成功／失敗
  - 透過 Vite `ssrLoadModule` 載入網站的資料與 `audioFileName()`，檔名規則與網站一致
  - 自訂單字存在瀏覽器 localStorage，腳本讀不到；要補自訂單字的音檔仍用 `/downloader`
  - 中文念的文字會清理（檔名不變）：括號與括號內容不念、「/」改成「，」，例如「你好/再見 (女用)」念「你好，再見」。只套用在新抓的檔案；現有的 mp3（例如「我 (男用)」）不重抓
- `/downloader` 保留（頁面上方提示改用 `pnpm audio:fetch`），依 `public/audio/TH/` 實際的檔案判斷（build／dev 啟動時掃描，`hasAudioFile()`）；泰文、中文都有才算就緒
- 播放時沒有檔案就直接用 TTS（隨機數字、面額、ครับ 版常用語、規則例子，以及還沒打包的新字）

## 4. 考試紀錄
- 本機 `localStorage` `thai-lesson-exams`：完整紀錄（含錯題），每課最多 20 筆
- 雲端 `users/{uid}.thai.lessonExams`：摘要（每課只有最近一次帶錯題），與舊網站共用 `firestore.rules`，規則不用改
