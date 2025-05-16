/**
 * main.js
 * Global SeatCon 2025 Conference Chat
 * 메인 진입점
 */

// DOM이 로드된 후 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    // APP 객체가 정의되어 있는지 확인
    if (typeof APP === 'undefined' || !APP.core || !APP.core.init) {
        console.error('APP 객체가 정의되지 않았거나 초기화 함수가 없습니다.');
        return;
    }
    
    // 애플리케이션 초기화
    APP.core.init().catch(error => {
        console.error('애플리케이션 초기화 실패:', error);
    });
});
