/**
 * thaiTyping.html 的 WebAudio 音效（打字聲、正確／錯誤音）。
 * 原版存在 window.audioCtx；SPA 改為每次進頁面建立、離開時 close()。
 */
export const useTypingSounds = () => {
  let audioCtx: AudioContext | null = null

  const createContext = () => {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    return new Ctor()
  }

  const initAudioEngine = () => {
    if (!audioCtx) {
      audioCtx = createContext()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  }

  const playTypeSound = () => {
    try {
      if (!audioCtx) {
        audioCtx = createContext()
      }
      const ctx = audioCtx
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.type = 'square'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.015)

      filter.type = 'highpass'
      filter.frequency.value = 800

      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.001)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.02)
    } catch (e) {
      console.error('無法播放打字音效', e)
    }
  }

  const playFeedbackSound = (isCorrect: boolean) => {
    try {
      const ctx = audioCtx
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      if (isCorrect) {
        // 正確音：高頻清脆
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      } else {
        // 錯誤音：低頻沉悶
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(150, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      }
    } catch (e) {
      console.error(e)
    }
  }

  /** SPA 離開頁面時釋放 AudioContext（瀏覽器對同時存在的數量有上限） */
  const closeAudioEngine = () => {
    if (audioCtx) {
      audioCtx.close().catch(() => {})
      audioCtx = null
    }
  }

  return { initAudioEngine, playTypeSound, playFeedbackSound, closeAudioEngine }
}
