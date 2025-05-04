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
        this.processedMessageIds = new Set(); // 처리된 메시지 ID 추적
        this.typingUsers = new Map();
        this.typingIndicatorTimeout = null;
        this.hasSentMessagesFlag = false;
        this.messageBuffer = [];
        this.isProcessingBuffer = false;
        this.messagesPendingTranslation = new Map(); // 번역 대기 중인 메시지
        this.listeners = {
            onNewMessage: null,
            onMessageTranslated: null,
            onUserTyping: null,
            onLikeUpdate: null,
            onConnectionStatusChange: null,
            onMessageSendStart: null,
            onMessageSendSuccess: null,
            onMessageSendFailed: null,
        };
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3초
        this.setupSupabaseEventListeners();
    }

    /**
     * Supabase 이벤트 리스너 설정
     */
    setupSupabaseEventListeners() {
        if (typeof window === 'undefined') return;
        
        // 연결 관련 이벤트
        window.addEventListener('connection:established', (event) => {
            this.logger.info('Supabase 연결 성공', event.detail);
            this.updateConnectionStatus(true);
            
            // 메시지 버퍼 처리
            if (this.messageBuffer.length > 0) {
                this.processMessageBuffer();
            }
        });
        
        window.addEventListener('connection:failed', (event) => {
            this.logger.warn('Supabase 연결 실패', event.detail);
            this.updateConnectionStatus(false);
        });
        
        window.addEventListener('connection:reconnecting', (event) => {
            this.logger.info('Supabase 재연결 시도 중...', event.detail);
        });
        
        window.addEventListener('connection:lost', (event) => {
            this.logger.warn('Supabase 연결 끊김', event.detail);
            this.updateConnectionStatus(false);
        });
        
        window.addEventListener('connection:restored', (event) => {
            this.logger.info('Supabase 연결 복구됨', event.detail);
            this.updateConnectionStatus(true);
        });
        
        // 메시지 관련 이벤트
        window.addEventListener('message:queued', (event) => {
            this.logger.info('메시지 대기열에 추가됨', event.detail);
        });
        
        window.addEventListener('message:send:start', (event) => {
            this.logger.info('메시지 전송 시작', event.detail);
            
            // 이벤트 리스너 호출
            if (this.listeners.onMessageSendStart) {
                this.listeners.onMessageSendStart(event.detail);
            }
        });
        
        window.addEventListener('message:send:success', (event) => {
            this.logger.info('메시지 전송 성공', event.detail);
            
            // 이벤트 리스너 호출
            if (this.listeners.onMessageSendSuccess) {
                this.listeners.onMessageSendSuccess(event.detail);
            }
        });
        
        window.addEventListener('message:send:failed', (event) => {
            this.logger.error('메시지 전송 실패', event.detail);
            
            // 이벤트 리스너 호출
            if (this.listeners.onMessageSendFailed) {
                this.listeners.onMessageSendFailed(event.detail);
            }
        });
        
        window.addEventListener('message:received', (event) => {
            this.logger.info('새 메시지 수신', event.detail);
        });
        
        // 좋아요 관련 이벤트
        window.addEventListener('like:add', (event) => {
            this.logger.info('좋아요 추가됨', event.detail);
        });
        
        window.addEventListener('like:remove', (event) => {
            this.logger.info('좋아요 취소됨', event.detail);
        });
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
            
            // 연결 상태 모니터링 시작
            this.startConnectionMonitoring();
            
            this.logger.info('채팅 관리자 초기화 완료');
            return true;
        } catch (error) {
            this.logger.error('채팅 관리자 초기화 중 오류 발생:', error);
            this.handleConnectionError(error);
            throw new Error('채팅 초기화에 실패했습니다.');
        }
    }

    /**
     * 관리자 공지사항 메시지 전송
     * @param {string} content - 메시지 내용
     * @returns {Promise<Object|null>} - 전송된 메시지 또는 null
     */
    async sendAnnouncement(content) {
        try {
            if (!this.userService.isAdmin()) {
                this.logger.warn('관리자만 공지사항을 보낼 수 있습니다.');
                throw new Error('관리자 권한이 필요합니다.');
            }
            
            if (!content.trim()) {
                this.logger.warn('빈 공지사항은 전송할 수 없습니다.');
                return null;
            }
            
            // 시스템 메시지 전송 (전송 중)
            const sendingSystemMessage = this.sendSystemMessage('공지사항을 전송 중입니다...');
            
            // 공지사항 접두사 추가
            const announcementContent = `${this.config.ADMIN.ANNOUNCEMENT_PREFIX} ${content}`;
            
            // Supabase 클라이언트를 통해 공지사항 전송
            const message = await this.supabaseClient.sendAnnouncement(announcementContent);
            
            if (message) {
                // 처리된 메시지 ID 추가
                this.processedMessageIds.add(message.id);
                if (message.client_generated_id) {
                    this.processedMessageIds.add(message.client_generated_id);
                }
                
                // 전송된 메시지를 로컬 메시지 목록에 추가
                const existingIndex = this.findMessageIndexById(message.id) || 
                    (message.client_generated_id && this.findMessageIndexByClientId(message.client_generated_id));
                
                if (existingIndex !== -1) {
                    // 기존 메시지 업데이트
                    this.messages[existingIndex] = message;
                } else {
                    // 새 메시지 추가
                    this.messages.push(message);
                }
                
                // 메시지 전송 플래그 설정
                this.hasSentMessagesFlag = true;
                
                // 메시지 전송 이벤트 발생
                if (this.listeners.onNewMessage) {
                    this.listeners.onNewMessage(message);
                }
                
                this.logger.info('공지사항 전송 완료:', message);
                return message;
            }
            
            return null;
        } catch (error) {
            this.logger.error('공지사항 전송 중 오류 발생:', error);
            
            // 연결 오류 처리
            this.handleConnectionError(error);
            
            // 시스템 메시지 전송 (실패)
            this.sendSystemMessage('공지사항 전송 실패: ' + error.message);
            
            throw error;
        }
    }

    /**
     * 모든 구독 재설정
     * @returns {Promise<boolean>} - 성공 여부
     */
    async resubscribeAll() {
        try {
            this.logger.info('모든 구독 재설정 시작...');
            
            // 메시지 구독 재설정
            this.subscribeToMessages();
            
            // 좋아요 구독 재설정
            this.subscribeToLikes();
            
            this.logger.info('구독 재설정 완료');
            return true;
        } catch (error) {
            this.logger.error('구독 재설정 중 오류:', error);
            return false;
        }
    }

    /**
     * 메시지 이력 로드
     * @param {number} limit - 로드할 메시지 수 제한
     * @returns {Promise<Array>} - 로드된 메시지 목록
     */
    async loadMessages(limit = this.config.CHAT.MESSAGE_LOAD_LIMIT) {
        try {
            this.logger.info(`메시지 이력 로드 중... (최대 ${limit}개)`);
            
            // 시스템 메시지 전송 (로딩 중)
            const loadingMessage = this.sendSystemMessage('메시지를 불러오는 중...');
            
            // Supabase에서 메시지 가져오기
            const messages = await this.supabaseClient.getMessages(limit);
            
            this.messages = messages || [];
            this.logger.info(`${this.messages.length}개 메시지를 로드했습니다.`);
            
            // 처리된 메시지 ID 추적을 위해 추가
            for (const message of this.messages) {
                this.processedMessageIds.add(message.id);
                if (message.client_generated_id) {
                    this.processedMessageIds.add(message.client_generated_id);
                }
            }
            
            // 현재 사용자 언어로 메시지 번역
            if (this.config.CHAT.AUTO_TRANSLATION && this.userService.getCurrentUser()) {
                const currentUserLanguage = this.userService.getCurrentUser().language;
                
                // 번역이 필요한 메시지 찾기
                const messagesToTranslate = this.messages.filter(
                    message => message.language && message.language !== currentUserLanguage
                );
                
                this.logger.info(`${messagesToTranslate.length}개 메시지 번역 필요`);
                
                // 번역 작업
                for (const message of messagesToTranslate) {
                    try {
                        await this.translateMessage(message, currentUserLanguage);
                    } catch (translationError) {
                        this.logger.warn(`메시지 번역 중 오류: ${message.id}`, translationError);
                        // 번역 오류 무시하고 계속 진행
                    }
                }
            }
            
            // 연결 상태 업데이트
            this.updateConnectionStatus(true);
            
            // 시스템 메시지 제거 또는 업데이트
            // (로딩이 완료되었으므로 로딩 메시지는 필요 없음)
            
            return this.messages;
        } catch (error) {
            this.logger.error('메시지 이력 로드 중 오류 발생:', error);
            
            // 연결 상태 업데이트
            this.updateConnectionStatus(false);
            
            // 시스템 메시지 전송 (실패)
            this.sendSystemMessage('메시지를 불러오는데 실패했습니다: ' + error.message);
            
            // 개발 환경에서는 빈 배열 반환
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 메시지 로드 오류를 무시하고 빈 배열을 반환합니다.');
                return [];
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
            const user = this.userService.getCurrentUser();
            if (!user) throw new Error('로그인 필요');
            const message = {
                content,
                author_name: user.name,
                author_email: user.email,
                user_role: user.role, // 역할 정보 항상 포함
                language: user.language,
                created_at: new Date().toISOString(),
            };
            
            if (!content.trim()) {
                this.logger.warn('빈 메시지는 전송할 수 없습니다.');
                return null;
            }
            
            if (content.length > this.config.CHAT.MAX_MESSAGE_LENGTH) {
                this.logger.warn(`메시지 길이가 최대 길이(${this.config.CHAT.MAX_MESSAGE_LENGTH}자)를 초과합니다.`);
                throw new Error(`메시지 길이가 최대 길이(${this.config.CHAT.MAX_MESSAGE_LENGTH}자)를 초과합니다.`);
            }
            
            // 메시지 전송 시작 이벤트 발생
            if (this.listeners.onMessageSendStart) {
                this.listeners.onMessageSendStart({
                    content,
                    language: message.language
                });
            }
            
            // 클라이언트 생성 ID
            const clientGeneratedId = Date.now().toString();
            
            // 네트워크 연결 상태 확인
            if (!this.isConnected) {
                // 오프라인 상태에서는 메시지 버퍼에 추가
                this.logger.warn('오프라인 상태입니다. 메시지를 버퍼에 추가합니다.');
                
                const offlineMessage = {
                    id: 'offline-' + clientGeneratedId,
                    speaker_id: 'global-chat',
                    author_name: user.name,
                    author_email: user.email,
                    content: content,
                    client_generated_id: clientGeneratedId,
                    user_role: user.role,
                    language: message.language,
                    created_at: new Date().toISOString(),
                    status: 'pending',
                    isOffline: true
                };
                
                // 버퍼에 추가
                this.messageBuffer.push(offlineMessage);
                
                // 로컬 메시지 처리
                this.messages.push(offlineMessage);
                
                // 메시지 전송 이벤트 발생
                if (this.listeners.onNewMessage) {
                    this.listeners.onNewMessage(offlineMessage);
                }
                
                // 메시지 전송 실패 이벤트 발생
                if (this.listeners.onMessageSendFailed) {
                    this.listeners.onMessageSendFailed({
                        message: offlineMessage,
                        error: '오프라인 상태',
                        willRetry: true
                    });
                }
                
                // 버퍼 처리 시도
                this.processMessageBuffer();
                
                return offlineMessage;
            }
            
            // Supabase에 메시지 전송
            const sentMessage = await this.supabaseClient.sendMessage(content);
            
            if (sentMessage) {
                // 처리된 메시지 ID 추적
                this.processedMessageIds.add(sentMessage.id);
                if (sentMessage.client_generated_id) {
                    this.processedMessageIds.add(sentMessage.client_generated_id);
                }
                
                // 전송된 메시지를 로컬 메시지 목록에 추가
                const existingIndex = this.findMessageIndexById(sentMessage.id) || 
                    (sentMessage.client_generated_id && this.findMessageIndexByClientId(sentMessage.client_generated_id));
                
                if (existingIndex !== -1) {
                    // 기존 메시지 업데이트
                    this.messages[existingIndex] = sentMessage;
                } else {
                    // 새 메시지 추가
                    this.messages.push(sentMessage);
                }
                
                // 메시지 전송 플래그 설정
                this.hasSentMessagesFlag = true;
                
                // 메시지 전송 이벤트 발생
                if (this.listeners.onNewMessage) {
                    this.listeners.onNewMessage(sentMessage);
                }
                
                // 메시지 전송 성공 이벤트 발생
                if (this.listeners.onMessageSendSuccess) {
                    this.listeners.onMessageSendSuccess({
                        message: sentMessage,
                        wasBuffered: false
                    });
                }
                
                this.logger.info('메시지 전송 완료:', sentMessage);
            }
            
            return sentMessage;
        } catch (error) {
            this.logger.error('메시지 전송 중 오류 발생:', error);
            
            // 연결 오류 처리
            this.handleConnectionError(error);
            
            // 메시지 전송 실패 이벤트 발생
            if (this.listeners.onMessageSendFailed) {
                this.listeners.onMessageSendFailed({
                    content,
                    error: error.message,
                    isConnectionError: this.isConnectionError(error)
                });
            }
            
            throw error;
        }
    }
    
    /**
     * ID로 메시지 인덱스 찾기
     * @param {string} messageId - 메시지 ID
     * @returns {number} - 메시지 인덱스 또는 -1
     */
    findMessageIndexById(messageId) {
        if (!messageId) return -1;
        return this.messages.findIndex(msg => msg.id === messageId);
    }
    
    /**
     * 클라이언트 ID로 메시지 인덱스 찾기
     * @param {string} clientId - 클라이언트 생성 ID
     * @returns {number} - 메시지 인덱스 또는 -1
     */
    findMessageIndexByClientId(clientId) {
        if (!clientId) return -1;
        return this.messages.findIndex(msg => msg.client_generated_id === clientId);
    }
    
    /**
     * 연결 관련 오류인지 확인
     * @param {Error} error - 오류 객체
     * @returns {boolean} - 연결 관련 오류 여부
     */
    isConnectionError(error) {
        if (!error || !error.message) return false;
        
        return (
            error.message.includes('Failed to fetch') ||
            error.message.includes('Network Error') ||
            error.message.includes('Network request failed') ||
            error.message.includes('Connection error') ||
            error.message.includes('The connection was interrupted') ||
            error.message.includes('Supabase 연결') ||
            error.message.includes('timeout') ||
            error.message.includes('시간 초과')
        );
    }

    /**
     * 메시지 버퍼 처리
     * @returns {Promise<void>}
     */
    async processMessageBuffer() {
        // 이미 처리 중이거나 버퍼가 비어있는 경우 종료
        if (this.isProcessingBuffer || this.messageBuffer.length === 0) {
            return;
        }
        
        // 오프라인 상태이면 종료
        if (!this.isConnected) {
            return;
        }
        
        try {
            this.isProcessingBuffer = true;
            this.logger.info(`메시지 버퍼 처리 중... (${this.messageBuffer.length}개 메시지)`);
            
            // 시스템 메시지 전송 (버퍼 처리 중)
            if (this.messageBuffer.length > 0) {
                this.sendSystemMessage(`오프라인 상태에서 저장된 메시지 ${this.messageBuffer.length}개를 전송합니다...`);
            }
            
            // 버퍼에서 메시지 하나씩 처리
            while (this.messageBuffer.length > 0 && this.isConnected) {
                const offlineMessage = this.messageBuffer.shift();
                
                try {
                    // 메시지 상태 업데이트
                    offlineMessage.status = 'sending';
                    
                    // 이벤트 발생
                    if (this.listeners.onNewMessage) {
                        this.listeners.onNewMessage(offlineMessage);
                    }
                    
                    // Supabase에 메시지 전송
                    const sentMessage = await this.supabaseClient.sendMessage(offlineMessage.content);
                    
                    if (sentMessage) {
                        // 처리된 메시지 ID 추적
                        this.processedMessageIds.add(sentMessage.id);
                        if (sentMessage.client_generated_id) {
                            this.processedMessageIds.add(sentMessage.client_generated_id);
                        }
                        
                        // 오프라인 메시지를 전송된 메시지로 대체
                        const messageIndex = this.findMessageIndexById(offlineMessage.id);
                        if (messageIndex !== -1) {
                            this.messages[messageIndex] = sentMessage;
                        }
                        
                        // 이벤트 발생
                        if (this.listeners.onNewMessage) {
                            this.listeners.onNewMessage(sentMessage);
                        }
                        
                        // 메시지 전송 성공 이벤트 발생
                        if (this.listeners.onMessageSendSuccess) {
                            this.listeners.onMessageSendSuccess({
                                message: sentMessage,
                                wasBuffered: true
                            });
                        }
                        
                        this.logger.info('오프라인 메시지 전송 완료:', sentMessage);
                    }
                    
                    // 다음 메시지 전송 전에 약간의 지연 (서버 부하 방지)
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    this.logger.error('오프라인 메시지 전송 중 오류 발생:', error);
                    
                    // 다시 버퍼에 추가
                    offlineMessage.status = 'failed';
                    this.messageBuffer.push(offlineMessage);
                    
                    // 이벤트 발생
                    if (this.listeners.onNewMessage) {
                        this.listeners.onNewMessage(offlineMessage);
                    }
                    
                    // 메시지 전송 실패 이벤트 발생
                    if (this.listeners.onMessageSendFailed) {
                        this.listeners.onMessageSendFailed({
                            message: offlineMessage,
                            error: error.message,
                            willRetry: true
                        });
                    }
                    
                    // 재시도 지연
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            
            // 모든 버퍼 메시지 처리 완료
            if (this.messageBuffer.length === 0) {
                this.sendSystemMessage('저장된 모든 메시지가 전송되었습니다.');
            }
        } finally {
            this.isProcessingBuffer = false;
            
            if (this.messageBuffer.length > 0) {
                // 남은 메시지가 있으면 나중에 다시 시도
                setTimeout(() => this.processMessageBuffer(), 5000);
            }
        }
    }

    /**
     * 메시지 재전송
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<Object|null>} - 전송된 메시지 또는 null
     */
    async resendMessage(messageId) {
        try {
            // 메시지 찾기
            const messageIndex = this.findMessageIndexById(messageId);
            
            if (messageIndex === -1) {
                this.logger.warn(`메시지 ID ${messageId}를 찾을 수 없습니다.`);
                return null;
            }
            
            const failedMessage = this.messages[messageIndex];
            
            // 버퍼에서 메시지 찾기
            const bufferIndex = this.messageBuffer.findIndex(msg => msg.id === messageId);
            
            // 메시지 상태 업데이트
            failedMessage.status = 'sending';
            
            // 메시지 전송 시작 이벤트 발생
            if (this.listeners.onMessageSendStart) {
                this.listeners.onMessageSendStart({
                    messageId,
                    content: failedMessage.content,
                    isResend: true
                });
            }
            
            // 이벤트 발생
            if (this.listeners.onNewMessage) {
                this.listeners.onNewMessage(failedMessage);
            }
            
            // Supabase에 메시지 전송
            const sentMessage = await this.supabaseClient.sendMessage(failedMessage.content);
            
            if (sentMessage) {
                // 처리된 메시지 ID 추적
                this.processedMessageIds.add(sentMessage.id);
                if (sentMessage.client_generated_id) {
                    this.processedMessageIds.add(sentMessage.client_generated_id);
                }
                
                // 메시지 대체
                this.messages[messageIndex] = sentMessage;
                
                // 버퍼에서 제거
                if (bufferIndex !== -1) {
                    this.messageBuffer.splice(bufferIndex, 1);
                }
                
                // 이벤트 발생
                if (this.listeners.onNewMessage) {
                    this.listeners.onNewMessage(sentMessage);
                }
                
                // 메시지 전송 성공 이벤트 발생
                if (this.listeners.onMessageSendSuccess) {
                    this.listeners.onMessageSendSuccess({
                        message: sentMessage,
                        wasResend: true
                    });
                }
                
                this.logger.info('메시지 재전송 완료:', sentMessage);
                return sentMessage;
            }
            
            return null;
        } catch (error) {
            this.logger.error('메시지 재전송 중 오류 발생:', error);
            
            // 연결 오류 처리
            this.handleConnectionError(error);
            
            // 메시지 전송 실패 이벤트 발생
            if (this.listeners.onMessageSendFailed) {
                this.listeners.onMessageSendFailed({
                    messageId,
                    error: error.message,
                    isConnectionError: this.isConnectionError(error)
                });
            }
            
            throw error;
        }
    }

    /**
     * 시스템 메시지 전송
     * @param {string} content - 메시지 내용
     * @returns {Object|null} - 생성된 시스템 메시지 또는 null
     */
    sendSystemMessage(content) {
        try {
            if (!content || !content.trim()) {
                this.logger.warn('빈 시스템 메시지는 전송할 수 없습니다.');
                return null;
            }
            
            // 시스템 메시지용 객체 생성
            const systemMessage = {
                id: 'system-' + Date.now(),
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
            
            this.logger.info('시스템 메시지 전송:', systemMessage);
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
            
            // 이미 번역 중인지 확인
            const pendingKey = `${message.id}-${targetLanguage}`;
            if (this.messagesPendingTranslation.has(pendingKey)) {
                this.logger.debug(`메시지 번역 중복 요청 무시: ${pendingKey}`);
                return message;
            }
            
            // 번역 대기 중으로 표시
            this.messagesPendingTranslation.set(pendingKey, true);
            
            this.logger.debug(`메시지 번역 중: ${message.language} -> ${targetLanguage}`, message.id);
            
            // 번역 서비스를 통해 번역
            const translatedContent = await this.translationService.translateText(
                message.content,
                message.language,
                targetLanguage
            );
            
            // 번역 대기 목록에서 제거
            this.messagesPendingTranslation.delete(pendingKey);
            
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
            
            this.logger.debug('메시지 번역 완료:', message.id);
            return translatedMessage;
        } catch (error) {
            // 번역 대기 목록에서 제거
            const pendingKey = `${message.id}-${targetLanguage}`;
            this.messagesPendingTranslation.delete(pendingKey);
            
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
            
            // 번역이 필요한 메시지만 필터링
            const messagesToTranslate = this.messages.filter(message => 
                !message.system_message && 
                message.language && 
                message.language !== targetLanguage &&
                message.content
            );
            
            this.logger.info(`${messagesToTranslate.length}개 메시지 번역 필요`);
            
            if (messagesToTranslate.length > 0) {
                // 시스템 메시지 전송 (번역 중)
                this.sendSystemMessage(`${messagesToTranslate.length}개 메시지 번역 중...`);
            }
            
            // 병렬 번역 (최대 5개씩)
            const translatedMessages = [...this.messages]; // 복사
            const batchSize = 5;
            
            for (let i = 0; i < messagesToTranslate.length; i += batchSize) {
                const batch = messagesToTranslate.slice(i, i + batchSize);
                
                // 병렬 번역
                await Promise.all(batch.map(async (message) => {
                    try {
                        const translatedMessage = await this.translateMessage(message, targetLanguage);
                        
                        // 원본 메시지 배열에서 해당 메시지 찾아 업데이트
                        const index = this.findMessageIndexById(message.id);
                        if (index !== -1) {
                            translatedMessages[index] = translatedMessage;
                            
                            // 번역 완료 이벤트 발생
                            if (this.listeners.onMessageTranslated) {
                                this.listeners.onMessageTranslated(translatedMessage);
                            }
                        }
                    } catch (translationError) {
                        this.logger.warn(`메시지 번역 중 오류: ${message.id}`, translationError);
                        // 번역 오류 무시하고 계속 진행
                    }
                }));
            }
            
            if (messagesToTranslate.length > 0) {
                // 시스템 메시지 전송 (번역 완료)
                this.sendSystemMessage(`${messagesToTranslate.length}개 메시지 번역 완료`);
            }
            
            this.logger.info(`${messagesToTranslate.length}개 메시지 번역 완료`);
            return translatedMessages;
        } catch (error) {
            this.logger.error('모든 메시지 번역 중 오류 발생:', error);
            
            // 시스템 메시지 전송 (번역 실패)
            this.sendSystemMessage('메시지 번역 중 오류가 발생했습니다.');
            
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
            
            // 연결 오류 처리
            this.handleConnectionError(error);
            
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
                const messageId = payload.id;
                const clientId = payload.client_generated_id;
                
                if (this.processedMessageIds.has(messageId) || 
                    (clientId && this.processedMessageIds.has(clientId))) {
                    this.logger.info(`중복 메시지 무시: ${messageId}`);
                    return;
                }
                
                // 처리된 메시지 ID 추적
                this.processedMessageIds.add(messageId);
                if (clientId) {
                    this.processedMessageIds.add(clientId);
                }
                
                // 사용자 메시지가 아닌 경우에만 추가 (내 메시지는 이미 추가됨)
                const currentUser = this.userService.getCurrentUser();
                const isMyMessage = currentUser && payload.author_email === currentUser.email;
                
                if (!isMyMessage) {
                    // 기존 메시지 확인 (클라이언트 ID로)
                    let existingIndex = -1;
                    if (clientId) {
                        existingIndex = this.findMessageIndexByClientId(clientId);
                    }
                    
                    if (existingIndex !== -1) {
                        // 기존 메시지 업데이트
                        this.messages[existingIndex] = payload;
                    } else {
                        // 메시지 목록에 추가
                        this.messages.push(payload);
                    }
                    
                    // 현재 사용자 언어로 메시지 번역
                    if (
                        this.config.CHAT.AUTO_TRANSLATION && 
                        currentUser && 
                        payload.language && 
                        payload.language !== currentUser.language
                    ) {
                        const translatedMessage = await this.translateMessage(
                            payload, 
                            currentUser.language
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
                } else {
                    // 내 메시지인 경우, 서버에서 생성된 ID 업데이트
                    const existingIndex = clientId 
                        ? this.findMessageIndexByClientId(clientId)
                        : -1;
                    
                    if (existingIndex !== -1) {
                        // 기존 메시지 업데이트
                        this.messages[existingIndex] = payload;
                        
                        // 이벤트 처리
                        if (this.listeners.onNewMessage) {
                            this.listeners.onNewMessage(payload);
                        }
                    }
                }
                
                // 메시지 수신 시 타이핑 사용자 제거
                if (payload.author_email) {
                    this.typingUsers.delete(payload.author_email);
                    this.updateTypingIndicator();
                }
                
                // 연결 상태 업데이트
                this.updateConnectionStatus(true);
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
                
                // 연결 상태 업데이트
                this.updateConnectionStatus(true);
            }
        });
    }

    /**
     * 연결 상태 모니터링 시작
     */
    startConnectionMonitoring() {
        this.logger.info('연결 상태 모니터링 시작');
        
        // 주기적으로 연결 상태 확인 (15초마다)
        const monitoringInterval = setInterval(() => {
            this.checkConnection();
        }, 15000); // 15초
        
        // interval 식별자 저장
        this.connectionMonitoringInterval = monitoringInterval;
        
        // 예방적 Supabase 연결 체크 (2분마다)
        const supabaseCheckInterval = setInterval(() => {
            this.logger.debug('Supabase 접속 상태 정기 체크 중...');
            
            const connectionStatus = this.supabaseClient.getConnectionStatus();
            if (connectionStatus !== 'connected') {
                this.logger.warn(`Supabase 연결 상태가 '${connectionStatus}'입니다. 재연결 시도...`);
                
                // 구독 재설정 시도
                this.resubscribeAll();
            }
        }, 120000); // 2분
        
        // interval 식별자 저장
        this.supabaseCheckInterval = supabaseCheckInterval;
        
        // 온라인/오프라인 이벤트 리스너
        window.addEventListener('online', () => {
            this.logger.info('네트워크 연결이 복구되었습니다.');
            this.updateConnectionStatus(true);
            this.reconnectAttempts = 0;
            
            // Supabase 재연결 시도
            this.supabaseClient.reconnect().then(success => {
                if (success) {
                    this.logger.info('Supabase 재연결 성공');
                    // 구독 재설정
                    this.resubscribeAll();
                    // 메시지 버퍼 처리
                    this.processMessageBuffer();
                } else {
                    this.logger.warn('Supabase 재연결 실패, 다시 시도하겠습니다...');
                    // 5초 후 다시 시도
                    setTimeout(() => this.resubscribeAll(), 5000);
                }
            }).catch(error => {
                this.logger.error('Supabase 재연결 중 오류:', error);
            });
        });
        
        window.addEventListener('offline', () => {
            this.logger.warn('네트워크 연결이 끊겼습니다.');
            this.updateConnectionStatus(false);
        });
        
        // 초기 접속 상태 확인
        this.checkConnection();
    }

    /**
     * 연결 상태 확인
     * @returns {Promise<boolean>} - 연결 상태
     */
    async checkConnection() {
        try {
            this.logger.debug('네트워크 연결 상태 확인 중...');
            
            // 간단한 핑 요청으로 연결 상태 확인
            const pingPromise = fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
                // 타임아웃 5초
                signal: AbortSignal.timeout(5000)
            });
            
            const response = await pingPromise;
            
            if (response) {
                this.logger.debug('네트워크 연결 확인 성공');
                this.updateConnectionStatus(true);
                this.reconnectAttempts = 0;
                
                // Supabase 연결 상태 확인
                const supabaseStatus = this.supabaseClient.getConnectionStatus();
                this.logger.debug(`Supabase 연결 상태: ${supabaseStatus}`);
                
                // Supabase 연결 상태가 끊어졌다면 구독 재설정
                if (supabaseStatus !== 'connected') {
                    this.logger.warn('Supabase 연결이 끊어졌습니다. 구독 재설정 시도...');
                    await this.resubscribeAll();
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            this.logger.warn('연결 상태 확인 중 오류 발생:', error);
            this.updateConnectionStatus(false);
            
            // 재연결 시도 회수 증가
            this.reconnectAttempts++;
            this.logger.debug(`재연결 시도 회수: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            // 재연결 회수가 최대치를 초과하지 않았을 경우 재시도
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
                this.logger.info(`${delay}ms 후 재연결 시도 예정...`);
            } else {
                this.logger.error(`최대 재연결 시도 횟수(${this.maxReconnectAttempts}회)를 초과했습니다.`);
                
                // 재연결 회수 초기화 (다시 시도할 수 있도록)
                setTimeout(() => {
                    this.reconnectAttempts = 0;
                    this.logger.info('재연결 시도 회수 초기화');
                }, 60000); // 1분 후 재시도 가능
            }
            
            return false;
        }
    }

    /**
     * 연결 상태 업데이트
     * @param {boolean} isConnected - 연결 상태
     */
    updateConnectionStatus(isConnected) {
        // 연결 상태 변경이 있을 경우
        if (this.isConnected !== isConnected) {
            const prevStatus = this.isConnected;
            this.isConnected = isConnected;
            
            this.logger.info(`연결 상태 변경: ${prevStatus ? '연결됨' : '연결 끊김'} -> ${isConnected ? '연결됨' : '연결 끊김'}`);
            
            // 연결 상태 변경 이벤트 발생
            if (this.listeners.onConnectionStatusChange) {
                try {
                    this.listeners.onConnectionStatusChange(isConnected);
                } catch (listenerError) {
                    this.logger.error('연결 상태 변경 리스너 오류:', listenerError);
                }
            }
            
            // 상태 메시지 표시
            if (isConnected) {
                // 오리지널 아이콘 추가
                const reconnectMessage = '🔊 인터넷 연결이 복구되었습니다.';
                this.sendSystemMessage(reconnectMessage);
                
                // 오프라인 메시지 처리
                if (this.messageBuffer.length > 0) {
                    const bufferCount = this.messageBuffer.length;
                    this.logger.info(`오프라인 메시지 ${bufferCount}개 처리 시작...`);
                    
                    // 메시지 버퍼 팝업 표시
                    if (bufferCount > 0) {
                        this.sendSystemMessage(`저장된 메시지 ${bufferCount}개를 전송하고 있습니다...`);
                    }
                    
                    // 버퍼 처리
                    this.processMessageBuffer();
                }
            } else {
                // 오리지널 아이콘 추가
                const disconnectMessage = '⚠️ 인터넷 연결이 끊겼습니다. 메시지가 일시적으로 저장됩니다.';
                this.sendSystemMessage(disconnectMessage);
            }
        }
    }

    /**
     * 연결 오류 처리
     * @param {Error} error - 오류 객체
     */
    handleConnectionError(error) {
        // 연결 문제로 인한 오류인지 확인
        if (this.isConnectionError(error)) {
            this.updateConnectionStatus(false);
            this.reconnectAttempts++;
            
            // 재연결 시도
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                this.logger.info(`${this.reconnectAttempts}번째 재연결 시도 중...`);
                
                setTimeout(() => {
                    this.checkConnection();
                }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)); // 지수 백오프
            } else {
                this.logger.error(`최대 재연결 시도 횟수(${this.maxReconnectAttempts}회)를 초과했습니다.`);
                
                // 시스템 메시지 전송 (재연결 실패)
                this.sendSystemMessage('서버 연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.');
            }
        }
    }

    /**
     * 이벤트 리스너 등록
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    on(event, callback) {
        if (this.listeners[event] !== undefined) {
            this.listeners[event] = callback;
        }
    }

    /**
     * 이벤트 리스너 제거
     * @param {string} event - 이벤트 이름
     */
    off(event) {
        if (this.listeners[event] !== undefined) {
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

    /**
     * 연결 상태 확인
     * @returns {boolean} - 연결 상태
     */
    get isOnline() {
        return this.isConnected;
    }
}