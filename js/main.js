/**
 * main.js
 * Global SeatCon 2025 컨퍼런스 채팅 메인 애플리케이션 로직
 */

// 전역 변수 및 상수
const APP = {
    // 애플리케이션 상태
    state: {
        initialized: false,
        isLoggedIn: false,
        currentUser: null,
        currentRoomId: null,
        currentRoom: null,
        preferredLanguage: 'ko',
        isUserListVisible: false,
        activityInterval: null
    },
    
    // DOM 요소
    elements: {},
    
    // 언어 및 번역 관련
    i18n: {
        // 지원 언어 코드 매핑
        languageCodes: {
            'ko': '한국어',
            'en': '영어',
            'ja': '일본어',
            'zh': '중국어'
        },
        
        // 현재 적용된 언어 사전
        dictionary: {}
    },
    
    // 메시지 렌더링 설정
    messages: {
        lastMessageTime: null,
        timeFormat: new Intl.DateTimeFormat('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }
};

// 애플리케이션 초기화
APP.init = async function() {
    if (APP.state.initialized) return;
    
    try {
        console.log('애플리케이션 초기화 시작...');
        
        // DOM 요소 참조 설정
        APP.setupDOMReferences();
        
        // 이벤트 리스너 등록
        APP.setupEventListeners();
        
        // 연결 상태 표시
        APP.updateConnectionStatus();
        
        // 저장된 사용자 정보 로드
        const savedUser = await userService.initializeUser();
        if (savedUser) {
            APP.state.currentUser = savedUser;
            APP.state.preferredLanguage = savedUser.preferred_language;
            APP.state.isLoggedIn = true;
        }
        
        // 언어 사전 로드
        await APP.loadLanguageDictionary(APP.state.preferredLanguage);
        
        // 채팅방 목록 로드
        await APP.loadChatRooms();
        
        // 로그인 상태에 따라 화면 전환
        if (APP.state.isLoggedIn) {
            await APP.enterChat(APP.state.currentUser.room_id);
        } else {
            APP.showLoginScreen();
        }
        
        APP.state.initialized = true;
        console.log('애플리케이션 초기화 완료');
    } catch (error) {
        console.error('애플리케이션 초기화 실패:', error);
        APP.showError('애플리케이션 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
    }
};

// DOM 요소 참조 설정
APP.setupDOMReferences = function() {
    // 컨테이너
    APP.elements.loginContainer = document.getElementById('login-container');
    APP.elements.chatContainer = document.getElementById('chat-container');
    
    // 로그인 화면 요소
    APP.elements.usernameInput = document.getElementById('username');
    APP.elements.languageSelect = document.getElementById('language-select');
    APP.elements.roomSelect = document.getElementById('room-select');
    APP.elements.privateRoomCode = document.getElementById('private-room-code');
    APP.elements.accessCode = document.getElementById('access-code');
    APP.elements.loginButton = document.getElementById('login-button');
    APP.elements.loginError = document.getElementById('login-error');
    
    // 채팅 화면 요소
    APP.elements.roomName = document.getElementById('room-name');
    APP.elements.messageContainer = document.getElementById('message-container');
    APP.elements.messageInput = document.getElementById('message-input');
    APP.elements.sendButton = document.getElementById('send-button');
    APP.elements.userListPanel = document.getElementById('user-list-panel');
    APP.elements.userList = document.getElementById('user-list');
    APP.elements.userListToggle = document.getElementById('user-list-toggle');
    APP.elements.exitChat = document.getElementById('exit-chat');
    APP.elements.currentLanguage = document.getElementById('current-language');
    APP.elements.changeLanguage = document.getElementById('change-language');
    
    // 모달
    APP.elements.languageModal = document.getElementById('language-modal');
    APP.elements.modalLanguageSelect = document.getElementById('modal-language-select');
    APP.elements.languageSave = document.getElementById('language-save');
    APP.elements.closeModalButtons = document.querySelectorAll('.close-modal');
    
    // 답장 관련 요소
    APP.elements.replyPreview = document.getElementById('reply-preview');
    
    // 연결 상태 표시 요소
    APP.elements.connectionIndicator = document.getElementById('connection-indicator');
    APP.elements.connectionText = document.getElementById('connection-text');
    APP.elements.chatConnectionIndicator = document.getElementById('chat-connection-indicator');
    APP.elements.chatConnectionText = document.getElementById('chat-connection-text');
    APP.elements.syncStatus = document.getElementById('sync-status');
};

// 이벤트 리스너 등록
APP.setupEventListeners = function() {
    // 로그인 이벤트
    APP.elements.loginButton.addEventListener('click', APP.handleLogin);
    APP.elements.usernameInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') APP.handleLogin();
    });
    
    // 채팅방 선택 변경 시 비공개 채팅방 코드 필드 토글
    APP.elements.roomSelect.addEventListener('change', APP.handleRoomSelectChange);
    
    // 메시지 전송 이벤트
    APP.elements.sendButton.addEventListener('click', APP.sendMessage);
    APP.elements.messageInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            APP.sendMessage();
        }
    });
    
    // 사용자 목록 토글
    APP.elements.userListToggle.addEventListener('click', APP.toggleUserList);
    
    // 채팅방 나가기
    APP.elements.exitChat.addEventListener('click', APP.handleLogout);
    
    // 언어 변경
    APP.elements.changeLanguage.addEventListener('click', APP.openLanguageModal);
    APP.elements.languageSave.addEventListener('click', APP.saveLanguage);
    
    // 모달 닫기
    APP.elements.closeModalButtons.forEach(button => {
        button.addEventListener('click', APP.closeModals);
    });
    
    // 연결 상태 변경 이벤트
    offlineService.onConnectionChange(APP.handleConnectionChange);
    
    // 메시지 수신 이벤트
    chatService.onMessage(APP.handleMessageEvent);
    
    // 창 종료 시 로그아웃
    window.addEventListener('beforeunload', APP.handleBeforeUnload);
};

