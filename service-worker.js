/**
 * 컨퍼런스 채팅 앱 서비스 워커
 * 
 * 오프라인 지원 및 캐싱 전략을 구현합니다.
 * 웹 푸시 알림을 처리합니다.
 */

// 캐시 이름 및 버전 관리
const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `conference-chat-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `conference-chat-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `conference-chat-api-${CACHE_VERSION}`;

// 캐싱할 정적 자산
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/styles/chat.css',
  '/styles/responsive.css',
  '/js/main.js',
  '/js/chat.js',
  '/js/config.js',
  '/js/i18n.js',
  '/js/mobile-ui.js',
  '/js/supabase-client.js',
  '/js/translation.js',
  '/js/user.js',
  '/js/utils.js',
  '/assets/icons/favicon.ico',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/chat-icon.png',
  '/assets/icons/exhibition-icon.png',
  '/assets/images/offline.svg',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard-dynamic-subset.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Supabase API 엔드포인트 (캐싱 예외 항목)
const SUPABASE_URL = 'https://veudhigojdukbqfgjeyh.supabase.co';

// Google Translation API 엔드포인트 (캐싱 예외 항목)
const TRANSLATION_API_URL = 'https://translation.googleapis.com';

// 설치 이벤트 핸들러 - 정적 자산 캐싱
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 설치 중...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 정적 자산 캐싱 중...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] 정적 자산 캐싱 완료');
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트 핸들러 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME
            ) {
              console.log('[Service Worker] 오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] 오래된 캐시 정리 완료');
        return self.clients.claim();
      })
  );
});

// 페치 이벤트 핸들러 - 캐싱 전략 적용
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // API 요청 처리 (Supabase 및 Translation API)
  if (url.origin === SUPABASE_URL || url.origin === TRANSLATION_API_URL) {
    // API는 네트워크 우선 전략 사용
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // 정적 자산 요청 처리
  if (STATIC_ASSETS.some(asset => request.url.endsWith(asset))) {
    // 정적 자산은 캐시 우선 전략 사용
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // 기타 요청은 네트워크 우선 + 동적 캐싱 전략 사용
  event.respondWith(networkFirstWithCacheStrategy(request));
});

// 메시지 이벤트 핸들러 - 클라이언트 간 통신
self.addEventListener('message', (event) => {
  console.log('[Service Worker] 메시지 수신:', event.data);
  
  // 캐시 갱신 메시지 처리
  if (event.data && event.data.action === 'CACHE_NEW_MESSAGES') {
    const messages = event.data.messages;
    // 새 메시지 캐싱 로직 구현
    cacheMessages(messages);
  }
  
  // 사용자 정보 캐싱 메시지 처리
  if (event.data && event.data.action === 'CACHE_USER_INFO') {
    const userInfo = event.data.userInfo;
    // 사용자 정보 캐싱 로직 구현
    cacheUserInfo(userInfo);
  }
  
  // 캐시 초기화 메시지 처리
  if (event.data && event.data.action === 'CLEAR_DYNAMIC_CACHE') {
    clearDynamicCache();
  }
});

// 푸시 이벤트 핸들러 - 웹 푸시 알림 표시
self.addEventListener('push', (event) => {
  console.log('[Service Worker] 푸시 알림 수신:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const notificationOptions = {
      body: data.message,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        messageId: data.messageId,
        timestamp: data.timestamp
      },
      actions: [
        {
          action: 'view',
          title: '보기'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, notificationOptions)
    );
  }
});

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 알림 클릭:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  notification.close();
  
  if (action === 'close') {
    return;
  }
  
  // 클라이언트 창 열기 또는 포커스 이동
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // 이미 열린 창이 있는지 확인
      for (const client of clientList) {
        if (client.url.includes(data.url) && 'focus' in client) {
          // 메시지 ID 전달하여 해당 메시지로 스크롤
          return client.postMessage({
            action: 'FOCUS_MESSAGE',
            messageId: data.messageId
          }).then(() => client.focus());
        }
      }
      
      // 열린 창이 없으면 새 창 열기
      if (clients.openWindow) {
        const urlToOpen = data.url || '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 푸시 구독 이벤트 핸들러
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] 푸시 구독 변경:', event);
  
  // 재구독 로직 구현
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // 서버에 업데이트된 구독 정보 전송
        return updateSubscriptionOnServer(subscription);
      })
  );
});

