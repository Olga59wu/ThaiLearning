# TODO

## 原版就有、目前照搬、之後再決定要不要修

> 搬遷原則是「一模一樣」，以下是對照時發現的原版怪異行為，目前**照原版保留**，之後再決定是否修正。

### 大廳（Home）
- [ ] body 的 `font-sans` class 權重高於 `common.css` 的 `body { font-family: 'Noto Sans TC' }`，大廳實際顯示的是系統字體，不是 Noto Sans TC
- [ ] body 的 `transition-colors` 覆蓋了 `body { transition: opacity 0.5s ease }`，登入狀態確定後的淡入效果不會出現（直接顯示）

### 泰語學習機（/thai）
- [ ] **聲調訓練的「挑戰」按鈕無法進入挑戰畫面**：按鈕綁定 `startNewToneChallenge`，但該函式不會把 `toneTraining.mode` 設為 `'challenge'`，所以挑戰畫面（連勝、5 選 1）永遠看不到。不過在「對照」畫面按數字鍵 1–5，仍會在背景觸發 `checkToneGuess`
- [ ] **翻牌記憶提早顯示「恭喜通關」**：判斷條件是 `memory.matched === 6`，但每配對一組 `matched += 2`，所以配對 3 組（共 6 組）時就會跳出通關畫面
- [ ] **「收藏複習」模式無法進入**：程式有 `startQuiz('favorites')` 與 `quizModeLabel` 的「收藏複習」，但沒有任何按鈕觸發；收藏的星星目前只有存檔與同步，沒有用途
- [ ] **「複習錯題」的 Mode 標籤不會變**：`startQuiz('mistakes')` 沒有改 `currentMode`，所以標籤仍顯示「聽音辨字／看字選音」，範圍按鈕（基礎／單字／進階）也不會隱藏
- [ ] 從雲端載入的 `correctCounts`／`favorites`／`mistakeList` 不會寫回 localStorage，要等下一次變動才會存
- [ ] 語速滑桿 `v-model` 沒有 `.number`，拖動後 `preferredRate` 會以字串（例如 `"0.9"`）存入 localStorage
- [ ] 學習卡片有 `animationDelay` 樣式，但卡片沒有任何動畫，該樣式沒有作用

## 部署

- [ ] 新的 Firebase Hosting site 網域確定後，到 Firebase Console → Authentication → Settings → **Authorized domains** 加入新網域，否則 Google 登入會失敗（`localhost` 預設已授權）
