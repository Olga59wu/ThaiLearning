import { onBeforeUnmount, ref } from 'vue'
import { downloadOfflineAudio } from '@/services/offlineAudio'

export interface DownloadModalState {
  show: boolean
  type: 'confirm' | 'success'
  successCount: number
}

/** Player / Typing 頂部「離線語音」按鈕與確認／成功彈窗的流程 */
export const useOfflineAudioDownload = () => {
  const isDownloading = ref(false)
  // 彈窗狀態管理
  const downloadModal = ref<DownloadModalState>({ show: false, type: 'confirm', successCount: 0 })
  const closeDownloadModal = () => {
    downloadModal.value.show = false
  }
  const downloadProgress = ref(0)
  const downloadTotal = ref(0)

  // SPA 離開頁面時停止下載（原版換頁時由瀏覽器中斷）
  let disposed = false
  onBeforeUnmount(() => {
    disposed = true
  })

  // 1. 點擊導覽列按鈕時，不再用 confirm()，而是彈出我們自己的詢問視窗
  const startDownload = () => {
    if (isDownloading.value) return
    downloadModal.value = { show: true, type: 'confirm', successCount: 0 }
  }

  // 2. 在自訂視窗點擊「開始下載」後，才會執行這段
  const executeDownload = async () => {
    // 關閉詢問視窗，並讓導覽列按鈕開始轉圈圈
    downloadModal.value.show = false
    isDownloading.value = true
    downloadProgress.value = 0
    downloadTotal.value = 0

    try {
      const successCount = await downloadOfflineAudio(
        (current, total) => {
          downloadProgress.value = current
          downloadTotal.value = total
        },
        () => disposed,
      )
      if (disposed) return

      // 給畫面 0.3 秒緩衝，然後跳出「下載完成」的美美彈窗
      await new Promise((resolve) => setTimeout(resolve, 300))
      if (disposed) return
      downloadModal.value = { show: true, type: 'success', successCount: successCount }
    } catch (error) {
      console.error('下載過程出錯:', error)
      if (!disposed) alert('下載失敗，請檢查網路連線。')
    } finally {
      isDownloading.value = false
    }
  }

  return {
    isDownloading,
    downloadModal,
    closeDownloadModal,
    downloadProgress,
    downloadTotal,
    startDownload,
    executeDownload,
  }
}
