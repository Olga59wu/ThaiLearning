<script setup lang="ts">
import { computed } from 'vue'
import { resolveWord } from '@/data/lessons'
import type { LessonBlock } from '@/types/lesson'
import { toThaiDigits } from '@/utils/thaiNumber'
import BlockSection from './BlockSection.vue'
import ThaiReading from '../ThaiReading.vue'
import SpeakButton from '../SpeakButton.vue'

const props = defineProps<{ block: Extract<LessonBlock, { type: 'vocab' }> }>()
const words = computed(() => props.block.words.map(resolveWord))
</script>

<template>
  <BlockSection :title="block.title" :title-th="block.titleTh" :icon="block.layout === 'units' ? '🔢' : '🔤'">
    <!-- 數字：卡片格 -->
    <div v-if="block.layout === 'numbers'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <div v-for="w in words" :key="w.id"
        class="relative flex flex-col items-center gap-2 p-3 pt-4 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
        <div class="absolute top-2 right-2"><SpeakButton :text="w.th" /></div>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-black text-gray-800 dark:text-white">{{ w.num }}</span>
          <span v-if="w.num !== undefined" class="text-xl text-emerald-600 dark:text-emerald-400 thai-font">{{ toThaiDigits(w.num) }}</span>
        </div>
        <ThaiReading :syllables="w.syllables" :th="w.th" />
        <div v-if="w.meaning !== w.zh" class="text-xs text-gray-400 dark:text-gray-500">{{ w.meaning }}</div>
      </div>
    </div>

    <!-- 單位：表格 -->
    <div v-else-if="block.layout === 'units'" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-slate-700">
            <th class="py-2 pr-3 text-right font-bold">數值</th>
            <th class="py-2 px-3 text-left font-bold">唸法</th>
            <th class="py-2 pl-3 text-left font-bold">位數</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in words" :key="w.id" class="border-b border-gray-50 dark:border-slate-700/50 last:border-0">
            <td class="py-3 pr-3 text-right font-mono text-gray-500 dark:text-gray-400">{{ w.placeValue === 1 ? '個位' : w.placeValue?.toLocaleString('en-US') }}</td>
            <td class="py-3 px-3">
              <div class="flex items-center gap-3">
                <ThaiReading :syllables="w.syllables" :th="w.th" align="start" />
                <SpeakButton :text="w.th" />
              </div>
            </td>
            <td class="py-3 pl-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {{ w.meaning }}<span v-if="w.note && w.note !== w.meaning" class="ml-1 text-xs font-normal text-gray-400">（{{ w.note }}）</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 一般單字：清單 -->
    <div v-else class="flex flex-col gap-2">
      <div v-for="w in words" :key="w.id" class="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50">
        <SpeakButton :text="w.th" />
        <ThaiReading :syllables="w.syllables" :th="w.th" align="start" />
        <span class="ml-auto text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ w.meaning }}</span>
      </div>
    </div>
  </BlockSection>
</template>
