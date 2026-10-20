<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import VowelText from '@/components/common/VowelText.vue'

// 課程頁、考試的母音寫法：同 /thai 元音卡片（VowelText 粗體，淺色 อ＋深色母音；ฤ、ฤๅ、ฦ、ฦๅ 整個字深色）
// 字級、行高同外層原本的 Tailwind class（例如 text-3xl：30px、36 / 30）
withDefaults(defineProps<{ writeBase: string; fontSize: number; lineHeight?: number }>(), { lineHeight: 1.25 })
const { isDark } = storeToRefs(useThaiLearnStore())
</script>

<template>
  <VowelText :text="writeBase" :is-dark="isDark" :font-size="fontSize" :line-height="lineHeight" bold />
</template>
