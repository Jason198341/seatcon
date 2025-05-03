/**
 * UI 컨트롤러
 * 
 * 고급 애니메이션과 사용자 인터페이스 상호작용을 관리합니다.
 * 부드럽고 자연스러운 UX를 제공하는 고품질 인터랙션 구현.
 */
class UIController {
    constructor() {
        // 현재 활성화된 화면
        this.currentScreen = 'role-screen';
        
        // 다크 모드 상태
        this.isDarkMode = false;
        
        // 패널 상태
        this.activePanel = null;
        
        // 애니메이션 상태
        this.animating = false;
        
        // 초기화
        this.init();
    }
    
    /**
     * UI 컨트롤러 초기화
     */
    init() {
        console.log('UI 컨트롤러 초기화');
        
        // 저장된 테마 적용
        this.initTheme();
        
        // 스크롤 이벤트 리스너 추가
        this.setupScrollListeners();
        
        // 리플 효과 초기화
        this.initRippleEffect();
        
        // 텍스트 영역 자동 높이 조절 적용
        this.initAutoResizeTextarea();
        
        // 키보드 사용자 감지
        this.detectKeyboardUser();
    }
    
    /**
     * 테마 초기화 및 적용
     */
    initTheme() {
        // 저장된 테마 확인
        const savedTheme = localStorage.getItem('theme');
        
        // 시스템 설정 확인
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 테마 적용
        if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
            this.enableDarkMode();
            
            // 테마 스위치 업데이트 (있는 경우)
            const themeSwitch = document.getElementById('theme-switch');
            if (themeSwitch) {
                themeSwitch.checked = true;
            }
        } else {
            this.enableLightMode();
        }
        
