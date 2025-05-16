/**
 * app-core.js
 * Global SeatCon 2025 Conference Chat
 * 앱의 핵심 설정 및 초기화 로직
 */

// 전역 APP 객체 정의
const APP = window.APP || {};

// 앱 코어 모듈
APP.core = (() => {
    // 앱 상태
    APP.state = {
        initialized: false,
        isLoggedIn: false,
        currentUser: null,
        currentRoomId: null,
        currentRoom: null,
        preferredLanguage: 'en',
        isUserListVisible: false,
        activityInterval: null,
        servicesReady: false,
        isInitializing: false, // 초기화 진행 중 상태
        userListUpdateInterval: null // 사용자 목록 업데이트 타이머
    };
    
    // DOM 요소 참조
    APP.elements = {};
    
    // 메시지 렌더링 설정
    APP.messages = {
        lastMessageTime: null,
        timeFormat: new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }),
        pendingScrollToBottom: false
    };
    
    // 성능 최적화 설정
    APP.performance = {
        userListUpdateInterval: 30000, // 사용자 목록 업데이트 간격 (30초)
        activityUpdateInterval: 60000, // 활동 시간 업데이트 간격 (60초)
        messageRenderBatchSize: 10, // 한 번에 렌더링할 메시지 수
        renderTimer: null, // 렌더링 타이머
        userListUpdateTimer: null // 사용자 목록 업데이트 타이머
    };
    
    // 서비스 초기화 확인 함수
    const checkServicesReady = async function(maxAttempts = 10, delay = 200) {
        console.log('서비스 준비 상태 확인 중...');
        
        // 서비스 초기화 확인
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (typeof dbService !== 'undefined' &&
                typeof realtimeService !== 'undefined' &&
                typeof translationService !== 'undefined' &&
                typeof userService !== 'undefined' &&
                typeof chatService !== 'undefined' &&
                typeof offlineService !== 'undefined') {
                    
                console.log('모든 서비스가 준비되었습니다.');
                APP.state.servicesReady = true;
                return true;
            }
            
            // 지정된 시간만큼 대기
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.error('서비스 준비 시간 초과');
        return false;
    };
    
    // DOM 요소 참조 설정
    const setupDOMReferences = function() {
        // 컨테이너
        APP.elements.loginContainer = document.getElementById('login-container');
        APP.elements.chatContainer = document.getElementById('chat-container');
        
        // 로딩 오버레이 생성 및 추가
        APP.elements.loadingOverlay = document.createElement('div');
        APP.elements.loadingOverlay.className = 'loading-overlay hidden';
        APP.elements.loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(APP.elements.loadingOverlay);
        
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
    
    // 이벤트 리스너 등록 (각 모듈의 함수를 사용)
    const setupEventListeners = function() {
        // 로그인 이벤트
        if (APP.elements.loginButton) {
            APP.elements.loginButton.addEventListener('click', APP.users.handleLogin);
        }
        
        if (APP.elements.usernameInput) {
            APP.elements.usernameInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') APP.users.handleLogin();
            });
        }
        
        // 채팅방 선택 변경 시 비공개 채팅방 코드 필드 토글
        if (APP.elements.roomSelect) {
            APP.elements.roomSelect.addEventListener('change', APP.rooms.handleRoomSelectChange);
        }
        
        // 메시지 전송 이벤트
        if (APP.elements.sendButton) {
            APP.elements.sendButton.addEventListener('click', APP.chat.sendMessage);
        }
        
        if (APP.elements.messageInput) {
            APP.elements.messageInput.addEventListener('keypress', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    APP.chat.sendMessage();
                }
            });
            
            // 입력 필드 자동 리사이즈
            APP.elements.messageInput.addEventListener('input', APP.ui.autoResizeMessageInput);
        }
        
        // 사용자 목록 토글
        if (APP.elements.userListToggle) {
            APP.elements.userListToggle.addEventListener('click', APP.ui.toggleUserList);
        }
        
        // 채팅방 나가기
        if (APP.elements.exitChat) {
            APP.elements.exitChat.addEventListener('click', APP.users.handleLogout);
        }
        
        // 언어 변경
        if (APP.elements.changeLanguage) {
            APP.elements.changeLanguage.addEventListener('click', APP.i18n.openLanguageModal);
        }
        
        if (APP.elements.languageSave) {
            APP.elements.languageSave.addEventListener('click', APP.i18n.saveLanguage);
        }
        
        // 모달 닫기
        if (APP.elements.closeModalButtons) {
            APP.elements.closeModalButtons.forEach(button => {
                button.addEventListener('click', APP.ui.closeModals);
            });
        }
        
        // 메시지 영역 스크롤 이벤트 (더 오래된 메시지 로드용)
        if (APP.elements.messageContainer) {
            APP.elements.messageContainer.addEventListener('scroll', APP.chat.handleMessageScroll);
        }
        
        // 서비스가 준비되었을 때만 연결 상태 변경 이벤트 등록
        if (APP.state.servicesReady && typeof offlineService !== 'undefined') {
            offlineService.onConnectionChange(APP.chat.handleConnectionChange);
        }
        
        // 서비스가 준비되었을 때만 메시지 수신 이벤트 등록
        if (APP.state.servicesReady && typeof chatService !== 'undefined') {
            chatService.onMessage(APP.chat.handleMessageEvent);
        }
        
        // 창 종료 시 로그아웃
        window.addEventListener('beforeunload', APP.users.handleBeforeUnload);
        
        // 창 크기 변경 시 스크롤 맨 아래로 이동
        window.addEventListener('resize', APP.ui.handleWindowResize);
    };
    
    // 애플리케이션 초기화
    const init = async function() {
        if (APP.state.initialized || APP.state.isInitializing) return;
        
        APP.state.isInitializing = true;
        
        try {
            console.log('애플리케이션 초기화 시작...');
            
            // DOM 요소 참조 설정
            setupDOMReferences();
            
            // 로딩 표시
            APP.ui.showLoading(true);
            
            // 서비스 준비 확인
            await checkServicesReady();
            
            // 언어 목록 설정
            if (APP.state.servicesReady && CONFIG.SUPPORTED_LANGUAGES) {
                APP.i18n.supportedLanguages = CONFIG.SUPPORTED_LANGUAGES;
            }
            
            // 저장된 언어 설정 불러오기
            APP.state.preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
            
            // 언어 셀렉트 업데이트
            if (APP.elements.languageSelect) {
                APP.elements.languageSelect.value = APP.state.preferredLanguage;
            }
            
            // 언어 사전 로드 (먼저 로드하여 updateConnectionStatus에서 사용 가능하도록)
            await APP.i18n.loadLanguageDictionary(APP.state.preferredLanguage);
            
            // 이벤트 리스너 등록
            setupEventListeners();
            
            // 서비스가 준비되었을 때만 연결 상태 표시
            if (APP.state.servicesReady) {
                APP.chat.updateConnectionStatus();
            } else {
                // 서비스가 준비되지 않았을 때는 기본 상태 표시
                if (APP.elements.connectionIndicator) APP.elements.connectionIndicator.className = 'online';
                if (APP.elements.connectionText) APP.elements.connectionText.textContent = APP.i18n.translate('connection.online');
                if (APP.elements.chatConnectionIndicator) APP.elements.chatConnectionIndicator.className = 'online';
                if (APP.elements.chatConnectionText) APP.elements.chatConnectionText.textContent = APP.i18n.translate('connection.online');
            }
            
            // 저장된 사용자 정보 로드 (비동기로 처리)
            setTimeout(async () => {
                try {
                    if (APP.state.servicesReady) {
                        const savedUser = await userService.initializeUser();
                        if (savedUser) {
                            APP.state.currentUser = savedUser;
                            APP.state.preferredLanguage = savedUser.preferred_language;
                            APP.state.isLoggedIn = true;
                            
                            // 로그인 상태에 따라 화면 전환
                            await APP.rooms.enterChat(APP.state.currentUser.room_id);
                        } else {
                            // 저장된 사용자 정보가 없는 경우 로그인 화면 표시
                            APP.ui.showLoginScreen();
                        }
                    } else {
                        // 서비스가 준비되지 않은 경우 로그인 화면 표시
                        APP.ui.showLoginScreen();
                    }
                } catch (error) {
                    console.error('사용자 정보 로드 실패:', error);
                    APP.ui.showLoginScreen();
                } finally {
                    // 로딩 종료
                    APP.ui.showLoading(false);
                }
            }, 100);
            
            // 채팅방 목록 로드 (백그라운드에서 처리)
            APP.rooms.loadChatRooms();
            
            APP.state.initialized = true;
            console.log('애플리케이션 초기화 완료');
        } catch (error) {
            console.error('애플리케이션 초기화 실패:', error);
            APP.ui.showError(APP.i18n.translate('error.initFailed') || '애플리케이션 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
            APP.ui.showLoading(false);
        } finally {
            APP.state.isInitializing = false;
        }
    };
    
    // 공개 API
    return {
        init,
        checkServicesReady,
        setupDOMReferences,
        setupEventListeners
    };
})();

// 글로벌 객체로 노출
window.APP = APP;
