/**
 * PWA 관리 모듈
 * 
 * Progressive Web App 기능을 구현하고 관리합니다.
 * 서비스 워커 통신, 오프라인 지원, 설치 프로모션, 푸시 알림 등을 처리합니다.
 */

import CONFIG from './config.js';

class PWAManager {
    constructor() {
        // 상태 변수
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.serviceWorkerRegistration = null;
        this.pushSubscription = null;
        this.offlineMessageQueue = [];
        this.notificationPermission = null;
        this.installPromptShown = false;
        
        // DOM 요소 참조
        this.installPrompt = null;
        this.installButton = null;
        this.closePromptButton = null;
        this.notificationPrompt = null;
        this.enableNotificationsButton = null;
        this.closeNotificationPromptButton = null;
        this.networkStatus = null;
        this.offlineMessageAlert = null;
        this.offlineQueueAlert = null;
        this.offlineQueueCount = null;
    }

    /**
     * PWA 관리자 초기화
     */
    init() {
        // DOM 요소 참조 설정
        this.installPrompt = document.getElementById('installPrompt');
        this.installButton = document.getElementById('installButton');
        this.closePromptButton = document.getElementById('closePromptButton');
        this.notificationPrompt = document.getElementById('notificationPrompt');
        this.enableNotificationsButton = document.getElementById('enableNotificationsButton');
        this.closeNotificationPromptButton = document.getElementById('closeNotificationPromptButton');
        this.networkStatus = document.getElementById('networkStatus');
        this.offlineMessageAlert = document.getElementById('offlineMessageAlert');
        this.offlineQueueAlert = document.getElementById('offlineQueueAlert');
        this.offlineQueueCount = document.getElementById('offlineQueueCount');
        
        // 설치 상태 확인
        this.checkInstallState();
        
        // 알림 권한 확인
        this.checkNotificationPermission();
        
        // 네트워크 상태 모니터링
        this.setupNetworkMonitoring();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 서비스 워커 통신 설정
        this.setupServiceWorkerCommunication();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('PWAManager initialized');
        }
        
        // 설치 프로모션을 즉시 표시하지 않고, 첫 상호작용 이후에 표시
        this.setupInstallPrompt();
        
