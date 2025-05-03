/**
 * 메시지 상태 관리 모듈
 * 
 * 메시지의 상태(전송 중, 전송 완료, 실패 등)를 관리하고 시각적으로 표시합니다.
 * 임시 메시지와 실제 메시지 간의 매핑을 처리합니다.
 */
class MessageStatusManager {
    constructor() {
        // 메시지 상태 맵 (임시 ID -> 상태 객체)
        this.messageStatusMap = new Map();
        
        // 임시 ID와 실제 ID 매핑
        this.tempToRealIdMap = new Map();
        
        // 메시지 상태 타입
        this.STATUS = {
            SENDING: 'sending',     // 전송 중
            SENT: 'sent',           // 서버로 전송됨
            DELIVERED: 'delivered', // 상대방에게 전달됨
            READ: 'read',           // 읽음
            FAILED: 'failed'        // 전송 실패
        };
        
        // 메시지 재시도 큐
        this.retryQueue = [];
        
        // 재시도 타이머
        this.retryTimer = null;
        
        // 초기화
        this.init();
    }
    
    /**
     * 메시지 상태 관리자 초기화
     */
    init() {
        console.log('메시지 상태 관리자 초기화');
        
        // 네트워크 모니터 연결 (있을 경우에만)
        if (window.networkMonitor) {
            // 연결 상태 변경 이벤트 리스너
            networkMonitor.on('connectionChange', (data) => {
                // 온라인 상태가 되면 메시지 재전송 시도
                if (data.isOnline) {
                    this.processRetryQueue();
                }
            });
        }
        
        // 주기적인 재시도 타이머 설정
        this.startRetryTimer();
    }
    
    /**
     * 새 메시지 등록
     * @param {string} tempId - 임시 메시지 ID
     * @param {Object} message - 메시지 객체
     * @returns {Object} - 상태가 추가된 메시지 객체
     */
    registerMessage(tempId, message) {
        // 이미 등록된 메시지인 경우
        if (this.messageStatusMap.has(tempId)) {
            return message;
        }
        
        // 새 상태 객체 생성
        const statusObject = {
            id: tempId,
            status: this.STATUS.SENDING,
            timestamp: Date.now(),
            retryCount: 0,
            message: message
        };
        
        // 상태 맵에 추가
        this.messageStatusMap.set(tempId, statusObject);
        
        // 상태 정보가 포함된 메시지 반환
        return {
            ...message,
            _status: this.STATUS.SENDING,
            _tempId: tempId
        };
    }
    
    /**
     * 메시지 상태 업데이트
     * @param {string} id - 메시지 ID (임시 또는 실제)
     * @param {string} status - 새 상태
     * @param {Object} data - 추가 데이터
     * @returns {Object|null} - 업데이트된 상태 객체
     */
    updateMessageStatus(id, status, data = {}) {
        // ID 확인 (임시 ID인 경우 매핑 확인)
        const messageId = id.startsWith('temp-') ? id : this.findTempIdByRealId(id);
        
        if (!messageId || !this.messageStatusMap.has(messageId)) {
            console.warn(`메시지 ID ${id}를 찾을 수 없습니다.`);
            return null;
        }
        
        // 상태 객체 가져오기
        const statusObject = this.messageStatusMap.get(messageId);
        
        // 상태 업데이트
        statusObject.status = status;
        statusObject.lastUpdated = Date.now();
        
        // 추가 데이터 병합
        Object.assign(statusObject, data);
        
        // 상태 맵 업데이트
        this.messageStatusMap.set(messageId, statusObject);
        
        // UI 업데이트
        this.updateMessageUI(messageId, status, data);
        
        // 실패 상태인 경우 재시도 큐에 추가
        if (status === this.STATUS.FAILED) {
            this.addToRetryQueue(messageId);
        }
        
        // 전송 성공 시 재시도 큐에서 제거
        if (status === this.STATUS.SENT || status === this.STATUS.DELIVERED) {
            this.removeFromRetryQueue(messageId);
        }
        
        console.log(`메시지 상태 업데이트: ${messageId} -> ${status}`);
        
        return statusObject;
    }
    
    /**
     * 임시 ID와 실제 ID 매핑
     * @param {string} tempId - 임시 메시지 ID
     * @param {string} realId - 실제 메시지 ID
     */
    mapMessageIds(tempId, realId) {
        if (!tempId || !realId) return;
        
        // 매핑 저장
        this.tempToRealIdMap.set(tempId, realId);
        this.tempToRealIdMap.set(realId, tempId);
        
        console.log(`메시지 ID 매핑: 임시 ID ${tempId} -> 실제 ID ${realId}`);
    }
    
