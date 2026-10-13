// 安全的 LocalStorage 存取
export const safeStorage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : fallback
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage`, e)
      return fallback
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn(`Error writing ${key} to localStorage`, e)
      return false
    }
  },
}

// 陣列洗牌 (Fisher-Yates)
export function shuffleArray(array) {
  const newArr = [...array]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

// 隨機選取 N 個元素
export function getRandomItems(array, count) {
  const shuffled = shuffleArray(array)
  return shuffled.slice(0, count)
}

// 播放音效
export function playSound(type) {
  // 這裡可以把原本散落在各處的 Audio 邏輯整合
  // 暫時先留空或放簡單邏輯
}
