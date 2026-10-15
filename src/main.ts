import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import '@/styles/main.css'

const app = createApp(App)
app.use(createPinia())

// 先啟動 Firebase 登入監聽，router guard 會等待第一次回應
useAuthStore().init()

app.use(router)
app.mount('#root')

// 新增：dev 不使用 SW。同一個網址以前註冊過的 SW（例如 preview 或舊網站留下的）會繼續攔截 dev 頁面，啟動時解除註冊
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister()
      console.warn('[dev] 已解除殘留的 Service Worker：', registration.scope, '（重新整理後生效）')
    })
  })
}

// Service Worker 註冊（照原版寫法）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker 註冊成功:', registration.scope)
      })
      .catch((error) => {
        console.log('ServiceWorker 註冊失敗:', error)
      })
  })
}
