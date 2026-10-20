import { describe, expect, it } from 'vitest'
import { audioFileName, getAudioUrl, hasAudioFile } from '@/services/offlineAudio'

describe('音檔清單（build 時掃描 public/audio/TH/）', () => {
  it('檔名規則同原版：斜線換成底線', () => {
    expect(audioFileName('สวัสดี', 'th')).toBe('th_สวัสดี.mp3')
    expect(audioFileName('對不起/請問', 'zh')).toBe('zh_對不起_請問.mp3')
    expect(getAudioUrl('สวัสดี')).toBe('/audio/TH/th_สวัสดี.mp3')
  })
  it('現有的字有音檔', () => {
    expect(hasAudioFile('สวัสดี', 'th')).toBe(true)
    expect(hasAudioFile('你好', 'zh')).toBe(true)
  })
  it('缺少的音檔回傳 false', () => {
    // 用確定不存在的檔名（zh___test_missing__.mp3），不依賴實際音檔的狀態
    expect(hasAudioFile('__test_missing__', 'zh')).toBe(false)
    expect(hasAudioFile('ไม่มีไฟล์นี้', 'th')).toBe(false)
  })
})
