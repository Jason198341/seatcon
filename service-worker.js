/**
 * Service Worker for Global SeatCon 2025 Conference Chat
 * 오프라인 기능 및 캐싱을 지원합니다.
 */

// 캐시 이름
const CACHE_NAME = 'seatcon-chat-cache-v1';

// 캐시할 파일 목록
const FILES_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './css/styles.css',
  './js/app-core.js',
  './js/app-ui.js',
  './js/app-i18n.js',
  './js/app-chat.js',
  './js/app-users.js',
  './js/app-rooms.js',
  './js/services/dbService.js',
  './js/services/realtimeService.js',
  './js/services/translationService.js',
  './js/services/userService.js',
  './js/services/chatService.js',
  './js/services/offlineService.js',
  './locales/translations.json',
  './assets/icon-192x192.png',
  './assets/icon-512x512.png',
  './assets/maskable-icon.png',
  './manifest.json'
];

// 설치 이벤트 처리
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  // 캐시 구성
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all: app shell and content');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // 설치가 완료되면 활성화 단계로 즉시 이동
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트 처리
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  // 이전 캐시 정리
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      // 활성화 시 모든 클라이언트에 대한 제어권 확보
      return self.clients.claim();
    })
  );
});

// 페이지 이동 이벤트 처리
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetch', event.request.url);
  
  // 오프라인 처리 전략: 네트워크 우선, 실패시 캐시
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./offline.html');
        })
    );
    return;
  }
  
  // API 요청은 항상 네트워크로 처리
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.log('[Service Worker] Network request failed:', error);
          
          // API 오류 응답
          return new Response(JSON.stringify({
            error: 'Network error',
            offline: true
          }), {
            status: 503,
            headers: {'Content-Type': 'application/json'}
          });
        })
    );
    return;
  }
  
  // 정적 자원은 캐시 우선, 없으면 네트워크 요청
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크 요청
        return fetch(event.request)
          .then((res) => {
            // 유효한 응답만 캐시에 저장
            if (!res || res.status !== 200 || res.type !== 'basic') {
              return res;
            }
            
            // 응답 복제 (스트림은 한 번만 사용 가능)
            const responseToCache = res.clone();
            
            // 캐시에 저장
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return res;
          })
          .catch((error) => {
            console.log('[Service Worker] Fetch failed:', error);
            
            // 네트워크 실패 시 적절한 오프라인 콘텐츠 제공
            if (event.request.url.includes('.css')) {
              return new Response('/* Offline CSS fallback */', {
                headers: {'Content-Type': 'text/css'}
              });
            }
            
            if (event.request.url.includes('.js')) {
              return new Response('console.log("Offline JS fallback");', {
                headers: {'Content-Type': 'application/javascript'}
              });
            }
            
            // 이미지 요청인 경우 오프라인 이미지 제공
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('./assets/offline-image.png');
            }
            
            // 기타 요청은 기본 오프라인 응답 제공
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// 메시지 이벤트 처리 (서비스 워커 업데이트)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 푸시 알림 이벤트 처리
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.', event);
  
  let title = 'Global SeatCon 2025';
  let options = {
    body: 'New message in the chat',
    icon: './assets/icon-192x192.png',
    badge: './assets/notification-badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: self.location.origin
    }
  };
  
  // 알림 데이터가 있으면 사용
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data.data };
    } catch (e) {
      // JSON이 아닌 경우 텍스트로 처리
      options.body = event.data.text();
    }
  }
  
  // 알림 표시
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.notification);
  
  event.notification.close();
  
  // 클릭 시 앱 열기
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 열린 창이 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
  );
});

// 백그라운드 동기화 이벤트 처리 (오프라인 메시지 동기화)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // 오프라인 메시지 동기화 로직
      // 실제로는 IndexedDB에서 대기 중인 메시지를 가져와 서버로 전송하는 코드 필요
      // 데모에서는 콘솔 로그만 출력
      console.log('[Service Worker] Syncing offline messages')
    );
  }
});

// 주기적 동기화 이벤트 처리 (백그라운드 업데이트)
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic Sync:', event.tag);
  
  if (event.tag === 'update-cache') {
    event.waitUntil(
      // 캐시 갱신 로직
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  }
});
