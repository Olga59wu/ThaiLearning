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
- 使用者的**鉛筆手寫補充從第 2 課起每課都收**（第 1 課不補）：先把所有鉛筆筆記列出來（頁碼、對應的母音或單字、辨識內容；看不清楚的標「無法辨識」不要猜），使用者確認後才寫進資料檔的 `pencil` 欄位；課程頁用和課本印刷內容不同的樣式顯示

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
課本有時用「第 N 聲」：第 1 聲＝中 `—`、第 2 聲＝低 `ˇ`、第 3 聲＝降 `ˋ`、第 4 聲＝高 `~`、第 5 聲＝升 `/`（`utils/tone.ts` 的 `TONE_ORDINAL`／`toneOrdinalLabel()`）。

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
- `zhSpeak`：中文音檔要念的文字（`pnpm audio:fetch` 用）。沒填時會清理 zh：去掉括號與括號內容、「/」改成「，」（例如「你好/再見 (女用)」念「你好，再見」）。**括號內的說明是這個字的重點時要填**，例如 กระผม 的 zh 是「我 (男用，謙卑)」，`zhSpeak: '我，男生謙卑'`；常用語 ค่ะ 版的「(女用)」照清理規則拿掉，不用填

### 2.4 區塊類型
| type | 用途 | 重點欄位 |
|---|---|---|
| `vocab` | 單字表 | `layout`: `numbers`（數字卡片，有 ✍️ 手寫）／`units`（表格）／`plain`；`titleTh` 泰文標題（小字） |
| `currency` | 貨幣 | `words`、`denominations`（唸法由數字函式產生） |
| `rules` | 規則 | `text` 裡的泰文用 `{泰文}` 標記（例如 `唸 {เอ็ด}`），畫面顯示成拼音；目前只支援數字詞，其他字要擴充 `numberWordSyllables` |
| `phrases` | 常用語 | `base`（原形，不含 ครับ/ค่ะ）、`particles`、`variants`（放進分類的語尾版本與 id）、`confusableWith`（意思重疊的句子 id，雙向都要寫） |
| `notes` | 筆記 | 純文字，不含泰文字 |
| `homework` | 作業 | `numbers` 範圍（格子可翻開唸法、✍️ 練寫） |
| `practice` | 練習設定 | `numberReading` 數字範圍；`vowels` 母音練習的模式（見 §2.6） |
| `exam` | 考試設定 | `numbers` 數字範圍（沒有數字題可省略）、`questions` 題型與題數 |
| `vowels` | 母音表 | `vowels`（`LessonVowel`：課本字形 `form`、搭配 อ `withO`、拼音、注音、聲調、長短、分組、`thaiChar` 必填，連結 thaiData）、`groupPencil`；寫法（`writeBase`）、筆順、念法、位置、已停用（`deprecated`）一律用 thaiData 的，課程檔不自己存 |
| `pronouns` | 人稱代名詞表 | `words`（不重複的字）、`cells`（人稱 × 男女 × 等級 → `wordId`） |
| `usage` | 用法 | `items`：`label`（例如「複數」）＋ `word` ＋ `pattern`（例如「＋人稱代名詞」）＋ `examples` |

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
| `vowelSound` | 看母音字形 → 選發音（拼音＋注音＋聲調，不顯示泰文） | `vowels` 區塊；錯誤選項先放長短音另一半（อิ／อี）、再放發音相近的（โอะ／เอาะ、เอะ／แอะ…），同音的不重複 |
| `vowelListen` | 聽發音 → 選母音字形 | 同上；同音的（ใ-／ไ-）不同時出現 |
| `vowelLength` | 看母音 → 長音／短音 | 短音、長音、獨立母音（特殊母音不出） |
| `vowelHandwrite` | 看發音 → 手寫母音，看答案後自評 | 有筆順的母音才出（底圖 อ 淺色＋筆順動畫） |
| `vowelPosition` | 看母音 → 選位置（前／後／上／下／夾，固定順序） | thaiData meaning 括號內的位置說明（`vowelPositionKey`）；ใ、ไ 的「前/心卷」「前/木卷」算「前」，答案顯示完整說明 |
| `pronounChoice` | 看情境（例如「我・女生・禮貌」）→ 選拼音 | `pronouns` 區塊；錯誤選項優先同一人稱的其他說法 |

