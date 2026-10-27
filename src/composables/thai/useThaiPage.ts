import { computed, inject, nextTick, provide, reactive, ref, shallowRef, type InjectionKey } from 'vue'
import { storeToRefs } from 'pinia'
import { sentenceData, thaiData, toneExamples, tonePracticeSeries } from '@/data/thai'
import { thaiVowelSpeak, thaiWriteBase } from '@/data/thaiWriteBase'
import { getAudioUrl, hasAudioFile } from '@/services/offlineAudio'
import { cancelTTS, speakNow, ttsDelay } from '@/utils/tts'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { useTimers } from '@/composables/useTimers'
import { useHandwriting } from '@/composables/useHandwriting'
import { shuffleArray } from '@/utils/shuffle'
import { safeStorage } from '@/utils/storage'
import type { Sentence, ThaiItem, ThaiItemType, ToneKey } from '@/types/thai'

// 聽音辨字、看字選音、翻牌記憶不出已停用的字（ฦ、ฦๅ）；學習卡片照常顯示，課程考試另有規則（照常出題）。
// 用 char 查 thaiData：錯題清單存的是整個物件，可能是加 deprecated 之前存的
const DEPRECATED_CHARS = new Set(thaiData.flatMap((t) => (t.deprecated ? [t.char] : [])))
const isDeprecated = (item: ThaiItem) => DEPRECATED_CHARS.has(item.char)
const quizData = thaiData.filter((i) => !isDeprecated(i))

export type ThaiMode =
  | 'learn'
  | 'tone_training'
  | 'quiz_hear'
  | 'quiz_read'
  | 'sentence_practice'
  | 'game_memory'
  | 'favorites'
  | 'mistakes'

type LearnFilter = ThaiItemType
type SpeakTarget = string | { soundText?: string; char?: string; type?: string } | null | undefined

interface MemoryCard {
  name: string
  content: string
  /** 元音的字卡：改用 VowelText 畫 writeBase（อ 淺色；刻意和原版不同），content 不顯示 */
  vowelText?: string
  vowelFontSize?: number
  item: ThaiItem
  flipped: boolean
  matched: boolean
  shake: boolean
}

/**
 * thai.html 的頁面邏輯（原版 createApp setup 的內容）。
 * 在 ThaiView 建立並 provide，子元件以 useThaiPageContext() 取得。
 */
