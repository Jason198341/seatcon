/**
 * 메시지 컴포넌트
 * 개별 메시지 생성 및 관리
 */
class MessageComponent {
    /**
     * 메시지 컴포넌트 생성자
     * @param {Object} chatManager - 채팅 관리자
     * @param {Object} userService - 사용자 서비스
     * @param {Object} translationService - 번역 서비스
     * @param {Object} logger - 로거 서비스
     */
    constructor(chatManager, userService, translationService, logger) {
        this.chatManager = chatManager;
        this.userService = userService;
        this.translationService = translationService;
        this.logger = logger || console;
        this.messageTemplates = {};
        
        this.init();
    }

    /**
     * 메시지 컴포넌트 초기화
     */
    init() {
        try {
            this.logger.info('메시지 컴포넌트 초기화 중...');
            
            // 메시지 템플릿 준비
            this.prepareTemplates();
            
            this.logger.info('메시지 컴포넌트 초기화 완료');
        } catch (error) {
            this.logger.error('메시지 컴포넌트 초기화 중 오류 발생:', error);
        }
    }

    /**
     * 메시지 템플릿 준비
     */
    prepareTemplates() {
        // 일반 메시지 템플릿
        this.messageTemplates.regular = `
            <div class="message-header">
                <span class="sender"></span>
                <span class="role-badge"></span>
                <span class="time"></span>
            </div>
            <div class="message-content"></div>
            <div class="message-footer">
                <div class="translation-info hidden">
                    <span class="translation-toggle">원문 보기</span>
                    <span class="translation-language"></span>
                </div>
                <div class="message-actions">
                    <div class="like-button">
                        <i class="far fa-heart"></i>
                        <span class="like-count"></span>
                    </div>
                </div>
            </div>
        `;
        
        // 시스템 메시지 템플릿
        this.messageTemplates.system = `
            <span class="system-message-content"></span>
        `;
        
        // 내 메시지 템플릿
        this.messageTemplates.mine = `
            <div class="message-header">
                <span class="time"></span>
            </div>
            <div class="message-content"></div>
            <div class="message-footer">
                <div class="translation-info hidden">
                    <span class="translation-toggle">원문 보기</span>
                    <span class="translation-language"></span>
                </div>
                <div class="message-actions">
                    <div class="like-button">
                        <i class="far fa-heart"></i>
                        <span class="like-count"></span>
                    </div>
                </div>
            </div>
        `;
        
        // 공지사항 메시지 템플릿
        this.messageTemplates.announcement = `
            <div class="message-header">
                <span class="announcement-icon"><i class="fas fa-bullhorn"></i></span>
                <span class="sender"></span>
                <span class="role-badge admin">관리자</span>
                <span class="time"></span>
            </div>
            <div class="message-content"></div>
            <div class="message-footer">
                <div class="translation-info hidden">
                    <span class="translation-toggle">원문 보기</span>
                    <span class="translation-language"></span>
                </div>
                <div class="message-actions">
                    <div class="like-button">
                        <i class="far fa-heart"></i>
                        <span class="like-count"></span>
                    </div>
                </div>
            </div>
        `;
        
        // 타이핑 인디케이터 템플릿
        this.messageTemplates.typing = `
            <div class="typing-text"></div>
            <span></span>
            <span></span>
            <span></span>
        `;
    }

