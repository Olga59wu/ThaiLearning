<script setup lang="ts">
import type { LessonBlock } from '@/types/lesson'
import BlockSection from './BlockSection.vue'

defineProps<{ block: Extract<LessonBlock, { type: 'notes' }> }>()
</script>

<template>
  <BlockSection :title="block.title" icon="📝">
    <ul class="flex flex-col gap-2">
      <li v-for="(item, i) in block.items" :key="i" class="flex gap-2 text-gray-700 dark:text-gray-200 thai-font">
        <span class="text-emerald-500">•</span>
        <span>{{ item }}</span>
      </li>
    </ul>
  </BlockSection>
</template>
