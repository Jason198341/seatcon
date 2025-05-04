/**
 * 로그인 초기화 스크립트
 * 사용자 인증 초기화를 위한 유틸리티 함수
 */

/**
 * 로컬 스토리지에서 사용자 정보 제거 및 페이지 새로고침
 */
function resetUserLogin() {
    try {
        console.log('로그인 상태 초기화 중...');
        
        // 로컬 스토리지에서 사용자 정보 제거
        localStorage.removeItem('premium-chat-user-info');
        
        console.log('사용자 정보가 제거되었습니다. 페이지를 새로고침합니다.');
        
        // 페이지 새로고침
        location.reload();
    } catch (error) {
        console.error('로그인 초기화 중 오류 발생:', error);
        alert('로그인 초기화 중 오류가 발생했습니다.');
    }
}

// 콘솔에서 함수 사용 가능하도록 전역 스코프에 추가
window.resetUserLogin = resetUserLogin;

/**
 * 현재 로그인 상태 확인
 * @returns {Object|null} 현재 로그인된 사용자 정보 또는 null
 */
function checkLoginStatus() {
    try {
        const userInfoStr = localStorage.getItem('premium-chat-user-info');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
        
        console.log('현재 로그인 상태:', userInfo ? '로그인됨' : '로그인되지 않음');
        
        if (userInfo) {
            console.log('로그인된 사용자 정보:', userInfo);
        }
        
        return userInfo;
    } catch (error) {
        console.error('로그인 상태 확인 중 오류 발생:', error);
        return null;
    }
}

// 콘솔에서 함수 사용 가능하도록 전역 스코프에 추가
window.checkLoginStatus = checkLoginStatus;

/**
 * 테스트 사용자로 로그인
 */
function loginAsTestUser() {
    try {
        console.log('테스트 사용자로 로그인 중...');
        
        // 테스트 사용자 정보
        const testUser = {
            name: '테스트 사용자',
            email: 'test@example.com',
            role: 'attendee',
            language: 'ko'
        };
        
        // 로컬 스토리지에 사용자 정보 저장
        localStorage.setItem('premium-chat-user-info', JSON.stringify(testUser));
        
        console.log('테스트 사용자로 로그인 완료. 페이지를 새로고침합니다.');
        
        // 페이지 새로고침
        location.reload();
    } catch (error) {
        console.error('테스트 사용자 로그인 중 오류 발생:', error);
        alert('테스트 사용자 로그인 중 오류가 발생했습니다.');
    }
}

// 콘솔에서 함수 사용 가능하도록 전역 스코프에 추가
window.loginAsTestUser = loginAsTestUser;

// 페이지 로드 시 현재 로그인 상태 콘솔에 출력
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 로그인 디버그 도구 로드됨 ===');
    console.log('사용 가능한 명령:');
    console.log('- resetUserLogin(): 로그인 상태 초기화');
    console.log('- checkLoginStatus(): 현재 로그인 상태 확인');
    console.log('- loginAsTestUser(): 테스트 사용자로 로그인');
    
    // 현재 로그인 상태 확인
    checkLoginStatus();
});