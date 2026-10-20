<script setup lang="ts">
import { computed } from 'vue'
import { resolveWord } from '@/data/lessons'
import { PARTICLE_SYLLABLE } from '@/data/lessons/helpers'
import type { LessonBlock } from '@/types/lesson'
import BlockSection from './BlockSection.vue'
import ThaiReading from '../ThaiReading.vue'
import SpeakButton from '../SpeakButton.vue'
import PencilNotes from '../PencilNotes.vue'

const props = defineProps<{ block: Extract<LessonBlock, { type: 'phrases' }> }>()

// 每句列出 ครับ／ค่ะ 兩種說法；音節＝原形音節＋語尾
const phrases = computed(() =>
  props.block.phrases.map((p) => {
    const base = resolveWord(p.base)
    return {
      id: p.id,
      meaning: p.meaning,
      pencil: p.pencil,
      lines: p.particles.map((particle) => ({
        particle,
        th: base.th + particle,
        syllables: [...base.syllables, PARTICLE_SYLLABLE[particle]],
        // 有放進分類的版本才有 mp3（打包後），其他直接用 TTS
        hasAudio: p.variants?.some((v) => v.particle === particle) ?? false,
      })),
    }
  }),
)
</script>

<template>
  <BlockSection :title="block.title" icon="💬">
    <div class="flex flex-col gap-3">
      <div v-for="p in phrases" :key="p.id" class="p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ p.meaning }}</span>
          <PencilNotes :notes="p.pencil" />
        </div>
        <div class="flex flex-col gap-3">
          <div v-for="line in p.lines" :key="line.particle" class="flex items-center gap-3">
            <SpeakButton :text="line.th" :tts-only="!line.hasAudio" />
            <ThaiReading :syllables="line.syllables" :th="line.th" align="start" />
            <span class="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">{{ line.particle === 'ครับ' ? '男生說' : '女生說' }}</span>
          </div>
        </div>
      </div>
    </div>
  </BlockSection>
</template>
