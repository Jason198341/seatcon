/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * UI 관련 기능
 * 작성일: 2025-05-07
 */

// UI 상태 관리
const uiState = {
    isDarkMode: false,
    isMenuOpen: false,
    isScrollLocked: false,
    
    // 다크 모드 토글
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        const themeStylesheet = document.getElementById('theme-style');
        
        if (this.isDarkMode) {
            themeStylesheet.removeAttribute('disabled');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            themeStylesheet.setAttribute('disabled', true);
            document.documentElement.setAttribute('data-theme', 'light');
        }
        
        // 설정 저장
        localStorage.setItem('darkMode', this.isDarkMode);
        
        // 아이콘 변경
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            const icon = themeToggleBtn.querySelector('i');
            const text = themeToggleBtn.querySelector('span');
            
            if (this.isDarkMode) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                text.textContent = '라이트 모드';
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                text.textContent = '다크 모드';
            }
        }
        
        // 테마 변경 이벤트 발생
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { isDarkMode: this.isDarkMode } 
        }));
    },
    
    // 메뉴 토글
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebar) {
            if (this.isMenuOpen) {
                sidebar.classList.add('open');
            } else {
                sidebar.classList.remove('open');
            }
        }
    },
    
    // 스크롤 잠금 토글
    toggleScrollLock() {
        this.isScrollLocked = !this.isScrollLocked;
        
        if (this.isScrollLocked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
};

/**
 * 채팅방 목록 UI 업데이트 함수
 * @param {Array} roomsWithCategories - 카테고리별 채팅방 목록
 * @param {string} selectedRoomId - 선택된 채팅방 ID
 */
function updateRoomListUI(roomsWithCategories, selectedRoomId) {
    const roomCategoriesContainer = document.querySelector('.room-categories');
    
    if (!roomCategoriesContainer) return;
    
    roomCategoriesContainer.innerHTML = '';
    
    if (!roomsWithCategories || roomsWithCategories.length === 0) {
        roomCategoriesContainer.innerHTML = `
            <div class="empty-rooms">
                <p>채팅방이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    roomsWithCategories.forEach(category => {
        // 카테고리에 채팅방이 없으면 건너뛰기
        if (!category.rooms || category.rooms.length === 0) return;
        
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-item';
        
        // 카테고리 헤더
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <span>${category.category.name}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        
        // 카테고리 헤더 클릭 이벤트
        categoryHeader.addEventListener('click', () => {
            const categoryRooms = categoryHeader.nextElementSibling;
            categoryRooms.classList.toggle('collapsed');
            
            const icon = categoryHeader.querySelector('i');
            if (categoryRooms.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
        });
        
        // 채팅방 목록
        const categoryRooms = document.createElement('div');
        categoryRooms.className = 'category-rooms';
        
        category.rooms.forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            roomItem.dataset.id = room.id;
            
            if (selectedRoomId === room.id) {
                roomItem.classList.add('active');
            }
            
            roomItem.textContent = room.name;
            
            // 채팅방 클릭 이벤트
            roomItem.addEventListener('click', async () => {
                // 현재 선택된 채팅방 강조 표시 제거
                document.querySelectorAll('.room-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // 클릭한 채팅방 강조 표시
                roomItem.classList.add('active');
                
                // 채팅방 초기화
                try {
                    const success = await window.chatService.initializeChat(room.id);
                    
                    if (success) {
                        // 채팅방 헤더 업데이트
                        document.getElementById('current-room-name').textContent = room.name;
                        document.getElementById('current-room-description').textContent = room.description || '';
                        
                        // URL 업데이트
                        const url = new URL(window.location);
                        url.searchParams.set('room', room.id);
                        window.history.pushState({}, '', url);
                        
                        // 모바일 환경에서 메뉴 닫기
                        if (window.innerWidth <= 768) {
                            uiState.toggleMenu();
                        }
                    }
                } catch (error) {
                    console.error('채팅방 전환 오류:', error);
                    alert('채팅방 전환 중 오류가 발생했습니다.');
                }
            });
            
            categoryRooms.appendChild(roomItem);
        });
        
        categoryContainer.appendChild(categoryHeader);
        categoryContainer.appendChild(categoryRooms);
        roomCategoriesContainer.appendChild(categoryContainer);
    });
}

/**
 * 로그인 UI 업데이트 함수
 * @param {boolean} isLoggedIn - 로그인 상태
 * @param {Object} user - 사용자 정보
 */
function updateLoginUI(isLoggedIn, user) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    
    if (!loginBtn || !userInfo) return;
    
    if (isLoggedIn && user) {
        // 로그인 상태 UI
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        
        // 사용자 정보 표시
        document.getElementById('username').textContent = user.username;
        document.getElementById('user-avatar').src = `img/${user.avatar_url}`;
        
        // 선호 언어 설정
        const languageSelector = document.getElementById('language');
        if (languageSelector && user.preferred_language) {
            languageSelector.value = user.preferred_language;
        }
    } else {
        // 로그아웃 상태 UI
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        
        // 사용자 정보 초기화
        document.getElementById('username').textContent = '';
        document.getElementById('user-avatar').src = '';
    }
}

/**
 * 답장 모드 UI 업데이트 함수
 * @param {boolean} isReplying - 답장 모드 여부
 * @param {Object} message - 답장할 메시지 객체
 */
function updateReplyUI(isReplying, message = null) {
    const replyContainer = document.getElementById('reply-box');
    
    if (!replyContainer) return;
    
    if (isReplying && message) {
        // 답장 모드 활성화
        replyContainer.hidden = false;
        
        // 답장 정보 표시
        document.getElementById('reply-username').textContent = message.user.username;
        document.getElementById('reply-text').textContent = message.translated_content || message.content;
        
        // 메시지 입력창에 포커스
        document.getElementById('message-input').focus();
    } else {
        // 답장 모드 비활성화
        replyContainer.hidden = true;
        
        // 답장 정보 초기화
        document.getElementById('reply-username').textContent = '';
        document.getElementById('reply-text').textContent = '';
    }
}

/**
 * 알림 추가 함수
 * @param {string} message - 알림 메시지
 * @param {string} type - 알림 유형 ('info', 'success', 'warning', 'error')
 * @param {number} duration - 표시 시간 (밀리초, 0이면 영구 표시)
 */
function addNotification(message, type = 'info', duration = 5000) {
    const notificationArea = document.querySelector('.notification-area');
    
    if (!notificationArea) return;
    
    // 알림 컨테이너 활성화
    notificationArea.classList.add('active');
    
    // 알림 요소 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
        </div>
        <button class="btn-icon close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // 알림 닫기 버튼 이벤트
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.classList.add('closing');
        
        // 애니메이션 후 제거
        setTimeout(() => {
            notification.remove();
            
            // 알림이 없으면 컨테이너 비활성화
            if (notificationArea.children.length === 0) {
                notificationArea.classList.remove('active');
            }
        }, 300);
    });
    
    // 알림 추가
    notificationArea.appendChild(notification);
    
    // 자동 제거 타이머 (duration이 0보다 크면)
    if (duration > 0) {
        setTimeout(() => {
            // 이미 제거된 경우 처리
            if (!notification.isConnected) return;
            
            notification.classList.add('closing');
            
            // 애니메이션 후 제거
            setTimeout(() => {
                notification.remove();
                
                // 알림이 없으면 컨테이너 비활성화
                if (notificationArea.children.length === 0) {
                    notificationArea.classList.remove('active');
                }
            }, 300);
        }, duration);
    }
}

/**
 * 모달 초기화 함수
 */
function initializeModals() {
    // 모달 닫기 버튼 이벤트
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) {
                modal.hidden = true;
                uiState.toggleScrollLock();
            }
        });
    });
    
    // 모달 바깥 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.hidden = true;
                uiState.toggleScrollLock();
            }
        });
    });
    
    // 로그인 모달 이벤트
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn');
    const loginForm = document.getElementById('login-form');
    
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', () => {
            loginModal.hidden = false;
            uiState.toggleScrollLock();
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const username = document.getElementById('username-input').value.trim();
            const avatarUrl = document.querySelector('input[name="avatar"]:checked').value;
            const role = document.getElementById('role-select').value;
            const preferredLanguage = document.getElementById('language').value;
            
            // 사용자 이름 검증
            if (!username) {
                alert('사용자 이름을 입력해주세요.');
                return;
            }
            
            try {
                // 로그인 처리
                await window.authService.login(username, preferredLanguage, role, avatarUrl);
                
                // 모달 닫기
                loginModal.hidden = true;
                uiState.toggleScrollLock();
                
                // 알림 표시
                addNotification(`${username}님, 환영합니다!`, 'success');
            } catch (error) {
                console.error('로그인 오류:', error);
                alert('로그인 처리 중 오류가 발생했습니다.');
            }
        });
    }
    
    // 관리자 모달 이벤트
    const adminLink = document.querySelector('.admin-link');
    const adminModal = document.getElementById('admin-modal');
    const adminForm = document.getElementById('admin-login-form');
    
    if (adminLink && adminModal) {
        adminLink.addEventListener('click', (event) => {
            event.preventDefault();
            adminModal.hidden = false;
            uiState.toggleScrollLock();
        });
    }
    
    if (adminForm) {
        adminForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const password = document.getElementById('admin-password').value;
            
            // 관리자 로그인 처리
            const success = window.authService.adminLogin(password);
            
            if (success) {
                // 관리자 페이지로 이동
                window.location.href = 'admin.html';
            } else {
                alert('관리자 비밀번호가 올바르지 않습니다.');
            }
        });
    }
}

/**
 * 로그아웃 이벤트 초기화 함수
 */
function initializeLogoutEvent() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', () => {
        try {
            // 로그아웃 처리
            window.authService.logout();
            
            // 채팅 상태 초기화
            window.chatService.chatState.reset();
            
            // 알림 표시
            addNotification('로그아웃되었습니다.', 'info');
            
            // 페이지 새로고침
            window.location.reload();
        } catch (error) {
            console.error('로그아웃 오류:', error);
            alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
    });
}

/**
 * 메시지 입력창 초기화 함수
 */
function initializeMessageInput() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');
    const cancelReplyBtn = document.getElementById('cancel-reply-btn');
    
    if (!messageInput || !sendBtn) return;
    
    // 자동 확장 설정
    window.utils.initAutoExpandTextarea(messageInput);
    
    // 메시지 전송 함수
    const sendMessage = async () => {
        const content = messageInput.value.trim();
        
        if (!content) return;
        
        try {
            // 로그인 상태 확인
            if (!window.authService.authState.isValid()) {
                alert('메시지를 보내려면 로그인이 필요합니다.');
                return;
            }
            
            // 채팅방 선택 확인
            if (!window.chatService.chatState.currentRoomId) {
                alert('채팅방을 선택해주세요.');
                return;
            }
            
            // 전송 버튼 비활성화
            sendBtn.disabled = true;
            
            // 메시지 전송
            await window.chatService.sendMessage(content);
            
            // 입력창 초기화
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // 답장 모드 초기화
            if (window.chatService.chatState.isReplying) {
                window.chatService.cancelReply();
            }
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            alert('메시지 전송 중 오류가 발생했습니다.');
        } finally {
            // 전송 버튼 활성화
            sendBtn.disabled = false;
        }
    };
    
    // 전송 버튼 클릭 이벤트
    sendBtn.addEventListener('click', sendMessage);
    
    // 엔터 키 이벤트 (Shift+Enter는 줄바꿈)
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
    
    // 답장 취소 버튼 이벤트
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', () => {
            window.chatService.cancelReply();
        });
    }
}

/**
 * 새 메시지 알림 초기화 함수
 */
function initializeNewMessageAlert() {
    const messagesContainer = document.querySelector('.messages-container');
    const newMessagesAlert = document.getElementById('new-messages-alert');
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
    
    if (!messagesContainer || !newMessagesAlert || !scrollToBottomBtn) return;
    
    // 스크롤 이벤트 리스너
    messagesContainer.addEventListener('scroll', () => {
        // 스크롤이 맨 아래에 있으면 알림 숨김
        if (window.chatService.isAtBottom(messagesContainer)) {
            newMessagesAlert.hidden = true;
        }
    });
    
    // 새 메시지 클릭 이벤트
    scrollToBottomBtn.addEventListener('click', () => {
        // 맨 아래로 스크롤
        window.chatService.scrollToBottom(messagesContainer);
        // 알림 숨김
        newMessagesAlert.hidden = true;
    });
}

/**
 * 테마 관련 초기화 함수
 */
function initializeTheme() {
    // 저장된 테마 설정 로드
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode === 'true') {
        uiState.toggleDarkMode();
    }
    
    // 테마 토글 버튼 이벤트
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            uiState.toggleDarkMode();
        });
    }
    
    // 시스템 테마 설정 확인
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 저장된 설정이 없고 시스템이 다크 모드면 다크 모드로 설정
    if (savedDarkMode === null && prefersDarkMode) {
        uiState.toggleDarkMode();
    }
}

/**
 * 채팅방 생성 버튼 초기화 함수
 */
function initializeCreateRoomButton() {
    const createRoomBtn = document.getElementById('create-room-btn');
    
    if (!createRoomBtn) return;
    
    createRoomBtn.addEventListener('click', () => {
        // 로그인 상태 확인
        if (!window.authService.authState.isValid()) {
            alert('채팅방을 생성하려면 로그인이 필요합니다.');
            return;
        }
        
        // 스태프 권한 확인
        if (window.authService.authState.user.role !== 'staff') {
            alert('채팅방 생성은 스태프만 가능합니다.');
            return;
        }
        
        // 관리자 페이지로 이동
        window.location.href = 'admin.html?section=rooms&action=create';
    });
}

/**
 * 반응형 레이아웃 초기화 함수
 */
function initializeResponsiveLayout() {
    // 모바일 메뉴 토글 버튼 생성
    const header = document.querySelector('.app-header');
    
    if (!header) return;
    
    // 모바일에서만 메뉴 버튼 표시
    if (window.innerWidth <= 768) {
        const menuBtn = document.createElement('button');
        menuBtn.id = 'menu-toggle-btn';
        menuBtn.className = 'btn btn-icon';
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        
        menuBtn.addEventListener('click', () => {
            uiState.toggleMenu();
        });
        
        header.insertBefore(menuBtn, header.firstChild);
    }
    
    // 창 크기 변경 이벤트
    window.addEventListener('resize', () => {
        // 창 크기에 따라 메뉴 버튼 표시/숨김
        const menuBtn = document.getElementById('menu-toggle-btn');
        
        if (window.innerWidth <= 768) {
            if (!menuBtn) {
                const newMenuBtn = document.createElement('button');
                newMenuBtn.id = 'menu-toggle-btn';
                newMenuBtn.className = 'btn btn-icon';
                newMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                
                newMenuBtn.addEventListener('click', () => {
                    uiState.toggleMenu();
                });
                
                header.insertBefore(newMenuBtn, header.firstChild);
            }
        } else {
            if (menuBtn) {
                menuBtn.remove();
            }
            
            // 모바일 메뉴가 열려있으면 닫기
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                uiState.isMenuOpen = false;
            }
        }
    });
}

/**
 * UI 요소 초기화 함수
 */
function initializeUI() {
    // 모달 초기화
    initializeModals();
    
    // 로그아웃 이벤트 초기화
    initializeLogoutEvent();
    
    // 메시지 입력창 초기화
    initializeMessageInput();
    
    // 새 메시지 알림 초기화
    initializeNewMessageAlert();
    
    // 테마 초기화
    initializeTheme();
    
    // 채팅방 생성 버튼 초기화
    initializeCreateRoomButton();
    
    // 반응형 레이아웃 초기화
    initializeResponsiveLayout();
}

// 페이지 로드 시 UI 초기화
document.addEventListener('DOMContentLoaded', initializeUI);

// 이벤트 리스너 등록
document.addEventListener('userLogin', (event) => {
    updateLoginUI(true, event.detail);
});

document.addEventListener('userLogout', () => {
    updateLoginUI(false);
});

document.addEventListener('replyModeChanged', (event) => {
    updateReplyUI(event.detail.isReplying, event.detail.message);
});

// UI 유틸리티 함수를 전역으로 내보내기
window.uiService = {
    uiState,
    updateRoomListUI,
    updateLoginUI,
    updateReplyUI,
    addNotification,
    initializeUI
};

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('uiServiceLoaded'));
