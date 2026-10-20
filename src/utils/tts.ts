// TTS（speechSynthesis）的共用處理：課程頁、/thai 使用
// iOS Safari：cancel() 之後馬上 speak()，新的發音常被吃掉（要點一兩次才有聲音）。
// 只有在正在念或排隊中才 cancel，並記下時間；cancel 之後至少隔 CANCEL_GAP_MS 才 speak；
// 不用等時要同步 speak（iOS 第一次 speak 必須在點擊事件內，setTimeout 會脫離使用者操作）。
// 另外 voices 可能還沒載入（iOS 第一次常是空的）：先觸發載入，有泰文語音就指定，沒有就只設 lang。

/** cancel 之後到下一次 speak 的最短間隔 */
export const CANCEL_GAP_MS = 250

let lastCancelAt = 0

/** 停止目前的 TTS（沒有在念就不呼叫 cancel，避免 iOS 吃掉下一次 speak） */
export const cancelTTS = () => {
  const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis
  if (!synth) return
  if (synth.speaking || synth.pending) {
    synth.cancel()
    lastCancelAt = Date.now()
  }
}

/** 距離上次 cancel 還要等多久才能 speak（毫秒，0＝可以馬上念） */
export const ttsDelay = (now = Date.now()): number => Math.max(0, CANCEL_GAP_MS - (now - lastCancelAt))

/** 泰文語音（voices 還沒載入時回傳 undefined；第一次呼叫會觸發載入） */
export const thaiVoice = (): SpeechSynthesisVoice | undefined =>
  window.speechSynthesis?.getVoices().find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('th'))

/** 建立泰文的 utterance（有泰文語音就指定） */
export const thaiUtterance = (text: string, rate: number): SpeechSynthesisUtterance => {
  const ut = new SpeechSynthesisUtterance(text)
  ut.lang = 'th-TH'
  ut.rate = rate
  const voice = thaiVoice()
  if (voice) ut.voice = voice
  return ut
}

/** speak 前呼叫：iOS 有時 speechSynthesis 停在 paused 狀態 */
export const speakNow = (ut: SpeechSynthesisUtterance) => {
  const synth = window.speechSynthesis
  if (!synth) return
  synth.resume()
  synth.speak(ut)
}