        // 테마 전환 이벤트 리스너 추가
        this.setupThemeToggle();
    }
    
    /**
     * 다크 모드 활성화
     */
    enableDarkMode() {
        document.body.classList.add('dark-theme');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#111827');
        localStorage.setItem('theme', 'dark');
        this.isDarkMode = true;
    }
    
    /**
     * 라이트 모드 활성화
     */
    enableLightMode() {
        document.body.classList.remove('dark-theme');
        document.querySelector('meta[name="theme-color"]').setAttribute('content', '#6200EA');
        localStorage.setItem('theme', 'light');
        this.isDarkMode = false;
    }
    
    /**
     * 테마 전환 설정
     */
    setupThemeToggle() {
        const themeSwitch = document.getElementById('theme-switch');
        if (themeSwitch) {
            themeSwitch.addEventListener('change', () => {
                if (themeSwitch.checked) {
                    this.enableDarkMode();
                } else {
                    this.enableLightMode();
                }
                
                // 테마 전환 애니메이션
                this.animateThemeTransition();
            });
        }
    }
    
    /**
     * 테마 전환 애니메이션
     */
    animateThemeTransition() {
        const overlay = document.createElement('div');
        overlay.classList.add('theme-transition-overlay');
        document.body.appendChild(overlay);
        
        // 애니메이션 완료 후 제거
        setTimeout(() => {
            overlay.remove();
        }, 500);
    }
    
    /**
     * 스크롤 리스너 설정
     */
    setupScrollListeners() {
        const chatMessages = document.querySelector('.chat-messages');
        const chatHeader = document.querySelector('.chat-header');
        
        if (chatMessages && chatHeader) {
            chatMessages.addEventListener('scroll', () => {
                if (chatMessages.scrollTop > 10) {
                    chatHeader.classList.add('scrolled');
                } else {
                    chatHeader.classList.remove('scrolled');
                }
                
                // 스크롤 하단 버튼 표시 여부
                this.updateScrollBottomButton(chatMessages);
            });
        }
    }
    
    /**
     * 스크롤 하단 버튼 업데이트
     * @param {HTMLElement} container - 스크롤 컨테이너
     */
    updateScrollBottomButton(container) {
        const scrollBottomButton = document.getElementById('scroll-bottom-button');
        if (!scrollBottomButton) return;
        
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        
        if (isNearBottom) {
            scrollBottomButton.classList.add('hidden');
        } else {
            scrollBottomButton.classList.remove('hidden');
        }
    }
    
    /**
     * 스크롤을 하단으로 이동
     * @param {boolean} smooth - 부드러운 스크롤 여부
     */
    scrollToBottom(smooth = true) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        const scrollOptions = smooth ? { behavior: 'smooth' } : undefined;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * 리플 효과 초기화
     */
    initRippleEffect() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // 버튼이나 리플 효과 요소에만 적용
            if (target.classList.contains('ripple-effect') || 
                target.classList.contains('btn') || 
                target.closest('.ripple-effect') || 
                target.closest('.btn')) {
                
                const element = target.classList.contains('ripple-effect') || target.classList.contains('btn')
                    ? target
                    : target.closest('.ripple-effect') || target.closest('.btn');
                
                this.createRipple(element, event);
            }
        });
    }
    
    /**
     * 리플 효과 생성
     * @param {HTMLElement} element - 리플 효과를 적용할 요소
     * @param {MouseEvent} event - 클릭 이벤트
     */
    createRipple(element, event) {
        const rect = element.getBoundingClientRect();
        
        const left = event.clientX - rect.left;
        const top = event.clientY - rect.top;
        
        const circle = document.createElement('span');
        circle.classList.add('ripple');
        
        const diameter = Math.max(rect.width, rect.height);
        circle.style.width = circle.style.height = `${diameter}px`;
        
        circle.style.left = `${left - diameter / 2}px`;
        circle.style.top = `${top - diameter / 2}px`;
        
        element.appendChild(circle);
        
        // 애니메이션 완료 후 제거
        circle.addEventListener('animationend', () => {
            circle.remove();
        });
    }
    
    /**
     * 텍스트 영역 자동 높이 조절 적용
     */
    initAutoResizeTextarea() {
        document.addEventListener('input', (event) => {
            const target = event.target;
            
            if (target.tagName.toLowerCase() === 'textarea' && target.classList.contains('auto-height')) {
                this.autoResizeTextarea(target);
            }
        });
        
        // 메시지 입력 필드에 적용
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.classList.add('auto-height');
            this.autoResizeTextarea(messageInput);
            
            // 포커스시 자동 높이 조절
            messageInput.addEventListener('focus', () => {
                this.autoResizeTextarea(messageInput);
            });
        }
    }
    
    /**
     * 텍스트 영역 자동 높이 조절
     * @param {HTMLTextAreaElement} textarea - 텍스트 영역 요소
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
    
    /**
     * 키보드 사용자 감지
     */
    detectKeyboardUser() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                document.body.classList.add('keyboard-user');
            }
        });
        
        window.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-user');
        });
    }
    
    /**
     * 화면 전환
     * @param {string} screenId - 전환할 화면 ID
     * @param {boolean} isBackward - 뒤로가기 여부
     */
    changeScreen(screenId, isBackward = false) {
        if (this.animating || this.currentScreen === screenId) return;
        
        this.animating = true;
        
        const currentScreenElement = document.getElementById(this.currentScreen);
        const nextScreenElement = document.getElementById(screenId);
        
        if (!currentScreenElement || !nextScreenElement) {
            console.error('화면 요소를 찾을 수 없습니다.');
            this.animating = false;
            return;
        }
        
        // 다음 화면 준비
        nextScreenElement.classList.remove('hidden');
        
        // 현재 화면 위치 설정
        currentScreenElement.style.transform = 'translateX(0)';
        nextScreenElement.style.transform = isBackward ? 'translateX(-100%)' : 'translateX(100%)';
        
        // 전환 효과를 위한 타이밍 함수 및 지속 시간
        const duration = 300;
        const easing = 'cubic-bezier(0.4, 0.0, 0.2, 1)';
        
        // 전환 애니메이션
        setTimeout(() => {
            currentScreenElement.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
            nextScreenElement.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
            
            currentScreenElement.style.transform = isBackward ? 'translateX(100%)' : 'translateX(-100%)';
            currentScreenElement.style.opacity = '0';
            
            nextScreenElement.style.transform = 'translateX(0)';
            nextScreenElement.style.opacity = '1';
        }, 20);
        
        // 애니메이션 완료 후 정리
        setTimeout(() => {
            currentScreenElement.classList.add('hidden');
            currentScreenElement.style.transform = '';
            currentScreenElement.style.opacity = '';
            currentScreenElement.style.transition = '';
            
            nextScreenElement.style.transform = '';
            nextScreenElement.style.opacity = '';
            nextScreenElement.style.transition = '';
            
            this.currentScreen = screenId;
            this.animating = false;
            
            // 채팅 화면으로 전환시 스크롤을 하단으로
            if (screenId === 'chat-screen') {
                this.scrollToBottom(false);
            }
        }, duration + 50);
    }
    
    /**
     * 패널 표시
     * @param {string} panelId - 패널 ID
     */
    showPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        // 이미 열린 패널이 있으면 닫기
        if (this.activePanel && this.activePanel !== panelId) {
            this.hidePanel(this.activePanel);
        }
        
        // 패널 표시
        panel.classList.add('visible');
        this.activePanel = panelId;
        
        // 오버레이 추가
        this.addPanelOverlay();
    }
    
    /**
     * 패널 숨기기
     * @param {string} panelId - 패널 ID
     */
    hidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        // 패널 숨기기
        panel.classList.remove('visible');
        
        if (this.activePanel === panelId) {
            this.activePanel = null;
        }
        
        // 오버레이 제거
        this.removePanelOverlay();
    }
    
    /**
     * 패널 오버레이 추가
     */
    addPanelOverlay() {
        // 이미 있으면 제거
        this.removePanelOverlay();
        
        // 오버레이 생성
        const overlay = document.createElement('div');
        overlay.classList.add('panel-overlay');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        overlay.style.zIndex = '15';
        
        // 클릭시 활성 패널 닫기
        overlay.addEventListener('click', () => {
            if (this.activePanel) {
                this.hidePanel(this.activePanel);
            }
        });
        
        document.body.appendChild(overlay);
    }
    
    /**
     * 패널 오버레이 제거
     */
    removePanelOverlay() {
        const overlay = document.querySelector('.panel-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    /**
     * 토스트 메시지 표시
     * @param {string} message - 표시할 메시지
     * @param {string} type - 토스트 타입 (info, success, error, warning)
     * @param {number} duration - 표시 시간 (밀리초)
     */
    showToast(message, type = 'info', duration = 3000) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 아이콘 선택
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        // 토스트 생성
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.innerHTML = `
            <i class="toast-icon fas ${icon}"></i>
            <p class="toast-message">${message}</p>
        `;
        
        document.body.appendChild(toast);
        
        // 지정된 시간 후 제거
        setTimeout(() => {
            toast.classList.add('fade-out');
            
            // 페이드 아웃 애니메이션 후 제거
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
    
    /**
     * 로딩 오버레이 표시
     * @param {string} message - 로딩 메시지
     */
    showLoading(message = '로딩 중...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = loadingOverlay.querySelector('.loading-text');
        
        loadingText.textContent = message;
        loadingOverlay.classList.remove('hidden');
    }
    
    /**
     * 로딩 오버레이 숨기기
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.add('hidden');
    }
    
    /**
     * 새 메시지 알림 표시
     * @param {number} count - 새 메시지 수
     */
    showNewMessageNotification(count = 1) {
        // 이미 있으면 업데이트
        let notification = document.querySelector('.new-messages-notification');
        
        if (!notification) {
            // 생성
            notification = document.createElement('div');
            notification.classList.add('new-messages-notification');
            notification.addEventListener('click', () => {
                this.scrollToBottom();
                notification.remove();
            });
            
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) {
                chatContainer.appendChild(notification);
            }
        }
        
        // 메시지 설정
        notification.textContent = count > 1 
            ? `${count}개의 새 메시지 ${String.fromCodePoint(0x2B07)}` 
            : `새 메시지 ${String.fromCodePoint(0x2B07)}`;
    }
    
    /**
     * 입력 중 상태 표시
     * @param {string} userName - 입력 중인 사용자 이름
     * @param {boolean} isTyping - 입력 중인지 여부
     */
    showTypingIndicator(userName, isTyping) {
        let typingIndicator = document.querySelector('.typing-indicator');
        
        if (isTyping) {
            if (!typingIndicator) {
                typingIndicator = document.createElement('div');
                typingIndicator.classList.add('typing-indicator');
                typingIndicator.innerHTML = `
                    <div class="dots">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                `;
                
                const chatMessages = document.querySelector('.chat-messages');
                if (chatMessages) {
                    chatMessages.appendChild(typingIndicator);
                    this.scrollToBottom();
                }
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }
    
    /**
     * 시스템 메시지 추가
     * @param {string} message - 시스템 메시지
     */
    addSystemMessage(message) {
        const systemMessage = document.createElement('div');
        systemMessage.classList.add('system-message');
        systemMessage.textContent = message;
        
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.appendChild(systemMessage);
            this.scrollToBottom();
        }
    }
    
    /**
     * 날짜 구분선 추가
     * @param {string} dateText - 날짜 텍스트
     */
    addDateDivider(dateText) {
        const dateDivider = document.createElement('div');
        dateDivider.classList.add('date-divider');
        dateDivider.innerHTML = `<span class="date-divider-text">${dateText}</span>`;
        
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.appendChild(dateDivider);
        }
    }
    
    /**
     * 새 메시지 요소 생성
     * @param {Object} message - 메시지 객체
     * @param {boolean} isOwnMessage - 자신의 메시지 여부
     * @returns {HTMLElement} - 생성된 메시지 요소
     */
    createMessageElement(message, isOwnMessage) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');
        
        if (isOwnMessage) {
            messageContainer.classList.add('self');
        }
        
        if (message.is_moderator) {
            messageContainer.classList.add('moderator');
        }
        
        // 시간 포맷
        const messageDate = new Date(message.created_at);
        const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // 헤더
        const messageHeader = document.createElement('div');
        messageHeader.classList.add('message-header');
        messageHeader.innerHTML = `
            <span class="user-name">${message.user_name}</span>
            <span class="user-role ${message.is_moderator ? 'moderator' : ''}">${message.is_moderator ? '진행자' : '참가자'}</span>
        `;
        messageContainer.appendChild(messageHeader);
        
        // 버블
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble');
        messageBubble.textContent = message.content;
        messageContainer.appendChild(messageBubble);
        
        // 번역된 내용이 있으면 추가
        if (message.translatedContent) {
            const messageTranslation = document.createElement('div');
            messageTranslation.classList.add('message-translation');
            messageTranslation.textContent = message.translatedContent;
            messageContainer.appendChild(messageTranslation);
        }
        
        // 시간
        const messageTime = document.createElement('div');
        messageTime.classList.add('message-time');
        messageTime.textContent = timeString;
        messageContainer.appendChild(messageTime);
        
        return messageContainer;
    }
    
    /**
     * 새 공지사항 요소 생성
     * @param {Object} message - 메시지 객체
     * @returns {HTMLElement} - 생성된 공지사항 요소
     */
    createAnnouncementElement(message) {
        const announcement = document.createElement('div');
        announcement.classList.add('announcement');
        
        announcement.innerHTML = `
            <div class="announcement-header">
                <i class="announcement-icon fas fa-bullhorn"></i>
                <span class="announcement-title">공지사항</span>
            </div>
            <div class="announcement-content">${message.content}</div>
        `;
        
        return announcement;
    }
    
    /**
     * 새 메시지 추가
     * @param {Object} message - 메시지 객체
     * @param {boolean} isOwnMessage - 자신의 메시지 여부
     */
    addMessage(message, isOwnMessage = false) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        // 스크롤 위치 확인
        const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100;
        
        // 날짜 확인 및 구분선 추가
        this.checkAndAddDateDivider(message.created_at);
        
        let messageElement;
        
        // 공지사항인 경우
        if (message.is_announcement) {
            messageElement = this.createAnnouncementElement(message);
        } else {
            messageElement = this.createMessageElement(message, isOwnMessage);
        }
        
        chatMessages.appendChild(messageElement);
        
        // 스크롤 위치에 따라 자동 스크롤 또는 알림 표시
        if (isAtBottom) {
            this.scrollToBottom();
        } else if (!isOwnMessage) {
            this.showNewMessageNotification();
        }
    }
    
    /**
     * 날짜 확인 및 구분선 추가
     * @param {string} dateString - 날짜 문자열
     */
    checkAndAddDateDivider(dateString) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        const messageDate = new Date(dateString);
        const today = new Date();
        
        // 날짜 포맷
        const dateFormatter = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        const dateText = dateFormatter.format(messageDate);
        
        // 이미 해당 날짜 구분선이 있는지 확인
        const dateDividers = chatMessages.querySelectorAll('.date-divider');
        for (const divider of dateDividers) {
            if (divider.textContent === dateText) {
                return;
            }
        }
        
        // 새 구분선 추가
        this.addDateDivider(dateText);
    }
}

// 전역 인스턴스 생성
const uiController = new UIController();
