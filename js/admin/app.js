/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 관리자 페이지 메인 로직
 * 작성일: 2025-05-07
 */

// 관리자 페이지 초기화 상태
let isAdminInitialized = false;

/**
 * 관리자 페이지 초기화 함수
 */
async function initializeAdmin() {
    // 이미 초기화된 경우 중복 실행 방지
    if (isAdminInitialized) return;
    
    try {
        console.log('관리자 페이지 초기화 중...');
        
        // 관리자 로그인 상태 확인
        if (!window.authService.isAdminLoggedIn()) {
            // 로그인되지 않은 경우 메인 페이지로 리디렉션
            window.location.href = 'index.html';
            return;
        }
        
        // 네비게이션 이벤트 초기화
        initializeNavigation();
        
        // 쿼리 파라미터에서 섹션 확인
        const params = window.utils.getQueryParams();
        const section = params.section || 'dashboard';
        
        // 해당 섹션으로 이동
        switchSection(section);
        
        // 섹션별 작업 액션이 있는 경우 처리
        if (params.action) {
            handleSectionAction(section, params.action, params.id);
        }
        
        // 초기화 완료
        isAdminInitialized = true;
        console.log('관리자 페이지 초기화 완료');
        
    } catch (error) {
        console.error('관리자 페이지 초기화 오류:', error);
        window.uiService.addNotification('관리자 페이지 초기화 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 네비게이션 이벤트 초기화 함수
 */
function initializeNavigation() {
    // 네비게이션 아이템 클릭 이벤트
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            
            // 섹션 ID 추출
            const section = item.dataset.section;
            
            // 섹션 전환
            switchSection(section);
            
            // URL 업데이트
            const url = new URL(window.location);
            url.searchParams.set('section', section);
            url.searchParams.delete('action');
            url.searchParams.delete('id');
            window.history.pushState({}, '', url);
        });
    });
    
    // 로그아웃 버튼 이벤트
    document.getElementById('logout-btn').addEventListener('click', () => {
        // 관리자 로그아웃
        window.authService.adminLogout();
        
        // 메인 페이지로 리디렉션
        window.location.href = 'index.html';
    });
}

/**
 * 섹션 전환 함수
 * @param {string} sectionId - 섹션 ID
 */
function switchSection(sectionId) {
    // 모든 섹션 숨김
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 모든 네비게이션 아이템 비활성화
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 선택한 섹션 활성화
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // 해당 네비게이션 아이템 활성화
    const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // 섹션별 초기화 함수 호출
    switch (sectionId) {
        case 'dashboard':
            window.adminDashboard.initialize();
            break;
        case 'rooms':
            window.adminRooms.initialize();
            break;
        case 'categories':
            window.adminCategories.initialize();
            break;
        case 'users':
            window.adminUsers.initialize();
            break;
        case 'messages':
            window.adminMessages.initialize();
            break;
        case 'translation':
            window.adminTranslation.initialize();
            break;
    }
}

/**
 * 섹션 액션 처리 함수
 * @param {string} section - 섹션 ID
 * @param {string} action - 액션 유형
 * @param {string} id - 아이템 ID
 */
function handleSectionAction(section, action, id) {
    switch (section) {
        case 'rooms':
            if (action === 'create') {
                window.adminRooms.openCreateModal();
            } else if (action === 'edit' && id) {
                window.adminRooms.openEditModal(id);
            } else if (action === 'delete' && id) {
                window.adminRooms.confirmDelete(id);
            }
            break;
            
        case 'categories':
            if (action === 'create') {
                window.adminCategories.openCreateModal();
            } else if (action === 'edit' && id) {
                window.adminCategories.openEditModal(id);
            } else if (action === 'delete' && id) {
                window.adminCategories.confirmDelete(id);
            }
            break;
            
        case 'users':
            if (action === 'view' && id) {
                window.adminUsers.viewUser(id);
            } else if (action === 'block' && id) {
                window.adminUsers.blockUser(id);
            }
            break;
            
        case 'messages':
            if (action === 'view' && id) {
                window.adminMessages.viewMessage(id);
            } else if (action === 'delete' && id) {
                window.adminMessages.confirmDelete(id);
            } else if (action === 'pin' && id) {
                window.adminMessages.togglePin(id, true);
            } else if (action === 'unpin' && id) {
                window.adminMessages.togglePin(id, false);
            }
            break;
            
        case 'translation':
            if (action === 'clear-cache') {
                window.adminTranslation.confirmClearCache();
            }
            break;
    }
}

// 페이지 로드 시 모든 서비스가 로드된 후 관리자 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 필요한 서비스들이 모두 로드되었는지 확인
    const requiredServices = [
        'utilsLoaded',
        'supabaseServiceLoaded',
        'authServiceLoaded',
        'uiServiceLoaded',
        'adminDashboardLoaded',
        'adminRoomsLoaded',
        'adminCategoriesLoaded',
        'adminUsersLoaded',
        'adminMessagesLoaded',
        'adminTranslationLoaded'
    ];
    
    const loadedServices = new Set();
    
    // 각 서비스 로드 이벤트 리스너
    requiredServices.forEach(service => {
        // 이미 로드된 서비스 확인
        if (document.readyState !== 'loading' && document.dispatchEvent(new Event(service, { cancelable: true }))) {
            loadedServices.add(service);
        }
        
        // 향후 로드될 서비스 이벤트 리스너
        document.addEventListener(service, () => {
            loadedServices.add(service);
            
            // 모든 서비스가 로드되었는지 확인
            if (requiredServices.every(s => loadedServices.has(s))) {
                initializeAdmin();
            }
        });
    });
    
    // 이미 모든 서비스가 로드된 경우 바로 초기화
    if (requiredServices.every(s => loadedServices.has(s))) {
        initializeAdmin();
    }
});

// 테마 관련 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 저장된 테마 설정 로드
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode === 'true') {
        // 다크 모드 활성화
        const themeStylesheet = document.getElementById('theme-style');
        themeStylesheet.removeAttribute('disabled');
        document.documentElement.setAttribute('data-theme', 'dark');
        
        // 테마 토글 버튼 아이콘 업데이트
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            const icon = themeToggleBtn.querySelector('i');
            const text = themeToggleBtn.querySelector('span');
            
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            text.textContent = '라이트 모드';
        }
    }
    
    // 테마 토글 버튼 이벤트
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const themeStylesheet = document.getElementById('theme-style');
            
            if (themeStylesheet.hasAttribute('disabled')) {
                // 다크 모드 활성화
                themeStylesheet.removeAttribute('disabled');
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('darkMode', 'true');
                
                // 아이콘 변경
                const icon = themeToggleBtn.querySelector('i');
                const text = themeToggleBtn.querySelector('span');
                
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                text.textContent = '라이트 모드';
            } else {
                // 라이트 모드 활성화
                themeStylesheet.setAttribute('disabled', true);
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('darkMode', 'false');
                
                // 아이콘 변경
                const icon = themeToggleBtn.querySelector('i');
                const text = themeToggleBtn.querySelector('span');
                
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                text.textContent = '다크 모드';
            }
        });
    }
});

// 내보내기
window.adminApp = {
    switchSection,
    handleSectionAction
};
