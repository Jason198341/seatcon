/**
 * main.js
 * Global SeatCon 2025 Conference Chat
 * 메인 진입점
 */

// 환경 설정과 CONFIG 로드 완료 이벤트 리스너
let envConfigLoaded = false;
let appConfigLoaded = false;

// 환경 설정 로드 완료 확인
window.addEventListener('env-config-loaded', () => {
    console.log('환경 설정 로드 완료 이벤트 감지');
    envConfigLoaded = true;
    attemptInitialization();
});

// 애플리케이션 설정 로드 완료 확인
window.addEventListener('config-loaded', () => {
    console.log('애플리케이션 설정 로드 완료 이벤트 감지');
    appConfigLoaded = true;
    attemptInitialization();
});

// 애플리케이션 초기화 시도 함수
function attemptInitialization() {
    // 이미 초기화 시도 중이면 중단
    if (window.APP && window.APP.state && window.APP.state.isInitializing) {
        console.log('이미 초기화가, 중입니다. 중복 초기화 방지');
        return;
    }
    
    // 모든 설정이 로드되었고 DOM이 준비되었는지 확인
    if (envConfigLoaded && appConfigLoaded && document.readyState === 'complete') {
        console.log('모든 조건이 충족되어 애플리케이션 초기화 시작');
        initializeApplication();
    } else {
        console.log('아직 모든 조건이 충족되지 않았습니다:', {
            envConfigLoaded,
            appConfigLoaded,
            domReady: document.readyState
        });
    }
}

// 메인 애플리케이션 초기화 함수
function initializeApplication() {
    try {
        console.log('애플리케이션 초기화 시작');
        
        // APP 객체가 정의되어 있는지 확인
        if (typeof window.APP === 'undefined') {
            console.error('APP 객체가 정의되지 않았습니다.');
            showInitError('애플리케이션 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        // APP.core가 정의되어 있는지 확인
        if (!window.APP.core || typeof window.APP.core.init !== 'function') {
            console.error('APP.core 객체 또는 초기화 함수가 없습니다.');
            
            // APP.core를 직접 초기화 (임시 방편)
            if (!window.APP.core) {
                window.APP.core = {
                    init: async function() {
                        console.log('임시 초기화 함수 실행');
                        try {
                            // 로그인 화면 표시
                            const loginContainer = document.getElementById('login-container');
                            const chatContainer = document.getElementById('chat-container');
                            
                            if (loginContainer && chatContainer) {
                                chatContainer.classList.add('hidden');
                                loginContainer.classList.remove('hidden');
                            }
                            
                            // 로딩 숨기기
                            const loadingOverlay = document.querySelector('.loading-overlay');
                            if (loadingOverlay) {
                                loadingOverlay.classList.add('hidden');
                            }
                        } catch (error) {
                            console.error('임시 초기화 함수 실행 중 오류:', error);
                        }
                    }
                };
            }
        }
        
        // 애플리케이션 초기화
        window.APP.core.init().catch(error => {
            console.error('애플리케이션 초기화 실패:', error);
            showInitError(`애플리케이션 초기화 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
        });
    } catch (error) {
        console.error('초기화 중 예외 발생:', error);
        showInitError(`애플리케이션 초기화 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    }
}

// 초기화 오류 표시 함수
function showInitError(message) {
    // 로딩 오버레이 숨기기
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
    
    // 오류 메시지 표시
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message-global';
    errorMessage.innerHTML = `
        <div class="error-content">
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
            <button onclick="location.reload()">새로고침</button>
        </div>
    `;
    document.body.appendChild(errorMessage);
    
    // 기본 알림도 표시
    alert(message);
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료');
    // DOM이 로드되면 초기화 시도
    attemptInitialization();
});

// 페이지 완전 로드 이벤트 리스너
window.addEventListener('load', () => {
    console.log('페이지 완전 로드 완료');
    // 초기화 시도
    attemptInitialization();
    
    // 5초 후에도 초기화되지 않았다면 타임아웃으로 간주하고 오류 표시
    setTimeout(() => {
        if (!window.APP || !window.APP.state || !window.APP.state.initialized) {
            console.error('애플리케이션 초기화 타임아웃');
            showInitError('애플리케이션 초기화 시간이 초과되었습니다. 페이지를 새로고침해주세요.');
        }
    }, 5000);
});
