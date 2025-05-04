/**
 * 채팅 관리 서비스
 * 채팅 메시지 송수신 및 번역 관리
 */
class ChatManager {
    /**
     * 채팅 관리자 생성자
     * @param {Object} supabaseClient - Supabase 클라이언트
     * @param {Object} translationService - 번역 서비스
     * @param {Object} dataManager - 데이터 관리자
     * @param {Object} userService - 사용자 서비스
     * @param {Object} config - 애플리케이션 설정
     * @param {Object} logger - 로거 서비스
     */
    constructor(supabaseClient, translationService, dataManager, userService, config, logger) {
        this.supabaseClient = supabaseClient;
        this.translationService = translationService;
        this.dataManager = dataManager;
        this.userService = userService;
        this.config = config;
        this.logger = logger || console;
        this.messages = [];
        this.typingUsers = new Map();
        this.typingIndicatorTimeout = null;
        this.hasSentMessagesFlag = false;
        this.listeners = {
            onNewMessage: null,
            onMessageTranslated: null,
            onUserTyping: null,
            onLikeUpdate: null,
        };
    }

    /**
     * 채팅 관리자 초기화
     * @returns {Promise<boolean>} - 초기화 성공 여부
     */
    async init() {
        try {
            this.logger.info('채팅 관리자 초기화 중...');
            
            // 메시지 이력 로드
            await this.loadMessages();
            
            // 실시간 메시지 구독 설정
            this.subscribeToMessages();
            
            // 실시간 좋아요 구독 설정
            this.subscribeToLikes();
            
            this.logger.info('채팅 관리자 초기화 완료');
            return true;
        } catch (error) {
            this.logger.error('채팅 관리자 초기화 중 오류 발생:', error);
            throw new Error('채팅 초기화에 실패했습니다.');
        }
    }

    /**
     * 더미 메시지 생성 (개발 환경용)
     * @returns {Array} - 더미 메시지 목록
     */
    createDummyMessages() {
        if (!this.config.DEBUG.ENABLED) return [];
        
        this.logger.info('개발 환경용 더미 메시지 생성 중...');
        
        const currentUser = this.userService.getCurrentUser();
        
        if (!currentUser) {
            this.logger.warn('현재 사용자 정보가 없어 더미 메시지를 생성할 수 없습니다.');
            return [];
        }
        
        const dummyUsers = [
            { name: '관리자', email: 'admin@example.com', role: 'staff', language: 'ko' },
            { name: '발표자', email: 'presenter@example.com', role: 'presenter', language: 'ko' },
            { name: '전시자', email: 'exhibitor@example.com', role: 'exhibitor', language: 'ko' },
            { name: 'John Smith', email: 'john@example.com', role: 'attendee', language: 'en' },
            { name: '山田太郎', email: 'yamada@example.com', role: 'attendee', language: 'ja' },
        ];
        
        const dummyMessages = [
            {
                id: 'dummy-1',
                speaker_id: 'global-chat',
                author_name: '관리자',
                author_email: 'admin@example.com',
                content: '컴퍼런스 채팅 방을 시작합니다. 환영합니다!',
                created_at: new Date(Date.now() - 3600000).toISOString(),
                user_role: 'staff',
                language: 'ko'
            },
            {
                id: 'dummy-2',
                speaker_id: 'global-chat',
                author_name: 'John Smith',
                author_email: 'john@example.com',
                content: 'Hello everyone! I\'m excited for this conference.',
                created_at: new Date(Date.now() - 3300000).toISOString(),
                user_role: 'attendee',
                language: 'en'
            },
            {
                id: 'dummy-3',
                speaker_id: 'global-chat',
                author_name: '山田太郎',
                author_email: 'yamada@example.com',
                content: 'よろしくお願いします！',
                created_at: new Date(Date.now() - 3000000).toISOString(),
                user_role: 'attendee',
                language: 'ja'
            },
            {
                id: 'dummy-4',
                speaker_id: 'global-chat',
                author_name: '발표자',
                author_email: 'presenter@example.com',
                content: '오늘 2시에 있는 발표에 많은 관심 부탁드립니다!',
                created_at: new Date(Date.now() - 2700000).toISOString(),
                user_role: 'presenter',
                language: 'ko'
            },
            {
                id: 'dummy-5',
                speaker_id: 'global-chat',
                author_name: '전시자',
                author_email: 'exhibitor@example.com',
                content: '부스 B-03에서 특별 이벤트를 진행하고 있습니다. 관심있으신 분들은 부스로 오세요!',
                created_at: new Date(Date.now() - 2400000).toISOString(),
                user_role: 'exhibitor',
                language: 'ko'
            },
            {
                id: 'dummy-6',
                speaker_id: 'global-chat',
                author_name: currentUser.name,
                author_email: currentUser.email,
                content: '안녕하세요! 반갑습니다 :)',
                created_at: new Date(Date.now() - 2100000).toISOString(),
                user_role: currentUser.role,
                language: currentUser.language
            },
            {
                id: 'dummy-7',
                speaker_id: 'global-chat',
                author_name: '관리자',
                author_email: 'admin@example.com',
                content: '점심 시간은 12시부터 1시 30분까지입니다. 승강관 1층에 식당이 있습니다.',
                created_at: new Date(Date.now() - 1800000).toISOString(),
                user_role: 'staff',
                language: 'ko'
            },
        ];
        
        this.logger.info(`${dummyMessages.length}개의 더미 메시지를 생성했습니다.`);
        return dummyMessages;
    }

