/**
 * 오프라인 모드 지원 서비스
 * 네트워크 연결이 끊겼을 때 오프라인 기능 및 메시지 동기화를 담당합니다.
 */

class OfflineService {
    constructor() {
        this.isOnline = true;
        this.pendingMessages = [];
        this.onConnectionStatusChange = null;
    }

    /**
     * 오프라인 서비스 초기화
     * @returns {boolean} 초기화 성공 여부
     */
    initialize() {
        try {
            console.log('Initializing offline service...');
            
            // 네트워크 상태 이벤트 리스너 등록
            window.addEventListener('online', this.handleOnline.bind(this));
            window.addEventListener('offline', this.handleOffline.bind(this));
            
            // 초기 상태 설정
            this.isOnline = navigator.onLine;
            
            // 이전에 저장된 오프라인 메시지 로드
            this.loadPendingMessages();
            
            console.log('Offline service initialized, online status:', this.isOnline);
            return true;
        } catch (error) {
            console.error('Error initializing offline service:', error);
            return false;
        }
    }

    /**
     * 온라인 상태 변경 처리
     * @private
     */
    handleOnline() {
        console.log('Network status: online');
        this.isOnline = true;
        
        // 연결 상태 콜백 호출
        if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange(true);
        }
        
        // 오프라인 메시지 동기화
        if (this.pendingMessages.length > 0) {
            setTimeout(() => {
                this.syncOfflineMessages();
            }, 2000); // 잠시 대기 후 동기화 시작
        }
    }

    /**
     * 오프라인 상태 변경 처리
     * @private
     */
    handleOffline() {
        console.log('Network status: offline');
        this.isOnline = false;
        
        // 연결 상태 콜백 호출
        if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange(false);
        }
    }

    /**
     * 연결 상태 확인
     * @returns {boolean} 온라인 상태
     */
    isConnected() {
        return this.isOnline;
    }

    /**
     * 연결 상태 변경 콜백 설정
     * @param {Function} callback 콜백 함수
     */
    setConnectionStatusCallback(callback) {
        this.onConnectionStatusChange = callback;
    }

    /**
     * 오프라인 메시지 저장
     * @param {Object} message 메시지 객체
     */
    saveOfflineMessage(message) {
        console.log('Saving offline message:', message);
        
        // 메시지에 타임스탬프 추가
        const messageWithTimestamp = {
            ...message,
            offline_timestamp: new Date().toISOString()
        };
        
        // 메시지 추가
        this.pendingMessages.push(messageWithTimestamp);
        
        // 로컬 스토리지에 저장
        this.savePendingMessages();
    }

    /**
     * 로컬 스토리지에 대기 중인 메시지 저장
     * @private
     */
    savePendingMessages() {
        try {
            localStorage.setItem('pendingMessages', JSON.stringify(this.pendingMessages));
        } catch (error) {
            console.error('Error saving pending messages:', error);
        }
    }

    /**
     * 로컬 스토리지에서 대기 중인 메시지 로드
     * @private
     */
    loadPendingMessages() {
        try {
            const pendingData = localStorage.getItem('pendingMessages');
            
            if (pendingData) {
                this.pendingMessages = JSON.parse(pendingData);
                console.log('Loaded pending messages:', this.pendingMessages.length);
            }
        } catch (error) {
            console.error('Error loading pending messages:', error);
            this.pendingMessages = [];
        }
    }

    /**
     * 대기 중인 메시지 수 반환
     * @returns {number} 메시지 수
     */
    getPendingMessageCount() {
        return this.pendingMessages.length;
    }

    /**
     * 오프라인 메시지 동기화
     * @returns {Promise<{success: number, failed: number}>} 동기화 결과
     */
    async syncOfflineMessages() {
        if (!this.isOnline || this.pendingMessages.length === 0) {
            return { success: 0, failed: 0 };
        }
        
        console.log('Syncing offline messages, count:', this.pendingMessages.length);
        
        let success = 0;
        let failed = 0;
        const failedMessages = [];
        
        // 모든 메시지 동기화 시도
        for (const message of this.pendingMessages) {
            try {
                // 메시지 전송
                const result = await dbService.sendMessage(
                    message.room_id,
                    message.user_id,
                    message.username,
                    message.content,
                    message.language,
                    message.reply_to,
                    message.is_announcement
                );
                
                if (result.success) {
                    success++;
                } else {
                    failed++;
                    failedMessages.push(message);
                }
            } catch (error) {
                console.error('Error syncing offline message:', error);
                failed++;
                failedMessages.push(message);
            }
        }
        
        // 실패한 메시지만 저장
        this.pendingMessages = failedMessages;
        this.savePendingMessages();
        
        console.log('Sync completed. Success:', success, 'Failed:', failed);
        return { success, failed };
    }

    /**
     * 모든 대기 중인 메시지 삭제
     */
    clearPendingMessages() {
        this.pendingMessages = [];
        
        try {
            localStorage.removeItem('pendingMessages');
        } catch (error) {
            console.error('Error clearing pending messages:', error);
        }
    }

    /**
     * 특정 채팅방의 대기 중인 메시지 삭제
     * @param {string} roomId 채팅방 ID
     */
    clearPendingMessagesForRoom(roomId) {
        this.pendingMessages = this.pendingMessages.filter(
            message => message.room_id !== roomId
        );
        
        this.savePendingMessages();
    }

    /**
     * 서비스 워커를 사용하여 푸시 알림 등록
     * @returns {Promise<boolean>} 등록 성공 여부
     */
    async registerForPushNotifications() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return false;
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    'YOUR_VAPID_PUBLIC_KEY' // 실제로는 적절한 VAPID 키가 필요
                )
            });
            
            console.log('Push notification subscription:', subscription);
            
            // 서버에 구독 정보 전송 (이 예제에서는 생략)
            
            return true;
        } catch (error) {
            console.error('Error registering for push notifications:', error);
            return false;
        }
    }

    /**
     * URL-safe base64 문자열을 Uint8Array로 변환
     * @param {string} base64String URL-safe base64 문자열
     * @returns {Uint8Array} 변환된 바이트 배열
     * @private
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
            
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
}

// 싱글톤 인스턴스 생성
const offlineService = new OfflineService();
