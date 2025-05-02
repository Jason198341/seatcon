/**
 * 컨퍼런스 채팅 애플리케이션 메인 스크립트
 * 
 * 모든 UI 컴포넌트와 비즈니스 로직을 관리합니다.
 */
document.addEventListener('DOMContentLoaded', function() {
    // 상수 정의
    const SCREENS = {
        ROLE: 'role-screen',
        PROFILE: 'profile-screen',
        CHAT: 'chat-screen'
    };
    
    // DOM 요소 참조
    const elements = {
        screens: {
            role: document.getElementById(SCREENS.ROLE),
            profile: document.getElementById(SCREENS.PROFILE),
            chat: document.getElementById(SCREENS.CHAT)
        },
        roleSelection: {
            participant: document.getElementById('participant-role'),
            moderator: document.getElementById('moderator-role')
        },
        moderatorPassword: {
            container: document.getElementById('moderator-password'),
            inputs: document.querySelectorAll('.password-digit'),
            errorMessage: document.getElementById('password-error-message'),
            confirmButton: document.getElementById('confirm-password'),
            closeButton: document.getElementById('close-password')
        },
        profile: {
            form: document.getElementById('profile-form'),
            name: document.getElementById('user-name'),
            email: document.getElementById('user-email'),
            language: document.getElementById('preferred-language'),
            roleBadge: document.getElementById('profile-role-badge')
        },
        chat: {
            messageContainer: document.getElementById('message-container'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            settingsButton: document.getElementById('settings-button'),
            settingsPanel: document.getElementById('settings-panel'),
            closeSettings: document.getElementById('close-settings'),
            settingsLanguage: document.getElementById('settings-language'),
            themeSwitch: document.getElementById('theme-switch'),
            moderatorTools: document.getElementById('moderator-tools'),
            announcementButton: document.getElementById('announcement-button'),
            kickUserButton: document.getElementById('kick-user-button'),
            logoutButton: document.getElementById('logout-button'),
            roleBadge: document.getElementById('chat-role-badge')
        },
        kickPanel: {
            panel: document.getElementById('kick-panel'),
            closeButton: document.getElementById('close-kick'),
            userList: document.getElementById('user-list')
        },
        announcementPanel: {
            panel: document.getElementById('announcement-panel'),
            closeButton: document.getElementById('close-announcement'),
            text: document.getElementById('announcement-text'),
            sendButton: document.getElementById('send-announcement')
        },
        loadingOverlay: document.getElementById('loading-overlay'),
        notificationToast: {
            container: document.getElementById('notification-toast'),
            message: document.querySelector('.toast-message'),
            icon: document.querySelector('.toast-icon')
        }
    };
    
    // 상태 관리
    let state = {
        isDarkTheme: false,
        onlineUsers: [],
        messageQueue: [],
        apiStatus: {
            supabase: false,
            translation: false
        }
    };
    
    /**
     * 애플리케이션 초기화
     */
    function init() {
        console.log('애플리케이션 초기화 시작...');
        
        // API 상태 테스트
        testAPIs().then(status => {
            state.apiStatus = status;
            
            if (!status.supabase && !status.translation) {
                showDebugPanel('Supabase 데이터베이스와 번역 API 모두 작동하지 않습니다. 네트워크 연결을 확인하세요.');
            } else if (!status.supabase) {
                showDebugPanel('Supabase 데이터베이스 연결에 문제가 있습니다. 채팅 기능이 제한됩니다.');
            } else if (!status.translation) {
                showDebugPanel('번역 API 연결에 문제가 있습니다. 번역 기능이 제한됩니다.');
            } else {
                console.log('모든 API가 정상적으로 작동합니다.');
                // 디버그 콘솔에도 상태 표시
                console.log('API 상태:', status);
            }
        });
        
        // 테마 설정
        initTheme();
        
        // 이벤트 리스너 등록
        registerEventListeners();
        
        // 이전 로그인 확인
        checkPreviousLogin();
        
        console.log('애플리케이션 초기화 완료');
    }
    
    /**
     * API 상태 테스트
     */
    async function testAPIs() {
        console.log('API 테스트 시작...');
        showLoading();
        
        try {
            // Supabase 테스트
            const supabaseOk = await databaseService.testConnection();
            console.log('Supabase 테스트 결과:', supabaseOk ? '성공' : '실패');
            
            // 번역 API 테스트
            const translationOk = await translationService.testTranslation();
            console.log('번역 API 테스트 결과:', translationOk ? '성공' : '실패');
            
            hideLoading();
            return {
                supabase: supabaseOk,
                translation: translationOk
            };
        } catch (error) {
            console.error('API 테스트 중 오류 발생:', error);
            hideLoading();
            return {
                supabase: false,
                translation: false
            };
        }
    }
    
    /**
     * 디버그 패널 표시
     */
    function showDebugPanel(message) {
        // 디버그 패널 생성
        const debugPanel = document.createElement('div');
        debugPanel.className = 'debug-panel';
        debugPanel.innerHTML = `
            <div class="debug-header">
                <h3>API 연결 오류</h3>
                <button class="icon-button" id="close-debug">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="debug-content">
                <p>${message}</p>
                <div class="debug-status">
                    <p>Supabase 상태: <span class="${state.apiStatus.supabase ? 'status-ok' : 'status-error'}">${state.apiStatus.supabase ? '정상' : '오류'}</span></p>
                    <p>번역 API 상태: <span class="${state.apiStatus.translation ? 'status-ok' : 'status-error'}">${state.apiStatus.translation ? '정상' : '오류'}</span></p>
                </div>
                <button class="button primary-button" id="retry-connection">재연결 시도</button>
            </div>
        `;
        
        // 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .debug-panel {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 400px;
                background-color: var(--background);
                border-radius: 8px;
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                overflow: hidden;
            }
            
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background-color: var(--primary-color);
                color: white;
            }
            
            .debug-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .debug-content {
                padding: 16px;
            }
            
            .debug-status {
                margin: 12px 0;
                padding: 8px;
                background-color: var(--message-bg);
                border-radius: 4px;
            }
            
            .status-ok {
                color: var(--success-color);
                font-weight: bold;
            }
            
            .status-error {
                color: var(--error-color);
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(debugPanel);
        
        // 이벤트 리스너 추가
        document.getElementById('close-debug').addEventListener('click', () => {
            document.body.removeChild(debugPanel);
        });
        
        document.getElementById('retry-connection').addEventListener('click', async () => {
            document.body.removeChild(debugPanel);
            const newStatus = await testAPIs();
            state.apiStatus = newStatus;
            
            if (!newStatus.supabase && !newStatus.translation) {
                showDebugPanel('Supabase 데이터베이스와 번역 API 모두 작동하지 않습니다. 네트워크 연결을 확인하세요.');
            } else if (!newStatus.supabase) {
                showDebugPanel('Supabase 데이터베이스 연결에 문제가 있습니다. 채팅 기능이 제한됩니다.');
            } else if (!newStatus.translation) {
                showDebugPanel('번역 API 연결에 문제가 있습니다. 번역 기능이 제한됩니다.');
            } else {
                showNotification('모든 API가 정상적으로 연결되었습니다.', 'success');
            }
        });
    }
    
    /**
     * 테마 초기화
     */
    function initTheme() {
        // 기기 색상 테마 확인
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            state.isDarkTheme = true;
        }
        
        // 저장된 테마 설정 확인
        const savedTheme = localStorage.getItem('chatTheme');
        if (savedTheme) {
            state.isDarkTheme = savedTheme === 'dark';
        }
        
        // 테마 적용
        applyTheme();
        
        // 테마 토글 스위치 상태 설정
        if (elements.chat.themeSwitch) {
            elements.chat.themeSwitch.checked = state.isDarkTheme;
        }
    }
    
    /**
     * 테마 적용
     */
    function applyTheme() {
        if (state.isDarkTheme) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    /**
     * 이벤트 리스너 등록
     */
    function registerEventListeners() {
        // 역할 선택
        if (elements.roleSelection.participant && elements.roleSelection.moderator) {
            elements.roleSelection.participant.addEventListener('click', () => selectRole('participant'));
            elements.roleSelection.moderator.addEventListener('click', () => selectRole('moderator'));
        }
        
        // 진행자 비밀번호
        if (elements.moderatorPassword.inputs.length) {
            elements.moderatorPassword.inputs.forEach(input => {
                input.addEventListener('input', handlePasswordInput);
                input.addEventListener('keydown', handlePasswordKeydown);
            });
            elements.moderatorPassword.confirmButton.addEventListener('click', verifyModeratorPassword);
            elements.moderatorPassword.closeButton.addEventListener('click', hideModeratorPassword);
        }
        
        // 프로필 폼
        if (elements.profile.form) {
            elements.profile.form.addEventListener('submit', handleProfileSubmit);
        }
        
        // 채팅 기능
        if (elements.chat.messageInput && elements.chat.sendButton) {
            elements.chat.messageInput.addEventListener('input', adjustInputHeight);
            elements.chat.messageInput.addEventListener('keydown', handleMessageKeydown);
            elements.chat.sendButton.addEventListener('click', sendMessage);
        }
        
        // 설정 패널
        if (elements.chat.settingsButton && elements.chat.closeSettings) {
            elements.chat.settingsButton.addEventListener('click', showSettingsPanel);
            elements.chat.closeSettings.addEventListener('click', hideSettingsPanel);
            
            if (elements.chat.settingsLanguage) {
                elements.chat.settingsLanguage.addEventListener('change', changeLanguage);
            }
            
            if (elements.chat.themeSwitch) {
                elements.chat.themeSwitch.addEventListener('change', toggleTheme);
            }
            
            if (elements.chat.logoutButton) {
                elements.chat.logoutButton.addEventListener('click', logout);
            }
        }
        
        // 진행자 도구
        if (elements.chat.announcementButton && elements.chat.kickUserButton) {
            elements.chat.announcementButton.addEventListener('click', showAnnouncementPanel);
            elements.chat.kickUserButton.addEventListener('click', showKickPanel);
        }
        
        // 강퇴 패널
        if (elements.kickPanel.closeButton) {
            elements.kickPanel.closeButton.addEventListener('click', hideKickPanel);
        }
        
        // 공지사항 패널
        if (elements.announcementPanel.closeButton && elements.announcementPanel.sendButton) {
            elements.announcementPanel.closeButton.addEventListener('click', hideAnnouncementPanel);
            elements.announcementPanel.sendButton.addEventListener('click', sendAnnouncement);
        }
    }
    
    /**
     * 이전 로그인 확인
     */
    function checkPreviousLogin() {
        const userInfo = databaseService.getSavedUserInfo();
        
        if (userInfo) {
            // 사용자 정보가 있으면 채팅 화면으로 이동
            authService.setRole(userInfo.isModerator ? 'moderator' : 'participant');
            initChatScreen().then(() => {
                showScreen(SCREENS.CHAT);
            }).catch(error => {
                console.error('채팅 화면 초기화 실패:', error);
                // 오류 발생 시 로그아웃 후 역할 선택 화면으로 이동
                authService.logout();
                showScreen(SCREENS.ROLE);
                showNotification('세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
            });
        } else {
            // 사용자 정보가 없으면 역할 선택 화면 표시
            showScreen(SCREENS.ROLE);
        }
    }
    
    /**
     * 역할 선택 처리
     */
    function selectRole(role) {
        // 선택된 역할 시각적 표시
        elements.roleSelection.participant.classList.toggle('selected', role === 'participant');
        elements.roleSelection.moderator.classList.toggle('selected', role === 'moderator');
        
        // 진행자 선택 시 비밀번호 입력 표시
        if (role === 'moderator') {
            showModeratorPassword();
        } else {
            // 참가자 선택 시 바로 역할 설정
            authService.setRole('participant');
            navigateToProfileScreen('participant');
        }
    }
    
    /**
     * 진행자 비밀번호 입력창 표시
     */
    function showModeratorPassword() {
        elements.moderatorPassword.container.classList.remove('hidden');
        elements.moderatorPassword.errorMessage.style.display = 'none';
        elements.moderatorPassword.inputs.forEach(input => input.value = '');
        elements.moderatorPassword.inputs[0].focus();
    }
    
    /**
     * 진행자 비밀번호 입력창 닫기
     */
    function hideModeratorPassword() {
        elements.moderatorPassword.container.classList.add('hidden');
        elements.moderatorPassword.inputs.forEach(input => input.value = '');
    }
    
    /**
     * 비밀번호 입력 필드 처리
     */
    function handlePasswordInput(e) {
        const input = e.target;
        const index = parseInt(input.dataset.index);
        
        // 입력값이 숫자인지 확인
        if (!/^[0-9]$/.test(input.value)) {
            input.value = '';
            return;
        }
        
        // 다음 입력 필드로 포커스 이동
        if (index < 3) {
            elements.moderatorPassword.inputs[index + 1].focus();
        } else {
            // 마지막 필드 입력 후 자동 검증
            verifyModeratorPassword();
        }
    }
    
    /**
     * 비밀번호 키 입력 처리
     */
    function handlePasswordKeydown(e) {
        const input = e.target;
        const index = parseInt(input.dataset.index);
        
        if (e.key === 'Backspace' && input.value === '' && index > 0) {
            // 백스페이스 키 누를 때 이전 필드로 이동
            elements.moderatorPassword.inputs[index - 1].focus();
        } else if (e.key === 'Enter') {
            // 엔터 키로 검증
            verifyModeratorPassword();
        }
    }
    
    /**
     * 진행자 비밀번호 검증
     */
    function verifyModeratorPassword() {
        // 입력값 조합
        let password = '';
        elements.moderatorPassword.inputs.forEach(input => {
            password += input.value;
        });
        
        // 비밀번호 검증
        if (authService.verifyModeratorPassword(password)) {
            authService.setRole('moderator');
            hideModeratorPassword();
            navigateToProfileScreen('moderator');
        } else {
            // 오류 메시지 표시
            elements.moderatorPassword.errorMessage.style.display = 'block';
            elements.moderatorPassword.inputs.forEach(input => {
                input.value = '';
            });
            elements.moderatorPassword.inputs[0].focus();
            
            // 입력 필드 흔들기 애니메이션
            const container = document.querySelector('.password-digits');
            container.classList.add('shake');
            setTimeout(() => {
                container.classList.remove('shake');
            }, 500);
        }
    }
    
    /**
     * 프로필 화면으로 이동
     */
    function navigateToProfileScreen(role) {
        // 역할에 맞는 뱃지 표시
        updateRoleBadge(elements.profile.roleBadge, role === 'moderator');
        
        // 화면 전환
        showScreen(SCREENS.PROFILE);
    }
    
    /**
     * 프로필 제출 처리
     */
    function handleProfileSubmit(e) {
        e.preventDefault();
        
        // 입력값 가져오기
        const profileData = {
            name: elements.profile.name.value,
            email: elements.profile.email.value,
            language: elements.profile.language.value
        };
        
        // 입력값 검증
        if (!profileData.name.trim()) {
            showNotification('이름을 입력해주세요.', 'error');
            return;
        }
        
        if (!profileData.email.trim() || !validateEmail(profileData.email)) {
            showNotification('유효한 이메일 주소를 입력해주세요.', 'error');
            return;
        }
        
        // API 상태 확인
        if (!state.apiStatus.supabase) {
            showNotification('서버 연결에 문제가 있습니다. 나중에 다시 시도해주세요.', 'error');
            return;
        }
        
        // 로딩 표시
        showLoading();
        
        // 사용자 정보 설정
        const userInfo = authService.setupUserProfile(profileData);
        
        if (userInfo) {
            // 채팅 화면 초기화 및 이동
            initChatScreen().then(() => {
                hideLoading();
                showScreen(SCREENS.CHAT);
                
                // 입장 메시지 표시
                showNotification(`${translationService.getLanguageName(userInfo.language)} 언어로 채팅에 참여합니다.`, 'info');
            }).catch(error => {
                console.error('채팅 초기화 실패:', error);
                hideLoading();
                showNotification('채팅 초기화 중 오류가 발생했습니다.', 'error');
            });
        } else {
            hideLoading();
            showNotification('프로필 설정 중 오류가 발생했습니다.', 'error');
        }
    }
    
    /**
     * 채팅 화면 초기화
     */
    async function initChatScreen() {
        const userInfo = databaseService.currentUser;
        if (!userInfo) {
            throw new Error('사용자 정보가 없습니다.');
        }
        
        // 강퇴 여부 확인
        const isKicked = await databaseService.checkIfKicked();
        if (isKicked) {
            authService.logout();
            showScreen(SCREENS.ROLE);
            showNotification('강퇴된 사용자입니다. 채팅에 참여할 수 없습니다.', 'error');
            throw new Error('강퇴된 사용자');
        }
        
        // UI 초기화
        updateRoleBadge(elements.chat.roleBadge, userInfo.isModerator);
        elements.chat.settingsLanguage.value = userInfo.language;
        elements.chat.messageContainer.innerHTML = '';
        elements.chat.messageInput.value = '';
        
        // 진행자 도구 표시/숨김
        elements.chat.moderatorTools.classList.toggle('hidden', !userInfo.isModerator);
        
        // 메시지 구독
        databaseService.subscribeToMessages(handleNewMessage);
        
        // 상태 구독
        databaseService.subscribeToPresence(updateOnlineUsers);
        
        // 이전 메시지 로드
        const recentMessages = await databaseService.getRecentMessages();
        await processMessages(recentMessages);
        
        return true;
    }
    
    /**
     * 메시지 처리 및 화면에 표시
     */
    async function processMessages(messages) {
        if (!messages || messages.length === 0) return;
        
        const userLanguage = databaseService.currentUser.language;
        const messagePromises = messages.map(async message => {
            // 번역 필요 여부 확인
            if (message.language !== userLanguage && state.apiStatus.translation) {
                try {
                    const translatedContent = await translationService.translateText(
                        message.content,
                        message.language,
                        userLanguage
                    );
                    
                    message.translatedContent = translatedContent;
                    message.targetLanguage = userLanguage;
                } catch (error) {
                    console.error('메시지 번역 실패:', error);
                }
            }
            
            // 메시지 표시
            displayMessage(message);
        });
        
        // 모든 메시지 처리 완료 대기
        await Promise.all(messagePromises);
        
        // 스크롤 하단으로 이동
        scrollToBottom();
    }
    
    /**
     * 새 메시지 처리
     */
    function handleNewMessage(message) {
        console.log('새 메시지 수신:', message);
        displayMessage(message);
        scrollToBottom();
        
        // 새 메시지 알림 (설정 패널이 열려있을 때)
        if (elements.chat.settingsPanel.classList.contains('visible')) {
            showNotification(`${message.user_name}님이 새 메시지를 보냈습니다.`, 'info');
        }
    }
    
    /**
     * 메시지 화면에 표시
     */
    function displayMessage(message) {
        const currentUser = databaseService.currentUser;
        const isSelf = currentUser && message.user_id === currentUser.email;
        const isModerator = message.is_moderator;
        const isAnnouncement = message.is_announcement;
        
        // 공지사항인 경우
        if (isAnnouncement) {
            const announcementEl = document.createElement('div');
            announcementEl.className = 'announcement-message';
            
            announcementEl.innerHTML = `
                <div class="announcement-title">
                    <i class="fas fa-bullhorn"></i>
                    <span>공지사항 (${message.user_name})</span>
                </div>
                <div class="announcement-content">${message.content}</div>
            `;
            
            elements.chat.messageContainer.appendChild(announcementEl);
            return;
        }
        
        // 일반 메시지
        const messageEl = document.createElement('div');
        messageEl.className = 'message-container';
        
        // 자신의 메시지 또는 진행자 메시지 스타일 적용
        if (isSelf) messageEl.classList.add('self');
        if (isModerator) messageEl.classList.add('moderator');
        
        // 메시지 내용
        let content = message.content;
        
        // 번역된 내용이 있으면 표시
        if (message.translatedContent) {
            content = `
                ${message.translatedContent}
                <div class="original-message">
                    <small>원문 (${translationService.getLanguageName(message.language)}): ${message.content}</small>
                </div>
            `;
        }
        
        // 메시지 시간 포맷
        const messageTime = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // 메시지 HTML
        messageEl.innerHTML = `
            ${!isSelf ? `
                <div class="message-header">
                    <span class="user-name">${message.user_name}</span>
                    <span class="user-role ${isModerator ? 'moderator' : ''}">${isModerator ? '진행자' : '참가자'}</span>
                </div>
            ` : ''}
            <div class="message-bubble">${content}</div>
            <div class="message-time">${messageTime}</div>
        `;
        
        elements.chat.messageContainer.appendChild(messageEl);
    }
    
    /**
     * 채팅창 하단으로 스크롤
     */
    function scrollToBottom() {
        elements.chat.messageContainer.scrollTop = elements.chat.messageContainer.scrollHeight;
    }
    
    /**
     * 메시지 입력창 높이 조절
     */
    function adjustInputHeight() {
        const input = elements.chat.messageInput;
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    }
    
    /**
     * 메시지 키 입력 처리
     */
    function handleMessageKeydown(e) {
        // Shift+Enter는 줄바꿈, Enter만 입력하면 메시지 전송
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    /**
     * 메시지 전송
     */
    function sendMessage() {
        const content = elements.chat.messageInput.value.trim();
        if (!content) return;
        
        // 권한 확인
        if (!authService.checkPermission('send_message')) {
            showNotification('메시지를 보낼 권한이 없습니다.', 'error');
            return;
        }
        
        // API 상태 확인
        if (!state.apiStatus.supabase) {
            showNotification('서버 연결 문제로 메시지를 보낼 수 없습니다.', 'error');
            return;
        }
        
        // 메시지 전송 전 UI 업데이트
        elements.chat.messageInput.value = '';
        elements.chat.messageInput.style.height = 'auto';
        
        // 메시지 전송
        databaseService.sendMessage(content).then(message => {
            if (message) {
                displayMessage(message);
                scrollToBottom();
            } else {
                showNotification('메시지 전송 실패', 'error');
            }
        }).catch(error => {
            console.error('메시지 전송 오류:', error);
            showNotification('메시지 전송 중 오류가 발생했습니다.', 'error');
        });
    }
    
    /**
     * 공지사항 패널 표시
     */
    function showAnnouncementPanel() {
        if (!authService.isModerator()) {
            showNotification('진행자만 공지사항을 작성할 수 있습니다.', 'error');
            return;
        }
        
        elements.announcementPanel.panel.classList.remove('hidden');
        elements.announcementPanel.text.value = '';
        elements.announcementPanel.text.focus();
    }
    
    /**
     * 공지사항 패널 숨김
     */
    function hideAnnouncementPanel() {
        elements.announcementPanel.panel.classList.add('hidden');
    }
    
    /**
     * 공지사항 전송
     */
    function sendAnnouncement() {
        const content = elements.announcementPanel.text.value.trim();
        if (!content) return;
        
        // 권한 확인
        if (!authService.checkPermission('send_announcement')) {
            showNotification('공지사항을 작성할 권한이 없습니다.', 'error');
            return;
        }
        
        // API 상태 확인
        if (!state.apiStatus.supabase) {
            showNotification('서버 연결 문제로 공지사항을 보낼 수 없습니다.', 'error');
            return;
        }
        
        // 공지사항 전송
        databaseService.sendMessage(content, true).then(message => {
            if (message) {
                hideAnnouncementPanel();
                displayMessage(message);
                scrollToBottom();
            } else {
                showNotification('공지사항 전송 실패', 'error');
            }
        }).catch(error => {
            console.error('공지사항 전송 오류:', error);
            showNotification('공지사항 전송 중 오류가 발생했습니다.', 'error');
        });
    }
    
    /**
     * 강퇴 패널 표시
     */
    function showKickPanel() {
        if (!authService.isModerator()) {
            showNotification('진행자만 사용자를 강퇴할 수 있습니다.', 'error');
            return;
        }
        
        // 온라인 사용자 목록 업데이트
        updateKickUserList();
        
        elements.kickPanel.panel.classList.remove('hidden');
    }
    
    /**
     * 강퇴 패널 숨김
     */
    function hideKickPanel() {
        elements.kickPanel.panel.classList.add('hidden');
    }
    
    /**
     * 강퇴 사용자 목록 업데이트
     */
    function updateKickUserList() {
        const userList = elements.kickPanel.userList;
        userList.innerHTML = '';
        
        const currentUser = databaseService.currentUser;
        const onlineUsers = databaseService.onlineUsers || [];
        
        if (onlineUsers.size === 0) {
            userList.innerHTML = '<p>온라인 사용자가 없습니다.</p>';
            return;
        }
        
        // 사용자 목록 생성
        onlineUsers.forEach(user => {
            // 자기 자신은 표시하지 않음
            if (user.user_id === currentUser.email) return;
            
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            
            userItem.innerHTML = `
                <div class="user-info">
                    <div class="user-name">${user.user_name}</div>
                    <div class="user-email">${user.user_id}</div>
                </div>
                <button class="button danger-button kick-button" data-user-id="${user.user_id}">강퇴</button>
            `;
            
            userList.appendChild(userItem);
        });
        
        // 강퇴 버튼 이벤트 추가
        document.querySelectorAll('.kick-button').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                kickUser(userId);
            });
        });
    }
    
    /**
     * 사용자 강퇴 처리
     */
    function kickUser(userId) {
        if (!authService.checkPermission('kick_user')) {
            showNotification('사용자를 강퇴할 권한이 없습니다.', 'error');
            return;
        }
        
        // API 상태 확인
        if (!state.apiStatus.supabase) {
            showNotification('서버 연결 문제로 사용자를 강퇴할 수 없습니다.', 'error');
            return;
        }
        
        // 강퇴 확인
        if (!confirm(`${userId} 사용자를 강퇴하시겠습니까?`)) {
            return;
        }
        
        // 강퇴 처리
        databaseService.kickUser(userId).then(success => {
            if (success) {
                hideKickPanel();
                showNotification(`${userId} 사용자가 강퇴되었습니다.`, 'success');
            } else {
                showNotification('사용자 강퇴 실패', 'error');
            }
        }).catch(error => {
            console.error('사용자 강퇴 오류:', error);
            showNotification('사용자 강퇴 중 오류가 발생했습니다.', 'error');
        });
    }
    
    /**
     * 온라인 사용자 목록 업데이트
     */
    function updateOnlineUsers(users) {
        state.onlineUsers = users;
        
        // 강퇴 패널이 열려있으면 목록 업데이트
        if (!elements.kickPanel.panel.classList.contains('hidden')) {
            updateKickUserList();
        }
    }
    
    /**
     * 설정 패널 표시
     */
    function showSettingsPanel() {
        elements.chat.settingsPanel.classList.add('visible');
    }
    
    /**
     * 설정 패널 숨김
     */
    function hideSettingsPanel() {
        elements.chat.settingsPanel.classList.remove('visible');
    }
    
    /**
     * 언어 변경
     */
    function changeLanguage() {
        const newLanguage = elements.chat.settingsLanguage.value;
        
        if (!databaseService.currentUser) return;
        
        const userInfo = {
            ...databaseService.currentUser,
            language: newLanguage
        };
        
        databaseService.saveUserInfo(userInfo);
        showNotification(`언어가 ${translationService.getLanguageName(newLanguage)}로 변경되었습니다.`, 'success');
    }
    
    /**
     * 테마 토글
     */
    function toggleTheme() {
        state.isDarkTheme = elements.chat.themeSwitch.checked;
        localStorage.setItem('chatTheme', state.isDarkTheme ? 'dark' : 'light');
        applyTheme();
    }
    
    /**
     * 로그아웃
     */
    function logout() {
        authService.logout();
        showScreen(SCREENS.ROLE);
        showNotification('로그아웃되었습니다.', 'info');
    }
    
    /**
     * 화면 전환
     */
    function showScreen(screenId) {
        Object.values(elements.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        elements.screens[screenId.split('-')[0]].classList.remove('hidden');
    }
    
    /**
     * 역할 뱃지 업데이트
     */
    function updateRoleBadge(badgeElement, isModerator) {
        badgeElement.innerHTML = isModerator ? 
            '<i class="fas fa-user-tie"></i> <span>진행자</span>' : 
            '<i class="fas fa-user"></i> <span>참가자</span>';
            
        badgeElement.classList.toggle('moderator', isModerator);
    }
    
    /**
     * 로딩 표시
     */
    function showLoading() {
        elements.loadingOverlay.classList.remove('hidden');
    }
    
    /**
     * 로딩 숨김
     */
    function hideLoading() {
        elements.loadingOverlay.classList.add('hidden');
    }
    
    /**
     * 알림 표시
     */
    function showNotification(message, type = 'info') {
        const toast = elements.notificationToast;
        toast.container.classList.remove('hidden');
        toast.message.textContent = message;
        
        // 아이콘 설정
        toast.icon.className = 'toast-icon fas';
        switch (type) {
            case 'success':
                toast.icon.classList.add('fa-check-circle');
                toast.icon.style.color = 'var(--success-color)';
                break;
            case 'error':
                toast.icon.classList.add('fa-exclamation-circle');
                toast.icon.style.color = 'var(--error-color)';
                break;
            case 'warning':
                toast.icon.classList.add('fa-exclamation-triangle');
                toast.icon.style.color = 'var(--warning-color)';
                break;
            default:
                toast.icon.classList.add('fa-info-circle');
                toast.icon.style.color = 'var(--info-color)';
        }
        
        // 알림 자동 닫기
        setTimeout(() => {
            toast.container.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * 이메일 유효성 검사
     */
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // 애니메이션 키프레임 동적 추가 (비밀번호 오류 시 흔들기 효과)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
    `;
    document.head.appendChild(style);
    
    // 애플리케이션 초기화
    init();
});
