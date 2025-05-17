/**
 * UI 관련 모듈
 * 애플리케이션의 UI 요소 및 이벤트를 관리합니다.
 */

class UIManager {
    constructor() {
        this.screens = {
            start: document.getElementById('start-screen'),
            login: document.getElementById('login-screen'),
            adminLogin: document.getElementById('admin-login-screen'),
            chat: document.getElementById('chat-screen')
        };
        
        this.elements = {
            // 시작 화면
            joinChatBtn: document.getElementById('join-chat-btn'),
            adminBtn: document.getElementById('admin-btn'),
            languageSelect: document.getElementById('language-select'),
            
            // 로그인 화면
            loginForm: document.getElementById('login-form'),
            username: document.getElementById('username'),
            chatRoomSelect: document.getElementById('chat-room-select'),
            privateRoomCodeContainer: document.getElementById('private-room-code-container'),
            roomCode: document.getElementById('room-code'),
            backToStartBtn: document.getElementById('back-to-start-btn'),
            
            // 관리자 로그인 화면
            adminLoginForm: document.getElementById('admin-login-form'),
            adminId: document.getElementById('admin-id'),
            adminPassword: document.getElementById('admin-password'),
            adminBackBtn: document.getElementById('admin-back-btn'),
            
            // 채팅 화면
            currentRoomName: document.getElementById('current-room-name'),
            onlineUsersCount: document.getElementById('online-users-count'),
            chatLanguageSelect: document.getElementById('chat-language-select'),
            toggleUsersBtn: document.getElementById('toggle-users-btn'),
            leaveChatBtn: document.getElementById('leave-chat-btn'),
            messagesContainer: document.getElementById('messages-container'),
            usersSidebar: document.getElementById('users-sidebar'),
            usersList: document.getElementById('users-list'),
            replyContainer: document.getElementById('reply-container'),
            replyPreview: document.getElementById('reply-preview'),
            cancelReplyBtn: document.getElementById('cancel-reply-btn'),
            connectionStatus: document.getElementById('connection-status'),
            statusText: document.getElementById('status-text'),
            messageInput: document.getElementById('message-input'),
            sendMessageBtn: document.getElementById('send-message-btn')
        };
        
        this.currentReplyTo = null;
        
        // 이벤트 리스너 등록
        this.attachEventListeners();
    }

    /**
     * 이벤트 리스너 등록
     * @private
     */
    attachEventListeners() {
        // 시작 화면 이벤트
        this.elements.joinChatBtn.addEventListener('click', () => this.showScreen('login'));
        this.elements.adminBtn.addEventListener('click', () => this.showScreen('adminLogin'));
        this.elements.languageSelect.addEventListener('change', e => this.handleLanguageChange(e.target.value));
        
        // 로그인 화면 이벤트
        this.elements.loginForm.addEventListener('submit', e => this.handleLoginFormSubmit(e));
        this.elements.chatRoomSelect.addEventListener('change', e => this.handleChatRoomChange(e.target.value));
        this.elements.backToStartBtn.addEventListener('click', () => this.showScreen('start'));
        
        // 관리자 로그인 화면 이벤트
        this.elements.adminLoginForm.addEventListener('submit', e => this.handleAdminLoginFormSubmit(e));
        this.elements.adminBackBtn.addEventListener('click', () => this.showScreen('start'));
        
        // 채팅 화면 이벤트
        this.elements.chatLanguageSelect.addEventListener('change', e => this.handleChatLanguageChange(e.target.value));
        this.elements.toggleUsersBtn.addEventListener('click', () => this.toggleUsersSidebar());
        this.elements.leaveChatBtn.addEventListener('click', () => this.handleLeaveChat());
        this.elements.cancelReplyBtn.addEventListener('click', () => this.cancelReply());
        
        this.elements.messageInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        this.elements.sendMessageBtn.addEventListener('click', () => this.handleSendMessage());
        
        // 연결 상태 이벤트
        realtimeService.setConnectionStatusCallback(this.updateConnectionStatus.bind(this));
        offlineService.setConnectionStatusCallback(this.updateConnectionStatus.bind(this));
    }

