/**
 * 채팅 애플리케이션 디버깅 도구
 * 이 스크립트는 로그인 후 백지 화면 문제를 진단하고 해결하기 위한 디버깅 도구입니다.
 * 
 * 주요 기능:
 * 1. 애플리케이션 상태 디버깅
 * 2. DOM 구조 검증
 * 3. 데이터 로드 및 변환 검증
 * 4. 단계별 오류 추적 및 로깅
 * 5. 문제 해결을 위한 임시 UI 표시
 */

// 디버그 전용 네임스페이스
const ChatDebug = {
  // 앱 상태 정보
  state: {
    initialized: false,
    currentScreen: null,
    supabaseConnected: false,
    userLoggedIn: false,
    messagesLoaded: false,
    lastError: null
  },
  
  // 디버그 설정
  config: {
    enabled: true,
    verboseMode: true,
    fixMode: true,
    showDebugUI: true
  },
  
  /**
   * 디버깅 시작
   */
  init() {
    if (!this.config.enabled) return;
    
    console.log('%c ChatDebug 초기화됨', 'background: #3f51b5; color: white; padding: 4px; border-radius: 4px;');
    
    // 상태 초기화
    this.updateState();
    
    // 이벤트 리스너 등록
    this.setupEventListeners();
    
    // 디버그 UI 초기화
    if (this.config.showDebugUI) {
      this.initDebugUI();
    }
    
    // 자동 진단 시작
    setTimeout(() => {
      this.runDiagnostics();
    }, 1000);
    
    this.state.initialized = true;
  },
  
  /**
   * 애플리케이션 상태 업데이트
   */
  updateState() {
    // 현재 화면 확인
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      if (screen.classList.contains('active')) {
        this.state.currentScreen = screen.id;
      }
    });
    
    // Supabase 연결 상태 확인
    this.state.supabaseConnected = dbService && dbService.initialized;
    
    // 사용자 로그인 상태 확인
    this.state.userLoggedIn = userService && userService.getCurrentUser() !== null;
    
    // 메시지 로드 상태 확인
    this.state.messagesLoaded = chatService && chatService.messages && chatService.messages.length > 0;
    
    this.log('앱 상태 업데이트됨:', this.state);
  },
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 화면 전환 감지
    document.addEventListener('screenChanged', (e) => {
      this.log('화면 전환 감지:', e.detail.screen);
      this.state.currentScreen = e.detail.screen;
      
      // 채팅 화면 진입 시 추가 진단
      if (e.detail.screen === 'chat-screen') {
        setTimeout(() => {
          this.diagnoseChatScreen();
        }, 500);
      }
    });
    
    // 로그인 시도 감지
    document.getElementById('login-form').addEventListener('submit', () => {
      this.log('로그인 시도 감지');
      
      // 로그인 후 진단 예약
      setTimeout(() => {
        this.state.userLoggedIn = userService && userService.getCurrentUser() !== null;
        this.log('로그인 상태:', this.state.userLoggedIn);
        
        if (this.state.userLoggedIn) {
          this.diagnoseChatScreen();
        }
      }, 1000);
    });
    
    // 오류 감지
    window.addEventListener('error', (e) => {
      this.state.lastError = {
        message: e.message,
        source: e.filename,
        line: e.lineno,
        column: e.colno,
        stack: e.error ? e.error.stack : null
      };
      
      this.logError('전역 오류 감지:', this.state.lastError);
      
      // 오류 발생 시 자동 복구 시도
      if (this.config.fixMode) {
        this.attemptRecovery();
      }
    });
    
    // Promise 오류 감지
    window.addEventListener('unhandledrejection', (e) => {
      this.state.lastError = {
        message: e.reason.message,
        stack: e.reason.stack
      };
      
      this.logError('Promise 오류 감지:', this.state.lastError);
    });
  },
  
  /**
   * 디버그 UI 초기화
   */
  initDebugUI() {
    // 이미 존재하면 종료
    if (document.getElementById('chat-debug-panel')) return;
    
    // 디버그 패널 생성
    const debugPanel = document.createElement('div');
    debugPanel.id = 'chat-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 300px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      max-height: 300px;
      overflow-y: auto;
    `;
    
    // 헤더 생성
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #555;
      padding-bottom: 5px;
      margin-bottom: 5px;
    `;
    
    const title = document.createElement('span');
    title.textContent = 'Chat Debug';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
    `;
    closeBtn.addEventListener('click', () => {
      debugPanel.style.display = 'none';
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    debugPanel.appendChild(header);
    
    // 상태 표시 영역
    const stateInfo = document.createElement('div');
    stateInfo.id = 'debug-state-info';
    debugPanel.appendChild(stateInfo);
    
    // 액션 버튼 영역
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 10px;
    `;
    
    // 진단 실행 버튼
    const diagnoseBtn = document.createElement('button');
    diagnoseBtn.textContent = '진단 실행';
    diagnoseBtn.style.cssText = `
      background-color: #3f51b5;
      color: white;
      border: none;
      padding: 5px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    diagnoseBtn.addEventListener('click', () => {
      this.runDiagnostics();
    });
    
    // 복구 시도 버튼
    const recoverBtn = document.createElement('button');
    recoverBtn.textContent = '복구 시도';
    recoverBtn.style.cssText = `
      background-color: #4caf50;
      color: white;
      border: none;
      padding: 5px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    recoverBtn.addEventListener('click', () => {
      this.attemptRecovery();
    });
    
    // 로그 지우기 버튼
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '로그 지우기';
    clearBtn.style.cssText = `
      background-color: #f44336;
      color: white;
      border: none;
      padding: 5px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    clearBtn.addEventListener('click', () => {
      const logArea = document.getElementById('debug-log-area');
      if (logArea) logArea.innerHTML = '';
    });
    
    actions.appendChild(diagnoseBtn);
    actions.appendChild(recoverBtn);
    actions.appendChild(clearBtn);
    debugPanel.appendChild(actions);
    
    // 로그 영역
    const logArea = document.createElement('div');
    logArea.id = 'debug-log-area';
    logArea.style.cssText = `
      margin-top: 10px;
      border-top: 1px solid #555;
      padding-top: 5px;
      font-size: 11px;
      max-height: 150px;
      overflow-y: auto;
    `;
    debugPanel.appendChild(logArea);
    
    // 문서에 추가
    document.body.appendChild(debugPanel);
    
    // 상태 업데이트 시작
    this.updateDebugUI();
    setInterval(() => {
      this.updateState();
      this.updateDebugUI();
    }, 2000);
  },
  
  /**
   * 디버그 UI 업데이트
   */
  updateDebugUI() {
    const stateInfo = document.getElementById('debug-state-info');
    if (!stateInfo) return;
    
    const stateHtml = `
      <div>화면: <span style="color: ${this.state.currentScreen ? '#4caf50' : '#f44336'}">
        ${this.state.currentScreen || 'N/A'}</span></div>
      <div>Supabase: <span style="color: ${this.state.supabaseConnected ? '#4caf50' : '#f44336'}">
        ${this.state.supabaseConnected ? '연결됨' : '연결 안됨'}</span></div>
      <div>로그인: <span style="color: ${this.state.userLoggedIn ? '#4caf50' : '#f44336'}">
        ${this.state.userLoggedIn ? '로그인됨' : '로그인 안됨'}</span></div>
      <div>메시지: <span style="color: ${this.state.messagesLoaded ? '#4caf50' : '#f44336'}">
        ${this.state.messagesLoaded ? '로드됨' : '로드 안됨'}</span></div>
    `;
    
    stateInfo.innerHTML = stateHtml;
  },
  
  /**
   * 디버그 로그 추가
   */
  addLogToUI(type, message, data) {
    const logArea = document.getElementById('debug-log-area');
    if (!logArea) return;
    
    const logEntry = document.createElement('div');
    logEntry.style.marginBottom = '5px';
    
    const timestamp = new Date().toLocaleTimeString();
    const typeColor = type === 'error' ? '#f44336' : type === 'warn' ? '#ff9800' : '#4caf50';
    
    logEntry.innerHTML = `
      <span style="color: #888">[${timestamp}]</span>
      <span style="color: ${typeColor}">[${type}]</span>
      <span>${message}</span>
    `;
    
    // 데이터가 있으면 토글 가능한 영역으로 추가
    if (data) {
      const dataToggle = document.createElement('div');
      dataToggle.style.color = '#03a9f4';
      dataToggle.style.cursor = 'pointer';
      dataToggle.style.marginLeft = '15px';
      dataToggle.textContent = '+ 상세 정보 보기';
      
      const dataContent = document.createElement('pre');
      dataContent.style.marginLeft = '15px';
      dataContent.style.display = 'none';
      dataContent.style.color = '#ddd';
      dataContent.style.fontSize = '10px';
      dataContent.style.overflow = 'auto';
      dataContent.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      
      dataToggle.addEventListener('click', () => {
        const isVisible = dataContent.style.display !== 'none';
        dataContent.style.display = isVisible ? 'none' : 'block';
        dataToggle.textContent = isVisible ? '+ 상세 정보 보기' : '- 상세 정보 숨기기';
      });
      
      logEntry.appendChild(dataToggle);
      logEntry.appendChild(dataContent);
    }
    
    logArea.appendChild(logEntry);
    logArea.scrollTop = logArea.scrollHeight;
  },
  
  /**
   * 일반 로그 출력
   */
  log(message, data) {
    if (!this.config.enabled) return;
    
    console.log(`%c [ChatDebug] ${message}`, 'color: #4caf50', data);
    
    if (this.config.showDebugUI) {
      this.addLogToUI('info', message, data);
    }
  },
  
  /**
   * 경고 로그 출력
   */
  warn(message, data) {
    if (!this.config.enabled) return;
    
    console.warn(`%c [ChatDebug] ${message}`, 'color: #ff9800', data);
    
    if (this.config.showDebugUI) {
      this.addLogToUI('warn', message, data);
    }
  },
  
  /**
   * 오류 로그 출력
   */
  logError(message, data) {
    if (!this.config.enabled) return;
    
    console.error(`%c [ChatDebug] ${message}`, 'color: #f44336', data);
    
    if (this.config.showDebugUI) {
      this.addLogToUI('error', message, data);
    }
  },
  
  /**
   * 전체 진단 실행
   */
  runDiagnostics() {
    this.log('전체 진단 시작');
    
    // 상태 업데이트
    this.updateState();
    
    // 1. DOM 진단
    this.diagnoseDOMStructure();
    
    // 2. 서비스 진단
    this.diagnoseServices();
    
    // 3. 현재 화면 진단
    if (this.state.currentScreen === 'chat-screen') {
      this.diagnoseChatScreen();
    }
    
    this.log('전체 진단 완료');
  },
  
  /**
   * DOM 구조 진단
   */
  diagnoseDOMStructure() {
    this.log('DOM 구조 진단 시작');
    
    // 주요 컨테이너 확인
    const appContainer = document.querySelector('.app-container');
    const screens = document.querySelectorAll('.screen');
    const chatScreen = document.getElementById('chat-screen');
    const messagesContainer = document.getElementById('messages-container');
    
    if (!appContainer) {
      this.logError('앱 컨테이너 요소 누락');
    }
    
    if (screens.length === 0) {
      this.logError('화면 요소 누락');
    }
    
    if (!chatScreen) {
      this.logError('채팅 화면 요소 누락');
    } else {
      this.log('채팅 화면 구조 확인', {
        display: window.getComputedStyle(chatScreen).display,
        visibility: window.getComputedStyle(chatScreen).visibility,
        opacity: window.getComputedStyle(chatScreen).opacity,
        height: window.getComputedStyle(chatScreen).height
      });
    }
    
    if (!messagesContainer) {
      this.logError('메시지 컨테이너 요소 누락');
    } else {
      this.log('메시지 컨테이너 구조 확인', {
        childCount: messagesContainer.childNodes.length,
        height: window.getComputedStyle(messagesContainer).height,
        display: window.getComputedStyle(messagesContainer).display,
        overflow: window.getComputedStyle(messagesContainer).overflow
      });
    }
    
    // 액티브 화면 확인
    let activeScreenCount = 0;
    let activeScreenId = null;
    
    screens.forEach(screen => {
      if (screen.classList.contains('active')) {
        activeScreenCount++;
        activeScreenId = screen.id;
      }
    });
    
    if (activeScreenCount === 0) {
      this.logError('활성화된 화면 없음');
    } else if (activeScreenCount > 1) {
      this.logError('여러 개의 화면이 동시에 활성화됨', activeScreenCount);
    } else {
      this.log('활성화된 화면', activeScreenId);
    }
    
    this.log('DOM 구조 진단 완료');
  },
  
  /**
   * 서비스 모듈 진단
   */
  diagnoseServices() {
    this.log('서비스 모듈 진단 시작');
    
    // 1. DB 서비스 진단
    if (typeof dbService === 'undefined') {
      this.logError('DB 서비스 모듈 누락');
    } else {
      this.log('DB 서비스 상태', {
        initialized: dbService.initialized,
        supabase: dbService.supabase ? '존재' : '누락'
      });
      
      // Supabase 테이블 확인 시도
      if (dbService.initialized && dbService.supabase) {
        this.testSupabaseConnection();
      }
    }
    
    // 2. 채팅 서비스 진단
    if (typeof chatService === 'undefined') {
      this.logError('채팅 서비스 모듈 누락');
    } else {
      this.log('채팅 서비스 상태', {
        currentRoomId: chatService.currentRoomId,
        messagesCount: chatService.messages ? chatService.messages.length : 0,
        callbackSet: !!chatService.onNewMessage
      });
    }
    
    // 3. 사용자 서비스 진단
    if (typeof userService === 'undefined') {
      this.logError('사용자 서비스 모듈 누락');
    } else {
      const currentUser = userService.getCurrentUser();
      this.log('사용자 서비스 상태', {
        currentUser: currentUser ? {
          id: currentUser.id,
          username: currentUser.username,
          room_id: currentUser.room_id
        } : null
      });
    }
    
    // 4. UI 관리자 진단
    if (typeof uiManager === 'undefined') {
      this.logError('UI 관리자 모듈 누락');
    } else {
      this.log('UI 관리자 상태', {
        activeScreen: uiManager.activeScreen,
        replyTo: uiManager.replyTo ? '존재' : null
      });
    }
    
    this.log('서비스 모듈 진단 완료');
  },
  
  /**
   * Supabase 연결 테스트
   */
  async testSupabaseConnection() {
    try {
      this.log('Supabase 연결 테스트 시작');
      
      const { data, error, status } = await dbService.supabase
        .from('chatrooms')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        this.logError('Supabase 연결 테스트 실패', error);
      } else {
        this.log('Supabase 연결 테스트 성공', { count: data, status });
      }
    } catch (err) {
      this.logError('Supabase 연결 테스트 중 예외 발생', err);
    }
  },
  
  /**
   * 채팅 화면 진단
   */
  diagnoseChatScreen() {
    if (this.state.currentScreen !== 'chat-screen') {
      this.warn('채팅 화면이 활성화되지 않았습니다');
      return;
    }
    
    this.log('채팅 화면 진단 시작');
    
    const chatScreen = document.getElementById('chat-screen');
    const messagesContainer = document.getElementById('messages-container');
    
    // 채팅 화면 표시 상태 확인
    if (chatScreen) {
      const style = window.getComputedStyle(chatScreen);
      
      if (style.display === 'none') {
        this.logError('채팅 화면이 display: none 상태입니다');
      }
      
      if (style.visibility === 'hidden') {
        this.logError('채팅 화면이 visibility: hidden 상태입니다');
      }
      
      if (style.opacity === '0') {
        this.logError('채팅 화면이 opacity: 0 상태입니다');
      }
      
      if (style.height === '0px') {
        this.logError('채팅 화면의 높이가 0px입니다');
      }
    }
    
    // 메시지 컨테이너 확인
    if (messagesContainer) {
      this.log('메시지 컨테이너 상태', {
        childCount: messagesContainer.childNodes.length,
        innerHTML: messagesContainer.childNodes.length > 0 ? '내용 있음' : '비어 있음',
        height: window.getComputedStyle(messagesContainer).height
      });
      
      // 자식 노드가 없으면 메시지 렌더링 문제
      if (messagesContainer.childNodes.length === 0) {
        this.logError('메시지 컨테이너가 비어 있습니다');
        
        // 메시지 로드 시도
        this.testMessageLoading();
      } else {
        this.log('메시지 컨테이너 내용', {
          firstChild: messagesContainer.firstChild.nodeName,
          childCount: messagesContainer.childNodes.length
        });
      }
    }
    
    this.log('채팅 화면 진단 완료');
  },
  
  /**
   * 메시지 로드 테스트
   */
  async testMessageLoading() {
    if (!chatService || !chatService.getRecentMessages) {
      this.logError('메시지 로드 테스트 실패: chatService.getRecentMessages 함수가 없습니다');
      return;
    }
    
    try {
      this.log('메시지 로드 테스트 시작');
      
      const messages = await chatService.getRecentMessages();
      
      this.log('메시지 로드 결과', {
        count: messages ? messages.length : 0,
        sample: messages && messages.length > 0 ? messages[0] : null
      });
      
      if (messages && messages.length > 0) {
        // 메시지는 있지만 표시되지 않음 -> 렌더링 문제
        this.warn('메시지는 로드되었지만 화면에 표시되지 않습니다. 렌더링 문제일 수 있습니다.');
        
        if (this.config.fixMode) {
          this.fixMessageRendering(messages);
        }
      } else {
        // 메시지 로드 실패 -> 데이터 로드 문제
        this.logError('메시지 로드에 실패했습니다. 데이터 연결 문제일 수 있습니다.');
      }
    } catch (err) {
      this.logError('메시지 로드 테스트 중 예외 발생', err);
    }
  },
  
  /**
   * 메시지 렌더링 수정
   */
  fixMessageRendering(messages) {
    if (!messages || !messages.length) return;
    
    this.log('메시지 렌더링 수정 시도');
    
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;
    
    try {
      // 백업 렌더링 방법 사용
      messagesContainer.innerHTML = '';
      
      // 시스템 메시지 추가
      const systemMessage = document.createElement('div');
      systemMessage.className = 'message system-message';
      systemMessage.innerHTML = '<p>채팅에 오신 것을 환영합니다. (수정됨)</p>';
      messagesContainer.appendChild(systemMessage);
      
      // 각 메시지 렌더링
      messages.forEach(message => {
        const messageElem = this.createBackupMessageElement(message);
        messagesContainer.appendChild(messageElem);
      });
      
      this.log('메시지 렌더링 수정 완료');
    } catch (err) {
      this.logError('메시지 렌더링 수정 중 오류 발생', err);
    }
  },
  
  /**
   * 백업 메시지 요소 생성
   */
  createBackupMessageElement(message) {
    // 기본 컨테이너
    const elem = document.createElement('div');
    elem.className = 'message';
    if (message.is_announcement) elem.classList.add('announcement');
    elem.dataset.id = message.id;
    
    // 메시지 헤더
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const username = document.createElement('span');
    username.className = 'username';
    username.textContent = message.username;
    
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = this.formatTime(message.created_at);
    
    header.appendChild(username);
    header.appendChild(time);
    elem.appendChild(header);
    
    // 메시지 내용
    const content = document.createElement('p');
    content.className = 'message-content';
    content.textContent = message.content;
    elem.appendChild(content);
    
    // 번역된 내용이 있으면 표시
    if (message.translated && message.translatedContent) {
      const translatedContent = document.createElement('p');
      translatedContent.className = 'translated-content';
      translatedContent.textContent = message.translatedContent;
      elem.appendChild(translatedContent);
    }
    
    return elem;
  },
  
  /**
   * 시간 형식화
   */
  formatTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  },
  
  /**
   * 복구 시도
   */
  attemptRecovery() {
    this.log('복구 시도 시작');
    
    // 메시지 컨테이너 확인 및 복구
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer && messagesContainer.childNodes.length === 0) {
      // 기본 메시지 추가
      const defaultMessage = document.createElement('div');
      defaultMessage.className = 'message system-message';
      defaultMessage.innerHTML = '<p>채팅 메시지를 불러오는 중입니다...</p>';
      messagesContainer.appendChild(defaultMessage);
      
      // 메시지 새로고침 시도
      if (uiManager && uiManager.refreshMessages) {
        setTimeout(() => {
          this.log('메시지 새로고침 시도');
          uiManager.refreshMessages().catch(err => {
            this.logError('메시지 새로고침 실패', err);
          });
        }, 500);
      }
    }
    
    // 채팅 화면이 보이지 않는 경우 수정
    const chatScreen = document.getElementById('chat-screen');
    if (chatScreen && !chatScreen.classList.contains('active') && userService.isLoggedIn()) {
      this.log('채팅 화면이 활성화되지 않았습니다. 활성화 시도');
      
      // 다른 모든 화면 비활성화
      document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
      });
      
      // 채팅 화면 활성화
      chatScreen.classList.add('active');
      chatScreen.style.display = 'flex';
      
      // 앱 상태 업데이트
      if (uiManager) {
        uiManager.activeScreen = 'chat';
      }
    }
    
    // Supabase 연결 재시도
    if (!dbService.initialized) {
      this.log('Supabase 연결 재시도');
      dbService.initialize().then(success => {
        this.log('Supabase 재연결 결과:', success);
      }).catch(err => {
        this.logError('Supabase 재연결 실패', err);
      });
    }
    
    this.log('복구 시도 완료');
  }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  ChatDebug.init();
});

// window.onload에서 한 번 더 초기화 (지연 로드 대응)
window.addEventListener('load', () => {
  if (!ChatDebug.state.initialized) {
    ChatDebug.init();
  }
});

// 전역 객체로 노출
window.ChatDebug = ChatDebug;

console.log('%c 채팅 디버그 도구 로드됨 ', 'background: #3f51b5; color: white; padding: 8px; font-size: 14px; border-radius: 4px;');
