<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import VowelText from '@/components/common/VowelText.vue'

// 課本字形（例如 -ิ、เ-าะ）：用搭配 อ 的寫法（writeBase）畫，อ 換成橫線，iPhone 不會補虛線圈 ◌
// 字級、行高同外層原本的 Tailwind class（例如 text-4xl leading-tight：36px、1.25）
withDefaults(defineProps<{ writeBase: string; fontSize: number; lineHeight?: number }>(), { lineHeight: 1.25 })
const { isDark } = storeToRefs(useThaiLearnStore())
</script>

<template>
  <VowelText :text="writeBase" :is-dark="isDark" :font-size="fontSize" :line-height="lineHeight" dash />
</template>
