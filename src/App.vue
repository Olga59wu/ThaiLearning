<script setup lang="ts">
import { defineAsyncComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEV_SKIP_AUTH } from '@/dev/skipAuth'

// 開發用跳過登入的提示條（production build 會移除）
const DevAuthBanner = import.meta.env.DEV && DEV_SKIP_AUTH ? defineAsyncComponent(() => import('@/dev/DevAuthBanner.vue')) : null

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// 原版各頁的 initAuthListener 失敗回呼：停留在頁面上時若登入狀態失效，導回登入頁
watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn && (route.meta.requiresAuth || route.meta.requiresAdmin)) {
      router.replace({ name: 'home' })
    }
  },
)
</script>

<template>
  <RouterView />
  <component :is="DevAuthBanner" v-if="DevAuthBanner" />
</template>
