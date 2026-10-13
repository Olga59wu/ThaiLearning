# TODO

## 原版就有、目前照搬、之後再決定要不要修

> 搬遷原則是「一模一樣」，以下是對照時發現的原版怪異行為，目前**照原版保留**，之後再決定是否修正。

### 大廳（Home）
- [ ] body 的 `font-sans` class 權重高於 `common.css` 的 `body { font-family: 'Noto Sans TC' }`，大廳實際顯示的是系統字體，不是 Noto Sans TC
- [ ] body 的 `transition-colors` 覆蓋了 `body { transition: opacity 0.5s ease }`，登入狀態確定後的淡入效果不會出現（直接顯示）

### 泰語學習機（/thai）
- [x] ~~**聲調訓練的「挑戰」按鈕無法進入挑戰畫面**~~（已修正：新增 `enterToneChallenge`）：按鈕綁定 `startNewToneChallenge`，但該函式不會把 `toneTraining.mode` 設為 `'challenge'`，所以挑戰畫面（連勝、5 選 1）永遠看不到。原版在「對照」畫面按數字鍵 1–5 也會在背景觸發 `checkToneGuess`（已修正：數字鍵只在挑戰模式作答）
- [x] ~~**翻牌記憶提早顯示「恭喜通關」**~~（已修正：改為全部卡片配對完成才顯示）：判斷條件是 `memory.matched === 6`，但每配對一組 `matched += 2`，所以配對 3 組（共 6 組）時就會跳出通關畫面
- [x] ~~**「收藏複習」模式無法進入**~~（已修正：測驗範圍新增「收藏」按鈕）：程式有 `startQuiz('favorites')` 與 `quizModeLabel` 的「收藏複習」，但沒有任何按鈕觸發；收藏的星星目前只有存檔與同步，沒有用途
- [ ] **「複習錯題」的 Mode 標籤不會變**：`startQuiz('mistakes')` 沒有改 `currentMode`，所以標籤仍顯示「聽音辨字／看字選音」，範圍按鈕（基礎／單字／進階）也不會隱藏
- [ ] 從雲端載入的 `correctCounts`／`favorites`／`mistakeList` 不會寫回 localStorage，要等下一次變動才會存
- [ ] 語速滑桿 `v-model` 沒有 `.number`，拖動後 `preferredRate` 會以字串（例如 `"0.9"`）存入 localStorage
- [ ] 學習卡片有 `animationDelay` 樣式，但卡片沒有任何動畫，該樣式沒有作用

### 隨身聽（/player）
- [x] ~~**頂部「離線語音」按鈕看不到確認視窗**~~（已修正：`OfflineAudioModal` 移到 View 外層，與清單彈窗同層，按按鈕直接跳出確認視窗；Typing 原版就在外層，共用元件同樣適用）：下載確認／成功彈窗寫在「單字清單」彈窗（`v-if="isModalOpen"`）裡面，所以按按鈕只會把狀態設為顯示，畫面沒反應；之後打開單字清單時確認視窗才會跳出來。下載完成的成功視窗也只有清單開著時才看得到
- [x] ~~**選取的分類消失後會出錯**~~（已修正：`updatePlaylist` 遇到不存在的分類當作空清單，畫面顯示空狀態；已學會清空時比照自訂單字移除「已學會」分類並把清單 tab 切回第一個分類）：選了「已學會」分類後，在清單裡把已學會全部取消，`allCategories` 裡就沒有「已學會」，但 `selectedCategories` 仍保留它；之後任何重建清單的動作（切換隱藏已學會、隨機等）都會丟出 TypeError。若帶著這個狀態重新進入頁面，`onMounted` 在 `updatePlaylist()` 就中斷，雲端載入不會執行，畫面會**一直停在 LOADING**（「自訂單字」有 watch 處理，「已學會」沒有）
- [ ] 播放中的光暈 `.playing-glow` 被同權重、較晚輸出的 `shadow-xl` 覆蓋，淺色模式下看不到（深色模式的 `.dark-mode .player-card.playing-glow` 權重較高才看得到）
- [x] ~~從雲端恢復 `lastSelectedCategories` 時~~（已修正：分類 watch 也檢查 `isSyncingFromCloud`；UUID 遷移時仍會主動上傳一次），分類的 watch 沒有檢查 `isSyncingFromCloud` 鎖，所以每次進頁面載入完雲端資料都會立刻再上傳一次
- [x] ~~從雲端載入的 `brokenAudio`（原版 `mp3History`）不會寫回 localStorage~~（已修正：載入時寫入 `thai-broken-audio`），要等下一次回報壞音檔才會存
- [x] ~~同步狀態圖示的「同步失敗」永遠不會出現~~（已修正：`syncToCloud` 改看 `cloud.saveThai()` 的回傳值，失敗時 `syncStatus = 'error'`，同 Downloader）：`saveProgressToCloud` 內部吞掉錯誤，`syncToCloud` 的 catch 不會執行
- [ ] 開啟隨機模式時清單會洗牌兩次（`updatePlaylist()` 內已洗牌，watch 又洗一次），結果無差異

