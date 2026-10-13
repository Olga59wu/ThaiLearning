import { onBeforeUnmount, shallowRef } from 'vue'

/** 螢幕常亮鎖 (Wake Lock)；頁面卸載時釋放 */
export const useWakeLock = () => {
  const wakeLock = shallowRef<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.value = await navigator.wakeLock.request('screen')
        console.log('螢幕常亮啟動')

        // 處理鎖被系統意外釋放的情況（例如切換分頁）
        wakeLock.value.addEventListener('release', () => {
          console.log('螢幕常亮已釋放')
        })
      }
    } catch (err) {
      const e = err as Error
      console.error(`${e.name}, ${e.message}`)
    }
  }

  const releaseWakeLock = () => {
    if (wakeLock.value) {
      wakeLock.value.release()
      wakeLock.value = null
    }
  }

  onBeforeUnmount(releaseWakeLock)

  return { wakeLock, requestWakeLock, releaseWakeLock }
}
