<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
</template>
