/**
 * chatService.js
 * 채팅 메시지 처리를 담당하는 서비스
 */

const chatService = (() => {
    // 현재 채팅방 및 메시지 관련 상태
    let currentRoomId = null;
    let lastMessageId = null;
    let messages = [];
    let isPolling = false;
    let pollingInterval = null;
    let replyToMessage = null;
    
    // 이벤트 콜백 함수
    let messageCallbacks = [];
    
    /**
     * 채팅방 입장
     * @param {string} roomId - 채팅방 ID
     * @returns {Promise<Array>} 채팅 메시지 목록
     */
    const joinRoom = async (roomId) => {
        if (!roomId) {
            throw new Error('유효하지 않은 채팅방입니다');
        }
        
        try {
            // 이전 채팅방에서 나가기
            if (currentRoomId) {
                await leaveRoom();
            }
            
            // 현재 채팅방 설정
            currentRoomId = roomId;
            messages = [];
            lastMessageId = null;
            
            // 채팅 메시지 로드
            await loadMessages();
            
            // 실시간 구독 설정
            await _setupRealtime();
            
            // 폴링 시작 (실시간 통신의 백업으로 사용)
            _startPolling();
            
            // 사용자 목록 불러오기
            await userService.getRoomUsers(roomId);
            
            return messages;
        } catch (error) {
            console.error(`채팅방 입장 실패 (ID: ${roomId}):`, error);
            throw new Error('채팅방 입장에 실패했습니다');
        }
    };
    
    /**
     * 채팅방 퇴장
     * @returns {Promise<boolean>} 퇴장 성공 여부
     */
    const leaveRoom = async () => {
        if (!currentRoomId) {
            return true;
        }
        
        try {
            // 실시간 구독 취소
            realtimeService.unsubscribeAll();
            
            // 폴링 중지
            _stopPolling();
            
            // 상태 초기화
            currentRoomId = null;
            messages = [];
            lastMessageId = null;
            replyToMessage = null;
            
            return true;
        } catch (error) {
            console.error('채팅방 퇴장 실패:', error);
            return false;
        }
    };
    
    /**
     * 초기 메시지 로드
     * @param {number} limit - 로드할 메시지 수
     * @returns {Promise<Array>} 채팅 메시지 목록
     */
    const loadMessages = async (limit = 50) => {
        if (!currentRoomId) {
            throw new Error('채팅방에 입장하지 않았습니다');
        }
        
        try {
            // 메시지 로드
            const newMessages = await dbService.getMessages(currentRoomId, limit);
            
            if (newMessages.length > 0) {
                messages = newMessages;
                lastMessageId = messages[messages.length - 1].id;
            }
            
            // 사용자 선호 언어로 메시지 번역
            const user = userService.getCurrentUser();
            if (user && user.preferred_language) {
                messages = await translationService.translateMessages(
                    messages, 
                    user.preferred_language
                );
            }
            
            // 메시지 수신 이벤트 발생
            _notifyMessagesReceived(messages);
            
            return messages;
        } catch (error) {
            console.error('메시지 로드 실패:', error);
            throw new Error('메시지를 불러오는데 실패했습니다');
        }
    };
    
    /**
     * 더 오래된 메시지 로드 (스크롤 업)
     * @param {number} limit - 로드할 메시지 수
     * @returns {Promise<Array>} 채팅 메시지 목록
     */
    const loadOlderMessages = async (limit = 20) => {
        if (!currentRoomId || messages.length === 0) {
            return [];
        }
        
        try {
            // 가장 오래된 메시지의 시간 확인
            const oldestMessage = messages[0];
            
            // TODO: 구현 필요
            // 현재는 클라이언트 측에서 특정 시간 이전의 메시지를 가져오는 기능이 제한됨
            // 필요 시 서버 측에서 추가 구현해야 함
            
            return [];
        } catch (error) {
            console.error('이전 메시지 로드 실패:', error);
            return [];
        }
    };
    
    /**
     * 메시지 전송
     * @param {string} messageText - 메시지 텍스트
     * @param {boolean} isAnnouncement - 공지 여부
     * @returns {Promise<Object>} 전송된 메시지
     */
    const sendMessage = async (messageText, isAnnouncement = false) => {
        if (!currentRoomId) {
            throw new Error('채팅방에 입장하지 않았습니다');
        }
        
        const user = userService.getCurrentUser();
        if (!user) {
            throw new Error('로그인되지 않았습니다');
        }
        
        // 메시지 텍스트 검증
        if (!messageText || messageText.trim() === '') {
            throw new Error('메시지를 입력해주세요');
        }
        
        // 공지사항 권한 확인 (관리자만 가능)
        if (isAnnouncement && user.role !== 'admin') {
            throw new Error('공지사항 작성 권한이 없습니다');
        }
        
        try {
            // 메시지 데이터 생성
            const messageData = {
                chatroom_id: currentRoomId,
                user_id: user.id,
                username: user.username,
                message: messageText.trim(),
                language: user.preferred_language,
                created_at: new Date().toISOString(),
                isannouncement: isAnnouncement,
                reply_to: replyToMessage ? {
                    id: replyToMessage.id,
                    username: replyToMessage.username,
                    message: replyToMessage.message
                } : null
            };
            
            // 메시지 전송
            const sentMessage = await dbService.sendMessage(messageData);
            
            // 답장 정보 초기화
            replyToMessage = null;
            
            return sentMessage;
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            
            // 네트워크 오류 시 오프라인 모드에서 처리
            if (error.message.includes('네트워크') || error.message.includes('연결')) {
                return _handleOfflineMessage(messageText, isAnnouncement);
            }
            
            throw new Error('메시지 전송에 실패했습니다');
        }
    };
    
    /**
     * 공지사항 전송
     * @param {string} messageText - 공지 텍스트
     * @returns {Promise<Object>} 전송된 공지사항
     */
    const sendAnnouncement = async (messageText) => {
        return await sendMessage(messageText, true);
    };
    
    /**
     * 메시지에 답장 설정
     * @param {Object} message - 답장할 메시지
     */
    const setReplyTo = (message) => {
        replyToMessage = message;
    };
    
    /**
     * 답장 정보 가져오기
     * @returns {Object|null} 답장 정보
     */
    const getReplyTo = () => {
        return replyToMessage;
    };
    
    /**
     * 답장 정보 초기화
     */
    const clearReplyTo = () => {
        replyToMessage = null;
    };
    
    /**
     * 메시지 목록 가져오기
     * @returns {Array} 현재 메시지 목록
     */
    const getMessages = () => {
        return [...messages];
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
     * 내부: 실시간 서비스 설정
     * @returns {Promise<boolean>} 설정 성공 여부
     * @private
     */
    const _setupRealtime = async () => {
        if (!currentRoomId) {
            return false;
        }
        
        try {
            const user = userService.getCurrentUser();
            
            // 실시간 서비스 초기화
            await realtimeService.initialize();
            
            // 메시지 구독
            await realtimeService.subscribeToMessages(currentRoomId);
            
            // 사용자 업데이트 구독
            await realtimeService.subscribeToUserUpdates(currentRoomId);
            
            // Presence 구독 (사용자가 있는 경우)
            if (user) {
                await realtimeService.subscribeToPresence(currentRoomId, user.id);
            }
            
            // 메시지 수신 이벤트 처리
            realtimeService.onMessage(_handleNewMessage);
            
            // 연결 상태 변경 이벤트 처리
            realtimeService.onConnectionChange(_handleConnectionChange);
            
            return true;
        } catch (error) {
            console.error('실시간 서비스 설정 실패:', error);
            return false;
        }
    };
    
    /**
     * 내부: 새 메시지 처리
     * @param {Object} message - 수신된 메시지
     * @private
     */
    const _handleNewMessage = async (message) => {
        if (!message || !currentRoomId || message.chatroom_id !== currentRoomId) {
            return;
        }
        
        try {
            // 중복 메시지 확인
            const isDuplicate = messages.some(m => m.id === message.id);
            if (isDuplicate) {
                return;
            }
            
            // 사용자 선호 언어로 메시지 번역
            const user = userService.getCurrentUser();
            if (user && user.preferred_language) {
                message = await translationService.translateMessage(
                    message, 
                    user.preferred_language
                );
            }
            
            // 메시지 목록에 추가
            messages.push(message);
            lastMessageId = message.id;
            
            // 메시지 수신 이벤트 발생
            _notifyMessageReceived(message);
            
            // 사용자 활동 시간 업데이트
            userService.updateActivity();
        } catch (error) {
            console.error('새 메시지 처리 실패:', error);
        }
    };
    
    /**
     * 내부: 연결 상태 변경 처리
     * @param {string} status - 변경된 연결 상태
     * @private
     */
    const _handleConnectionChange = (status) => {
        if (status === 'connected') {
            // 연결 복구 시 동기화
            _syncOfflineMessages();
        } else if (status === 'disconnected') {
            // 연결 끊김 시 폴링 시작
            _startPolling();
        }
    };
    
    /**
     * 내부: 메시지 폴링 시작
     * @param {number} interval - 폴링 간격 (밀리초)
     * @private
     */
    const _startPolling = (interval = 10000) => {
        if (isPolling || !currentRoomId) {
            return;
        }
        
        isPolling = true;
        
        // 정기적으로 새 메시지 확인
        pollingInterval = setInterval(async () => {
            if (!currentRoomId || !lastMessageId) {
                return;
            }
            
            try {
                const newMessages = await dbService.getNewMessages(currentRoomId, lastMessageId);
                
                if (newMessages.length > 0) {
                    // 사용자 선호 언어로 메시지 번역
                    const user = userService.getCurrentUser();
                    if (user && user.preferred_language) {
                        const translatedMessages = await translationService.translateMessages(
                            newMessages, 
                            user.preferred_language
                        );
                        
                        // 메시지 목록에 추가
                        messages = [...messages, ...translatedMessages];
                        lastMessageId = messages[messages.length - 1].id;
                        
                        // 메시지 수신 이벤트 발생
                        _notifyMessagesReceived(translatedMessages);
                    } else {
                        // 번역 없이 메시지 목록에 추가
                        messages = [...messages, ...newMessages];
                        lastMessageId = messages[messages.length - 1].id;
                        
                        // 메시지 수신 이벤트 발생
                        _notifyMessagesReceived(newMessages);
                    }
                }
            } catch (error) {
                console.error('메시지 폴링 실패:', error);
            }
        }, interval);
    };
    
    /**
     * 내부: 메시지 폴링 중지
     * @private
     */
    const _stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
        
        isPolling = false;
    };
    
    /**
     * 내부: 오프라인 메시지 처리
     * @param {string} messageText - 메시지 텍스트
     * @param {boolean} isAnnouncement - 공지 여부
     * @returns {Object} 임시 저장된 메시지
     * @private
     */
    const _handleOfflineMessage = (messageText, isAnnouncement = false) => {
        const user = userService.getCurrentUser();
        
        // 임시 메시지 생성
        const tempMessage = {
            id: `temp_${Date.now()}`,
            chatroom_id: currentRoomId,
            user_id: user.id,
            username: user.username,
            message: messageText.trim(),
            language: user.preferred_language,
            created_at: new Date().toISOString(),
            isannouncement: isAnnouncement,
            reply_to: replyToMessage ? {
                id: replyToMessage.id,
                username: replyToMessage.username,
                message: replyToMessage.message
            } : null,
            isPending: true // 오프라인 전송 표시
        };
        
        // 오프라인 메시지 저장
        offlineService.saveOfflineMessage(tempMessage);
        
        // 메시지 목록에 추가
        messages.push(tempMessage);
        
        // 메시지 수신 이벤트 발생
        _notifyMessageReceived(tempMessage);
        
        return tempMessage;
    };
    
    /**
     * 내부: 오프라인 메시지 동기화
     * @private
     */
    const _syncOfflineMessages = async () => {
        if (!currentRoomId) {
            return;
        }
        
        try {
            // 오프라인 메시지 가져오기
            const offlineMessages = offlineService.getOfflineMessages(currentRoomId);
            
            if (offlineMessages.length === 0) {
                return;
            }
            
            // 오프라인 메시지 전송 중 상태로 변경
            offlineMessages.forEach(message => {
                const index = messages.findIndex(m => m.id === message.id);
                if (index !== -1) {
                    messages[index].isSyncing = true;
                    _notifyMessageUpdated(messages[index]);
                }
            });
            
            // 오프라인 메시지 순차적으로 전송
            for (const message of offlineMessages) {
                try {
                    // 메시지 데이터 준비
                    const messageData = {
                        chatroom_id: message.chatroom_id,
                        user_id: message.user_id,
                        username: message.username,
                        message: message.message,
                        language: message.language,
                        created_at: new Date().toISOString(), // 현재 시간으로 업데이트
                        isannouncement: message.isannouncement,
                        reply_to: message.reply_to
                    };
                    
                    // 메시지 전송
                    const sentMessage = await dbService.sendMessage(messageData);
                    
                    // 임시 메시지 제거
                    const index = messages.findIndex(m => m.id === message.id);
                    if (index !== -1) {
                        messages.splice(index, 1);
                    }
                    
                    // 전송된 메시지 추가
                    messages.push(sentMessage);
                    lastMessageId = sentMessage.id;
                    
                    // 메시지 수신 이벤트 발생
                    _notifyMessageReceived(sentMessage);
                    
                    // 오프라인 메시지 제거
                    offlineService.removeOfflineMessage(message.id);
                } catch (error) {
                    console.error(`오프라인 메시지 동기화 실패 (ID: ${message.id}):`, error);
                    
                    // 오류 발생 시 동기화 실패 상태로 변경
                    const index = messages.findIndex(m => m.id === message.id);
                    if (index !== -1) {
                        messages[index].syncFailed = true;
                        messages[index].isSyncing = false;
                        _notifyMessageUpdated(messages[index]);
                    }
                }
            }
        } catch (error) {
            console.error('오프라인 메시지 동기화 실패:', error);
        }
    };
    
    /**
     * 내부: 메시지 수신 콜백 호출
     * @param {Object} message - 수신된 메시지
     * @private
     */
    const _notifyMessageReceived = (message) => {
        messageCallbacks.forEach(callback => {
            try {
                callback('new', message);
            } catch (error) {
                console.error('메시지 수신 콜백 실행 중 오류 발생:', error);
            }
        });
    };
    
    /**
     * 내부: 메시지 목록 수신 콜백 호출
     * @param {Array} newMessages - 수신된 메시지 목록
     * @private
     */
    const _notifyMessagesReceived = (newMessages) => {
        messageCallbacks.forEach(callback => {
            try {
                callback('list', newMessages);
            } catch (error) {
                console.error('메시지 목록 수신 콜백 실행 중 오류 발생:', error);
            }
        });
    };
    
    /**
     * 내부: 메시지 업데이트 콜백 호출
     * @param {Object} message - 업데이트된 메시지
     * @private
     */
    const _notifyMessageUpdated = (message) => {
        messageCallbacks.forEach(callback => {
            try {
                callback('update', message);
            } catch (error) {
                console.error('메시지 업데이트 콜백 실행 중 오류 발생:', error);
            }
        });
    };
    
    // 공개 API
    return {
        joinRoom,
        leaveRoom,
        loadMessages,
        loadOlderMessages,
        sendMessage,
        sendAnnouncement,
        setReplyTo,
        getReplyTo,
        clearReplyTo,
        getMessages,
        onMessage
    };
})();
