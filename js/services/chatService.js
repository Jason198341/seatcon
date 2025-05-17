/**
 * 채팅 서비스
 * 메시지 전송, 수신, 번역 등 채팅 기능을 처리합니다.
 */

class ChatService {
    constructor() {
        this.currentRoomId = null;
        this.messages = [];
        this.translations = {}; // 메시지 번역 캐시
        this.onNewMessage = null;
        this.onUserJoin = null;
        this.onUserLeave = null;
    }

    /**
     * 채팅방 설정
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<boolean>} 설정 성공 여부
     */
    async setRoom(roomId) {
        try {
            console.log('Setting up chat room:', roomId);
            
            // 이전 구독 해제
            if (this.currentRoomId) {
                this.leaveRoom();
            }
            
            this.currentRoomId = roomId;
            
            // 최근 메시지 로드
            await this.loadRecentMessages();
            
            // 실시간 구독 설정
            await this.setupRealtimeSubscription();
            
            console.log('Chat room setup completed');
            return true;
        } catch (error) {
            console.error('Error setting up chat room:', error);
            this.currentRoomId = null;
            return false;
        }
    }

    /**
     * 채팅방 퇴장
     */
    leaveRoom() {
        console.log('Leaving chat room');
        
        // 실시간 구독 해제
        realtimeService.unsubscribeFromCurrentRoom();
        
        // 상태 초기화
        this.currentRoomId = null;
        this.messages = [];
        this.translations = {};
    }

    /**
     * 최근 메시지 로드
     * @param {number} limit 로드할 메시지 수
     * @returns {Promise<boolean>} 로드 성공 여부
     * @private
     */
    async loadRecentMessages(limit = 50) {
        if (!this.currentRoomId) {
            return false;
        }
        
        try {
            console.log('Loading recent messages for room:', this.currentRoomId);
            
            const messages = await dbService.getRecentMessages(this.currentRoomId, limit);
            this.messages = messages;
            
            console.log('Loaded messages:', messages.length);
            return true;
        } catch (error) {
            console.error('Error loading recent messages:', error);
            return false;
        }
    }

    /**
     * 실시간 구독 설정
     * @returns {Promise<boolean>} 설정 성공 여부
     * @private
     */
    async setupRealtimeSubscription() {
        if (!this.currentRoomId) {
            return false;
        }
        
        try {
            // 메시지 수신 콜백 설정
            realtimeService.setMessageCallback(async (message) => {
                // 메시지 추가
                this.messages.push(message);
                
                // 현재 언어로 번역
                const translatedMessage = await this.translateMessage(
                    message,
                    i18nService.getCurrentLanguage()
                );
                
                // 콜백 호출
                if (this.onNewMessage) {
                    this.onNewMessage(translatedMessage);
                }
            });
            
            // 사용자 입장 콜백 설정
            realtimeService.setUserJoinCallback((user) => {
                if (this.onUserJoin) {
                    this.onUserJoin(user);
                }
            });
            
            // 사용자 퇴장 콜백 설정
            realtimeService.setUserLeaveCallback((user) => {
                if (this.onUserLeave) {
                    this.onUserLeave(user);
                }
            });
            
            // 구독 시작
            await realtimeService.subscribeToRoomMessages(this.currentRoomId);
            
            return true;
        } catch (error) {
            console.error('Error setting up realtime subscription:', error);
            return false;
        }
    }

