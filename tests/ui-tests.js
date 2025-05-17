/**
 * UI 테스트
 * 사용자 인터페이스 컴포넌트 및 상호작용을 테스트합니다.
 */

// DOM 헬퍼 함수
function createTestElement(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
}

function removeTestElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

// app-i18n 테스트
describe('i18nService', function() {
    let originalTranslations;
    
    before(function() {
        // 원본 번역 저장
        originalTranslations = {...i18nService.translations};
        
        // 테스트용 번역 설정
        i18nService.translations = {
            'ko': {
                'test-key': '테스트',
                'welcome': '환영합니다',
                'hello': '안녕하세요, {name}님'
            },
            'en': {
                'test-key': 'Test',
                'welcome': 'Welcome',
                'hello': 'Hello, {name}'
            }
        };
    });
    
    after(function() {
        // 원본 번역 복원
        i18nService.translations = originalTranslations;
    });
    
    it('언어 변경', function() {
        // 초기 언어 설정
        i18nService.setLanguage('ko');
        expect(i18nService.getCurrentLanguage()).to.equal('ko');
        
        // 언어 변경
        i18nService.setLanguage('en');
        expect(i18nService.getCurrentLanguage()).to.equal('en');
    });
    
    it('번역 가져오기', function() {
        // 한국어 설정
        i18nService.setLanguage('ko');
        
        // 번역 확인
        expect(i18nService.translate('test-key')).to.equal('테스트');
        expect(i18nService.translate('welcome')).to.equal('환영합니다');
        
        // 영어로 변경
        i18nService.setLanguage('en');
        
        // 번역 확인
        expect(i18nService.translate('test-key')).to.equal('Test');
        expect(i18nService.translate('welcome')).to.equal('Welcome');
    });
    
    it('없는 키 처리', function() {
        // 없는 키는 키 자체를 반환
        expect(i18nService.translate('non-existent-key')).to.equal('non-existent-key');
    });
    
    it('지원 언어 확인', function() {
        expect(i18nService.isLanguageSupported('ko')).to.be.true;
        expect(i18nService.isLanguageSupported('en')).to.be.true;
        expect(i18nService.isLanguageSupported('fr')).to.be.false;
    });
    
    it('인터페이스 번역', function() {
        // 테스트 요소 생성
        const container = createTestElement(`
            <div>
                <span data-i18n="test-key">기본값</span>
                <span data-i18n="welcome">기본값</span>
                <input data-i18n-placeholder="test-key" placeholder="기본값">
            </div>
        `);
        
        // 한국어 설정
        i18nService.setLanguage('ko');
        i18nService.translateInterface();
        
        // 번역 확인
        expect(container.querySelector('[data-i18n="test-key"]').textContent).to.equal('테스트');
        expect(container.querySelector('[data-i18n="welcome"]').textContent).to.equal('환영합니다');
        expect(container.querySelector('[data-i18n-placeholder="test-key"]').placeholder).to.equal('테스트');
        
        // 영어로 변경
        i18nService.setLanguage('en');
        i18nService.translateInterface();
        
        // 번역 확인
        expect(container.querySelector('[data-i18n="test-key"]').textContent).to.equal('Test');
        expect(container.querySelector('[data-i18n="welcome"]').textContent).to.equal('Welcome');
        expect(container.querySelector('[data-i18n-placeholder="test-key"]').placeholder).to.equal('Test');
        
        // 정리
        removeTestElement(container);
    });
});