    /**
     * 메시지 요소 생성
     * @param {Object} message - 메시지 객체
     * @returns {HTMLElement} - 메시지 요소
     */
    createMessageElement(message) {
        try {
            // 유효성 검사 추가
            if (!message) {
                this.logger.error('유효하지 않은 메시지 객체');
                throw new Error('유효하지 않은 메시지 객체');
            }
            
            // 메시지 ID 로깅
            this.logger.debug('메시지 요소 생성 중:', message.id || '임시 ID');
            
            // 시스템 메시지인 경우
            if (message.system_message) {
                return this.createSystemMessageElement(message);
            }
            
            const currentUser = this.userService.getCurrentUser();
            const isMyMessage = currentUser && message.author_email === currentUser.email;
            
            // 공지사항 메시지인지 확인
            const isAnnouncement = message.is_announcement || 
                                   (message.content && message.content.startsWith('📢 [공지]'));
            
            // 메시지 요소 생성
            const messageElement = document.createElement('div');
            
            // 메시지 클래스 설정
            if (isAnnouncement) {
                messageElement.className = 'message announcement';
            } else {
                messageElement.className = `message ${isMyMessage ? 'mine' : 'others'}`;
            }
            
            // 메시지 상태에 따른 추가 클래스
            if (message.status === 'pending' || message.status === 'sending') {
                messageElement.classList.add('sending');
            } else if (message.status === 'failed') {
                messageElement.classList.add('failed');
            }
            
            // ID 설정 (로컬 메시지인 경우 client_generated_id 사용)
            if (message.id) {
                messageElement.dataset.id = message.id;
            }
            if (message.client_generated_id) {
                messageElement.dataset.clientId = message.client_generated_id;
            }
            
            // 템플릿 적용
            if (isAnnouncement) {
                messageElement.innerHTML = this.messageTemplates.announcement;
            } else if (isMyMessage) {
                messageElement.innerHTML = this.messageTemplates.mine;
            } else {
                messageElement.innerHTML = this.messageTemplates.regular;
            }
            
            // 메시지 데이터 채우기
            this.populateMessageData(messageElement, message, isMyMessage, isAnnouncement);
            
            // 이벤트 리스너 등록
            this.attachEventListeners(messageElement, message);
            
            this.logger.debug('메시지 요소 생성 완료:', message.id || '임시 ID');
            return messageElement;
        } catch (error) {
            this.logger.error('메시지 요소 생성 중 오류 발생:', error);
            
            // 오류 발생 시 기본 메시지 요소 반환
            const fallbackElement = document.createElement('div');
            fallbackElement.className = 'message system-message';
            fallbackElement.textContent = '메시지를 표시할 수 없습니다.';
            return fallbackElement;
        }
    }

    /**
     * 시스템 메시지 요소 생성
     * @param {Object} message - 메시지 객체
     * @returns {HTMLElement} - 시스템 메시지 요소
     */
    createSystemMessageElement(message) {
        const element = document.createElement('div');
        element.className = 'system-message';
        element.innerHTML = this.messageTemplates.system;
        
        // 메시지 내용 설정
        const contentElement = element.querySelector('.system-message-content');
        if (contentElement) {
            contentElement.textContent = message.content;
        } else {
            element.textContent = message.content;
        }
        
        return element;
    }

    /**
     * 타이핑 인디케이터 요소 생성
     * @param {Array} typingUsers - 타이핑 중인 사용자 목록
     * @returns {HTMLElement} - 타이핑 인디케이터 요소
     */
    createTypingIndicator(typingUsers) {
        const element = document.createElement('div');
        element.className = 'typing-indicator';
        element.id = 'typing-indicator';
        element.innerHTML = this.messageTemplates.typing;
        
        // 타이핑 중인 사용자 이름 설정
        let typingText = '';
        
        if (typingUsers.length === 1) {
            typingText = `${typingUsers[0].name}님이 입력 중...`;
        } else if (typingUsers.length === 2) {
            typingText = `${typingUsers[0].name}님과 ${typingUsers[1].name}님이 입력 중...`;
        } else {
            typingText = `${typingUsers[0].name}님 외 ${typingUsers.length - 1}명이 입력 중...`;
        }
        
        const textElement = element.querySelector('.typing-text');
        if (textElement) {
            textElement.textContent = typingText;
        }
        
        return element;
    }