    /**
     * 실제 ID로 임시 ID 찾기
     * @param {string} realId - 실제 메시지 ID
     * @returns {string|null} - 임시 메시지 ID
     */
    findTempIdByRealId(realId) {
        return this.tempToRealIdMap.get(realId) || null;
    }
    
    /**
     * 임시 ID로 실제 ID 찾기
     * @param {string} tempId - 임시 메시지 ID
     * @returns {string|null} - 실제 메시지 ID
     */
    findRealIdByTempId(tempId) {
        return this.tempToRealIdMap.get(tempId) || null;
    }
    
    /**
     * 메시지 UI 업데이트
     * @param {string} id - 메시지 ID
     * @param {string} status - 메시지 상태
     * @param {Object} data - 추가 데이터
     */
    updateMessageUI(id, status, data = {}) {
        // 메시지 요소 찾기
        const messageElement = document.querySelector(`[data-message-id="${id}"]`);
        if (!messageElement) return;
        
        // 기존 상태 클래스 제거
        Object.values(this.STATUS).forEach(st => {
            messageElement.classList.remove(`message-${st}`);
        });
        
        // 새 상태 클래스 추가
        messageElement.classList.add(`message-${status}`);
        
        // 상태 아이콘 업데이트
        const statusIcon = messageElement.querySelector('.message-status-icon');
        if (statusIcon) {
            statusIcon.innerHTML = this.getStatusIconHTML(status);
            statusIcon.setAttribute('title', this.getStatusText(status));
        }
        
        // 실패한 경우 재시도 버튼 표시
        if (status === this.STATUS.FAILED) {
            // 재시도 버튼이 없으면 추가
            if (!messageElement.querySelector('.message-retry-button')) {
                const retryButton = document.createElement('button');
                retryButton.className = 'message-retry-button';
                retryButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
                retryButton.title = '메시지 재전송';
                
                // 재시도 이벤트 리스너
                retryButton.addEventListener('click', () => {
                    this.retryMessage(id);
                });
                
                // 메시지 요소에 추가
                messageElement.appendChild(retryButton);
            }
        } else {
            // 재시도 버튼 제거
            const retryButton = messageElement.querySelector('.message-retry-button');
            if (retryButton) {
                retryButton.remove();
            }
        }
    }
    
    /**
     * 상태 아이콘 HTML 반환
     * @param {string} status - 메시지 상태
     * @returns {string} - 아이콘 HTML
     */
    getStatusIconHTML(status) {
        switch (status) {
            case this.STATUS.SENDING:
                return '<i class="fas fa-circle-notch fa-spin"></i>';
            case this.STATUS.SENT:
                return '<i class="fas fa-check"></i>';
            case this.STATUS.DELIVERED:
                return '<i class="fas fa-check-double"></i>';
            case this.STATUS.READ:
                return '<i class="fas fa-check-double" style="color: var(--primary-color);"></i>';
            case this.STATUS.FAILED:
                return '<i class="fas fa-exclamation-triangle"></i>';
            default:
                return '';
        }
    }
    
    /**
     * 상태 텍스트 반환
     * @param {string} status - 메시지 상태
     * @returns {string} - 상태 텍스트
     */
    getStatusText(status) {
        switch (status) {
            case this.STATUS.SENDING:
                return '전송 중...';
            case this.STATUS.SENT:
                return '전송됨';
            case this.STATUS.DELIVERED:
                return '전달됨';
            case this.STATUS.READ:
                return '읽음';
            case this.STATUS.FAILED:
                return '전송 실패';
            default:
                return '';
        }
    }
    
    /**
     * 재시도 큐에 메시지 추가
     * @param {string} id - 메시지 ID
     */
    addToRetryQueue(id) {
        // 이미 큐에 있는지 확인
        if (this.retryQueue.includes(id)) return;
        
        // 큐에 추가
        this.retryQueue.push(id);
        console.log(`재시도 큐에 메시지 추가: ${id}`);
    }
    
    /**
     * 재시도 큐에서 메시지 제거
     * @param {string} id - 메시지 ID
     */
    removeFromRetryQueue(id) {
        this.retryQueue = this.retryQueue.filter(queueId => queueId !== id);
    }
    
