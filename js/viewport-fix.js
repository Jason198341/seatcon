/**
 * 모바일 브라우저 Viewport 수정 스크립트
 * 
 * 이 스크립트는 모바일 브라우저(특히 iOS Safari)에서 viewport 높이 계산 문제를 해결합니다.
 * 브라우저 하단 네비게이션 바와 입력창이 겹치는 문제를 해결하기 위한 근본적인 해결책입니다.
 */

// 실제 화면 높이를 CSS 변수로 설정
function setViewportHeight() {
    // 실제 viewport 높이 계산
    const vh = window.innerHeight * 0.01;
    
    // CSS 변수로 설정 (1vh = 1% of viewport height)
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // 키보드가 나타날 때 입력창의 위치 조정을 위한 값 (iOS Safari)
    document.documentElement.style.setProperty('--window-height', `${window.innerHeight}px`);
}

// 초기 실행
setViewportHeight();

// 화면 크기 변경 시 재계산 (throttle 적용)
let resizeTimeout;
window.addEventListener('resize', () => {
    // 이전 타이머 취소
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    
    // 새 타이머 설정 (100ms 후 실행)
    resizeTimeout = setTimeout(() => {
        setViewportHeight();
    }, 100);
});

// 방향 변경 시 재계산
window.addEventListener('orientationchange', () => {
    // 약간의 지연을 두고 실행 (방향 전환 완료 후)
    setTimeout(setViewportHeight, 200);
});

// iOS Safari 특별 처리
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    // 비주얼 뷰포트가 변경될 때 (키보드가 나타나거나 사라질 때)
    window.visualViewport.addEventListener('resize', () => {
        if (document.activeElement.tagName === 'TEXTAREA' || 
            document.activeElement.tagName === 'INPUT') {
            
            // 키보드가 열린 경우, 입력창 위치 조정
            const keyboardHeight = window.innerHeight - window.visualViewport.height;
            document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
            
            // iOS에서 스크롤 위치 조정을 위한 클래스 추가
            document.body.classList.add('keyboard-open');
        } else {
            // 키보드가 닫힌 경우
            document.documentElement.style.setProperty('--keyboard-height', '0px');
            document.body.classList.remove('keyboard-open');
        }
    });
}