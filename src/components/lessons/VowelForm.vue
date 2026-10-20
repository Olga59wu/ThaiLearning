<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { VOWEL_INLINE_COLORS, VOWEL_TEXT_COLORS } from '@/utils/guideLayout'
import VowelText from '@/components/common/VowelText.vue'

// 課程頁、考試的母音寫法：同 /thai 元音卡片（VowelText 粗體，淺色 อ＋深色母音；ฤ、ฤๅ、ฦ、ฦๅ 整個字深色）
// inline：句子裡的小字，一般字重、配色同句子（VOWEL_INLINE_COLORS，อ 稍深，14px 也看得清楚）
// 字級、行高同外層原本的 Tailwind class（例如 text-3xl：30px、36 / 30）
withDefaults(defineProps<{ writeBase: string; fontSize: number; lineHeight?: number; inline?: boolean }>(), { lineHeight: 1.25, inline: false })
const { isDark } = storeToRefs(useThaiLearnStore())
</script>

<template>
  <VowelText :text="writeBase" :is-dark="isDark" :font-size="fontSize" :line-height="lineHeight"
    :bold="!inline" :palette="inline ? VOWEL_INLINE_COLORS : VOWEL_TEXT_COLORS" />
</template>
