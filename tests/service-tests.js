/**
 * 서비스 모듈 테스트
 * 기본적인 서비스 모듈 기능 테스트를 수행합니다.
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

// 모의 객체 생성 함수
function createMockSupabase() {
    return {
        from: function(table) {
            return {
                select: function() { return this; },
                insert: function() { return this; },
                update: function() { return this; },
                delete: function() { return this; },
                eq: function() { return this; },
                single: function() { return this; },
                order: function() { return this; },
                limit: function() { return this; },
                then: function(callback) {
                    callback({ data: [], error: null });
                    return this;
                }
            };
        },
        channel: function() {
            return {
                on: function() { return this; },
                subscribe: function() { return this; }
            };
        },
        removeChannel: function() {}
    };
}

// 데이터베이스 서비스 테스트
function testDBService() {
    console.log('\n=== DBService Tests ===');
    
    // 초기화 테스트
    runTest('DBService.initialize', function() {
        const originalSupabase = window.supabase;
        
        // 모의 supabase 객체 설정
        window.supabase = {
            createClient: function() {
                return createMockSupabase();
            }
        };
        
        assert(dbService !== undefined, 'dbService should be defined');
        assert(typeof dbService.initialize === 'function', 'initialize method should exist');
        
        // 원래 객체 복원
        window.supabase = originalSupabase;
    });
    
    // 채팅방 가져오기 테스트
    runTest('DBService.getChatRooms', function() {
        assert(typeof dbService.getChatRooms === 'function', 'getChatRooms method should exist');
    });
    
    // 사용자 추가 테스트
    runTest('DBService.addUserToRoom', function() {
        assert(typeof dbService.addUserToRoom === 'function', 'addUserToRoom method should exist');
    });
    
    // 메시지 전송 테스트
    runTest('DBService.sendMessage', function() {
        assert(typeof dbService.sendMessage === 'function', 'sendMessage method should exist');
    });
}

// 번역 서비스 테스트
function testTranslationService() {
    console.log('\n=== TranslationService Tests ===');
    
    // 번역 테스트
    runTest('TranslationService.translateText', function() {
        assert(translationService !== undefined, 'translationService should be defined');
        assert(typeof translationService.translateText === 'function', 'translateText method should exist');
    });
    
    // 언어 감지 테스트
    runTest('TranslationService.detectLanguage', function() {
        assert(typeof translationService.detectLanguage === 'function', 'detectLanguage method should exist');
    });
    
    // 언어 지원 확인 테스트
    runTest('TranslationService.isLanguageSupported', function() {
        assert(typeof translationService.isLanguageSupported === 'function', 'isLanguageSupported method should exist');
        assert(translationService.isLanguageSupported('ko'), 'Korean should be supported');
        assert(translationService.isLanguageSupported('en'), 'English should be supported');
        assert(translationService.isLanguageSupported('ja'), 'Japanese should be supported');
        assert(translationService.isLanguageSupported('zh'), 'Chinese should be supported');
        assert(!translationService.isLanguageSupported('fr'), 'French should not be supported');
    });
    
    // 캐시 관리 테스트
    runTest('TranslationService.cache management', function() {
        assert(typeof translationService.saveCache === 'function', 'saveCache method should exist');
        assert(typeof translationService.loadCache === 'function', 'loadCache method should exist');
        assert(typeof translationService.clearCache === 'function', 'clearCache method should exist');
    });
}

// 사용자 서비스 테스트
function testUserService() {
    console.log('\n=== UserService Tests ===');
    
    // 사용자 생성 테스트
    runTest('UserService.createUser', function() {
        assert(userService !== undefined, 'userService should be defined');
        assert(typeof userService.createUser === 'function', 'createUser method should exist');
    });
    
    // 현재 사용자 관리 테스트
    runTest('UserService.getCurrentUser', function() {
        assert(typeof userService.getCurrentUser === 'function', 'getCurrentUser method should exist');
        assert(typeof userService.setCurrentUser === 'function', 'setCurrentUser method should exist');
    });
    
    // 사용자 목록 관리 테스트
    runTest('UserService.getUserList', function() {
        assert(typeof userService.getUserList === 'function', 'getUserList method should exist');
        assert(typeof userService.refreshUserList === 'function', 'refreshUserList method should exist');
    });
}

// 채팅 서비스 테스트
function testChatService() {
    console.log('\n=== ChatService Tests ===');
    
    // 채팅방 설정 테스트
    runTest('ChatService.setRoom', function() {
        assert(chatService !== undefined, 'chatService should be defined');
        assert(typeof chatService.setRoom === 'function', 'setRoom method should exist');
    });
    
    // 메시지 전송 테스트
    runTest('ChatService.sendMessage', function() {
        assert(typeof chatService.sendMessage === 'function', 'sendMessage method should exist');
    });
    
    // 메시지 번역 테스트
    runTest('ChatService.translateMessage', function() {
        assert(typeof chatService.translateMessage === 'function', 'translateMessage method should exist');
    });
    
    // 메시지 관리 테스트
    runTest('ChatService.getMessages', function() {
        assert(typeof chatService.getMessages === 'function', 'getMessages method should exist');
        assert(typeof chatService.loadRecentMessages === 'function', 'loadRecentMessages method should exist');
    });
}

// 오프라인 서비스 테스트
function testOfflineService() {
    console.log('\n=== OfflineService Tests ===');
    
    // 초기화 테스트
    runTest('OfflineService.initialize', function() {
        assert(offlineService !== undefined, 'offlineService should be defined');
        assert(typeof offlineService.initialize === 'function', 'initialize method should exist');
    });
    
    // 연결 상태 테스트
    runTest('OfflineService.isConnected', function() {
        assert(typeof offlineService.isConnected === 'function', 'isConnected method should exist');
        assert(typeof offlineService.setConnectionStatusCallback === 'function', 'setConnectionStatusCallback method should exist');
    });
    
    // 오프라인 메시지 관리 테스트
    runTest('OfflineService.saveOfflineMessage', function() {
        assert(typeof offlineService.saveOfflineMessage === 'function', 'saveOfflineMessage method should exist');
        assert(typeof offlineService.syncOfflineMessages === 'function', 'syncOfflineMessages method should exist');
        assert(typeof offlineService.getPendingMessages === 'function', 'getPendingMessages method should exist');
    });
}

// 다국어 처리 모듈 테스트
function testI18nService() {
    console.log('\n=== I18nService Tests ===');
    
    // 초기화 테스트
    runTest('I18nService.initialize', function() {
        assert(i18nService !== undefined, 'i18nService should be defined');
        assert(typeof i18nService.initialize === 'function', 'initialize method should exist');
    });
    
    // 언어 설정 테스트
    runTest('I18nService.setLanguage', function() {
        assert(typeof i18nService.setLanguage === 'function', 'setLanguage method should exist');
        assert(typeof i18nService.getCurrentLanguage === 'function', 'getCurrentLanguage method should exist');
    });
    
    // 번역 테스트
    runTest('I18nService.translate', function() {
        assert(typeof i18nService.translate === 'function', 'translate method should exist');
        assert(typeof i18nService.translateInterface === 'function', 'translateInterface method should exist');
    });
}

// 모든 테스트 실행
function runAllTests() {
    console.log('=== Running Tests ===');
    
    testDBService();
    testTranslationService();
    testUserService();
    testChatService();
    testOfflineService();
    testI18nService();
    
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
    testButton.textContent = 'Run Tests';
    testButton.id = 'run-tests-btn';
    testButton.style.position = 'fixed';
    testButton.style.right = '10px';
    testButton.style.bottom = '10px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '8px 16px';
    testButton.style.backgroundColor = '#3f51b5';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', runAllTests);
    
    document.body.appendChild(testButton);
});
