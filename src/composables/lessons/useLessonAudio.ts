import { inject, onBeforeUnmount, provide, type InjectionKey } from 'vue'
import { useTimers } from '@/composables/useTimers'
import { getAudioUrl, hasAudioFile } from '@/services/offlineAudio'
import { cancelTTS, speakNow, thaiUtterance, ttsDelay } from '@/utils/tts'

/**
 * 課程頁發音：先播 audio/TH/th_{文字}.mp3，沒有音檔（或播放失敗）退回 TTS。
 * 同 /typing 的修正：playToken 讓連續點擊只念最後一個，被下一次 pause() 中斷的播放不退回 TTS。
 * TTS 的時序見 utils/tts.ts（iOS Safari：cancel 後馬上 speak 會被吃掉）。
 */
export const useLessonAudio = () => {
  const { later } = useTimers()
  const audio = new Audio()
  let playToken = 0
  let disposed = false

  // onEnd：念完才呼叫（被下一次播放中斷就不呼叫），連續播放用
  const speakTTS = (text: string, token: number, onEnd?: () => void) => {
    if (!window.speechSynthesis) return
    cancelTTS()
    const ut = thaiUtterance(text, 0.9)
    if (onEnd) ut.onend = () => {
      if (token === playToken && !disposed) onEnd()
    }
    const wait = ttsDelay()
    // 不用等就同步 speak：iOS 第一次 speak 必須在點擊事件內（setTimeout 會脫離使用者操作）
    if (wait === 0) {
      speakNow(ut)
      return
    }
    later(() => {
      if (token !== playToken || disposed) return
      speakNow(ut)
    }, wait)
  }

  /** 沒有音檔（或 ttsOnly）直接用 TTS，不發請求；onEnd 在念完時呼叫（被中斷就不呼叫） */
  const play = async (text: string, ttsOnly = false, onEnd?: () => void) => {
    const token = ++playToken
    cancelTTS()
    audio.pause()
    audio.onended = null
    if (ttsOnly || !hasAudioFile(text, 'th')) {
      speakTTS(text, token, onEnd)
      return
    }

    let isResolved = false
    const fallback = () => {
      if (isResolved || token !== playToken || disposed) return
      isResolved = true
      speakTTS(text, token, onEnd)
    }
    audio.onended = () => {
      audio.onended = null
      if (token === playToken && !disposed) onEnd?.()
    }
    audio.onerror = () => {
      audio.onerror = null
      fallback()
    }
    audio.src = getAudioUrl(text, 'th')
    audio.load()
    try {
      await audio.play()
    } catch (e) {
      if (disposed) return
      const err = e as Error
      if (err.name === 'AbortError' || err.message.includes('interrupted')) return
      fallback()
    }
  }

  /** 依序播放（念完一個，隔 gapMs 再念下一個）；中途有其他播放就停止。全部念完呼叫 onDone */
  const playSequence = (texts: readonly string[], onDone?: () => void, gapMs = 500) => {
    const step = (i: number) => {
      const text = texts[i]
      if (text === undefined) {
        onDone?.()
        return
      }
      void play(text, false, () => {
        const token = playToken
        later(() => {
          if (token === playToken && !disposed) step(i + 1)
        }, i === texts.length - 1 ? 0 : gapMs)
      })
    }
    step(0)
  }

  const stop = () => {
    playToken++
    audio.pause()
    cancelTTS()
  }

  onBeforeUnmount(() => {
    disposed = true
    stop()
    audio.onerror = null
    audio.onended = null
    audio.removeAttribute('src')
  })

  return { play, playSequence, stop }
}

type LessonAudio = ReturnType<typeof useLessonAudio>
const LESSON_AUDIO_KEY: InjectionKey<LessonAudio> = Symbol('lessonAudio')

/** 課程頁建立一個共用的播放器，子元件以 useLessonAudioContext() 取得 */
export const provideLessonAudio = (): LessonAudio => {
  const audio = useLessonAudio()
  provide(LESSON_AUDIO_KEY, audio)
  return audio
}

export const useLessonAudioContext = (): LessonAudio => {
  const audio = inject(LESSON_AUDIO_KEY)
  if (!audio) throw new Error('useLessonAudioContext() 必須在 provideLessonAudio() 之下使用')
  return audio
}