    /**
     * 화면 전환
     * @param {string} screenName 화면 이름
     */
    showScreen(screenName) {
        // 모든 화면 숨기기
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 요청한 화면 표시
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    /**
     * 언어 변경 처리
     * @param {string} language 언어 코드
     */
    handleLanguageChange(language) {
        i18nService.setLanguage(language);
    }

    /**
     * 채팅방 변경 처리
     * @param {string} roomId 채팅방 ID
     */
    async handleChatRoomChange(roomId) {
        // 선택한 채팅방 정보 가져오기
        const room = await dbService.getChatRoom(roomId);
        
        // 비공개 채팅방이면 코드 입력 필드 표시
        if (room && room.type === 'private') {
            this.elements.privateRoomCodeContainer.classList.remove('hidden');
        } else {
            this.elements.privateRoomCodeContainer.classList.add('hidden');
        }
    }

    /**
     * 로그인 폼 제출 처리
     * @param {Event} event 이벤트 객체
     */
    async handleLoginFormSubmit(event) {
        event.preventDefault();
        
        const username = this.elements.username.value.trim();
        const roomId = this.elements.chatRoomSelect.value;
        const roomCode = this.elements.roomCode.value.trim();
        const language = i18nService.getCurrentLanguage();
        
        if (!username || !roomId) {
            return;
        }
        
        // 채팅방 접근 검증
        const accessResult = await dbService.validateRoomAccess(roomId, roomCode);
        
        if (!accessResult.success) {
            alert(i18nService.translate(accessResult.message));
            return;
        }
        
        // 사용자 생성 및 입장
        const userResult = await userService.createUser(roomId, username, language);
        
        if (!userResult.success) {
            alert(i18nService.translate('error-joining'));
            return;
        }
        
        // 채팅방 설정
        const chatResult = await chatService.setRoom(roomId);
        
        if (!chatResult) {
            alert(i18nService.translate('error-connecting'));
            return;
        }
        
        // 채팅방 정보 설정
        const room = await dbService.getChatRoom(roomId);
        this.elements.currentRoomName.textContent = room ? room.name : '';
        
        // 사용자 목록 새로고침
        await this.refreshUserList();
        
        // 채팅 화면으로 전환
        this.showScreen('chat');
    }

    /**
     * 관리자 로그인 폼 제출 처리
     * @param {Event} event 이벤트 객체
     */
    async handleAdminLoginFormSubmit(event) {
        event.preventDefault();
        
        const adminId = this.elements.adminId.value.trim();
        const password = this.elements.adminPassword.value;
        
        if (!adminId || !password) {
            return;
        }
        
        // 관리자 인증
        const result = await dbService.authenticateAdmin(adminId, password);
        
        if (!result.success) {
            alert(i18nService.translate('invalid-credentials'));
            return;
        }
        
        // 관리자 페이지로 이동
        window.location.href = 'admin/index.html';
    }

    /**
     * 채팅 언어 변경 처리
     * @param {string} language 언어 코드
     */
    async handleChatLanguageChange(language) {
        // 언어 변경
        i18nService.setLanguage(language);
        
        // 현재 사용자 선호 언어 업데이트
        await userService.updatePreferredLanguage(language);
        
        // 메시지 번역 새로고침
        this.refreshMessageTranslations();
    }

    /**
     * 사용자 목록 토글
     */
    toggleUsersSidebar() {
        this.elements.usersSidebar.classList.toggle('hidden');
    }

    /**
     * 채팅방 퇴장 처리
     */
    async handleLeaveChat() {
        // 채팅방 퇴장
        await userService.leaveRoom();
        
        // 채팅 서비스 정리
        chatService.leaveRoom();
        
        // 시작 화면으로 돌아가기
        this.showScreen('start');
    }

    /**
     * 메시지 전송 처리
     */
    async handleSendMessage() {
        const content = this.elements.messageInput.value.trim();
        
        if (!content) {
            return;
        }
        
        const language = i18nService.getCurrentLanguage();
        
        // 오프라인 상태면 로컬에 저장
        if (!offlineService.isConnected()) {
            const user = userService.getCurrentUser();
            
            offlineService.saveOfflineMessage({
                room_id: user.room_id,
                user_id: user.id,
                username: user.username,
                content: content,
                language: language,
                reply_to: this.currentReplyTo,
                is_announcement: content.startsWith('/공지 ') || content.startsWith('/notice ')
            });
            
            // 입력창 초기화
            this.elements.messageInput.value = '';
            
            // 답장 상태 초기화
            this.cancelReply();
            
            // 임시 메시지 표시
            this.addLocalMessage(content);
            
            return;
        }
        
        // 메시지 전송
        const result = await chatService.sendMessage(content, language, this.currentReplyTo);
        
        if (result.success) {
            // 입력창 초기화
            this.elements.messageInput.value = '';
            
            // 답장 상태 초기화
            this.cancelReply();
        }
    }

    /**
     * 답장 설정
     * @param {string} messageId 대상 메시지 ID
     * @param {string} senderName 발신자 이름
     * @param {string} content 메시지 내용
     */
    setReplyTo(messageId, senderName, content) {
        this.currentReplyTo = messageId;
        
        // 미리보기 설정
        this.elements.replyPreview.innerHTML = `
            <strong>${i18nService.translate('replying-to')} ${senderName}</strong>
            <div>${content.substring(0, 50)}${content.length > 50 ? '...' : ''}</div>
        `;
        
        // 답장 컨테이너 표시
        this.elements.replyContainer.classList.remove('hidden');
        
        // 입력창에 포커스
        this.elements.messageInput.focus();
    }

    /**
     * 답장 취소
     */
    cancelReply() {
        this.currentReplyTo = null;
        this.elements.replyPreview.innerHTML = '';
        this.elements.replyContainer.classList.add('hidden');
    }

    /**
     * 연결 상태 업데이트
     * @param {boolean} isConnected 연결 상태
     */
    updateConnectionStatus(isConnected) {
        if (isConnected) {
            this.elements.connectionStatus.classList.remove('offline');
            this.elements.connectionStatus.classList.add('online');
            this.elements.statusText.textContent = i18nService.translate('online');
            
            // 오프라인 메시지 동기화
            if (offlineService.getPendingMessageCount() > 0) {
                offlineService.syncOfflineMessages();
            }
        } else {
            this.elements.connectionStatus.classList.remove('online');
            this.elements.connectionStatus.classList.add('offline');
            this.elements.statusText.textContent = i18nService.translate('offline');
        }
    }

    /**
     * 채팅방 목록 로드
     */
    async loadChatRooms() {
        try {
            const rooms = await dbService.getChatRooms(true);
            
            // 채팅방 선택 드롭다운 초기화
            this.elements.chatRoomSelect.innerHTML = '';
            
            // 기본 옵션 추가
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = i18nService.translate('select-room');
            defaultOption.disabled = true;
            defaultOption.selected = true;
            this.elements.chatRoomSelect.appendChild(defaultOption);
            
            // 채팅방 목록 추가
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = room.name;
                if (room.type === 'private') {
                    option.textContent += ` (${i18nService.translate('private')})`;
                }
                this.elements.chatRoomSelect.appendChild(option);
            });
            
            return true;
        } catch (error) {
            console.error('Error loading chat rooms:', error);
            return false;
        }
    }

    /**
     * 사용자 목록 새로고침
     */
    async refreshUserList() {
        const currentUser = userService.getCurrentUser();
        if (!currentUser) {
            return;
        }
        
        // 사용자 목록 가져오기
        const users = await userService.refreshUserList(currentUser.room_id);
        
        // 사용자 목록 UI 업데이트
        this.elements.usersList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username;
            
            // 현재 사용자 표시
            if (user.id === currentUser.id) {
                li.textContent += ` (${i18nService.translate('you')})`;
                li.classList.add('current-user');
            }
            
            this.elements.usersList.appendChild(li);
        });
        
        // 접속자 수 업데이트
        this.elements.onlineUsersCount.textContent = `${users.length} ${i18nService.translate('users-online')}`;
    }

    /**
     * 새 메시지 추가
     * @param {Object} message 메시지 정보
     */
    async addMessage(message) {
        const currentUser = userService.getCurrentUser();
        const isOwnMessage = currentUser && message.user_id === currentUser.id;
        
        // 메시지 요소 생성
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.setAttribute('data-message-id', message.id);
        
        // 공지사항이면 특별한 스타일 적용
        if (message.is_announcement) {
            messageElement.classList.add('announcement');
            messageElement.innerHTML = `
                <div class="message-body">
                    <div class="message-text">${this.escapeHTML(message.content)}</div>
                </div>
            `;
        } else {
            // 답장 여부 확인
            let replyHtml = '';
            if (message.reply_to) {
                messageElement.classList.add('reply-message');
                
                // 원본 메시지 가져오기
                const originalMessage = await chatService.getMessage(message.reply_to);
                
                if (originalMessage) {
                    replyHtml = `
                        <div class="reply-to">${i18nService.translate('replying-to')} ${originalMessage.username}</div>
                        <div class="original-message">${this.escapeHTML(originalMessage.content).substring(0, 100)}${originalMessage.content.length > 100 ? '...' : ''}</div>
                    `;
                }
            }
            
            // 일반 메시지
            messageElement.innerHTML = `
                <div class="message-avatar">
                    ${message.username.charAt(0).toUpperCase()}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${message.username}</span>
                        <span class="message-time">${this.formatTime(message.created_at)}</span>
                    </div>
                    <div class="message-body ${isOwnMessage ? 'own-message' : ''}">
                        ${replyHtml}
                        <div class="message-text">${this.escapeHTML(message.content)}</div>
                        <div class="message-translation"></div>
                        <div class="message-actions">
                            <button class="message-action-btn reply-btn" title="${i18nService.translate('reply')}">
                                <i class="fas fa-reply"></i>
                            </button>
                            <button class="message-action-btn copy-btn" title="${i18nService.translate('copy')}">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // 메시지 번역
            this.translateMessage(message, messageElement);
            
            // 메시지 액션 이벤트 등록
            const replyBtn = messageElement.querySelector('.reply-btn');
            const copyBtn = messageElement.querySelector('.copy-btn');
            
            if (replyBtn) {
                replyBtn.addEventListener('click', () => {
                    this.setReplyTo(message.id, message.username, message.content);
                });
            }
            
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copyTextToClipboard(message.content);
                });
            }
        }
        
        // 메시지 목록에 추가
        this.elements.messagesContainer.appendChild(messageElement);
        
        // 자동 스크롤
        this.scrollToBottom();
    }

    /**
     * 임시 로컬 메시지 추가 (오프라인 모드)
     * @param {string} content 메시지 내용
     */
    addLocalMessage(content) {
        const currentUser = userService.getCurrentUser();
        
        // 메시지 요소 생성
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'local-message');
        
        // 공지사항이면 특별한 스타일 적용
        if (content.startsWith('/공지 ') || content.startsWith('/notice ')) {
            content = content.replace(/^\/(?:공지|notice) /, '');
            messageElement.classList.add('announcement');
            messageElement.innerHTML = `
                <div class="message-body">
                    <div class="message-text">${this.escapeHTML(content)}</div>
                </div>
                <div class="message-pending">${i18nService.translate('sending')}...</div>
            `;
        } else {
            // 일반 메시지
            messageElement.innerHTML = `
                <div class="message-avatar">
                    ${currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${currentUser.username}</span>
                        <span class="message-time">${this.formatTime(new Date().toISOString())}</span>
                    </div>
                    <div class="message-body own-message">
                        <div class="message-text">${this.escapeHTML(content)}</div>
                    </div>
                </div>
                <div class="message-pending">${i18nService.translate('sending')}...</div>
            `;
        }
        
        // 메시지 목록에 추가
        this.elements.messagesContainer.appendChild(messageElement);
        
        // 자동 스크롤
        this.scrollToBottom();
    }

    /**
     * 메시지 번역
     * @param {Object} message 메시지 정보
     * @param {HTMLElement} messageElement 메시지 요소
     */
    async translateMessage(message, messageElement) {
        const currentUser = userService.getCurrentUser();
        if (!currentUser || message.language === currentUser.preferred_language) {
            return;
        }
        
        const translationElement = messageElement.querySelector('.message-translation');
        if (!translationElement) {
            return;
        }
        
        try {
            const result = await chatService.translateMessage(message.id, currentUser.preferred_language);
            
            if (result.success) {
                const originalLanguage = i18nService.getLanguageName(message.language);
                translationElement.innerHTML = `
                    <span class="translation-label">${i18nService.translate('translated-from')} ${originalLanguage}</span>
                    <div class="translation-text">${this.escapeHTML(result.translation)}</div>
                `;
            }
        } catch (error) {
            console.error('Error translating message:', error);
        }
    }

    /**
     * 메시지 번역 새로고침
     */
    refreshMessageTranslations() {
        const messages = chatService.getMessages();
        const messageElements = this.elements.messagesContainer.querySelectorAll('.message[data-message-id]');
        
        messageElements.forEach(element => {
            const messageId = element.getAttribute('data-message-id');
            const message = messages.find(msg => msg.id === messageId);
            
            if (message) {
                this.translateMessage(message, element);
            }
        });
    }

    /**
     * 메시지 목록 초기화 및 표시
     * @param {Array} messages 메시지 목록
     */
    displayMessages(messages) {
        // 메시지 목록 초기화
        this.elements.messagesContainer.innerHTML = '';
        
        // 메시지 추가
        messages.forEach(message => {
            this.addMessage(message);
        });
        
        // 자동 스크롤
        this.scrollToBottom();
    }

    /**
     * 스크롤을 메시지 목록 하단으로 이동
     */
    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    /**
     * HTML 이스케이프
     * @param {string} text HTML 이스케이프할 텍스트
     * @returns {string} 이스케이프된 텍스트
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    }

    /**
     * 시간 포맷
     * @param {string} timestamp ISO 형식 시간
     * @returns {string} 포맷된 시간
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    /**
     * 텍스트를 클립보드에 복사
     * @param {string} text 복사할 텍스트
     */
    copyTextToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                // 임시 알림 표시
                const notification = document.createElement('div');
                notification.classList.add('copy-notification');
                notification.textContent = i18nService.translate('copied');
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.classList.add('show');
                }, 10);
                
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 1500);
            })
            .catch(err => {
                console.error('Error copying text: ', err);
            });
    }
}

// 싱글톤 인스턴스 생성
const uiManager = new UIManager();

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // 채팅방 목록 로드
    await uiManager.loadChatRooms();
    
    // 언어 설정 콜백
    i18nService.setLanguageChangeCallback(() => {
        uiManager.refreshMessageTranslations();
    });
    
    // 메시지 콜백 설정
    chatService.setNewMessageCallback(message => {
        uiManager.addMessage(message);
    });
    
    chatService.setMessageHistoryCallback(messages => {
        uiManager.displayMessages(messages);
    });
    
    chatService.setUserJoinCallback(user => {
        uiManager.refreshUserList();
    });
    
    chatService.setUserLeaveCallback(user => {
        uiManager.refreshUserList();
    });
});
