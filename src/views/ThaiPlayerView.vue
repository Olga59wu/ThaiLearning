<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageShell } from '@/composables/usePageShell'
import { providePlayerPage, SILENT_WAV } from '@/composables/player/usePlayerPage'
import PlayerHeader from '@/components/player/PlayerHeader.vue'
import CategoryBar from '@/components/player/CategoryBar.vue'
import PlayerCard from '@/components/player/PlayerCard.vue'
import PlayerControls from '@/components/player/PlayerControls.vue'
import WordListModal from '@/components/player/WordListModal.vue'
import OfflineAudioModal from '@/components/common/OfflineAudioModal.vue'

usePageShell({
  htmlClass: 'shell-player',
  bodyClass: 'text-slate-800',
})

// 課程頁的「前往隨身聽」帶 ?cat=第1課：只選這個分類（套用後把參數從網址拿掉，重新整理時不再強制）
const route = useRoute()
const router = useRouter()
const initialCategory = typeof route.query.cat === 'string' ? route.query.cat : undefined

const { isLoading, downloadModal, closeDownloadModal, executeDownload, setMainPlayer, setSilentAudio, mount, unmount } =
  providePlayerPage({ initialCategory })

onMounted(() => {
  mount()
  if (initialCategory) router.replace({ query: {} })
})
onBeforeUnmount(unmount)
</script>

<template>
  <!-- CarPlay / 藍牙音訊路由優化：啟動無聲音軌 -->
  <audio id="silent-audio" :ref="setSilentAudio" loop preload="auto">
    <source :src="SILENT_WAV" type="audio/wav">
  </audio>
  <audio id="main-player" :ref="setMainPlayer" playsinline preload="auto"></audio>
  <div id="app" class="w-full max-w-md mx-auto h-full flex flex-col bg-white shadow-2xl relative">
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white z-[100]">
      <div class="text-blue-500 font-bold animate-pulse">LOADING...</div>
    </div>
    <PlayerHeader />
    <CategoryBar />
    <PlayerCard />
    <PlayerControls />
    <WordListModal />
    <!-- 下載確認／成功彈窗：原版寫在清單彈窗內（按頂部按鈕看不到），已移到外層 -->
    <OfflineAudioModal :modal="downloadModal" success-message="現在可以安心開啟飛航模式了！"
      @close="closeDownloadModal" @confirm="executeDownload" />
  </div>
</template>
