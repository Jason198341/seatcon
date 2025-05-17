/**
 * test_script.js
 * Global SeatCon 2025 Conference Chat 애플리케이션 테스트 스크립트
 * 
 * 이 스크립트는 애플리케이션의 주요 기능을 테스트합니다.
 * 개발자 도구의 콘솔에서 실행해주세요.
 */

// 테스트 결과 로그 스타일
const LOG_STYLES = {
    heading: 'color: #4361ee; font-size: 16px; font-weight: bold;',
    success: 'color: #4ade80; font-weight: bold;',
    error: 'color: #f43f5e; font-weight: bold;',
    info: 'color: #60a5fa;',
    warning: 'color: #fbbf24; font-weight: bold;'
};

// 테스트 결과를 저장할 객체
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    total: 0,
    details: []
};

// 테스트 실행 함수
function runTests() {
    logMessage('===== Global SeatCon 2025 테스트 시작 =====', LOG_STYLES.heading);
    
    // 테스트 시작 시간
    const startTime = performance.now();
    
    // 기본 객체 초기화 테스트
    testAppObjectInitialization();
    
    // 설정 로드 테스트
    testConfigLoading();
    
    // DOM 요소 참조 테스트
    testDOMReferences();
    
    // 이벤트 리스너 테스트
    testEventListeners();
    
    // 서비스 초기화 테스트
    testServiceInitialization();
    
    // 테스트 종료 시간 및 소요 시간 계산
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // 테스트 결과 출력
    logMessage(`\n===== 테스트 결과 =====`, LOG_STYLES.heading);
    logMessage(`총 테스트: ${testResults.total}`, LOG_STYLES.info);
    logMessage(`통과: ${testResults.passed}`, LOG_STYLES.success);
    logMessage(`실패: ${testResults.failed}`, LOG_STYLES.error);
    logMessage(`경고: ${testResults.warnings}`, LOG_STYLES.warning);
    logMessage(`소요 시간: ${duration}초`, LOG_STYLES.info);
    
    // 상세 결과
    logMessage('\n===== 상세 결과 =====', LOG_STYLES.heading);
    testResults.details.forEach((result, index) => {
        logMessage(`${index + 1}. ${result.name}: ${getResultText(result.status)}`, getStyleByStatus(result.status));
        if (result.message) {
            console.log(`   ${result.message}`);
        }
    });
    
    return {
        summary: `테스트 결과: 총 ${testResults.total}개 중 ${testResults.passed}개 통과, ${testResults.failed}개 실패, ${testResults.warnings}개 경고`,
        success: testResults.failed === 0
    };
}

// APP 객체 초기화 테스트
function testAppObjectInitialization() {
    logMessage('\n----- APP 객체 초기화 테스트 -----', LOG_STYLES.heading);
    
    // APP 객체 존재 확인
    assertTest(
        'APP 객체 존재 확인',
        typeof window.APP !== 'undefined',
        `window.APP이 ${typeof window.APP}입니다.`
    );
    
    // APP.state 확인
    assertTest(
        'APP.state 확인',
        window.APP && typeof window.APP.state === 'object',
        'APP.state가 올바르게 초기화되지 않았습니다.'
    );
    
    // APP.core 확인
    assertTest(
        'APP.core 확인',
        window.APP && typeof window.APP.core === 'object',
        'APP.core가 올바르게 초기화되지 않았습니다.'
    );
    
    // APP.core.init 함수 확인
    assertTest(
        'APP.core.init 함수 확인',
        window.APP && window.APP.core && typeof window.APP.core.init === 'function',
        'APP.core.init 함수가 정의되지 않았습니다.'
    );
    
    // APP.elements 확인
    assertTest(
        'APP.elements 확인',
        window.APP && typeof window.APP.elements === 'object',
        'APP.elements가 올바르게 초기화되지 않았습니다.'
    );
}

// 설정 로드 테스트
function testConfigLoading() {
    logMessage('\n----- 설정 로드 테스트 -----', LOG_STYLES.heading);
    
    // ENV_CONFIG 확인
    assertTest(
        'ENV_CONFIG 확인',
        typeof window.ENV_CONFIG === 'object',
        `window.ENV_CONFIG이 ${typeof window.ENV_CONFIG}입니다.`
    );
    
    // CONFIG 확인
    assertTest(
        'CONFIG 확인',
        typeof window.CONFIG === 'object',
        `window.CONFIG가 ${typeof window.CONFIG}입니다.`
    );
    
    // Supabase URL 확인
    assertTest(
        'Supabase URL 확인',
        window.CONFIG && typeof window.CONFIG.SUPABASE_URL === 'string' && window.CONFIG.SUPABASE_URL.includes('supabase.co'),
        'Supabase URL이 올바르게 로드되지 않았습니다.'
    );
    
    // Supabase 키 확인
    assertTest(
        'Supabase 키 확인',
        window.CONFIG && typeof window.CONFIG.SUPABASE_KEY === 'string' && window.CONFIG.SUPABASE_KEY.length > 20,
        'Supabase 키가 올바르게 로드되지 않았습니다.'
    );
    
    // Translation API 키 확인
    assertTest(
        'Translation API 키 확인',
        window.CONFIG && typeof window.CONFIG.TRANSLATION_API_KEY === 'string',
        'Translation API 키가 올바르게 로드되지 않았습니다.'
    );
    
    // 지원 언어 확인
    assertTest(
        '지원 언어 확인',
        window.CONFIG && Array.isArray(window.CONFIG.SUPPORTED_LANGUAGES) && window.CONFIG.SUPPORTED_LANGUAGES.length >= 2,
        '지원 언어 목록이 올바르게 로드되지 않았습니다.'
    );
}

