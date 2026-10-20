import { doc, getDoc, setDoc, type DocumentData } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import { DEV_SKIP_AUTH } from '@/dev/skipAuth'

/**
 * 上傳學習進度到雲端（users/{uid}，merge 寫入，不覆蓋其他欄位）
 * @param lang 欄位名稱（如 'thai'）
 * @param data 要存的資料
 * @returns 是否上傳成功（錯誤照原版只印 console；需要顯示失敗狀態的頁面看回傳值）
 */
export const saveProgressToCloud = async (lang: string, data: unknown): Promise<boolean> => {
  // 開發用跳過登入：不寫 Firestore（避免假使用者寫到真實資料），當作成功；production build 會移除這段
  if (import.meta.env.DEV && DEV_SKIP_AUTH) {
    console.info(`[開發模式] 跳過雲端寫入：${lang}`)
    return true
  }
  const user = auth.currentUser
  if (!user) return false

  try {
    const userDocRef = doc(db, 'users', user.uid)
    await setDoc(
      userDocRef,
      {
        [lang]: data,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true },
    )
    console.log(`☁️ ${lang} 進度已同步到雲端`)
    return true
  } catch (error) {
    console.error('上傳失敗:', error)
    return false
  }
}

/**
 * 從雲端下載進度
 * @returns 包含所有語言進度的物件；未登入或失敗時回傳 null
 */
export const loadProgressFromCloud = async (): Promise<DocumentData | null> => {
  // 開發用跳過登入：不讀 Firestore，當作雲端沒有紀錄（各頁只用 localStorage）
  if (import.meta.env.DEV && DEV_SKIP_AUTH) {
    console.info('[開發模式] 跳過雲端讀取')
    return {}
  }
  const user = auth.currentUser
  if (!user) return null

  try {
    const userDocRef = doc(db, 'users', user.uid)
    const docSnap = await getDoc(userDocRef)

    if (docSnap.exists()) {
      console.log('☁️ 雲端進度下載成功')
      return docSnap.data()
    } else {
      console.log('☁️ 尚無雲端紀錄，建立新檔案...')
      return {}
    }
  } catch (error) {
    console.error('下載失敗:', error)
    return null
  }
}