        return this;
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 설치 버튼 클릭 이벤트
        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.installApp());
        }
        
        // 설치 프로모션 닫기 버튼 이벤트
        if (this.closePromptButton) {
            this.closePromptButton.addEventListener('click', () => this.hideInstallPrompt());
        }
        
        // 알림 활성화 버튼 이벤트
        if (this.enableNotificationsButton) {
            this.enableNotificationsButton.addEventListener('click', () => this.requestNotificationPermission());
        }
        
        // 알림 프로모션 닫기 버튼 이벤트
        if (this.closeNotificationPromptButton) {
            this.closeNotificationPromptButton.addEventListener('click', () => this.hideNotificationPrompt());
        }
        
        // 오프라인 메시지 큐 표시 클릭 이벤트
        if (this.offlineQueueAlert) {
            this.offlineQueueAlert.addEventListener('click', () => this.syncOfflineMessages());
        }
        
        // 앱 설치 감지 이벤트
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallPrompt();
            
            // 설치 상태 저장
            localStorage.setItem('pwa-installed', 'true');
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('PWA was installed');
            }
        });
    }

    /**
     * 설치 프로모션 설정
     */
    setupInstallPrompt() {
        // beforeinstallprompt 이벤트 리스너 설정
        window.addEventListener('beforeinstallprompt', (e) => {
            // 브라우저의 기본 설치 프롬프트 방지
            e.preventDefault();
            
            // 설치 프롬프트 저장
            this.deferredPrompt = e;
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('PWA install prompt available');
            }
            
            // 설치된 상태가 아니고, 이전에 설치 프롬프트를 닫은 적이 없으면 설치 프롬프트 표시
            // 단, 즉시 표시하지 않고 첫 상호작용 후 표시
            if (!this.isInstalled && !this.installPromptShown) {
                setTimeout(() => {
                    this.showInstallPrompt();
                }, 5000); // 5초 후 표시
            }
        });
    }

    /**
     * PWA 설치 상태 확인
     */
    checkInstallState() {
        // 디스플레이 모드 확인 (standalone이면 설치된 상태)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('PWA is running in standalone mode (installed)');
            }
            return;
        }
        
        // iOS에서는 애플 모바일 웹앱 상태 확인
        if (navigator.standalone) {
            this.isInstalled = true;
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('PWA is running in standalone mode on iOS (installed)');
            }
            return;
        }
        
        // 로컬 스토리지에서 설치 상태 확인
        if (localStorage.getItem('pwa-installed') === 'true') {
            this.isInstalled = true;
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('PWA was previously installed');
            }
            return;
        }
        
        this.isInstalled = false;
    }

    /**
     * 설치 프롬프트 표시
     */
    showInstallPrompt() {
        if (!this.deferredPrompt || this.isInstalled) {
            return;
        }
        
        // 설치 프롬프트 표시
        if (this.installPrompt) {
            this.installPrompt.classList.add('show');
            this.installPromptShown = true;
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('PWA install prompt shown');
            }
        }
    }

    /**
     * 설치 프롬프트 숨기기
     */
    hideInstallPrompt() {
        if (this.installPrompt) {
            this.installPrompt.classList.remove('show');
            
            // 24시간 동안 다시 표시하지 않음
            localStorage.setItem('install-prompt-dismissed', Date.now().toString());
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('PWA install prompt hidden');
            }
        }
    }

    /**
     * PWA 설치
     */
    async installApp() {
        if (!this.deferredPrompt) {
            return;
        }
        
        try {
            // 사용자에게 설치 프롬프트 표시
            this.deferredPrompt.prompt();
            
            // 사용자 응답 대기
            const choiceResult = await this.deferredPrompt.userChoice;
            
            if (choiceResult.outcome === 'accepted') {
                this.isInstalled = true;
                
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log('User accepted the PWA installation');
                }
            } else {
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log('User dismissed the PWA installation');
                }
            }
        } catch (error) {
            console.error('Error installing PWA:', error);
            this.showToast('앱 설치 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        } finally {
            // 프롬프트 참조 정리
            this.deferredPrompt = null;
            
            // 설치 프롬프트 숨기기
            this.hideInstallPrompt();
        }
    }

    /**
     * 알림 권한 확인
     */
    checkNotificationPermission() {
        if (!('Notification' in window)) {
            this.notificationPermission = 'unsupported';
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Notifications not supported in this browser');
            }
            return;
        }
        
        this.notificationPermission = Notification.permission;
        
        // 알림이 이미 허용된 경우 푸시 구독 확인
        if (this.notificationPermission === 'granted') {
            this.checkPushSubscription();
        }
        
        // 알림 권한이 아직 결정되지 않은 경우 (초기 상태)
        if (this.notificationPermission === 'default') {
            // 이전에 알림 프롬프트를 표시한 적이 없으면 5초 후 표시
            const lastPrompt = localStorage.getItem('notification-prompt-shown');
            if (!lastPrompt) {
                setTimeout(() => {
                    this.showNotificationPrompt();
                }, 10000); // 10초 후 표시
            }
        }
    }

    /**
     * 알림 프롬프트 표시
     */
    showNotificationPrompt() {
        if (this.notificationPermission !== 'default' || !this.notificationPrompt) {
            return;
        }
        
        // 알림 프롬프트 표시
        this.notificationPrompt.classList.add('show');
        
        // 프롬프트를 표시한 시간 저장
        localStorage.setItem('notification-prompt-shown', Date.now().toString());
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Notification permission prompt shown');
        }
    }

    /**
     * 알림 프롬프트 숨기기
     */
    hideNotificationPrompt() {
        if (this.notificationPrompt) {
            this.notificationPrompt.classList.remove('show');
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Notification permission prompt hidden');
            }
        }
    }

    /**
     * 알림 권한 요청
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            this.showToast('이 브라우저에서는 알림을 지원하지 않습니다.', 'error');
            return;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            // 알림 프롬프트 숨기기
            this.hideNotificationPrompt();
            
            if (permission === 'granted') {
                this.showToast('알림이 활성화되었습니다!', 'success');
                
                // 푸시 구독 설정
                await this.subscribeToPushNotifications();
            } else {
                this.showToast('알림 권한이 거부되었습니다. 설정에서 변경할 수 있습니다.', 'warning');
            }
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log(`Notification permission: ${permission}`);
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            this.showToast('알림 권한 요청 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 푸시 구독 확인
     */
    async checkPushSubscription() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Push notifications not supported');
            }
            return;
        }
        
        try {
            // 서비스 워커 등록 가져오기
            const registration = await navigator.serviceWorker.ready;
            this.serviceWorkerRegistration = registration;
            
            // 현재 구독 정보 가져오기
            const subscription = await registration.pushManager.getSubscription();
            this.pushSubscription = subscription;
            
            if (subscription) {
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log('User is already subscribed to push notifications');
                }
            } else {
                if (this.notificationPermission === 'granted') {
                    // 알림 권한이 있지만 아직 푸시 구독이 없는 경우 구독 설정
                    await this.subscribeToPushNotifications();
                }
            }
        } catch (error) {
            console.error('Error checking push subscription:', error);
        }
    }

    /**
     * 푸시 알림 구독
     */
    async subscribeToPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }
        
        if (this.notificationPermission !== 'granted') {
            return;
        }
        
        try {
            // 서비스 워커 등록 가져오기
            const registration = await navigator.serviceWorker.ready;
            this.serviceWorkerRegistration = registration;
            
            // applicationServerKey는 VAPID 키로, 서버에서 제공해야 함
            // 지금은 임시로 빈 Uint8Array 사용
            const applicationServerKey = new Uint8Array([]);
            
            // 푸시 서비스 구독
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            this.pushSubscription = subscription;
            
            // 서버에 구독 정보 전송 (실제 구현 필요)
            // await this.sendSubscriptionToServer(subscription);
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('User subscribed to push notifications:', subscription);
            }
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
        }
    }

    /**
     * 네트워크 상태 모니터링 설정
     */
    setupNetworkMonitoring() {
        // 초기 네트워크 상태 확인
        this.updateNetworkStatus();
        
        // 네트워크 상태 변화 감지
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    /**
     * 네트워크 상태 업데이트
     */
    updateNetworkStatus() {
        const isOnline = navigator.onLine;
        
        if (this.networkStatus) {
            if (isOnline) {
                this.networkStatus.classList.add('online');
                this.networkStatus.classList.remove('offline');
                
                // 5초 후 알림 숨김
                setTimeout(() => {
                    this.networkStatus.classList.remove('online');
                }, 5000);
            } else {
                this.networkStatus.classList.add('offline');
                this.networkStatus.classList.remove('online');
            }
        }
        
        // 오프라인 메시지 알림 표시/숨김
        if (this.offlineMessageAlert) {
            this.offlineMessageAlert.style.display = isOnline ? 'none' : 'flex';
        }
        
        // 오프라인 상태에서 추가된 메시지가 있으면 큐 알림 표시
        this.updateOfflineQueueIndicator();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log(`Network status: ${isOnline ? 'online' : 'offline'}`);
        }
    }

    /**
     * 온라인 상태 처리
     */
    handleOnline() {
        this.updateNetworkStatus();
        
        // 오프라인 메시지 동기화
        this.syncOfflineMessages();
        
        // 서비스 워커에 온라인 상태 알림
        this.sendMessageToServiceWorker({
            action: 'ONLINE_STATUS',
            online: true
        });
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Device is now online');
        }
    }

    /**
     * 오프라인 상태 처리
     */
    handleOffline() {
        this.updateNetworkStatus();
        
        // 서비스 워커에 오프라인 상태 알림
        this.sendMessageToServiceWorker({
            action: 'ONLINE_STATUS',
            online: false
        });
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Device is now offline');
        }
    }

    /**
     * 서비스 워커 통신 설정
     */
    setupServiceWorkerCommunication() {
        if (!('serviceWorker' in navigator)) {
            return;
        }
        
        // 서비스 워커 메시지 수신
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event.data);
        });
        
        // 서비스 워커 준비 완료 시 초기 메시지 전송
        navigator.serviceWorker.ready.then((registration) => {
            this.serviceWorkerRegistration = registration;
            
            // 캐시된 메시지 요청
            this.sendMessageToServiceWorker({
                action: 'GET_CACHED_MESSAGES'
            });
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Service Worker is ready');
            }
        });
    }

    /**
     * 서비스 워커에 메시지 전송
     * @param {Object} message - 전송할 메시지
     */
    async sendMessageToServiceWorker(message) {
        if (!('serviceWorker' in navigator)) {
            return;
        }
        
        // 모든 활성 서비스 워커에 메시지 전송
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.active) {
            registration.active.postMessage(message);
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Message sent to Service Worker:', message);
            }
        }
    }

    /**
     * 서비스 워커 메시지 처리
     * @param {Object} message - 수신된 메시지
     */
    handleServiceWorkerMessage(message) {
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Message received from Service Worker:', message);
        }
        
        // 메시지 유형에 따라 처리
        switch (message.action) {
            case 'CACHED_MESSAGES':
                // 캐시된 메시지 처리
                if (message.messages && message.messages.length > 0) {
                    // 채팅 관리자에 메시지 전달 (구현 필요)
                    // chatManager.addCachedMessages(message.messages);
                }
                break;
                
            case 'OFFLINE_MESSAGES_SYNCED':
                // 오프라인 메시지 동기화 완료 처리
                this.clearOfflineMessageQueue();
                this.showToast('오프라인 메시지가 성공적으로 동기화되었습니다.', 'success');
                break;
                
            case 'SYNC_ERROR':
                // 동기화 오류 처리
                this.showToast('메시지 동기화 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
                break;
                
            case 'FOCUS_MESSAGE':
                // 특정 메시지로 포커스 이동 (푸시 알림에서 호출)
                if (message.messageId) {
                    // 채팅 관리자에 포커스 요청 전달 (구현 필요)
                    // chatManager.focusMessage(message.messageId);
                }
                break;
        }
    }

    /**
     * 오프라인 메시지 추가
     * @param {Object} message - 오프라인 상태에서 전송할 메시지
     */
    addOfflineMessage(message) {
        // 메시지에 타임스탬프와 ID 추가
        const offlineMessage = {
            ...message,
            timestamp: Date.now(),
            id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            offline: true
        };
        
        // 오프라인 메시지 큐에 추가
        this.offlineMessageQueue.push(offlineMessage);
        
        // 로컬 스토리지에 저장
        this.saveOfflineMessageQueue();
        
        // 오프라인 큐 표시 업데이트
        this.updateOfflineQueueIndicator();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Message added to offline queue:', offlineMessage);
        }
        
        return offlineMessage;
    }

    /**
     * 오프라인 메시지 큐 저장
     */
    saveOfflineMessageQueue() {
        localStorage.setItem('offline-message-queue', JSON.stringify(this.offlineMessageQueue));
    }

    /**
     * 오프라인 메시지 큐 로드
     */
    loadOfflineMessageQueue() {
        const queue = localStorage.getItem('offline-message-queue');
        
        if (queue) {
            try {
                this.offlineMessageQueue = JSON.parse(queue);
            } catch (error) {
                console.error('Error parsing offline message queue:', error);
                this.offlineMessageQueue = [];
            }
        }
        
        this.updateOfflineQueueIndicator();
    }

    /**
     * 오프라인 메시지 큐 표시 업데이트
     */
    updateOfflineQueueIndicator() {
        // 오프라인 메시지가 있고 현재 온라인 상태면 큐 알림 표시
        const hasOfflineMessages = this.offlineMessageQueue.length > 0;
        const isOnline = navigator.onLine;
        
        if (this.offlineQueueAlert) {
            if (hasOfflineMessages && isOnline) {
                this.offlineQueueAlert.classList.add('show');
                
                if (this.offlineQueueCount) {
                    this.offlineQueueCount.textContent = `${this.offlineMessageQueue.length}개의 메시지가 전송 대기 중입니다`;
                }
            } else {
                this.offlineQueueAlert.classList.remove('show');
            }
        }
    }

    /**
     * 오프라인 메시지 동기화
     */
    async syncOfflineMessages() {
        if (this.offlineMessageQueue.length === 0 || !navigator.onLine) {
            return;
        }
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Syncing offline messages:', this.offlineMessageQueue);
        }
        
        // 서비스 워커에 동기화 요청
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-messages');
                
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log('Background sync registered for offline messages');
                }
            } catch (error) {
                console.error('Error registering background sync:', error);
                
                // 백그라운드 동기화를 지원하지 않는 경우 수동으로 동기화
                this.manualSyncOfflineMessages();
            }
        } else {
            // 백그라운드 동기화를 지원하지 않는 경우 수동으로 동기화
            this.manualSyncOfflineMessages();
        }
    }

    /**
     * 수동 오프라인 메시지 동기화
     */
    async manualSyncOfflineMessages() {
        if (this.offlineMessageQueue.length === 0 || !navigator.onLine) {
            return;
        }
        
        // 여기서는 직접 메시지를 서버에 전송하는 로직을 구현해야 함
        // 지금은 1초 지연 후 성공으로 가정
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 동기화 성공으로 가정하고 큐 초기화
        this.clearOfflineMessageQueue();
        this.showToast('오프라인 메시지가 성공적으로 동기화되었습니다.', 'success');
    }

    /**
     * 오프라인 메시지 큐 초기화
     */
    clearOfflineMessageQueue() {
        this.offlineMessageQueue = [];
        localStorage.removeItem('offline-message-queue');
        this.updateOfflineQueueIndicator();
    }

    /**
     * 토스트 메시지 표시
     * @param {string} message - 메시지 내용
     * @param {string} type - 메시지 유형 (success, error, warning, info)
     */
    showToast(message, type = 'info') {
        // 이미 표시된 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 토스트 요소 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 토스트 표시 애니메이션
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 3초 후 토스트 숨김
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            
            // 애니메이션 완료 후 요소 제거
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 모바일 네비게이션 업데이트
     * @param {string} activeTabId - 활성화할 탭 ID
     */
    updateMobileNavigation(activeTabId) {
        const allTabs = document.querySelectorAll('.bottom-nav-item');
        
        // 모든 탭에서 활성 클래스 제거
        allTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 지정된 탭에 활성 클래스 추가
        const activeTab = document.getElementById(activeTabId);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }
}

// PWA 관리자 인스턴스 생성 및 초기화
const pwaManager = new PWAManager().init();

// 전역 스코프로 내보내기
export default pwaManager;