// 로그인 처리
APP.handleLogin = async function() {
    try {
        // 입력값 가져오기
        const username = APP.elements.usernameInput.value.trim();
        const preferredLanguage = APP.elements.languageSelect.value;
        const roomId = APP.elements.roomSelect.value;
        const accessCode = APP.elements.accessCode.value;
        
        // 입력값 검증
        if (!username) {
            APP.showLoginError('사용자 이름을 입력해주세요.');
            return;
        }
        
        if (!roomId) {
            APP.showLoginError('채팅방을 선택해주세요.');
            return;
        }
        
        // 선택한 채팅방 정보 가져오기
        const selectedRoom = await dbService.getChatRoomById(roomId);
        
        // 비공개 채팅방 접근 코드 검증
        if (selectedRoom.is_private && selectedRoom.access_code !== accessCode) {
            APP.showLoginError('접근 코드가 올바르지 않습니다.');
            return;
        }
        
        // 로그인 수행
        const user = await userService.login(username, preferredLanguage, roomId);
        APP.state.currentUser = user;
        APP.state.preferredLanguage = preferredLanguage;
        APP.state.isLoggedIn = true;
        
        // 언어 사전 로드
        await APP.loadLanguageDictionary(preferredLanguage);
        
        // 채팅방 입장
        await APP.enterChat(roomId);
        
        // 정기적인 활동 상태 업데이트 시작
        APP.state.activityInterval = userService.startActivityUpdates();
    } catch (error) {
        console.error('로그인 처리 실패:', error);
        APP.showLoginError('로그인 처리 중 오류가 발생했습니다.');
    }
};

// 로그아웃 처리
APP.handleLogout = async function() {
    try {
        // 채팅방 퇴장
        await chatService.leaveRoom();
        
        // 활동 상태 업데이트 중지
        if (APP.state.activityInterval) {
            clearInterval(APP.state.activityInterval);
            APP.state.activityInterval = null;
        }
        
        // 로그아웃 수행
        await userService.logout();
        
        // 상태 초기화
        APP.state.currentUser = null;
        APP.state.isLoggedIn = false;
        APP.state.currentRoomId = null;
        APP.state.currentRoom = null;
        
        // 로그인 화면으로 전환
        APP.showLoginScreen();
    } catch (error) {
        console.error('로그아웃 처리 실패:', error);
        APP.showError('로그아웃 처리 중 오류가 발생했습니다.');
    }
};

// 창 종료 시 처리
APP.handleBeforeUnload = function(event) {
    if (APP.state.isLoggedIn) {
        userService.updateActivity();
    }
};

