<script setup lang="ts">
// 開發用跳過登入的提示條（只在 import.meta.env.DEV 且 VITE_DEV_SKIP_AUTH=1 時由 App.vue 動態載入）
</script>

<template>
  <div class="fixed top-0 inset-x-0 z-[9999] pointer-events-none flex justify-center">
    <div class="px-4 py-1 text-xs font-bold text-white bg-red-600/90 rounded-b-lg shadow-md">
      ⚠️ 開發模式：已跳過登入（dev@local，不讀寫 Firestore）
    </div>
  </div>
</template>
