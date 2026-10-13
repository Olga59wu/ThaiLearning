// 安全的 LocalStorage 存取（JSON 格式，原版 js/utils.js 的 safeStorage）
export const safeStorage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : fallback
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage`, e)
      return fallback
    }
  },
  set: (key: string, value: unknown): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn(`Error writing ${key} to localStorage`, e)
      return false
    }
  },
}