    /**
     * 재시도 타이머 시작
     */
    startRetryTimer() {
        // 이미 실행 중인 타이머가 있으면 중지
        this.stopRetryTimer();
        
        // 새 타이머 설정 (60초마다 재시도)
        this.retryTimer = setInterval(() => {
            this.processRetryQueue();
        }, 60000);
    }
    
    /**
     * 재시도 타이머 중지
     */
    stopRetryTimer() {
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
    }
    
    /**
     * 재시도 큐 처리
     */
    processRetryQueue() {
        // 네트워크 연결 확인
        if (window.networkMonitor && !networkMonitor.getConnectionStatus().isOnline) {
            console.log('오프라인 상태: 재시도 큐 처리 연기');
            return;
        }
        
        // 큐가 비어있으면 처리 중단
        if (this.retryQueue.length === 0) return;
        
        console.log(`재시도 큐 처리 중: ${this.retryQueue.length}개 메시지`);
        
        // 큐 복사 (처리 중 큐가 변경될 수 있으므로)
        const queue = [...this.retryQueue];
        
        // 각 메시지 재시도
        queue.forEach(id => {
            this.retryMessage(id);
        });
    }
    
    /**
     * 메시지 재전송
     * @param {string} id - 메시지 ID
     */
    retryMessage(id) {
        // 메시지 상태 확인
        if (!this.messageStatusMap.has(id)) {
            console.warn(`재시도할 메시지 ID ${id}를 찾을 수 없습니다.`);
            this.removeFromRetryQueue(id);
            return;
        }
        
        const statusObject = this.messageStatusMap.get(id);
        
        // 재시도 횟수 증가
        statusObject.retryCount++;
        
        // 상태 업데이트
        statusObject.status = this.STATUS.SENDING;
        statusObject.lastUpdated = Date.now();
        
        // UI 업데이트
        this.updateMessageUI(id, this.STATUS.SENDING);
        
        console.log(`메시지 재전송 시도: ${id}, 시도 횟수: ${statusObject.retryCount}`);
        
        // 재전송 로직 실행
        if (window.app && typeof window.app.retryMessageSend === 'function') {
            // 앱의 재전송 함수 호출
            window.app.retryMessageSend(id, statusObject.message);
        } else {
            console.error('메시지 재전송 함수를 찾을 수 없습니다.');
            
            // 일정 시간 후 실패 상태로 되돌림
            setTimeout(() => {
                this.updateMessageStatus(id, this.STATUS.FAILED);
            }, 3000);
        }
    }
    
    /**
     * 특정 메시지의 상태 가져오기
     * @param {string} id - 메시지 ID
     * @returns {Object|null} - 상태 객체
     */
    getMessageStatus(id) {
        // ID 확인 (임시 ID인 경우 매핑 확인)
        const messageId = id.startsWith('temp-') ? id : this.findTempIdByRealId(id);
        
        if (!messageId || !this.messageStatusMap.has(messageId)) {
            return null;
        }
        
        return this.messageStatusMap.get(messageId);
    }
    
    /**
     * 상태 객체가 할당된 메시지 객체 생성
     * @param {Object} message - 원본 메시지 객체
     * @returns {Object} - 상태 정보가 포함된 메시지 객체
     */
    createStatusMessage(message) {
        // 이미 임시 ID가 있는 경우 그대로 사용
        if (message._tempId) {
            return message;
        }
        
        // 임시 ID 생성
        const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // 상태 등록
        return this.registerMessage(tempId, message);
    }
    
    /**
     * 메시지 상태 정리
     */
    cleanup() {
        // 24시간 이상 지난 메시지 상태 제거
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        for (const [id, statusObject] of this.messageStatusMap.entries()) {
            if (now - statusObject.timestamp > dayInMs) {
                this.messageStatusMap.delete(id);
                
                // 매핑 제거
                const realId = this.findRealIdByTempId(id);
                if (realId) {
                    this.tempToRealIdMap.delete(id);
                    this.tempToRealIdMap.delete(realId);
                }
            }
        }
    }
    
    /**
     * 인스턴스 정리
     */
    dispose() {
        // 타이머 정리
        this.stopRetryTimer();
        
        // 데이터 정리
        this.messageStatusMap.clear();
        this.tempToRealIdMap.clear();
        this.retryQueue = [];
    }
}

// 전역 인스턴스 생성
const messageStatusManager = new MessageStatusManager();