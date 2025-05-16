/**
 * chatService.js
 * 채팅 메시지 처리를 담당하는 서비스 (개선 버전)
 */

const chatService = (() => {
    // 현재 채팅방 및 메시지 관련 상태
    let currentRoomId = null;
    let lastMessageId = null;
    let messages = [];
    let isPolling = false;
    let pollingInterval = null;
    let replyToMessage = null;
    let isLoadingMessages = false; // 메시지 로딩 중 상태
    
    // 성능 최적화를 위한 설정
    const MESSAGE_BATCH_SIZE = 40; // 메시지 배치 크기 (성능 최적화)
    const MAX_MESSAGES_IN_MEMORY = 100; // 메모리에 유지할 최대 메시지 수
    const POLLING_INTERVAL = 2000; // 폴링 주기 (ms)
    
    // 메시지 렌더링 최적화를 위한 디바운스 타이머
    let renderTimer = null;
    const RENDER_DEBOUNCE_TIME = 50; // 렌더링 디바운스 시간 (ms)
    
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
            
            // 채팅 메시지 로드 (지연 로딩 방식)
            const loadedMessages = await loadMessages(MESSAGE_BATCH_SIZE);
            
            // 실시간 구독 설정 (백그라운드로 분리)
            setTimeout(async () => {
                try {
                    const realtimeSetup = await _setupRealtime();
                    console.log("실시간 설정 결과:", realtimeSetup);
                    
                    // 폴링 시작 (실시간 통신의 백업으로 사용)
                    _startPolling(POLLING_INTERVAL);
                } catch (error) {
                    console.error("실시간 설정 오류:", error);
                    // 폴링은 항상 시작
                    _startPolling(POLLING_INTERVAL);
                }
                
                // 오프라인 메시지 동기화
                _syncOfflineMessages();
            }, 100);
            
            // 사용자 목록 불러오기 (백그라운드로 분리)
            setTimeout(async () => {
                try {
                    await userService.getRoomUsers(roomId);
                } catch (error) {
                    console.error("사용자 목록 로드 오류:", error);
                }
            }, 200);
            
            return loadedMessages;
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
            // 디바운스 타이머 취소
            if (renderTimer) {
                clearTimeout(renderTimer);
                renderTimer = null;
            }
            
            // 실시간 구독 취소
            realtimeService.unsubscribeAll();
            
            // 폴링 중지
            _stopPolling();
            
            // 상태 초기화
            currentRoomId = null;
            messages = [];
            lastMessageId = null;
            replyToMessage = null;
            isLoadingMessages = false;
            
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
    const loadMessages = async (limit = MESSAGE_BATCH_SIZE) => {
        if (!currentRoomId) {
            throw new Error('채팅방에 입장하지 않았습니다');
        }
        
        // 이미 로딩 중이면 중복 요청 방지
        if (isLoadingMessages) {
            return messages;
        }
        
        isLoadingMessages = true;
        
        try {
            // 메시지 로드
            const newMessages = await dbService.getMessages(currentRoomId, limit);
            
            if (newMessages.length > 0) {
                // 메시지를 먼저 표시하고 (번역 전에)
                messages = newMessages;
                lastMessageId = messages[messages.length - 1].id;
                
                // 메시지 수신 이벤트 발생 (번역 전 원본 메시지로)
                _notifyMessagesReceived(messages);
                
                // 사용자 선호 언어로 메시지 번역 (백그라운드에서 처리)
                setTimeout(async () => {
                    try {
                        const user = userService.getCurrentUser();
                        if (user && user.preferred_language) {
                            // 메시지 번역 (배치 단위로 처리하여 성능 최적화)
                            const batchSize = 10;
                            let translatedCount = 0;
                            
                            for (let i = 0; i < messages.length; i += batchSize) {
                                const batch = messages.slice(i, i + batchSize);
                                const translatedBatch = await translationService.translateMessages(
                                    batch, 
                                    user.preferred_language
                                );
                                
                                // 번역된 메시지 적용
                                translatedBatch.forEach((translatedMsg, index) => {
                                    const actualIndex = i + index;
                                    if (actualIndex < messages.length) {
                                        messages[actualIndex] = translatedMsg;
                                        translatedCount++;
                                    }
                                });
                                
                                // 일정 개수의 메시지가 번역되면 업데이트 알림
                                if (translatedCount >= batchSize || i + batchSize >= messages.length) {
                                    _notifyMessagesReceived(messages);
                                    translatedCount = 0;
                                    
                                    // 다음 배치 처리 전에 잠시 대기 (UI 반응성 유지)
                                    await new Promise(resolve => setTimeout(resolve, 10));
                                }
                            }
                        }
                    } catch (translationError) {
                        console.error('메시지 번역 실패:', translationError);
                    }
                }, 100);
            } else {
                // 비어있는 메시지 목록 표시
                _notifyMessagesReceived([]);
            }
            
            return messages;
        } catch (error) {
            console.error('메시지 로드 실패:', error);
            throw new Error('메시지를 불러오는데 실패했습니다');
        } finally {
            isLoadingMessages = false;
        }
    };
    
    /**
     * 더 오래된 메시지 로드 (스크롤 업)
     * @param {number} limit - 로드할 메시지 수
     * @returns {Promise<Array>} 채팅 메시지 목록
     */
    const loadOlderMessages = async (limit = MESSAGE_BATCH_SIZE / 2) => {
        if (!currentRoomId || messages.length === 0 || isLoadingMessages) {
            return [];
        }
        
        isLoadingMessages = true;
        
        try {
            // 가장 오래된 메시지의 시간 확인
            const oldestMessage = messages[0];
            
            // TODO: 구현 필요
            // 현재는 클라이언트 측에서 특정 시간 이전의 메시지를 가져오는 기능이 제한됨
            // 필요 시 서버 측에서 추가 구현해야 함
            
            // 테스트 용도 - 아무 동작 없음
            await new Promise(resolve => setTimeout(resolve, 300));
            
            return [];
        } catch (error) {
            console.error('이전 메시지 로드 실패:', error);
            return [];
        } finally {
            isLoadingMessages = false;
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
            
            // 메시지를 이미 렌더링했거나 실시간 업데이트가 있을 것이므로 추가 작업 불필요
            
            return sentMessage;
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            
            // 네트워크 오류 시 오프라인 모드에서 처리
            if (error.message.includes('네트워크') || 
                error.message.includes('연결') || 
                !navigator.onLine) {
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
            
            // 메시지 목록에 먼저 추가 (번역 전)
            messages.push(message);
            lastMessageId = message.id;
            
            // 정렬 (시간순)
            messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            // 메모리 관리: 메시지 수가 최대치를 초과하면 오래된 메시지 제거
            if (messages.length > MAX_MESSAGES_IN_MEMORY) {
                messages = messages.slice(messages.length - MAX_MESSAGES_IN_MEMORY);
            }
            
            // 메시지 수신 이벤트 발생 (번역 전 원본 상태로)
            _notifyMessageReceived(message);
            
            // 사용자 선호 언어로 메시지 번역 (백그라운드 처리)
            setTimeout(async () => {
                try {
                    const user = userService.getCurrentUser();
                    if (user && user.preferred_language) {
                        const translatedMessage = await translationService.translateMessage(
                            message, 
                            user.preferred_language
                        );
                        
                        // 메시지 목록에서 원본 메시지 찾기
                        const index = messages.findIndex(m => m.id === message.id);
                        if (index !== -1) {
                            // 번역된 메시지로 교체
                            messages[index] = translatedMessage;
                            
                            // 메시지 업데이트 이벤트 발생
                            _notifyMessageUpdated(translatedMessage);
                        }
                    }
                } catch (error) {
                    console.error('메시지 번역 실패:', error);
                }
            }, 50);
            
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
    const _startPolling = (interval = POLLING_INTERVAL) => {
        if (isPolling || !currentRoomId) {
            return;
        }
        
        isPolling = true;
        console.log(`메시지 폴링 시작 (${interval}ms 간격)`);
        
        // 정기적으로 새 메시지 확인
        pollingInterval = setInterval(async () => {
            if (!currentRoomId || !lastMessageId || !navigator.onLine) {
                return;
            }
            
            try {
                const newMessages = await dbService.getNewMessages(currentRoomId, lastMessageId);
                
                if (newMessages.length > 0) {
                    console.log(`폴링으로 ${newMessages.length}개의 새 메시지 받음`);
                    
                    // 새 메시지 처리
                    for (const message of newMessages) {
                        await _handleNewMessage(message);
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
            id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
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
        
        // 정렬 (시간순)
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
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
            
            console.log(`${offlineMessages.length}개의 오프라인 메시지 동기화 시작`);
            
            // 오프라인 메시지 전송 중 상태로 변경
            offlineMessages.forEach(message => {
                const index = messages.findIndex(m => m.id === message.id);
                if (index !== -1) {
                    messages[index].isSyncing = true;
                    messages[index].isPending = false;
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
                    
                    // 정렬 (시간순)
                    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    
                    // 메시지 수신 이벤트 발생
                    _notifyMessageReceived(sentMessage);
                    
                    // 오프라인 메시지 제거
                    offlineService.removeOfflineMessage(message.id);
                    
                    // 전송 간에 약간의 딜레이 추가 (서버 부하 방지)
                    await new Promise(resolve => setTimeout(resolve, 200));
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
            
            console.log('오프라인 메시지 동기화 완료');
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
        // 디바운스 처리 (UI 업데이트 최적화)
        if (renderTimer) {
            clearTimeout(renderTimer);
        }
        
        renderTimer = setTimeout(() => {
            messageCallbacks.forEach(callback => {
                try {
                    callback('new', message);
                } catch (error) {
                    console.error('메시지 수신 콜백 실행 중 오류 발생:', error);
                }
            });
        }, RENDER_DEBOUNCE_TIME);
    };
    
    /**
     * 내부: 메시지 목록 수신 콜백 호출
     * @param {Array} newMessages - 수신된 메시지 목록
     * @private
     */
    const _notifyMessagesReceived = (newMessages) => {
        // 디바운스 처리 (UI 업데이트 최적화)
        if (renderTimer) {
            clearTimeout(renderTimer);
        }
        
        renderTimer = setTimeout(() => {
            messageCallbacks.forEach(callback => {
                try {
                    callback('list', newMessages);
                } catch (error) {
                    console.error('메시지 목록 수신 콜백 실행 중 오류 발생:', error);
                }
            });
        }, RENDER_DEBOUNCE_TIME);
    };
    
    /**
     * 내부: 메시지 업데이트 콜백 호출
     * @param {Object} message - 업데이트된 메시지
     * @private
     */
    const _notifyMessageUpdated = (message) => {
        // 디바운스 처리 (UI 업데이트 최적화)
        if (renderTimer) {
            clearTimeout(renderTimer);
        }
        
        renderTimer = setTimeout(() => {
            messageCallbacks.forEach(callback => {
                try {
                    callback('update', message);
                } catch (error) {
                    console.error('메시지 업데이트 콜백 실행 중 오류 발생:', error);
                }
            });
        }, RENDER_DEBOUNCE_TIME);
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
