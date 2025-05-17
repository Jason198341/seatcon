/**
 * 관리자 페이지 핵심 모듈
 * 관리자 페이지 초기화 및 전체 흐름을 제어합니다.
 */

class AdminCore {
    constructor() {
        this.initialized = false;
        this.currentAdmin = null;
        this.navItems = document.querySelectorAll('.nav-link');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.logoutBtn = document.getElementById('logout-btn');
    }

    /**
     * 관리자 페이지 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing admin panel...');
            
            // 서비스 초기화
            await dbService.initialize();
            
            // 관리자 인증 확인
            await this.checkAdminAuth();
            
            // 이벤트 리스너 등록
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('Admin panel initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            return false;
        }
    }

    /**
     * 관리자 인증 확인
     * @private
     */
    async checkAdminAuth() {
        try {
            // LocalStorage에서 관리자 세션 정보 확인
            const adminSession = localStorage.getItem('adminSession');
            
            if (!adminSession) {
                // 로그인 페이지로 리디렉션
                window.location.href = '../index.html';
                return;
            }
            
            // 세션 정보 파싱
            const sessionData = JSON.parse(adminSession);
            
            // 세션 유효성 확인 (실제 애플리케이션에서는 보다 안전한 인증 방식 필요)
            // 여기서는 간단한 데모를 위해 제한적으로 구현
            this.currentAdmin = {
                id: sessionData.adminId,
                name: 'Administrator'
            };
            
            // 관리자 정보 표시
            document.getElementById('admin-name').textContent = this.currentAdmin.name;
        } catch (error) {
            console.error('Error checking admin auth:', error);
            
            // 인증 오류 시 로그인 페이지로 리디렉션
            window.location.href = '../index.html';
        }
    }

    /**
     * 이벤트 리스너 등록
     * @private
     */
    setupEventListeners() {
        // 탭 전환 이벤트
        this.navItems.forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                this.switchTab(item.getAttribute('data-tab'));
            });
        });
        
        // 로그아웃 이벤트
        this.logoutBtn.addEventListener('click', e => {
            e.preventDefault();
            this.logout();
        });
    }

    /**
     * 탭 전환
     * @param {string} tabId 탭 ID
     */
    switchTab(tabId) {
        // 모든 탭 비활성화
        this.navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // 선택한 탭 활성화
        document.querySelector(`.nav-link[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    /**
     * 로그아웃
     */
    logout() {
        localStorage.removeItem('adminSession');
        window.location.href = '../index.html';
    }
}

// 싱글톤 인스턴스 생성
const adminCore = new AdminCore();

// 관리자 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminCore.initialize().then(success => {
        if (success) {
            console.log('Admin panel ready');
        } else {
            console.error('Failed to initialize admin panel');
            alert('오류가 발생했습니다. 다시 로그인해주세요.');
            window.location.href = '../index.html';
        }
    });
});
