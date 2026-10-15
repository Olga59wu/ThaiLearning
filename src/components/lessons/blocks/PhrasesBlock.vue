<script setup lang="ts">
import { computed } from 'vue'
import { resolveWord } from '@/data/lessons'
import { PARTICLE_SYLLABLE } from '@/data/lessons/helpers'
import type { LessonBlock } from '@/types/lesson'
import BlockSection from './BlockSection.vue'
import ToneSyllables from '../ToneSyllables.vue'
import SpeakButton from '../SpeakButton.vue'

const props = defineProps<{ block: Extract<LessonBlock, { type: 'phrases' }> }>()

// 每句列出 ครับ／ค่ะ 兩種說法；音節＝原形音節＋語尾
const phrases = computed(() =>
  props.block.phrases.map((p) => {
    const base = resolveWord(p.base)
    return {
      id: p.id,
      meaning: p.meaning,
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
        <div class="mb-3 font-bold text-emerald-600 dark:text-emerald-400">{{ p.meaning }}</div>
        <div class="flex flex-col gap-3">
          <div v-for="line in p.lines" :key="line.particle" class="flex flex-wrap items-center gap-3">
            <SpeakButton :text="line.th" :tts-only="!line.hasAudio" />
            <span class="text-2xl font-bold thai-font text-gray-800 dark:text-white">{{ line.th }}</span>
            <ToneSyllables :syllables="line.syllables" show-thai size="sm" />
          </div>
        </div>
      </div>
    </div>
  </BlockSection>
</template>
