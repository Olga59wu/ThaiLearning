<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLesson } from '@/data/lessons'
import { useLessonTheme } from '@/composables/lessons/useLessonTheme'
import { provideLessonAudio } from '@/composables/lessons/useLessonAudio'
import LessonHeader from '@/components/lessons/LessonHeader.vue'
import VocabBlock from '@/components/lessons/blocks/VocabBlock.vue'
import CurrencyBlock from '@/components/lessons/blocks/CurrencyBlock.vue'
import RulesBlock from '@/components/lessons/blocks/RulesBlock.vue'
import PhrasesBlock from '@/components/lessons/blocks/PhrasesBlock.vue'
import NotesBlock from '@/components/lessons/blocks/NotesBlock.vue'
import HomeworkBlock from '@/components/lessons/blocks/HomeworkBlock.vue'
import PracticeTab from '@/components/lessons/practice/PracticeTab.vue'

const props = defineProps<{ no: number }>()

useLessonTheme()
provideLessonAudio()

const route = useRoute()
const router = useRouter()
const lesson = computed(() => getLesson(props.no))

// 找不到課次就回課程列表；有課次時標題帶上課名
watchEffect(() => {
  if (!lesson.value) router.replace('/lessons')
  else document.title = `📘 第${lesson.value.no}課 ${lesson.value.title}`
})

type Tab = 'content' | 'practice' | 'exam'
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'content', icon: '📖', label: '內容' },
  { id: 'practice', icon: '🎯', label: '練習' },
  { id: 'exam', icon: '📝', label: '考試' },
]
// ?tab= 記住分頁（重新整理或返回時停在同一頁）
const tab = computed<Tab>(() => {
  const t = route.query.tab
  return t === 'practice' || t === 'exam' ? t : 'content'
})
const setTab = (t: Tab) => router.replace({ query: { ...route.query, tab: t === 'content' ? undefined : t } })
</script>

<template>
  <div v-if="lesson" id="app" class="w-full max-w-4xl flex flex-col items-center">
    <LessonHeader :title="`第${lesson.no}課 ${lesson.title}`" :subtitle="lesson.date" back-to="/lessons" back-label="課程列表" />

    <div class="w-full flex flex-wrap justify-center gap-3 mb-6">
      <button v-for="t in TABS" :key="t.id" @click="setTab(t.id)"
        :class="tab === t.id ? 'active-tab shadow-md' : 'inactive-tab shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700'"
        class="px-5 py-2.5 text-sm md:text-base rounded-full font-bold transition-all border flex items-center gap-2 transform active:scale-95">
        {{ t.icon }} {{ t.label }}
      </button>
    </div>

    <div v-if="tab === 'content'" class="w-full flex flex-col gap-5">
      <template v-for="(block, i) in lesson.blocks" :key="i">
        <VocabBlock v-if="block.type === 'vocab'" :block="block" />
        <CurrencyBlock v-else-if="block.type === 'currency'" :block="block" />
        <RulesBlock v-else-if="block.type === 'rules'" :block="block" />
        <PhrasesBlock v-else-if="block.type === 'phrases'" :block="block" />
        <NotesBlock v-else-if="block.type === 'notes'" :block="block" />
        <HomeworkBlock v-else-if="block.type === 'homework'" :block="block" />
      </template>
    </div>

    <PracticeTab v-else-if="tab === 'practice'" :lesson="lesson" />

    <!-- 考試：之後的步驟實作 -->
    <div v-else class="w-full p-10 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-600">
      🚧 製作中
    </div>
  </div>
</template>