// UIManager 테스트 (모의 객체 사용)
describe('UI 컴포넌트', function() {
    describe('메시지 컴포넌트', function() {
        it('일반 메시지 렌더링', function() {
            // 메시지 컴포넌트 생성 함수 모의 구현
            const createMessageElement = function(message) {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.dataset.id = message.id;
                
                // 메시지 헤더
                const header = document.createElement('div');
                header.className = 'message-header';
                
                // 사용자 이름
                const username = document.createElement('span');
                username.className = 'username';
                username.textContent = message.username;
                header.appendChild(username);
                
                // 메시지 내용
                const content = document.createElement('p');
                content.className = 'message-content';
                content.textContent = message.content;
                
                messageElement.appendChild(header);
                messageElement.appendChild(content);
                
                return messageElement;
            };
            
            // 테스트 메시지
            const message = {
                id: 'test-message-id',
                username: 'TestUser',
                content: 'Hello, world!',
                created_at: new Date().toISOString()
            };
            
            // 메시지 렌더링
            const messageElement = createMessageElement(message);
            
            // 메시지 요소 확인
            expect(messageElement).to.be.an.instanceOf(HTMLElement);
            expect(messageElement.className).to.include('message');
            expect(messageElement.dataset.id).to.equal(message.id);
            expect(messageElement.querySelector('.username').textContent).to.equal(message.username);
            expect(messageElement.querySelector('.message-content').textContent).to.equal(message.content);
        });
        
        it('번역된 메시지 렌더링', function() {
            // 메시지 컴포넌트 생성 함수 모의 구현
            const createMessageElement = function(message) {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                messageElement.dataset.id = message.id;
                
                // 메시지 헤더
                const header = document.createElement('div');
                header.className = 'message-header';
                
                // 사용자 이름
                const username = document.createElement('span');
                username.className = 'username';
                username.textContent = message.username;
                header.appendChild(username);
                
                // 메시지 내용
                const content = document.createElement('p');
                content.className = 'message-content';
                content.textContent = message.content;
                
                messageElement.appendChild(header);
                messageElement.appendChild(content);
                
                // 번역된 메시지가 있으면 표시
                if (message.translated && message.translatedContent) {
                    const translatedContent = document.createElement('p');
                    translatedContent.className = 'translated-content';
                    translatedContent.textContent = message.translatedContent;
                    messageElement.appendChild(translatedContent);
                }
                
                return messageElement;
            };
            
            // 테스트 메시지
            const message = {
                id: 'test-message-id',
                username: 'TestUser',
                content: 'Hello, world!',
                created_at: new Date().toISOString(),
                translated: true,
                translatedContent: '안녕하세요, 세계!'
            };
            
            // 메시지 렌더링
            const messageElement = createMessageElement(message);
            
            // 메시지 요소 확인
            expect(messageElement).to.be.an.instanceOf(HTMLElement);
            expect(messageElement.className).to.include('message');
            expect(messageElement.dataset.id).to.equal(message.id);
            expect(messageElement.querySelector('.username').textContent).to.equal(message.username);
            expect(messageElement.querySelector('.message-content').textContent).to.equal(message.content);
            expect(messageElement.querySelector('.translated-content').textContent).to.equal(message.translatedContent);
        });
    });
    
    describe('사용자 목록 컴포넌트', function() {
        it('사용자 목록 렌더링', function() {
            // 테스트 컨테이너 생성
            const container = createTestElement(`
                <div>
                    <ul id="users-list"></ul>
                </div>
            `);
            
            // 테스트 사용자 목록
            const users = [
                {
                    id: 'user1',
                    username: 'User 1',
                    preferred_language: 'ko'
                },
                {
                    id: 'user2',
                    username: 'User 2',
                    preferred_language: 'en'
                }
            ];
            
            // 사용자 목록 렌더링 함수 모의 구현
            const renderUsersList = function(users) {
                const usersList = document.getElementById('users-list');
                usersList.innerHTML = '';
                
                users.forEach(user => {
                    const userItem = document.createElement('li');
                    userItem.dataset.id = user.id;
                    
                    const usernameSpan = document.createElement('span');
                    usernameSpan.className = 'user-name';
                    usernameSpan.textContent = user.username;
                    
                    const languageSpan = document.createElement('span');
                    languageSpan.className = 'user-language';
                    
                    // 언어 이름 매핑
                    const languages = {
                        'ko': '한국어',
                        'en': '영어',
                        'ja': '일본어',
                        'zh': '중국어'
                    };
                    
                    languageSpan.textContent = languages[user.preferred_language] || user.preferred_language;
                    
                    userItem.appendChild(usernameSpan);
                    userItem.appendChild(languageSpan);
                    
                    usersList.appendChild(userItem);
                });
            };
            
            // 사용자 목록 렌더링
            renderUsersList(users);
            
            // 렌더링 결과 확인
            const userItems = container.querySelectorAll('#users-list li');
            expect(userItems).to.have.lengthOf(2);
            expect(userItems[0].dataset.id).to.equal('user1');
            expect(userItems[0].querySelector('.user-name').textContent).to.equal('User 1');
            expect(userItems[0].querySelector('.user-language').textContent).to.equal('한국어');
            expect(userItems[1].dataset.id).to.equal('user2');
            expect(userItems[1].querySelector('.user-name').textContent).to.equal('User 2');
            expect(userItems[1].querySelector('.user-language').textContent).to.equal('영어');
            
            // 정리
            removeTestElement(container);
        });
    });
    
    describe('채팅방 목록 컴포넌트', function() {
        it('채팅방 목록 렌더링', function() {
            // 테스트 컨테이너 생성
            const container = createTestElement(`
                <div>
                    <select id="chat-room-select"></select>
                </div>
            `);
            
            // 테스트 채팅방 목록
            const rooms = [
                {
                    id: 'room1',
                    name: 'Room 1',
                    type: 'public'
                },
                {
                    id: 'room2',
                    name: 'Room 2',
                    type: 'private'
                }
            ];
            
            // 채팅방 목록 렌더링 함수 모의 구현
            const renderRoomsList = function(rooms) {
                const select = document.getElementById('chat-room-select');
                select.innerHTML = '';
                
                rooms.forEach(room => {
                    const option = document.createElement('option');
                    option.value = room.id;
                    option.dataset.type = room.type;
                    option.textContent = room.name;
                    select.appendChild(option);
                });
            };
            
            // 채팅방 목록 렌더링
            renderRoomsList(rooms);
            
            // 렌더링 결과 확인
            const options = container.querySelectorAll('#chat-room-select option');
            expect(options).to.have.lengthOf(2);
            expect(options[0].value).to.equal('room1');
            expect(options[0].dataset.type).to.equal('public');
            expect(options[0].textContent).to.equal('Room 1');
            expect(options[1].value).to.equal('room2');
            expect(options[1].dataset.type).to.equal('private');
            expect(options[1].textContent).to.equal('Room 2');
            
            // 정리
            removeTestElement(container);
        });
    });
    
    describe('입력 필드와 버튼', function() {
        it('메시지 입력 및 전송', function() {
            // 테스트 컨테이너 생성
            const container = createTestElement(`
                <div class="message-input-container">
                    <textarea id="message-input"></textarea>
                    <button id="send-message-btn"></button>
                </div>
            `);
            
            // 메시지 전송 함수 모의 구현
            let sentMessage = null;
            const sendMessage = function() {
                const input = document.getElementById('message-input');
                const message = input.value.trim();
                
                if (message) {
                    sentMessage = message;
                    input.value = '';
                }
            };
            
            // 이벤트 리스너 설정
            document.getElementById('send-message-btn').addEventListener('click', sendMessage);
            
            // 메시지 입력
            const input = document.getElementById('message-input');
            input.value = 'Test message';
            
            // 전송 버튼 클릭
            document.getElementById('send-message-btn').click();
            
            // 전송 결과 확인
            expect(sentMessage).to.equal('Test message');
            expect(input.value).to.equal('');
            
            // 정리
            removeTestElement(container);
        });
        
        it('엔터 키로 메시지 전송', function() {
            // 테스트 컨테이너 생성
            const container = createTestElement(`
                <div class="message-input-container">
                    <textarea id="message-input"></textarea>
                </div>
            `);
            
            // 메시지 전송 함수 모의 구현
            let sentMessage = null;
            const sendMessage = function() {
                const input = document.getElementById('message-input');
                const message = input.value.trim();
                
                if (message) {
                    sentMessage = message;
                    input.value = '';
                }
            };
            
            // 이벤트 리스너 설정
            document.getElementById('message-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // 메시지 입력
            const input = document.getElementById('message-input');
            input.value = 'Test message';
            
            // 엔터 키 이벤트 시뮬레이션
            const enterEvent = new KeyboardEvent('keypress', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true,
                cancelable: true
            });
            
            input.dispatchEvent(enterEvent);
            
            // 전송 결과 확인
            expect(sentMessage).to.equal('Test message');
            expect(input.value).to.equal('');
            
            // 정리
            removeTestElement(container);
        });
    });
});

