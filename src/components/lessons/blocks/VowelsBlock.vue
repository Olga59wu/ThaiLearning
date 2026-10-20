<script setup lang="ts">
import { computed } from 'vue'
import type { LessonBlock, LessonVowel, PencilNote, Tone, VowelGroup } from '@/types/lesson'
import { TONE_MARK, toneOrdinalLabel } from '@/utils/tone'
import BlockSection from './BlockSection.vue'
import ToneSyllables from '../ToneSyllables.vue'
import VowelCard from '../VowelCard.vue'
import PencilNotes from '../PencilNotes.vue'
import VowelForm from '../VowelForm.vue'

// 母音表：短音／長音並排（1↔2、3↔4…方便比對長短）、特殊母音、獨立母音（短↔長並排）
const props = defineProps<{ block: Extract<LessonBlock, { type: 'vowels' }> }>()

const ofGroup = (g: VowelGroup) => props.block.vowels.filter((v) => v.group === g)
const pairs = (left: LessonVowel[], right: LessonVowel[]) => left.map((l, i) => [l, right[i]] as const)

const shortLong = computed(() => pairs(ofGroup('short'), ofGroup('long')))
const special = computed(() => ofGroup('special'))
const independent = computed(() => {
  const list = ofGroup('independent')
  return pairs(
    list.filter((v) => v.length === 'short'),
    list.filter((v) => v.length === 'long'),
  )
})
const pencilOf = (g: VowelGroup): PencilNote[] | undefined => props.block.groupPencil?.[g]
const toneText = (tone: Tone) => `${TONE_MARK[tone]} ${toneOrdinalLabel(tone)}`
</script>

<template>
  <BlockSection :title="block.title" :title-th="block.titleTh" icon="🔤">
    <!-- 標題：สระ sa-ra，32 個母音／27 個發音 -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
      <span class="text-3xl thai-font text-gray-800 dark:text-white">{{ block.titleTh }}</span>
      <ToneSyllables v-if="block.intro" :syllables="block.intro" />
      <span v-if="block.summary" class="font-bold text-emerald-700 dark:text-emerald-300">{{ block.summary }}</span>
      <span class="w-full text-xs text-gray-500 dark:text-gray-400">母音的唸法：sa-ra ＋ 母音發音</span>
      <span class="w-full -mt-1.5 text-xs text-gray-500 dark:text-gray-400">課本表格用 - 表示子音位置，這裡用淺色 <span class="thai-font">อ</span> 表示</span>
    </div>

    <!-- 短音／長音 -->
    <div class="grid grid-cols-2 gap-3">
      <h3 class="flex flex-wrap items-baseline gap-x-2 font-bold text-gray-700 dark:text-gray-200">
        短音母音 12 個<span class="text-sm text-sky-500 dark:text-sky-400">{{ toneText('low') }}</span>
      </h3>
      <h3 class="flex flex-wrap items-baseline gap-x-2 font-bold text-gray-700 dark:text-gray-200">
        長音母音 12 個<span class="text-sm text-gray-400 dark:text-gray-500">{{ toneText('mid') }}</span>
      </h3>
      <template v-for="[s, l] in shortLong" :key="s.id">
        <VowelCard :vowel="s" />
        <VowelCard v-if="l" :vowel="l" />
      </template>
    </div>

    <!-- 特殊母音 -->
    <div class="mt-8">
      <h3 class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 font-bold text-gray-700 dark:text-gray-200">
        特殊母音 4 個<span class="text-sm text-gray-400 dark:text-gray-500">{{ toneText('mid') }}</span>
        <PencilNotes :notes="pencilOf('special')" />
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <VowelCard v-for="v in special" :key="v.id" :vowel="v" />
      </div>
    </div>

    <!-- 獨立母音 -->
    <div class="mt-8">
      <h3 class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1 font-bold text-gray-700 dark:text-gray-200">
        獨立母音 4 個
        <PencilNotes :notes="pencilOf('independent')" />
      </h3>
      <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
        泰文獨立母音沒有自己的發音，因此借用子音 <span class="thai-font">ร</span> 和 <span class="thai-font">ล</span>
        搭配母音 <VowelForm write-base="อึ" :font-size="14" :line-height="20 / 14" inline /> 和 <VowelForm write-base="อื" :font-size="14" :line-height="20 / 14" inline /> 來發音。
      </p>
      <div class="grid grid-cols-2 gap-3">
        <h3 class="flex flex-wrap items-baseline gap-x-2 font-bold text-gray-700 dark:text-gray-200">
          獨立短母音<span class="text-sm text-amber-500 dark:text-amber-400">{{ toneText('high') }}</span>
        </h3>
        <h3 class="flex flex-wrap items-baseline gap-x-2 font-bold text-gray-700 dark:text-gray-200">
          獨立長母音<span class="text-sm text-gray-400 dark:text-gray-500">{{ toneText('mid') }}</span>
        </h3>
        <template v-for="[s, l] in independent" :key="s.id">
          <VowelCard :vowel="s" />
          <VowelCard v-if="l" :vowel="l" />
        </template>
      </div>
    </div>
  </BlockSection>
</template>
