/**
 * 채팅 컴포넌트
 * 채팅 인터페이스 및 메시지 표시 관리
 */
class ChatComponent {
    /**
     * 채팅 컴포넌트 생성자
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
        this.elements = {
            chatInterface: null,
            messagesContainer: null,
            messageForm: null,
            messageInput: null,
            emojiPicker: null,
            emojiPickerBtn: null,
            attachmentBtn: null,
        };
        this.typingTimer = null;
        
        this.init();
    }

    /**
     * 채팅 컴포넌트 초기화
     */
    init() {
        try {
            this.logger.info('채팅 컴포넌트 초기화 중...');
            
            // DOM 요소 참조 가져오기
            this.elements.chatInterface = document.getElementById('chat-interface');
            this.elements.messagesContainer = document.getElementById('messages-container');
            this.elements.messageForm = document.getElementById('message-form');
            this.elements.messageInput = document.getElementById('message-input');
            this.elements.emojiPicker = document.getElementById('emoji-picker');
            this.elements.emojiPickerBtn = document.getElementById('emoji-picker-btn');
            this.elements.attachmentBtn = document.getElementById('attachment-btn');
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 채팅 관리자 이벤트 리스너 등록
            this.registerChatEvents();
            
            this.logger.info('채팅 컴포넌트 초기화 완료');
        } catch (error) {
            this.logger.error('채팅 컴포넌트 초기화 중 오류 발생:', error);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 메시지 폼 제출 이벤트 리스너
        this.elements.messageForm?.addEventListener('submit', this.handleMessageSubmit.bind(this));
        
        // 메시지 입력 자동 높이 조절
        this.elements.messageInput?.addEventListener('input', this.handleMessageInput.bind(this));
        
        // 이모지 선택기 토글
        this.elements.emojiPickerBtn?.addEventListener('click', this.toggleEmojiPicker.bind(this));
        
        // 첨부 버튼 클릭
        this.elements.attachmentBtn?.addEventListener('click', this.handleAttachmentClick.bind(this));
        
        // 이모지 선택기 외부 클릭 감지
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        
        // 키보드 단축키
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * 채팅 관리자 이벤트 리스너 등록
     */
    registerChatEvents() {
        // 새 메시지 이벤트
        this.chatManager.on('onNewMessage', this.handleNewMessage.bind(this));
        
        // 메시지 번역 이벤트
        this.chatManager.on('onMessageTranslated', this.handleMessageTranslated.bind(this));
        
        // 타이핑 중 이벤트
        this.chatManager.on('onUserTyping', this.handleUserTyping.bind(this));
        
        // 좋아요 업데이트 이벤트
        this.chatManager.on('onLikeUpdate', this.handleLikeUpdate.bind(this));
    }

    /**
     * 메시지 폼 제출 처리
     * @param {Event} event - 이벤트 객체
     */
    async handleMessageSubmit(event) {
        event.preventDefault();
        
        try {
            const content = this.elements.messageInput.value.trim();
            
            if (!content) return;
            
            // 메시지 입력 필드 비우기
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = 'auto';
            
            // 메시지 전송
            await this.chatManager.sendMessage(content);
            
            // 자동 포커스
            this.elements.messageInput.focus();
        } catch (error) {
            this.logger.error('메시지 전송 중 오류 발생:', error);
            
            // 사용자에게 오류 알림
            const errorEvent = new CustomEvent('chat:error', {
                detail: { message: '메시지 전송에 실패했습니다. 다시 시도해주세요.' },
            });
            document.dispatchEvent(errorEvent);
        }
    }

    /**
     * 메시지 입력 처리
     * @param {Event} event - 이벤트 객체
     */
    handleMessageInput(event) {
        try {
            const input = event.target;
            
            // 입력 필드 높이 자동 조절
            input.style.height = 'auto';
            input.style.height = `${input.scrollHeight}px`;
            
            // 타이핑 알림
            if (input.value.trim()) {
                // 타이핑 타이머 초기화
                clearTimeout(this.typingTimer);
                
                // 타이핑 중 알림
                this.chatManager.notifyTyping();
                
                // 타이핑 타이머 설정 (1초 후 실행)
                this.typingTimer = setTimeout(() => {
                    // 타이핑 종료 알림
                }, 1000);
            }
        } catch (error) {
            this.logger.error('메시지 입력 처리 중 오류 발생:', error);
        }
    }

    /**
     * 이모지 선택기 토글
     */
    toggleEmojiPicker() {
        try {
            if (!this.elements.emojiPicker) return;
            
            const isHidden = this.elements.emojiPicker.classList.contains('hidden');
            
            if (isHidden) {
                // 이모지 선택기 표시
                this.elements.emojiPicker.classList.remove('hidden');
                
                // 이모지 목록 로드
                this.loadEmojis();
            } else {
                // 이모지 선택기 숨기기
                this.elements.emojiPicker.classList.add('hidden');
            }
        } catch (error) {
            this.logger.error('이모지 선택기 토글 중 오류 발생:', error);
        }
    }

    /**
     * 이모지 로드
     */
    loadEmojis() {
        try {
            if (!this.elements.emojiPicker) return;
            
            // 이미 로드된 경우 스킵
            if (this.elements.emojiPicker.children.length > 0) return;
            
            // 이모지 카테고리 및 이모지 로드
            const emojiCategories = [
                { name: '표정', emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘'] },
                { name: '손 제스처', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐️'] },
                { name: '사람', emojis: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👮', '💂', '🥷', '👷', '👸'] },
                { name: '동물', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'] },
                { name: '음식', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥'] },
            ];
            
            // 이모지 그리드 생성
            const emojiGrid = document.createElement('div');
            emojiGrid.className = 'emoji-grid';
            
            // 각 카테고리별 이모지 추가
            for (const category of emojiCategories) {
                // 카테고리 제목
                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'emoji-category-title';
                categoryTitle.textContent = category.name;
                emojiGrid.appendChild(categoryTitle);
                
                // 카테고리 이모지
                for (const emoji of category.emojis) {
                    const emojiElement = document.createElement('div');
                    emojiElement.className = 'emoji';
                    emojiElement.textContent = emoji;
                    emojiElement.addEventListener('click', () => this.insertEmoji(emoji));
                    emojiGrid.appendChild(emojiElement);
                }
            }
            
            this.elements.emojiPicker.appendChild(emojiGrid);
        } catch (error) {
            this.logger.error('이모지 로드 중 오류 발생:', error);
        }
    }

    /**
     * 이모지 삽입
     * @param {string} emoji - 이모지
     */
    insertEmoji(emoji) {
        try {
            if (!this.elements.messageInput) return;
            
            // 현재 커서 위치에 이모지 삽입
            const cursorPosition = this.elements.messageInput.selectionStart;
            const text = this.elements.messageInput.value;
            const newText = text.substring(0, cursorPosition) + emoji + text.substring(cursorPosition);
            
            this.elements.messageInput.value = newText;
            
            // 커서 위치 업데이트
            const newCursorPosition = cursorPosition + emoji.length;
            this.elements.messageInput.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // 높이 자동 조절 트리거
            this.elements.messageInput.dispatchEvent(new Event('input'));
            
            // 이모지 선택기 닫기
            this.elements.emojiPicker.classList.add('hidden');
            
            // 포커스
            this.elements.messageInput.focus();
        } catch (error) {
            this.logger.error('이모지 삽입 중 오류 발생:', error);
        }
    }

    /**
     * 첨부 파일 버튼 클릭 처리
     */
    handleAttachmentClick() {
        try {
            // 임시 코드: 파일 업로드 기능은 아직 구현되지 않았습니다.
            const event = new CustomEvent('chat:info', {
                detail: { message: '파일 업로드 기능은 아직 구현되지 않았습니다.' },
            });
            document.dispatchEvent(event);
        } catch (error) {
            this.logger.error('첨부 파일 처리 중 오류 발생:', error);
        }
    }

    /**
     * 외부 클릭 처리 (이모지 선택기 닫기)
     * @param {Event} event - 이벤트 객체
     */
    handleOutsideClick(event) {
        try {
            if (
                !this.elements.emojiPicker ||
                this.elements.emojiPicker.classList.contains('hidden') ||
                this.elements.emojiPicker.contains(event.target) ||
                this.elements.emojiPickerBtn.contains(event.target)
            ) {
                return;
            }
            
            // 이모지 선택기 숨기기
            this.elements.emojiPicker.classList.add('hidden');
        } catch (error) {
            this.logger.error('외부 클릭 처리 중 오류 발생:', error);
        }
    }

    /**
     * 키보드 단축키 처리
     * @param {KeyboardEvent} event - 키보드 이벤트
     */
    handleKeyDown(event) {
        try {
            // Escape 키: 이모지 선택기 닫기
            if (event.key === 'Escape' && !this.elements.emojiPicker?.classList.contains('hidden')) {
                this.elements.emojiPicker.classList.add('hidden');
                event.preventDefault();
            }
            
            // Ctrl+Enter: 메시지 전송
            if (event.key === 'Enter' && event.ctrlKey && document.activeElement === this.elements.messageInput) {
                this.elements.messageForm.dispatchEvent(new Event('submit'));
                event.preventDefault();
            }
        } catch (error) {
            this.logger.error('키보드 단축키 처리 중 오류 발생:', error);
        }
    }

    /**
     * 새 메시지 처리
     * @param {Object} message - 메시지 객체
     */
    handleNewMessage(message) {
        try {
            this.logger.debug('새 메시지 수신:', message);
            
            // 메시지가 이미 표시되었는지 확인
            const existingMessage = this.findMessageElement(message.id);
            
            if (existingMessage) {
                // 이미 표시된 메시지인 경우 업데이트
                this.updateMessageElement(existingMessage, message);
            } else {
                // 새 메시지 요소 생성
                const messageElement = this.createMessageElement(message);
                
                // 메시지 컨테이너에 추가
                this.elements.messagesContainer.appendChild(messageElement);
                
                // 스크롤 아래로
                this.scrollToBottom();
            }
        } catch (error) {
            this.logger.error('새 메시지 처리 중 오류 발생:', error);
        }
    }

    /**
     * 메시지 번역 처리
     * @param {Object} message - 번역된 메시지 객체
     */
    handleMessageTranslated(message) {
        try {
            this.logger.debug('메시지 번역 완료:', message);
            
            // 메시지 요소 찾기
            const messageElement = this.findMessageElement(message.id);
            
            if (messageElement) {
                // 메시지 내용 업데이트
                const contentElement = messageElement.querySelector('.message-content');
                
                if (contentElement) {
                    // 번역된 내용으로 업데이트
                    contentElement.textContent = message.translatedContent;
                    
                    // 번역 정보 추가
                    if (!messageElement.querySelector('.translation-info')) {
                        const translationInfo = document.createElement('div');
                        translationInfo.className = 'translation-info';
                        translationInfo.innerHTML = `
                            <span class="translation-toggle">원문 보기</span>
                            <span class="translation-language">${this.translationService.getLanguageName(message.translatedLanguage)}로 번역됨</span>
                        `;
                        
                        // 원문/번역 토글 이벤트
                        const toggleBtn = translationInfo.querySelector('.translation-toggle');
                        toggleBtn.addEventListener('click', () => {
                            const isShowingOriginal = toggleBtn.textContent === '번역 보기';
                            
                            if (isShowingOriginal) {
                                // 번역본으로 전환
                                contentElement.textContent = message.translatedContent;
                                toggleBtn.textContent = '원문 보기';
                            } else {
                                // 원문으로 전환
                                contentElement.textContent = message.content;
                                toggleBtn.textContent = '번역 보기';
                            }
                        });
                        
                        // 메시지 푸터에 추가
                        const footer = messageElement.querySelector('.message-footer');
                        if (footer) {
                            footer.prepend(translationInfo);
                        } else {
                            messageElement.appendChild(translationInfo);
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error('메시지 번역 처리 중 오류 발생:', error);
        }
    }

    /**
     * 사용자 타이핑 처리
     * @param {Array} typingUsers - 타이핑 중인 사용자 목록
     */
    handleUserTyping(typingUsers) {
        try {
            // 타이핑 인디케이터 요소 찾기 또는 생성
            let typingIndicator = document.getElementById('typing-indicator');
            
            if (typingUsers.length === 0) {
                // 타이핑 중인 사용자가 없는 경우 인디케이터 제거
                if (typingIndicator) {
                    typingIndicator.remove();
                }
                return;
            }
            
            if (!typingIndicator) {
                // 타이핑 인디케이터 생성
                typingIndicator = document.createElement('div');
                typingIndicator.id = 'typing-indicator';
                typingIndicator.className = 'typing-indicator';
                
                // 애니메이션 도트 추가
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('span');
                    typingIndicator.appendChild(dot);
                }
                
                // 메시지 컨테이너에 추가
                this.elements.messagesContainer.appendChild(typingIndicator);
                
                // 스크롤 아래로
                this.scrollToBottom();
            }
            
            // 타이핑 중인 사용자 이름 업데이트
            let typingText = '';
            
            if (typingUsers.length === 1) {
                typingText = `${typingUsers[0].name}님이 입력 중...`;
            } else if (typingUsers.length === 2) {
                typingText = `${typingUsers[0].name}님과 ${typingUsers[1].name}님이 입력 중...`;
            } else {
                typingText = `${typingUsers[0].name}님 외 ${typingUsers.length - 1}명이 입력 중...`;
            }
            
            // 타이핑 인디케이터 텍스트 추가 또는 업데이트
            let textElement = typingIndicator.querySelector('.typing-text');
            
            if (!textElement) {
                textElement = document.createElement('div');
                textElement.className = 'typing-text';
                typingIndicator.prepend(textElement);
            }
            
            textElement.textContent = typingText;
        } catch (error) {
            this.logger.error('사용자 타이핑 처리 중 오류 발생:', error);
        }
    }

    /**
     * 좋아요 업데이트 처리
     * @param {string} event - 이벤트 유형 (new_like 또는 remove_like)
     * @param {Object} payload - 이벤트 데이터
     */
    async handleLikeUpdate(event, payload) {
        try {
            this.logger.debug(`좋아요 업데이트 수신: ${event}`, payload);
            
            // 메시지 ID 가져오기
            const messageId = payload.message_id;
            
            // 메시지 요소 찾기
            const messageElement = this.findMessageElement(messageId);
            
            if (!messageElement) return;
            
            // 좋아요 목록 가져오기
            const likes = await this.chatManager.getLikes(messageId);
            
            // 좋아요 카운트 요소 업데이트
            const likeButton = messageElement.querySelector('.like-button');
            
            if (likeButton) {
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
            }
        } catch (error) {
            this.logger.error('좋아요 업데이트 처리 중 오류 발생:', error);
        }
    }

    /**
     * 메시지 좋아요 토글
     * @param {string} messageId - 메시지 ID
     */
    async toggleMessageLike(messageId) {
        try {
            await this.chatManager.toggleLike(messageId);
        } catch (error) {
            this.logger.error('메시지 좋아요 토글 중 오류 발생:', error);
            
            // 사용자에게 오류 알림
            const errorEvent = new CustomEvent('chat:error', {
                detail: { message: '좋아요 처리에 실패했습니다. 다시 시도해주세요.' },
            });
            document.dispatchEvent(errorEvent);
        }
    }

    /**
     * ID로 메시지 요소 찾기
     * @param {string} messageId - 메시지 ID
     * @returns {HTMLElement|null} - 메시지 요소 또는 null
     */
    findMessageElement(messageId) {
        return this.elements.messagesContainer.querySelector(`.message[data-id="${messageId}"]`);
    }

    /**
     * 메시지 요소 생성
     * @param {Object} message - 메시지 객체
     * @returns {HTMLElement} - 메시지 요소
     */
    createMessageElement(message) {
        // 시스템 메시지인 경우
        if (message.system_message) {
            const systemMessage = document.createElement('div');
            systemMessage.className = 'system-message';
            systemMessage.textContent = message.content;
            return systemMessage;
        }
        
        // 일반 메시지
        const currentUser = this.userService.getCurrentUser();
        const isMyMessage = currentUser && message.author_email === currentUser.email;
        
        // 메시지 요소 생성
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isMyMessage ? 'mine' : 'others'}`;
        messageElement.dataset.id = message.id;
        
        // 메시지 헤더 (작성자 이름, 시간)
        if (!isMyMessage) {
            const header = document.createElement('div');
            header.className = 'message-header';
            
            // 작성자 이름
            const sender = document.createElement('span');
            sender.className = 'sender';
            sender.textContent = message.author_name;
            header.appendChild(sender);
            
            // 역할 배지
            if (message.user_role) {
                const roleBadge = document.createElement('span');
                roleBadge.className = `role-badge ${message.user_role}`;
                roleBadge.textContent = this.getRoleDisplayName(message.user_role);
                header.appendChild(roleBadge);
            }
            
            // 시간
            const time = document.createElement('span');
            time.className = 'time';
            time.textContent = this.formatTime(message.created_at);
            header.appendChild(time);
            
            messageElement.appendChild(header);
        } else {
            // 내 메시지인 경우 시간만 표시
            const header = document.createElement('div');
            header.className = 'message-header';
            
            const time = document.createElement('span');
            time.className = 'time';
            time.textContent = this.formatTime(message.created_at);
            header.appendChild(time);
            
            messageElement.appendChild(header);
        }
        
        // 메시지 내용
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // 번역된 내용이 있으면 번역된 내용 표시, 없으면 원본 내용 표시
        content.textContent = message.translatedContent || message.content;
        
        messageElement.appendChild(content);
        
        // 메시지 푸터 (좋아요 버튼 등)
        const footer = document.createElement('div');
        footer.className = 'message-footer';
        
        // 번역 정보
        if (message.translatedContent) {
            const translationInfo = document.createElement('div');
            translationInfo.className = 'translation-info';
            translationInfo.innerHTML = `
                <span class="translation-toggle">원문 보기</span>
                <span class="translation-language">${this.translationService.getLanguageName(message.translatedLanguage)}로 번역됨</span>
            `;
            
            // 원문/번역 토글 이벤트
            const toggleBtn = translationInfo.querySelector('.translation-toggle');
            toggleBtn.addEventListener('click', () => {
                const isShowingOriginal = toggleBtn.textContent === '번역 보기';
                
                if (isShowingOriginal) {
                    // 번역본으로 전환
                    content.textContent = message.translatedContent;
                    toggleBtn.textContent = '원문 보기';
                } else {
                    // 원문으로 전환
                    content.textContent = message.content;
                    toggleBtn.textContent = '번역 보기';
                }
            });
            
            footer.appendChild(translationInfo);
        }
        
        // 메시지 액션 (좋아요 등)
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        // 좋아요 버튼
        const likeButton = document.createElement('div');
        likeButton.className = 'like-button';
        likeButton.innerHTML = `
            <i class="far fa-heart"></i>
            <span class="like-count"></span>
        `;
        
        // 좋아요 클릭 이벤트
        likeButton.addEventListener('click', () => {
            this.toggleMessageLike(message.id);
        });
        
        actions.appendChild(likeButton);
        footer.appendChild(actions);
        messageElement.appendChild(footer);
        
        return messageElement;
    }

    /**
     * 메시지 요소 업데이트
     * @param {HTMLElement} element - 메시지 요소
     * @param {Object} message - 메시지 객체
     */
    updateMessageElement(element, message) {
        // 내용 업데이트
        const contentElement = element.querySelector('.message-content');
        
        if (contentElement && message.content !== contentElement.textContent) {
            contentElement.textContent = message.content;
        }
        
        // 기타 필요한 업데이트...
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
        };
        
        return roleMap[role] || role;
    }

    /**
     * 스크롤을 아래로 이동
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    scrollToBottom(smooth = false) {
        if (!this.elements.messagesContainer) return;
        
        this.elements.messagesContainer.scrollTo({
            top: this.elements.messagesContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto',
        });
    }

    /**
     * 메시지 목록 렌더링
     * @param {Array} messages - 메시지 목록
     */
    renderMessages(messages) {
        try {
            if (!this.elements.messagesContainer) return;
            
            // 메시지 컨테이너 초기화
            this.elements.messagesContainer.innerHTML = '';
            
            // 각 메시지 렌더링
            for (const message of messages) {
                const messageElement = this.createMessageElement(message);
                this.elements.messagesContainer.appendChild(messageElement);
            }
            
            // 스크롤 아래로
            this.scrollToBottom();
        } catch (error) {
            this.logger.error('메시지 목록 렌더링 중 오류 발생:', error);
        }
    }

    /**
     * 채팅 인터페이스 표시
     */
    show() {
        if (!this.elements.chatInterface) return;
        
        this.elements.chatInterface.classList.remove('hidden');
    }

    /**
     * 채팅 인터페이스 숨기기
     */
    hide() {
        if (!this.elements.chatInterface) return;
        
        this.elements.chatInterface.classList.add('hidden');
    }
}
