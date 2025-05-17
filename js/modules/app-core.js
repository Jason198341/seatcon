/**
 * app-core.js
 * Global SeatCon 2025 Conference Chat
 * 앱의 핵심 설정 및 초기화 로직
 */

// APP 객체 안전하게 초기화 (window.APP이 없는 경우에만 생성)
window.APP = window.APP || {
    state: {
        initialized: false,
        isLoggedIn: false,
        currentUser: null,
        currentRoomId: null,
        currentRoom: null,
        preferredLanguage: 'en',
        isUserListVisible: false,
        activityInterval: null,
        servicesReady: false,
        isInitializing: false,
        userListUpdateInterval: null
    },
    elements: {},
    messages: {
        lastMessageTime: null,
        pendingScrollToBottom: false
    },
    performance: {
        userListUpdateInterval: 30000,
        activityUpdateInterval: 60000,
        messageRenderBatchSize: 10,
        renderTimer: null,
        userListUpdateTimer: null
    }
};

// 지역 변수로 APP 객체 참조
const APP = window.APP;

// 앱 코어 모듈
APP.core = (() => {
    // timeFormat 초기화
    if (!APP.messages.timeFormat) {
        try {
            APP.messages.timeFormat = new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('DateTimeFormat 초기화 실패:', error);
            // 폴백 함수 제공
            APP.messages.timeFormat = {
                format: function(date) {
                    return date.toLocaleTimeString ? 
                        date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 
                        date.toString();
                }
            };
        }
    }
    
    // 서비스 초기화 확인 함수
    const checkServicesReady = async function(maxAttempts = 10, delay = 200) {
        console.log('서비스 준비 상태 확인 중...');
        
        // 서비스 초기화 확인
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (typeof window.dbService !== 'undefined' &&
                typeof window.realtimeService !== 'undefined' &&
                typeof window.translationService !== 'undefined' &&
                typeof window.userService !== 'undefined' &&
                typeof window.chatService !== 'undefined' &&
                typeof window.offlineService !== 'undefined') {
                    
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
        try {
            // 컨테이너
            APP.elements.loginContainer = document.getElementById('login-container');
            APP.elements.chatContainer = document.getElementById('chat-container');
            
            // 로딩 오버레이 생성 및 추가
            if (!APP.elements.loadingOverlay) {
                APP.elements.loadingOverlay = document.createElement('div');
                APP.elements.loadingOverlay.className = 'loading-overlay hidden';
                APP.elements.loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
                document.body.appendChild(APP.elements.loadingOverlay);
            }
            
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
            
            console.log('DOM 요소 참조 설정 완료');
        } catch (error) {
            console.error('DOM 요소 참조 설정 중 오류:', error);
        }
    };
    
    // 이벤트 리스너 등록 (각 모듈의 함수를 사용)
    const setupEventListeners = function() {
        try {
            // 각 모듈이 초기화되었는지 확인하면서 이벤트 리스너 등록
            // 로그인 이벤트
            if (APP.elements.loginButton && APP.users && typeof APP.users.handleLogin === 'function') {
                APP.elements.loginButton.addEventListener('click', APP.users.handleLogin);
            }
            
            if (APP.elements.usernameInput && APP.users && typeof APP.users.handleLogin === 'function') {
                APP.elements.usernameInput.addEventListener('keypress', e => {
                    if (e.key === 'Enter') APP.users.handleLogin();
                });
            }
            
            // 채팅방 선택 변경 시 비공개 채팅방 코드 필드 토글
            if (APP.elements.roomSelect && APP.rooms && typeof APP.rooms.handleRoomSelectChange === 'function') {
                APP.elements.roomSelect.addEventListener('change', APP.rooms.handleRoomSelectChange);
            }
            
            // 메시지 전송 이벤트
            if (APP.elements.sendButton && APP.chat && typeof APP.chat.sendMessage === 'function') {
                APP.elements.sendButton.addEventListener('click', APP.chat.sendMessage);
            }
            
            if (APP.elements.messageInput && APP.chat && typeof APP.chat.sendMessage === 'function') {
                APP.elements.messageInput.addEventListener('keypress', e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        APP.chat.sendMessage();
                    }
                });
                
                // 입력 필드 자동 리사이즈
                if (APP.ui && typeof APP.ui.autoResizeMessageInput === 'function') {
                    APP.elements.messageInput.addEventListener('input', APP.ui.autoResizeMessageInput);
                }
            }
            
            // 사용자 목록 토글
            if (APP.elements.userListToggle && APP.ui && typeof APP.ui.toggleUserList === 'function') {
                APP.elements.userListToggle.addEventListener('click', APP.ui.toggleUserList);
            }
            
            // 채팅방 나가기
            if (APP.elements.exitChat && APP.users && typeof APP.users.handleLogout === 'function') {
                APP.elements.exitChat.addEventListener('click', APP.users.handleLogout);
            }
            
            // 언어 변경
            if (APP.elements.changeLanguage && APP.i18n && typeof APP.i18n.openLanguageModal === 'function') {
                APP.elements.changeLanguage.addEventListener('click', APP.i18n.openLanguageModal);
            }
            
            if (APP.elements.languageSave && APP.i18n && typeof APP.i18n.saveLanguage === 'function') {
                APP.elements.languageSave.addEventListener('click', APP.i18n.saveLanguage);
            }
            
            // 모달 닫기
            if (APP.elements.closeModalButtons && APP.ui && typeof APP.ui.closeModals === 'function') {
                APP.elements.closeModalButtons.forEach(button => {
                    button.addEventListener('click', APP.ui.closeModals);
                });
            }
            
            // 메시지 영역 스크롤 이벤트 (더 오래된 메시지 로드용)
            if (APP.elements.messageContainer && APP.chat && typeof APP.chat.handleMessageScroll === 'function') {
                APP.elements.messageContainer.addEventListener('scroll', APP.chat.handleMessageScroll);
            }
            
            // 서비스가 준비되었을 때만 연결 상태 변경 이벤트 등록
            if (APP.state.servicesReady && typeof window.offlineService !== 'undefined' && 
                APP.chat && typeof APP.chat.handleConnectionChange === 'function') {
                window.offlineService.onConnectionChange(APP.chat.handleConnectionChange);
            }
            
            // 서비스가 준비되었을 때만 메시지 수신 이벤트 등록
            if (APP.state.servicesReady && typeof window.chatService !== 'undefined' && 
                APP.chat && typeof APP.chat.handleMessageEvent === 'function') {
                window.chatService.onMessage(APP.chat.handleMessageEvent);
            }
            
            // 창 종료 시 로그아웃
            if (APP.users && typeof APP.users.handleBeforeUnload === 'function') {
                window.addEventListener('beforeunload', APP.users.handleBeforeUnload);
            }
            
            // 창 크기 변경 시 스크롤 맨 아래로 이동
            if (APP.ui && typeof APP.ui.handleWindowResize === 'function') {
                window.addEventListener('resize', APP.ui.handleWindowResize);
            }
            
            console.log('이벤트 리스너 등록 완료');
        } catch (error) {
            console.error('이벤트 리스너 등록 중 오류:', error);
        }
    };
    
    // 로딩 표시 함수
    const showLoading = function(show) {
        if (!APP.elements.loadingOverlay) return;
        
        if (show) {
            APP.elements.loadingOverlay.classList.remove('hidden');
        } else {
            APP.elements.loadingOverlay.classList.add('hidden');
        }
    };
    
    // 오류 표시 함수
    const showError = function(message) {
        alert(message);
    };
    
    // 애플리케이션 초기화
    const init = async function() {
        if (APP.state.initialized || APP.state.isInitializing) {
            console.log('앱이 이미 초기화되었거나 초기화 중입니다.');
            return;
        }
        
        APP.state.isInitializing = true;
        
        try {
            console.log('애플리케이션 초기화 시작...');
            
            // DOM 요소 참조 설정
            setupDOMReferences();
            
            // 로딩 표시
            showLoading(true);
            
            // 서비스 준비 확인
            await checkServicesReady();
            
            // 언어 목록 설정 (CONFIG가 정의된 경우에만)
            if (APP.state.servicesReady && typeof window.CONFIG !== 'undefined' && 
                window.CONFIG && window.CONFIG.SUPPORTED_LANGUAGES && APP.i18n) {
                APP.i18n.supportedLanguages = window.CONFIG.SUPPORTED_LANGUAGES;
            }
            
            // 저장된 언어 설정 불러오기
            APP.state.preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
            
            // 언어 셀렉트 업데이트
            if (APP.elements.languageSelect) {
                APP.elements.languageSelect.value = APP.state.preferredLanguage;
            }
            
            // 언어 사전 로드 (먼저 로드하여 updateConnectionStatus에서 사용 가능하도록)
            if (APP.i18n && typeof APP.i18n.loadLanguageDictionary === 'function') {
                await APP.i18n.loadLanguageDictionary(APP.state.preferredLanguage);
            }
            
            // 이벤트 리스너 등록
            setupEventListeners();
            
            // 서비스가 준비되었을 때만 연결 상태 표시
            if (APP.state.servicesReady && APP.chat && typeof APP.chat.updateConnectionStatus === 'function') {
                APP.chat.updateConnectionStatus();
            } else {
                // 서비스가 준비되지 않았을 때는 기본 상태 표시
                if (APP.elements.connectionIndicator) {
                    APP.elements.connectionIndicator.className = 'online';
                }
                if (APP.elements.connectionText && APP.i18n && typeof APP.i18n.translate === 'function') {
                    APP.elements.connectionText.textContent = APP.i18n.translate('connection.online');
                } else if (APP.elements.connectionText) {
                    APP.elements.connectionText.textContent = 'Online';
                }
                
                if (APP.elements.chatConnectionIndicator) {
                    APP.elements.chatConnectionIndicator.className = 'online';
                }
                if (APP.elements.chatConnectionText && APP.i18n && typeof APP.i18n.translate === 'function') {
                    APP.elements.chatConnectionText.textContent = APP.i18n.translate('connection.online');
                } else if (APP.elements.chatConnectionText) {
                    APP.elements.chatConnectionText.textContent = 'Online';
                }
            }
            
            // 사용자 정보 로드 및 화면 설정을 비동기로 처리
            setTimeout(async () => {
                try {
                    // 서비스가 준비되었고 userService가 정의된 경우에만 처리
                    if (APP.state.servicesReady && 
                        typeof window.userService !== 'undefined' && 
                        typeof window.userService.initializeUser === 'function') {
                        
                        const savedUser = await window.userService.initializeUser();
                        
                        if (savedUser) {
                            APP.state.currentUser = savedUser;
                            APP.state.preferredLanguage = savedUser.preferred_language;
                            APP.state.isLoggedIn = true;
                            
                            // 로그인 상태에 따라 화면 전환
                            if (APP.rooms && typeof APP.rooms.enterChat === 'function') {
                                await APP.rooms.enterChat(APP.state.currentUser.room_id);
                            }
                        } else {
                            // 저장된 사용자 정보가 없는 경우 로그인 화면 표시
                            if (APP.ui && typeof APP.ui.showLoginScreen === 'function') {
                                APP.ui.showLoginScreen();
                            } else {
                                // APP.ui가 없는 경우 직접 처리
                                if (APP.elements.chatContainer) {
                                    APP.elements.chatContainer.classList.add('hidden');
                                }
                                if (APP.elements.loginContainer) {
                                    APP.elements.loginContainer.classList.remove('hidden');
                                }
                            }
                        }
                    } else {
                        // 서비스가 준비되지 않은 경우 로그인 화면 표시
                        if (APP.ui && typeof APP.ui.showLoginScreen === 'function') {
                            APP.ui.showLoginScreen();
                        } else {
                            // APP.ui가 없는 경우 직접 처리
                            if (APP.elements.chatContainer) {
                                APP.elements.chatContainer.classList.add('hidden');
                            }
                            if (APP.elements.loginContainer) {
                                APP.elements.loginContainer.classList.remove('hidden');
                            }
                        }
                    }
                } catch (error) {
                    console.error('사용자 정보 로드 실패:', error);
                    // 오류 발생 시 로그인 화면 표시
                    if (APP.ui && typeof APP.ui.showLoginScreen === 'function') {
                        APP.ui.showLoginScreen();
                    } else {
                        // APP.ui가 없는 경우 직접 처리
                        if (APP.elements.chatContainer) {
                            APP.elements.chatContainer.classList.add('hidden');
                        }
                        if (APP.elements.loginContainer) {
                            APP.elements.loginContainer.classList.remove('hidden');
                        }
                    }
                } finally {
                    // 로딩 종료
                    showLoading(false);
                }
            }, 100);
            
            // 채팅방 목록 로드 (백그라운드에서 처리)
            if (APP.rooms && typeof APP.rooms.loadChatRooms === 'function') {
                APP.rooms.loadChatRooms().catch(error => {
                    console.error('채팅방 목록 로드 실패:', error);
                });
            }
            
            APP.state.initialized = true;
            console.log('애플리케이션 초기화 완료');
        } catch (error) {
            console.error('애플리케이션 초기화 실패:', error);
            
            // 오류 메시지 표시
            let errorMessage = '애플리케이션 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.';
            
            if (APP.i18n && typeof APP.i18n.translate === 'function') {
                const translatedError = APP.i18n.translate('error.initFailed');
                if (translatedError) {
                    errorMessage = translatedError;
                }
            }
            
            showError(errorMessage);
            
            // 로딩 종료
            showLoading(false);
        } finally {
            APP.state.isInitializing = false;
        }
    };
    
    // 공개 API
    return {
        init,
        checkServicesReady,
        setupDOMReferences,
        setupEventListeners,
        showLoading,
        showError
    };
})();
