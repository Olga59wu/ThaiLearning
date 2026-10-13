import { onBeforeMount, onBeforeUnmount } from 'vue'

interface PageShellOptions {
  /** 加在 <html> 的 class（例如 CSS 範圍 shell-common） */
  htmlClass?: string
  /** 原版該頁 <body class="..."> */
  bodyClass?: string
}

const splitClass = (value?: string) => (value ?? '').split(/\s+/).filter(Boolean)

/**
 * 原版每頁是獨立 HTML，<html>/<body> 的 class 各自不同。
 * SPA 中在頁面掛載前加上、卸載前移除（用 onBeforeUnmount，確保在下一頁掛載前清除）。
 */
export const usePageShell = (options: PageShellOptions) => {
  const htmlClasses = splitClass(options.htmlClass)
  const bodyClasses = splitClass(options.bodyClass)

  onBeforeMount(() => {
    document.documentElement.classList.add(...htmlClasses)
    document.body.classList.add(...bodyClasses)
  })

  onBeforeUnmount(() => {
    document.documentElement.classList.remove(...htmlClasses)
    document.body.classList.remove(...bodyClasses)
  })
}
