<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { usePageShell } from '@/composables/usePageShell'
import { provideTypingPage } from '@/composables/typing/useTypingPage'
import TypingHeader from '@/components/typing/TypingHeader.vue'
import TypingCard from '@/components/typing/TypingCard.vue'
import TypingInputBar from '@/components/typing/TypingInputBar.vue'
import OfflineAudioModal from '@/components/common/OfflineAudioModal.vue'

usePageShell({
  htmlClass: 'shell-typing',
  bodyClass: 'text-slate-800',
})

const { isLoading, downloadModal, closeDownloadModal, executeDownload, setMainPlayer, mount, unmount } =
  provideTypingPage()

onMounted(mount)
onBeforeUnmount(unmount)
</script>

<template>
  <!-- 加入音訊播放器 -->
  <audio id="main-player" :ref="setMainPlayer" playsinline preload="auto"></audio>

  <div id="app" class="w-full max-w-md mx-auto relative">
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white z-[100]">
      <div class="text-blue-500 font-bold animate-pulse">LOADING...</div>
    </div>
    <template v-else>
      <TypingHeader />
      <TypingCard />
      <TypingInputBar />
      <div class="mt-4 pt-3 border-t border-slate-100 pb-4">
        <div class="grid grid-cols-4 gap-y-2 text-[10px] text-slate-400">
          <div class="flex items-center justify-center gap-1"><span>👥</span> 基礎</div>
          <div class="flex items-center justify-center gap-1"><span>❓</span> 疑問</div>
          <div class="flex items-center justify-center gap-1"><span>🏃</span> 動詞</div>
          <div class="flex items-center justify-center gap-1"><span>🌈</span> 形容</div>
          <div class="flex items-center justify-center gap-1"><span>🕒</span> 時間</div>
          <div class="flex items-center justify-center gap-1"><span>🚗</span> 交通</div>
          <div class="flex items-center justify-center gap-1"><span>⭐</span> 自訂</div>
          <div class="flex items-center justify-center gap-1"><span>✅</span> 學會</div>
        </div>
      </div>
      <OfflineAudioModal :modal="downloadModal" success-message="現在打字練習時，發音會更加流暢無延遲！"
        @close="closeDownloadModal" @confirm="executeDownload" />
    </template>
  </div>
</template>
