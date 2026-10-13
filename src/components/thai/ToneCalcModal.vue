<script setup lang="ts">
import { useThaiPageContext } from '@/composables/thai/useThaiPage'

const { modals, toneCalcTab, toneCalc, toneCalcResultData, speak } = useThaiPageContext()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center w-full h-full modal backdrop-blur-xs bg-gray-900/60 p-4" @click.self="modals.calc = false">
    <div class="w-11/12 mx-auto overflow-hidden transition-all transform bg-white shadow-2xl dark:bg-slate-800 md:max-w-lg rounded-3xl">
      <div class="flex border-b border-gray-100 dark:border-slate-700">
        <button @click="toneCalcTab = 'calc'" :class="toneCalcTab === 'calc' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'" class="flex-1 py-3 text-sm font-bold transition-colors">計算機</button>
        <button @click="toneCalcTab = 'cheat'" :class="toneCalcTab === 'cheat' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'" class="flex-1 py-3 text-sm font-bold transition-colors">規則總表</button>
        <button @click="modals.calc = false" class="px-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400">✕</button>
      </div>

      <div v-if="toneCalcTab === 'calc'" class="p-6">
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">1. 輔音類別</label>
            <button @click="toneCalc.class = 'Mid'" class="py-2 px-1 border rounded-lg text-xs md:text-sm font-bold transition-colors" :class="toneCalc.class==='Mid'?'bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-300':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">中音 (Mid)</button>
            <button @click="toneCalc.class = 'High'" class="py-2 px-1 border rounded-lg text-xs md:text-sm font-bold transition-colors" :class="toneCalc.class==='High'?'bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-300':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">高音 (High)</button>
            <button @click="toneCalc.class = 'Low'" class="py-2 px-1 border rounded-lg text-xs md:text-sm font-bold transition-colors" :class="toneCalc.class==='Low'?'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-300':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">低音 (Low)</button>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">2. 音節型態</label>
            <button @click="toneCalc.syllable = 'Live'" class="py-2 px-1 border rounded-lg text-xs md:text-sm font-bold transition-colors" :class="toneCalc.syllable==='Live'?'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900 dark:text-purple-300':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">活音 (Live)</button>
            <button @click="toneCalc.syllable = 'DeadShort'" class="py-2 px-1 border rounded-lg text-xs md:text-sm font-bold transition-colors" :class="toneCalc.syllable==='DeadShort'?'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900 dark:text-purple-300':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">死音(短)</button>
            <button @click="toneCalc.syllable = 'DeadLongOrStop'" class="py-2 px-1 border rounded-lg text-xs md:text-sm font-bold transition-colors" :class="toneCalc.syllable==='DeadLongOrStop'?'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900 dark:text-purple-300':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">死音(長/塞尾)</button>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">3. 聲調符號</label>
            <button @click="toneCalc.mark = 'None'" class="py-2 px-1 border rounded-lg text-xs md:text-sm transition-colors" :class="toneCalc.mark==='None'?'bg-gray-200 border-gray-400 font-bold dark:bg-slate-700 dark:text-white':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">無</button>
            <button @click="toneCalc.mark = 'Ek'" class="py-2 px-1 border rounded-lg text-xs md:text-sm transition-colors" :class="toneCalc.mark==='Ek'?'bg-gray-200 border-gray-400 font-bold dark:bg-slate-700 dark:text-white':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">-่ (Ek)</button>
            <button @click="toneCalc.mark = 'Tho'" class="py-2 px-1 border rounded-lg text-xs md:text-sm transition-colors" :class="toneCalc.mark==='Tho'?'bg-gray-200 border-gray-400 font-bold dark:bg-slate-700 dark:text-white':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">-้ (Tho)</button>
            <button @click="toneCalc.mark = 'Tri'" class="py-2 px-1 border rounded-lg text-xs md:text-sm transition-colors" :class="toneCalc.mark==='Tri'?'bg-gray-200 border-gray-400 font-bold dark:bg-slate-700 dark:text-white':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">-๊ (Tri)</button>
            <button @click="toneCalc.mark = 'Jat'" class="py-2 px-1 border rounded-lg text-xs md:text-sm transition-colors" :class="toneCalc.mark==='Jat'?'bg-gray-200 border-gray-400 font-bold dark:bg-slate-700 dark:text-white':'hover:bg-gray-50 dark:hover:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-300'">-๋ (Jat)</button>
          </div>
        </div>
        <div class="relative p-5 overflow-hidden text-center text-white bg-slate-800 border border-slate-700 shadow-inner cursor-pointer rounded-2xl group" @click="speak({soundText: toneCalcResultData.thai})">
          <div class="absolute top-0 left-0 w-full h-1 bg-linear-to-r/srgb from-blue-400 via-purple-500 to-pink-500"></div>
          <div class="mb-1 text-xs text-slate-400">計算結果 (點擊播放)</div>
          <div class="mt-1 mb-2 text-5xl font-bold text-yellow-400 thai-font">
            <div class="flex flex-col items-center">
              <div>{{ toneCalcResultData.thai }} <span class="ml-2 text-lg text-yellow-200">({{ toneCalcResultData.read }})</span></div>
              <div v-if="toneCalc.class === 'Low' && (toneCalc.mark === 'Ek' || toneCalc.mark === 'Tho')" class="mt-2 inline-block px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full animate-pulse shadow-xs">⚠️ 觸發規則：低音符號音調跳階</div>
            </div>
          </div>
          <div class="text-sm text-slate-300">{{ toneCalcResultData.desc }}</div>
          <div class="absolute opacity-50 bottom-2 right-3">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          </div>
        </div>
      </div>

      <div v-if="toneCalcTab === 'cheat'" class="p-4 overflow-y-auto max-h-[75vh]">
        <table class="w-full text-xs text-center text-gray-800 border-collapse dark:text-gray-200">
          <thead><tr class="font-bold text-gray-600 bg-gray-100 dark:bg-slate-700 dark:text-gray-300"><th class="p-2 border dark:border-slate-600">類別</th><th class="p-2 border dark:border-slate-600">活音(長)</th><th class="p-2 border dark:border-slate-600">死音(短)</th><th class="p-2 border dark:border-slate-600">-่ (Ek)</th><th class="p-2 border dark:border-slate-600">-้ (Tho)</th></tr></thead>
          <tbody>
            <tr><td class="p-2 font-bold text-green-800 border dark:border-slate-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400">中音</td><td class="p-2 border dark:border-slate-600">Mid</td><td class="p-2 border dark:border-slate-600">Low</td><td class="p-2 border dark:border-slate-600">Low</td><td class="p-2 border dark:border-slate-600">Falling</td></tr>
            <tr><td class="p-2 font-bold text-red-800 border dark:border-slate-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400">高音</td><td class="p-2 border dark:border-slate-600">Rising</td><td class="p-2 border dark:border-slate-600">Low</td><td class="p-2 border dark:border-slate-600">Low</td><td class="p-2 border dark:border-slate-600">Falling</td></tr>
            <tr><td class="p-2 font-bold text-blue-800 border dark:border-slate-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">低音</td><td class="p-2 border dark:border-slate-600">Mid</td><td class="p-2 border dark:border-slate-600">High</td><td class="p-2 border dark:border-slate-600 font-bold text-blue-600">Falling</td><td class="p-2 border dark:border-slate-600 font-bold text-blue-600">High</td></tr>
          </tbody>
        </table>
        <div class="mt-6">
          <h4 class="mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">💡 低音 Falling / High 實戰案例</h4>
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"><div class="flex justify-between items-center mb-1"><span class="text-lg font-bold thai-font text-blue-700 dark:text-blue-300">แม่ / ไม่</span><span class="text-[10px] bg-blue-200 dark:bg-blue-800 px-1 rounded text-blue-800 dark:text-blue-200">Falling</span></div><p class="text-[10px] text-gray-500 dark:text-gray-400">低音 + ่ (Ek) = 3 聲<br />(媽媽 / 不)</p></div>
            <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800"><div class="flex justify-between items-center mb-1"><span class="text-lg font-bold thai-font text-indigo-700 dark:text-indigo-300">ม้า / น้อง</span><span class="text-[10px] bg-indigo-200 dark:bg-indigo-800 px-1 rounded text-indigo-800 dark:text-indigo-200">High</span></div><p class="text-[10px] text-gray-500 dark:text-gray-400">低音 + ้ (Tho) = 4 聲<br />(馬 / 弟妹)</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
