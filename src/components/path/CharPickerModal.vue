<script setup lang="ts">
import { computed, ref } from 'vue'
import { thaiData } from '@/data/thai'

// 原版 #picker-modal：只保留泰語輔音／元音／數字 tab（日語平假名／片假名已移除）
type PickerType = 'thai_con' | 'thai_vow' | 'thai_num'

interface PickerItem {
  char: string
  realChar?: string
  /** 選字表上顯示的字（元音顯示 writeBase，例如 อะ） */
  display?: string
  label: string
}

const emit = defineEmits<{
  select: [char: string]
  close: []
}>()

// 原版 openCharPicker() 每次打開都 renderPicker('thai_con')；父層以 v-if 掛載，打開時重新從輔音開始
const pickerType = ref<PickerType>('thai_con')

const TAB_ACTIVE = 'picker-tab px-4 py-2 rounded-lg text-sm font-bold bg-emerald-500 text-white shadow-xs transition-all whitespace-nowrap'
const TAB_INACTIVE = 'picker-tab px-4 py-2 rounded-lg text-sm font-bold bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all whitespace-nowrap'

const tabs: { type: PickerType; label: string }[] = [
  { type: 'thai_con', label: '泰語輔音' },
  { type: 'thai_vow', label: '泰語元音' },
  { type: 'thai_num', label: '泰文數字' },
]

const list = computed<PickerItem[]>(() => {
  if (pickerType.value === 'thai_con') return thaiData.filter((d) => d.type === 'consonant').map((d) => ({ char: d.char, label: d.reading }))
  if (pickerType.value === 'thai_num') return thaiData.filter((d) => d.type === 'numbers').map((d) => ({ char: d.char, label: d.reading }))
  // 元音顯示 writeBase（อ 表示子音位置，同課本；刻意和原版不同）
  return thaiData.filter((d) => d.type === 'vowel').map((d) => ({ char: d.char.replace(/◌/g, '-'), realChar: d.char, display: d.writeBase, label: d.reading }))
})

const renderPicker = (type: PickerType) => {
  pickerType.value = type
}

// 原版 closeCharPicker(e)：沒有事件（關閉按鈕）或點到背景才關閉
const closeCharPicker = (e: MouseEvent | null) => {
  const target = e?.target as HTMLElement | undefined
  if (!e || target?.id === 'picker-modal' || !target?.closest) {
    emit('close')
  }
}
</script>

<template>
  <!-- 原版 class 有 hidden（以 classList 切換），這裡改由父層 v-if 控制 -->
  <div id="picker-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-xs" @click="closeCharPicker($event)">
    <!-- 原版有 animate-slide-up，但 path.html 的 Tailwind 沒有定義此動畫（無作用）；新版 @theme 有定義（index 用），故移除以維持無動畫 -->
    <div class="bg-white w-11/12 max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" @click.stop>
      <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
        <div class="flex gap-2 overflow-x-auto no-scrollbar">
          <button v-for="tab in tabs" :key="tab.type" :class="pickerType === tab.type ? TAB_ACTIVE : TAB_INACTIVE" @click="renderPicker(tab.type)">{{ tab.label }}</button>
        </div>
        <button class="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0" @click="closeCharPicker(null)">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div id="picker-grid" class="flex-1 overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 content-start bg-slate-50">
        <button v-for="(item, i) in list" :key="`${pickerType}-${i}`" class="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-gray-200 shadow-xs hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500 hover:bg-emerald-50 transition-all h-24 group" @click="emit('select', item.realChar || item.char)"><span class="text-3xl font-bold text-gray-700 group-hover:text-emerald-600 thai-font mb-1">{{ item.display || item.realChar || item.char }}</span><span class="text-xs text-gray-400 uppercase group-hover:text-emerald-500 font-mono">{{ item.label || '' }}</span></button>
      </div>
    </div>
  </div>
</template>
