/**
 * 채팅 서비스
 * 채팅 메시지 전송, 수신 및 처리를 담당합니다.
 */

class ChatService {
    constructor() {
        this.messages = []; // 현재 채팅방의 메시지 목록
        this.currentRoomId = null;
        this.onNewMessage = null;
        this.onMessageHistoryLoaded = null;
        this.onUserJoin = null;
        this.onUserLeave = null;
        this.onErrorOccurred = null;
    }

    /**
     * 채팅방 설정 및 구독
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<boolean>} 설정 성공 여부
     */
    async setRoom(roomId) {
        try {
            this.currentRoomId = roomId;
            
            // 실시간 메시지 구독
            await realtimeService.subscribeToRoomMessages(roomId);
            
            // 메시지 수신 콜백 설정
            realtimeService.setMessageCallback(this.handleNewMessage.bind(this));
            realtimeService.setUserJoinCallback(this.handleUserJoin.bind(this));
            realtimeService.setUserLeaveCallback(this.handleUserLeave.bind(this));
            
            // 최근 메시지 로드
            await this.loadRecentMessages();
            
            return true;
        } catch (error) {
            console.error(`Error setting up chat room ${roomId}:`, error);
            return false;
        }
    }

    /**
     * 채팅방 퇴장
     */
    leaveRoom() {
        realtimeService.unsubscribeFromCurrentRoom();
        this.messages = [];
        this.currentRoomId = null;
    }

    /**
     * 최근 메시지 로드
     * @param {number} limit 최대 메시지 수
     * @returns {Promise<Array>} 메시지 목록
     */
    async loadRecentMessages(limit = 50) {
        if (!this.currentRoomId) {
            return [];
        }
        
        try {
            const messages = await dbService.getRecentMessages(this.currentRoomId, limit);
            this.messages = messages;
            
            if (this.onMessageHistoryLoaded) {
                this.onMessageHistoryLoaded(messages);
            }
            
            return messages;
        } catch (error) {
            console.error('Error loading recent messages:', error);
            return [];
        }
    }

    /**
     * 메시지 전송
     * @param {string} content 메시지 내용
     * @param {string} language 메시지 언어
     * @param {string|null} replyToId 답장 대상 메시지 ID
     * @param {boolean} isAnnouncement 공지사항 여부
     * @returns {Promise<{success: boolean, messageId: string|null}>} 전송 결과
     */
    async sendMessage(content, language, replyToId = null, isAnnouncement = false) {
        if (!this.currentRoomId) {
            return { success: false, messageId: null };
        }
        
        const currentUser = userService.getCurrentUser();
        if (!currentUser) {
            return { success: false, messageId: null };
        }
        
        try {
            // 공지사항 형식 확인 (/공지 접두사)
            if (content.startsWith('/공지 ') || content.startsWith('/notice ')) {
                content = content.replace(/^\/(?:공지|notice) /, '');
                isAnnouncement = true;
            }
            
            // 메시지 전송
            const result = await dbService.sendMessage(
                this.currentRoomId,
                currentUser.id,
                currentUser.username,
                content,
                language,
                replyToId,
                isAnnouncement
            );
            
            // 사용자 활동 시간 업데이트
            await userService.updateActivity();
            
            return result;
        } catch (error) {
            console.error('Error sending message:', error);
            
            if (this.onErrorOccurred) {
                this.onErrorOccurred('error-sending');
            }
            
            return { success: false, messageId: null };
        }
    }

    /**
     * 특정 메시지 가져오기
     * @param {string} messageId 메시지 ID
     * @returns {Promise<Object|null>} 메시지 정보
     */
    async getMessage(messageId) {
        // 메모리에서 먼저 찾기
        const cachedMessage = this.messages.find(msg => msg.id === messageId);
        if (cachedMessage) {
            return cachedMessage;
        }
        
        // 데이터베이스에서 찾기
        return await dbService.getMessage(messageId);
    }

