/**
 * realtimeService.js
 * Supabase Realtime을 활용한 실시간 통신 처리를 담당하는 서비스 (개선 버전)
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
    
    // 자동 재연결 관련 변수
    let reconnectTimer = null;
    const RECONNECT_INTERVAL = 5000; // 5초마다 재연결 시도
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10; // 최대 재연결 시도 횟수
    
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
            
            // 실시간 클라이언트 옵션 설정
            supabase.realtime.setConfig({
                transport: {
                    params: {
                        apikey: CONFIG.SUPABASE_KEY
                    }
                }
            });
            
            // 연결 상태 변경 감지
            supabase.realtime.onConnected(() => {
                console.log('Supabase Realtime 연결됨');
                _updateConnectionStatus('connected');
                // 재연결 시도 카운터 초기화
                reconnectAttempts = 0;
                // 재연결 타이머가 있으면 취소
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
            });
            
            supabase.realtime.onDisconnected(() => {
                console.log('Supabase Realtime 연결 끊김');
                _updateConnectionStatus('disconnected');
                // 만약 현재 채팅방에 구독 중이라면 재연결 시도
                if (currentRoomId && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    _scheduleReconnect();
                }
            });
            
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
     * 재연결 스케줄링
     * @private
     */
    const _scheduleReconnect = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }
        
        reconnectTimer = setTimeout(async () => {
            reconnectAttempts++;
            console.log(`재연결 시도 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            
            try {
                // 현재 채팅방에 다시 구독 시도
                if (currentRoomId) {
                    await subscribeToMessages(currentRoomId);
                }
            } catch (error) {
                console.error('재연결 시도 중 오류 발생:', error);
                // 최대 시도 횟수를 초과하지 않았다면 다시 시도
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    _scheduleReconnect();
                } else {
                    console.error(`최대 재연결 시도 횟수(${MAX_RECONNECT_ATTEMPTS})를 초과했습니다.`);
                }
            }
        }, RECONNECT_INTERVAL);
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
        
        // 재연결 타이머가 있으면 취소
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        
        // 이전 구독 취소
        if (messageSubscription) {
            messageSubscription.unsubscribe();
        }
        
        try {
            _updateConnectionStatus('connecting');
            
            // 채널 이름 생성 (고유한 채널 이름 사용)
            const channelName = `messages-${roomId}-${Date.now()}`;
            console.log(`실시간 채널 이름: ${channelName}`);
            
            // 새 구독 생성
            messageSubscription = supabase
                .channel(channelName, {
                    config: {
                        broadcast: { ack: true }, // 브로드캐스트 메시지 수신 확인
                    }
                })
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chatroom_id=eq.${roomId}`
                }, (payload) => {
                    console.log('새 메시지 수신 (실시간):', payload.new);
                    _notifyMessageReceived(payload.new);
                })
                .subscribe(async (status, err) => {
                    console.log(`채팅방 메시지 구독 상태: ${status}`, err || '');
                    
                    if (status === 'SUBSCRIBED') {
                        _updateConnectionStatus('connected');
                        currentRoomId = roomId;
                        console.log(`채팅방 메시지 구독 성공 (ID: ${roomId})`);
                        
                        // 사용자 업데이트 구독도 함께 시작
                        await subscribeToUserUpdates(roomId);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('채널 오류:', err);
                        _updateConnectionStatus('disconnected');
                        // 오류 발생 시 재연결 시도
                        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                            _scheduleReconnect();
                        }
                    } else if (status === 'TIMED_OUT') {
                        console.warn('채널 연결 타임아웃');
                        _updateConnectionStatus('disconnected');
                        // 타임아웃 발생 시 재연결 시도
                        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                            _scheduleReconnect();
                        }
                    }
                });
            
            return true;
        } catch (error) {
            console.error(`채팅방 메시지 구독 실패 (ID: ${roomId}):`, error);
            _updateConnectionStatus('disconnected');
            
            // 오류 발생 시 재연결 시도
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                _scheduleReconnect();
            }
            
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
            // 채널 이름 생성 (고유한 채널 이름 사용)
            const channelName = `users-${roomId}-${Date.now()}`;
            
            // 새 구독 생성
            userSubscription = supabase
                .channel(channelName)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: `room_id=eq.${roomId}`
                }, (payload) => {
                    console.log('사용자 정보 변경 감지:', payload);
                    _notifyUserUpdated(payload.new || payload.old);
                })
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`사용자 업데이트 구독 성공 (채팅방 ID: ${roomId})`);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('사용자 구독 채널 오류:', err);
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
            // 채널 이름 생성 (고유한 채널 이름 사용)
            const channelName = `presence-${roomId}-${Date.now()}`;
            
            // 새 구독 생성
            const presenceChannel = supabase.channel(channelName);
            
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
                .subscribe(async (status, err) => {
                    if (status === 'SUBSCRIBED') {
                        // 사용자 presence 트래킹 시작
                        try {
                            await presenceChannel.track({
                                user_id: userId,
                                online_at: new Date().toISOString()
                            });
                            console.log(`Presence 구독 성공 (채팅방 ID: ${roomId})`);
                        } catch (trackError) {
                            console.error('Presence 트래킹 시작 실패:', trackError);
                        }
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('Presence 채널 오류:', err);
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
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        
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
            // 채널 이름 생성 (고유한 채널 이름 사용)
            const channelName = `broadcast-${roomId}-${Date.now()}`;
            const broadcastChannel = supabase.channel(channelName);
            
            // 구독 및 메시지 전송
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
            
            // 사용 후 채널 해제
            setTimeout(() => {
                broadcastChannel.unsubscribe();
            }, 1000);
            
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
        // 네트워크 연결 확인
        if (!navigator.onLine) {
            return 'disconnected';
        }
        
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
            console.log(`Realtime 연결 상태 변경: ${status}`);
            _notifyConnectionChanged(status);
        }
    };
    
    /**
     * 메시지 수신 콜백 호출
     * @param {Object} message - 수신된 메시지
     * @private
     */
    const _notifyMessageReceived = (message) => {
        if (!message || !message.id) {
            console.warn('유효하지 않은 메시지 수신:', message);
            return;
        }
        
        // 콜백 배열을 복사하여 내부에서 콜백이 추가/제거되어도 영향 없게 함
        const callbacks = [...messageCallbacks];
        callbacks.forEach(callback => {
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
        if (!user || !user.id) {
            console.warn('유효하지 않은 사용자 정보 수신:', user);
            return;
        }
        
        // 콜백 배열을 복사하여 내부에서 콜백이 추가/제거되어도 영향 없게 함
        const callbacks = [...userUpdateCallbacks];
        callbacks.forEach(callback => {
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
        // 콜백 배열을 복사하여 내부에서 콜백이 추가/제거되어도 영향 없게 함
        const callbacks = [...connectionCallbacks];
        callbacks.forEach(callback => {
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
        // TODO: 사용자 목록 업데이트
    };
    
    /**
     * Presence 참가 처리
     * @param {string} key - 사용자 키
     * @param {Array} newPresences - 새로 참가한 presence 목록
     * @private
     */
    const _handlePresenceJoin = (key, newPresences) => {
        console.log('Presence 참가:', key, newPresences);
        
        // 사용자 정보가 있으면 사용자 업데이트 콜백 호출
        if (newPresences && newPresences.length > 0) {
            const user = newPresences[0];
            if (user && user.user_id) {
                // 사용자 정보를 기반으로 업데이트 알림
                const userId = user.user_id;
                // TODO: 사용자 정보 조회 및 업데이트
            }
        }
    };
    
    /**
     * Presence 이탈 처리
     * @param {string} key - 사용자 키
     * @param {Array} leftPresences - 이탈한 presence 목록
     * @private
     */
    const _handlePresenceLeave = (key, leftPresences) => {
        console.log('Presence 이탈:', key, leftPresences);
        
        // 사용자 정보가 있으면 사용자 업데이트 콜백 호출
        if (leftPresences && leftPresences.length > 0) {
            const user = leftPresences[0];
            if (user && user.user_id) {
                // 사용자 정보를 기반으로 업데이트 알림
                const userId = user.user_id;
                // TODO: 사용자 정보 조회 및 업데이트
            }
        }
    };
    
    /**
     * 네트워크 이벤트 리스너 등록
     */
    const _setupNetworkListeners = () => {
        // 온라인 상태 변경 감지
        window.addEventListener('online', () => {
            console.log('네트워크 연결 복구');
            // 온라인 상태일 때 현재 채팅방에 재연결 시도
            if (currentRoomId) {
                _scheduleReconnect();
            }
        });
        
        window.addEventListener('offline', () => {
            console.log('네트워크 연결 끊김');
            _updateConnectionStatus('disconnected');
        });
    };
    
    // 네트워크 이벤트 리스너 등록
    _setupNetworkListeners();
    
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
