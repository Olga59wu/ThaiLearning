import { onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePageShell } from '@/composables/usePageShell'
import { useThaiLearnStore } from '@/stores/thaiLearn'
import { safeStorage } from '@/utils/storage'

/**
 * 課程頁共用的頁面外殼：沿用 /thai 的 body 樣式與深色模式（localStorage theme，與 /thai 同步）
 */
export const useLessonTheme = () => {
  usePageShell({
    htmlClass: 'shell-common shell-learning',
    bodyClass:
      'theme-thai min-h-screen flex flex-col items-center p-4 pb-20 transition-colors duration-300 bg-linear-to-b/srgb from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800',
  })

  const { isDark } = storeToRefs(useThaiLearnStore())
  // 每頁重新讀一次（其他頁可能改過）
  isDark.value = safeStorage.get<string | null>('theme', null) === 'dark'

  watch(
    isDark,
    (val) => {
      document.documentElement.classList.toggle('dark', val)
      safeStorage.set('theme', val ? 'dark' : 'light')
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    document.documentElement.classList.remove('dark')
  })

  const toggleDark = () => {
    isDark.value = !isDark.value
  }

  return { isDark, toggleDark }
}