export const createThaiPage = () => {
  const store = useThaiLearnStore()
  const { isDark, showPinyin, speechRate, favorites, mistakeList, correctCounts } = storeToRefs(store)
  const { later, cancel } = useTimers()

  const currentMode = ref<ThaiMode>('learn')
  const voices = shallowRef<SpeechSynthesisVoice[]>([])
  const selectedVoiceIndex = ref(0)
  const toast = ref({ show: false, message: '' })
  let toastTimeout: ReturnType<typeof setTimeout> | null = null

  const modals = ref({ help: false, calc: false, writing: false })

  const modeOptions: { id: ThaiMode; icon: string; label: string }[] = [
    { id: 'learn', icon: '📖', label: '學習模式' },
    { id: 'tone_training', icon: '📈', label: '聲調訓練' },
    { id: 'quiz_hear', icon: '👂', label: '聽音辨字' },
    { id: 'quiz_read', icon: '👁️', label: '看字選音' },
    { id: 'sentence_practice', icon: '🗣️', label: '句子特訓' },
    { id: 'game_memory', icon: '🧩', label: '翻牌記憶' },
  ]

  // Learn
  const learnCategories: { id: LearnFilter | 'divider'; label?: string }[] = [
    { id: 'consonant', label: '輔音' }, { id: 'vowel', label: '元音' }, { id: 'toneMark', label: '聲調' }, { id: 'numbers', label: '數字' },
    { id: 'divider' }, { id: 'fruits', label: '🥭 水果' }, { id: 'animals', label: '🐶 動物' }, { id: 'colors', label: '🎨 顏色' }, { id: 'days', label: '📅 日期' }, { id: 'family', label: '👪 家人' },
  ]
  const currentFilter = ref<LearnFilter | 'divider'>('consonant')
  const currentToneFilter = ref('All')
  const showCommonOnly = ref(false)
  const animatingCards = ref<Record<string, boolean>>({})
  const filteredLearnData = computed(() => {
    let data = thaiData.filter((item) => item.type === currentFilter.value)
    if (currentFilter.value === 'consonant' && showCommonOnly.value) data = data.filter((item) => item.isCommon !== false)
    if (currentFilter.value === 'consonant' && currentToneFilter.value !== 'All') data = data.filter((item) => item.toneClass === currentToneFilter.value)
    return data
  })

  // Tone Calc
  const toneCalcTab = ref<'calc' | 'cheat'>('calc')
  const toneCalc = reactive({ class: 'Mid', syllable: 'Live', mark: 'None' })
  const toneCalcResultData = computed(() => {
    let tk = 'Unknown'
    const { class: cClass, syllable: sy, mark } = toneCalc
    if (mark && mark !== 'None') {
      if (cClass === 'Mid') { tk = mark === 'Ek' ? 'Low' : mark === 'Tho' ? 'Falling' : mark === 'Tri' ? 'High' : mark === 'Jat' ? 'Rising' : 'Unknown' }
      else if (cClass === 'High') { tk = mark === 'Ek' ? 'Low' : mark === 'Tho' ? 'Falling' : 'Unknown' }
      else if (cClass === 'Low') { tk = mark === 'Ek' ? 'Falling' : mark === 'Tho' ? 'High' : 'Unknown' }
    } else {
      if (sy === 'Live') { tk = cClass === 'Mid' ? 'Mid' : cClass === 'High' ? 'Rising' : cClass === 'Low' ? 'Mid' : 'Unknown' }
      else if (sy === 'DeadShort') { tk = cClass === 'Mid' ? 'Low' : cClass === 'High' ? 'Low' : cClass === 'Low' ? 'High' : 'Unknown' }
      else if (sy === 'DeadLongOrStop') { tk = cClass === 'Mid' ? 'Low' : cClass === 'High' ? 'Low' : cClass === 'Low' ? 'Falling' : 'Unknown' }
    }
    return toneExamples[tk as ToneKey] || { thai: '?', read: '?', desc: '未知' }
  })

  // Quiz
  const quiz = reactive({
    scope: 'basic' as 'basic' | 'vocab' | 'advanced' | 'favorites',
    // 目前出題來源（原版 startQuiz('mistakes') 沒有記錄，Mode 標籤與範圍按鈕不會跟著變）
    filter: 'normal' as 'normal' | 'mistakes' | 'favorites',
    score: 0,
    total: 0,
    currentItem: null as ThaiItem | null,
    options: [] as ThaiItem[],
    answered: false,
    feedback: '',
    finished: false,
    deck: [] as ThaiItem[],
  })
  const quizModeLabel = computed(() =>
    quiz.filter === 'mistakes' ? '錯題複習' : currentMode.value === 'quiz_hear' ? '聽音辨字' : currentMode.value === 'favorites' ? '收藏複習' : currentMode.value === 'mistakes' ? '錯題複習' : '看字選音',
  )

  // Sentence
  const sentenceCats = [{ id: 'All', label: '全部' }, { id: 'Basic', label: '日常' }, { id: 'Shopping', label: '🛍️ 購物' }, { id: 'Food', label: '飲食' }, { id: 'Travel', label: '旅遊' }, { id: 'Emergency', label: '緊急' }]
  const sentence = reactive({ category: 'All', current: null as Sentence | null, revealed: false })

  // Memory
  const memory = reactive({ cards: [] as MemoryCard[], flipped: [] as MemoryCard[], moves: 0, matched: 0, lock: false })

  // Tone Training
  const toneTraining = reactive({
    mode: 'compare' as 'compare' | 'challenge',
    currentToneBase: 'Gaa',
    streak: 0,
    targetChar: null as string | null,
    targetIdx: -1,
    targetLabel: '',
    feedback: '',
    isLocked: false,
  })
  const toneHeaders = ['第一聲(Mid)<br>—', '第二聲(Low)<br>\\\\', '第三聲(Fall)<br>^', '第四聲(High)<br>/', '第五聲(Rise)<br>v']
  // 原版按鈕另有 dark:bg-opacity-20（v3 會讓深色模式背景變 20% 不透明）；v4 已移除該 utility，改用 /20 寫在各色彩上
  const toneColors = [
    'bg-green-100 border-green-500 text-green-800 dark:bg-green-100/20',
    'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-100/20',
    'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-100/20',
    'bg-red-100 border-red-500 text-red-800 dark:bg-red-100/20',
    'bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-100/20',
  ]
  const toneGraphs = ['<path d="M5 10 H35" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>', '<path d="M5 5 L35 15" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>', '<path d="M5 15 Q20 0 35 15" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>', '<path d="M5 15 L35 5" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>', '<path d="M5 5 Q20 20 35 5" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>']
  const currentTonePracticeChars = computed(() => tonePracticeSeries.find((d) => d.base === toneTraining.currentToneBase)?.chars || [])
  const animatingToneIdx = ref(-1)
  const toneChallengeOpts = [{ sym: '—', label: '中' }, { sym: '\\\\', label: '低' }, { sym: '^', label: '下' }, { sym: '/', label: '高' }, { sym: 'V', label: '上' }]
  const selectedToneOpt = ref(-1)

  // Handwriting
  const hwItem = ref<ThaiItem | null>(null)
  const hw = useHandwriting({ isDark })

  const syncToCloud = () => store.syncToCloud()

  // 元音的 mp3（th_สระอะ.mp3）：刻意和原版不同，原版一律 TTS
  const vowelAudio = typeof Audio === 'undefined' ? null : new Audio()
  const stopSpeaking = () => {
    vowelAudio?.pause()
    cancelTTS()
  }

  const speakTTS = (soundText: string) => {
    const utterance = new SpeechSynthesisUtterance(soundText)
    // 原版存在 window.currentUtterance，避免被 GC 中斷播放
    ;(window as unknown as { currentUtterance: SpeechSynthesisUtterance }).currentUtterance = utterance
    utterance.lang = 'th-TH'
    if (voices.value[selectedVoiceIndex.value]) utterance.voice = voices.value[selectedVoiceIndex.value]
    utterance.rate = speechRate.value
    // 不用等就同步 speak（iOS 第一次 speak 必須在點擊事件內）；剛 cancel 過才延遲（iOS cancel 後馬上 speak 會被吃掉，見 utils/tts.ts）
    const wait = ttsDelay()
    if (wait === 0) speakNow(utterance)
    else later(() => speakNow(utterance), wait)
  }

  const speak = (item: SpeakTarget, showToast = true) => {
    if (!item) return
    stopSpeaking()
    // 元音一律念 สระ＋母音（thaiData 的 speakText，用 char 查；獨立母音 รึ、รือ）
    const vowelSpeak = typeof item === 'string' ? undefined : thaiVowelSpeak(item)
    const soundText = vowelSpeak ?? ((typeof item === 'string' ? item : item.soundText || item.char) || '')
    if (showToast) {
      toast.value = { show: true, message: `播放: ${soundText}` }
      cancel(toastTimeout)
      toastTimeout = later(() => { toast.value.show = false }, 1500)
    }
    if (vowelSpeak && vowelAudio && hasAudioFile(vowelSpeak)) {
      vowelAudio.src = getAudioUrl(vowelSpeak, 'th')
      vowelAudio.playbackRate = speechRate.value
      vowelAudio.play().catch((e: Error) => {
        // 被下一次播放中斷（AbortError）不退回 TTS
        if (e.name !== 'AbortError') speakTTS(soundText)
      })
      return
    }
    speakTTS(soundText)
  }

  const playSample = () => speak({ soundText: 'สวัสดี' }, false)

  const switchMode = (mode: ThaiMode) => {
    currentMode.value = mode
    if (mode.startsWith('quiz')) startQuiz('normal')
    else if (mode === 'sentence_practice') { sentence.category = 'All'; nextSentence() }
    else if (mode === 'game_memory') initMemoryGame()
    else if (mode === 'tone_training') { toneTraining.mode = 'compare'; toneTraining.currentToneBase = 'Gaa' }
  }

  const toggleDarkMode = () => { isDark.value = !isDark.value }
  const togglePinyin = () => { showPinyin.value = !showPinyin.value; safeStorage.set('showPinyin', showPinyin.value) }
  const resetAllData = () => { if (confirm('確定要清空所有紀錄與設定嗎？')) { store.resetOwnData(); location.reload() } }
  const toggleStar = (id: string) => {
    const idx = favorites.value.indexOf(id)
    if (idx > -1) favorites.value.splice(idx, 1); else favorites.value.push(id)
    safeStorage.set('thai_favorites', favorites.value)
    syncToCloud()
  }

  // Quiz Logic
  const setQuizScope = (scope: typeof quiz.scope) => { quiz.scope = scope; startQuiz('normal') }
  const startQuiz = (modeFilter: 'normal' | 'mistakes' | 'favorites') => {
    quiz.score = 0; quiz.finished = false; quiz.filter = modeFilter
    let deck: ThaiItem[] = []
    if (modeFilter === 'mistakes') deck = mistakeList.value.filter((i) => !isDeprecated(i))
    else if (modeFilter === 'favorites') deck = quizData.filter((i) => favorites.value.includes(i.soundText || i.char))
    else {
      if (quiz.scope === 'basic') deck = quizData.filter((i) => i.type === 'consonant' || i.type === 'vowel')
      else if (quiz.scope === 'vocab') deck = quizData.filter((i) => ['fruits', 'animals', 'colors', 'days', 'family'].includes(i.type))
      // 新增「收藏」範圍：只出收藏過的題目（收藏 id 為 soundText 或 char，與 toggleStar 一致）
      else if (quiz.scope === 'favorites') deck = quizData.filter((i) => favorites.value.includes(i.soundText || i.char))
      else deck = quizData.filter((i) => i.type === 'toneMark' || i.type === 'numbers')
    }
    quiz.deck = shuffleArray(deck)
    quiz.total = quiz.deck.length
    nextQuizQuestion()
  }
  const nextQuizQuestion = () => {
    quiz.answered = false; quiz.feedback = ''
    if (quiz.deck.length === 0) { quiz.finished = true; return }
    const current = quiz.deck.shift() as ThaiItem
    quiz.currentItem = current
    const pool = quizData.filter((i) => i.type === current.type)
    const opts: ThaiItem[] = [current]
    while (opts.length < 4) {
      const randomItem = pool.length >= 4 ? pool[Math.floor(Math.random() * pool.length)] : quizData[Math.floor(Math.random() * quizData.length)]
      if (!opts.find((o) => o.name === randomItem.name)) opts.push(randomItem)
    }
    quiz.options = shuffleArray(opts)
  }
  const handleQuizAnswer = (opt: ThaiItem) => {
    if (quiz.answered) { speak(opt, false); return }
    const current = quiz.currentItem as ThaiItem
    quiz.answered = true
    const isCorrect = opt.name === current.name
    if (isCorrect) {
      quiz.score++
      const emoji = current.img || ''
      quiz.feedback = `<span class="text-emerald-600">✨ 正確！</span> <span class="mx-2 text-gray-700 thai-font dark:text-white">${current.thaiLabel} ${emoji}</span> <span class="text-sm text-gray-500">(${current.meaning})</span>`
      const key = current.name || current.char
      correctCounts.value[key] = (correctCounts.value[key] || 0) + 1
      mistakeList.value = mistakeList.value.filter((m) => m.name !== current.name)
      safeStorage.set('thai_correct_counts', correctCounts.value)
      safeStorage.set('thai_mistakes', mistakeList.value)
      syncToCloud()
      if (currentMode.value === 'quiz_read') later(() => speak(quiz.currentItem, false), 300)
    } else {
      quiz.feedback = `<span class="text-red-500">❌ 錯誤！</span> 答案是 <span class="mx-2 text-lg text-gray-800 thai-font dark:text-white">${current.thaiLabel}</span>`
      if (!mistakeList.value.find((m) => m.name === current.name)) {
        mistakeList.value.push(current)
        safeStorage.set('thai_mistakes', mistakeList.value)
      }
      syncToCloud()
      quiz.deck.splice(Math.min(3 + Math.floor(Math.random() * 3), quiz.deck.length), 0, current)
      later(() => speak(quiz.currentItem, false), 500)
    }
  }
  const getQuizOptClass = (opt: ThaiItem) => {
    if (!quiz.answered) return 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
    const isSelected = opt.name === quiz.currentItem?.name
    return isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/50 ring-2 ring-emerald-300 dark:ring-emerald-600' : 'border-gray-100 bg-white dark:border-slate-600 dark:bg-slate-700'
  }

  // Sentence Logic
  const setSentenceCat = (cat: string) => { sentence.category = cat; nextSentence() }
  const nextSentence = () => {
    let list = sentenceData
    if (sentence.category !== 'All') list = list.filter((s) => s.cat === sentence.category)
    if (list.length === 0) return
    sentence.current = list[Math.floor(Math.random() * list.length)]
    sentence.revealed = false
  }

  // Memory Game
  const initMemoryGame = () => {
    memory.moves = 0; memory.matched = 0; memory.lock = false; memory.flipped = []
    const pool = shuffleArray([...quizData]).slice(0, 6)
    const cards: Omit<MemoryCard, 'flipped' | 'matched' | 'shake'>[] = []
    pool.forEach((i) => {
      const fs = i.char.length > 2 ? 'text-xl' : 'text-3xl'
      cards.push({ name: i.name, content: `<div class="${fs} font-bold thai-font text-center leading-tight px-1 text-emerald-600 dark:text-emerald-400">${i.char}</div>`, item: i,
        ...(thaiWriteBase(i) ? { vowelText: thaiWriteBase(i), vowelFontSize: fs === 'text-xl' ? 20 : 30 } : {}) })
      cards.push({ name: i.name, content: `<div class="text-sm font-bold text-center text-gray-600 dark:text-gray-300">${i.meaning}<br><span class="text-xl">${i.img || ''}</span></div>`, item: i })
    })
    memory.cards = shuffleArray(cards).map((c) => ({ ...c, flipped: false, matched: false, shake: false }))
  }
  const flipMemoryCard = (card: MemoryCard) => {
    if (memory.lock || card.flipped || card.matched) return
    card.flipped = true
    memory.flipped.push(card)
    if (memory.flipped.length === 2) {
      memory.moves++; memory.lock = true
      const [c1, c2] = memory.flipped
      if (c1.name === c2.name) {
        c1.matched = c2.matched = true; memory.matched += 2; memory.flipped = []; memory.lock = false
        speak(c1.item, false)
      } else {
        c1.shake = c2.shake = true
        later(() => { c1.flipped = c2.flipped = c1.shake = c2.shake = false; memory.flipped = []; memory.lock = false }, 1000)
      }
    }
  }

  // Tone Training Logic
  const playToneSequence = () => {
    const chars = currentTonePracticeChars.value
    if (!chars.length) return
    let idx = 0
    const playNext = () => {
      if (idx < chars.length) {
        speak({ soundText: chars[idx] }, false)
        triggerToneButtonAnimation(idx)
        idx++
        later(playNext, 1200)
      }
    }
    playNext()
  }
  const triggerToneButtonAnimation = (idx: number) => {
    animatingToneIdx.value = idx
    later(() => (animatingToneIdx.value = -1), 800)
  }
  const startNewToneChallenge = () => {
    toneTraining.feedback = ''; selectedToneOpt.value = -1; toneTraining.isLocked = false
    const base = tonePracticeSeries[Math.floor(Math.random() * tonePracticeSeries.length)]
    const toneIdx = Math.floor(Math.random() * 5)
    const names = ['中音 (Mid)', '低音 (Low)', '下聲 (Falling)', '高音 (High)', '上聲 (Rising)']
    toneTraining.targetChar = base.chars[toneIdx]; toneTraining.targetIdx = toneIdx; toneTraining.targetLabel = names[toneIdx]
  }
  // 修正原版 bug：原版「挑戰」按鈕只呼叫 startNewToneChallenge，不會切換到挑戰畫面
  const enterToneChallenge = () => {
    toneTraining.mode = 'challenge'
    startNewToneChallenge()
  }
  const checkToneGuess = (idx: number) => {
    if (toneTraining.isLocked) return
    selectedToneOpt.value = idx; toneTraining.isLocked = true
    if (idx === toneTraining.targetIdx) {
      toneTraining.streak++
      toneTraining.feedback = `<span class="text-emerald-500 text-lg font-bold">✨ 正確！是 ${toneTraining.targetChar}</span>`
    } else {
      toneTraining.streak = 0
      toneTraining.feedback = `<span class="text-red-500 font-bold">❌ 不對喔！正確是：${toneTraining.targetLabel} (${toneTraining.targetChar})</span>`
      later(() => speak(toneTraining.targetChar, false), 300)
    }
  }
  const getToneBtnStyle = (idx: number) => {
    if (!toneTraining.isLocked) return 'bg-white border-gray-100 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600'
    if (idx === toneTraining.targetIdx) return 'bg-emerald-100 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300 scale-105'
    if (idx === selectedToneOpt.value) return 'bg-red-100 border-red-500 text-red-800 shake-anim'
    return 'bg-white border-gray-100 dark:bg-slate-700 dark:border-slate-600 opacity-50'
  }
  const isToneOptSelected = (idx: number) => toneTraining.isLocked && (idx === toneTraining.targetIdx || idx === selectedToneOpt.value)

  // HW Logic（畫布、筆色、縮放、清除、筆順動畫在 useHandwriting；彈窗是共用的 HandwritingModal）
  // 元音：底圖用 writeBase（อ 淺色，同課程頁 VowelGuide），筆順疊在底圖上、不縮放到筆畫範圍（刻意和原版不同）
  const hwGuideText = computed(() => thaiWriteBase(hwItem.value))
  const openHW = (item: ThaiItem) => {
    hwItem.value = item; modals.value.writing = true
    nextTick(() => {
      if (hw.initCanvas() && !hwGuideText.value) hw.autoZoomSvg(hwItem.value?.strokes)
    })
  }

  const clickLearnCard = (elem: ThaiItem) => {
    speak(elem, true)
    const id = elem.soundText || elem.char
    animatingCards.value[id] = true
    later(() => { animatingCards.value[id] = false }, 300)
  }

  const initVoices = () => {
    voices.value = window.speechSynthesis.getVoices().filter((i) => i.lang.includes('th'))
    if (voices.value.length > 0 && selectedVoiceIndex.value >= voices.value.length) selectedVoiceIndex.value = 0
  }

  // 數字鍵 1～5 只在聲調「挑戰」模式作答（原版在「對照」模式也會於背景觸發 checkToneGuess）
  const handleKeydown = (e: KeyboardEvent) => {
    const tagName = (e.target as HTMLElement | null)?.tagName
    if (tagName === 'INPUT' || tagName === 'SELECT') return
    if (e.code === 'Space') { e.preventDefault(); if (currentMode.value === 'sentence_practice') speak({ soundText: sentence.current?.soundText }, true); else if (currentMode.value.startsWith('quiz')) speak(quiz.currentItem, false); else if (currentMode.value === 'tone_training') speak(toneTraining.targetChar, false) }
    else if (e.code === 'ArrowRight' || e.code === 'Enter') { if (currentMode.value === 'sentence_practice') nextSentence(); else if (currentMode.value.startsWith('quiz') && quiz.answered) nextQuizQuestion(); else if (currentMode.value === 'tone_training' && toneTraining.isLocked) startNewToneChallenge() }
    else if (currentMode.value === 'tone_training' && toneTraining.mode === 'challenge' && !toneTraining.isLocked && e.code.startsWith('Digit')) { const idx = parseInt(e.key) - 1; if (idx >= 0 && idx < 5) checkToneGuess(idx) }
    else if (currentMode.value.startsWith('quiz') && !quiz.answered && e.code.startsWith('Digit')) { const idx = parseInt(e.key) - 1; if (idx >= 0 && idx < 4) handleQuizAnswer(quiz.options[idx]) }
  }

  return {
    currentMode, isDark, showPinyin, speechRate, voices, selectedVoiceIndex, toast, playSample,
    modals, favorites, correctCounts, mistakeList, modeOptions, learnCategories, currentFilter, currentToneFilter, showCommonOnly, filteredLearnData, animatingCards, clickLearnCard,
    toneCalcTab, toneCalc, toneCalcResultData,
    quiz, quizModeLabel, getQuizOptClass, setQuizScope, startQuiz, nextQuizQuestion, handleQuizAnswer,
    sentenceCats, sentence, setSentenceCat, nextSentence,
    memory, initMemoryGame, flipMemoryCard,
    toneTraining, toneHeaders, toneGraphs, toneColors, currentTonePracticeChars, animatingToneIdx, playToneSequence, triggerToneButtonAnimation, toneChallengeOpts, selectedToneOpt, startNewToneChallenge, enterToneChallenge, checkToneGuess, getToneBtnStyle, isToneOptSelected,
    hwItem, hwGuideText, hw, openHW, stopSpeaking,
    speak, switchMode, toggleDarkMode, togglePinyin, resetAllData, toggleStar,
    initVoices, handleKeydown,
  }
}

export type ThaiPageContext = ReturnType<typeof createThaiPage>

const ThaiPageKey: InjectionKey<ThaiPageContext> = Symbol('ThaiPage')

export const provideThaiPage = () => {
  const ctx = createThaiPage()
  provide(ThaiPageKey, ctx)
  return ctx
}

export const useThaiPageContext = () => {
  const ctx = inject(ThaiPageKey)
  if (!ctx) throw new Error('useThaiPageContext 必須在 ThaiView 底下使用')
  return ctx
}