// 채팅방 선택 변경 처리
APP.handleRoomSelectChange = async function() {
    const roomId = APP.elements.roomSelect.value;
    
    if (!roomId) return;
    
    try {
        // 선택한 채팅방 정보 가져오기
        const room = await dbService.getChatRoomById(roomId);
        
        // 비공개 채팅방이면 접근 코드 필드 표시
        if (room.is_private) {
            APP.elements.privateRoomCode.classList.remove('hidden');
        } else {
            APP.elements.privateRoomCode.classList.add('hidden');
            APP.elements.accessCode.value = '';
        }
    } catch (error) {
        console.error('채팅방 정보 조회 실패:', error);
    }
};

// 채팅방 입장
APP.enterChat = async function(roomId) {
    try {
        // 채팅방 정보 가져오기
        const room = await dbService.getChatRoomById(roomId);
        APP.state.currentRoom = room;
        APP.state.currentRoomId = roomId;
        
        // 채팅방 이름 표시
        APP.elements.roomName.textContent = room.name;
        
        // 채팅방 입장 및 메시지 로드
        await chatService.joinRoom(roomId);
        
        // 사용자 언어 표시
        APP.updateLanguageDisplay();
        
        // 사용자 목록 로드
        await APP.loadUserList();
        
        // 채팅 화면으로 전환
        APP.showChatScreen();
        
        // 메시지 컨테이너 스크롤 최하단으로 이동
        APP.scrollToBottom();
    } catch (error) {
        console.error('채팅방 입장 실패:', error);
        APP.showError('채팅방 입장에 실패했습니다.');
    }
};

// 채팅방 목록 로드
APP.loadChatRooms = async function() {
    try {
        // 활성화된 채팅방만 조회
        const rooms = await dbService.getChatRooms(true);
        
        // 채팅방 선택 옵션 생성
        let options = '<option value="" disabled selected>채팅방을 선택하세요</option>';
        
        rooms.forEach(room => {
            options += `<option value="${room.id}">${room.name}${room.is_private ? ' 🔒' : ''}</option>`;
        });
        
        // 채팅방 선택 목록 업데이트
        APP.elements.roomSelect.innerHTML = options;
    } catch (error) {
        console.error('채팅방 목록 로드 실패:', error);
        APP.showLoginError('채팅방 목록을 불러오는데 실패했습니다.');
    }
};

// 사용자 목록 로드
APP.loadUserList = async function() {
    if (!APP.state.currentRoomId) return;
    
    try {
        // 현재 채팅방의 활성 사용자 조회
        const users = await userService.getRoomUsers(APP.state.currentRoomId, true);
        
        // 사용자 목록 HTML 생성
        let userListHTML = '';
        
        users.forEach(user => {
            const languageName = translationService.getLanguageName(user.preferred_language);
            userListHTML += `
                <li class="${user.id === APP.state.currentUser.id ? 'current-user' : ''}">
                    <span class="username">${user.username}</span>
                    <span class="user-language">${languageName}</span>
                </li>
            `;
        });
        
        // 사용자 목록 업데이트
        APP.elements.userList.innerHTML = userListHTML || '<li class="no-users">사용자가 없습니다</li>';
    } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
    }
};

// 메시지 전송
APP.sendMessage = async function() {
    const messageText = APP.elements.messageInput.value.trim();
    
    if (!messageText) return;
    
    try {
        // 공지사항 여부 확인
        const isAnnouncement = messageText.startsWith('/공지 ');
        const finalText = isAnnouncement ? messageText.substring(4).trim() : messageText;
        
        // 메시지 전송
        if (isAnnouncement) {
            await chatService.sendAnnouncement(finalText);
        } else {
            await chatService.sendMessage(finalText);
        }
        
        // 입력 필드 초기화
        APP.elements.messageInput.value = '';
        
        // 답장 정보 초기화
        APP.clearReplyPreview();
    } catch (error) {
        console.error('메시지 전송 실패:', error);
        APP.showError('메시지 전송에 실패했습니다.');
    }
};

// 메시지 이벤트 처리
APP.handleMessageEvent = function(eventType, messageData) {
    switch (eventType) {
        case 'new':
            // 새 메시지 추가
            APP.renderMessage(messageData);
            APP.scrollToBottom();
            break;
            
        case 'list':
            // 메시지 목록 렌더링
            APP.renderMessageList(messageData);
            APP.scrollToBottom();
            break;
            
        case 'update':
            // 메시지 업데이트
            APP.updateMessage(messageData);
            break;
    }
};