    /**
     * 메시지 데이터 채우기
     * @param {HTMLElement} element - 메시지 요소
     * @param {Object} message - 메시지 객체
     * @param {boolean} isMyMessage - 내 메시지 여부
     * @param {boolean} isAnnouncement - 공지사항 여부
     */
    populateMessageData(element, message, isMyMessage, isAnnouncement) {
        try {
            // 작성자 이름 (내 메시지가 아닌 경우나 공지사항인 경우)
            if (!isMyMessage || isAnnouncement) {
                const senderElement = element.querySelector('.sender');
                if (senderElement) {
                    // 공지사항인 경우 "공지사항" 텍스트 추가
                    if (isAnnouncement) {
                        senderElement.textContent = `${message.author_name} (공지사항)`;
                    } else {
                        senderElement.textContent = message.author_name;
                    }
                }
                
                // 역할 배지
                const roleBadgeElement = element.querySelector('.role-badge');
                if (roleBadgeElement && message.user_role && !isAnnouncement) {
                    roleBadgeElement.textContent = this.getRoleDisplayName(message.user_role);
                    roleBadgeElement.classList.add(message.user_role);
                }
            }
            
            // 시간
            const timeElement = element.querySelector('.time');
            if (timeElement) {
                timeElement.textContent = this.formatTime(message.created_at);
            }
            
            // 메시지 내용
            const contentElement = element.querySelector('.message-content');
            if (contentElement) {
                // 공지사항인 경우 접두사 제거 (이미 UI에 표시되었으므로)
                let content = message.translatedContent || message.content;
                
                if (isAnnouncement && content.startsWith('📢 [공지]')) {
                    content = content.replace('📢 [공지]', '').trim();
                }
                
                contentElement.textContent = content;
                
                // 공지사항인 경우 강조 스타일 추가
                if (isAnnouncement) {
                    contentElement.classList.add('announcement-content');
                }
            }
            
            // 번역 정보
            if (message.translatedContent && message.translatedLanguage) {
                const translationInfoElement = element.querySelector('.translation-info');
                if (translationInfoElement) {
                    translationInfoElement.classList.remove('hidden');
                    
                    const languageElement = translationInfoElement.querySelector('.translation-language');
                    if (languageElement) {
                        languageElement.textContent = `${this.translationService.getLanguageName(message.translatedLanguage)}로 번역됨`;
                    }
                }
            }
            
            // 공지사항인 경우 추가 스타일링
            if (isAnnouncement) {
                element.style.borderLeft = '4px solid #ff9800';
                element.style.backgroundColor = 'rgba(255, 152, 0, 0.05)';
            }
        } catch (error) {
            this.logger.error('메시지 데이터 채우기 중 오류 발생:', error);
        }
    }

    /**
     * 이벤트 리스너 등록
     * @param {HTMLElement} element - 메시지 요소
     * @param {Object} message - 메시지 객체
     */
    attachEventListeners(element, message) {
        try {
            // 좋아요 버튼 클릭 이벤트
            const likeButton = element.querySelector('.like-button');
            if (likeButton) {
                likeButton.addEventListener('click', async () => {
                    await this.chatManager.toggleLike(message.id);
                });
                
                // 좋아요 상태 초기화
                this.updateLikeStatus(likeButton, message.id);
            }
            
            // 번역 토글 이벤트
            const translationToggle = element.querySelector('.translation-toggle');
            if (translationToggle) {
                translationToggle.addEventListener('click', () => {
                    this.toggleTranslation(element, message);
                });
            }
            
            // 메시지 상태가 실패인 경우 재전송 이벤트 추가
            if (message.status === 'failed') {
                element.addEventListener('dblclick', async () => {
                    // 메시지 재전송 요청
                    await this.chatManager.resendMessage(message.id);
                });
                
                // 재전송 힌트 추가
                const hint = document.createElement('div');
                hint.className = 'resend-hint';
                hint.textContent = '더블클릭하여 재전송';
                element.appendChild(hint);
            }
        } catch (error) {
            this.logger.error('이벤트 리스너 등록 중 오류 발생:', error);
        }
    }

    /**
     * 번역 토글
     * @param {HTMLElement} element - 메시지 요소
     * @param {Object} message - 메시지 객체
     */
    toggleTranslation(element, message) {
        try {
            if (!element || !message || !message.translatedContent) return;
            
            const contentElement = element.querySelector('.message-content');
            const toggleElement = element.querySelector('.translation-toggle');
            
            if (!contentElement || !toggleElement) return;
            
            const isShowingOriginal = toggleElement.textContent === '번역 보기';
            
            if (isShowingOriginal) {
                // 번역본으로 전환
                contentElement.textContent = message.translatedContent;
                toggleElement.textContent = '원문 보기';
            } else {
                // 원문으로 전환
                let content = message.content;
                
                // 공지사항인 경우 접두사 제거
                if ((message.is_announcement || element.classList.contains('announcement')) && 
                    content.startsWith('📢 [공지]')) {
                    content = content.replace('📢 [공지]', '').trim();
                }
                
                contentElement.textContent = content;
                toggleElement.textContent = '번역 보기';
            }
        } catch (error) {
            this.logger.error('번역 토글 중 오류 발생:', error);
        }
    }

