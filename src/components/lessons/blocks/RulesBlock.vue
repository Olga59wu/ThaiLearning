<script setup lang="ts">
import type { LessonBlock } from '@/types/lesson'
import { numberToSyllables, numberToThai } from '@/utils/thaiNumber'
import BlockSection from './BlockSection.vue'
import ThaiReading from '../ThaiReading.vue'
import RuleText from '../RuleText.vue'
import SpeakButton from '../SpeakButton.vue'

defineProps<{ block: Extract<LessonBlock, { type: 'rules' }> }>()
</script>

<template>
  <BlockSection :title="block.title" icon="📏">
    <ol class="flex flex-col gap-5">
      <li v-for="(rule, i) in block.rules" :key="i" class="flex gap-3">
        <span class="flex items-center justify-center w-7 h-7 shrink-0 rounded-full bg-emerald-500 text-white text-sm font-black">{{ i + 1 }}</span>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-gray-800 dark:text-gray-100"><RuleText :text="rule.text" /></div>
          <div class="flex flex-wrap gap-2 mt-2">
            <div v-for="n in rule.examples" :key="n"
              class="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
              <span class="font-mono font-bold text-gray-500 dark:text-gray-400">{{ n.toLocaleString('en-US') }}</span>
              <ThaiReading :syllables="numberToSyllables(n)" :th="numberToThai(n)" size="sm" align="start" />
              <SpeakButton :text="numberToThai(n)" tts-only />
            </div>
          </div>
        </div>
      </li>
    </ol>
  </BlockSection>
</template>