新的內容類型（例如一般單字 → 中文）需要新增題型時，改 `ExamQuestionType`（`types/lesson.ts`）、`utils/lessonExam.ts` 的出題、`ExamQuestionCard.vue` 的顯示，並補測試。
累積考：第 1 課到本課**每課各自出題**，每種題型的題數是該課設定的一半（無條件進位、至少 1 題），題目從該課的題庫抽；錯誤選項從所有課合併的題庫挑（跨課的 confusableWith 一樣有效）。本課考試維持設定的題數。
題數不超過題庫大小，題庫是空的題型不出（例如還沒有筆順時的 `vowelHandwrite`）；考試設定畫面顯示的是實際題數。

### 2.6 母音練習（`practice` 區塊的 `vowels`）
```ts
{ type: 'practice', vowels: ['sound', 'listen', 'length', 'position', 'handwrite', 'pairs'] }
```
| 模式 | 內容 | 對應考試題型 |
|---|---|---|
| `sound` | 看字選音 | `vowelSound` |
| `listen` | 聽音選字 | `vowelListen` |
| `length` | 長短音（特殊母音不出） | `vowelLength` |
| `position` | 位置 | `vowelPosition` |
| `handwrite` | 手寫（題目出現就自動播放發音；有筆順的才出） | `vowelHandwrite` |
| `pairs` | 長短對照聽：列出長短音配對，點一組連續播放短音、長音（`playSequence`），不是測驗 | — |

- 題目是本課的母音；不計分、不存紀錄、題數不限，畫面顯示答對數／總數與連續答對次數（換模式不歸零）
- 出題和考試共用：`practiceVowelQuestion` → `vowelPool`、`vowelQuestion`（錯誤選項規則相同），畫面共用 `ExamQuestionCard`（`practice` 模式：不顯示進度與題號）
- 範圍：全部／短音／長音／特殊母音／獨立母音（`practiceVowels`），「排除已停用」預設勾選；錯誤選項不受範圍限制（短音範圍仍會出長音的另一半），只排除已停用
- 長短對照聽：範圍內有其中一個就列出（`vowelLengthPairs`），排除已停用時 ฦ／ฦๅ 整組不列

## 3. 音檔
- 「第N課」分類裡的字（`inCategory` 的單字、常用語原形、`variants`）會出現在 `/downloader` 的「待抓」，打包後放 `public/audio/TH/`
- **`pnpm audio:fetch`**（`scripts/audio-fetch.ts`）：掃描 `ALL_VOCAB_CATEGORIES` 與 `public/audio/TH/`，從 Node 直接請求 Google TTS（同 /downloader 的來源與語速：`translate_tts`、`client=tw-ob`、泰文 `th`、中文 `zh-TW`），每個檔案間隔 1.2 秒、每 20 個多休息 1 秒、失敗重試 2 次；`--dry-run` 只列出缺檔；完成後列出成功／失敗
  - 透過 Vite `ssrLoadModule` 載入網站的資料與 `audioFileName()`，檔名規則與網站一致
  - 另外抓**母音的念法**（只有泰文，例如 `th_สระอะ.mp3`）：`src/data/lessons/vowels.ts` 的 `VOWEL_AUDIO_TEXTS`（thaiData 母音的 `speakText`），母音不在分類裡（隨身聽不播）
  - 自訂單字存在瀏覽器 localStorage，腳本讀不到；要補自訂單字的音檔仍用 `/downloader`
  - 中文念的文字（檔名不變）：字詞有 `zhSpeak` 就念它；沒有才清理：括號與括號內容不念、「/」改成「，」，例如「你好/再見 (女用)」念「你好，再見」。只套用在新抓的檔案；現有的 mp3（例如「我 (男用)」）不重抓
