<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { languageModules } from '@/config'
import { useAuthStore } from '@/stores/auth'
import { saveProgressToCloud } from '@/services/db'
import { usePageShell } from '@/composables/usePageShell'

usePageShell({
  htmlClass: 'shell-common shell-home',
  bodyClass:
    'bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col items-center transition-colors font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 overflow-x-hidden',
})

const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const isLoading = computed(() => authStore.isLoading)
const currentUser = computed(() => authStore.user)
const errorMessage = computed(() => authStore.errorMessage)
const isAdmin = computed(() => authStore.isAdmin)
const showLogoutModal = ref(false)
const showUpdateModal = ref(false)

const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安'
})

const handleLogin = () => {
  authStore.login()
}

const openLogoutModal = () => (showLogoutModal.value = true)
const closeLogoutModal = () => (showLogoutModal.value = false)

const confirmLogout = () => {
  authStore.logout().then(() => {
    closeLogoutModal()
    location.reload()
  })
}

// 🚀 核彈級強制更新邏輯 (iOS 破防 + 漂亮彈窗版)
const forceUpdateApp = async () => {
  showUpdateModal.value = true

  // 準備跳轉的網址 (加上時間戳記防 iOS 快取)
  const reloadUrl = window.location.pathname + '?t=' + new Date().getTime()

  if ('serviceWorker' in navigator) {
    try {
      // 1. 殺掉舊的 Service Worker
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }

      // 2. 清除所有快取
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))

      // 3. 延遲 1.5 秒讓使用者看清楚漂亮的彈窗，然後強制跳轉
      setTimeout(() => {
        window.location.href = reloadUrl
      }, 1500)
    } catch (err) {
      console.error('更新失敗:', err)
      setTimeout(() => (window.location.href = reloadUrl), 1500)
    }
  } else {
    setTimeout(() => (window.location.href = reloadUrl), 1500)
  }
}

// 原版 onLoginSuccess：每次以登入狀態進入大廳都寫入 vue_sync
watch(
  () => authStore.user,
  (user) => {
    if (user) saveProgressToCloud('vue_sync', { status: 'connected', user: user.email })
  },
  { immediate: true },
)

// 原版：登入狀態確定後 body 加上 ready
let disposed = false
onMounted(() => {
  authStore.ready.then(() => {
    if (disposed) return
    requestAnimationFrame(() => {
      if (!disposed) document.body.classList.add('ready')
    })
  })
})

onBeforeUnmount(() => {
  disposed = true
  document.body.classList.remove('ready')
})
</script>

