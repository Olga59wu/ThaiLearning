import type { RouteLocationNormalized } from 'vue-router'

// 各頁原本 <head> 的差異：標題、favicon、viewport、lang、Google Fonts
const emojiIcon = (emoji: string) =>
  `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`

export const FAVICON = {
  thai: emojiIcon('🇹🇭'),
  rocket: emojiIcon('🚀'),
  pen: emojiIcon('🖋️'),
  book: emojiIcon('📘'),
}

export const VIEWPORT = {
  noZoom: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
  noZoomCover:
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
  basic: 'width=device-width, initial-scale=1.0',
}

const FONT_BASE = 'https://fonts.googleapis.com/css2?'
export const FONTS = {
  home: `${FONT_BASE}family=Noto+Sans+TC:wght@400;500;700;900&display=swap`,
  thai: `${FONT_BASE}family=Sarabun:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap`,
  sarabun: `${FONT_BASE}family=Sarabun:wght@400;700&display=swap`,
  downloader: `${FONT_BASE}family=Sarabun:wght@400;500;600;700;800&family=Inter:wght@400;600;700&display=swap`,
  notFound: `${FONT_BASE}family=Noto+Sans+TC:wght@400;500;700&display=swap`,
  // 課程頁：同 thai，另加鉛筆筆記用的手寫字型（霞鶩文楷 TC）
  lessons: `${FONT_BASE}family=Sarabun:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&family=LXGW+WenKai+TC:wght@400&display=swap`,
}

const upsertHeadEl = <K extends keyof HTMLElementTagNameMap>(
  selector: string,
  tag: K,
  init: (el: HTMLElementTagNameMap[K]) => void,
) => {
  let el = document.head.querySelector<HTMLElementTagNameMap[K]>(selector)
  if (!el) {
    el = document.createElement(tag)
    document.head.appendChild(el)
  }
  init(el)
  return el
}

export const applyPageMeta = (to: RouteLocationNormalized) => {
  const { title, favicon, viewport, lang, fonts } = to.meta

  if (title) document.title = title
  document.documentElement.lang = lang ?? 'zh-TW'

  const vp = document.head.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (vp) vp.content = viewport ?? VIEWPORT.basic

  // favicon：有設定才放，沒設定的頁面移除（原版 index 等頁沒有 favicon）
  const iconSel = 'link[rel="icon"][data-page]'
  if (favicon) {
    upsertHeadEl(iconSel, 'link', (el) => {
      el.rel = 'icon'
      el.dataset.page = ''
      el.href = favicon
    })
  } else {
    document.head.querySelector(iconSel)?.remove()
  }

  // Google Fonts：每頁載入與原版相同的字重，避免多載字重造成粗細不同
  const fontSel = 'link[rel="stylesheet"][data-page-font]'
  if (fonts) {
    upsertHeadEl(fontSel, 'link', (el) => {
      el.rel = 'stylesheet'
      el.dataset.pageFont = ''
      if (el.href !== fonts) el.href = fonts
    })
  } else {
    document.head.querySelector(fontSel)?.remove()
  }
}
