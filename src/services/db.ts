import { doc, getDoc, setDoc, type DocumentData } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'

/**
 * 上傳學習進度到雲端（users/{uid}，merge 寫入，不覆蓋其他欄位）
 * @param lang 欄位名稱（如 'thai'）
 * @param data 要存的資料
 * @returns 是否上傳成功（錯誤照原版只印 console；需要顯示失敗狀態的頁面看回傳值）
 */
export const saveProgressToCloud = async (lang: string, data: unknown): Promise<boolean> => {
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
