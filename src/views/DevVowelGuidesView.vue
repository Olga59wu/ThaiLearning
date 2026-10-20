<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { thaiData } from '@/data/thai'
import { getLesson, lessonVowels } from '@/data/lessons'
import { vowelStrokes, vowelWriteBase } from '@/data/lessons/vowels'
import { useLessonTheme } from '@/composables/lessons/useLessonTheme'
import { useHandwriting } from '@/composables/useHandwriting'
import { layoutGuideText, loadGuideFont, GUIDE_MARGIN_RATIO, type GuideLayout } from '@/utils/guideLayout'
import VowelGuide from '@/components/common/VowelGuide.vue'
import VowelText from '@/components/common/VowelText.vue'
import HandwritingModal from '@/components/common/HandwritingModal.vue'

// 開發用（只在 pnpm dev 註冊路由）：
// 1. 第 2 課 32 個母音的手寫底圖，有筆順的疊上橘色路徑，自動檢查筆畫是否完整在框內
// 2. thaiData 有筆順的字在 /path（500px 框）的縮放比例：必須都是 100%，否則已畫好的筆順會和底字對不上
// 3. ?modal=เอือะ：直接打開該母音的手寫彈窗，檢查有沒有捲軸
// 4. /thai 元音卡片的字形預覽（VowelText，同卡片的 text-3xl 粗體）
const { isDark, toggleDark } = useLessonTheme()
const route = useRoute()

const vowels = computed(() => {
  const lesson = getLesson(2)
  return lesson ? lessonVowels(lesson).map((v) => ({ v, base: vowelWriteBase(v), strokes: vowelStrokes(v) })) : []
})

const pct = (value: number, box: number) => (value / box) * 100
const MARGIN = GUIDE_MARGIN_RATIO * 100

interface Check { scale: number; shifted: boolean; left: number; right: number; top: number; bottom: number; inBox: boolean; inMargin: boolean }
const toCheck = (layout: GuideLayout, box: number): Check => {
  const c = { left: pct(layout.ink.left, box), right: pct(layout.ink.right, box), top: pct(layout.ink.top, box), bottom: pct(layout.ink.bottom, box) }
  const tol = 0.5
  return {
    scale: layout.scale,
    shifted: Math.abs(layout.shiftX) > 0.01 || Math.abs(layout.shiftY) > 0.01,
    ...c,
    inBox: c.left >= -tol && c.top >= -tol && c.right <= 100 + tol && c.bottom <= 100 + tol,
    inMargin: c.left >= MARGIN - tol && c.right <= 100 - MARGIN + tol && c.top >= MARGIN - tol && c.bottom <= 100 - MARGIN + tol,
  }
}
const checks = reactive<Record<string, Check>>({})
const onLayout = (id: string, layout: GuideLayout, box: number) => {
  checks[id] = toCheck(layout, box)
}
const fmt = (n: number) => n.toFixed(1)
const allVowelsOk = computed(() => vowels.value.length > 0 && vowels.value.every(({ v }) => checks[v.id]?.inBox && checks[v.id]?.inMargin))

// /path：thaiData 有筆順的字
const PATH_BOX = 500
const pathRows = ref<{ char: string; check: Check }[]>([])
const thaiVowels = thaiData.filter((t) => t.type === 'vowel')

const pathScaled = computed(() => pathRows.value.filter((r) => r.check.scale < 0.999 || r.check.shifted))

// 手寫彈窗
const hw = useHandwriting({ isDark })
const modalVowel = computed(() => vowels.value.find(({ v }) => v.withO === route.query.modal || v.form === route.query.modal))
const modalOverflow = ref<string>('')

onMounted(async () => {
  const ctx = document.createElement('canvas').getContext('2d')
  const items = thaiData.filter((t) => t.strokes && t.strokes.length > 0)
  for (const t of items) await loadGuideFont(t.char, PATH_BOX)
  if (ctx) pathRows.value = items.map((t) => ({ char: t.char, check: toCheck(layoutGuideText(ctx, t.char, PATH_BOX), PATH_BOX) }))

  if (modalVowel.value) {
    await nextTick()
    hw.initCanvas()
    // 等底圖畫完再量
    setTimeout(() => {
      const pad = document.querySelector<HTMLElement>('#canvas-container')?.parentElement
      modalOverflow.value = pad ? `scrollHeight=${pad.scrollHeight} clientHeight=${pad.clientHeight} 捲軸=${pad.scrollHeight > pad.clientHeight ? '有' : '無'}` : '找不到畫布'
    }, 1500)
  }
})
</script>

