<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLessonSettingsStore } from '@/stores/lessonSettings'

defineProps<{ title: string; titleTh?: string; icon?: string }>()
const { showThai } = storeToRefs(useLessonSettingsStore())
</script>

<template>
  <section class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
    <div class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
    <div class="p-5 md:p-6">
      <h2 class="flex flex-wrap items-baseline gap-2 mb-4 text-lg font-bold text-gray-800 dark:text-white">
        <span v-if="icon">{{ icon }}</span>
        <span>{{ title }}</span>
        <span v-if="titleTh && showThai" class="text-sm font-normal text-gray-400 dark:text-gray-500 thai-font">{{ titleTh }}</span>
      </h2>
      <slot />
    </div>
  </section>
</template>
