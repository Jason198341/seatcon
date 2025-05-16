/**
 * app-ui.js
 * Global SeatCon 2025 Conference Chat
 * UI 관련 기능
 */

// APP 객체가 정의되어 있지 않으면 생성
const APP = window.APP || {};

// UI 모듈
APP.ui = (() => {
    // 로그인 화면 표시
    const showLoginScreen = function() {
        if (!APP.elements.loginContainer || !APP.elements.chatContainer) return;
        
        APP.elements.chatContainer.classList.add('hidden');
        APP.elements.loginContainer.classList.remove('hidden');
    };
    
    // 채팅 화면 표시
    const showChatScreen = function() {
        if (!APP.elements.loginContainer || !APP.elements.chatContainer) return;
        
        APP.elements.loginContainer.classList.add('hidden');
        APP.elements.chatContainer.classList.remove('hidden');
    };
    
    // 로딩 표시 설정
    const showLoading = function(show) {
        if (!APP.elements.loadingOverlay) return;
        
        if (show) {
            APP.elements.loadingOverlay.classList.remove('hidden');
        } else {
            APP.elements.loadingOverlay.classList.add('hidden');
        }
    };
    
    // 로그인 에러 메시지 표시
    const showLoginError = function(message) {
        if (!APP.elements.loginError) return;
        
        APP.elements.loginError.textContent = message;
        
        // 3초 후 에러 메시지 초기화
        setTimeout(() => {
            if (APP.elements.loginError) {
                APP.elements.loginError.textContent = '';
            }
        }, 3000);
    };
    
    // 에러 메시지 표시 (알림창)
    const showError = function(message) {
        alert(message);
    };
    
    // 스크롤 최하단으로 이동
    const scrollToBottom = function() {
        if (!APP.elements.messageContainer) return;
        
        APP.elements.messageContainer.scrollTop = APP.elements.messageContainer.scrollHeight;
        APP.messages.pendingScrollToBottom = true;
    };
    
    // 입력 필드 자동 리사이즈
    const autoResizeMessageInput = function() {
        const input = APP.elements.messageInput;
        if (!input) return;
        
        // 입력 필드 높이 초기화
        input.style.height = 'auto';
        
        // 최대 높이 제한
        const maxHeight = 120;
        const newHeight = Math.min(input.scrollHeight, maxHeight);
        
        input.style.height = newHeight + 'px';
        
        // 최대 높이에 도달하면 스크롤 활성화
        input.style.overflowY = newHeight === maxHeight ? 'auto' : 'hidden';
    };
    
    // 창 크기 변경 이벤트 처리
    const handleWindowResize = function() {
        // 자동 스크롤이 활성화되어 있으면 맨 아래로 스크롤
        if (APP.messages.pendingScrollToBottom) {
            scrollToBottom();
        }
        
        // 입력 필드 높이 조정
        autoResizeMessageInput();
    };
    
    // 사용자 목록 토글
    const toggleUserList = function() {
        if (!APP.elements.userListPanel) return;
        
        APP.state.isUserListVisible = !APP.state.isUserListVisible;
        
        if (APP.state.isUserListVisible) {
            APP.elements.userListPanel.classList.add('active');
        } else {
            APP.elements.userListPanel.classList.remove('active');
        }
    };
    
    // 모달 닫기
    const closeModals = function() {
        // 모든 모달 숨기기
        if (APP.elements.languageModal) {
            APP.elements.languageModal.classList.add('hidden');
        }
    };
    
    // 공개 API
    return {
        showLoginScreen,
        showChatScreen,
        showLoading,
        showLoginError,
        showError,
        scrollToBottom,
        autoResizeMessageInput,
        handleWindowResize,
        toggleUserList,
        closeModals
    };
})();

// 글로벌 객체로 노출
window.APP = APP;
