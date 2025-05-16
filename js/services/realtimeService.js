/**
 * realtimeService.js
 * Supabase Realtime을 활용한 실시간 통신 처리를 담당하는 서비스
 */

const realtimeService = (() => {
    // 초기화 상태와 구독 관련 변수
    let isInitialized = false;
    let supabase = null;
    let messageSubscription = null;
    let userSubscription = null;
    let presenceSubscription = null;
    let connectionStatus = 'disconnected'; // disconnected, connecting, connected
    let currentRoomId = null;
    
    // 이벤트 콜백 함수
    let messageCallbacks = [];
    let userUpdateCallbacks = [];
    let connectionCallbacks = [];
    
    /**
     * 실시간 서비스 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    const initialize = async () => {
        if (isInitialized) return true;
        
        try {
            // dbService를 통해 supabase 클라이언트 가져오기
            supabase = dbService.initializeClient();
            
            // 연결 상태 변경 감지
            supabase.realtime.setAuth = () => {
                _updateConnectionStatus('connected');
            };
            
            isInitialized = true;
            _updateConnectionStatus('disconnected');
            console.log('실시간 서비스 초기화 완료');
            return true;
        } catch (error) {
            console.error('실시간 서비스 초기화 실패:', error);
            return false;
        }
    };
    
    /**
     * 채팅방 메시지 구독
     * @param {string} roomId - 채팅방 ID
     * @returns {Promise<boolean>} 구독 성공 여부
     */
    const subscribeToMessages = async (roomId) => {
        if (!isInitialized) {
            await initialize();
        }
        
        // 이전 구독 취소
        if (messageSubscription) {
            messageSubscription.unsubscribe();
        }
        
        try {
            _updateConnectionStatus('connecting');
            
            // 새 구독 생성
            messageSubscription = supabase
                .channel(`room-${roomId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chatroom_id=eq.${roomId}`
                }, (payload) => {
                    _notifyMessageReceived(payload.new);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        _updateConnectionStatus('connected');
                        currentRoomId = roomId;
                        console.log(`채팅방 메시지 구독 성공 (ID: ${roomId})`);
                    } else {
                        console.warn(`채팅방 메시지 구독 상태 변경: ${status}`);
                    }
                });
            
            return true;
        } catch (error) {
            console.error(`채팅방 메시지 구독 실패 (ID: ${roomId}):`, error);
            _updateConnectionStatus('disconnected');
            return false;
        }
    };
    
    /**
     * 사용자 업데이트 구독
     * @param {string} roomId - 채팅방 ID
     * @returns {Promise<boolean>} 구독 성공 여부
     */
    const subscribeToUserUpdates = async (roomId) => {
        if (!isInitialized) {
            await initialize();
        }
        
        // 이전 구독 취소
        if (userSubscription) {
            userSubscription.unsubscribe();
        }
        
        try {
            // 새 구독 생성
            userSubscription = supabase
                .channel(`users-${roomId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: `room_id=eq.${roomId}`
                }, (payload) => {
                    _notifyUserUpdated(payload.new || payload.old);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`사용자 업데이트 구독 성공 (채팅방 ID: ${roomId})`);
                    } else {
                        console.warn(`사용자 업데이트 구독 상태 변경: ${status}`);
                    }
                });
            
            return true;
        } catch (error) {
            console.error(`사용자 업데이트 구독 실패 (채팅방 ID: ${roomId}):`, error);
            return false;
        }
    };
    
    /**
     * Presence 구독 (사용자 온라인 상태)
     * @param {string} roomId - 채팅방 ID
     * @param {string} userId - 사용자 ID
     * @returns {Promise<boolean>} 구독 성공 여부
     */
    const subscribeToPresence = async (roomId, userId) => {
        if (!isInitialized) {
            await initialize();
        }
        
        // 이전 구독 취소
        if (presenceSubscription) {
            presenceSubscription.unsubscribe();
        }
        
        try {
            // 새 구독 생성
            const presenceChannel = supabase.channel(`presence-${roomId}`);
            
            presenceSubscription = presenceChannel
                .on('presence', { event: 'sync' }, () => {
                    const state = presenceChannel.presenceState();
                    _handlePresenceSync(state);
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    _handlePresenceJoin(key, newPresences);
                })
                .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                    _handlePresenceLeave(key, leftPresences);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        // 사용자 presence 트래킹 시작
                        await presenceChannel.track({
                            user_id: userId,
                            online_at: new Date().toISOString()
                        });
                        console.log(`Presence 구독 성공 (채팅방 ID: ${roomId})`);
                    } else {
                        console.warn(`Presence 구독 상태 변경: ${status}`);
                    }
                });
            
            return true;
        } catch (error) {
            console.error(`Presence 구독 실패 (채팅방 ID: ${roomId}):`, error);
            return false;
        }
    };
    
    /**
     * 모든 구독 취소
     */
    const unsubscribeAll = () => {
        if (messageSubscription) {
            messageSubscription.unsubscribe();
            messageSubscription = null;
        }
        
        if (userSubscription) {
            userSubscription.unsubscribe();
            userSubscription = null;
        }
        
        if (presenceSubscription) {
            presenceSubscription.unsubscribe();
            presenceSubscription = null;
        }
        
        currentRoomId = null;
        _updateConnectionStatus('disconnected');
        console.log('모든 구독 취소 완료');
    };
    
    /**
     * 메시지 수신 이벤트에 콜백 등록
     * @param {Function} callback - 메시지 수신 시 호출할 콜백 함수
     */
    const onMessage = (callback) => {
        if (typeof callback === 'function') {
            messageCallbacks.push(callback);
        }
    };
    
    /**
     * 사용자 업데이트 이벤트에 콜백 등록
     * @param {Function} callback - 사용자 업데이트 시 호출할 콜백 함수
     */
    const onUserUpdate = (callback) => {
        if (typeof callback === 'function') {
            userUpdateCallbacks.push(callback);
        }
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
     * 브로드캐스트 메시지 전송
     * @param {string} roomId - 채팅방 ID
     * @param {string} userId - 사용자 ID
     * @param {string} eventType - 이벤트 타입
     * @param {Object} payload - 전송할 데이터
     * @returns {Promise<boolean>} 전송 성공 여부
     */
    const broadcast = async (roomId, userId, eventType, payload) => {
        if (!isInitialized) {
            await initialize();
        }
        
        try {
            const broadcastChannel = supabase.channel(`broadcast-${roomId}`);
            
            await broadcastChannel.subscribe();
            
            await broadcastChannel.send({
                type: 'broadcast',
                event: eventType,
                payload: {
                    ...payload,
                    user_id: userId,
                    timestamp: new Date().toISOString()
                }
            });
            
            return true;
        } catch (error) {
            console.error(`브로드캐스트 메시지 전송 실패 (채팅방 ID: ${roomId}, 이벤트: ${eventType}):`, error);
            return false;
        }
    };
    
    /**
     * 현재 연결 상태 가져오기
     * @returns {string} 연결 상태 (disconnected, connecting, connected)
     */
    const getConnectionStatus = () => {
        return connectionStatus;
    };
    
    /**
     * 현재 구독 중인 채팅방 ID 가져오기
     * @returns {string|null} 채팅방 ID
     */
    const getCurrentRoomId = () => {
        return currentRoomId;
    };
    
    /**
     * 연결 상태 업데이트
     * @param {string} status - 연결 상태
     * @private
     */
    const _updateConnectionStatus = (status) => {
        if (connectionStatus !== status) {
            connectionStatus = status;
            _notifyConnectionChanged(status);
        }
    };
    
    /**
     * 메시지 수신 콜백 호출
     * @param {Object} message - 수신된 메시지
     * @private
     */
    const _notifyMessageReceived = (message) => {
        messageCallbacks.forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error('메시지 수신 콜백 실행 중 오류 발생:', error);
            }
        });
    };
    
    /**
     * 사용자 업데이트 콜백 호출
     * @param {Object} user - 업데이트된 사용자 정보
     * @private
     */
    const _notifyUserUpdated = (user) => {
        userUpdateCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('사용자 업데이트 콜백 실행 중 오류 발생:', error);
            }
        });
    };
    
    /**
     * 연결 상태 변경 콜백 호출
     * @param {string} status - 변경된 연결 상태
     * @private
     */
    const _notifyConnectionChanged = (status) => {
        connectionCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('연결 상태 변경 콜백 실행 중 오류 발생:', error);
            }
        });
    };
    
    /**
     * Presence 동기화 처리
     * @param {Object} state - 현재 presence 상태
     * @private
     */
    const _handlePresenceSync = (state) => {
        console.log('Presence 상태 동기화:', state);
        // 여기서 현재 접속 중인 사용자 목록을 업데이트할 수 있음
    };
    
    /**
     * Presence 참가 처리
     * @param {string} key - 사용자 키
     * @param {Array} newPresences - 새로 참가한 presence 목록
     * @private
     */
    const _handlePresenceJoin = (key, newPresences) => {
        console.log('Presence 참가:', key, newPresences);
        // 여기서 새로운 사용자가 접속했을 때의 처리를 할 수 있음
    };
    
    /**
     * Presence 이탈 처리
     * @param {string} key - 사용자 키
     * @param {Array} leftPresences - 이탈한 presence 목록
     * @private
     */
    const _handlePresenceLeave = (key, leftPresences) => {
        console.log('Presence 이탈:', key, leftPresences);
        // 여기서 사용자가 접속을 종료했을 때의 처리를 할 수 있음
    };
    
    // 공개 API
    return {
        initialize,
        subscribeToMessages,
        subscribeToUserUpdates,
        subscribeToPresence,
        unsubscribeAll,
        onMessage,
        onUserUpdate,
        onConnectionChange,
        broadcast,
        getConnectionStatus,
        getCurrentRoomId
    };
})();
