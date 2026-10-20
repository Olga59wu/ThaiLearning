<script setup lang="ts">
import { isVowelWriteBase } from '@/data/lessons/vowels'
import VowelForm from '../VowelForm.vue'

// 結果頁、歷次紀錄的題目／答案文字：母音寫法（例如 อะ）用 VowelForm 畫（同 /thai），其他照文字顯示
// 字級、行高同外層的 Tailwind class（例如 text-sm：14px、20 / 14）
withDefaults(defineProps<{ text: string; fontSize?: number; lineHeight?: number }>(), { fontSize: 16, lineHeight: 1.5 })
</script>

<template>
  <VowelForm v-if="isVowelWriteBase(text)" :write-base="text" :font-size="fontSize" :line-height="lineHeight" />
  <template v-else>{{ text }}</template>
</template>