    /**
     * 좋아요 상태 업데이트
     * @param {HTMLElement} likeButton - 좋아요 버튼 요소
     * @param {string} messageId - 메시지 ID
     */
    async updateLikeStatus(likeButton, messageId) {
        try {
            // 좋아요 목록 가져오기
            const likes = await this.chatManager.getLikes(messageId);
            
            // 좋아요 수 표시
            const likeCount = likes.length;
            const countElement = likeButton.querySelector('.like-count');
            
            if (countElement) {
                countElement.textContent = likeCount > 0 ? likeCount : '';
            }
            
            // 현재 사용자의 좋아요 여부에 따라 클래스 토글
            const currentUser = this.userService.getCurrentUser();
            
            if (currentUser) {
                const hasLiked = likes.some(like => like.user_email === currentUser.email);
                
                if (hasLiked) {
                    likeButton.classList.add('liked');
                } else {
                    likeButton.classList.remove('liked');
                }
            }
        } catch (error) {
            this.logger.error('좋아요 상태 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 시간 포맷팅
     * @param {string} timestamp - 타임스탬프
     * @returns {string} - 포맷된 시간
     */
    formatTime(timestamp) {
        try {
            const date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            // 오늘 메시지인 경우 시간만 표시
            if (messageDate.getTime() === today.getTime()) {
                return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            }
            
            // 어제 메시지인 경우 '어제' + 시간 표시
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (messageDate.getTime() === yesterday.getTime()) {
                return `어제 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
            }
            
            // 그 외의 경우 날짜와 시간 모두 표시
            return date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            this.logger.error('시간 포맷팅 중 오류 발생:', error);
            return '';
        }
    }

    /**
     * 역할 표시 이름 가져오기
     * @param {string} role - 역할 코드
     * @returns {string} - 역할 표시 이름
     */
    getRoleDisplayName(role) {
        const roleMap = {
            'attendee': '참가자',
            'exhibitor': '전시자',
            'presenter': '발표자',
            'staff': '스태프',
            'admin': '관리자',
        };
        
        return roleMap[role] || role;
    }

    /**
     * 메시지 요소 업데이트
     * @param {HTMLElement} element - 메시지 요소
     * @param {Object} message - 메시지 객체
     */
    updateMessageElement(element, message) {
        try {
            if (!element || !message) return;
            
            // 내 메시지 여부 확인
            const currentUser = this.userService.getCurrentUser();
            const isMyMessage = currentUser && message.author_email === currentUser.email;
            
            // 공지사항 여부 확인
            const isAnnouncement = message.is_announcement || 
                                   (message.content && message.content.startsWith('📢 [공지]'));
            
            // 메시지 데이터 업데이트
            this.populateMessageData(element, message, isMyMessage, isAnnouncement);
        } catch (error) {
            this.logger.error('메시지 요소 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * ID로 메시지 요소 찾기
     * @param {string} messageId - 메시지 ID
     * @param {HTMLElement} container - 메시지 컨테이너 요소
     * @returns {HTMLElement|null} - 메시지 요소 또는 null
     */
    findMessageElement(messageId, container) {
        if (!messageId || !container) return null;
        
        return container.querySelector(`.message[data-id="${messageId}"]`);
    }

    /**
     * 키워드 하이라이트 처리
     * @param {string} text - 원본 텍스트
     * @param {string} keyword - 하이라이트할 키워드
     * @returns {string} - 하이라이트된 HTML
     */
    highlightKeyword(text, keyword) {
        if (!keyword || keyword.trim() === '' || !text) return text;
        
        try {
            const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<span class="highlight-keyword">$1</span>');
        } catch (error) {
            this.logger.error('키워드 하이라이트 처리 중 오류 발생:', error);
            return text;
        }
    }
}