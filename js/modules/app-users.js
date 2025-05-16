/**
 * app-users.js
 * Global SeatCon 2025 Conference Chat
 * 사용자 관련 기능
 */

// APP 객체가 정의되어 있지 않으면 생성
const APP = window.APP || {};

// 사용자 모듈
APP.users = (() => {
    // 로그인 처리
    const handleLogin = async function() {
        try {
            // 로딩 표시
            APP.ui.showLoading(true);
            
            // 입력값 가져오기
            const username = APP.elements.usernameInput.value.trim();
            const preferredLanguage = APP.elements.languageSelect.value;
            const roomId = APP.elements.roomSelect.value;
            const accessCode = APP.elements.accessCode.value;
            
            // 입력값 검증
            if (!username) {
                APP.ui.showLoginError(APP.i18n.translate('login.error.username') || 'Please enter your username.');
                APP.ui.showLoading(false);
                return;
            }
            
            if (!roomId) {
                APP.ui.showLoginError(APP.i18n.translate('login.error.room') || 'Please select a chat room.');
                APP.ui.showLoading(false);
                return;
            }
            
            // 선택한 채팅방 정보 가져오기
            const selectedRoom = await dbService.getChatRoomById(roomId);
            
            // 비공개 채팅방 접근 코드 검증
            if (selectedRoom.is_private && selectedRoom.access_code !== accessCode) {
                APP.ui.showLoginError(APP.i18n.translate('login.error.accessCode') || 'The access code is incorrect.');
                APP.ui.showLoading(false);
                return;
            }
            
            // 로그인 수행
            const user = await userService.login(username, preferredLanguage, roomId);
            APP.state.currentUser = user;
            APP.state.preferredLanguage = preferredLanguage;
            APP.state.isLoggedIn = true;
            
            // 언어 사전 로드
            await APP.i18n.loadLanguageDictionary(preferredLanguage);
            
            // 채팅방 입장
            await APP.rooms.enterChat(roomId);
            
            // 정기적인 활동 상태 업데이트 시작
            APP.state.activityInterval = userService.startActivityUpdates(APP.performance.activityUpdateInterval);
        } catch (error) {
            console.error('로그인 처리 실패:', error);
            APP.ui.showLoginError(APP.i18n.translate('login.error.general') || 'An error occurred during login.');
        } finally {
            // 로딩 종료
            APP.ui.showLoading(false);
        }
    };
    
    // 로그아웃 처리
    const handleLogout = async function() {
        try {
            // 로딩 표시
            APP.ui.showLoading(true);
            
            // 사용자 목록 업데이트 중지
            if (APP.performance.userListUpdateTimer) {
                clearInterval(APP.performance.userListUpdateTimer);
                APP.performance.userListUpdateTimer = null;
            }
            
            // 채팅방 퇴장
            if (APP.state.servicesReady) {
                await chatService.leaveRoom();
            }
            
            // 활동 상태 업데이트 중지
            if (APP.state.activityInterval) {
                clearInterval(APP.state.activityInterval);
                APP.state.activityInterval = null;
            }
            
            // 로그아웃 수행
            if (APP.state.servicesReady) {
                await userService.logout();
            }
            
            // 상태 초기화
            APP.state.currentUser = null;
            APP.state.isLoggedIn = false;
            APP.state.currentRoomId = null;
            APP.state.currentRoom = null;
            
            // 로그인 화면으로 전환
            APP.ui.showLoginScreen();
        } catch (error) {
            console.error('로그아웃 처리 실패:', error);
            APP.ui.showError(APP.i18n.translate('error.logout') || 'An error occurred during logout.');
        } finally {
            // 로딩 종료
            APP.ui.showLoading(false);
        }
    };
    
    // 창 종료 시 처리
    const handleBeforeUnload = function(event) {
        if (APP.state.isLoggedIn && APP.state.servicesReady) {
            userService.updateActivity();
        }
    };
    
    // 사용자 목록 로드
    const loadUserList = async function() {
        if (!APP.state.currentRoomId || !APP.state.servicesReady) return;
        
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
            if (APP.elements.userList) {
                APP.elements.userList.innerHTML = userListHTML || `<li class="no-users">${APP.i18n.translate('chat.noUsers') || 'No users'}</li>`;
            }
        } catch (error) {
            console.error('사용자 목록 로드 실패:', error);
        }
    };
    
    // 사용자 활동 업데이트 시작
    const startActivityUpdates = function(interval = APP.performance.activityUpdateInterval) {
        // 기존 타이머 정리
        if (APP.state.activityInterval) {
            clearInterval(APP.state.activityInterval);
        }
        
        // 초기 활동 상태 업데이트
        if (APP.state.servicesReady) {
            userService.updateActivity();
        }
        
        // 정기적인 활동 상태 업데이트 설정
        const activityInterval = setInterval(() => {
            if (APP.state.servicesReady) {
                userService.updateActivity();
            }
        }, interval);
        
        return activityInterval;
    };
    
    // 공개 API
    return {
        handleLogin,
        handleLogout,
        handleBeforeUnload,
        loadUserList,
        startActivityUpdates
    };
})();

// 글로벌 객체로 노출
window.APP = APP;
