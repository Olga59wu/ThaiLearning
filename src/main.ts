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