<template>
  <div id="app">
    <div class="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
      <div
        class="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl dark:bg-indigo-900/20">
      </div>
      <div class="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-rose-200/30 rounded-full blur-3xl dark:bg-rose-900/20">
      </div>
    </div>

    <div v-if="!isLoggedIn" id="login-section"
      class="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <div
        class="bg-white/80 dark:bg-gray-800/80 p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full border border-white/50 dark:border-gray-700 relative overflow-hidden glass-panel animate-slide-up">
        <div class="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r/srgb from-indigo-500 via-rose-500 to-emerald-500">
        </div>
        <div
          class="w-24 h-24 bg-linear-to-br/srgb from-indigo-100 to-white dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-5xl animate-bounce-slow">
          🚀</div>
        <h1 class="text-3xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">泰語學習機</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-10 leading-relaxed">您的個人化多語言學習助理。<br />請登入以存取專屬進度。</p>
        <button @click="handleLogin" :style="{ opacity: isLoading ? 0.7 : 1 }"
          class="w-full py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all font-bold flex items-center justify-center gap-3 group">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            class="w-5 h-5 bg-white rounded-full p-0.5 group-hover:rotate-12 transition-transform" />
          <span>使用 Google 帳號登入</span>
        </button>
        <div v-if="errorMessage"
          class="mt-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/50">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
        <p class="mt-8 text-xs text-gray-400">v2.0.0 &copy; Learning Hub</p>
      </div>
    </div>

    <div v-else id="dashboard-section"
      class="w-full max-w-6xl px-4 py-8 md:py-12 animate-fade-in flex flex-col min-h-screen">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <!-- Logo 與使用者名稱 (手機版在上方) -->
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-xs flex items-center justify-center text-2xl border border-gray-100 dark:border-gray-700">
            🚀</div>
          <div class="hidden md:block text-sm font-bold text-gray-400 uppercase tracking-widest mr-2">Learning Hub</div>
          <div
            class="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-full border border-gray-200/50 dark:border-gray-700/50 glass-panel">
            <div class="w-2 h-2 shrink-0 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-[13px] sm:text-sm font-bold text-gray-700 dark:text-gray-200 truncate max-w-[120px]">{{
              currentUser?.displayName || '同學' }}</span>
          </div>
        </div>

        <!-- 功能列按鈕 (手機版自動換排) -->
        <div
          class="flex items-center gap-3 w-full sm:w-auto justify-end overflow-x-auto pb-1 no-scrollbar sm:pb-0 py-1">

          <!-- 語言分組：泰文 -->
          <div class="flex items-center gap-1 p-1 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-xs group">
            <span class="text-[10px] font-black text-blue-600 dark:text-blue-400 pl-2 pr-1 opacity-70">TH</span>
            <RouterLink to="/typing"
              class="p-2 text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-none hover:shadow-xs transition-all active:scale-90"
              title="泰文打字練習">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </RouterLink>
            <RouterLink to="/player"
              class="p-2 text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-none hover:shadow-xs transition-all active:scale-90"
              title="泰文隨身聽">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </RouterLink>
            <!-- 新增：每週課程 -->
            <RouterLink to="/lessons"
              class="p-2 text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-none hover:shadow-xs transition-all active:scale-90"
              title="每週課程">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </RouterLink>
          </div>

          <!-- 功能性按鈕 -->
          <div class="flex items-center gap-2 ml-1">
            <RouterLink v-if="isAdmin" to="/path"
              class="p-2.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-emerald-500 rounded-full border border-gray-200 dark:border-gray-700 shadow-xs transition-all"
              title="筆順產生器">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </RouterLink>

            <button @click="forceUpdateApp"
              class="p-2.5 bg-white dark:bg-gray-800 text-emerald-500 hover:text-white hover:bg-emerald-500 rounded-full border border-gray-200 dark:border-gray-700 shadow-xs transition-all group"
              title="強制更新版本">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button @click="openLogoutModal"
              class="p-2.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-full border border-gray-200 dark:border-gray-700 shadow-xs transition-all"
              title="登出">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="mb-8 text-center md:text-left">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white tracking-tight mb-2">
          <span>{{ greeting }}</span>，準備學習了嗎？
        </h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium">選擇一個語言模組，開始今天的累積。</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pb-10 grow">
        <RouterLink v-for="lang in languageModules" :key="lang.id" :to="lang.link" class="group relative flex flex-col">
          <div
            :class="['absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-5 transition-opacity duration-300 transform group-hover:scale-105', lang.colorClass]">
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xs hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 transform group-hover:-translate-y-1 h-full flex flex-col relative overflow-hidden"
            :class="lang.shadowClass">
            <div
              :class="['absolute -right-4 -top-4 w-24 h-24 rounded-full transition-transform group-hover:scale-125 duration-500', lang.bgCircleClass]">
            </div>
            <div class="relative z-10 flex items-center justify-between mb-4">
              <div
                :class="['w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs group-hover:rotate-6 transition-transform', lang.iconBgClass]">
                {{ lang.abbr }}
              </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors"
              :class="lang.hoverTextClass">
              {{ lang.title }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-6 grow leading-relaxed">{{ lang.desc }}</p>
            <div class="flex flex-wrap gap-2 mb-4 grow content-start">
              <span v-for="tag in lang.tags" :key="tag.text"
                :class="['text-xs px-2.5 py-1 rounded-lg font-bold', tag.class]">
                {{ tag.text }}
              </span>
            </div>
            <div
              class="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between font-bold text-sm"
              :class="lang.actionColorClass">
              <span>開始學習</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
    <div v-if="showUpdateModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"></div>
      <div
        class="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 transform transition-all animate-slide-up flex flex-col items-center text-center">

        <div
          class="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 relative">
          <svg class="absolute w-full h-full text-emerald-500 animate-spin" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <svg class="w-8 h-8 text-emerald-500 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">快取已清除！</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">正在為您載入最新版本，請稍候...</p>
      </div>
    </div>
    <div v-if="showLogoutModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" @click="closeLogoutModal"></div>
      <div
        class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all animate-slide-up">
        <div class="flex flex-col items-center text-center">
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-3xl">
            👋</div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">確定要登出嗎？</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">登出後您需要重新驗證身份才能進入學習中心。</p>
          <div class="flex gap-3 w-full">
            <button @click="closeLogoutModal"
              class="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">取消</button>
            <button @click="confirmLogout"
              class="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 shadow-lg shadow-red-500/30 active:scale-95 transition-all">確認登出</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