// 메시지 목록 렌더링
APP.renderMessageList = function(messages) {
    if (!messages || messages.length === 0) return;
    
    // 메시지 컨테이너 초기화
    APP.elements.messageContainer.innerHTML = '';
    APP.messages.lastMessageTime = null;
    
    // 각 메시지 렌더링
    messages.forEach(message => {
        APP.renderMessage(message, true);
    });
};

// 단일 메시지 렌더링
APP.renderMessage = function(message, skipScroll = false) {
    if (!message) return;
    
    // 메시지 시간 표시 여부 결정
    const messageDate = new Date(message.created_at);
    const showTime = !APP.messages.lastMessageTime || 
        (messageDate.getTime() - APP.messages.lastMessageTime.getTime() > 5 * 60 * 1000);
    
    if (showTime) {
        APP.messages.lastMessageTime = messageDate;
        
        // 시간 구분선 추가
        const timeDiv = document.createElement('div');
        timeDiv.className = 'time-divider';
        timeDiv.textContent = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        APP.elements.messageContainer.appendChild(timeDiv);
    }
    
    // 메시지 요소 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.id = message.id;
    
    // 자신의 메시지인지 공지인지에 따라 클래스 추가
    if (message.user_id === APP.state.currentUser.id) {
        messageDiv.classList.add('own');
    }
    
    if (message.isannouncement) {
        messageDiv.classList.add('announcement');
    }
    
    // 메시지 동기화 상태에 따른 클래스 추가
    if (message.isPending) {
        messageDiv.classList.add('pending');
    }
    
    if (message.isSyncing) {
        messageDiv.classList.add('syncing');
    }
    
    if (message.syncFailed) {
        messageDiv.classList.add('sync-failed');
    }
    
    // 메시지 내용 구성
    let messageContent = '';
    
    // 답장 정보가 있는 경우 추가
    if (message.reply_to) {
        messageContent += `
            <div class="reply-info">
                <div class="reply-username">${message.reply_to.username}</div>
                <div class="reply-text">${message.reply_to.message}</div>
            </div>
        `;
    }
    
    // 공지사항이 아닌 경우 메시지 헤더 추가
    if (!message.isannouncement) {
        messageContent += `
            <div class="message-header">
                <span class="message-username">${message.username}</span>
                <span class="message-time">${APP.messages.timeFormat.format(messageDate)}</span>
            </div>
        `;
    }
    
    // 메시지 텍스트 추가
    messageContent += `<div class="message-text">${APP.formatMessageText(message.message)}</div>`;
    
    // 번역된 메시지인 경우 원본 표시 버튼 추가
    if (message.translated && message.original_message) {
        messageContent += `
            <div class="translation-info">
                <span class="translation-label">번역됨</span>
                <button class="show-original" data-original="${encodeURIComponent(message.original_message)}" data-language="${message.language}">원본 보기</button>
            </div>
        `;
    }
    
    // 메시지 상태 표시
    if (message.isPending) {
        messageContent += '<div class="message-status pending">전송 중...</div>';
    } else if (message.isSyncing) {
        messageContent += '<div class="message-status syncing">동기화 중...</div>';
    } else if (message.syncFailed) {
        messageContent += '<div class="message-status failed">전송 실패</div>';
    }
    
    // 메시지 작업 버튼 추가 (자신의 메시지가 아닌 경우에만 답장 버튼 표시)
    if (!message.isannouncement && message.user_id !== APP.state.currentUser.id) {
        messageContent += `
            <div class="message-actions">
                <button class="reply-button" data-id="${message.id}">답장</button>
            </div>
        `;
    }
    
    // 메시지 내용 설정
    messageDiv.innerHTML = messageContent;
    
    // 메시지 이벤트 리스너 등록
    const replyButton = messageDiv.querySelector('.reply-button');
    if (replyButton) {
        replyButton.addEventListener('click', () => {
            APP.setReplyTo(message);
        });
    }
    
    const showOriginalButton = messageDiv.querySelector('.show-original');
    if (showOriginalButton) {
        showOriginalButton.addEventListener('click', function() {
            const originalText = decodeURIComponent(this.dataset.original);
            const language = translationService.getLanguageName(this.dataset.language);
            
            alert(`원본 메시지 (${language}):\n${originalText}`);
        });
    }
    
    // 메시지 컨테이너에 추가
    APP.elements.messageContainer.appendChild(messageDiv);
    
    // 스크롤 최하단으로 이동 (옵션에 따라)
    if (!skipScroll) {
        APP.scrollToBottom();
    }
};

