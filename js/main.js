/**
 * 메인 JavaScript 파일
 * 애플리케이션 초기화 및 전역 이벤트 처리
 */

// 전역 객체
// logger 객체는 LoggerService에서 생성됨
let supabaseClient;
let userService;
let translationService;
let dataManager;
let chatManager;

// 컴포넌트 객체
let authComponent;
let chatComponent;
let messageComponent;
let sidebarComponent;
let settingsComponent;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('프리미엄 컨퍼런스 채팅 애플리케이션 초기화 중...');
        
        // 로딩 스피너 표시
        showLoadingSpinner();
        
        // 서비스 및 컴포넌트 초기화
        await initializeServices();
        initializeComponents();
        
        // 이벤트 리스너 설정
        setupGlobalEventListeners();
        
        // 로딩 스피너 숨기기
        hideLoadingSpinner();
        
        console.log('애플리케이션 초기화 완료');
    } catch (error) {
        console.error('애플리케이션 초기화 중 오류 발생:', error);
        
        // 오류 메시지 표시
        showErrorMessage('애플리케이션을 초기화하는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        
        // 로딩 스피너 숨기기
        hideLoadingSpinner();
    }
});

/**
 * 서비스 초기화
 */
async function initializeServices() {
    // 로거는 logger.js에서 초기화되어 있음
    logger.info('서비스 초기화 중...');
    
    // Supabase 클라이언트 초기화
    supabaseClient = new SupabaseClient(CONFIG, logger);
    await supabaseClient.init();
    
    // 사용자 서비스 초기화
    userService = new UserService(CONFIG, logger);
    await userService.init();
    
    // 번역 서비스 초기화
    translationService = new TranslationService(CONFIG, logger);
    
    // 데이터 관리자 초기화
    dataManager = new DataManager(CONFIG, logger);
    await dataManager.init();
    
    // 채팅 관리자 초기화
    chatManager = new ChatManager(supabaseClient, translationService, dataManager, userService, CONFIG, logger);
    
    // 관리자 기능 확장
    if (typeof extendChatManagerWithAdminFeatures === 'function') {
        extendChatManagerWithAdminFeatures(chatManager);
    }
    
    logger.info('서비스 초기화 완료');
}

/**
 * 컴포넌트 초기화
 */
function initializeComponents() {
    logger.info('컴포넌트 초기화 중...');
    
    // 인증 컴포넌트 초기화
    authComponent = new AuthComponent(userService, dataManager, logger);
    
    // 메시지 컴포넌트 초기화
    messageComponent = new MessageComponent(chatManager, userService, translationService, logger);
    
    // 채팅 컴포넌트 초기화
    chatComponent = new ChatComponent(chatManager, userService, translationService, logger);
    
    // 사이드바 컴포넌트 초기화
    sidebarComponent = new SidebarComponent(dataManager, userService, logger);
    
    // 설정 컴포넌트 초기화
    settingsComponent = new SettingsComponent(userService, chatManager, logger);
    
    logger.info('컴포넌트 초기화 완료');
    
    // 저장된 사용자 정보 확인
    const savedUser = userService.getSavedUserInfo();
    
    if (savedUser) {
        // 이미 로그인한 사용자가 있는 경우 채팅 인터페이스 표시
        showChatInterface();
        
        // 채팅 관리자 초기화 및 메시지 로드
        initializeChatManager();
        
        // 참가자 목록에 추가
        dataManager.addParticipant(savedUser);
        
        // 사이드바 데이터 로드
        sidebarComponent.loadData();
    } else {
        // 로그인한 사용자가 없는 경우 인증 화면 표시
        showAuthInterface();
    }
}

/**
 * 전역 이벤트 리스너 설정
 */