    /**
     * 메시지 이력 로드
     * @param {number} limit - 로드할 메시지 수 제한
     * @returns {Promise<Array>} - 로드된 메시지 목록
     */
    async loadMessages(limit = this.config.CHAT.MESSAGE_LOAD_LIMIT) {
        try {
            this.logger.info(`메시지 이력 로드 중... (최대 ${limit}개)`);
            
            // Supabase에서 메시지 가져오기
            const messages = await this.supabaseClient.getMessages(limit);
            
            this.messages = messages || [];
            this.logger.info(`${this.messages.length}개 메시지를 로드했습니다.`);
            
            // 개발 환경에서는 더미 메시지 사용
            if (this.config.DEBUG.ENABLED && this.messages.length === 0) {
                this.messages = this.createDummyMessages();
                this.logger.info(`개발 환경용 더미 메시지 ${this.messages.length}개를 로드했습니다.`);
            }
            
            // 현재 사용자 언어로 메시지 번역
            if (this.config.CHAT.AUTO_TRANSLATION && this.userService.getCurrentUser()) {
                const currentUserLanguage = this.userService.getCurrentUser().language;
                
                for (const message of this.messages) {
                    if (message.language !== currentUserLanguage) {
                        await this.translateMessage(message, currentUserLanguage);
                    }
                }
            }
            
            return this.messages;
        } catch (error) {
            this.logger.error('메시지 이력 로드 중 오류 발생:', error);
            
            // 개발 환경에서는 더미 메시지 사용
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 메시지 로드 오류를 무시하고 더미 메시지를 사용합니다.');
                this.messages = this.createDummyMessages();
                return this.messages;
            }
            
            throw new Error('메시지 이력을 로드하는데 실패했습니다.');
        }
    }

    /**
     * 메시지 전송
     * @param {string} content - 메시지 내용
     * @returns {Promise<Object|null>} - 전송된 메시지 또는 null
     */
    async sendMessage(content) {
        try {
            if (!content.trim()) {
                this.logger.warn('빈 메시지는 전송할 수 없습니다.');
                return null;
            }
            
            if (content.length > this.config.CHAT.MAX_MESSAGE_LENGTH) {
                this.logger.warn(`메시지 길이가 최대 길이(${this.config.CHAT.MAX_MESSAGE_LENGTH}자)를 초과합니다.`);
                throw new Error(`메시지 길이가 최대 길이(${this.config.CHAT.MAX_MESSAGE_LENGTH}자)를 초과합니다.`);
            }
            
            const currentUser = this.userService.getCurrentUser();
            
            if (!currentUser) {
                this.logger.warn('로그인한 사용자 정보가 없어 메시지를 전송할 수 없습니다.');
                throw new Error('로그인이 필요합니다.');
            }
            
            // 메시지 언어 감지
            const language = await this.translationService.detectLanguage(content);
            
            // Supabase에 메시지 전송
            const message = await this.supabaseClient.sendMessage(content);
            
            if (message) {
                // 전송된 메시지를 로컬 메시지 목록에 추가
                this.messages.push(message);
                
                // 메시지 전송 플래그 설정
                this.hasSentMessagesFlag = true;
                
                // 메시지 전송 이벤트 발생
                if (this.listeners.onNewMessage) {
                    this.listeners.onNewMessage(message);
                }
                
                this.logger.info('메시지 전송 완료:', message);
            }
            
            return message;
        } catch (error) {
            this.logger.error('메시지 전송 중 오류 발생:', error);
            
            // 개발 환경에서는 더미 메시지 생성
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 메시지 전송 오류를 무시하고 가상 메시지를 생성합니다.');
                
                const currentUser = this.userService.getCurrentUser();
                const mockMessage = {
                    id: 'mock-' + Date.now(),
                    speaker_id: 'global-chat',
                    author_name: currentUser.name,
                    author_email: currentUser.email,
                    content: content,
                    client_generated_id: Date.now().toString(),
                    user_role: currentUser.role,
                    language: currentUser.language,
                    created_at: new Date().toISOString()
                };
                
                // 가상 메시지를 로컬 메시지 목록에 추가
                this.messages.push(mockMessage);
                
                // 메시지 전송 플래그 설정
                this.hasSentMessagesFlag = true;
                
                // 메시지 전송 이벤트 발생
                if (this.listeners.onNewMessage) {
                    this.listeners.onNewMessage(mockMessage);
                }
                
                this.logger.info('개발 환경에서 가상 메시지 생성 완료:', mockMessage);
                return mockMessage;
            }
            
            throw error;
        }
    }

    /**
     * 시스템 메시지 전송
     * @param {string} content - 메시지 내용
     * @returns {Promise<Object|null>} - 전송된 메시지 또는 null
     */
    async sendSystemMessage(content) {
        try {
            if (!content.trim()) {
                this.logger.warn('빈 시스템 메시지는 전송할 수 없습니다.');
                return null;
            }
            
            // 시스템 메시지용 객체 생성
            const systemMessage = {
                id: Date.now().toString(),
                content,
                created_at: new Date().toISOString(),
                system_message: true,
            };
            
            // 메시지 목록에 추가
            this.messages.push(systemMessage);
            
            // 시스템 메시지 이벤트 발생
            if (this.listeners.onNewMessage) {
                this.listeners.onNewMessage(systemMessage);
            }
            
            this.logger.info('시스템 메시지 전송 완료:', systemMessage);
            return systemMessage;
        } catch (error) {
            this.logger.error('시스템 메시지 전송 중 오류 발생:', error);
            return null;
        }
    }

    /**
     * 메시지 번역
     * @param {Object} message - 번역할 메시지
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Object>} - 번역된 메시지
     */
    async translateMessage(message, targetLanguage) {
        try {
            if (!message || !message.content || !message.language) {
                this.logger.warn('번역할 메시지 정보가 올바르지 않습니다.');
                return message;
            }
            
            if (message.language === targetLanguage) {
                // 이미 대상 언어로 작성된 메시지
                return message;
            }
            
            this.logger.debug(`메시지 번역 중: ${message.language} -> ${targetLanguage}`);
            
            // 번역 서비스를 통해 번역
            const translatedContent = await this.translationService.translateText(
                message.content,
                message.language,
                targetLanguage
            );
            
            // 번역된 메시지 객체 생성
            const translatedMessage = {
                ...message,
                translatedContent,
                translatedLanguage: targetLanguage,
            };
            
            // 번역 완료 이벤트 발생
            if (this.listeners.onMessageTranslated) {
                this.listeners.onMessageTranslated(translatedMessage);
            }
            
            this.logger.debug('메시지 번역 완료:', translatedMessage);
            return translatedMessage;
        } catch (error) {
            this.logger.error('메시지 번역 중 오류 발생:', error);
            return message;
        }
    }

    /**
     * 모든 메시지 번역
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Array>} - 번역된 메시지 목록
     */
    async translateAllMessages(targetLanguage) {
        try {
            this.logger.info(`모든 메시지를 ${targetLanguage}로 번역 중...`);
            
            const translatedMessages = [];
            
            for (const message of this.messages) {
                if (message.system_message) {
                    // 시스템 메시지는 번역하지 않음
                    translatedMessages.push(message);
                    continue;
                }
                
                if (message.language !== targetLanguage) {
                    const translatedMessage = await this.translateMessage(message, targetLanguage);
                    translatedMessages.push(translatedMessage);
                } else {
                    translatedMessages.push(message);
                }
            }
            
            this.logger.info(`${translatedMessages.length}개 메시지 번역 완료`);
            return translatedMessages;
        } catch (error) {
            this.logger.error('모든 메시지 번역 중 오류 발생:', error);
            throw new Error('메시지 번역에 실패했습니다.');
        }
    }

    /**
     * 언어 변경
     * @param {string} language - 언어 코드
     * @returns {Promise<boolean>} - 성공 여부
     */
    async changeLanguage(language) {
        try {
            this.logger.info(`채팅 언어를 ${language}로 변경 중...`);
            
            // 사용자 서비스를 통해 사용자 언어 설정 변경
            const success = this.userService.changeLanguage(language);
            
            if (success && this.config.CHAT.AUTO_TRANSLATION) {
                // 모든 메시지를 새 언어로 번역
                await this.translateAllMessages(language);
            }
            
            this.logger.info(`채팅 언어 변경 완료: ${language}`);
            return true;
        } catch (error) {
            this.logger.error('채팅 언어 변경 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 타이핑 상태 알림
     * @returns {Promise<void>}
     */
    async notifyTyping() {
        try {
            const currentUser = this.userService.getCurrentUser();
            
            if (!currentUser) return;
            
            // Supabase 클라이언트를 통해 타이핑 상태 알림
            await this.supabaseClient.notifyTyping();
            
            this.logger.debug(`사용자 ${currentUser.name}이(가) 타이핑 중...`);
        } catch (error) {
            this.logger.error('타이핑 상태 알림 중 오류 발생:', error);
        }
    }

    /**
     * 타이핑 사용자 추가
     * @param {Object} user - 타이핑 중인 사용자
     */
    addTypingUser(user) {
        if (!user || !user.email) return;
        
        // 현재 사용자인 경우 무시
        const currentUser = this.userService.getCurrentUser();
        if (currentUser && user.email === currentUser.email) return;
        
        // 타이핑 사용자 목록에 추가
        this.typingUsers.set(user.email, {
            ...user,
            timestamp: Date.now(),
        });
        
        // 타이핑 인디케이터 업데이트
        this.updateTypingIndicator();
        
        // 타이핑 인디케이터 타임아웃 설정
        this.resetTypingIndicatorTimeout();
    }

    /**
     * 타이핑 인디케이터 타임아웃 리셋
     */
    resetTypingIndicatorTimeout() {
        // 기존 타임아웃 클리어
        if (this.typingIndicatorTimeout) {
            clearTimeout(this.typingIndicatorTimeout);
        }
        
        // 새 타임아웃 설정
        this.typingIndicatorTimeout = setTimeout(() => {
            // 타이핑 인디케이터 숨기기
            this.clearTypingUsers();
        }, this.config.CHAT.TYPING_INDICATOR_TIMEOUT);
    }

    /**
     * 타이핑 사용자 목록 초기화
     */
    clearTypingUsers() {
        this.typingUsers.clear();
        
        // 타이핑 인디케이터 업데이트
        this.updateTypingIndicator();
    }

    /**
     * 타이핑 인디케이터 업데이트
     */
    updateTypingIndicator() {
        // 타이핑 중인 사용자가 있는 경우
        if (this.typingUsers.size > 0) {
            const typingUsersArray = Array.from(this.typingUsers.values());
            
            // 타이핑 중인 사용자 이벤트 발생
            if (this.listeners.onUserTyping) {
                this.listeners.onUserTyping(typingUsersArray);
            }
        } else {
            // 타이핑 중인 사용자 없음 이벤트 발생
            if (this.listeners.onUserTyping) {
                this.listeners.onUserTyping([]);
            }
        }
    }

    /**
     * 메시지 좋아요 추가/취소
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<boolean>} - 좋아요 추가 성공 여부 (true: 추가, false: 취소)
     */
    async toggleLike(messageId) {
        try {
            const currentUser = this.userService.getCurrentUser();
            
            if (!currentUser) {
                this.logger.warn('로그인한 사용자 정보가 없어 좋아요를 할 수 없습니다.');
                throw new Error('로그인이 필요합니다.');
            }
            
            // 이미 좋아요한 메시지인지 확인
            const likes = await this.supabaseClient.getLikes(messageId);
            const alreadyLiked = likes.some(like => like.user_email === currentUser.email);
            
            if (alreadyLiked) {
                // 좋아요 취소
                await this.supabaseClient.removeLike(messageId);
                this.logger.info(`메시지 ${messageId}의 좋아요 취소`);
                return false;
            } else {
                // 좋아요 추가
                await this.supabaseClient.addLike(messageId);
                this.logger.info(`메시지 ${messageId}에 좋아요 추가`);
                return true;
            }
        } catch (error) {
            this.logger.error('좋아요 처리 중 오류 발생:', error);
            throw new Error('좋아요 처리에 실패했습니다.');
        }
    }

    /**
     * 메시지 좋아요 정보 가져오기
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<Array>} - 좋아요 목록
     */
    async getLikes(messageId) {
        try {
            return await this.supabaseClient.getLikes(messageId);
        } catch (error) {
            this.logger.error('좋아요 목록 가져오기 중 오류 발생:', error);
            return [];
        }
    }

    /**
     * 메시지 좋아요 여부 확인
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<boolean>} - 좋아요 여부
     */
    async hasLiked(messageId) {
        try {
            const currentUser = this.userService.getCurrentUser();
            
            if (!currentUser) return false;
            
            const likes = await this.supabaseClient.getLikes(messageId);
            return likes.some(like => like.user_email === currentUser.email);
        } catch (error) {
            this.logger.error('좋아요 여부 확인 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 실시간 메시지 구독
     */
    subscribeToMessages() {
        this.supabaseClient.subscribeToMessages(async (event, payload) => {
            if (event === 'new_message') {
                this.logger.info('새 메시지 수신:', payload);
                
                // 중복 메시지 체크
                const isDuplicate = this.messages.some(msg => msg.id === payload.id);
                
                if (!isDuplicate) {
                    // 메시지 목록에 추가
                    this.messages.push(payload);
                    
                    // 현재 사용자 언어로 메시지 번역
                    if (
                        this.config.CHAT.AUTO_TRANSLATION && 
                        this.userService.getCurrentUser() && 
                        payload.language !== this.userService.getCurrentUser().language
                    ) {
                        const translatedMessage = await this.translateMessage(
                            payload,
                            this.userService.getCurrentUser().language
                        );
                        
                        // 이벤트 처리
                        if (this.listeners.onNewMessage) {
                            this.listeners.onNewMessage(translatedMessage);
                        }
                    } else {
                        // 이벤트 처리
                        if (this.listeners.onNewMessage) {
                            this.listeners.onNewMessage(payload);
                        }
                    }
                    
                    // 메시지 수신 시 타이핑 사용자 제거
                    if (payload.author_email) {
                        this.typingUsers.delete(payload.author_email);
                        this.updateTypingIndicator();
                    }
                }
            }
        });
    }

    /**
     * 실시간 좋아요 구독
     */
    subscribeToLikes() {
        this.supabaseClient.subscribeToLikes(async (event, payload) => {
            if (event === 'new_like' || event === 'remove_like') {
                this.logger.info(`좋아요 이벤트 수신: ${event}`, payload);
                
                // 좋아요 업데이트 이벤트 발생
                if (this.listeners.onLikeUpdate) {
                    this.listeners.onLikeUpdate(event, payload);
                }
            }
        });
    }

    /**
     * 이벤트 리스너 등록
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = callback;
        }
    }

    /**
     * 이벤트 리스너 제거
     * @param {string} event - 이벤트 이름
     */
    off(event) {
        if (this.listeners[event]) {
            this.listeners[event] = null;
        }
    }

    /**
     * 메시지 전송 여부 확인
     * @returns {boolean} - 메시지 전송 여부
     */
    get hasSentMessages() {
        return this.hasSentMessagesFlag;
    }
}