// DOM 요소 참조 테스트
function testDOMReferences() {
    logMessage('\n----- DOM 요소 참조 테스트 -----', LOG_STYLES.heading);
    
    // 로그인 컨테이너 확인
    assertTest(
        '로그인 컨테이너 확인',
        document.getElementById('login-container') !== null,
        'login-container가 존재하지 않습니다.'
    );
    
    // 채팅 컨테이너 확인
    assertTest(
        '채팅 컨테이너 확인',
        document.getElementById('chat-container') !== null,
        'chat-container가 존재하지 않습니다.'
    );
    
    // APP.elements에 DOM 요소 참조 확인
    if (window.APP && window.APP.elements) {
        const elementsCount = Object.keys(window.APP.elements).length;
        if (elementsCount > 0) {
            addTestResult('DOM 요소 참조 개수', 'success', `${elementsCount}개의 DOM 요소 참조가 설정되었습니다.`);
        } else {
            addTestResult('DOM 요소 참조 개수', 'warning', 'APP.elements에 DOM 요소 참조가 없습니다.');
        }
    } else {
        addTestResult('DOM 요소 참조 개수', 'error', 'APP.elements 객체가 없습니다.');
    }
}

// 이벤트 리스너 테스트
function testEventListeners() {
    logMessage('\n----- 이벤트 리스너 테스트 -----', LOG_STYLES.heading);
    
    // 로그인 버튼 이벤트 리스너 확인
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        const hasClickListener = hasEventListener(loginButton, 'click');
        addTestResult('로그인 버튼 클릭 리스너 확인', hasClickListener ? 'success' : 'warning',
            hasClickListener ? '로그인 버튼에 클릭 이벤트 리스너가 있습니다.' : '로그인 버튼에 클릭 이벤트 리스너가 없을 수 있습니다.');
    } else {
        addTestResult('로그인 버튼 클릭 리스너 확인', 'warning', '로그인 버튼 요소를 찾을 수 없습니다.');
    }
    
    // 언어 선택 이벤트 리스너 확인
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        const hasChangeListener = hasEventListener(languageSelect, 'change');
        addTestResult('언어 선택 변경 리스너 확인', hasChangeListener ? 'success' : 'warning',
            hasChangeListener ? '언어 선택에 변경 이벤트 리스너가 있습니다.' : '언어 선택에 변경 이벤트 리스너가 없을 수 있습니다.');
    } else {
        addTestResult('언어 선택 변경 리스너 확인', 'warning', '언어 선택 요소를 찾을 수 없습니다.');
    }
    
    // 채팅방 선택 이벤트 리스너 확인
    const roomSelect = document.getElementById('room-select');
    if (roomSelect) {
        const hasChangeListener = hasEventListener(roomSelect, 'change');
        addTestResult('채팅방 선택 변경 리스너 확인', hasChangeListener ? 'success' : 'warning',
            hasChangeListener ? '채팅방 선택에 변경 이벤트 리스너가 있습니다.' : '채팅방 선택에 변경 이벤트 리스너가 없을 수 있습니다.');
    } else {
        addTestResult('채팅방 선택 변경 리스너 확인', 'warning', '채팅방 선택 요소를 찾을 수 없습니다.');
    }
    
    // window 이벤트 리스너 확인
    const hasLoadListener = hasGlobalEventListener('load');
    const hasDOMContentLoadedListener = hasGlobalEventListener('DOMContentLoaded');
    
    addTestResult('window load 이벤트 리스너 확인', hasLoadListener ? 'success' : 'warning',
        hasLoadListener ? 'window에 load 이벤트 리스너가 있습니다.' : 'window에 load 이벤트 리스너가 없을 수 있습니다.');
    
    addTestResult('DOMContentLoaded 이벤트 리스너 확인', hasDOMContentLoadedListener ? 'success' : 'warning',
        hasDOMContentLoadedListener ? 'document에 DOMContentLoaded 이벤트 리스너가 있습니다.' : 'document에 DOMContentLoaded 이벤트 리스너가 없을 수 있습니다.');
}

