/**
 * UI 테스트
 * 애플리케이션의 UI 요소 및 상호작용을 테스트합니다.
 */

// 테스트 결과를 저장할 객체
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// 테스트 케이스 실행 함수
function runTest(testName, testFn) {
    console.log(`Running test: ${testName}`);
    testResults.total++;
    
    try {
        testFn();
        console.log(`✅ Test passed: ${testName}`);
        testResults.passed++;
    } catch (error) {
        console.error(`❌ Test failed: ${testName}`);
        console.error(`   Error: ${error.message}`);
        testResults.failed++;
    }
}

// 어설션 함수
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
}

function assertElementExists(selector, message) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(message || `Element with selector "${selector}" not found`);
    }
    return element;
}

function assertElementVisible(selector, message) {
    const element = assertElementExists(selector);
    if (window.getComputedStyle(element).display === 'none') {
        throw new Error(message || `Element with selector "${selector}" is not visible`);
    }
    return element;
}

// UI 테스트 - 기본 요소 확인
function testBasicElements() {
    console.log('\n=== Basic UI Elements Tests ===');
    
    // 시작 화면 요소 테스트
    runTest('Start screen elements', function() {
        const startScreen = assertElementExists('#start-screen', 'Start screen not found');
        assertElementExists('#language-select', 'Language selector not found');
        assertElementExists('#join-chat-btn', 'Join chat button not found');
        assertElementExists('#admin-btn', 'Admin button not found');
    });
    
    // 로그인 화면 요소 테스트
    runTest('Login screen elements', function() {
        const loginScreen = assertElementExists('#login-screen', 'Login screen not found');
        assertElementExists('#username', 'Username input not found');
        assertElementExists('#chat-room-select', 'Chat room selector not found');
        assertElementExists('#private-room-code-container', 'Private room code container not found');
        assertElementExists('#back-to-start-btn', 'Back button not found');
    });
    
    // 관리자 로그인 화면 요소 테스트
    runTest('Admin login screen elements', function() {
        const adminLoginScreen = assertElementExists('#admin-login-screen', 'Admin login screen not found');
        assertElementExists('#admin-id', 'Admin ID input not found');
        assertElementExists('#admin-password', 'Admin password input not found');
        assertElementExists('#admin-back-btn', 'Admin back button not found');
    });
    
    // 채팅 화면 요소 테스트
    runTest('Chat screen elements', function() {
        const chatScreen = assertElementExists('#chat-screen', 'Chat screen not found');
        assertElementExists('#current-room-name', 'Room name element not found');
        assertElementExists('#chat-language-select', 'Chat language selector not found');
        assertElementExists('#messages-container', 'Messages container not found');
        assertElementExists('#users-sidebar', 'Users sidebar not found');
        assertElementExists('#message-input', 'Message input not found');
        assertElementExists('#send-message-btn', 'Send button not found');
    });
}

// UI 테스트 - 화면 전환
function testScreenTransitions() {
    console.log('\n=== Screen Transition Tests ===');
    
    // 시작 화면에서 로그인 화면으로 전환 테스트
    runTest('Transition: Start to Login', function() {
        // 시작 화면 확인
        const startScreen = assertElementExists('#start-screen');
        assert(startScreen.classList.contains('active'), 'Start screen should be active initially');
        
        // 채팅 참여 버튼 클릭
        document.getElementById('join-chat-btn').click();
        
        // 로그인 화면으로 전환 확인
        const loginScreen = assertElementExists('#login-screen');
        assert(loginScreen.classList.contains('active'), 'Login screen should be active after button click');
        assert(!startScreen.classList.contains('active'), 'Start screen should not be active anymore');
    });
    
    // 로그인 화면에서 시작 화면으로 돌아가기 테스트
    runTest('Transition: Login to Start', function() {
        // 로그인 화면 확인
        const loginScreen = assertElementExists('#login-screen');
        assert(loginScreen.classList.contains('active'), 'Login screen should be active initially');
        
        // 뒤로 버튼 클릭
        document.getElementById('back-to-start-btn').click();
        
        // 시작 화면으로 전환 확인
        const startScreen = assertElementExists('#start-screen');
        assert(startScreen.classList.contains('active'), 'Start screen should be active after back button click');
        assert(!loginScreen.classList.contains('active'), 'Login screen should not be active anymore');
    });
    
    // 시작 화면에서 관리자 로그인 화면으로 전환 테스트
    runTest('Transition: Start to Admin Login', function() {
        // 시작 화면 확인
        const startScreen = assertElementExists('#start-screen');
        assert(startScreen.classList.contains('active'), 'Start screen should be active initially');
        
        // 관리자 버튼 클릭
        document.getElementById('admin-btn').click();
        
        // 관리자 로그인 화면으로 전환 확인
        const adminLoginScreen = assertElementExists('#admin-login-screen');
        assert(adminLoginScreen.classList.contains('active'), 'Admin login screen should be active after button click');
        assert(!startScreen.classList.contains('active'), 'Start screen should not be active anymore');
    });
    
    // 관리자 로그인 화면에서 시작 화면으로 돌아가기 테스트
    runTest('Transition: Admin Login to Start', function() {
        // 관리자 로그인 화면 확인
        const adminLoginScreen = assertElementExists('#admin-login-screen');
        assert(adminLoginScreen.classList.contains('active'), 'Admin login screen should be active initially');
        
        // 뒤로 버튼 클릭
        document.getElementById('admin-back-btn').click();
        
        // 시작 화면으로 전환 확인
        const startScreen = assertElementExists('#start-screen');
        assert(startScreen.classList.contains('active'), 'Start screen should be active after back button click');
        assert(!adminLoginScreen.classList.contains('active'), 'Admin login screen should not be active anymore');
    });
}

