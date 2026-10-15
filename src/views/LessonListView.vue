<script setup lang="ts">
import { LESSONS } from '@/data/lessons'
import { useLessonTheme } from '@/composables/lessons/useLessonTheme'
import LessonHeader from '@/components/lessons/LessonHeader.vue'
import LessonCard from '@/components/lessons/LessonCard.vue'

useLessonTheme()

// 新的課排前面
const lessons = [...LESSONS].reverse()
</script>

<template>
  <div id="app" class="w-full max-w-3xl flex flex-col items-center">
    <LessonHeader title="每週課程" subtitle="每週泰語課的內容、練習與考試" back-to="/" back-label="大廳" />

    <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- 最近一次考試分數：考試紀錄完成後接上 -->
      <LessonCard v-for="lesson in lessons" :key="lesson.no" :lesson="lesson" :latest-score="null" />
    </div>
  </div>
</template>