// 화면 전환 테스트
describe('화면 전환', function() {
    // 테스트 컨테이너 생성
    let container;
    
    before(function() {
        container = createTestElement(`
            <div>
                <div id="start-screen" class="screen active">시작 화면</div>
                <div id="login-screen" class="screen">로그인 화면</div>
                <div id="chat-screen" class="screen">채팅 화면</div>
            </div>
        `);
    });
    
    after(function() {
        removeTestElement(container);
    });
    
    it('화면 전환', function() {
        // 화면 전환 함수 모의 구현
        const showScreen = function(screenId) {
            // 모든 화면 숨기기
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            // 선택한 화면 표시
            document.getElementById(`${screenId}-screen`).classList.add('active');
        };
        
        // 초기 상태 확인
        expect(container.querySelector('#start-screen').classList.contains('active')).to.be.true;
        expect(container.querySelector('#login-screen').classList.contains('active')).to.be.false;
        expect(container.querySelector('#chat-screen').classList.contains('active')).to.be.false;
        
        // 로그인 화면으로 전환
        showScreen('login');
        
        // 화면 전환 확인
        expect(container.querySelector('#start-screen').classList.contains('active')).to.be.false;
        expect(container.querySelector('#login-screen').classList.contains('active')).to.be.true;
        expect(container.querySelector('#chat-screen').classList.contains('active')).to.be.false;
        
        // 채팅 화면으로 전환
        showScreen('chat');
        
        // 화면 전환 확인
        expect(container.querySelector('#start-screen').classList.contains('active')).to.be.false;
        expect(container.querySelector('#login-screen').classList.contains('active')).to.be.false;
        expect(container.querySelector('#chat-screen').classList.contains('active')).to.be.true;
    });
});