// 메시지 업데이트
APP.updateMessage = function(message) {
    if (!message) return;
    
    // 메시지 요소 찾기
    const messageDiv = document.querySelector(`.message[data-id="${message.id}"]`);
    if (!messageDiv) return;
    
    // 상태 클래스 업데이트
    messageDiv.classList.remove('pending', 'syncing', 'sync-failed');
    
    if (message.isPending) {
        messageDiv.classList.add('pending');
    }
    
    if (message.isSyncing) {
        messageDiv.classList.add('syncing');
    }
    
    if (message.syncFailed) {
        messageDiv.classList.add('sync-failed');
    }
    
    // 상태 메시지 업데이트
    let statusDiv = messageDiv.querySelector('.message-status');
    
    if (!statusDiv && (message.isPending || message.isSyncing || message.syncFailed)) {
        statusDiv = document.createElement('div');
        statusDiv.className = 'message-status';
        messageDiv.appendChild(statusDiv);
    }
    
    if (statusDiv) {
        if (message.isPending) {
            statusDiv.className = 'message-status pending';
            statusDiv.textContent = '전송 중...';
        } else if (message.isSyncing) {
            statusDiv.className = 'message-status syncing';
            statusDiv.textContent = '동기화 중...';
        } else if (message.syncFailed) {
            statusDiv.className = 'message-status failed';
            statusDiv.textContent = '전송 실패';
        } else {
            statusDiv.remove();
        }
    }
};

// 메시지 텍스트 포맷팅
APP.formatMessageText = function(text) {
    if (!text) return '';
    
    // HTML 이스케이프
    text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // URL을 링크로 변환
    text = text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // 줄바꿈 처리
    text = text.replace(/\n/g, '<br>');
    
    return text;
};

// 답장 설정
APP.setReplyTo = function(message) {
    if (!message) return;
    
    // 답장 정보 설정
    chatService.setReplyTo(message);
    
    // 답장 미리보기 표시
    const previewContent = APP.elements.replyPreview.querySelector('.reply-content');
    previewContent.textContent = `${message.username}: ${message.message}`;
    
    // 답장 미리보기 표시 및 입력 필드 포커스
    APP.elements.replyPreview.classList.add('active');
    APP.elements.messageInput.focus();
    
    // 취소 버튼 이벤트 리스너 등록
    const cancelButton = APP.elements.replyPreview.querySelector('.cancel-reply');
    cancelButton.onclick = APP.clearReplyPreview;
};

// 답장 미리보기 초기화
APP.clearReplyPreview = function() {
    // 답장 정보 초기화
    chatService.clearReplyTo();
    
    // 답장 미리보기 숨기기
    APP.elements.replyPreview.classList.remove('active');
};

