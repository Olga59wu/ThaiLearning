import { onBeforeUnmount } from 'vue'

/**
 * 包裝 setTimeout：頁面卸載時清除所有尚未執行的計時器。
 * 原版每頁是獨立 HTML，換頁時瀏覽器會自動終止；SPA 必須自己清除，避免離開後仍發音或改狀態。
 */
export const useTimers = () => {
  const timers = new Set<ReturnType<typeof setTimeout>>()

  const later = (fn: () => void, ms?: number) => {
    const id = setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
    return id
  }

  const cancel = (id: ReturnType<typeof setTimeout> | null | undefined) => {
    if (id == null) return
    clearTimeout(id)
    timers.delete(id)
  }

  const clearAll = () => {
    timers.forEach((id) => clearTimeout(id))
    timers.clear()
  }

  onBeforeUnmount(clearAll)

  return { later, cancel, clearAll }
}
