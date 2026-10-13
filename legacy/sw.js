// 當有更新時更改 CACHE_NAME 手機內容才不會被catch住
const CACHE_NAME = 'lang-app-cache-v23'
const AUDIO_CACHE_NAME = 'lang-audio-cache-v3' // 🎧 新增：專屬音檔快取空間

// 核心檔案 (絕對不要放音檔進來！)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './thai.html',
  './thaiTyping.html',
  './thaiPlayer.html',
  './jpPlayer.html',
  './jpDownloader.html',
  './japan.html',
  './korean.html',
  './css/common.css',
  './css/learning.css',
  './js/auth.js',
  './js/config.js',
  './js/dbService.js',
  './js/utils.js',
  './data/jpTyping.js',
  './data/thaiTyping.js',
  './icon-192x192.png',
  './icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 清除舊版本的快取，但保留音檔快取
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith('http')) return

  // 判斷請求的是不是音檔 (根據你的路徑或副檔名判斷)
  const isAudio =
    event.request.url.includes('/audio/') || event.request.url.endsWith('.mp3')
  // 決定要存到哪個快取區
  const targetCacheName = isAudio ? AUDIO_CACHE_NAME : CACHE_NAME

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(targetCacheName).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch((error) => console.log('離線狀態，使用快取', error))

      // 音檔策略：有快取就直接用快取(比較省流量且播放快)，沒有才去網路抓
      if (isAudio && cachedResponse) {
        return cachedResponse
      }

      return cachedResponse || fetchPromise
    })
  )
})
