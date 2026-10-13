# 語言學習中心 (LearnLang)

這是一個具備雲端同步與離線雙軌架構的多語系漸進式網頁應用程式 (PWA)。專注於以沉浸式介面 (UI/UX) 與系統化工具，提供泰語、日語與韓語等語言的高效學習環境。

## ✨ 核心系統特色

1. **🚀 跨平台 PWA (Progressive Web App)**
   - 支援將網頁直接「安裝至桌面或手機主畫面」，享受與原生 App 無異的全螢幕體驗。
   - 搭載 `sw.js` (Service Worker) 快取機制，載入後即可支援高度離線運作。
2. **☁️ Firebase 雲端雙向同步**
   - 整合 Firebase Authentication，提供跨裝置無縫體驗。
   - 獨立的資料隔離架構，能自動將用戶專屬的「已學會清單」、「自訂單字」與「離線語音進度」即時存入 Firestore。
3. **🎧 智慧語音與離線打包引擎**
   - 支援 Web Speech API 即時文字轉語音 (TTS)。
   - 提供專屬的 **Downloader 工具 (ZIP 打包器)**：能無縫抓取 Google TTS 原生音訊並封裝為離線 MP3，確保在背景播放、iOS 螢幕鎖定或無網路環境下皆能流暢播音。

---

## 📚 語系學習模組

### 🇹🇭 泰語生態系 (Thai Module)
泰文字母複雜度高，系統專注於解析聲調與精確輸入：
* **泰文核心** (`thai.html`)：系統化子音、母音對照與基礎字彙。
* **沉浸式隨身聽** (`thaiPlayer.html`)：
  - 支援單字卡 (Flashcard) 背誦模式大字體顯示。
  - 多段變速播放 (0.7x ~ 2.0x 飆速) 與自動區段循環。
* **泰文打字練習** (`thaiTyping.html`)：以實戰方式熟悉泰文鍵盤佈局，即時運算並解析泰文發聲與聲調規律。
* **泰語音檔打包器** (`thaiDownloader.html`)：批次產生泰文本地音檔，供離線核心使用。

### 🇯🇵 日語生態系 (Japanese Module)
專注於漢字記憶、Furigana 友善排版與應用情境：
* **日文核心** (`japan.html`)：五十音表對照與基礎單字體系。
* **日文隨身聽** (`jpPlayer.html`)：
  - 內建**日式標準注音 (Furigana)** 排版架構（`<ruby>` 實作），漢字與假名完美對齊。
  - 提供獨立的「隱藏中文」與「隱藏假名」切換按鈕，適合各階段學習者盲測記憶。
* **日語音檔打包器** (`jpDownloader.html`)：透過雲端 API 即時翻譯與打包日文語音庫。

### 🇰🇷 韓語支援 (Korean Module)
* **韓語核心** (`korean.html`)：韓文字母拼讀與組合邏輯基礎。

---

## 🛠️ 開發與專案結構

本專案元件高度靜態化，易於部署且無須複雜的後端自建伺服器。前端架構已大量導入 **Vue 3 (Composition API)** 進行宣告式狀態管理，並採用 **Tailwind CSS** 建立現代化介面。

### 核心目錄架構
```text
.
├── /audio/       # 離線多媒體實體音檔存放區（由 Downloader 產出匯入）
├── /css/         # 共用樣式庫
├── /js/          # 核心邏輯、模組化工具與 Firebase 連線層
│   ├── auth.js       - Firebase 認證與登入狀態封裝
│   ├── dbService.js  - Firestore 資料存取與自動雲端同步
│   └── utils.js      - 共用工具函式庫
├── /data/        # 靜態字庫資源 (如 jpTyping.js)
├── sw.js         # Service Worker 快取與 PWA 核心控制站
└── index.html    # 全域入口導航首頁
```

### 開發環境規範
* **Runtime**：遵循 Volta 環境控管機制，專案 Node.js 執行版本鎖定為 `24.14.0` (`package.json`)。

### 部署指南
本專案專為 Firebase Hosting 量身優化：
1. 本地檢視：使用 IDE 內建的 Live Server 即可啟動。
2. 進行發佈：
   ```bash
   firebase login
   firebase deploy --only hosting
   ```
