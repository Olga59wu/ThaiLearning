import { VOCAB_CATEGORIES } from '@/data/thaiVocab'

// 原版 ./audio/TH/{th|zh}_{文字}.mp3（斜線換成底線）
export const getAudioUrl = (text: string, type: 'th' | 'zh' = 'th'): string => {
  const langCode = type === 'th' ? 'th' : 'zh'
  const safeText = text.replace(/\//g, '_')
  return `${import.meta.env.BASE_URL}audio/TH/${langCode}_${safeText}.mp3`
}

// 🎧 一鍵下載所有離線音檔 (掃描泰文與中文發音)
// 逐一 fetch，由 Service Worker 寫入 lang-audio-cache-v3
// isCancelled：SPA 離開頁面時中止（原版換頁時由瀏覽器中斷）
export const downloadOfflineAudio = async (
  onProgress?: (current: number, total: number) => void,
  isCancelled?: () => boolean,
): Promise<number> => {
  const audioUrls: string[] = []

  // 走訪所有分類與單字
  Object.values(VOCAB_CATEGORIES).forEach((category) => {
    category.forEach((word) => {
      // 1. 收集泰文發音
      if (word.th) {
        audioUrls.push(getAudioUrl(word.th, 'th'))
      }
      // 2. 收集中文發音
      if (word.zh) {
        audioUrls.push(getAudioUrl(word.zh, 'zh'))
      }
    })
  })

  // 去除重複的網址
  const uniqueUrls = [...new Set(audioUrls)]
  let successCount = 0

  // 逐一下載
  for (let i = 0; i < uniqueUrls.length; i++) {
    if (isCancelled?.()) break
    try {
      const response = await fetch(uniqueUrls[i])
      if (response.ok) {
        successCount++
      } else {
        // 如果有音檔找不到，會在 F12 印出紅字提示
        console.warn(`找不到音檔: ${uniqueUrls[i]}`)
      }
    } catch (e) {
      console.error(`下載出錯: ${uniqueUrls[i]}`, e)
    }

    // 即時回報進度給畫面 (例如：下載中 15/652)
    if (onProgress) {
      onProgress(i + 1, uniqueUrls.length)
    }
  }

  return successCount
}