// 언어 사전 로드
APP.loadLanguageDictionary = async function(language) {
    // 기본 언어는 한국어
    language = language || 'ko';
    
    try {
        // TODO: 실제 환경에서는 서버에서 언어 사전을 로드
        // 현재는 간단하게 지원하는 언어 이름만 사전에 추가
        APP.i18n.dictionary = {
            'ko': {
                'app.title': 'Global SeatCon 2025',
                'login.subtitle': '컨퍼런스 채팅',
                'login.username': '사용자 이름',
                'login.username.placeholder': '이름을 입력하세요',
                'login.language': '선호 언어',
                'login.chatroom': '채팅방 선택',
                'login.chatroom.loading': '로딩 중...',
                'login.accessCode': '접근 코드',
                'login.accessCode.placeholder': '비공개 채팅방 코드 입력',
                'login.button': '입장하기',
                'languages.korean': '한국어',
                'languages.english': '영어',
                'languages.japanese': '일본어',
                'languages.chinese': '중국어',
                'chat.language': '언어',
                'chat.users': '사용자 목록',
                'chat.messageInput.placeholder': '메시지를 입력하세요...',
                'connection.online': '온라인',
                'connection.offline': '오프라인',
                'connection.connecting': '연결 중...',
                'connection.syncing': '동기화 중...',
                'modal.changeLanguage.title': '언어 변경',
                'modal.changeLanguage.selectLanguage': '선호 언어 선택',
                'modal.save': '저장',
                'modal.cancel': '취소'
            },
            'en': {
                'app.title': 'Global SeatCon 2025',
                'login.subtitle': 'Conference Chat',
                'login.username': 'Username',
                'login.username.placeholder': 'Enter your name',
                'login.language': 'Preferred Language',
                'login.chatroom': 'Select Chatroom',
                'login.chatroom.loading': 'Loading...',
                'login.accessCode': 'Access Code',
                'login.accessCode.placeholder': 'Enter private chatroom code',
                'login.button': 'Enter',
                'languages.korean': 'Korean',
                'languages.english': 'English',
                'languages.japanese': 'Japanese',
                'languages.chinese': 'Chinese',
                'chat.language': 'Language',
                'chat.users': 'User List',
                'chat.messageInput.placeholder': 'Type your message...',
                'connection.online': 'Online',
                'connection.offline': 'Offline',
                'connection.connecting': 'Connecting...',
                'connection.syncing': 'Syncing...',
                'modal.changeLanguage.title': 'Change Language',
                'modal.changeLanguage.selectLanguage': 'Select Preferred Language',
                'modal.save': 'Save',
                'modal.cancel': 'Cancel'
            },
            'ja': {
                'app.title': 'Global SeatCon 2025',
                'login.subtitle': 'カンファレンスチャット',
                'login.username': 'ユーザー名',
                'login.username.placeholder': '名前を入力してください',
                'login.language': '希望言語',
                'login.chatroom': 'チャットルーム選択',
                'login.chatroom.loading': '読み込み中...',
                'login.accessCode': 'アクセスコード',
                'login.accessCode.placeholder': 'プライベートルームコードを入力',
                'login.button': '入場',
                'languages.korean': '韓国語',
                'languages.english': '英語',
                'languages.japanese': '日本語',
                'languages.chinese': '中国語',
                'chat.language': '言語',
                'chat.users': 'ユーザーリスト',
                'chat.messageInput.placeholder': 'メッセージを入力...',
                'connection.online': 'オンライン',
                'connection.offline': 'オフライン',
                'connection.connecting': '接続中...',
                'connection.syncing': '同期中...',
                'modal.changeLanguage.title': '言語変更',
                'modal.changeLanguage.selectLanguage': '希望言語を選択',
                'modal.save': '保存',
                'modal.cancel': 'キャンセル'
            },
            'zh': {
                'app.title': 'Global SeatCon 2025',
                'login.subtitle': '会议聊天',
                'login.username': '用户名',
                'login.username.placeholder': '请输入姓名',
                'login.language': '首选语言',
                'login.chatroom': '选择聊天室',
                'login.chatroom.loading': '加载中...',
                'login.accessCode': '访问代码',
                'login.accessCode.placeholder': '输入私人聊天室代码',
                'login.button': '进入',
                'languages.korean': '韩语',
                'languages.english': '英语',
                'languages.japanese': '日语',
                'languages.chinese': '中文',
                'chat.language': '语言',
                'chat.users': '用户列表',
                'chat.messageInput.placeholder': '输入消息...',
                'connection.online': '在线',
                'connection.offline': '离线',
                'connection.connecting': '连接中...',
                'connection.syncing': '同步中...',
                'modal.changeLanguage.title': '更改语言',
                'modal.changeLanguage.selectLanguage': '选择首选语言',
                'modal.save': '保存',
                'modal.cancel': '取消'
            }
        };
        
        // 언어 사전 적용
        APP.applyLanguageDictionary(language);
        
        return true;
    } catch (error) {
        console.error('언어 사전 로드 실패:', error);
        return false;
    }
};

// 언어 사전 적용
APP.applyLanguageDictionary = function(language) {
    // 해당 언어의 사전이 없으면 한국어로 대체
    const dictionary = APP.i18n.dictionary[language] || APP.i18n.dictionary['ko'];
    
    // 모든 i18n 요소에 적용
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
        const key = element.dataset.i18n;
        if (dictionary[key]) {
            element.textContent = dictionary[key];
        }
    });
    
    // placeholder 속성이 있는 요소에 적용
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        if (dictionary[key]) {
            element.placeholder = dictionary[key];
        }
    });
    
    // 상태 표시에 적용
    APP.updateConnectionStatus();
};

// 언어 모달 열기
APP.openLanguageModal = function() {
    // 현재 선택된 언어 설정
    APP.elements.modalLanguageSelect.value = APP.state.preferredLanguage;
    
    // 모달 표시
    APP.elements.languageModal.classList.remove('hidden');
};