    /**
     * 메시지 전송
     * @param {string} content 메시지 내용
     * @param {string} language 메시지 언어
     * @param {string|null} replyToId 답장 대상 메시지 ID
     * @returns {Promise<{success: boolean, messageId: string|null}>} 전송 결과
     */
    async sendMessage(content, language, replyToId = null) {
        if (!this.currentRoomId) {
            return { success: false, messageId: null };
        }
        
        try {
            const currentUser = userService.getCurrentUser();
            
            if (!currentUser) {
                return { success: false, messageId: null };
            }
            
            // 공지사항 여부 확인 (관리자만 사용 가능한 기능)
            let isAnnouncement = false;
            if (content.startsWith('/공지 ') || content.startsWith('/notice ')) {
                // 실제로는 관리자 권한 확인이 필요하지만, 데모에서는 생략
                isAnnouncement = true;
                content = content.replace(/^\/공지\s+|^\/notice\s+/, '');
            }
            
            console.log('Sending message:', {
                content: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                language,
                replyToId,
                isAnnouncement
            });
            
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
            
            return result;
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, messageId: null };
        }
    }

    /**
     * 메시지 번역
     * @param {Object} message 메시지 객체
     * @param {string} targetLanguage 대상 언어
     * @returns {Promise<Object>} 번역된 메시지
     */
    async translateMessage(message, targetLanguage) {
        try {
            // 원본 언어와 대상 언어가 같으면 번역하지 않음
            if (message.language === targetLanguage) {
                return { ...message, translated: false };
            }
            
            // 캐시 키 생성
            const cacheKey = `${message.id}_${targetLanguage}`;
            
            // 캐시된 번역이 있으면 반환
            if (this.translations[cacheKey]) {
                return {
                    ...message,
                    translated: true,
                    translatedContent: this.translations[cacheKey],
                    targetLanguage
                };
            }
            
            // 데이터베이스에 저장된 번역 확인
            const dbTranslation = await dbService.getTranslation(message.id, targetLanguage);
            
            if (dbTranslation) {
                // 캐시에 저장
                this.translations[cacheKey] = dbTranslation;
                
                return {
                    ...message,
                    translated: true,
                    translatedContent: dbTranslation,
                    targetLanguage
                };
            }
            
            // 번역 API 호출
            const translationResult = await translationService.translateText(
                message.content,
                targetLanguage,
                message.language
            );
            
            if (!translationResult.success) {
                return { ...message, translated: false };
            }
            
            // 번역 결과 저장
            await dbService.saveTranslation(message.id, targetLanguage, translationResult.translation);
            
            // 캐시에 저장
            this.translations[cacheKey] = translationResult.translation;
            
            return {
                ...message,
                translated: true,
                translatedContent: translationResult.translation,
                targetLanguage
            };
        } catch (error) {
            console.error('Error translating message:', error);
            return { ...message, translated: false };
        }
    }

    /**
     * 최근 메시지 가져오기
     * @param {number} limit 가져올 메시지 수
     * @returns {Promise<Array>} 메시지 목록
     */
    async getRecentMessages(limit = 50) {
        // 현재 언어
        const currentLanguage = i18nService.getCurrentLanguage();
        
        // 메시지가 없거나 요청 수가 더 많으면 다시 로드
        if (this.messages.length === 0 || this.messages.length < limit) {
            await this.loadRecentMessages(limit);
        }
        
        // 메시지 수에 맞게 슬라이스
        const recentMessages = this.messages.slice(-limit);
        
        // 메시지 번역
        const translatedMessages = await Promise.all(
            recentMessages.map(msg => this.translateMessage(msg, currentLanguage))
        );
        
        return translatedMessages;
    }

    /**
     * 특정 메시지 가져오기
     * @param {string} messageId 메시지 ID
     * @returns {Promise<Object|null>} 메시지 객체
     */
    async getMessage(messageId) {
        // 로컬 캐시에서 먼저 확인
        const cachedMessage = this.messages.find(msg => msg.id === messageId);
        
        if (cachedMessage) {
            return cachedMessage;
        }
        
        // 데이터베이스에서 조회
        try {
            return await dbService.getMessage(messageId);
        } catch (error) {
            console.error('Error getting message:', error);
            return null;
        }
    }

    /**
     * 메시지 수신 콜백 설정
     * @param {Function} callback 콜백 함수
     */
    setMessageCallback(callback) {
        this.onNewMessage = callback;
    }

    /**
     * 사용자 입장 콜백 설정
     * @param {Function} callback 콜백 함수
     */
    setUserJoinCallback(callback) {
        this.onUserJoin = callback;
    }

    /**
     * 사용자 퇴장 콜백 설정
     * @param {Function} callback 콜백 함수
     */
    setUserLeaveCallback(callback) {
        this.onUserLeave = callback;
    }

    /**
     * 현재 채팅방 ID 가져오기
     * @returns {string|null} 채팅방 ID
     */
    getCurrentRoomId() {
        return this.currentRoomId;
    }
}

// 싱글톤 인스턴스 생성
const chatService = new ChatService();