    /**
     * 메시지 번역
     * @param {string} messageId 메시지 ID
     * @param {string} targetLanguage 대상 언어
     * @returns {Promise<{success: boolean, translation: string}>} 번역 결과
     */
    async translateMessage(messageId, targetLanguage) {
        try {
            // 데이터베이스에 저장된 번역 확인
            const savedTranslation = await dbService.getTranslation(messageId, targetLanguage);
            if (savedTranslation) {
                return { success: true, translation: savedTranslation };
            }
            
            // 메시지 가져오기
            const message = await this.getMessage(messageId);
            if (!message) {
                return { success: false, translation: '' };
            }
            
            // 원본 언어와 대상 언어가 같으면 번역하지 않음
            if (message.language === targetLanguage) {
                return { success: true, translation: message.content };
            }
            
            // 번역 요청
            const result = await translationService.translateText(
                message.content,
                targetLanguage,
                message.language
            );
            
            if (!result.success) {
                throw new Error('Translation failed');
            }
            
            // 번역 결과 저장
            await dbService.saveTranslation(messageId, targetLanguage, result.translation);
            
            return { success: true, translation: result.translation };
        } catch (error) {
            console.error(`Error translating message ${messageId}:`, error);
            
            if (this.onErrorOccurred) {
                this.onErrorOccurred('error-translating');
            }
            
            return { success: false, translation: '' };
        }
    }

    /**
     * 모든 메시지 가져오기
     * @returns {Array} 메시지 목록
     */
    getMessages() {
        return this.messages;
    }

    /**
     * 새 메시지 처리
     * @param {Object} message 새 메시지
     * @private
     */
    handleNewMessage(message) {
        // 이미 있는 메시지인지 확인
        const existingIndex = this.messages.findIndex(msg => msg.id === message.id);
        if (existingIndex >= 0) {
            // 이미 있는 메시지면 업데이트
            this.messages[existingIndex] = message;
        } else {
            // 새 메시지면 추가
            this.messages.push(message);
        }
        
        // 콜백 호출
        if (this.onNewMessage) {
            this.onNewMessage(message);
        }
    }

    /**
     * 사용자 입장 처리
     * @param {Object} user 입장한 사용자
     * @private
     */
    handleUserJoin(user) {
        // 사용자 목록에 추가
        userService.addUser(user);
        
        // 콜백 호출
        if (this.onUserJoin) {
            this.onUserJoin(user);
        }
    }

    /**
     * 사용자 퇴장 처리
     * @param {Object} user 퇴장한 사용자
     * @private
     */
    handleUserLeave(user) {
        // 사용자 목록에서 제거
        userService.removeUser(user.id);
        
        // 콜백 호출
        if (this.onUserLeave) {
            this.onUserLeave(user);
        }
    }

    /**
     * 새 메시지 콜백 설정
     * @param {Function} callback 새 메시지 수신 시 호출될 콜백 함수
     */
    setNewMessageCallback(callback) {
        this.onNewMessage = callback;
    }

    /**
     * 메시지 히스토리 콜백 설정
     * @param {Function} callback 메시지 히스토리 로드 시 호출될 콜백 함수
     */
    setMessageHistoryCallback(callback) {
        this.onMessageHistoryLoaded = callback;
    }

    /**
     * 사용자 입장 콜백 설정
     * @param {Function} callback 사용자 입장 시 호출될 콜백 함수
     */
    setUserJoinCallback(callback) {
        this.onUserJoin = callback;
    }

    /**
     * 사용자 퇴장 콜백 설정
     * @param {Function} callback 사용자 퇴장 시 호출될 콜백 함수
     */
    setUserLeaveCallback(callback) {
        this.onUserLeave = callback;
    }

    /**
     * 오류 콜백 설정
     * @param {Function} callback 오류 발생 시 호출될 콜백 함수
     */
    setErrorCallback(callback) {
        this.onErrorOccurred = callback;
    }
}

// 싱글톤 인스턴스 생성
const chatService = new ChatService();
