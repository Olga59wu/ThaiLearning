import { computed, inject, nextTick, provide, ref, watch, type InjectionKey } from 'vue'
import { storeToRefs } from 'pinia'
import { ALL_VOCAB_CATEGORIES } from '@/data/vocabCategories'
import { getAudioUrl, hasAudioFile } from '@/services/offlineAudio'
import { useCloudStore } from '@/stores/cloud'
import { migrateToId, useVocabProgressStore } from '@/stores/vocabProgress'
import { useTimers } from '@/composables/useTimers'
import { useOfflineAudioDownload } from '@/composables/useOfflineAudioDownload'
import { useTypingSounds } from '@/composables/typing/useTypingSounds'
import { shuffleInPlace } from '@/utils/shuffle'
import type { VocabCategories, VocabWord } from '@/types/thai'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/**
 * thaiTyping.html 的頁面邏輯（原版 createApp setup 的內容）。
 * 在 ThaiTypingView 建立並 provide，子元件以 useTypingPageContext() 取得。
 */
export const createTypingPage = () => {
  const cloud = useCloudStore()
  const vocab = useVocabProgressStore()
  const { customList, knownWords } = storeToRefs(vocab)
  const { later } = useTimers()
  const { initAudioEngine, playTypeSound, playFeedbackSound, closeAudioEngine } = useTypingSounds()

  const {
    isDownloading, downloadModal, closeDownloadModal, downloadProgress, downloadTotal, startDownload, executeDownload,
  } = useOfflineAudioDownload()

  const isLoading = ref(true)

  // 自訂清單／已學會：啟動時先讀 localStorage（原版只等雲端資料，未登入或雲端沒資料會卡在 LOADING）
  vocab.loadFromStorage()

  // --- 本機資料 UUID 無痛遷移邏輯（收藏／已學會一律用 id 比對） ---
  const kl = migrateToId(knownWords.value)
  if (kl.mutated) {
    knownWords.value = kl.newArr
    localStorage.setItem('thai-known-words', JSON.stringify(knownWords.value))
  }

  const cl = migrateToId(customList.value)
  if (cl.mutated) {
    customList.value = cl.newArr
    localStorage.setItem('thai-custom-list', JSON.stringify(customList.value))
  }
  // ---------------------------------

  const allCategories = computed(() => {
    const result: VocabCategories = { ...ALL_VOCAB_CATEGORIES }
    if (customList.value.length > 0) {
      result['自訂單字'] = customList.value
    }
    if (knownWords.value.length > 0) {
      result['已學會'] = knownWords.value
    }
    return result
  })
  const selectedCategories = ref<string[]>([])
  const words = ref<VocabWord[]>([])
  const currentIndex = ref(0)
  const inputValue = ref('')
  const stats = ref({ correct: 0, incorrect: 0 })
  const isFinished = ref(false)
  const isWrong = ref(false) // 專門控制大字卡的抖動狀態
  const isTransitioning = ref(false)

  // <input> 與 <audio> 由元件的 template ref 設定
  let inputEl: HTMLInputElement | null = null
  const setInputRef = (el: unknown) => {
    inputEl = (el as HTMLInputElement | null) ?? null
  }
  let mainAudioObj: HTMLAudioElement | null = null
  const setMainPlayer = (el: unknown) => {
    mainAudioObj = (el as HTMLAudioElement | null) ?? null
  }

  const currentWord = computed<VocabWord | null>(() => {
    return words.value.length > 0 ? (words.value[currentIndex.value] ?? null) : null
  })

  const matchedText = computed(() => {
    if (!currentWord.value) return ''
    const target = currentWord.value.th
    const input = inputValue.value
    let i = 0
    // 找出輸入與目標從開頭起算，完全相符的長度
    while (i < target.length && i < input.length && target[i] === input[i]) {
      i++
    }
    return target.slice(0, i)
  })
  // 🌟 計算下一個該打的字母提示 ( Layer 1.5 ) 🌟
  const nextCharToType = computed(() => {
    if (!currentWord.value) return ''
    // 如果目前打錯了，就不顯示下一個字提示
    if (isWrong.value) return ''
    const target = currentWord.value.th
    // 只有在還有下一個字時提示
    if (matchedText.value.length >= target.length) return '' // 打完了
    // 抓取 matchedText 長度位置的那一個字元
    return target.charAt(matchedText.value.length)
  })
  const wrongText = computed(() => {
    if (!currentWord.value) return ''
    const target = currentWord.value.th
    const input = inputValue.value
    let i = 0
    while (i < target.length && i < input.length && target[i] === input[i]) i++
    const wrongLen = Math.min(input.length - i, target.length - i)
    return target.slice(i, i + wrongLen)
  })

  const remainingText = computed(() => {
    if (!currentWord.value) return ''
    const target = currentWord.value.th
    const input = inputValue.value
    let i = 0
    while (i < target.length && i < input.length && target[i] === input[i]) i++
    const wrongLen = Math.min(input.length - i, target.length - i)
    return target.slice(i + wrongLen)
  })

  const toggleCategory = (cat: string) => {
    const index = selectedCategories.value.indexOf(cat)
    if (index === -1) {
      selectedCategories.value.push(cat)
    } else {
      if (selectedCategories.value.length > 1) {
        selectedCategories.value.splice(index, 1)
      }
    }
    initGame(false)
  }

  const resetCategories = () => {
    selectedCategories.value = []
    initGame(false)
  }

  // 每次播放遞增；舊的播放（或延遲中的 TTS）發現 token 已變就不再發聲，換題時只念目前這個字
  let playToken = 0

  const speakFallbackTTS = (text: string, token: number) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const ut = new SpeechSynthesisUtterance(text)
    ut.lang = 'th-TH'
    ut.rate = 0.9
    ut.volume = 1.0
    later(() => {
      if (token !== playToken) return
      window.speechSynthesis.speak(ut)
    }, 70)
  }

  const playMediaWithFallback = async (text: string) => {
    const token = ++playToken
    if (!mainAudioObj) {
      speakFallbackTTS(text, token)
      return
    }
    const audio = mainAudioObj
    window.speechSynthesis.cancel()
    audio.pause()

    // 新增：沒有音檔（例如還沒打包的新字）直接用 TTS，不先發一次會失敗的請求
    if (!hasAudioFile(text, 'th')) {
      speakFallbackTTS(text, token)
      return
    }

    audio.src = getAudioUrl(text, 'th')
    audio.load()
    audio.playbackRate = 1.0

    let isResolved = false // 狀態鎖：防止 catch 與 onerror 雙重觸發
    const triggerFallback = () => {
      if (isResolved || token !== playToken) return
      isResolved = true
      speakFallbackTTS(text, token)
    }

    audio.onerror = () => {
      audio.onerror = null
      triggerFallback()
    }

    try {
      await audio.play()
    } catch (e) {
      if (disposed) return // 離開頁面時 pause() 造成的中斷，不再退回 TTS
      const err = e as Error
      if (err.name === 'AbortError' || err.message.includes('interrupted')) {
        return // 被下一次播放的 pause() 截斷（同隨身聽），不退回 TTS
      }
      triggerFallback()
    }
  }

  const playCurrentWord = () => {
    if (currentWord.value) {
      playMediaWithFallback(currentWord.value.th)
    }
    nextTick(() => {
      keepFocus()
    })
  }

  const initGame = (showLoading = true) => {
    if (showLoading) {
      isLoading.value = true
    }
    isTransitioning.value = false

    let combinedWords: VocabWord[] = []

    // 1. 根據選中的分類獲取原始單字列表
    if (selectedCategories.value.length === 0) {
      Object.values(allCategories.value).forEach((list) => {
        if (Array.isArray(list)) {
          combinedWords = [...combinedWords, ...list]
        }
      })
    } else {
      selectedCategories.value.forEach((cat) => {
        const list = allCategories.value[cat]
        if (list && Array.isArray(list)) {
          combinedWords = [...combinedWords, ...list]
        }
      })
    }

    // 2. 【新增：過濾邏輯】
    // 如果目前選中的分類「不包含」已學會，我們就自動把已學會的字從練習中去掉
    if (combinedWords.length > 0 && !selectedCategories.value.includes('已學會')) {
      combinedWords = combinedWords.filter((word) => {
        // 檢查這個單字是否已經在 knownWords 清單中（改用 id 比對）
        return !knownWords.value.some((k) => k.id === word.id)
      })
    }

    // 3. 排除重複（選多個分類時可能會有重複單字；用 id，同字多義的單字都會出現）
    const uniqueMap = new Map<string, VocabWord>()
    combinedWords.forEach((w) => uniqueMap.set(w.id, w))
    combinedWords = Array.from(uniqueMap.values())

    // 4. 洗牌並存入 words.value
    if (combinedWords.length > 0) {
      words.value = shuffleInPlace([...combinedWords])
    } else {
      words.value = []
    }

    // 5. 重置狀態
    currentIndex.value = 0
    inputValue.value = ''
    stats.value = { correct: 0, incorrect: 0 }
    isFinished.value = false
    isWrong.value = false

    // 6. 載入動畫處理
    if (showLoading) {
      later(() => {
        isLoading.value = false
        nextTick(() => {
          keepFocus()
          playCurrentWord()
        })
      }, 300)
    } else {
      isLoading.value = false
      nextTick(() => {
        keepFocus()
        playCurrentWord()
      })
    }
  }

  const keepFocus = () => {
    if (!isFinished.value) {
      later(() => inputEl?.focus(), 50)
    }
  }

  const handleInput = (e: Event) => {
    if (isTransitioning.value) {
      if (currentWord.value) {
        inputValue.value = currentWord.value.th
        if (inputEl) inputEl.value = currentWord.value.th
      }
      return
    }

    playTypeSound()
    const val = (e.target as HTMLInputElement).value
    // --- 【新增：即時比對防呆邏輯】 ---
    if (currentWord.value) {
      const correctStr = currentWord.value.th

      // 比對目前輸入的長度與正確答案的前幾碼
      if (val === correctStr.substring(0, val.length)) {
        // 目前為止都打對
        isWrong.value = false
      } else {
        // 出現錯誤 (例如：預期是 'ู' 但打成 '่')
        isWrong.value = true
      }
    }
    // 1. 完全打對該單字時，自動驗證進下一題
    if (currentWord.value && val === currentWord.value.th) {
      const success = validate(val)
      if (!success) {
        inputValue.value = ''
        nextTick(() => {
          if (inputEl) inputEl.value = ''
        })
      }
      return
    }

    // 2. 有按空白鍵的檢查邏輯
    if (val.includes(' ')) {
      const typed = val.trim() // 直接用 trim 處理所有空白
      if (typed.length > 0) {
        const success = validate(typed)
        if (!success) {
          inputValue.value = ''
          nextTick(() => {
            if (inputEl) {
              inputEl.value = ''
              inputEl.focus()
            }
          })
        }
      } else {
        // 如果只有空白，直接清空
        inputValue.value = ''
      }
    }
  }

  const validate = (typed: string) => {
    if (isFinished.value || !currentWord.value || isTransitioning.value) return false

    const isOk = typed === currentWord.value.th

    if (isOk) {
      playFeedbackSound(true) // 播放正確音
      stats.value.correct++
      isWrong.value = false
      isTransitioning.value = true
      // 打對的瞬間，再念一次泰文發音
      playCurrentWord()
      // 動態計算停留時間
      // 基礎停留 1200ms，單字每多一個字母，就多加 150ms 的緩衝時間。
      // 這樣長單字保證能唸完，而且眼睛也有足夠時間看中文！
      const delayTime = Math.max(1200, currentWord.value.th.length * 150 + 500)
      later(() => {
        inputValue.value = ''
        if (inputEl) inputEl.value = ''

        if (currentIndex.value < words.value.length - 1) {
          currentIndex.value++
        } else {
          isFinished.value = true
        }
        isTransitioning.value = false
        nextTick(() => keepFocus())
      }, delayTime)

      return true
    } else {
      playFeedbackSound(false) // 播放錯誤音
      stats.value.incorrect++
      isWrong.value = true

      later(() => {
        isWrong.value = false
      }, 300)
      return false
    }
  }

  watch(currentIndex, (newIdx, oldIdx) => {
    if (newIdx !== oldIdx && !isFinished.value) {
      playCurrentWord()
    }
  })

  // 練習完成後 currentIndex 停在最後一題，剩餘要顯示 0
  const remainingCount = computed(() =>
    isFinished.value ? 0 : Math.max(0, words.value.length - currentIndex.value),
  )

  const accuracy = computed(() => {
    const total = stats.value.correct + stats.value.incorrect
    return total === 0 ? 0 : Math.round((stats.value.correct / total) * 100)
  })

  // --- 新增：捕捉首次互動，解決瀏覽器阻擋第一聲發音的問題 ---
  let hasStartedInteraction = false
  const removeFirstInteractionListeners = () => {
    window.removeEventListener('click', handleFirstInteraction)
    window.removeEventListener('touchstart', handleFirstInteraction)
    window.removeEventListener('keydown', handleFirstInteraction)
  }
  const handleFirstInteraction = () => {
    if (hasStartedInteraction) return
    hasStartedInteraction = true

    initAudioEngine() // 暖機打字音效引擎

    // 若剛進來還在第一個單字且尚未完成，補發音一次
    if (!isFinished.value && currentWord.value && currentIndex.value === 0) {
      playCurrentWord()
    }

    // 移除監聽，避免後續重複觸發
    removeFirstInteractionListeners()
  }

  // 🌟 2. 雲端同步函數（展開雲端快取，防止覆蓋掉隨身聽的播放進度）
  const syncToCloud = async () => {
    try {
      await cloud.saveThai({
        customList: clone(customList.value),
        knownWords: clone(knownWords.value),
      })
    } catch (error) {
      console.warn('雲端同步失敗', error)
    }
  }

  // 🌟 3. 判斷與點擊星星的函數（改用 id 比對）
  const isCustomWord = (item: VocabWord | null | undefined) => {
    if (!item) return false
    return customList.value.some((w) => w.id === item.id)
  }

  /** 收藏／已學會取消或標記後，從目前的練習清單中抽掉這張卡 */
  const removeFromGame = (item: VocabWord) => {
    const idxInWords = words.value.findIndex((w) => w.id === item.id)
    if (idxInWords > -1) {
      if (idxInWords === currentIndex.value) {
        // 移除的是「當前正在打」的字：延遲 0.25 秒後自動換下一題 (讓畫面順暢)
        later(() => {
          words.value.splice(idxInWords, 1)

          inputValue.value = ''
          if (inputEl) inputEl.value = ''
          isWrong.value = false

          // 檢查抽掉這張卡後，是不是全破了
          if (words.value.length === 0) {
            isFinished.value = true
          } else {
            if (currentIndex.value >= words.value.length) {
              currentIndex.value = Math.max(0, words.value.length - 1)
            }
            playCurrentWord() // 自動發出下一張卡的音
            nextTick(() => keepFocus())
          }
        }, 250)
      } else {
        // 移除的是清單中「其他」的字
        words.value.splice(idxInWords, 1)
        if (idxInWords < currentIndex.value) {
          currentIndex.value-- // 確保進度與畫面不會亂跳
        }
      }
    }
  }

  /**
   * 「自訂單字」或「已學會」清空後，從已選分類移除；
   * 沒有任何已選分類時回到「全部」並重新開始。
   * @returns 是否已回到「全部」重新開始（此時不必再抽掉卡片）
   */
  const pruneEmptyCategory = (cat: '自訂單字' | '已學會') => {
    const list = cat === '自訂單字' ? customList.value : knownWords.value
    if (list.length > 0 || !selectedCategories.value.includes(cat)) return false
    selectedCategories.value = selectedCategories.value.filter((c) => c !== cat)
    if (selectedCategories.value.length > 0) return false
    initGame(false)
    return true
  }

  const toggleCustomWord = (item: VocabWord | null) => {
    if (!item) return
    const index = customList.value.findIndex((w) => w.id === item.id)
    const isRemoving = index > -1

    // 處理星星資料的增刪
    if (isRemoving) {
      customList.value.splice(index, 1) // 取消收藏
    } else {
      customList.value.push(item) // 加入收藏
    }

    // 同步到本地與雲端
    localStorage.setItem('thai-custom-list', JSON.stringify(customList.value))
    syncToCloud()

    // 🌟 核心修復：動態從當前遊戲清單中移除 🌟
    if (isRemoving) {
      let shouldRemoveFromGame = false

      // 判斷當前是否需要從畫面上抽掉這張卡片
      if (selectedCategories.value.length === 1 && selectedCategories.value[0] === '自訂單字') {
        shouldRemoveFromGame = true // 只選了自訂單字，拔掉星星當然要移除
      } else if (selectedCategories.value.includes('自訂單字')) {
        // 如果有多選分類，確保這個字也不在其他「被選中」的分類裡
        const inOtherCats = selectedCategories.value.some((cat) => {
          if (cat === '自訂單字') return false
          return allCategories.value[cat]?.some((w) => w.id === item.id)
        })
        if (!inOtherCats) shouldRemoveFromGame = true
      }

      if (pruneEmptyCategory('自訂單字')) return
      if (shouldRemoveFromGame) removeFromGame(item)
    }
  }

  // 🌟 4. 新增：判斷與點擊「已學會」的函數（改用 id 比對） 🌟
  const isKnownWord = (item: VocabWord | null | undefined) => {
    if (!item) return false
    return knownWords.value.some((w) => w.id === item.id)
  }

  const toggleKnownWord = (item: VocabWord | null) => {
    if (!item) return
    const index = knownWords.value.findIndex((w) => w.id === item.id)
    const isCurrentlyKnown = index > -1

    // 處理打勾資料的增刪
    if (isCurrentlyKnown) {
      knownWords.value.splice(index, 1) // 取消已學會
    } else {
      knownWords.value.push(item) // 標記為已學會
    }

    // 同步到本地與雲端
    localStorage.setItem('thai-known-words', JSON.stringify(knownWords.value))
    syncToCloud()

    // 動態抽換卡片的邏輯
    let shouldRemoveFromGame = false

    if (isCurrentlyKnown) {
      // 情況 A：取消打勾
      if (selectedCategories.value.length === 1 && selectedCategories.value[0] === '已學會') {
        shouldRemoveFromGame = true
      } else if (selectedCategories.value.includes('已學會')) {
        const inOtherCats = selectedCategories.value.some((cat) => {
          if (cat === '已學會') return false
          return allCategories.value[cat]?.some((w) => w.id === item.id)
        })
        if (!inOtherCats) shouldRemoveFromGame = true
      }
    } else {
      // 情況 B：標記打勾 (變成已學會)
      // 一般練習中，學會的字就不該繼續出現，直接抽走！
      if (!selectedCategories.value.includes('已學會')) {
        shouldRemoveFromGame = true
      }
    }

    if (pruneEmptyCategory('已學會')) return

    // 執行卡片抽除與畫面過渡
    if (shouldRemoveFromGame) removeFromGame(item)
  }

  // 🌟 雲端初始化（原版 initAuthListener 成功回呼；未登入由 router guard 導回大廳）
  let disposed = false
  const initializeCloudSync = async () => {
    try {
      const thai = await cloud.loadThai()
      if (disposed) return
      // 收藏／已學會／壞音檔名單：覆蓋本機、UUID 遷移並寫回 localStorage（store 統一處理）
      if (thai && vocab.applyCloudData(thai)) syncToCloud() // 覆寫舊格式回雲端
    } catch (error) {
      console.warn('雲端同步模組載入失敗', error)
    }
    if (disposed) return
    // 雲端沒有資料或載入失敗時，也用 localStorage 的資料開始（原版會一直停在 LOADING）
    initGame(false)
  }

  // ==========================================
  // 🌟 新增：手勢滑動與跳題邏輯 🌟
  // ==========================================
  const touchStartX = ref(0)

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0]!.clientX
  }

  const handleTouchEnd = (e: TouchEvent) => {
    // 如果正在動畫過渡中，或遊戲已結束，就不處理滑動
    if (isTransitioning.value || isFinished.value) return

    const touchEndX = e.changedTouches[0]!.clientX
    const diffX = touchStartX.value - touchEndX

    if (Math.abs(diffX) > 50) { // 滑動距離超過 50px 才觸發
      if (diffX < 0) {
        // 向右滑 (手指往右) -> 回上一題
        skipToPrev()
      } else {
        // 向左滑 (手指往左) -> 跳下一題
        skipToNext()
      }
    }
  }

  const skipToNext = () => {
    if (currentIndex.value < words.value.length - 1) {
      currentIndex.value++
      resetForSkip()
    }
  }

  const skipToPrev = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--
      resetForSkip()
    }
  }

  const resetForSkip = () => {
    // 清空輸入框
    inputValue.value = ''
    if (inputEl) inputEl.value = ''
    isWrong.value = false

    // 焦點重新回到輸入框
    nextTick(() => keepFocus())
    // (註：音檔的部分不用特別寫，因為 watch(currentIndex) 已經會自動幫忙念出新單字了！)
  }

  /** 原版 onMounted 的內容 */
  const mount = () => {
    initializeCloudSync()
    // 監聽首次互動 (點擊、觸控或任何鍵盤按鍵)
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)
  }

  /** SPA 換頁清理（原版換頁時由瀏覽器自動處理） */
  const unmount = () => {
    disposed = true
    removeFirstInteractionListeners()
    window.speechSynthesis.cancel()
    if (mainAudioObj) {
      mainAudioObj.onerror = null
      mainAudioObj.pause()
    }
    closeAudioEngine()
  }

  return {
    isLoading,
    isDownloading, downloadProgress, downloadTotal, downloadModal, startDownload, closeDownloadModal, executeDownload,
    allCategories, selectedCategories, toggleCategory, resetCategories,
    words, currentIndex, inputValue, stats, isFinished, isWrong, isTransitioning, currentWord, accuracy, remainingCount,
    matchedText, wrongText, remainingText, nextCharToType,
    handleInput, initGame, playCurrentWord, keepFocus, initAudioEngine,
    isCustomWord, toggleCustomWord, isKnownWord, toggleKnownWord,
    handleTouchStart, handleTouchEnd,
    setInputRef, setMainPlayer, mount, unmount,
  }
}

export type TypingPageContext = ReturnType<typeof createTypingPage>

const TypingPageKey: InjectionKey<TypingPageContext> = Symbol('TypingPage')

export const provideTypingPage = () => {
  const ctx = createTypingPage()
  provide(TypingPageKey, ctx)
  return ctx
}

export const useTypingPageContext = () => {
  const ctx = inject(TypingPageKey)
  if (!ctx) throw new Error('useTypingPageContext 必須在 ThaiTypingView 底下使用')
  return ctx
}
