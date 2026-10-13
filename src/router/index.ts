import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { applyPageMeta, FAVICON, FONTS, VIEWPORT } from '@/router/pageMeta'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    favicon?: string
    viewport?: string
    lang?: string
    fonts?: string
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '泰語學習機', viewport: VIEWPORT.noZoom, lang: 'zh-TW', fonts: FONTS.home },
    },
    {
      path: '/thai',
      name: 'thai',
      component: () => import('@/views/ThaiView.vue'),
      meta: {
        title: '🇹🇭 泰語學習機',
        favicon: FAVICON.thai,
        viewport: VIEWPORT.noZoom,
        lang: 'zh-TW',
        fonts: FONTS.thai,
        requiresAuth: true,
      },
    },
    {
      path: '/player',
      name: 'player',
      component: () => import('@/views/ThaiPlayerView.vue'),
      meta: {
        title: '泰文隨身聽 - 單字自動播放',
        viewport: VIEWPORT.noZoomCover,
        lang: 'zh-Hant',
        fonts: FONTS.sarabun,
        requiresAuth: true,
      },
    },
    {
      path: '/typing',
      name: 'typing',
      component: () => import('@/views/ThaiTypingView.vue'),
      meta: {
        title: '泰文單字大師',
        viewport: VIEWPORT.noZoomCover,
        lang: 'zh-Hant',
        fonts: FONTS.sarabun,
        requiresAuth: true,
      },
    },
    {
      path: '/downloader',
      name: 'downloader',
      component: () => import('@/views/ThaiDownloaderView.vue'),
      meta: {
        title: '泰文音檔同步 Pro - 穩定版',
        viewport: VIEWPORT.basic,
        lang: 'zh-Hant',
        fonts: FONTS.downloader,
        requiresAuth: true,
      },
    },
    {
      path: '/path',
      name: 'path',
      component: () => import('@/views/PathEditorView.vue'),
      meta: {
        title: '筆順產生器',
        favicon: FAVICON.pen,
        viewport: VIEWPORT.basic,
        lang: 'zh-TW',
        fonts: FONTS.sarabun,
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        title: '404 - 找不到頁面',
        favicon: FAVICON.rocket,
        viewport: VIEWPORT.basic,
        lang: 'zh-TW',
        fonts: FONTS.notFound,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.requiresAdmin) return true

  const authStore = useAuthStore()
  await authStore.ready

  // 未登入或不在白名單：導回登入頁（原版 window.location.href = 'index.html'）
  if (!authStore.isLoggedIn) return { name: 'home' }
  if (to.meta.requiresAdmin && !authStore.isAdmin) return { name: 'home' }
  return true
})

router.afterEach((to) => {
  applyPageMeta(to)
})

export default router
