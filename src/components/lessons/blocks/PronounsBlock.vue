<script setup lang="ts">
import { computed } from 'vue'
import { resolveWord } from '@/data/lessons'
import type { LessonBlock, PronounCell, PronounPerson } from '@/types/lesson'
import BlockSection from './BlockSection.vue'
import ThaiReading from '../ThaiReading.vue'
import SpeakButton from '../SpeakButton.vue'
import PencilNotes from '../PencilNotes.vue'

// 人稱代名詞表（照課本 p256）：每個人稱一列，男生／女生各三格（一般、禮貌、謙卑或尊稱）；手機版上下排
const props = defineProps<{ block: Extract<LessonBlock, { type: 'pronouns' }> }>()

const PERSONS: PronounPerson[] = ['我', '你/您', '他/她']
const GENDERS = [
  { id: 'male', label: '👨 男生' },
  { id: 'female', label: '👩 女生' },
] as const
const COLUMNS = 3

const words = computed(() => new Map(props.block.words.map(resolveWord).map((w) => [w.id, w])))
const cellsOf = (person: PronounPerson, gender: PronounCell['gender']) =>
  props.block.cells.filter((c) => c.person === person && c.gender === gender)
const wordOf = (c: PronounCell) => words.value.get(c.wordId)!
// 補空格，讓「他/她」只有兩格時也對齊三欄
const blanks = (person: PronounPerson, gender: PronounCell['gender']) => Math.max(0, COLUMNS - cellsOf(person, gender).length)
</script>

<template>
  <BlockSection :title="block.title" icon="🧑">
    <div class="flex flex-col gap-4">
      <div v-for="person in PERSONS" :key="person" class="flex flex-col md:flex-row gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
        <div class="shrink-0 md:w-14 flex md:items-center md:justify-center text-xl font-black text-gray-800 dark:text-white">{{ person }}</div>
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="g in GENDERS" :key="g.id" class="flex flex-col gap-2">
            <div class="text-xs font-bold text-gray-400 dark:text-gray-500">{{ g.label }}</div>
            <div class="grid grid-cols-3 gap-2">
              <div v-for="(c, i) in cellsOf(person, g.id)" :key="i"
                class="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600">
                <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{{ c.level }}</span>
                <ThaiReading :syllables="wordOf(c).syllables" :th="wordOf(c).th" size="sm" />
                <SpeakButton :text="wordOf(c).th" />
                <PencilNotes :notes="c.pencil" align="center" />
              </div>
              <div v-for="n in blanks(person, g.id)" :key="'blank' + n"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BlockSection>
</template>