function setupGlobalEventListeners() {
    logger.info('전역 이벤트 리스너 설정 중...');
    
    // 로그인 성공 이벤트
    document.addEventListener('auth:login-success', async (event) => {
        logger.info('로그인 성공 이벤트 수신:', event.detail);
        
        // 채팅 인터페이스 표시
        showChatInterface();
        
        // 채팅 관리자 초기화 및 메시지 로드
        await initializeChatManager();
        
        // 사이드바 데이터 로드
        sidebarComponent.loadData();
        
        // 환영 메시지 표시
        createToast(`환영합니다, ${event.detail.userInfo.name}님!`, 'success');
    });
    
    // 설정 변경 이벤트
    document.addEventListener('settings:updated', (event) => {
        logger.info('설정 변경 이벤트 수신:', event.detail);
    });
    
    // 설정 성공 이벤트
    document.addEventListener('settings:success', (event) => {
        createToast(event.detail.message, 'success');
    });
    
    // 설정 오류 이벤트
    document.addEventListener('settings:error', (event) => {
        createToast(event.detail.message, 'error');
    });
    
    // 채팅 오류 이벤트
    document.addEventListener('chat:error', (event) => {
        createToast(event.detail.message, 'error');
    });
    
    // 채팅 정보 이벤트
    document.addEventListener('chat:info', (event) => {
        createToast(event.detail.message, 'info');
    });
    
    // 사이드바 전시업체 상세 정보 이벤트
    document.addEventListener('sidebar:exhibitor-detail', (event) => {
        logger.info('전시업체 상세 정보 이벤트 수신:', event.detail);
        
        // 구현 예정: 전시업체 상세 정보 모달 표시
        createToast(`${event.detail.exhibitor.name}의 상세 정보를 보고 있습니다.`, 'info');
    });
    
    // 사이드바 일정 상세 정보 이벤트
    document.addEventListener('sidebar:schedule-detail', (event) => {
        logger.info('일정 상세 정보 이벤트 수신:', event.detail);
        
        // 구현 예정: 일정 상세 정보 모달 표시
        createToast(`${event.detail.schedule.title}의 상세 정보를 보고 있습니다.`, 'info');
    });
    
    // 설정 버튼 클릭 이벤트
    document.getElementById('user-profile')?.addEventListener('click', () => {
        settingsComponent.openModal();
    });
    
    // 모바일 내비게이션 버튼 클릭 이벤트
    document.getElementById('mobile-chat-btn')?.addEventListener('click', () => {
        showMobileView('chat');
    });
    
    document.getElementById('mobile-info-btn')?.addEventListener('click', () => {
        showMobileView('info');
    });
    
    document.getElementById('mobile-participants-btn')?.addEventListener('click', () => {
        showMobileView('participants');
    });
    
    document.getElementById('mobile-settings-btn')?.addEventListener('click', () => {
        settingsComponent.openModal();
    });
    
    // 브라우저 언어 변경 이벤트
    window.addEventListener('languagechange', () => {
        logger.info('브라우저 언어 변경 감지');
        
        // 나중에 구현: 브라우저 언어에 따라 애플리케이션 언어 업데이트
    });
    
    // 창 크기 변경 이벤트
    window.addEventListener('resize', handleWindowResize);
    
    // 초기 창 크기 처리
    handleWindowResize();
    
    logger.info('전역 이벤트 리스너 설정 완료');
}

/**
 * 채팅 관리자 초기화 및 메시지 로드
 */
async function initializeChatManager() {
    try {
        logger.info('채팅 관리자 초기화 및 메시지 로드 중...');
        
        // 로딩 스피너 표시
        showLoadingSpinner();
        
        // 채팅 관리자 초기화 시도
        try {
            await chatManager.init();
        } catch (initError) {
            logger.warn('채팅 관리자 초기화 중 오류, 계속 진행합니다:', initError);
            // 개발 환경에서는 오류를 무시하고 계속 진행
            if (!CONFIG.DEBUG.ENABLED) {
                throw initError;
            }
        }
        
        // 메시지 로드 시도
        let messages = [];
        try {
            messages = await chatManager.loadMessages();
        } catch (loadError) {
            logger.warn('메시지 로드 중 오류, 계속 진행합니다:', loadError);
            // 개발 환경에서는 빈 배열을 사용
            if (!CONFIG.DEBUG.ENABLED) {
                throw loadError;
            }
        }
        
        // 메시지 렌더링
        if (chatComponent) {
            chatComponent.renderMessages(messages);
        }
        
        logger.info('채팅 관리자 초기화 및 메시지 로드 완료');
        
        // 개발 환경에서 Supabase 연결 문제가 있는 경우 사용자에게 알림
        if (CONFIG.DEBUG.ENABLED && messages.length === 0) {
            createToast('개발 환경에서는 Supabase 연결 오류가 있을 수 있습니다. 채팅 기능은 일부 제한될 수 있습니다.', 'warning');
        }
    } catch (error) {
        logger.error('채팅 관리자 초기화 및 메시지 로드 중 오류 발생:', error);
        
        // 오류 메시지 표시
        createToast('메시지를 불러오는데 실패했습니다. 나중에 다시 시도해주세요.', 'error');
    } finally {
        // 로딩 스피너 숨기기
        hideLoadingSpinner();
    }
}

/**
 * 인증 인터페이스 표시
 */
function showAuthInterface() {
    logger.info('인증 인터페이스 표시');
    
    // 채팅 인터페이스 숨기기
    const chatInterface = document.getElementById('chat-interface');
    if (chatInterface) {
        chatInterface.classList.add('hidden');
    }
    
    // 인증 컨테이너 표시
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.classList.remove('hidden');
    }
}