### 打字練習（/typing）
- [x] ~~**切換分類／重置遊戲時，發音會和 TTS 重疊**~~（已修正：比照隨身聽過濾 AbortError，並加上播放 token，舊的播放與延遲 70ms 的 TTS 在換題後不再發聲）：`initGame` 把 `currentIndex` 歸零時，`watch(currentIndex)` 先念一次，`nextTick` 又念一次；第二次的 `pause()` 中斷第一次的 `play()`（AbortError），`playMediaWithFallback` 沒有過濾 AbortError，於是同一個字再用 TTS 念一次，與 mp3 重疊。連續快速滑動切題、抽掉最後一張卡（index 改變 + 明確呼叫 `playCurrentWord`）也會發生，此時 TTS 念的是**上一個字**（Player 有過濾 AbortError，Typing 沒有）
- [x] ~~練習完成後「剩餘」顯示 1~~（已修正：`remainingCount` 在完成時為 0）（`currentIndex` 停在最後一題，`words.length - currentIndex` = 1）
- [x] ~~「自訂單字」或「已學會」被清空後，該分類按鈕消失但仍留在已選分類中~~（已修正：`pruneEmptyCategory()` 從已選分類移除；沒有已選分類時回到「全部」重新開始）；若它是唯一選取的分類，畫面直接顯示「練習完成！」，只能按「全部」離開
- [x] ~~從雲端載入的 `customList`／`knownWords` 不會寫回 localStorage~~（已修正：`vocabProgress.applyCloudData()` 統一套用雲端的收藏／已學會／壞音檔名單、UUID 遷移並寫回 localStorage，Player 與 Typing 共用），要等下一次點星星／打勾才會存
- [x] ~~同字多義的單字（`เย็น`、`จอง`）只會出現一個意思~~（已修正：練習清單去重與卡片動畫 key 改用 `id`）：清單以 `th` 去重

### 音檔打包（/downloader）
- [x] ~~**「ZIP 檔過小」警告永遠不會出現**~~（已修正：改用實際成功抓到的檔案數判斷，0 個時通知顯示「任務失敗」、不產生 ZIP，移除原本的 alert）：全部抓取失敗時 ZIP 仍含 `audio/TH/` 空資料夾（實測 204 bytes），大於判斷門檻 100 bytes，所以會直接下載一個空 ZIP，通知顯示「任務完成」
- [x] ~~**下載中仍可勾選／取消單字列與按全選／不選**~~（已修正：下載中鎖住列點擊、勾選框、全選、不選、只選未打包、↺ 按鈕；迴圈改走訪選取快照）（只有打包、重置按鈕 disabled）：迴圈直接走訪 `selectedWords`，取消勾選會讓迴圈跳過下一個字、新勾選的字會被加到最後一起抓；進度百分比以目前選取數計算，會超過 100% 或變成 0%
- [x] ~~「待抓」= 庫存 − 已就緒~~（已修正：只計算目前庫存中尚未打包的字）；已打包名單含有不在目前單字庫的字（例如已刪除的自訂單字）時數字不準，可能變負數
- [x] ~~已打包名單在 ZIP 產生之前就寫入並上傳；只要泰文或中文其中一個抓到就算已打包~~（已修正：ZIP 產生並觸發下載後才寫入並上傳；泰文與中文都抓到才算已打包）
- [x] ~~右上角「Cloud OK」只代表沒有正在上傳~~（已修正：`saveProgressToCloud` 改為回傳是否成功，失敗時顯示紅點與「Sync Failed」），上傳失敗（錯誤被 `saveProgressToCloud` 吞掉）也顯示 Cloud OK
- [x] ~~「✨ 只選機械音」~~（已改名為「✨ 只選未打包」）實際上是「只選尚未打包（Raw）」的字（與載入時預設選取相同）

### 筆順產生器（/path）
- [ ] 「📋 複製完整物件」在 1 秒內連按兩次，按鈕會一直停在「✅ 已複製」：第二次點擊把「✅ 已複製」記成原本文字，計時結束後又寫回去（底色會恢復綠色）
- [ ] 拖曳控制點時滑鼠移出畫布，`mouseleave` 只清掉 `isDragging`、沒有清掉拖曳索引，該點會一直顯示橘色，直到下次在畫布上放開滑鼠
- [ ] 雙擊「斷開筆畫」時，雙擊的第一下會先在該位置新增一個點（若不是點在既有控制點上），所以斷筆前目前筆畫會多一個點
- [ ] 匯入時若內容解析不到任何路徑（沒有 `M` 開頭的字串），畫布會被清空，但仍顯示「✅ 匯入成功！」
- [ ] 輸出字串用單引號包住且不跳脫，資料中的值若含 `'` 會產生錯誤的程式碼（目前泰文資料沒有這種值）
- [ ] 只支援滑鼠事件，觸控裝置無法編輯；複製使用已淘汰的 `document.execCommand('copy')`

## 部署

- [ ] 新的 Firebase Hosting site 網域確定後，到 Firebase Console → Authentication → Settings → **Authorized domains** 加入新網域，否則 Google 登入會失敗（`localhost` 預設已授權）
