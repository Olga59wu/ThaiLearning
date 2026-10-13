/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import type { RouteHandlerCallback, RouteMatchCallback } from 'workbox-core'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// 🎧 音檔專屬快取空間（沿用原版名稱）
const AUDIO_CACHE_NAME = 'lang-audio-cache-v3'
// 跨網域等非 precache 資源（原版的 app cache 策略）
const RUNTIME_CACHE_NAME = 'lang-runtime-cache'

self.addEventListener('install', () => {
  self.skipWaiting()
})
clientsClaim()

// 程式本體：Workbox precache（檔名含 hash，不需手動遞增版號）
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA：離線時所有頁面導航都回傳 index.html
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/__\//, /^\/audio\//],
  }),
)

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          // 清除舊版本的快取，但保留音檔、runtime 與 Workbox precache
          if (
            cacheName !== AUDIO_CACHE_NAME &&
            cacheName !== RUNTIME_CACHE_NAME &&
            !cacheName.startsWith('workbox-precache')
          ) {
            return caches.delete(cacheName)
          }
          return undefined
        }),
      ),
    ),
  )
})

// 判斷請求的是不是音檔（原版：路徑含 /audio/ 或副檔名 .mp3）
const isAudioUrl = (url: URL) => url.href.includes('/audio/') || url.href.endsWith('.mp3')

// Firebase Auth／Firestore 等請求不經 SW 快取，直接走網路
const isFirebaseUrl = (url: URL) =>
  (url.hostname.endsWith('.googleapis.com') && url.hostname !== 'fonts.googleapis.com') ||
  url.hostname.endsWith('.firebaseapp.com') ||
  url.hostname.endsWith('.firebasestorage.app') ||
  url.hostname === 'apis.google.com'

const isHttpGet = (request: Request) =>
  request.method === 'GET' && request.url.startsWith('http')

// 向網路抓取，status 200 時寫入指定快取
const fetchAndCache = (req: Request, targetCacheName: string) =>
  fetch(req)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone()
        caches.open(targetCacheName).then((cache) => {
          cache.put(req, responseToCache)
        })
      }
      return networkResponse
    })
    .catch((error) => {
      console.log('離線狀態，使用快取', error)
      return undefined
    })

// 音檔：純 cache-first。有快取就直接回傳，不發任何網路請求；沒有快取才走網路並寫入
const audioCacheFirst: RouteHandlerCallback = async ({ request }) => {
  const req = request as Request
  const cachedResponse = await caches.match(req)
  if (cachedResponse) return cachedResponse
  return (await fetchAndCache(req, AUDIO_CACHE_NAME)) ?? Response.error()
}

// 其他資源（原版 app cache 策略）：有快取先回快取，同時背景向網路更新；沒快取就等網路
const staleWhileRevalidate =
  (targetCacheName: string): RouteHandlerCallback =>
  async ({ request }) => {
    const req = request as Request
    const cachedResponse = await caches.match(req)
    const fetchPromise = fetchAndCache(req, targetCacheName)
    if (cachedResponse) return cachedResponse
    return (await fetchPromise) ?? Response.error()
  }

const matchAudio: RouteMatchCallback = ({ request, url }) =>
  isHttpGet(request) && isAudioUrl(url)

const matchRuntime: RouteMatchCallback = ({ request, url }) =>
  isHttpGet(request) && !isAudioUrl(url) && !isFirebaseUrl(url)

registerRoute(matchAudio, audioCacheFirst)
registerRoute(matchRuntime, staleWhileRevalidate(RUNTIME_CACHE_NAME))
