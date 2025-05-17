/**
 * UI 관련 모듈
 * 애플리케이션의 UI 컴포넌트 및 상호작용을 관리합니다.
 */

class UIManager {
    constructor() {
        this.activeScreen = 'start'; // 초기 화면
        this.replyTo = null; // 답장 대상 메시지
    }

    /**
     * 초기화: 이벤트 리스너 등록
     */
    initialize() {
        console.log('Initializing UI manager...');
        
        // 화면 전환 버튼
        document.getElementById('join-chat-btn').addEventListener('click', () => {
            this.showScreen('login');
        });
        
        document.getElementById('admin-btn').addEventListener('click', () => {
            this.showScreen('admin-login');
        });
        
        document.getElementById('back-to-start-btn').addEventListener('click', () => {
            this.showScreen('start');
        });
        
        document.getElementById('admin-back-btn').addEventListener('click', () => {
            this.showScreen('start');
        });
        
        document.getElementById('leave-chat-btn').addEventListener('click', () => {
            this.handleLeaveChat();
        });
        
        // 로그인 폼 제출
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // 관리자 로그인 폼 제출
        document.getElementById('admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });
        
        // 메시지 전송
        document.getElementById('send-message-btn').addEventListener('click', () => {
            this.handleSendMessage();
        });
        
        // 메시지 입력 엔터 키 처리
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // 언어 선택 변경
        document.getElementById('language-select').addEventListener('change', (e) => {
            i18nService.setLanguage(e.target.value);
        });
        
        document.getElementById('chat-language-select').addEventListener('change', (e) => {
            i18nService.setLanguage(e.target.value);
            this.refreshMessages();
        });
        
        // 사용자 목록 토글
        document.getElementById('toggle-users-btn').addEventListener('click', () => {
            this.toggleUsersSidebar();
        });
        
        // 답장 취소
        document.getElementById('cancel-reply-btn').addEventListener('click', () => {
            this.cancelReply();
        });
        
        // 채팅방 유형 변경 시 접근 코드 필드 표시/숨김
        document.getElementById('chat-room-select').addEventListener('change', (e) => {
            this.handleRoomTypeChange(e.target.value);
        });
        
        console.log('UI manager initialized');
        return true;
    }

    /**
     * 화면 전환
     * @param {string} screenId 화면 ID ('start', 'login', 'admin-login', 'chat')
     */
    showScreen(screenId) {
        console.log('Showing screen:', screenId);
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 선택한 화면 표시
        document.getElementById(`${screenId}-screen`).classList.add('active');
        
        this.activeScreen = screenId;
        
        // 화면별 추가 작업
        if (screenId === 'login') {
            this.loadChatRooms();
        } else if (screenId === 'chat') {
            this.focusMessageInput();
            this.refreshUserList();
        }
    }

    /**
     * 채팅방 목록 로드
     */
    async loadChatRooms() {
        try {
            const select = document.getElementById('chat-room-select');
            
            // 로딩 표시
            select.innerHTML = `<option value="" disabled selected>${i18nService.translate('loading-rooms')}</option>`;
            
            // 채팅방 목록 가져오기
            const rooms = await dbService.getChatRooms(true);
            
            // 옵션 생성
            if (rooms.length === 0) {
                select.innerHTML = `<option value="" disabled selected>No available rooms</option>`;
                return;
            }
            
            select.innerHTML = '';
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.dataset.type = room.type;
                option.textContent = room.name;
                select.appendChild(option);
            });
            
            // 첫 번째 채팅방 선택
            select.selectedIndex = 0;
            
            // 선택된 채팅방 유형에 따라 접근 코드 필드 표시/숨김
            this.handleRoomTypeChange(select.value);
        } catch (error) {
            console.error('Error loading chat rooms:', error);
            document.getElementById('chat-room-select').innerHTML = `
                <option value="" disabled selected>Error loading rooms</option>
            `;
        }
    }

    /**
     * 채팅방 유형 변경 처리
     * @param {string} roomId 채팅방 ID
     */
    async handleRoomTypeChange(roomId) {
        if (!roomId) return;
        
        const select = document.getElementById('chat-room-select');
        const selectedOption = select.querySelector(`option[value="${roomId}"]`);
        const codeContainer = document.getElementById('private-room-code-container');
        
        if (selectedOption && selectedOption.dataset.type === 'private') {
            codeContainer.classList.remove('hidden');
        } else {
            codeContainer.classList.add('hidden');
        }
    }

    /**
     * 로그인 처리
     */
    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const roomId = document.getElementById('chat-room-select').value;
        const roomCode = document.getElementById('room-code').value.trim();
        
        if (!username) {
            alert(i18nService.translate('enter-username'));
            return;
        }
        
        if (!roomId) {
            alert(i18nService.translate('select-room'));
            return;
        }
        
        // 채팅방 입장
        const result = await appCore.joinChatRoom(roomId, username, roomCode);
        
        if (!result.success) {
            // 오류 처리
            alert(i18nService.translate(result.message));
            return;
        }
        
        // 채팅방 정보 가져오기
        const room = await dbService.getChatRoom(roomId);
        
        // 채팅 화면으로 전환
        document.getElementById('current-room-name').textContent = room.name;
        this.showScreen('chat');
        
        // 메시지 콜백 설정
        chatService.setMessageCallback(this.handleNewMessage.bind(this));
        chatService.setUserJoinCallback(this.handleUserJoin.bind(this));
        chatService.setUserLeaveCallback(this.handleUserLeave.bind(this));
        
        // 초기 메시지 로드
        this.refreshMessages();
    }

    /**
     * 관리자 로그인 처리
     */
    async handleAdminLogin() {
        const adminId = document.getElementById('admin-id').value.trim();
        const password = document.getElementById('admin-password').value;
        
        if (!adminId || !password) {
            alert(i18nService.translate('enter-admin-credentials'));
            return;
        }
        
        // 관리자 로그인
        const result = await appCore.adminLogin(adminId, password);
        
        if (!result.success) {
            alert(i18nService.translate('admin-login-failed'));
            return;
        }
        
        // 관리자 페이지로 이동
        window.location.href = 'admin/';
    }

    /**
     * 채팅방 퇴장 처리
     */
    async handleLeaveChat() {
        if (confirm(i18nService.translate('confirm-leave-chat'))) {
            await appCore.leaveChatRoom();
            this.showScreen('start');
        }
    }

    /**
     * 메시지 전송 처리
     */
    async handleSendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) {
            return;
        }
        
        // 메시지 전송
        const replyToId = this.replyTo ? this.replyTo.id : null;
        const result = await appCore.sendMessage(content, replyToId);
        
        // 입력 필드 초기화
        input.value = '';
        
        // 답장 취소
        if (this.replyTo) {
            this.cancelReply();
        }
        
        // 입력 필드에 포커스
        this.focusMessageInput();
    }

    /**
     * 새 메시지 수신 처리
     * @param {Object} message 메시지 객체
     */
    handleNewMessage(message) {
        console.log('New message received:', message);
        
        // 메시지 요소 생성
        const messageElement = this.createMessageElement(message);
        
        // 메시지 컨테이너에 추가
        const container = document.getElementById('messages-container');
        container.appendChild(messageElement);
        
        // 스크롤 아래로 이동
        this.scrollToBottom();
    }

    /**
     * 사용자 입장 처리
     * @param {Object} user 사용자 객체
     */
    handleUserJoin(user) {
        console.log('User joined:', user);
        
        // 시스템 메시지 추가
        this.addSystemMessage(`${user.username} ${i18nService.translate('user-joined')}`);
        
        // 사용자 목록 업데이트
        this.refreshUserList();
    }

    /**
     * 사용자 퇴장 처리
     * @param {Object} user 사용자 객체
     */
    handleUserLeave(user) {
        console.log('User left:', user);
        
        // 시스템 메시지 추가
        this.addSystemMessage(`${user.username} ${i18nService.translate('user-left')}`);
        
        // 사용자 목록 업데이트
        this.refreshUserList();
    }

    /**
     * 시스템 메시지 추가
     * @param {string} text 메시지 내용
     */
    addSystemMessage(text) {
        const container = document.getElementById('messages-container');
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system-message';
        messageElement.innerHTML = `<p>${text}</p>`;
        
        container.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * 메시지 요소 생성
     * @param {Object} message 메시지 객체
     * @returns {HTMLElement} 메시지 요소
     */
    createMessageElement(message) {
        // 현재 사용자 정보
        const currentUser = userService.getCurrentUser();
        const isOwnMessage = currentUser && message.user_id === currentUser.id;
        
        // 메시지 요소 생성
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwnMessage ? 'own-message' : ''}`;
        messageElement.dataset.id = message.id;
        
        // 공지사항 메시지
        if (message.is_announcement) {
            messageElement.classList.add('announcement');
        }
        
        // 메시지 헤더 (사용자 이름, 시간)
        const header = document.createElement('div');
        header.className = 'message-header';
        
        // 사용자 이름
        const username = document.createElement('span');
        username.className = 'username';
        username.textContent = message.username;
        header.appendChild(username);
        
        // 시간
        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = this.formatTime(message.created_at);
        header.appendChild(time);
        
        messageElement.appendChild(header);
        
        // 답장인 경우 원본 메시지 표시
        if (message.reply_to) {
            const replyContainer = document.createElement('div');
            replyContainer.className = 'reply-info';
            
            // 원본 메시지 표시는 비동기로 처리
            chatService.getMessage(message.reply_to).then(originalMessage => {
                if (originalMessage) {
                    const originalContent = document.createElement('p');
                    originalContent.className = 'original-message';
                    originalContent.textContent = `${i18nService.translate('replying-to')} ${originalMessage.username}: ${originalMessage.content.substring(0, 50)}${originalMessage.content.length > 50 ? '...' : ''}`;
                    replyContainer.appendChild(originalContent);
                }
            });
            
            messageElement.appendChild(replyContainer);
        }
        
        // 메시지 내용
        const content = document.createElement('p');
        content.className = 'message-content';
        content.textContent = message.content;
        messageElement.appendChild(content);
        
        // 번역된 메시지가 있으면 표시
        if (message.translated && message.translatedContent) {
            const translatedContent = document.createElement('p');
            translatedContent.className = 'translated-content';
            
            const translatedLabel = document.createElement('span');
            translatedLabel.className = 'translated-label';
            translatedLabel.textContent = `${i18nService.translate('translated-from')} ${i18nService.getLanguageName(message.language)}`;
            
            translatedContent.appendChild(translatedLabel);
            translatedContent.appendChild(document.createTextNode(message.translatedContent));
            
            messageElement.appendChild(translatedContent);
        }
        
        // 메시지 작업 (답장, 복사 등)
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        // 답장 버튼
        const replyButton = document.createElement('button');
        replyButton.className = 'action-btn reply-btn';
        replyButton.innerHTML = '<i class="fas fa-reply"></i>';
        replyButton.title = i18nService.translate('reply');
        replyButton.addEventListener('click', () => {
            this.setReplyTo(message);
        });
        actions.appendChild(replyButton);
        
        // 복사 버튼
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn copy-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = i18nService.translate('copy');
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(message.content)
                .then(() => {
                    // 복사 성공 알림
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 1000);
                })
                .catch(err => {
                    console.error('Error copying text:', err);
                });
        });
        actions.appendChild(copyButton);
        
        // 자신의 메시지가 아닌 경우 신고 버튼 추가
        if (!isOwnMessage) {
            const reportButton = document.createElement('button');
            reportButton.className = 'action-btn report-btn';
            reportButton.innerHTML = '<i class="fas fa-flag"></i>';
            reportButton.title = i18nService.translate('report');
            reportButton.addEventListener('click', () => {
                alert(i18nService.translate('report-message'));
                // 실제로는 신고 기능 구현 필요
            });
            actions.appendChild(reportButton);
        }
        
        messageElement.appendChild(actions);
        
        return messageElement;
    }

    /**
     * 메시지 새로고침
     */
    async refreshMessages() {
        const container = document.getElementById('messages-container');
        
        // 로딩 표시
        container.innerHTML = '<div class="loading-messages">Loading messages...</div>';
        
        // 최근 메시지 가져오기
        const messages = await chatService.getRecentMessages();
        
        container.innerHTML = '';
        
        // 메시지가 없으면 안내 메시지 표시
        if (messages.length === 0) {
            container.innerHTML = `<div class="no-messages">${i18nService.translate('no-messages')}</div>`;
            return;
        }
        
        // 메시지 표시
        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            container.appendChild(messageElement);
        });
        
        // 스크롤 아래로 이동
        this.scrollToBottom();
    }

    /**
     * 사용자 목록 새로고침
     */
    async refreshUserList() {
        const usersList = document.getElementById('users-list');
        
        // 로딩 표시
        usersList.innerHTML = '<li>Loading users...</li>';
        
        try {
            // 사용자 목록 가져오기
            const users = await userService.getRoomUsers();
            
            usersList.innerHTML = '';
            
            // 사용자 목록이 없으면 안내 메시지 표시
            if (users.length === 0) {
                usersList.innerHTML = '<li>No other users online</li>';
                
                // 온라인 사용자 수 업데이트
                document.getElementById('online-users-count').textContent = '1 online';
                
                return;
            }
            
            // 사용자 목록 표시
            users.forEach(user => {
                const userItem = document.createElement('li');
                userItem.dataset.id = user.id;
                
                const usernameSpan = document.createElement('span');
                usernameSpan.className = 'user-name';
                usernameSpan.textContent = user.username;
                
                const languageSpan = document.createElement('span');
                languageSpan.className = 'user-language';
                languageSpan.textContent = i18nService.getLanguageName(user.preferred_language);
                
                userItem.appendChild(usernameSpan);
                userItem.appendChild(languageSpan);
                
                usersList.appendChild(userItem);
            });
            
            // 온라인 사용자 수 업데이트
            document.getElementById('online-users-count').textContent = `${users.length + 1} online`;
        } catch (error) {
            console.error('Error refreshing user list:', error);
            usersList.innerHTML = '<li>Error loading users</li>';
        }
    }

    /**
     * 사용자 목록 사이드바 토글
     */
    toggleUsersSidebar() {
        const sidebar = document.getElementById('users-sidebar');
        sidebar.classList.toggle('hidden');
    }

    /**
     * 답장 설정
     * @param {Object} message 답장할 메시지
     */
    setReplyTo(message) {
        this.replyTo = message;
        
        // 답장 미리보기 표시
        const replyContainer = document.getElementById('reply-container');
        const replyPreview = document.getElementById('reply-preview');
        
        replyPreview.textContent = `${i18nService.translate('replying-to')} ${message.username}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`;
        
        replyContainer.classList.remove('hidden');
        
        // 입력 필드에 포커스
        this.focusMessageInput();
    }

    /**
     * 답장 취소
     */
    cancelReply() {
        this.replyTo = null;
        
        // 답장 미리보기 숨김
        const replyContainer = document.getElementById('reply-container');
        replyContainer.classList.add('hidden');
        
        // 입력 필드에 포커스
        this.focusMessageInput();
    }

    /**
     * 메시지 입력 필드에 포커스
     */
    focusMessageInput() {
        document.getElementById('message-input').focus();
    }

    /**
     * 메시지 컨테이너를 아래로 스크롤
     */
    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }

    /**
     * 연결 상태 표시 업데이트
     * @param {boolean} isConnected 연결 상태
     */
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');
        
        if (isConnected) {
            statusElement.className = 'connection-status online';
            statusText.textContent = i18nService.translate('online');
        } else {
            statusElement.className = 'connection-status offline';
            statusText.textContent = i18nService.translate('offline');
        }
    }

    /**
     * 날짜/시간 형식화
     * @param {string} dateString ISO 날짜 문자열
     * @returns {string} 형식화된 시간
     */
    formatTime(dateString) {
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // 오늘 날짜인지 확인
            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
            
            if (isToday) {
                // 시간만 표시
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                // 날짜와 시간 표시
                return date.toLocaleString([], { 
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('Error formatting time:', error);
            return '';
        }
    }
}

// 싱글톤 인스턴스 생성
const uiManager = new UIManager();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    uiManager.initialize();
});
