<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { ALL_VOCAB_CATEGORIES } from '@/data/vocabCategories'
import { hasAudioFile } from '@/services/offlineAudio'
import { usePageShell } from '@/composables/usePageShell'
import { useTimers } from '@/composables/useTimers'
import { useCloudStore } from '@/stores/cloud'
import { useVocabProgressStore } from '@/stores/vocabProgress'
import { safeStorage } from '@/utils/storage'
import type { VocabWord } from '@/types/thai'

usePageShell({
  htmlClass: 'shell-downloader',
  bodyClass: 'p-4 md:p-8',
})

const cloud = useCloudStore()
const vocab = useVocabProgressStore()
const { later } = useTimers()

const wordsToDownload = ref<VocabWord[]>([])
const selectedWords = ref<VocabWord[]>([])
const isDownloading = ref(false)
const isFinished = ref(false)
const isFailed = ref(false) // 一個檔案都沒抓到：不產生 ZIP，通知顯示失敗
const currentIndex = ref(0)
const currentWordDisplay = ref('')
const isSyncing = ref(false)
const isSyncFailed = ref(false) // 最近一次上傳失敗時，右上角顯示失敗狀態

// 已打包名單：localStorage thai-mp3-history／雲端 thai.mp3History（壞音檔名單已拆到 thai-broken-audio）
// 只當紀錄用；是否就緒改看 public/audio/TH/ 實際的檔案（hasAudioFile，build 時掃描）
vocab.loadFromStorage()
const { mp3History: downloadedHistory } = storeToRefs(vocab)

// 泰文、中文音檔是否存在；兩個都有才算就緒
const hasTh = (w: VocabWord) => hasAudioFile(w.th, 'th')
const hasZh = (w: VocabWord) => hasAudioFile(w.zh, 'zh')
const isReady = (w: VocabWord) => hasTh(w) && hasZh(w)
// 單字的唯一值：用 id（同字多義的 เย็น、จอง 兩個意思的中文音檔不同）；沒有 id 的舊資料退回 th
const wordKey = (w: VocabWord) => w.id || w.th
/** 狀態標籤：Ready／缺 TH／缺 ZH／Raw（兩個都缺） */
const statusOf = (w: VocabWord): 'ready' | 'noTh' | 'noZh' | 'raw' =>
  isReady(w) ? 'ready' : !hasTh(w) && !hasZh(w) ? 'raw' : !hasTh(w) ? 'noTh' : 'noZh'

// 頁面卸載後停止下載迴圈（原版換頁時瀏覽器會直接中止）
let disposed = false
const abortController = new AbortController()
const wait = (ms: number) => new Promise<void>((r) => later(r, ms))

const syncToCloud = async () => {
  isSyncing.value = true
  try {
    const ok = await cloud.saveThai({
      mp3History: JSON.parse(JSON.stringify(downloadedHistory.value)) as string[],
      playerLastUpdated: Date.now(),
    })
    isSyncFailed.value = !ok
  } catch {
    isSyncFailed.value = true
  } finally {
    isSyncing.value = false
  }
}

const initializeCloudSync = async () => {
  try {
    const thai = await cloud.loadThai()
    if (disposed) return
    if (thai) {
      if (thai.mp3History) {
        downloadedHistory.value = thai.mp3History
        localStorage.setItem('thai-mp3-history', JSON.stringify(downloadedHistory.value))
      }
      if (thai.customList) {
        localStorage.setItem('thai-custom-list', JSON.stringify(thai.customList))
        refreshWordPool()
      }
    }
  } catch {
    // 原版忽略錯誤
  }
}

const refreshWordPool = () => {
  let all: VocabWord[] = []
  Object.values(ALL_VOCAB_CATEGORIES).forEach((l) => all.push(...l))
  const localCustom = safeStorage.get<VocabWord[]>('thai-custom-list', [])
  all = [...all, ...localCustom]
  const unique: VocabWord[] = []
  const seen = new Set<string>()
  // 以 id 去重（同字多義兩個意思都列出）；沒有 id 的舊自訂單字，泰文已在清單裡就略過
  all.forEach((w) => {
    if (seen.has(wordKey(w)) || (!w.id && unique.some((u) => u.th === w.th))) return
    seen.add(wordKey(w))
    unique.push(w)
  })
  wordsToDownload.value = unique
  selectMissing()
}

