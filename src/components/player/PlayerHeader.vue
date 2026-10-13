<script setup lang="ts">
import { usePlayerPageContext } from '@/composables/player/usePlayerPage'

const { syncStatus, isDarkMode, isDownloading, downloadProgress, downloadTotal, isModalOpen, startDownload } =
  usePlayerPageContext()
</script>

<template>
  <!-- 頂部導覽 (固定高度) -->
  <div class="px-2 py-3 flex items-center justify-between border-b shrink-0 bg-white z-10">

    <div class="flex items-center gap-1 sm:gap-2 shrink-0">
      <RouterLink to="/" class="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </RouterLink>
      <h1 class="text-[13px] sm:text-sm font-black text-blue-600 tracking-tight flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        THAI PLAYER
      </h1>
    </div>

    <div class="flex items-center gap-0.5 sm:gap-2 shrink-0">

      <RouterLink to="/typing"
        class="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full active:scale-90 transition-all"
        title="泰文打字練習">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </RouterLink>

      <div class="flex items-center justify-center text-slate-400 transition-all p-1"
        :title="syncStatus === 'syncing' ? '同步中...' : (syncStatus === 'synced' ? '已同步' : '同步失敗')">
        <svg v-if="syncStatus === 'synced'" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" class="text-emerald-500">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
          <polyline points="9 15 11 17 15 12"></polyline>
        </svg>
        <svg v-if="syncStatus === 'syncing'" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" class="animate-spin text-blue-500">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
        </svg>
        <svg v-if="syncStatus === 'error'" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" class="text-red-500">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
          <line x1="12" y1="12" x2="12" y2="16"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>

      <button @click="isDarkMode = !isDarkMode" class="p-1.5 sm:p-2 text-slate-400 active:scale-90 transition-all">
        <svg v-if="!isDarkMode" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="yellow" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>

      <button @click="startDownload" :disabled="isDownloading"
        :class="['flex items-center gap-1 px-1.5 py-1.5 rounded-lg transition-colors text-[10px] sm:text-[11px] font-bold shadow-xs whitespace-nowrap',
             isDownloading ? 'bg-indigo-50 text-indigo-400 cursor-wait' : 'bg-white text-indigo-500 border border-indigo-100 hover:bg-indigo-50']">
        <svg v-if="isDownloading" class="animate-spin h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-500"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {{ isDownloading ? `下載中 ${downloadProgress}/${downloadTotal}` : '離線語音' }}
      </button>

      <button @click="isModalOpen = true"
        class="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
    </div>

  </div>
</template>
