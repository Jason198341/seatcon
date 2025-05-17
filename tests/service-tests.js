/**
 * 서비스 모듈 테스트
 * dbService, realtimeService, translationService, userService, chatService, offlineService 등을
 * 테스트합니다.
 */

// dbService 테스트
describe('dbService', function() {
    this.timeout(10000); // 타임아웃 설정
    
    it('초기화 성공', async function() {
        const result = await dbService.initialize();
        expect(result).to.be.true;
        expect(dbService.initialized).to.be.true;
    });
    
    it('채팅방 목록 가져오기', async function() {
        const rooms = await dbService.getChatRooms();
        expect(rooms).to.be.an('array');
    });
    
    it('특정 채팅방 가져오기', async function() {
        // 목록에서 첫 번째 채팅방 가져오기
        const rooms = await dbService.getChatRooms();
        if (rooms.length === 0) {
            this.skip();
        }
        
        const roomId = rooms[0].id;
        const room = await dbService.getChatRoom(roomId);
        
        expect(room).to.be.an('object');
        expect(room.id).to.equal(roomId);
    });
    
    it('채팅방 접근 가능 여부 확인', async function() {
        // 목록에서 첫 번째 채팅방 가져오기
        const rooms = await dbService.getChatRooms();
        if (rooms.length === 0) {
            this.skip();
        }
        
        const roomId = rooms[0].id;
        const result = await dbService.validateRoomAccess(roomId);
        
        expect(result).to.be.an('object');
        expect(result).to.have.property('success');
    });
});

// translationService 테스트
describe('translationService', function() {
    this.timeout(10000); // 타임아웃 설정
    
    before(function() {
        // 캐시 초기화
        translationService.clearCache();
    });
    
    it('한국어 → 영어 번역', async function() {
        const text = '안녕하세요';
        const result = await translationService.translateText(text, 'en', 'ko');
        
        expect(result).to.be.an('object');
        expect(result.success).to.be.true;
        expect(result.translation).to.be.a('string');
        expect(result.translation.toLowerCase()).to.include('hello');
    });
    
    it('영어 → 한국어 번역', async function() {
        const text = 'Hello, world!';
        const result = await translationService.translateText(text, 'ko', 'en');
        
        expect(result).to.be.an('object');
        expect(result.success).to.be.true;
        expect(result.translation).to.be.a('string');
        expect(result.translation).to.include('안녕');
    });
    
    it('언어 감지', async function() {
        const text = 'こんにちは';
        const result = await translationService.translateText(text, 'en');
        
        expect(result).to.be.an('object');
        expect(result.success).to.be.true;
        expect(result.detectedLanguage).to.equal('ja');
    });
    
    it('번역 캐싱 작동', async function() {
        const text = 'テスト';
        
        // 첫 번째 번역 (캐싱)
        const result1 = await translationService.translateText(text, 'en');
        
        // 캐시 확인
        const cacheKey = `${text}|en|auto`;
        expect(translationService.cache).to.have.property(cacheKey);
        
        // 두 번째 번역 (캐시 사용)
        const result2 = await translationService.translateText(text, 'en');
        
        expect(result1.translation).to.equal(result2.translation);
    });
    
    it('빈 텍스트 처리', async function() {
        const text = '';
        const result = await translationService.translateText(text, 'en');
        
        expect(result).to.be.an('object');
        expect(result.success).to.be.false;
        expect(result.translation).to.equal('');
    });
    
    it('지원 언어 확인', function() {
        expect(translationService.isLanguageSupported('ko')).to.be.true;
        expect(translationService.isLanguageSupported('en')).to.be.true;
        expect(translationService.isLanguageSupported('ja')).to.be.true;
        expect(translationService.isLanguageSupported('zh')).to.be.true;
        expect(translationService.isLanguageSupported('fr')).to.be.false;
    });
});

// userService 테스트
describe('userService', function() {
    this.timeout(5000);
    
    before(function() {
        // 사용자 정보 초기화
        userService.clearUserFromLocalStorage();
    });
    
    after(function() {
        // 테스트 후 정리
        userService.clearUserFromLocalStorage();
    });
    
    it('초기화 성공', function() {
        const result = userService.initialize();
        expect(result).to.be.true;
    });
    
    it('사용자 정보 저장 및 불러오기', function() {
        // 사용자 정보 설정
        userService.currentUser = {
            id: 'test-user-id',
            room_id: 'test-room-id',
            username: 'TestUser',
            preferred_language: 'ko'
        };
        
        // LocalStorage에 저장
        userService.saveUserToLocalStorage();
        
        // 현재 사용자 초기화
        userService.currentUser = null;
        
        // LocalStorage에서 불러오기
        userService.loadUserFromLocalStorage();
        
        // 사용자 정보 확인
        expect(userService.currentUser).to.be.an('object');
        expect(userService.currentUser.id).to.equal('test-user-id');
        expect(userService.currentUser.username).to.equal('TestUser');
    });
    
    it('사용자 로그인 상태 확인', function() {
        // 사용자 정보 설정
        userService.currentUser = {
            id: 'test-user-id',
            room_id: 'test-room-id',
            username: 'TestUser',
            preferred_language: 'ko'
        };
        
        // 로그인 상태 확인
        expect(userService.isLoggedIn()).to.be.true;
        
        // 사용자 정보 초기화
        userService.currentUser = null;
        
        // 로그인 상태 확인
        expect(userService.isLoggedIn()).to.be.false;
    });
    
    it('사용자 정보 삭제', function() {
        // 사용자 정보 설정
        userService.currentUser = {
            id: 'test-user-id',
            room_id: 'test-room-id',
            username: 'TestUser',
            preferred_language: 'ko'
        };
        userService.saveUserToLocalStorage();
        
        // 사용자 정보 삭제
        userService.clearUserFromLocalStorage();
        
        // 삭제 확인
        expect(userService.currentUser).to.be.null;
        expect(localStorage.getItem('currentUser')).to.be.null;
    });
});