// 서비스 초기화 테스트
function testServiceInitialization() {
    logMessage('\n----- 서비스 초기화 테스트 -----', LOG_STYLES.heading);
    
    // dbService 확인
    assertTest(
        'dbService 확인',
        typeof window.dbService === 'object',
        'dbService가 올바르게 초기화되지 않았습니다.'
    );
    
    // translationService 확인
    assertTest(
        'translationService 확인',
        typeof window.translationService === 'object',
        'translationService가 올바르게 초기화되지 않았습니다.'
    );
    
    // realtimeService 확인
    assertTest(
        'realtimeService 확인',
        typeof window.realtimeService === 'object',
        'realtimeService가 올바르게 초기화되지 않았습니다.'
    );
    
    // userService 확인
    assertTest(
        'userService 확인',
        typeof window.userService === 'object',
        'userService가 올바르게 초기화되지 않았습니다.'
    );
    
    // chatService 확인
    assertTest(
        'chatService 확인',
        typeof window.chatService === 'object',
        'chatService가 올바르게 초기화되지 않았습니다.'
    );
    
    // offlineService 확인
    assertTest(
        'offlineService 확인',
        typeof window.offlineService === 'object',
        'offlineService가 올바르게 초기화되지 않았습니다.'
    );
    
    // APP.state.servicesReady 확인
    if (window.APP && window.APP.state) {
        addTestResult('APP.state.servicesReady 확인', 
            window.APP.state.servicesReady ? 'success' : 'warning',
            window.APP.state.servicesReady ? '서비스가 준비 상태입니다.' : '서비스가 아직 준비되지 않았습니다.');
    } else {
        addTestResult('APP.state.servicesReady 확인', 'error', 'APP.state 객체가 없습니다.');
    }
}

// 테스트 결과 로그 출력 함수
function logMessage(message, style = '') {
    if (style) {
        console.log('%c' + message, style);
    } else {
        console.log(message);
    }
}

// 테스트 결과 추가 함수
function addTestResult(name, status, message = '') {
    testResults.total++;
    
    if (status === 'success') {
        testResults.passed++;
    } else if (status === 'error') {
        testResults.failed++;
    } else if (status === 'warning') {
        testResults.warnings++;
    }
    
    testResults.details.push({
        name,
        status,
        message
    });
}

// 테스트 어설션 함수
function assertTest(name, condition, errorMessage = '') {
    const status = condition ? 'success' : 'error';
    const message = condition ? '' : errorMessage;
    
    addTestResult(name, status, message);
    
    return condition;
}

// 결과 텍스트 반환 함수
function getResultText(status) {
    switch (status) {
        case 'success': return '통과';
        case 'error': return '실패';
        case 'warning': return '경고';
        default: return '알 수 없음';
    }
}

// 결과 스타일 반환 함수
function getStyleByStatus(status) {
    switch (status) {
        case 'success': return LOG_STYLES.success;
        case 'error': return LOG_STYLES.error;
        case 'warning': return LOG_STYLES.warning;
        default: return '';
    }
}

// 이벤트 리스너 확인 함수 (추측 기반, 완벽한 확인은 어려움)
function hasEventListener(element, eventType) {
    try {
        // 이 방법은 완벽하지 않음 (모든 브라우저에서 작동하지 않을 수 있음)
        const listenerCount = element.eventListenerCount ? element.eventListenerCount(eventType) : -1;
        
        if (listenerCount > 0) {
            return true;
        }
        
        // 클론 노드를 생성하여 이벤트 리스너가 복제되는지 확인
        const clone = element.cloneNode(true);
        const hasListener = element !== clone;
        
        return hasListener;
    } catch (error) {
        console.warn('이벤트 리스너 확인 중 오류:', error);
        return false;
    }
}

// 전역 이벤트 리스너 확인 함수 (추측 기반, 완벽한 확인은 어려움)
function hasGlobalEventListener(eventType) {
    try {
        // window에 이벤트 리스너가 있는지 추측 (완벽하지 않음)
        const originalAddEventListener = window.addEventListener;
        let hasListener = false;
        
        window.addEventListener = function(type) {
            if (type === eventType) {
                hasListener = true;
            }
            return originalAddEventListener.apply(this, arguments);
        };
        
        // 변경된 addEventListener 복원
        window.addEventListener = originalAddEventListener;
        
        return hasListener;
    } catch (error) {
        console.warn('전역 이벤트 리스너 확인 중 오류:', error);
        return false;
    }
}

// 테스트 실행 함수 내보내기
window.runAppTests = runTests;

// 콘솔에 사용법 표시
console.log('%c테스트를 실행하려면 window.runAppTests()를 호출하세요.', 'font-weight: bold; color: #4361ee;');