<template>
  <div id="app" class="w-full max-w-5xl flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-800 dark:text-white">母音手寫底圖原型（開發用）</h1>
      <button @click="toggleDark" class="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-slate-700 dark:text-white shadow-xs">{{ isDark ? '☀️' : '🌙' }}</button>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      底圖規則同 /path（utils/guideLayout：字高 68%，放不下就縮小，左右留 8%）；橘色是 thaiData 的筆順（座標 0～100，不縮放）。
    </p>
    <p id="vowel-summary" class="font-bold" :class="allVowelsOk ? 'text-emerald-600' : 'text-red-600'">
      32 個母音：{{ allVowelsOk ? '全部完整在框內（含 8% 邊距）' : '有母音超出框或邊距（見 ⚠️）' }}
    </p>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="{ v, base, strokes } in vowels" :key="v.id" class="flex flex-col gap-1" :data-vowel="v.withO">
        <div class="relative aspect-square rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 overflow-hidden">
          <!-- 左右 8% 邊距參考線 -->
          <div class="absolute inset-y-0 border-l border-dashed border-sky-200 dark:border-sky-900" :style="{ left: `${MARGIN}%` }"></div>
          <div class="absolute inset-y-0 border-l border-dashed border-sky-200 dark:border-sky-900" :style="{ left: `${100 - MARGIN}%` }"></div>
          <VowelGuide :text="base" :is-dark="isDark" class="absolute inset-0" @layout="(l, box) => onLayout(v.id, l, box)" />
          <svg v-if="strokes" class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <path v-for="(d, i) in strokes" :key="i" :d="d" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" opacity="0.8" />
          </svg>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ v.no }}. <span class="thai-font">{{ v.form }}</span>（底圖 <span class="thai-font">{{ base }}</span>）{{ strokes ? '✅ 有筆順' : '' }}
        </div>
        <div v-if="checks[v.id]" class="text-[11px] font-mono" :class="checks[v.id]!.inBox && checks[v.id]!.inMargin ? 'text-gray-400' : 'text-red-600 font-bold'" data-check>
          {{ checks[v.id]!.inBox && checks[v.id]!.inMargin ? '✓' : '⚠️' }} 縮放 {{ Math.round(checks[v.id]!.scale * 100) }}%{{ checks[v.id]!.shifted ? ' 平移' : '' }}
          x {{ fmt(checks[v.id]!.left) }}～{{ fmt(checks[v.id]!.right) }} y {{ fmt(checks[v.id]!.top) }}～{{ fmt(checks[v.id]!.bottom) }}
        </div>
      </div>
    </div>

    <h2 class="mt-6 text-lg font-bold text-gray-800 dark:text-white">/path 有筆順的字（{{ pathRows.length }} 個）</h2>
    <p id="path-summary" class="font-bold" :class="pathScaled.length === 0 ? 'text-emerald-600' : 'text-red-600'">
      {{ pathScaled.length === 0 ? '全部維持 100%（340px）且沒有平移，已畫好的筆順不受影響' : `有 ${pathScaled.length} 個字被縮小或平移：${pathScaled.map((r) => r.char).join('、')}` }}
    </p>

    <ul id="path-outside" class="text-xs font-mono text-gray-500 dark:text-gray-400">
      <li v-for="r in pathRows.filter((r) => !r.check.inBox || !r.check.inMargin)" :key="r.char">
        <span class="thai-font">{{ r.char }}</span> {{ r.check.inBox ? '超出邊距' : '超出框' }} x {{ fmt(r.check.left) }}～{{ fmt(r.check.right) }} y {{ fmt(r.check.top) }}～{{ fmt(r.check.bottom) }}
      </li>
    </ul>

    <h2 class="mt-6 text-lg font-bold text-gray-800 dark:text-white">/thai 元音卡片預覽（{{ thaiVowels.length }} 個）</h2>
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
      <div v-for="t in thaiVowels" :key="t.char" class="flex flex-col items-center justify-center gap-1 p-3 min-h-[120px] rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
        <div class="font-bold thai-font mb-2 text-center text-3xl"><VowelText v-if="t.writeBase" :text="t.writeBase" :is-dark="isDark" :font-size="30" :line-height="36 / 30" bold /></div>
        <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 thai-font">{{ t.thaiLabel }}</div>
        <div class="text-[10px] font-mono text-gray-400">{{ t.strokes ? '有筆順' : '無筆順' }}</div>
      </div>
    </div>

    <p v-if="modalVowel" id="modal-overflow" class="font-mono text-sm text-gray-600 dark:text-gray-300">彈窗：{{ modalOverflow }}</p>
    <HandwritingModal v-if="modalVowel" :hw="hw" :is-dark="isDark" fit-viewport :title="`${modalVowel.v.form}（${modalVowel.v.withO}）`"
      :strokes="modalVowel.strokes" :guide-text="modalVowel.base" @close="() => {}" />
  </div>
</template>
