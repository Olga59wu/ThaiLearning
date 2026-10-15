<script setup lang="ts">
defineProps<{ title: string; icon?: string }>()
</script>

<template>
  <section class="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
    <div class="h-1.5 bg-linear-to-r/srgb from-emerald-400 to-teal-500"></div>
    <div class="p-5 md:p-6">
      <h2 class="flex items-center gap-2 mb-4 text-lg font-bold text-gray-800 dark:text-white">
        <span v-if="icon">{{ icon }}</span>
        <span class="thai-font">{{ title }}</span>
      </h2>
      <slot />
    </div>
  </section>
</template>