// 동기화 이벤트 핸들러 - 오프라인 메시지 동기화
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] 백그라운드 동기화:', event);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

/**
 * 캐시 우선 전략 (Cache First)
 * 캐시에서 먼저 조회하고, 없으면 네트워크 요청
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // 네트워크 오류 및 오프라인 상태 처리
    console.log('[Service Worker] 캐시 및 네트워크 요청 실패:', error);
    return caches.match('/assets/images/offline.svg');
  }
}

/**
 * 네트워크 우선 전략 (Network First)
 * 네트워크 요청을 먼저 시도하고, 실패하면 캐시에서 조회
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request.clone());
    
    // POST 요청이 아닌 경우만 캐싱
    if (request.method === 'GET' || request.method === 'HEAD') {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 네트워크 요청 실패, 캐시 확인 중:', error);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // API 오류 응답 반환
    return new Response(
      JSON.stringify({ 
        error: 'Network request failed', 
        offline: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * 네트워크 우선 + 동적 캐싱 전략
 * 네트워크 요청을 먼저 시도하고, 성공하면 동적 캐시에 저장
 * 실패하면 캐시에서 조회
 */
async function networkFirstWithCacheStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 성공적인 GET 요청만 캐싱
    if (request.method === 'GET' && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 네트워크 요청 실패, 캐시 확인 중:', error);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // HTML 요청인 경우 오프라인 페이지 반환
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html').then(response => {
        return response || new Response(
          '<html><body><h1>오프라인 상태입니다</h1><p>인터넷 연결을 확인해주세요.</p></body></html>',
          { 
            status: 503, 
            headers: { 'Content-Type': 'text/html' } 
          }
        );
      });
    }
    
    // 기타 요청은 오류 응답 반환
    return new Response(
      'Network error occurred',
      { status: 503, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

/**
 * 메시지 캐싱 함수
 * @param {Array} messages - 캐싱할 메시지 배열
 */
async function cacheMessages(messages) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return;
  }
  
  try {
    // 메시지 데이터를 IndexedDB에 저장
    // (이 간단한 구현에서는 캐시 스토리지만 사용)
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    const messagesResponse = new Response(
      JSON.stringify({ messages, cached: true, timestamp: Date.now() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    await cache.put('/cached-messages', messagesResponse);
    
    console.log('[Service Worker] 메시지 캐싱 완료:', messages.length);
  } catch (error) {
    console.error('[Service Worker] 메시지 캐싱 실패:', error);
  }
}

/**
 * 사용자 정보 캐싱 함수
 * @param {Object} userInfo - 캐싱할 사용자 정보
 */
async function cacheUserInfo(userInfo) {
  if (!userInfo) {
    return;
  }
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    const userInfoResponse = new Response(
      JSON.stringify({ userInfo, cached: true, timestamp: Date.now() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    await cache.put('/cached-user-info', userInfoResponse);
    
    console.log('[Service Worker] 사용자 정보 캐싱 완료');
  } catch (error) {
    console.error('[Service Worker] 사용자 정보 캐싱 실패:', error);
  }
}

/**
 * 동적 캐시 초기화 함수
 */
async function clearDynamicCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const keys = await cache.keys();
    
    for (const key of keys) {
      await cache.delete(key);
    }
    
    console.log('[Service Worker] 동적 캐시 초기화 완료');
  } catch (error) {
    console.error('[Service Worker] 동적 캐시 초기화 실패:', error);
  }
}

/**
 * 오프라인 메시지 동기화 함수
 */
async function syncOfflineMessages() {
  try {
    // IndexedDB에서 오프라인 메시지 가져오기
    // (이 간단한 구현에서는 생략)
    
    console.log('[Service Worker] 오프라인 메시지 동기화 시작');
    
    // 실제 구현에서는 저장된 오프라인 메시지를 서버에 전송
    
    console.log('[Service Worker] 오프라인 메시지 동기화 완료');
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] 오프라인 메시지 동기화 실패:', error);
    return Promise.reject(error);
  }
}

/**
 * 서버에 구독 정보 업데이트 함수
 * @param {PushSubscription} subscription - 푸시 구독 정보
 */
async function updateSubscriptionOnServer(subscription) {
  // 실제 구현에서는 서버에 구독 정보 전송
  console.log('[Service Worker] 서버에 구독 정보 업데이트:', subscription);
  return Promise.resolve();
}
