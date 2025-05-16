/**
 * offlineService.js
 * 오프라인 모드를 지원하는 서비스
 */

const offlineService = (() => {
    // 오프라인 메시지 저장 키
    const OFFLINE_MESSAGES_KEY = 'conference_chat_offline_messages';
    
    // 오프라인 상태 및 이벤트 콜백
    let isOnline = window.navigator.onLine;
    let connectionCallbacks = [];
    
    /**
     * 서비스 초기화
     */
    const initialize = () => {
        // 온라인/오프라인 이벤트 리스너 등록
        window.addEventListener('online', _handleOnline);
        window.addEventListener('offline', _handleOffline);
        
        // 초기 상태 확인
        isOnline = window.navigator.onLine;
        
        console.log(`오프라인 서비스 초기화 완료 (현재 상태: ${isOnline ? '온라인' : '오프라인'})`);
    };
    
    /**
     * 오프라인 메시지 저장
     * @param {Object} message - 저장할 메시지
     * @returns {boolean} 저장 성공 여부
     */
    const saveOfflineMessage = (message) => {
        if (!message || !message.chatroom_id) {
            return false;
        }
        
        try {
            // 기존 오프라인 메시지 로드
            const offlineMessages = _loadOfflineMessages();
            
            // 메시지 추가
            offlineMessages.push(message);
            
            // 저장
            localStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(offlineMessages));
            
            return true;
        } catch (error) {
            console.error('오프라인 메시지 저장 실패:', error);
            return false;
        }
    };
    
    /**
     * 특정 채팅방의 오프라인 메시지 가져오기
     * @param {string} roomId - 채팅방 ID
     * @returns {Array} 오프라인 메시지 목록
     */
    const getOfflineMessages = (roomId) => {
        if (!roomId) {
            return [];
        }
        
        try {
            // 기존 오프라인 메시지 로드
            const offlineMessages = _loadOfflineMessages();
            
            // 특정 채팅방의 메시지만 필터링
            return offlineMessages.filter(message => message.chatroom_id === roomId);
        } catch (error) {
            console.error('오프라인 메시지 조회 실패:', error);
            return [];
        }
    };
    
    /**
     * 오프라인 메시지 제거
     * @param {string} messageId - 제거할 메시지 ID
     * @returns {boolean} 제거 성공 여부
     */
    const removeOfflineMessage = (messageId) => {
        if (!messageId) {
            return false;
        }
        
        try {
            // 기존 오프라인 메시지 로드
            const offlineMessages = _loadOfflineMessages();
            
            // 특정 메시지 제거
            const filteredMessages = offlineMessages.filter(message => message.id !== messageId);
            
            // 제거된 메시지가 없으면 false 반환
            if (filteredMessages.length === offlineMessages.length) {
                return false;
            }
            
            // 저장
            localStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(filteredMessages));
            
            return true;
        } catch (error) {
            console.error('오프라인 메시지 제거 실패:', error);
            return false;
        }
    };
    
    /**
     * 모든 오프라인 메시지 제거
     * @returns {boolean} 제거 성공 여부
     */
    const clearOfflineMessages = () => {
        try {
            localStorage.removeItem(OFFLINE_MESSAGES_KEY);
            return true;
        } catch (error) {
            console.error('오프라인 메시지 전체 제거 실패:', error);
            return false;
        }
    };
    
    /**
     * 현재 오프라인 메시지 수 조회
     * @returns {number} 오프라인 메시지 수
     */
    const getOfflineMessageCount = () => {
        try {
            const offlineMessages = _loadOfflineMessages();
            return offlineMessages.length;
        } catch (error) {
            console.error('오프라인 메시지 수 조회 실패:', error);
            return 0;
        }
    };
    
    /**
     * 현재 네트워크 상태 가져오기
     * @returns {boolean} 온라인 상태 여부
     */
    const isNetworkOnline = () => {
        return isOnline;
    };
    
    /**
     * 연결 상태 변경 이벤트에 콜백 등록
     * @param {Function} callback - 연결 상태 변경 시 호출할 콜백 함수
     */
    const onConnectionChange = (callback) => {
        if (typeof callback === 'function') {
            connectionCallbacks.push(callback);
        }
    };
    
    /**
     * 로컬 스토리지에 데이터 저장
     * @param {string} key - 저장 키
     * @param {*} data - 저장할 데이터
     * @returns {boolean} 저장 성공 여부
     */
    const saveToLocalStorage = (key, data) => {
        if (!key) {
            return false;
        }
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`로컬 스토리지 저장 실패 (키: ${key}):`, error);
            return false;
        }
    };
    
    /**
     * 로컬 스토리지에서 데이터 로드
     * @param {string} key - 로드할 키
     * @param {*} defaultValue - 기본값
     * @returns {*} 로드된 데이터
     */
    const loadFromLocalStorage = (key, defaultValue = null) => {
        if (!key) {
            return defaultValue;
        }
        
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`로컬 스토리지 로드 실패 (키: ${key}):`, error);
            return defaultValue;
        }
    };
    
    /**
     * 로컬 스토리지에서 데이터 제거
     * @param {string} key - 제거할 키
     * @returns {boolean} 제거 성공 여부
     */
    const removeFromLocalStorage = (key) => {
        if (!key) {
            return false;
        }
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`로컬 스토리지 항목 제거 실패 (키: ${key}):`, error);
            return false;
        }
    };
    
    /**
     * 내부: 오프라인 메시지 로드
     * @returns {Array} 오프라인 메시지 목록
     * @private
     */
    const _loadOfflineMessages = () => {
        try {
            const data = localStorage.getItem(OFFLINE_MESSAGES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('오프라인 메시지 로드 실패:', error);
            return [];
        }
    };
    
    /**
     * 내부: 온라인 전환 처리
     * @param {Event} event - 이벤트 객체
     * @private
     */
    const _handleOnline = (event) => {
        console.log('네트워크 연결 복구');
        isOnline = true;
        
        // 콜백 호출
        _notifyConnectionChanged(true);
    };
    
    /**
     * 내부: 오프라인 전환 처리
     * @param {Event} event - 이벤트 객체
     * @private
     */
    const _handleOffline = (event) => {
        console.log('네트워크 연결 끊김');
        isOnline = false;
        
        // 콜백 호출
        _notifyConnectionChanged(false);
    };
    
    /**
     * 내부: 연결 상태 변경 콜백 호출
     * @param {boolean} online - 온라인 상태 여부
     * @private
     */
    const _notifyConnectionChanged = (online) => {
        connectionCallbacks.forEach(callback => {
            try {
                callback(online);
            } catch (error) {
                console.error('연결 상태 변경 콜백 실행 중 오류 발생:', error);
            }
        });
    };
    
    // 서비스 초기화
    initialize();
    
    // 공개 API
    return {
        saveOfflineMessage,
        getOfflineMessages,
        removeOfflineMessage,
        clearOfflineMessages,
        getOfflineMessageCount,
        isNetworkOnline,
        onConnectionChange,
        saveToLocalStorage,
        loadFromLocalStorage,
        removeFromLocalStorage
    };
})();
