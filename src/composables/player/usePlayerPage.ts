import { computed, inject, provide, ref, shallowRef, watch, type InjectionKey } from 'vue'
import { storeToRefs } from 'pinia'
import { ALL_VOCAB_CATEGORIES, LESSON_CATEGORY_ICON, lessonNoOfCategory } from '@/data/vocabCategories'
import { getAudioUrl, hasAudioFile } from '@/services/offlineAudio'
import { useAuthStore } from '@/stores/auth'
import { useCloudStore } from '@/stores/cloud'
import { usePlayerSettingsStore } from '@/stores/playerSettings'
import { migrateToId, useVocabProgressStore } from '@/stores/vocabProgress'
import { useTimers } from '@/composables/useTimers'
import { useWakeLock } from '@/composables/useWakeLock'
import { useOfflineAudioDownload } from '@/composables/useOfflineAudioDownload'
import { shuffleInPlace } from '@/utils/shuffle'
import type { VocabCategories, VocabWord } from '@/types/thai'

type Timer = ReturnType<typeof setTimeout>

// 單字的唯一值：用 id（同字多義的 เย็น、จอง 兩個意思都要出現）；沒有 id 的舊資料退回 th
const wordKey = (w: VocabWord) => w.id || w.th

const VOCAB_DATA = ALL_VOCAB_CATEGORIES
// 喚醒實體播放器給 CarPlay 抓取用的無聲 wav
export const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/**
 * thaiPlayer.html 的頁面邏輯（原版 createApp setup 的內容）。
 * 在 ThaiPlayerView 建立並 provide，子元件以 usePlayerPageContext() 取得。
 * initialCategory：從課程頁進來時（/player?cat=第1課）只選這個分類
 */
