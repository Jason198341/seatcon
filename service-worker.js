/**
 * Service Worker for Conference Chat application
 * Provides offline capability and caching
 */

const CACHE_NAME = 'conference-chat-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/chat.js',
    '/js/config.js',
    '/js/supabase-client.js',
    '/js/ui.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing Service Worker');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting on install');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating Service Worker');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Claiming clients for version', CACHE_NAME);
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
    // Skip Supabase API requests - we don't want to cache those
    if (event.request.url.includes('supabase.co')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return response;
                }
                
                console.log('[Service Worker] Fetching resource:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Cache the fetched response
                        if (response && response.status === 200 && 
                            (response.type === 'basic' || event.request.url.includes('cdn.jsdelivr.net'))) {
                            let responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return response;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Fetch failed; returning offline page instead.', error);
                        // You could return a custom offline page/message here
                    });
            })
    );
});

// Handle push notifications (for future enhancement)
self.addEventListener('push', event => {
    console.log('[Service Worker] Push received:', event);
    
    let notification = {
        title: 'Conference Chat',
        body: 'New message received!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        data: {
            url: self.location.origin
        }
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notification = {
                ...notification,
                ...data
            };
        } catch (e) {
            console.error('[Service Worker] Error parsing push data:', e);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notification.title, notification)
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click received:', event);
    
    event.notification.close();
    
    const urlToOpen = event.notification.data && 
                      event.notification.data.url ? 
                      event.notification.data.url : self.location.origin;
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(windowClients => {
                // Check if there is already a window/tab open with the target URL
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    // If so, focus on that window
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