// offlineService 테스트
describe('offlineService', function() {
    before(function() {
        // 대기 중인 메시지 초기화
        offlineService.clearPendingMessages();
    });
    
    after(function() {
        // 테스트 후 정리
        offlineService.clearPendingMessages();
    });
    
    it('초기화 성공', function() {
        const result = offlineService.initialize();
        expect(result).to.be.true;
    });
    
    it('오프라인 메시지 저장 및 로드', function() {
        // 메시지 저장
        const message = {
            room_id: 'test-room-id',
            user_id: 'test-user-id',
            username: 'TestUser',
            content: 'Test message',
            language: 'en'
        };
        
        offlineService.saveOfflineMessage(message);
        
        // 저장된 메시지 수 확인
        expect(offlineService.getPendingMessageCount()).to.equal(1);
        
        // 대기 중인 메시지 로드
        offlineService.loadPendingMessages();
        
        // 로드된 메시지 확인
        expect(offlineService.pendingMessages).to.be.an('array');
        expect(offlineService.pendingMessages).to.have.lengthOf(1);
        expect(offlineService.pendingMessages[0].content).to.equal('Test message');
    });
    
    it('대기 중인 메시지 삭제', function() {
        // 메시지 저장
        const message = {
            room_id: 'test-room-id',
            user_id: 'test-user-id',
            username: 'TestUser',
            content: 'Test message',
            language: 'en'
        };
        
        offlineService.saveOfflineMessage(message);
        
        // 대기 중인 메시지 수 확인
        expect(offlineService.getPendingMessageCount()).to.be.at.least(1);
        
        // 대기 중인 메시지 삭제
        offlineService.clearPendingMessages();
        
        // 삭제 확인
        expect(offlineService.pendingMessages).to.be.an('array');
        expect(offlineService.pendingMessages).to.have.lengthOf(0);
    });
    
    it('네트워크 상태 감지', function() {
        // 현재 온라인 상태 확인
        expect(offlineService.isConnected()).to.equal(navigator.onLine);
        
        // 연결 상태 변경 콜백 설정
        let connectionState = null;
        offlineService.setConnectionStatusCallback(status => {
            connectionState = status;
        });
        
        // 온라인 이벤트 시뮬레이션
        const onlineEvent = new Event('online');
        window.dispatchEvent(onlineEvent);
        
        // 콜백 호출 확인
        expect(connectionState).to.be.true;
        
        // 오프라인 이벤트 시뮬레이션
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);
        
        // 콜백 호출 확인
        expect(connectionState).to.be.false;
    });
});

// realtimeService 테스트
describe('realtimeService', function() {
    this.timeout(10000); // 타임아웃 설정
    
    it('초기화 성공', async function() {
        const result = await realtimeService.initialize();
        expect(result).to.be.true;
        expect(realtimeService.initialized).to.be.true;
    });
    
    it('연결 상태 콜백 설정', function() {
        let connectionState = null;
        
        // 콜백 설정
        realtimeService.setConnectionStatusCallback(status => {
            connectionState = status;
        });
        
        // 강제로 콜백 호출
        if (realtimeService.onConnectionStatusChange) {
            realtimeService.onConnectionStatusChange(true);
        }
        
        // 콜백 호출 확인
        expect(connectionState).to.be.true;
    });
    
    // 실제 구독 테스트는 실제 채팅방 ID가 필요하므로 건너뜀
    it('채팅방 구독 및 해제', function() {
        this.skip(); // 실제 환경에서는 구현
    });
});

// chatService 테스트
describe('chatService', function() {
    this.timeout(10000); // 타임아웃 설정
    
    // 실제 채팅방 설정 테스트는 실제 채팅방 ID가 필요하므로 건너뜀
    it('채팅방 설정', function() {
        this.skip(); // 실제 환경에서는 구현
    });
    
    it('메시지 번역', async function() {
        // 메시지 객체 생성
        const message = {
            id: 'test-message-id',
            content: 'Hello, world!',
            language: 'en'
        };
        
        // 번역
        const translatedMessage = await chatService.translateMessage(message, 'ko');
        
        // 번역 결과 확인
        expect(translatedMessage).to.be.an('object');
        expect(translatedMessage.translated).to.be.true;
        expect(translatedMessage.translatedContent).to.be.a('string');
    });
});