// 언어 변경 저장
APP.saveLanguage = async function() {
    const newLanguage = APP.elements.modalLanguageSelect.value;
    
    try {
        // 로그인 상태인 경우 사용자 정보 업데이트
        if (APP.state.isLoggedIn) {
            await userService.changePreferredLanguage(newLanguage);
        }
        
        // 선호 언어 변경
        APP.state.preferredLanguage = newLanguage;
        
        // 언어 사전 로드 및 적용
        await APP.loadLanguageDictionary(newLanguage);
        
        // 언어 표시 업데이트
        APP.updateLanguageDisplay();
        
        // 현재 메시지 번역 갱신
        if (APP.state.isLoggedIn && APP.state.currentRoomId) {
            const messages = chatService.getMessages();
            const translatedMessages = await translationService.translateMessages(
                messages, 
                newLanguage
            );
            
            if (translatedMessages.length > 0) {
                APP.renderMessageList(translatedMessages);
            }
        }
        
        // 모달 닫기
        APP.closeModals();
    } catch (error) {
        console.error('언어 변경 실패:', error);
        APP.showError('언어 변경에 실패했습니다.');
    }
};

// 모달 닫기
APP.closeModals = function() {
    // 모든 모달 숨기기
    APP.elements.languageModal.classList.add('hidden');
};

// 언어 표시 업데이트
APP.updateLanguageDisplay = function() {
    const languageName = translationService.getLanguageName(APP.state.preferredLanguage);
    APP.elements.currentLanguage.textContent = languageName;
};

// 연결 상태 업데이트
APP.updateConnectionStatus = function() {
    const isOnline = offlineService.isNetworkOnline();
    const realtimeStatus = realtimeService.getConnectionStatus();
    
    // 연결 상태에 따른 클래스 및 텍스트 설정
    let statusClass = '';
    let statusText = '';
    
    if (!isOnline) {
        statusClass = 'offline';
        statusText = APP.i18n.dictionary[APP.state.preferredLanguage]['connection.offline'] || '오프라인';
    } else if (realtimeStatus === 'connecting') {
        statusClass = 'connecting';
        statusText = APP.i18n.dictionary[APP.state.preferredLanguage]['connection.connecting'] || '연결 중...';
    } else {
        statusClass = 'online';
        statusText = APP.i18n.dictionary[APP.state.preferredLanguage]['connection.online'] || '온라인';
    }
    
    // 로그인 화면 상태 표시
    APP.elements.connectionIndicator.className = statusClass;
    APP.elements.connectionText.textContent = statusText;
    
    // 채팅 화면 상태 표시
    APP.elements.chatConnectionIndicator.className = statusClass;
    APP.elements.chatConnectionText.textContent = statusText;
    
    // 동기화 상태 표시
    const offlineCount = offlineService.getOfflineMessageCount();
    if (offlineCount > 0 && isOnline) {
        APP.elements.syncStatus.classList.remove('hidden');
    } else {
        APP.elements.syncStatus.classList.add('hidden');
    }
};

// 사용자 목록 토글
APP.toggleUserList = function() {
    APP.state.isUserListVisible = !APP.state.isUserListVisible;
    
    if (APP.state.isUserListVisible) {
        APP.elements.userListPanel.classList.add('active');
    } else {
        APP.elements.userListPanel.classList.remove('active');
    }
};

// 스크롤 최하단으로 이동
APP.scrollToBottom = function() {
    APP.elements.messageContainer.scrollTop = APP.elements.messageContainer.scrollHeight;
};

// 로그인 화면 표시
APP.showLoginScreen = function() {
    APP.elements.chatContainer.classList.add('hidden');
    APP.elements.loginContainer.classList.remove('hidden');
};

// 채팅 화면 표시
APP.showChatScreen = function() {
    APP.elements.loginContainer.classList.add('hidden');
    APP.elements.chatContainer.classList.remove('hidden');
};

// 로그인 에러 표시
APP.showLoginError = function(message) {
    APP.elements.loginError.textContent = message;
    
    // 3초 후 에러 메시지 초기화
    setTimeout(() => {
        APP.elements.loginError.textContent = '';
    }, 3000);
};

// 에러 메시지 표시
APP.showError = function(message) {
    alert(message);
};

// 연결 상태 변경 처리
APP.handleConnectionChange = function(isOnline) {
    console.log(`네트워크 상태 변경: ${isOnline ? '온라인' : '오프라인'}`);
    
    // 연결 상태 업데이트
    APP.updateConnectionStatus();
};

// 페이지 로드 시 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', APP.init);
