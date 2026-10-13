<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { usePageShell } from '@/composables/usePageShell'
import { providePlayerPage, SILENT_WAV } from '@/composables/player/usePlayerPage'
import PlayerHeader from '@/components/player/PlayerHeader.vue'
import CategoryBar from '@/components/player/CategoryBar.vue'
import PlayerCard from '@/components/player/PlayerCard.vue'
import PlayerControls from '@/components/player/PlayerControls.vue'
import WordListModal from '@/components/player/WordListModal.vue'

usePageShell({
  htmlClass: 'shell-player',
  bodyClass: 'text-slate-800',
})

const { isLoading, setMainPlayer, setSilentAudio, mount, unmount } = providePlayerPage()

onMounted(mount)
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
  </div>
</template>
