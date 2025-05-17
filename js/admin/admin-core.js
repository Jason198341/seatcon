/**
 * 관리자 페이지 핵심 모듈
 * 관리자 인증, 탭 관리, 공통 기능 등을 담당합니다.
 */

class AdminCore {
    constructor() {
        this.authenticated = false;
        this.adminId = null;
        this.activeTab = 'dashboard';
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing admin core...');
            
            // 인증 확인
            this.checkAuthentication();
            
            // 이벤트 리스너 등록
            this.setupEventListeners();
            
            // 서비스 초기화
            await dbService.initialize();
            
            // 첫 화면 로드
            this.loadDashboard();
            
            console.log('Admin core initialized');
            return true;
        } catch (error) {
            console.error('Error initializing admin core:', error);
            return false;
        }
    }

    /**
     * 인증 상태 확인
     * @private
     */
    checkAuthentication() {
        try {
            const adminData = localStorage.getItem('adminData');
            
            if (adminData) {
                const admin = JSON.parse(adminData);
                
                // 인증 데이터의 만료 시간 확인
                if (admin.expiry && new Date(admin.expiry) > new Date()) {
                    this.authenticated = true;
                    this.adminId = admin.id;
                    
                    document.getElementById('admin-name').textContent = admin.username || '관리자';
                    
                    return true;
                } else {
                    // 만료된 인증 데이터 삭제
                    localStorage.removeItem('adminData');
                }
            }
            
            // 인증되지 않은 경우 로그인 페이지로 리디렉션
            window.location.href = '../index.html';
            return false;
        } catch (error) {
            console.error('Error checking authentication:', error);
            window.location.href = '../index.html';
            return false;
        }
    }

    /**
     * 이벤트 리스너 설정
     * @private
     */
    setupEventListeners() {
        // 탭 전환
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // 로그아웃
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    /**
     * 탭 전환
     * @param {string} tabId 탭 ID
     */
    switchTab(tabId) {
        console.log('Switching to tab:', tabId);
        
        // 모든 탭 비활성화
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 모든 네비게이션 링크 비활성화
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // 선택한 탭 활성화
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`.nav-link[data-tab="${tabId}"]`).classList.add('active');
        
        this.activeTab = tabId;
        
        // 탭별 로드 함수 호출
        switch (tabId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'chat-rooms':
                this.loadChatRooms();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'system':
                this.loadSystemStatus();
                break;
        }
    }

    /**
     * 대시보드 로드
     * @private
     */
    loadDashboard() {
        // 대시보드 모듈의 초기화 함수 호출
        if (typeof adminDashboard !== 'undefined') {
            adminDashboard.initialize();
        }
    }

    /**
     * 채팅방 관리 로드
     * @private
     */
    loadChatRooms() {
        // 채팅방 관리 모듈의 초기화 함수 호출
        if (typeof adminRooms !== 'undefined') {
            adminRooms.initialize();
        }
    }

    /**
     * 사용자 관리 로드
     * @private
     */
    loadUsers() {
        // 사용자 관리 모듈의 초기화 함수 호출
        if (typeof adminUsers !== 'undefined') {
            adminUsers.initialize();
        }
    }

    /**
     * 시스템 상태 로드
     * @private
     */
    loadSystemStatus() {
        // 시스템 상태 모듈의 초기화 함수 호출
        if (typeof adminSystem !== 'undefined') {
            adminSystem.initialize();
        }
    }

    /**
     * 로그아웃
     */
    logout() {
        console.log('Logging out...');
        
        // 인증 데이터 삭제
        localStorage.removeItem('adminData');
        
        // 로그인 페이지로 리디렉션
        window.location.href = '../index.html';
    }

    /**
     * 관리자 인증
     * @param {string} adminId 관리자 ID
     * @param {string} password 비밀번호
     * @returns {Promise<boolean>} 인증 성공 여부
     */
    async authenticate(adminId, password) {
        try {
            const result = await dbService.authenticateAdmin(adminId, password);
            
            if (result.success) {
                // 인증 데이터 저장
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 24); // 24시간 유효
                
                const adminData = {
                    id: result.adminId,
                    username: adminId,
                    expiry: expiry.toISOString()
                };
                
                localStorage.setItem('adminData', JSON.stringify(adminData));
                
                this.authenticated = true;
                this.adminId = result.adminId;
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error authenticating admin:', error);
            return false;
        }
    }

    /**
     * 오류 메시지 표시
     * @param {string} message 오류 메시지
     * @param {string} type 메시지 유형 ('error', 'warning', 'success', 'info')
     */
    showMessage(message, type = 'error') {
        // 메시지 요소가 있는지 확인
        let messageElement = document.getElementById('admin-message');
        
        // 없으면 생성
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'admin-message';
            document.body.appendChild(messageElement);
        }
        
        // 메시지 스타일 설정
        messageElement.className = `admin-message ${type}`;
        messageElement.textContent = message;
        
        // 표시
        messageElement.classList.add('show');
        
        // 3초 후 숨기기
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 3000);
    }

    /**
     * 확인 대화상자 표시
     * @param {string} message 확인 메시지
     * @returns {Promise<boolean>} 사용자 선택 (확인: true, 취소: false)
     */
    confirm(message) {
        return new Promise((resolve) => {
            if (confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    /**
     * 데이터 다시 로드
     */
    refreshData() {
        // 현재 활성화된 탭 다시 로드
        switch (this.activeTab) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'chat-rooms':
                this.loadChatRooms();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'system':
                this.loadSystemStatus();
                break;
        }
    }
}

// 싱글톤 인스턴스 생성
const adminCore = new AdminCore();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminCore.initialize();
});