// ✨ 強化版下載函式：使用更穩定的代理並加入重試機制
const fetchMp3Blob = async (text: string, lang: string, retry = 2): Promise<Blob | null> => {
  const googleUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`
  // 嘗試多種代理方案
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(googleUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`,
  ]

  for (const proxy of proxies) {
    if (disposed) return null
    try {
      const res = await fetch(proxy, { signal: abortController.signal })
      if (res.ok) {
        const blob = await res.blob()
        if (blob.size > 500) return blob // 確保不是空檔案或錯誤頁面
      }
    } catch {
      if (!disposed) console.warn(`Proxy failed: ${proxy}`)
    }
  }

  if (retry > 0) return await fetchMp3Blob(text, lang, retry - 1)
  return null
}

const startDownload = async () => {
  if (isDownloading.value || selectedWords.value.length === 0) return
  isDownloading.value = true
  isFinished.value = false
  isFailed.value = false
  currentIndex.value = 0

  const zip = new JSZip()
  const audioFolder = zip.folder('audio')!.folder('TH')!
  let failCount = 0
  let successCount = 0 // 實際成功放進 ZIP 的檔案數
  const completedWords: string[] = [] // 泰文與中文都抓到的字，ZIP 下載後才寫入已打包名單

  // 下載中已鎖住選取，仍以快照走訪，避免清單變動影響迴圈
  for (const word of [...selectedWords.value]) {
    // 只抓缺少的檔案；兩個都有（手動選取要重抓）時兩個都抓
    const { th: needTh, zh: needZh } = filesToFetch(word)
    let bTh: Blob | null = null
    let bZh: Blob | null = null
    if (needTh) {
      // 處理泰文
      currentWordDisplay.value = `[泰] ${word.th}`
      bTh = await fetchMp3Blob(word.th, 'th')
      if (disposed) return
      if (bTh) {
        audioFolder.file(`th_${word.th.replace(/\//g, '_')}.mp3`, bTh)
        successCount++
      } else {
        failCount++
      }
      currentIndex.value++
      // 💡 修正：增加延遲，每抓一個音檔休息 1.2 秒，避免被封鎖
      await wait(1200)
    }
    if (needZh) {
      // 處理中文
      currentWordDisplay.value = `[中] ${word.zh}`
      bZh = await fetchMp3Blob(word.zh, 'zh-TW')
      if (disposed) return
      if (bZh) {
        audioFolder.file(`zh_${word.zh.replace(/\//g, '_')}.mp3`, bZh)
        successCount++
      } else {
        failCount++
      }
      currentIndex.value++
      // 💡 修正：增加延遲，每抓一個音檔休息 1.2 秒，避免被封鎖
      await wait(1200)
    }
    // 要抓的檔案都抓到才記入已打包名單（紀錄用）
    if ((!needTh || bTh) && (!needZh || bZh)) completedWords.push(word.th)
    // 每 10 個單字強迫休息一下，防止被 Google 封鎖
    if (currentIndex.value % 20 === 0) await wait(1000)
  }

  if (failCount > 0) {
    console.warn(`有 ${failCount} 個檔案下載失敗，ZIP 可能不完整。`)
  }

  // 一個檔案都沒抓到：顯示失敗、不產生 ZIP、不更新已打包名單
  if (successCount === 0) {
    isDownloading.value = false
    isFailed.value = true
    isFinished.value = true
    return
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  if (disposed) return
  saveAs(zipBlob, 'thai_audio_assets.zip')

  // ZIP 已產生並觸發下載，才寫入已打包名單並上傳
  completedWords.forEach((th) => {
    if (!downloadedHistory.value.includes(th)) downloadedHistory.value.push(th)
  })
  localStorage.setItem('thai-mp3-history', JSON.stringify(downloadedHistory.value))
  syncToCloud()

  isDownloading.value = false
  isFinished.value = true
  selectMissing()
}

/** 要抓哪些檔案：缺哪個抓哪個；都不缺（手動選取重抓）就兩個都抓 */
const filesToFetch = (w: VocabWord) => (isReady(w) ? { th: true, zh: true } : { th: !hasTh(w), zh: !hasZh(w) })

// 進度以實際要抓的檔案數計算
const totalWords = computed(() =>
  selectedWords.value.reduce((sum, w) => {
    const f = filesToFetch(w)
    return sum + (f.th ? 1 : 0) + (f.zh ? 1 : 0)
  }, 0),
)
// 已就緒：泰文、中文音檔都存在；待抓：缺任一個
const readyCount = computed(() => wordsToDownload.value.filter(isReady).length)
const pendingCount = computed(() => wordsToDownload.value.length - readyCount.value)
const progressPercent = computed(() =>
  totalWords.value === 0 ? 0 : Math.round((currentIndex.value / totalWords.value) * 100),
)
const selectAll = () => {
  if (isDownloading.value) return
  selectedWords.value = [...wordsToDownload.value]
}
const selectNone = () => {
  if (isDownloading.value) return
  selectedWords.value = []
}
// 只選實際缺檔的字
const selectMissing = () => {
  selectedWords.value = wordsToDownload.value.filter((word) => !isReady(word))
}
const selectMechanical = () => {
  if (isDownloading.value) return
  selectMissing()
}
const toggleRow = (word: VocabWord) => {
  if (isDownloading.value) return
  const idx = selectedWords.value.findIndex((w) => wordKey(w) === wordKey(word))
  if (idx > -1) selectedWords.value.splice(idx, 1)
  else selectedWords.value.push(word)
}

// 只清除已打包紀錄（不影響就緒判斷），之後只選實際缺檔的字
const resetHistory = () => {
  if (confirm('重置紀錄？')) {
    downloadedHistory.value = []
    localStorage.removeItem('thai-mp3-history')
    syncToCloud()
    selectMissing()
  }
}

// 已就緒的字要重抓：加入選取（並從已打包紀錄移除）
const forgetWord = (w: VocabWord) => {
  if (isDownloading.value) return
  downloadedHistory.value = downloadedHistory.value.filter((th) => th !== w.th)
  localStorage.setItem('thai-mp3-history', JSON.stringify(downloadedHistory.value))
  syncToCloud()
  if (!selectedWords.value.some((sw) => wordKey(sw) === wordKey(w))) selectedWords.value.push(w)
}

onMounted(() => {
  refreshWordPool()
  initializeCloudSync()
})

onBeforeUnmount(() => {
  disposed = true
  abortController.abort()
})
</script>

<template>
  <div id="app" class="max-w-4xl mx-auto">
    <!-- 新增：瀏覽器經代理抓取常失敗（代理掛掉、CORS），建議改用 Node 腳本 -->
    <div class="mb-4 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[12px] font-bold text-amber-700">
      💡 建議改用 <code class="px-1.5 py-0.5 rounded bg-white border border-amber-200 font-mono">pnpm audio:fetch</code>：直接把缺少的音檔寫進 public/audio/TH/，不經代理、不用解壓（加 --dry-run 只列出缺檔）
    </div>
    <header class="flex justify-between items-center mb-6 px-2">
      <div class="flex items-center gap-3">
        <div class="bg-blue-600 text-white p-2 rounded-xl shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">音檔同步 <span class="text-blue-600">Pro</span></h1>
      </div>
      <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[9px] font-black uppercase tracking-wider text-slate-400">
        <div :class="isSyncing ? 'bg-blue-500 animate-pulse' : (isSyncFailed ? 'bg-red-500' : 'bg-emerald-500')" class="w-1.5 h-1.5 rounded-full"></div>
        <span :class="{ 'text-red-500': isSyncFailed && !isSyncing }">{{ isSyncing ? 'Syncing' : (isSyncFailed ? 'Sync Failed' : 'Cloud OK') }}</span>
      </div>
    </header>

    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="compact-panel p-4 rounded-2xl"><p class="text-[10px] font-bold text-slate-400 uppercase mb-1">庫存</p><div class="text-2xl font-black text-slate-700">{{ wordsToDownload.length }}</div></div>
      <div class="compact-panel p-4 rounded-2xl border-emerald-100 bg-emerald-50/30"><p class="text-[10px] font-bold text-emerald-600/70 uppercase mb-1">已就緒</p><div class="text-2xl font-black text-emerald-600">{{ readyCount }}</div></div>
      <div class="compact-panel p-4 rounded-2xl border-blue-100 bg-blue-50/30"><p class="text-[10px] font-bold text-blue-600/70 uppercase mb-1">待抓</p><div class="text-2xl font-black text-blue-600">{{ pendingCount }}</div></div>
    </div>

    <div class="compact-panel rounded-3xl overflow-hidden flex flex-col shadow-xs">
      <div class="px-6 py-3 bg-slate-50/50 border-b flex justify-between items-center">
        <div class="flex gap-4">
          <button @click="selectAll" :disabled="isDownloading" class="text-[11px] font-bold text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed">全選</button>
          <button @click="selectMechanical" :disabled="isDownloading" class="text-[11px] font-bold text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">✨ 只選缺檔</button>
          <button @click="selectNone" :disabled="isDownloading" class="text-[11px] font-bold text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed">不選</button>
        </div>
        <div class="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">已選: {{ selectedWords.length }}</div>
      </div>

      <div class="h-[450px] overflow-y-auto custom-scroll">
        <div v-for="word in wordsToDownload" :key="wordKey(word)" class="word-item flex items-center gap-4 px-6 py-3" :class="[{'selected': selectedWords.some(w => wordKey(w) === wordKey(word))}, isDownloading ? 'cursor-not-allowed' : 'cursor-pointer']" @click="toggleRow(word)">
          <input type="checkbox" :checked="selectedWords.some(w => wordKey(w) === wordKey(word))" :disabled="isDownloading" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0" :class="isDownloading ? 'cursor-not-allowed' : 'cursor-pointer'">
          <div class="flex-1 flex items-center justify-between min-w-0">
            <div class="flex items-baseline gap-3 min-w-0">
              <span class="text-lg font-bold text-slate-700 tracking-tight truncate">{{ word.th }}</span>
              <span class="text-[11px] text-slate-400 font-medium truncate">{{ word.zh }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="statusOf(word) === 'ready'" class="text-[8px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 uppercase">Ready</span>
              <span v-else-if="statusOf(word) === 'raw'" class="text-[8px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-600 uppercase">Raw</span>
              <span v-else class="text-[8px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">{{ statusOf(word) === 'noTh' ? '缺 TH' : '缺 ZH' }}</span>
              <button v-if="statusOf(word) === 'ready'" @click.stop="forgetWord(word)" :disabled="isDownloading" title="重新抓取" class="p-1.5 text-slate-300 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-300"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 bg-slate-50/50 border-t flex gap-3">
        <button @click="startDownload" :disabled="isDownloading || selectedWords.length === 0" class="flex-[3] py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2">
          <span v-if="!isDownloading">⬇️ 打包音檔 (ZIP)</span>
          <span v-else class="flex items-center gap-2"><div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>正在抓取...</span>
        </button>
        <button @click="resetHistory" :disabled="isDownloading" class="flex-1 py-3.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-xl font-bold text-[10px] uppercase">重置</button>
      </div>
    </div>

    <!-- 右下角通知（原版的 animate-in slide-in-from-right-10 在 v3 沒有對應 class，本來就沒有動畫；照抄、不加動畫） -->
    <div v-if="isDownloading || isFinished" class="fixed bottom-6 right-6 w-80 bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 z-[100] animate-in slide-in-from-right-10 duration-500">
      <div class="flex items-center justify-between mb-3">
        <div class="text-[11px] font-black uppercase" :class="!isDownloading && isFailed ? 'text-red-500' : 'text-slate-800'">{{ isDownloading ? '同步抓取中...' : (isFailed ? '任務失敗' : '任務完成') }}</div>
        <div class="text-[11px] font-black text-blue-600">{{ progressPercent }}%</div>
      </div>
      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2"><div class="progress-fill h-full" :style="{ width: progressPercent + '%' }"></div></div>
      <div class="text-[9px] text-slate-400 font-bold truncate" v-if="isDownloading">處理中: {{ currentWordDisplay }}</div>
      <div class="text-[9px] text-red-500 font-bold" v-else-if="isFailed">❌ 沒有成功抓到任何音檔，未產生 ZIP。請重試或檢查網路。</div>
      <div class="text-[9px] text-emerald-500 font-bold" v-else>✅ ZIP 檔案已產生，若 audio 為空請重新下載。</div>
    </div>
  </div>
</template>
