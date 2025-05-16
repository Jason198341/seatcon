/**
 * main.js
 * Global SeatCon 2025 Conference Chat
 * 메인 진입점
 */

// DOM이 로드된 후 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    try {
        // APP 객체가 정의되어 있는지 확인
        if (typeof window.APP === 'undefined') {
            console.error('APP 객체가 정의되지 않았습니다.');
            alert('애플리케이션 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        // APP.core가 정의되어 있지 않다면 app-core.js가 로드되지 않았을 수 있음
        if (!window.APP.core || typeof window.APP.core.init !== 'function') {
            console.error('APP.core 객체 또는 초기화 함수가 없습니다.');
            
            // APP.core를 직접 초기화 (임시 방편)
            if (!window.APP.core) {
                window.APP.core = {
                    init: async function() {
                        console.log('임시 초기화 함수 실행');
                        // 로그인 화면 표시
                        const loginContainer = document.getElementById('login-container');
                        const chatContainer = document.getElementById('chat-container');
                        
                        if (loginContainer && chatContainer) {
                            chatContainer.classList.add('hidden');
                            loginContainer.classList.remove('hidden');
                        }
                    }
                };
            }
        }
        
        // 애플리케이션 초기화
        window.APP.core.init().catch(error => {
            console.error('애플리케이션 초기화 실패:', error);
            alert(`애플리케이션 초기화 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
        });
    } catch (error) {
        console.error('초기화 중 예외 발생:', error);
        alert(`애플리케이션 초기화 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    }
});
