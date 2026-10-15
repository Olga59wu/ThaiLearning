import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { safeStorage } from '@/utils/storage'

/** 課程頁的顯示設定 */
export const useLessonSettingsStore = defineStore('lessonSettings', () => {
  // 顯示泰文字（拼音下方的小字參考）；預設開啟
  const showThai = ref(safeStorage.get<boolean>('thai-lesson-show-thai', true))
  watch(showThai, (val) => safeStorage.set('thai-lesson-show-thai', val))

  return { showThai }
})
