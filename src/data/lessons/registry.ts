// 課程清單：自動收集 lesson-XX.ts，新增課程只要加檔案
// 獨立成一個檔（不依賴 thaiVocab），讓大廳卡片（config.ts）只載入課程本身
import type { Lesson } from '@/types/lesson'

const modules = import.meta.glob<{ default: Lesson }>('./lesson-*.ts', { eager: true })

/** 全部課程，依課次排序 */
export const LESSONS: readonly Lesson[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.no - b.no)

export const getLesson = (no: number): Lesson | undefined => LESSONS.find((l) => l.no === no)

/** 最新一課 */
export const latestLesson = (): Lesson | undefined => LESSONS[LESSONS.length - 1]