// 날짜/시간 형식화 테스트
describe('날짜/시간 형식화', function() {
    it('오늘 날짜 형식화', function() {
        // 날짜/시간 형식화 함수 모의 구현
        const formatTime = function(dateString) {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // 오늘 날짜인지 확인
            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
            
            if (isToday) {
                // 시간만 표시
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                // 날짜와 시간 표시
                return date.toLocaleString([], { 
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        };
        
        // 오늘 날짜 생성
        const today = new Date();
        
        // 오늘 날짜 형식화
        const formattedTime = formatTime(today.toISOString());
        
        // 형식화 결과 확인 (시간 형식만 확인)
        expect(formattedTime).to.match(/\d{1,2}:\d{2}/);
    });
    
    it('과거 날짜 형식화', function() {
        // 날짜/시간 형식화 함수 모의 구현
        const formatTime = function(dateString) {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // 오늘 날짜인지 확인
            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
            
            if (isToday) {
                // 시간만 표시
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                // 날짜와 시간 표시
                return date.toLocaleString([], { 
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        };
        
        // 과거 날짜 생성 (7일 전)
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        
        // 과거 날짜 형식화
        const formattedTime = formatTime(pastDate.toISOString());
        
        // 형식화 결과 확인 (날짜와 시간 형식 확인)
        expect(formattedTime).to.match(/\d{2}\/\d{2}\/\d{2}/);
        expect(formattedTime).to.match(/\d{1,2}:\d{2}/);
    });
    
    it('잘못된 날짜 처리', function() {
        // 날짜/시간 형식화 함수 모의 구현
        const formatTime = function(dateString) {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // 나머지 로직...
            return date.toISOString();
        };
        
        // 잘못된 날짜 형식화
        const formattedTime = formatTime('invalid-date');
        
        // 형식화 결과 확인
        expect(formattedTime).to.equal('');
    });
});
