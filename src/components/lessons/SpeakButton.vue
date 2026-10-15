<script setup lang="ts">
import { useLessonAudioContext } from '@/composables/lessons/useLessonAudio'

const props = withDefaults(defineProps<{ text: string; ttsOnly?: boolean; size?: 'sm' | 'md' }>(), {
  ttsOnly: false,
  size: 'sm',
})
const { play } = useLessonAudioContext()
</script>

<template>
  <button type="button" @click.stop="play(props.text, props.ttsOnly)" title="播放發音"
    class="inline-flex items-center justify-center shrink-0 rounded-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-90 transition-all dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
    :class="size === 'sm' ? 'w-8 h-8' : 'w-11 h-11'">
    <svg :class="size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  </button>
</template>
