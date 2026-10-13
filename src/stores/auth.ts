import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, provider } from '@/services/firebase'
import { adminEmails, allowedEmails } from '@/config'

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<User | null>(null)
  // 原版 initAuthListener 的 onLoading：一開始先當作讀取中
  const isLoading = ref(true)
  const errorMessage = ref('')

  const isLoggedIn = computed(() => user.value !== null)
  const isAdmin = computed(
    () => !!user.value?.email && adminEmails.includes(user.value.email),
  )

  let resolveReady: () => void = () => {}
  // 第一次 onAuthStateChanged 回應後 resolve，供 router guard 等待
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  let started = false
  const init = () => {
    if (started) return
    started = true

    onAuthStateChanged(auth, (u) => {
      isLoading.value = false

      if (u) {
        // 檢查白名單
        if (u.email && allowedEmails.includes(u.email)) {
          user.value = u
          errorMessage.value = ''
        } else {
          // 已登入但不在白名單，強制登出
          user.value = null
          signOut(auth)
          errorMessage.value = '抱歉，此帳號沒有存取權限'
        }
      } else {
        // 未登入狀態：保留錯誤訊息（例如白名單拒絕後的強制登出），直到使用者再次點擊登入
        user.value = null
      }
      resolveReady()
    })
  }

  const login = () => {
    // 再次點擊登入時才清除先前的錯誤訊息
    errorMessage.value = ''
    return signInWithPopup(auth, provider).catch((err: Error) => {
      errorMessage.value = '登入失敗：' + err.message
    })
  }

  const logout = () => signOut(auth)

  return { user, isLoading, errorMessage, isLoggedIn, isAdmin, ready, init, login, logout }
})