export const createPlayerPage = (options: { initialCategory?: string } = {}) => {
  const authStore = useAuthStore()
  const cloud = useCloudStore()
  const vocab = useVocabProgressStore()
  const { customList, knownWords, brokenAudio } = storeToRefs(vocab)
  const settings = usePlayerSettingsStore()
  const {
    selectedCategories, isShuffle, repeatMode, playbackRate, speakChineseOrder,
    isMultiSelect, hideKnownWords, isDarkMode, selectedVoice, isFlashcardMode,
  } = storeToRefs(settings)
  const { later, cancel } = useTimers()
  const { wakeLock, requestWakeLock, releaseWakeLock } = useWakeLock()

  const isLoading = ref(true)
  const {
    isDownloading, downloadModal, closeDownloadModal, downloadProgress, downloadTotal, startDownload, executeDownload,
  } = useOfflineAudioDownload()

  // 兩個 <audio> 由 View 的 template ref 設定
  let mainAudioObj: HTMLAudioElement | null = null
  let silentAudio: HTMLAudioElement | null = null
  const setMainPlayer = (el: unknown) => {
    mainAudioObj = (el as HTMLAudioElement | null) ?? null
  }
  const setSilentAudio = (el: unknown) => {
    silentAudio = (el as HTMLAudioElement | null) ?? null
  }

  // 自訂清單／已學會：每頁重新從 localStorage 讀取（原版每頁重新載入）
  vocab.loadFromStorage()

  // --- 本機資料 UUID 無痛遷移邏輯 ---
  const kl = migrateToId(knownWords.value)
  if (kl.mutated) knownWords.value = kl.newArr

  const cl = migrateToId(customList.value)
  if (cl.mutated) customList.value = cl.newArr
  // ---------------------------------

  // 雲端同步狀態與防迴圈鎖
  const syncStatus = ref<'synced' | 'syncing' | 'error'>('synced')
  const isSyncingFromCloud = ref(false) // 新增防護鎖

  watch(knownWords, (newVal) => {
    localStorage.setItem('thai-known-words', JSON.stringify(newVal))
    if (!isSyncingFromCloud.value) {
      syncToCloud()
    }

    // 已學會清空時，比照「自訂單字」移除已選的「已學會」分類（原版沒有處理，清單重建時會出錯）
    if (newVal.length === 0) {
      if (selectedCategories.value.includes('已學會')) {
        selectedCategories.value = selectedCategories.value.filter((cat) => cat !== '已學會')
        updatePlaylist()
        currentIndex.value = 0
        if (isPlaying.value) stop()
      }
      if (modalCategory.value === '已學會') {
        modalCategory.value = Object.keys(VOCAB_DATA)[0]!
      }
    }
  }, { deep: true })

  const isKnownWord = (item: VocabWord | null | undefined) => {
    if (!item || !item.id) return false
    return knownWords.value.some((w) => w.id === item.id)
  }

  const toggleKnownWord = (item: VocabWord) => {
    if (!item.id) return
    const index = knownWords.value.findIndex((w) => w.id === item.id)
    if (index > -1) {
      knownWords.value.splice(index, 1) // 取消學會
    } else {
      knownWords.value.push(item) // 標記為學會
    }

    if (hideKnownWords.value && !selectedCategories.value.includes('已學會')) {
      // 💡 關鍵：如果打勾的是「正在看」且「正在播放」的單字 -> 先不要抽掉，讓音檔念完
      if (isPlaying.value && currentWord.value && wordKey(item) === wordKey(currentWord.value)) {
        return
      }

      // 只有在「暫停」或是「點擊底下清單的其他單字」時，才維持立刻抽掉的邏輯
      later(() => {
        const idxInPlaylist = playlist.value.findIndex((w) => w.id === item.id)
        if (idxInPlaylist > -1) {
          playlist.value.splice(idxInPlaylist, 1)
          if (idxInPlaylist < currentIndex.value) {
            currentIndex.value--
          } else if (idxInPlaylist === currentIndex.value) {
            if (currentIndex.value >= playlist.value.length) {
              currentIndex.value = Math.max(0, playlist.value.length - 1)
            }
          }
        }
      }, 400)
    }
  }

  // 自動把「自訂單字」合併到最前面
  const allCategories = computed(() => {
    const result: VocabCategories = { ...VOCAB_DATA }
    if (customList.value.length > 0) {
      result['自訂單字'] = customList.value
    }
    if (knownWords.value.length > 0) {
      result['已學會'] = knownWords.value
    }
    return result
  })

  // 儲存選中的分類（localStorage 由 playerSettings store 處理）
  watch(selectedCategories, () => {
    // 從雲端恢復分類時不回傳（原版這裡沒有檢查鎖，每次進頁面都會再上傳一次）
    if (!isSyncingFromCloud.value) {
      syncToCloud() // 觸發 Firebase 同步
    }
  }, { deep: true })

  const playlist = ref<VocabWord[]>([])
  const currentIndex = ref(0)
  const isPlaying = ref(false)

  const showChinese = ref(true)

  let currentUtterance: SpeechSynthesisUtterance | null = null

  const isTransitioning = ref(false)
  const isModalOpen = ref(false)
  const modalCategory = ref('基礎與代名詞') // 預設一個分類
  const searchQuery = ref('') // 搜尋關鍵字狀態

  watch(hideKnownWords, () => {
    updatePlaylist() // 切換開關時，重新計算播放清單
    currentIndex.value = 0 // 回到第一個字
    if (isPlaying.value) stop() // 暫停播放避免錯亂
  })
  let autoPlayTimer: Timer | null = null // 用來儲存定時器，確保不會重複執行
  let stepTimer: Timer | null = null // 管理泰中切換的間格計時器

  const voices = shallowRef<SpeechSynthesisVoice[]>([])
  const isFlipped = ref(false)
  const currentWord = computed<VocabWord | null>(() => playlist.value[currentIndex.value] || null)
  const currentWordCategory = computed(() => {
    if (!currentWord.value) return ''
    for (const [cat, words] of Object.entries(allCategories.value)) {
      if (words.some((w) => wordKey(w) === wordKey(currentWord.value!))) return cat
    }
    return '未分類'
  })

  const getCatIcon = (cat: string) => {
    const icons: Record<string, string> = {
      基礎與代名詞: '👥',
      疑問句工具: '❓',
      常用動詞: '🏃',
      形容詞與感覺: '🌈',
      數字與時間: '🕒',
      餐廳與交通: '🚗',
      自訂單字: '⭐',
      已學會: '✅',
    }
    // 課程分類（第N課）用 📘
    return icons[cat] || (lessonNoOfCategory(cat) !== null ? LESSON_CATEGORY_ICON : '📁')
  }

  // 深色模式：直接操作 body 的 class（原版兩個重複的 watch 合併為一個；存檔由 store 處理）
  watch(isDarkMode, (val) => {
    if (val) document.body.classList.add('dark-mode')
    else document.body.classList.remove('dark-mode')
  }, { immediate: true })
  watch(playbackRate, (v) => {
    // 如果正在播放中切換速度，讓它馬上生效
    if (mainAudioObj) {
      mainAudioObj.playbackRate = parseFloat(String(v))
    }
  })
  // 3. 監聽自訂清單變化，自動存入 localStorage
  watch(customList, (newVal) => {
    localStorage.setItem('thai-custom-list', JSON.stringify(newVal))

    // 如果是因為下載雲端資料而改變的，就不觸發上傳
    if (!isSyncingFromCloud.value) {
      syncToCloud()
    }

    if (newVal.length === 0) {
      if (selectedCategories.value.includes('自訂單字')) {
        selectedCategories.value = selectedCategories.value.filter((cat) => cat !== '自訂單字')
        updatePlaylist()
        currentIndex.value = 0
        if (isPlaying.value) stop()
      }
      if (modalCategory.value === '自訂單字') {
        modalCategory.value = Object.keys(VOCAB_DATA)[0]!
      }
    } else if (selectedCategories.value.includes('自訂單字')) {
      updatePlaylist()
    }
  }, { deep: true })

  watch(isFlashcardMode, () => {
    isFlipped.value = false
  })

  watch(currentIndex, (newIdx) => {
    // 1. 保留原本的邏輯：切換單字時，確保單字卡是正面（未翻轉）
    isFlipped.value = false

    // 2. 新增的邏輯：儲存當前單字到本地，以便下次恢復
    if (playlist.value[newIdx]) {
      localStorage.setItem('thai-last-word-th', playlist.value[newIdx].th)
    }
  })
  // 4. 新增判斷與切換收藏狀態的方法
  const isCustomWord = (item: VocabWord | null | undefined) => {
    if (!item || !item.id) return false
    return customList.value.some((w) => w.id === item.id)
  }
  const toggleCustomWord = (item: VocabWord) => {
    if (!item.id) return
    const index = customList.value.findIndex((w) => w.id === item.id)
    if (index > -1) {
      customList.value.splice(index, 1) // 移除
    } else {
      customList.value.push(item) // 加入
    }
  }

  const reportBadAudio = () => {
    if (!currentWord.value) return

    // 1. 檢查是否已經在壞音檔名單中，不在的話就加進去
    if (!brokenAudio.value.includes(currentWord.value.th)) {
      brokenAudio.value.push(currentWord.value.th)
    }

    // 2. 同步更新本機 localStorage
    localStorage.setItem('thai-broken-audio', JSON.stringify(brokenAudio.value))

    // 3. 同步回 Firebase
    syncToCloud()

    // 4. 即時回饋：停掉目前的聲音，並改用 TTS 唸一次「已記錄」
    stopAllAudio()
    speakFallbackTTS('บันทึกแล้ว', 'th-TH')

    console.log(`已標記壞音檔並加入排除名單：${currentWord.value.th}`)
  }

  // 監聽播放狀態來切換常亮模式
  watch(isPlaying, (val) => {
    if (val) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }
  })

  // 滑動
  const touchStartX = ref(0)

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0]!.clientX
  }

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0]!.clientX
    const diffX = touchStartX.value - touchEndX

    if (Math.abs(diffX) > 50) {
      if (diffX < 0) {
        // 向右滑 (Finger to Right)
        prev() // 改成上一題
      } else {
        // 向左滑 (Finger to Left)
        next() // 改成下一題
      }
    }
  }
  // 1. 修改 updatePlaylist：只負責建立基礎清單，不再強制歸零 currentIndex
  const updatePlaylist = () => {
    let list: VocabWord[] = []
    if (selectedCategories.value.length === 0) {
      list = Object.values(allCategories.value).flat()
    } else {
      selectedCategories.value.forEach((cat) => {
        // 分類不存在時（例如已學會清單被清空）視為空清單（原版展開 undefined 會丟出錯誤）
        list = [...list, ...(allCategories.value[cat] || [])]
      })
    }
    // 1. 如果開啟過濾，且目前沒有選擇「已學會」分類，就隱藏這些單字
    if (hideKnownWords.value && !selectedCategories.value.includes('已學會')) {
      list = list.filter((word) => !isKnownWord(word))
    }

    // 2. 避免跨分類選取時出現重複單字（以 id 判斷，原版用 th 會把同字多義的另一個意思濾掉）
    const seen = new Set<string>()
    list = list.filter((word) => {
      if (seen.has(wordKey(word))) return false
      seen.add(wordKey(word))
      return true
    })
    playlist.value = list

    // 如果是在隨機模式下建立清單（例如切換類別時），則進行洗牌
    if (isShuffle.value) {
      shuffleInPlace(playlist.value)
    }
  }

  const toggleCategory = (cat: string) => {
    // 1. 原有的選取邏輯
    if (cat === 'all') {
      selectedCategories.value = []
    } else {
      if (!isMultiSelect.value) {
        selectedCategories.value = [cat]
      } else {
        const idx = selectedCategories.value.indexOf(cat)
        if (idx > -1) {
          selectedCategories.value.splice(idx, 1)
        } else {
          selectedCategories.value.push(cat)
        }
      }
    }

    // 2. 更新播放清單
    updatePlaylist()
    currentIndex.value = 0
    if (isPlaying.value) stop()

    // 3. ★ 新增：自動捲動邏輯 ★
    // 使用 setTimeout 確保 DOM 渲染完成後再抓取位置
    later(() => {
      const targetCat = cat === 'all' ? 'all' : cat // 如果是點擊全部，也可以幫它標記一個 class
      const activeBtn = document.querySelector(`.cat-btn-${targetCat}`)
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }, 100)
  }

  const stopAllAudio = () => {
    cancel(stepTimer) // 清除播放間格的計時器

    if (currentUtterance) {
      currentUtterance.onend = null
      currentUtterance.onerror = null
    }
    window.speechSynthesis.cancel()

    if (mainAudioObj) {
      mainAudioObj.onended = null
      mainAudioObj.onerror = null
      mainAudioObj.pause()
    }
  }

  const speakFallbackTTS = (text: string, lang: string, onEnd?: () => void) => {
    const ut = new SpeechSynthesisUtterance(text)
    currentUtterance = ut // 儲存實體以便 stopAllAudio 攔截

    ut.lang = lang
    ut.rate = playbackRate.value || 1.0
    const currentVoices = window.speechSynthesis.getVoices()
    if (lang.startsWith('th')) {
      const targetVoice =
        currentVoices.find((v) => v.name === selectedVoice.value) || currentVoices.find((v) => v.lang.includes('th'))
      if (targetVoice) ut.voice = targetVoice
    } else if (lang === 'zh-TW') {
      const chineseVoice = currentVoices.find((v) => v.lang.includes('zh-TW'))
      if (chineseVoice) ut.voice = chineseVoice
    }

    ut.onend = () => {
      if (onEnd) onEnd()
    }
    ut.onerror = (e) => {
      // 排除 cancel 造成的錯誤回呼
      if (e.error !== 'canceled' && onEnd) onEnd()
    }
    window.speechSynthesis.speak(ut)
  }

  const playMediaWithFallback = async (text: string, type: 'th' | 'zh', onEnd?: () => void) => {
    stopAllAudio()
    if (!mainAudioObj) return
    const audio = mainAudioObj

    // 檢查是否為壞音檔紀錄
    if (type === 'th' && brokenAudio.value.includes(text)) {
      console.log(`[播放器] 檢測到壞音檔紀錄，直接使用 TTS: ${text}`)
      speakFallbackTTS(text, 'th-TH', onEnd)
      return
    }

    // 新增：沒有音檔（例如還沒打包的新字）直接用 TTS，不先發一次會失敗的請求
    if (!hasAudioFile(text, type)) {
      speakFallbackTTS(text, type === 'th' ? 'th-TH' : 'zh-TW', onEnd)
      return
    }

    const audioUrl = getAudioUrl(text, type)

    audio.pause()
    audio.src = audioUrl
    audio.load()
    audio.playbackRate = parseFloat(String(playbackRate.value))

    let isResolved = false // 狀態鎖：防止 catch 與 onerror 雙重觸發

    const triggerFallback = () => {
      if (isResolved) return
      isResolved = true
      console.log(`[播放器] 找不到實體 MP3，退回 TTS: ${text}`)
      speakFallbackTTS(text, type === 'th' ? 'th-TH' : 'zh-TW', onEnd)
    }

    audio.onended = () => {
      if (isResolved) return
      isResolved = true
      if (onEnd) onEnd()
    }

    audio.onerror = () => {
      triggerFallback()
    }

    try {
      await audio.play()
    } catch (e) {
      const err = e as Error
      if (err.name === 'AbortError' || err.message.includes('interrupted')) {
        return // 排除因為被 pause() 截斷的錯誤，避免觸發前一個字的 TTS
      }
      triggerFallback()
    }
  }

  const replayCurrent = (word?: VocabWord) => {
    const target = word || currentWord.value
    if (target) {
      stopAllAudio()
      playMediaWithFallback(target.th, 'th')
    }
  }

  const playCurrent = () => {
    if (!currentWord.value || !isPlaying.value) return
    stopAllAudio()

    if (speakChineseOrder.value) {
      playMediaWithFallback(currentWord.value.zh, 'zh', () => {
        if (!isPlaying.value) return
        stepTimer = later(() => { // 綁定計時器
          if (!isPlaying.value) return
          playMediaWithFallback(currentWord.value!.th, 'th', () => {
            if (isPlaying.value) {
              stepTimer = later(() => { if (isPlaying.value) handleNextAuto() }, 200)
            }
          })
        }, 300)
      })
    } else {
      playMediaWithFallback(currentWord.value.th, 'th', () => {
        if (!isPlaying.value) return
        stepTimer = later(() => { // 綁定計時器
          if (!isPlaying.value) return
          playMediaWithFallback(currentWord.value!.zh, 'zh', () => {
            if (isPlaying.value) {
              stepTimer = later(() => { if (isPlaying.value) handleNextAuto() }, 200)
            }
          })
        }, 300)
      })
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentWord.value.th,
        artist: currentWord.value.zh,
        album: `進度: ${currentIndex.value + 1}/${playlist.value.length}`,
      })
    }
  }

  const handleContentClick = () => {
    if (isPlaying.value) {
      if (isFlashcardMode.value) isFlipped.value = !isFlipped.value
      return
    }
    if (isFlashcardMode.value) {
      isFlipped.value = !isFlipped.value
      if (currentWord.value) playMediaWithFallback(currentWord.value.th, 'th')
    } else {
      replayCurrent()
    }
  }

  const toggleFlashcardMode = () => {
    isFlashcardMode.value = !isFlashcardMode.value
    if (isFlashcardMode.value && isPlaying.value) {
      stop() // 開啟單字卡時，自動暫停播放
    }
  }
  const handleNextAuto = () => {
    if (!isPlaying.value) return
    cancel(autoPlayTimer)
    autoPlayTimer = later(() => {
      if (!isPlaying.value) return
      // --- ★ 新增：等音檔念完後，在這裡才把打勾的字抽掉 ---
      if (hideKnownWords.value && currentWord.value && isKnownWord(currentWord.value) && !selectedCategories.value.includes('已學會')) {
        playlist.value.splice(currentIndex.value, 1)

        if (playlist.value.length === 0) {
          stop() // 沒字了就停止
          return
        }
        if (currentIndex.value >= playlist.value.length) {
          currentIndex.value = 0 // 刪到最後一個，回到起點
          if (repeatMode.value === 1) { // 如果設定不循環，就停止
            stop()
            return
          }
        }
        playCurrent() // 繼續播遞補上來的新字
        return
      }
      if (repeatMode.value === 2) {
        playCurrent()
      } else {
        if (currentIndex.value < playlist.value.length - 1) {
          currentIndex.value++
          playCurrent()
        } else {
          if (repeatMode.value === 0) {
            currentIndex.value = 0
            playCurrent()
          } else {
            isPlaying.value = false
          }
        }
      }
    }, 500)
  }

  const togglePlay = () => {
    cancel(autoPlayTimer)
    if (isPlaying.value) {
      isPlaying.value = false
      stopAllAudio()
      if (silentAudio) silentAudio.pause()
    } else {
      isPlaying.value = true
      isFlashcardMode.value = false
      isFlipped.value = false

      if (silentAudio) silentAudio.play().catch(() => {})

      // 喚醒實體播放器給 CarPlay 抓取
      if (mainAudioObj) {
        mainAudioObj.src = SILENT_WAV
        mainAudioObj.play().catch(() => {})
      }
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))

      later(() => {
        playCurrent()
      }, 50)
    }
  }

  const stop = () => {
    isPlaying.value = false
    stopAllAudio()
    syncToCloud()
  }

  const next = () => {
    if (playlist.value.length === 0) return // 安全檢查
    cancel(autoPlayTimer) // 手動切換時立即清除自動計時
    stopAllAudio()
    isTransitioning.value = true // 啟動動畫
    later(() => {
      if (hideKnownWords.value && currentWord.value && isKnownWord(currentWord.value) && !selectedCategories.value.includes('已學會')) {
        playlist.value.splice(currentIndex.value, 1) // 順手清掉
        if (currentIndex.value >= playlist.value.length) currentIndex.value = 0
      } else {
        if (currentIndex.value < playlist.value.length - 1) {
          currentIndex.value++
        } else {
          currentIndex.value = 0
        }
      }

      if (isPlaying.value) playCurrent()
      later(() => { isTransitioning.value = false }, 50)
    }, 150)
  }

  const prev = () => {
    if (playlist.value.length === 0) return // 安全檢查
    cancel(autoPlayTimer) // 手動切換時立即清除自動計時
    stopAllAudio()
    isTransitioning.value = true // 啟動動畫
    later(() => {
      if (hideKnownWords.value && currentWord.value && isKnownWord(currentWord.value) && !selectedCategories.value.includes('已學會')) {
        playlist.value.splice(currentIndex.value, 1) // 順手清掉
        if (currentIndex.value >= playlist.value.length) currentIndex.value = Math.max(0, playlist.value.length - 1)
      } else {
        if (currentIndex.value > 0) {
          currentIndex.value--
        } else {
          currentIndex.value = playlist.value.length - 1
        }
      }

      if (isPlaying.value) playCurrent()
      later(() => { isTransitioning.value = false }, 50)
    }, 150)
  }

  // 3. 核心修改：監聽 isShuffle
  watch(isShuffle, (newVal) => {
    stopAllAudio() // 切換時停止朗讀

    if (newVal) {
      // --- 開啟隨機模式 ---
      // 先確保清單完整，再洗牌
      updatePlaylist()
      shuffleInPlace(playlist.value)
    } else {
      // --- 關閉隨機模式（恢復） ---
      // 重新讀取原始順序清單
      updatePlaylist()
    }

    // 關鍵：不論開啟或關閉，都回到第一個單字，進度條也會回歸起點
    currentIndex.value = 0

    // 如果切換前正在播放，則從新的第一個單字開始念
    if (isPlaying.value) {
      playCurrent()
    }
  })

  // 根據搜尋文字過濾單字清單 (修改為：搜尋時跨分類全域搜尋)
  const filteredModalWords = computed(() => {
    // 1. 如果沒有輸入搜尋文字，維持原本「按分類顯示」的邏輯
    if (!searchQuery.value.trim()) {
      return allCategories.value[modalCategory.value] || []
    }

    // 2. 如果有輸入搜尋文字，從「全部單字」中檢索
    const q = searchQuery.value.toLowerCase()

    // 將 Object 裡面的所有陣列攤平成一個一維陣列
    const allWordsFlattened = Object.values(allCategories.value).flat()

    // 💡 小技巧：使用 Map 以泰文 (th) 為 key 來去除重複項
    // 因為同一個單字可能同時存在於「原始分類」和你的「自訂單字」中
    const uniqueWords = Array.from(new Map(allWordsFlattened.map((item) => [wordKey(item), item])).values())

    // 3. 回傳過濾後的結果
    return uniqueWords.filter((item) => item.th.toLowerCase().includes(q) || item.zh.toLowerCase().includes(q))
  })

  // 取得系統可用的泰文語音清單
  const updateVoices = () => {
    const allVoices = window.speechSynthesis.getVoices()
    // 過濾出泰文語音 (th-TH)
    voices.value = allVoices.filter((v) => v.lang.includes('th'))

    // 如果沒選過，預設選第一個
    if (!selectedVoice.value && voices.value.length > 0) {
      selectedVoice.value = voices.value[0]!.name
    }
  }

  // --- 全部重新開始的重置功能 ---
  const resetAllProgress = () => {
    if (confirm('確定要清除所有播放進度，並從頭開始嗎？')) {
      localStorage.removeItem('thai-selected-cats')
      localStorage.removeItem('thai-last-word-th')
      selectedCategories.value = []
      currentIndex.value = 0
      updatePlaylist()
      if (isPlaying.value) stop()
      syncToCloud()
      alert('進度已重置')
    }
  }

  // === Firebase 雲端同步邏輯 ===
  const syncToCloud = async () => {
    syncStatus.value = 'syncing'
    try {
      const ok = await cloud.saveThai({
        customList: clone(customList.value),
        brokenAudio: clone(brokenAudio.value),
        knownWords: clone(knownWords.value),
        // 新增：進度備份
        lastSelectedCategories: clone(selectedCategories.value),
        lastPlayedWord: localStorage.getItem('thai-last-word-th'),
        playerLastUpdated: Date.now(),
      })
      // saveProgressToCloud 內部吞掉錯誤，改看回傳值判斷是否失敗
      if (ok) later(() => { syncStatus.value = 'synced' }, 600)
      else syncStatus.value = 'error'
    } catch {
      syncStatus.value = 'error'
    }
  }

  // 原版 initAuthListener 成功回呼（未登入由 router guard 導回登入頁）
  let disposed = false
  const initializeCloudSync = async () => {
    // 1. 登入成功：顯示畫面
    console.log('Verified User:', authStore.user?.email)

    // 2. 下載雲端資料
    const thai = await cloud.loadThai()
    if (disposed) return

    if (thai) {
      isSyncingFromCloud.value = true // 加鎖防止觸發 watch 同步回雲端

      // 1. 恢復分類
      if (thai.lastSelectedCategories) {
        selectedCategories.value = thai.lastSelectedCategories
      }
      // 2. 恢復壞音檔名單、自訂單字、已學會（UUID 遷移與寫回 localStorage 由 store 統一處理）
      if (vocab.applyCloudData(thai)) syncToCloud() // 覆寫舊格式回雲端
      // 3. 恢復最後單字位置
      if (thai.lastPlayedWord) {
        localStorage.setItem('thai-last-word-th', thai.lastPlayedWord)
      }
      // 4. 新增：課程頁帶入的分類優先
      const categoryApplied = applyInitialCategory()

      // 5. 關鍵：恢復完資料後立刻重新產生清單並跳轉位置
      updatePlaylist()
      restoreLastPosition()

      later(() => {
        isSyncingFromCloud.value = false
        isLoading.value = false // ✅ 資料載入並渲染完畢，關閉 Loading
        if (categoryApplied) syncToCloud() // 等同手動選分類：記住這次的選擇
      }, 200)
    } else {
      // ✅ 雖然登入了，但雲端還沒有任何泰文資料 (可能是第一次玩)
      if (applyInitialCategory()) {
        updatePlaylist() // 分類的 watch 會同步到雲端
        restoreLastPosition()
      }
      isLoading.value = false
    }
  }

  // 新增：從課程頁帶入的分類（/player?cat=第1課）。雲端還原之後套用，取代上次選的分類
  const applyInitialCategory = (): boolean => {
    const cat = options.initialCategory
    if (!cat || !allCategories.value[cat]) return false
    selectedCategories.value = [cat]
    currentIndex.value = 0
    return true
  }

  // 新增一個輔助函式
  const restoreLastPosition = () => {
    const lastWordTh = localStorage.getItem('thai-last-word-th')
    if (lastWordTh && playlist.value.length > 0) {
      const savedIndex = playlist.value.findIndex((w) => w.th === lastWordTh)
      if (savedIndex > -1) {
        currentIndex.value = savedIndex
      }
    }
  }

  // 新增：鍵盤快捷鍵支援
  const handleKeydown = (e: KeyboardEvent) => {
    // 如果正在搜尋框裡面打字，就不要觸發快捷鍵
    if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return

    if (e.code === 'Space') {
      e.preventDefault() // 防止空白鍵讓網頁往下滾
      togglePlay()
    } else if (e.code === 'ArrowRight') {
      next()
    } else if (e.code === 'ArrowLeft') {
      prev()
    }
  }

  const handleVisibilityChange = () => {
    if (wakeLock.value !== null && document.visibilityState === 'visible' && isPlaying.value) {
      requestWakeLock()
    }
  }

  const MEDIA_ACTIONS: MediaSessionAction[] = ['play', 'pause', 'previoustrack', 'nexttrack']

  /** 原版 onMounted 的內容 */
  const mount = () => {
    window.addEventListener('keydown', handleKeydown)
    updatePlaylist()
    restoreLastPosition() // 啟動時恢復
    window.speechSynthesis.onvoiceschanged = updateVoices
    updateVoices()

    document.addEventListener('visibilitychange', handleVisibilityChange)

    initializeCloudSync()

    if ('mediaSession' in navigator) {
      // 播放、暫停
      navigator.mediaSession.setActionHandler('play', togglePlay)
      navigator.mediaSession.setActionHandler('pause', togglePlay)
      // 上一首、下一首 (建議也移到這裡統一管理)
      navigator.mediaSession.setActionHandler('previoustrack', prev)
      navigator.mediaSession.setActionHandler('nexttrack', next)
    }
  }

  /** SPA 換頁清理（原版換頁時由瀏覽器自動處理） */
  const unmount = () => {
    disposed = true
    isPlaying.value = false
    stopAllAudio()
    if (silentAudio) silentAudio.pause()
    window.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.speechSynthesis.onvoiceschanged = null
    if ('mediaSession' in navigator) {
      MEDIA_ACTIONS.forEach((action) => navigator.mediaSession.setActionHandler(action, null))
      navigator.mediaSession.metadata = null
    }
    document.body.classList.remove('dark-mode')
  }

  return {
    wordKey,
    isLoading, syncStatus, isDarkMode,
    isDownloading, downloadProgress, downloadTotal, downloadModal, startDownload, closeDownloadModal, executeDownload,
    allCategories, selectedCategories, toggleCategory, getCatIcon,
    playlist, currentIndex, currentWord, currentWordCategory, isPlaying, isTransitioning,
    isFlashcardMode, isFlipped, showChinese, hideKnownWords, isMultiSelect,
    isShuffle, repeatMode, playbackRate, speakChineseOrder, voices, selectedVoice,
    handleTouchStart, handleTouchEnd, handleContentClick, toggleFlashcardMode,
    togglePlay, next, prev, replayCurrent, reportBadAudio,
    isKnownWord, toggleKnownWord, isCustomWord, toggleCustomWord,
    isModalOpen, modalCategory, searchQuery, filteredModalWords, resetAllProgress,
    setMainPlayer, setSilentAudio, mount, unmount,
  }
}

export type PlayerPageContext = ReturnType<typeof createPlayerPage>

const PlayerPageKey: InjectionKey<PlayerPageContext> = Symbol('PlayerPage')

export const providePlayerPage = (options: { initialCategory?: string } = {}) => {
  const ctx = createPlayerPage(options)
  provide(PlayerPageKey, ctx)
  return ctx
}

export const usePlayerPageContext = () => {
  const ctx = inject(PlayerPageKey)
  if (!ctx) throw new Error('usePlayerPageContext 必須在 ThaiPlayerView 底下使用')
  return ctx
}
