/**
 * 오프라인 모드 서비스
 * 네트워크 연결 감지 및 오프라인 모드에서의 메시지 저장과 동기화를 담당합니다.
 */

class OfflineService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineMessages = [];
        this.onConnectionStatusChange = null;
        
        // 네트워크 상태 변경 이벤트 리스너 등록
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    /**
     * 초기화
     */
    initialize() {
        this.loadOfflineMessages();
    }

    /**
     * 온라인 상태로 전환 시 처리
     * @private
     */
    handleOnline() {
        console.log('Network connection restored');
        this.isOnline = true;
        
        // 오프라인 메시지 동기화
        this.syncOfflineMessages();
        
        // 콜백 호출
        if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange(true);
        }
    }

    /**
     * 오프라인 상태로 전환 시 처리
     * @private
     */
    handleOffline() {
        console.log('Network connection lost');
        this.isOnline = false;
        
        // 콜백 호출
        if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange(false);
        }
    }

    /**
     * 현재 연결 상태 확인
     * @returns {boolean} 온라인 여부
     */
    isConnected() {
        return this.isOnline;
    }

    /**
     * 연결 상태 변경 콜백 설정
     * @param {Function} callback 연결 상태 변경 시 호출될 콜백 함수
     */
    setConnectionStatusCallback(callback) {
        this.onConnectionStatusChange = callback;
    }

    /**
     * 오프라인 메시지 저장
     * @param {Object} message 저장할 메시지
     */
    saveOfflineMessage(message) {
        this.offlineMessages.push({
            ...message,
            pendingId: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        });
        
        this.saveOfflineMessagesToLocalStorage();
    }

    /**
     * 오프라인 메시지를 LocalStorage에 저장
     * @private
     */
    saveOfflineMessagesToLocalStorage() {
        try {
            localStorage.setItem('offlineMessages', JSON.stringify(this.offlineMessages));
        } catch (error) {
            console.error('Error saving offline messages to localStorage:', error);
        }
    }

    /**
     * LocalStorage에서 오프라인 메시지 불러오기
     * @private
     */
    loadOfflineMessages() {
        try {
            const savedMessages = localStorage.getItem('offlineMessages');
            if (savedMessages) {
                this.offlineMessages = JSON.parse(savedMessages);
            }
        } catch (error) {
            console.error('Error loading offline messages from localStorage:', error);
            this.offlineMessages = [];
        }
    }

    /**
     * 오프라인 메시지 동기화
     * @returns {Promise<{success: number, failed: number}>} 동기화 결과
     */
    async syncOfflineMessages() {
        if (!this.isOnline || this.offlineMessages.length === 0) {
            return { success: 0, failed: 0 };
        }
        
        let successCount = 0;
        let failedCount = 0;
        
        const currentUser = userService.getCurrentUser();
        if (!currentUser) {
            return { success: 0, failed: this.offlineMessages.length };
        }
        
        // 각 오프라인 메시지를 순차적으로 전송
        for (let i = 0; i < this.offlineMessages.length; i++) {
            const offlineMessage = this.offlineMessages[i];
            
            try {
                // 메시지 전송
                const result = await dbService.sendMessage(
                    offlineMessage.room_id,
                    currentUser.id,
                    currentUser.username,
                    offlineMessage.content,
                    offlineMessage.language,
                    offlineMessage.reply_to,
                    offlineMessage.is_announcement
                );
                
                if (result.success) {
                    successCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error('Error syncing offline message:', error);
                failedCount++;
            }
        }
        
        // 성공적으로 동기화된 메시지 제거
        if (successCount > 0) {
            this.offlineMessages = this.offlineMessages.slice(successCount);
            this.saveOfflineMessagesToLocalStorage();
        }
        
        return { success: successCount, failed: failedCount };
    }

    /**
     * 대기 중인 오프라인 메시지 가져오기
     * @returns {Array} 오프라인 메시지 목록
     */
    getPendingMessages() {
        return this.offlineMessages;
    }

    /**
     * 대기 중인 오프라인 메시지 수 가져오기
     * @returns {number} 오프라인 메시지 수
     */
    getPendingMessageCount() {
        return this.offlineMessages.length;
    }

    /**
     * 대기 중인 오프라인 메시지 초기화
     */
    clearPendingMessages() {
        this.offlineMessages = [];
        this.saveOfflineMessagesToLocalStorage();
    }
}

// 싱글톤 인스턴스 생성
const offlineService = new OfflineService();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    offlineService.initialize();
});
