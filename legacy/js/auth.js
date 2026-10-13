// 引入 Firebase SDK (使用 ES Module 版本)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
// 引入剛寫好的 Config
import { firebaseConfig, allowedEmails } from './config.js'

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// ✨ 修改點 1：加上 export，讓外部拿得到 auth 實體
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()

export const db = getFirestore(app)
export { doc, getDoc, setDoc, updateDoc } // 匯出給別的檔案用

// ✨ 修改點 2：把原本引入的 SDK 功能再匯出給 index.html 用
export { signInWithPopup, signOut }

/**
 * 初始化驗證監聽器
 * @param {Function} onLoginSuccess - 登入成功且在白名單時的回調 (user) => {}
 * @param {Function} onLoginFail - 登入失敗或不在白名單時的回調 (errorMsg) => {}
 * @param {Function} onLoading - 載入狀態回調 (isLoading) => {}
 */
export function initAuthListener(onLoginSuccess, onLoginFail, onLoading) {
  // 為了避免畫面閃爍，一開始先當作讀取中
  if (onLoading) onLoading(true)

  onAuthStateChanged(auth, (user) => {
    // 狀態確定了，讀取結束
    if (onLoading) onLoading(false)

    if (user) {
      // 檢查白名單
      if (allowedEmails.includes(user.email)) {
        onLoginSuccess(user)
      } else {
        // 已登入但不在白名單，強制登出
        signOut(auth)
        onLoginFail('抱歉，此帳號沒有存取權限')
      }
    } else {
      // 未登入狀態
      onLoginFail(null) // null 代表不顯示錯誤訊息，只是回到登入畫面
    }
  })
}
