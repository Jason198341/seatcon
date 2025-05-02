/**
 * 인증 서비스
 * 
 * 사용자 인증 및 권한 관리 기능을 제공합니다.
 */
class AuthService {
    constructor() {
        this.moderatorPassword = '9881'; // 진행자 비밀번호
        this.currentRole = null; // 현재 선택된 역할
        this.loginAttempts = 0; // 로그인 시도 횟수
        this.loginAttemptsResetTimer = null;
    }
    
    /**
     * 역할을 설정합니다.
     * @param {string} role - 설정할 역할 ('participant' 또는 'moderator')
     */
    setRole(role) {
        if (role !== 'participant' && role !== 'moderator') {
            console.error('유효하지 않은 역할:', role);
            return;
        }
        
        this.currentRole = role;
        sessionStorage.setItem('selectedRole', role);
        
        console.log('역할 설정:', role);
    }
    
    /**
     * 현재 선택된 역할을 가져옵니다.
     * @returns {string|null} - 현재 역할
     */
    getRole() {
        if (!this.currentRole) {
            this.currentRole = sessionStorage.getItem('selectedRole');
        }
        return this.currentRole;
    }
    
    /**
     * 진행자 비밀번호를 확인합니다.
     * @param {string} password - 확인할 비밀번호
     * @returns {boolean} - 비밀번호 일치 여부
     */
    verifyModeratorPassword(password) {
        // 로그인 시도 제한 (5회 실패 시 1분간 잠금)
        if (this.loginAttempts >= 5) {
            console.error('너무 많은 로그인 시도. 잠시 후에 다시 시도하세요.');
            return false;
        }
        
        const isValid = password === this.moderatorPassword;
        
        if (isValid) {
            // 성공 시 시도 횟수 초기화
            this.loginAttempts = 0;
            if (this.loginAttemptsResetTimer) {
                clearTimeout(this.loginAttemptsResetTimer);
                this.loginAttemptsResetTimer = null;
            }
        } else {
            // 실패 시 시도 횟수 증가
            this.loginAttempts++;
            
            // 타이머 설정 (1분 후 시도 횟수 초기화)
            if (!this.loginAttemptsResetTimer) {
                this.loginAttemptsResetTimer = setTimeout(() => {
                    this.loginAttempts = 0;
                    this.loginAttemptsResetTimer = null;
                }, 60000);
            }
        }
        
        return isValid;
    }
    
    /**
     * 사용자 프로필을 설정합니다.
     * @param {Object} profileData - 프로필 데이터
     * @returns {Object} - 설정된 사용자 정보
     */
    setupUserProfile(profileData) {
        if (!profileData || !profileData.name || !profileData.email || !profileData.language) {
            console.error('유효하지 않은 프로필 데이터');
            return null;
        }
        
        const role = this.getRole();
        if (!role) {
            console.error('역할이 선택되지 않았습니다.');
            return null;
        }
        
        const userInfo = {
            name: profileData.name.trim(),
            email: profileData.email.trim(),
            language: profileData.language,
            isModerator: role === 'moderator',
            joinedAt: new Date().toISOString()
        };
        
        // 데이터베이스에 사용자 정보 저장
        databaseService.saveUserInfo(userInfo);
        
        return userInfo;
    }
    
    /**
     * 사용자가 로그인 중인지 확인합니다.
     * @returns {boolean} - 로그인 여부
     */
    isLoggedIn() {
        return !!databaseService.currentUser;
    }
    
    /**
     * 현재 사용자가 진행자인지 확인합니다.
     * @returns {boolean} - 진행자 여부
     */
    isModerator() {
        return this.isLoggedIn() && databaseService.currentUser.isModerator;
    }
    
    /**
     * 로그아웃 처리를 합니다.
     */
    logout() {
        databaseService.unsubscribeAll();
        databaseService.clearUserInfo();
        this.currentRole = null;
        sessionStorage.removeItem('selectedRole');
        console.log('로그아웃 완료');
    }
    
    /**
     * 사용자 권한을 확인합니다.
     * @param {string} action - 수행하려는 작업
     * @returns {boolean} - 권한 여부
     */
    checkPermission(action) {
        if (!this.isLoggedIn()) return false;
        
        switch (action) {
            case 'send_message':
                return true; // 모든 로그인 사용자 가능
                
            case 'send_announcement':
            case 'kick_user':
                return this.isModerator(); // 진행자만 가능
                
            default:
                console.error('알 수 없는 작업:', action);
                return false;
        }
    }
}

// 전역 인스턴스 생성
const authService = new AuthService();
