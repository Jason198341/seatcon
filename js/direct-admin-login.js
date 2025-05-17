/**
 * direct-admin-login.js
 * 관리자 직접 로그인을 위한 스크립트
 */

// 관리자 로그인 함수
function directAdminLogin() {
    console.log('직접 관리자 로그인 시도...');
    
    // 로컬 스토리지에 직접 관리자 세션 저장
    const adminSession = {
        id: 'kcmmer',
        role: 'admin',
        timestamp: new Date().getTime()
    };
    
    localStorage.setItem('admin_session', JSON.stringify(adminSession));
    console.log('관리자 세션 저장 완료. 페이지를 새로고침합니다.');
    
    // 페이지 새로고침
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// 페이지에 직접 로그인 버튼 추가
function addDirectLoginButton() {
    const loginForm = document.querySelector('.login-form');
    if (!loginForm) return;
    
    const directLoginButton = document.createElement('button');
    directLoginButton.textContent = '직접 로그인 (문제 해결용)';
    directLoginButton.className = 'secondary-button';
    directLoginButton.style.marginTop = '10px';
    directLoginButton.style.backgroundColor = '#f50057';
    directLoginButton.style.color = 'white';
    directLoginButton.onclick = directAdminLogin;
    
    loginForm.appendChild(directLoginButton);
    console.log('직접 로그인 버튼 추가됨');
}

// 문서 로드 후 버튼 추가
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(addDirectLoginButton, 1000);
});