- `/downloader` 保留（頁面上方提示改用 `pnpm audio:fetch`），依 `public/audio/TH/` 實際的檔案判斷（build／dev 啟動時掃描，`hasAudioFile()`）；泰文、中文都有才算就緒
- 播放時沒有檔案就直接用 TTS（隨機數字、面額、ครับ 版常用語、規則例子，以及還沒打包的新字）

## 4. 考試紀錄
- 本機 `localStorage` `thai-lesson-exams`：完整紀錄（含錯題），每課最多 20 筆
- 雲端 `users/{uid}.thai.lessonExams`：摘要（每課只有最近一次帶錯題），與舊網站共用 `firestore.rules`，規則不用改

## 5. 母音（第 2 課起）
- **寫法、念法、筆順只有一個來源**：thaiData 的母音（`src/data/thai.ts`，`type: 'vowel'`）
  - `writeBase`：用 อ 表示子音位置的寫法（`◌ะ` → `อะ`、`◌ือ` → `อื`、`ฤ` → `ฤ`）。/thai 卡片、手寫底圖、/path 底字、課程頁共用
  - `speakText`：念法，照課本 p40「สระ＋母音發音」（`สระอะ`）；獨立母音不加 สระ（`รึ`、`รือ`）。/thai、課程頁、考試都念它，音檔是 `th_สระอะ.mp3`
  - `strokes`：筆順，對著 writeBase 畫（/path「泰語元音」tab 的底字就是 writeBase）
  - `char`（`◌ะ`）不改：它是收藏、錯題、課程 ref 的識別碼
- 課本的母音一律先加進 thaiData（照 ฤ、ฤๅ、ฦ、ฦๅ 的格式），課程檔只用 `thaiChar` 連結；已停用的字在 thaiData 標 `deprecated: true`（/thai 卡片、課程頁顯示「已停用」並降低透明度；/thai 聽音辨字、看字選音、翻牌記憶不出，課程考試照常出題）。筆順在 /path 畫，輸出框上方會標明要取代 thai.ts 的哪一筆
- 查詢一律用 `src/data/lessons/vowels.ts`（`vowelWriteBase`、`vowelSpeakText`、`vowelStrokes`）或 `src/data/thaiWriteBase.ts`（/thai：用 char 查，舊錯題物件沒有這些欄位）
- **全站母音一律用淺色 อ 寫法，不使用 -**（課本表格的 `-ิ` 只存在資料的 `form`，不顯示在畫面上；iPhone Safari 也會在「-」加上下母音前面補虛線圈 ◌）
  - 畫法：`components/common/VowelText.vue`（canvas，淺色 อ＋深色母音、粗體；獨立母音 ฤ、ฤๅ、ฦ、ฦๅ 沒有 อ，整個字深色）。/thai 直接用它，課程頁、考試用 `components/lessons/VowelForm.vue`（同一個元件，配色從 store 取）
  - 句子裡的小字（例如「搭配母音 อึ 和 อื」）用 `<VowelForm inline>`：一般字重、母音同句子的灰色、อ 比卡片稍深（`VOWEL_INLINE_COLORS`）
  - 母音卡片：寫法下面的綠字是 สระ 名稱（`vowelLabel`：thaiData 的 `thaiLabel`，例如 `สระอะ`、`ตัว ฤ`），和 /thai 一樣
  - 考試的題目、選項、答案用 VowelForm；結果頁、歷次紀錄的文字是 writeBase（`อิ`），由 `ExamLabel.vue` 判斷（`isVowelWriteBase`）改用 VowelForm 畫。測試會檢查考試文字不含「-」
- 手寫底圖的版面規則（字高 68%、放不下縮小、超出邊距平移）在 `src/utils/guideLayout.ts`，/path、課程頁、/thai 共用；`/dev/vowel-guides`（只有 `pnpm dev`）可以一次檢查 32 個底圖與筆順對齊