/**
 * 채팅 인터페이스 표시
 */
function showChatInterface() {
    logger.info('채팅 인터페이스 표시');
    
    // 인증 컨테이너 숨기기
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.classList.add('hidden');
    }
    
    // 채팅 인터페이스 표시
    const chatInterface = document.getElementById('chat-interface');
    if (chatInterface) {
        chatInterface.classList.remove('hidden');
    }
    
    // 현재 사용자 정보 표시
    updateUserInfo();
}

/**
 * 현재 사용자 정보 표시
 */
function updateUserInfo() {
    const currentUser = userService.getCurrentUser();
    
    if (!currentUser) return;
    
    // 사용자 이름 표시
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
    
    // 사용자 아바타 표시
    const userAvatarElement = document.querySelector('.user-avatar');
    if (userAvatarElement) {
        const initials = getInitials(currentUser.name);
        userAvatarElement.textContent = initials;
    }
    
    // 언어 선택기 업데이트
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector && currentUser.language) {
        languageSelector.value = currentUser.language;
    }
}

/**
 * 사용자 이니셜 계산
 * @param {string} name - 사용자 이름
 * @returns {string} - 이니셜
 */
function getInitials(name) {
    if (!name) return '';
    
    // 한글 이름 처리 (예: "홍길동" -> "홍")
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3]/.test(name)) {
        return name.charAt(0);
    }
    
    // 영문 이름 처리 (예: "John Doe" -> "JD")
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * 모바일 뷰 표시
 * @param {string} view - 표시할 뷰 (chat, info, participants)
 */
function showMobileView(view) {
    // 모바일 내비게이션 버튼 활성화 상태 업데이트
    document.querySelectorAll('#mobile-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`mobile-${view}-btn`)?.classList.add('active');
    
    // 뷰에 따라 컨텐츠 영역 업데이트
    switch (view) {
        case 'chat':
            // 채팅 영역 표시, 사이드바 숨기기
            sidebarComponent.hide();
            break;
            
        case 'info':
            // 정보 패널 표시
            sidebarComponent.show('info');
            break;
            
        case 'participants':
            // 참가자 패널 표시
            sidebarComponent.show('participants');
            break;
    }
}

/**
 * 창 크기 변경 처리
 */
function handleWindowResize() {
    const width = window.innerWidth;
    
    // 데스크톱 화면인 경우 (1024px 이상)
    if (width >= 1024) {
        // 모든 패널 표시
        document.getElementById('info-panel')?.classList.remove('hidden');
        document.getElementById('chat-area')?.classList.remove('hidden');
        document.getElementById('participants-panel')?.classList.remove('hidden');
    } else {
        // 모바일/태블릿 화면인 경우, 채팅 영역만 표시
        showMobileView('chat');
    }
    
    // 메시지 컨테이너가 있는 경우 스크롤을 맨 아래로
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

/**
 * 토스트 메시지 생성
 * @param {string} message - 메시지 내용
 * @param {string} type - 메시지 유형 (info, success, error, warning)
 * @param {number} duration - 표시 시간 (ms)
 */
function createToast(message, type = 'info', duration = CONFIG?.UI?.TOAST?.DURATION || 3000) {
    // 토스트 컨테이너 요소 가져오기
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // 토스트를 컨테이너에 추가
    container.appendChild(toast);
    
    // 토스트가 자동으로 사라지도록 설정
    setTimeout(() => {
        // 페이드아웃 효과 추가
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // 애니메이션 완료 후 요소 제거
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * 오류 메시지 표시
 * @param {string} message - 오류 메시지
 */
function showErrorMessage(message) {
    createToast(message, 'error');
}

/**
 * 로딩 스피너 표시
 */
function showLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.remove('hidden');
    }
}

/**
 * 로딩 스피너 숨기기
 */
function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.add('hidden');
    }
}

/**
 * 로그아웃 처리
 */
function logout() {
    try {
        logger.info('로그아웃 중...');
        
        // 사용자 로그아웃
        userService.logout();
        
        // Supabase 구독 해제
        supabaseClient.unsubscribeAll();
        
        // 인증 화면 표시
        showAuthInterface();
        
        // 메시지 목록 초기화
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="system-message">채팅을 시작합니다</div>';
        }
        
        logger.info('로그아웃 완료');
    } catch (error) {
        logger.error('로그아웃 중 오류 발생:', error);
        showErrorMessage('로그아웃 중 오류가 발생했습니다.');
    }
}