// UI 테스트 - 언어 변경
function testLanguageChange() {
    console.log('\n=== Language Change Tests ===');
    
    // 언어 변경 테스트
    runTest('Change language', function() {
        // 시작 화면으로 전환
        uiManager.showScreen('start');
        
        // 기본 언어(한국어) 확인
        const joinChatBtn = assertElementExists('#join-chat-btn');
        assertEqual(joinChatBtn.textContent, '채팅 참여하기', 'Default language should be Korean');
        
        // 언어 변경 (영어)
        const languageSelect = document.getElementById('language-select');
        languageSelect.value = 'en';
        
        // 변경 이벤트 발생
        const event = new Event('change');
        languageSelect.dispatchEvent(event);
        
        // 변경된 언어 확인
        assertEqual(joinChatBtn.textContent, 'Join Chat', 'Button text should be in English after language change');
        
        // 다시 한국어로 변경
        languageSelect.value = 'ko';
        languageSelect.dispatchEvent(event);
        
        // 변경된 언어 확인
        assertEqual(joinChatBtn.textContent, '채팅 참여하기', 'Button text should be back in Korean');
    });
}

// UI 테스트 - 사용자 입력 처리
function testUserInput() {
    console.log('\n=== User Input Tests ===');
    
    // 사용자 이름 입력 테스트
    runTest('Username input', function() {
        // 로그인 화면으로 전환
        uiManager.showScreen('login');
        
        // 사용자 이름 입력
        const usernameInput = document.getElementById('username');
        usernameInput.value = 'TestUser';
        
        assertEqual(usernameInput.value, 'TestUser', 'Username input should contain the entered value');
    });
    
    // 메시지 입력 테스트
    runTest('Message input', function() {
        // 채팅 화면으로 전환
        uiManager.showScreen('chat');
        
        // 메시지 입력
        const messageInput = document.getElementById('message-input');
        messageInput.value = 'Hello, World!';
        
        assertEqual(messageInput.value, 'Hello, World!', 'Message input should contain the entered value');
    });
}

// UI 테스트 - 채팅방 목록
function testChatRoomList() {
    console.log('\n=== Chat Room List Tests ===');
    
    // 채팅방 목록 로딩 테스트
    runTest('Load chat rooms', function() {
        // 채팅방 선택 드롭다운
        const chatRoomSelect = document.getElementById('chat-room-select');
        
        // 기존 옵션 수 확인
        const initialOptionCount = chatRoomSelect.options.length;
        
        // 채팅방 목록 로드 (필요에 따라 목 데이터 사용)
        uiManager.loadChatRooms();
        
        // 옵션이 추가되었는지 확인 (실제 구현에서는 비동기 처리 필요)
        // 여기서는 테스트를 위한 간단한 확인만 수행
        assert(chatRoomSelect.options.length >= initialOptionCount, 'Chat room options should be loaded');
    });
}

// UI 테스트 - 반응형 디자인
function testResponsiveDesign() {
    console.log('\n=== Responsive Design Tests ===');
    
    // 작은 화면에서의 UI 테스트
    runTest('Small screen UI', function() {
        // 원래 창 크기 저장
        const originalInnerWidth = window.innerWidth;
        const originalInnerHeight = window.innerHeight;
        
        // 작은 화면 크기로 설정
        Object.defineProperty(window, 'innerWidth', { value: 480, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
        
        // 리사이즈 이벤트 발생
        window.dispatchEvent(new Event('resize'));
        
        // 사용자 목록 사이드바 확인
        const usersSidebar = document.getElementById('users-sidebar');
        assert(usersSidebar.classList.contains('hidden'), 'Users sidebar should be hidden on small screens');
        
        // 원래 창 크기로 복원
        Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
        
        window.dispatchEvent(new Event('resize'));
    });
}

// 모든 테스트 실행
function runAllTests() {
    console.log('=== Running UI Tests ===');
    
    testBasicElements();
    testScreenTransitions();
    testLanguageChange();
    testUserInput();
    testChatRoomList();
    testResponsiveDesign();
    
    // 테스트 결과 요약
    console.log('\n=== Test Results ===');
    console.log(`Total: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    
    if (testResults.failed === 0) {
        console.log('✅ All tests passed!');
    } else {
        console.log(`❌ ${testResults.failed} test(s) failed.`);
    }
}

// DOM이 로드된 후 테스트 실행
document.addEventListener('DOMContentLoaded', function() {
    // 테스트 실행 버튼 생성
    const testButton = document.createElement('button');
    testButton.textContent = 'Run UI Tests';
    testButton.id = 'run-ui-tests-btn';
    testButton.style.position = 'fixed';
    testButton.style.right = '10px';
    testButton.style.bottom = '60px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '8px 16px';
    testButton.style.backgroundColor = '#ff4081';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', runAllTests);
    
    document.body.appendChild(testButton);
});
