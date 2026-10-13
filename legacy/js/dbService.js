// dbService.js
// 1. 從 auth.js 取得我們自己初始化好的「實體」 (auth 和 db)
import { auth, db } from './auth.js'

// 2. 直接從 Firebase SDK 網址取得「操作工具」 (doc, getDoc, setDoc)
// 這樣做最穩定，不會因為 auth.js 的匯出設定問題而出錯
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'

/**
 * 上傳學習進度到雲端
 * @param {string} lang - 語言 (如 'japanese', 'korean', 'thai')
 * @param {object} data - 要存的資料 (例如分數、錯題)
 */
export async function saveProgressToCloud(lang, data) {
  const user = auth.currentUser
  if (!user) return

  try {
    // 建立文件參照：users/{uid}
    const userDocRef = doc(db, 'users', user.uid)

    // 使用 setDoc + merge: true，這樣才不會覆蓋掉其他語言的進度
    await setDoc(
      userDocRef,
      {
        [lang]: data, // 例如 { japanese: { ... } }
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    )

    console.log(`☁️ ${lang} 進度已同步到雲端`)
  } catch (error) {
    console.error('上傳失敗:', error)
    // 這裡可以做 Error Handling，例如提示使用者網路不穩
  }
}

/**
 * 從雲端下載進度
 * @returns {object} 包含所有語言進度的物件
 */
export async function loadProgressFromCloud() {
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
