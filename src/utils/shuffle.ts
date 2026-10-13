// 陣列洗牌 (Fisher-Yates)，回傳新陣列（原版 js/utils.js 的 shuffleArray）
export const shuffleArray = <T>(array: readonly T[]): T[] => {
  const newArr = [...array]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

// 原地洗牌（原版 thaiPlayer / thaiTyping 內的 shuffleArray）
export const shuffleInPlace = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
