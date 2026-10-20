<script setup lang="ts">
import type { PencilNote } from '@/types/lesson'

// 使用者自己的鉛筆筆記：便條紙＋手寫字型（霞鶩文楷），和課本印刷內容區分
withDefaults(defineProps<{ notes?: readonly PencilNote[]; align?: 'center' | 'start' }>(), { align: 'start' })
</script>

<template>
  <div v-if="notes && notes.length > 0" class="flex flex-col gap-1" :class="align === 'center' ? 'items-center' : 'items-start'">
    <div v-for="(n, i) in notes" :key="i" title="我的鉛筆筆記"
      class="inline-flex items-baseline gap-1.5 max-w-full px-2 py-0.5 -rotate-1 rounded-xs border-l-2 shadow-xs bg-amber-50 border-amber-300 text-slate-600 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-100/80">
      <span class="shrink-0 text-[10px] text-amber-600/70 dark:text-amber-400/70">✏️ p{{ n.page }}</span>
      <span class="text-sm leading-snug font-['LXGW_WenKai_TC',cursive]">{{ n.text }}</span>
    </div>
  </div>
</template>
