/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 사용자 인증 기능
 * 작성일: 2025-05-07
 */

// 사용자 상태 관리
const authState = {
    isAuthenticated: false,
    user: null,
    
    // 사용자 상태 유효성 확인
    isValid() {
        return this.isAuthenticated && this.user !== null;
    },
    
    // 사용자 상태 초기화
    reset() {
        this.isAuthenticated = false;
        this.user = null;
        localStorage.removeItem('userAuth');
    },
    
    // 상태 저장
    save() {
        if (this.user) {
            localStorage.setItem('userAuth', JSON.stringify({
                isAuthenticated: this.isAuthenticated,
                user: this.user
            }));
        }
    },
    
    // 상태 로드
    load() {
        try {
            const savedAuth = localStorage.getItem('userAuth');
            if (savedAuth) {
                const parsedAuth = JSON.parse(savedAuth);
                this.isAuthenticated = parsedAuth.isAuthenticated;
                this.user = parsedAuth.user;
                return true;
            }
        } catch (error) {
            console.error('인증 상태 로드 오류:', error);
        }
        return false;
    }
};

/**
 * 사용자 로그인 처리 함수
 * @param {string} username - 사용자 이름
 * @param {string} preferredLanguage - 선호 언어
 * @param {string} role - 역할
 * @param {string} avatarUrl - 아바타 URL
 * @returns {Promise<Object>} - 생성된 사용자 객체
 */
async function login(username, preferredLanguage, role, avatarUrl) {
    try {
        // 사용자 생성 또는 조회
        const user = await window.supabaseService.createUser(
            username,
            preferredLanguage,
            role,
            avatarUrl
        );
        
        // 인증 상태 업데이트
        authState.isAuthenticated = true;
        authState.user = user;
        authState.save();
        
        // 로그인 이벤트 발생
        document.dispatchEvent(new CustomEvent('userLogin', { detail: user }));
        
        return user;
    } catch (error) {
        console.error('로그인 오류:', error);
        throw error;
    }
}

/**
 * 로그아웃 처리 함수
 */
function logout() {
    try {
        // 인증 상태 초기화 이전에 이벤트 발생
        document.dispatchEvent(new CustomEvent('userLogout', { 
            detail: { userId: authState.user?.id } 
        }));
        
        // 인증 상태 초기화
        authState.reset();
        
        // Supabase 연결 재설정
        supabase.removeAllChannels();
        
        return true;
    } catch (error) {
        console.error('로그아웃 오류:', error);
        return false;
    }
}

/**
 * 관리자 로그인 함수
 * @param {string} password - 관리자 비밀번호
 * @returns {boolean} - 로그인 성공 여부
 */
function adminLogin(password) {
    // 관리자 비밀번호 확인 (보안상 실제 구현에서는 서버측 검증 필요)
    const ADMIN_PASSWORD = 'rnrud9881';
    
    if (password === ADMIN_PASSWORD) {
        // 관리자 세션 설정
        localStorage.setItem('adminAuth', 'true');
        return true;
    }
    
    return false;
}

/**
 * 관리자 로그아웃 함수
 */
function adminLogout() {
    localStorage.removeItem('adminAuth');
}

/**
 * 관리자 상태 확인 함수
 * @returns {boolean} - 관리자 인증 상태
 */
function isAdminLoggedIn() {
    return localStorage.getItem('adminAuth') === 'true';
}

// 페이지 로드 시 인증 상태 복원
document.addEventListener('DOMContentLoaded', () => {
    // 저장된 인증 상태 로드
    if (authState.load()) {
        console.log('저장된 사용자 세션 복원됨:', authState.user.username);
        // 로그인 상태 UI 업데이트 이벤트 발생
        document.dispatchEvent(new CustomEvent('userLogin', { detail: authState.user }));
    }
    
    // 관리자 페이지의 경우 인증 확인
    if (window.location.pathname.includes('admin.html') && !isAdminLoggedIn()) {
        // 관리자 로그인이 아닌 경우 메인 페이지로 리디렉션
        window.location.href = 'index.html';
    }
});

// 모듈 내보내기
window.authService = {
    authState,
    login,
    logout,
    adminLogin,
    adminLogout,
    isAdminLoggedIn
};

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('authServiceLoaded'));
