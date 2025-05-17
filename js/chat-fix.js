/**
 * 백지 화면 문제 해결 패치
 * - 로그인 후 채팅 화면이 표시되지 않는 문제 해결
 * - 필요한 모든 수정 사항을 적용
 */

/**
 * chat-fix.js - 백지 화면 문제 해결을 위한 통합 패치
 * 
 * 이 패치는 다음 문제들을 해결합니다:
 * 1. 로그인 후 채팅 화면이 표시되지 않는 문제
 * 2. 메시지가 로드되지만 UI에 표시되지 않는 문제
 * 3. Supabase 연결 문제
 * 4. CSS 및 스타일링 문제
 */

// 패치 버전
const CHAT_FIX_VERSION = '1.0.0';

// 패치 설정
const ChatFixConfig = {
  debug: true,                  // 디버그 모드 활성화
  showDebugPanel: true,         // 디버그 패널 표시
  autoPatch: true,              // 자동 패치 적용
  loadStyles: true,             // CSS 패치 로드
  patchMethods: true,           // 메서드 패치 적용
  fixSupabase: true,            // Supabase 연결 수정
  fixRendering: true            // 렌더링 수정
};

// 패치 상태
const ChatFixState = {
  initialized: false,
  loadedDependencies: [],
  appliedPatches: [],
  detectedIssues: [],
  fixesApplied: {},
  startTime: new Date(),
  lastAction: null
};

// 로그 유틸리티
const ChatFixLogger = {
  log(message, data) {
    if (!ChatFixConfig.debug) return;
    console.log(`%c [ChatFix] ${message}`, 'color: #4caf50; font-weight: bold;', data || '');
  },
  
  warn(message, data) {
    if (!ChatFixConfig.debug) return;
    console.warn(`%c [ChatFix] ${message}`, 'color: #ff9800; font-weight: bold;', data || '');
  },
  
  error(message, data) {
    if (!ChatFixConfig.debug) return;
    console.error(`%c [ChatFix] ${message}`, 'color: #f44336; font-weight: bold;', data || '');
  },
  
  info(message) {
    if (!ChatFixConfig.debug) return;
    console.info(`%c [ChatFix] ${message}`, 'color: #2196f3; font-weight: bold;');
  },
  
  success(message) {
    if (!ChatFixConfig.debug) return;
    console.log(`%c [ChatFix] ${message}`, 'color: #4caf50; font-weight: bold; font-size: 14px;');
  }
};

// 패치 유틸리티
const ChatFixUtils = {
  // 모든 화면 숨기기
  hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
  },
  
  // 특정 화면 표시
  showScreen(screenId) {
    this.hideAllScreens();
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
      
      if (screenId === 'chat-screen') {
        screen.style.display = 'flex';
      }
    }
  },
  
  // 스크립트 동적 로드
  loadScript(url, id) {
    return new Promise((resolve, reject) => {
      // 이미 로드되었는지 확인
      if (document.getElementById(id)) {
        resolve({ id, alreadyLoaded: true });
        return;
      }
      
      const script = document.createElement('script');
      script.src = url;
      script.id = id;
      
      script.onload = () => {
        ChatFixState.loadedDependencies.push(id);
        resolve({ id, success: true });
      };
      
      script.onerror = (error) => {
        reject({ id, error });
      };
      
      document.head.appendChild(script);
    });
  },
  
  // 스타일시트 동적 로드
  loadStylesheet(url, id) {
    return new Promise((resolve, reject) => {
      // 이미 로드되었는지 확인
      if (document.getElementById(id)) {
        resolve({ id, alreadyLoaded: true });
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.id = id;
      
      link.onload = () => {
        ChatFixState.loadedDependencies.push(id);
        resolve({ id, success: true });
      };
      
      link.onerror = (error) => {
        reject({ id, error });
      };
      
      document.head.appendChild(link);
    });
  },
  
  // 메시지 컨테이너 초기화
  clearMessagesContainer() {
    const container = document.getElementById('messages-container');
    if (container) {
      container.innerHTML = '';
    }
  },
  
  // 시스템 메시지 표시
  addSystemMessage(text) {
    const container = document.getElementById('messages-container');
    if (!container) return null;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system-message';
    messageElement.innerHTML = `<p>${text}</p>`;
    
    container.appendChild(messageElement);
    
    return messageElement;
  },
  
  // 컨테이너에 자식 요소가 있는지 확인
  hasChildren(selector) {
    const container = document.querySelector(selector);
    return container && container.childNodes.length > 0;
  },
  
  // 현재 활성화된 화면 ID 가져오기
  getActiveScreenId() {
    let activeScreenId = null;
    document.querySelectorAll('.screen').forEach(screen => {
      if (screen.classList.contains('active')) {
        activeScreenId = screen.id;
      }
    });
    return activeScreenId;
  },
  
  // 객체 속성 값 비교
  areEqual(obj1, obj2, props) {
    if (!obj1 || !obj2) return false;
    
    for (const prop of props) {
      if (obj1[prop] !== obj2[prop]) {
        return false;
      }
    }
    
    return true;
  }
};

// 패치 모음
const ChatFixPatches = {
  // 디버그 패널 생성
  createDebugPanel() {
    if (!ChatFixConfig.showDebugPanel) return;
    
    // 이미 존재하면 종료
    if (document.getElementById('chat-fix-panel')) return;
    
    // 디버그 패널 생성
    const panel = document.createElement('div');
    panel.id = 'chat-fix-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
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
    title.textContent = `채팅 수정 패치 v${CHAT_FIX_VERSION}`;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
    `;
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);
    
    // 상태 컨테이너
    const statusContainer = document.createElement('div');
    statusContainer.id = 'chat-fix-status';
    panel.appendChild(statusContainer);
    
    // 문제 컨테이너
    const issuesContainer = document.createElement('div');
    issuesContainer.id = 'chat-fix-issues';
    panel.appendChild(issuesContainer);
    
    // 작업 버튼 컨테이너
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 10px;
    `;
    
    // 수정 적용 버튼
    const fixBtn = document.createElement('button');
    fixBtn.textContent = '수정 적용';
    fixBtn.style.cssText = `
      background-color: #4caf50;
      color: white;
      border: none;
      padding: 5px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    fixBtn.addEventListener('click', () => {
      ChatFix.applyFixes();
    });
    
    // 진단 실행 버튼
    const diagnoseBtn = document.createElement('button');
    diagnoseBtn.textContent = '진단 실행';
    diagnoseBtn.style.cssText = `
      background-color: #2196f3;
      color: white;
      border: none;
      padding: 5px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    diagnoseBtn.addEventListener('click', () => {
      ChatFix.runDiagnostics();
    });
    
    // 화면 전환 버튼
    const switchBtn = document.createElement('button');
    switchBtn.textContent = '채팅 화면으로';
    switchBtn.style.cssText = `
      background-color: #ff9800;
      color: white;
      border: none;
      padding: 5px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    switchBtn.addEventListener('click', () => {
      ChatFixUtils.showScreen('chat-screen');
    });
    
    actionsContainer.appendChild(diagnoseBtn);
    actionsContainer.appendChild(fixBtn);
    actionsContainer.appendChild(switchBtn);
    panel.appendChild(actionsContainer);
    
    // 문서에 추가
    document.body.appendChild(panel);
    
    // 상태 업데이트 시작
    this.updateDebugPanel();
    
    return panel;
  },
  
  // 디버그 패널 업데이트
  updateDebugPanel() {
    if (!ChatFixConfig.showDebugPanel) return;
    
    const statusContainer = document.getElementById('chat-fix-status');
    const issuesContainer = document.getElementById('chat-fix-issues');
    
    if (!statusContainer || !issuesContainer) return;
    
    // 상태 정보 업데이트
    statusContainer.innerHTML = `
      <div>초기화: <span style="color: ${ChatFixState.initialized ? '#4caf50' : '#f44336'}">
        ${ChatFixState.initialized ? '완료' : '실패'}</span></div>
      <div>로드된 종속성: ${ChatFixState.loadedDependencies.length}</div>
      <div>적용된 패치: ${ChatFixState.appliedPatches.length}</div>
      <div>실행 시간: ${((new Date() - ChatFixState.startTime) / 1000).toFixed(1)}초</div>
      <div>현재 화면: ${ChatFixUtils.getActiveScreenId() || 'none'}</div>
      <div>메시지 컨테이너: <span style="color: ${ChatFixUtils.hasChildren('#messages-container') ? '#4caf50' : '#f44336'}">
        ${ChatFixUtils.hasChildren('#messages-container') ? '메시지 있음' : '비어 있음'}</span></div>
    `;
    
    // 문제 목록 업데이트
    if (ChatFixState.detectedIssues.length === 0) {
      issuesContainer.innerHTML = '<div style="color: #4caf50">감지된 문제 없음</div>';
    } else {
      let issuesHtml = '<div style="margin-top: 10px; border-top: 1px solid #555; padding-top: 5px;"><strong>감지된 문제:</strong></div>';
      
      ChatFixState.detectedIssues.forEach((issue, index) => {
        const fixed = ChatFixState.fixesApplied[issue.id];
        issuesHtml += `
          <div style="margin-top: 5px; display: flex; justify-content: space-between;">
            <span>${index + 1}. ${issue.description}</span>
            <span style="color: ${fixed ? '#4caf50' : '#f44336'}">${fixed ? '해결됨' : '미해결'}</span>
          </div>
        `;
      });
      
      issuesContainer.innerHTML = issuesHtml;
    }
  },
  
  // 필수 종속성 로드
  async loadDependencies() {
    try {
      ChatFixLogger.info('필수 종속성 로드 중...');
      
      const loadTasks = [];
      
      // 스타일시트 로드
      if (ChatFixConfig.loadStyles) {
        loadTasks.push(ChatFixUtils.loadStylesheet('css/styles-fix.css', 'chat-fix-styles'));
      }
      
      // 스크립트 로드
      loadTasks.push(ChatFixUtils.loadScript('js/chat-debug.js', 'chat-debug-script'));
      loadTasks.push(ChatFixUtils.loadScript('js/message-renderer.js', 'message-renderer-script'));
      loadTasks.push(ChatFixUtils.loadScript('js/connection-tester.js', 'connection-tester-script'));
      
      // 모든 로드 작업 완료 대기
      const results = await Promise.allSettled(loadTasks);
      
      // 결과 로깅
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { id, alreadyLoaded } = result.value;
          ChatFixLogger.log(`${id} ${alreadyLoaded ? '이미 로드됨' : '로드 완료'}`);
        } else {
          ChatFixLogger.error(`종속성 로드 실패: ${result.reason.id}`, result.reason.error);
        }
      });
      
      // 성공 여부 확인
      const allSuccess = results.every(result => result.status === 'fulfilled');
      
      if (allSuccess) {
        ChatFixLogger.success('모든 종속성 로드 완료');
      } else {
        ChatFixLogger.error('일부 종속성 로드 실패');
      }
      
      return allSuccess;
    } catch (error) {
      ChatFixLogger.error('종속성 로드 중 오류 발생', error);
      return false;
    }
  },
  
  // Supabase 연결 수정
  async fixSupabaseConnection() {
    ChatFixLogger.info('Supabase 연결 수정 중...');
    
    // connectionTester가 로드되었는지 확인
    if (typeof connectionTester === 'undefined') {
      ChatFixLogger.error('connectionTester 모듈이 로드되지 않았습니다.');
      return false;
    }
    
    try {
      // 연결 문제 해결
      const result = await connectionTester.troubleshoot();
      
      if (result.success) {
        ChatFixLogger.success('Supabase 연결 수정 완료');
        ChatFixState.fixesApplied.supabaseConnection = true;
        ChatFixState.appliedPatches.push('fixSupabaseConnection');
        return true;
      } else {
        ChatFixLogger.error('Supabase 연결 수정 실패', result);
        return false;
      }
    } catch (error) {
      ChatFixLogger.error('Supabase 연결 수정 중 오류 발생', error);
      return false;
    }
  },
  
  // 화면 전환 및 표시 수정
  fixScreenDisplay() {
    ChatFixLogger.info('화면 전환 및 표시 수정 중...');
    
    try {
      // 채팅 화면 요소 확인
      const chatScreen = document.getElementById('chat-screen');
      
      if (!chatScreen) {
        ChatFixLogger.error('채팅 화면 요소를 찾을 수 없습니다.');
        return false;
      }
      
      // 표시 스타일 수정
      chatScreen.style.display = 'flex';
      chatScreen.style.flexDirection = 'column';
      chatScreen.style.height = '100%';
      chatScreen.style.overflow = 'hidden';
      
      // uiManager showScreen 메서드 패치
      if (typeof uiManager !== 'undefined' && uiManager.showScreen) {
        ChatFixLogger.log('uiManager.showScreen 패치 적용');
        
        // 원본 메서드 저장
        const originalShowScreen = uiManager.showScreen;
        
        // 메서드 재정의
        uiManager.showScreen = function(screenId) {
          ChatFixLogger.log(`화면 전환: ${screenId}`);
          
          // 모든 화면 숨기기
          document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
          });
          
          // 선택한 화면 표시
          const screen = document.getElementById(`${screenId}-screen`);
          if (screen) {
            screen.classList.add('active');
            
            // 채팅 화면인 경우 추가 처리
            if (screenId === 'chat') {
              screen.style.display = 'flex';
              
              // 메시지 입력 필드에 포커스
              setTimeout(() => {
                const messageInput = document.getElementById('message-input');
                if (messageInput) messageInput.focus();
              }, 100);
              
              // 사용자 목록 새로고침
              this.refreshUserList().catch(err => {
                ChatFixLogger.error('사용자 목록 새로고침 오류', err);
              });
              
              // 이벤트 발생
              const event = new CustomEvent('screenChanged', { 
                detail: { screen: 'chat-screen' } 
              });
              document.dispatchEvent(event);
            }
          }
          
          // 원본 함수 호출
          return originalShowScreen.call(this, screenId);
        };
        
        ChatFixState.appliedPatches.push('patchShowScreen');
      }
      
      ChatFixLogger.success('화면 전환 및 표시 수정 완료');
      ChatFixState.fixesApplied.screenDisplay = true;
      ChatFixState.appliedPatches.push('fixScreenDisplay');
      return true;
    } catch (error) {
      ChatFixLogger.error('화면 전환 및 표시 수정 중 오류 발생', error);
      return false;
    }
  },
  
  // 메시지 렌더링 수정
  fixMessageRendering() {
    ChatFixLogger.info('메시지 렌더링 수정 중...');
    
    try {
      // messageRenderer가 로드되었는지 확인
      if (typeof messageRenderer === 'undefined') {
        ChatFixLogger.error('messageRenderer 모듈이 로드되지 않았습니다.');
        return false;
      }
      
      // 메시지 컨테이너 확인
      const messagesContainer = document.getElementById('messages-container');
      
      if (!messagesContainer) {
        ChatFixLogger.error('메시지 컨테이너를 찾을 수 없습니다.');
        return false;
      }
      
      // 메시지 컨테이너 스타일 수정
      messagesContainer.style.display = 'block';
      messagesContainer.style.minHeight = '200px';
      messagesContainer.style.overflowY = 'auto';
      
      // 기본 메시지 추가
      if (!ChatFixUtils.hasChildren('#messages-container')) {
        const welcomeMessage = ChatFixUtils.addSystemMessage('채팅에 오신 것을 환영합니다!');
        
        if (welcomeMessage) {
          ChatFixLogger.log('기본 메시지 추가됨');
        }
      }
      
      // 메시지 렌더링 초기화 확인
      if (!messageRenderer.state.initialized) {
        messageRenderer.initialize();
      }
      
      ChatFixLogger.success('메시지 렌더링 수정 완료');
      ChatFixState.fixesApplied.messageRendering = true;
      ChatFixState.appliedPatches.push('fixMessageRendering');
      return true;
    } catch (error) {
      ChatFixLogger.error('메시지 렌더링 수정 중 오류 발생', error);
      return false;
    }
  },
  
  // 로그인 후 화면 전환 수정
  fixLoginScreenTransition() {
    ChatFixLogger.info('로그인 후 화면 전환 수정 중...');
    
    try {
      // UIManager handleLogin 메서드 패치
      if (typeof uiManager !== 'undefined' && uiManager.handleLogin) {
        ChatFixLogger.log('uiManager.handleLogin 패치 적용');
        
        // 원본 메서드 저장
        const originalHandleLogin = uiManager.handleLogin;
        
        // 메서드 재정의
        uiManager.handleLogin = async function() {
          const username = document.getElementById('username').value.trim();
          const roomId = document.getElementById('chat-room-select').value;
          const roomCode = document.getElementById('room-code').value.trim();
          
          if (!username) {
            alert(i18nService.translate('enter-username'));
            return;
          }
          
          if (!roomId) {
            alert(i18nService.translate('select-room'));
            return;
          }
          
          try {
            ChatFixLogger.log('로그인 시도:', { username, roomId });
            
            // 채팅방 입장
            const result = await appCore.joinChatRoom(roomId, username, roomCode);
            
            if (!result.success) {
              // 오류 처리
              alert(i18nService.translate(result.message));
              ChatFixLogger.error('로그인 실패:', result.message);
              return;
            }
            
            // 채팅방 정보 가져오기
            const room = await dbService.getChatRoom(roomId);
            
            // 채팅 화면으로 전환 전 준비
            document.getElementById('current-room-name').textContent = room.name;
            
            // 메시지 콜백 설정
            chatService.setMessageCallback(this.handleNewMessage.bind(this));
            chatService.setUserJoinCallback(this.handleUserJoin.bind(this));
            chatService.setUserLeaveCallback(this.handleUserLeave.bind(this));
            
            // 화면 전환
            ChatFixLogger.log('채팅 화면으로 전환');
            this.showScreen('chat');
            
            // 초기 메시지 로드
            ChatFixLogger.log('초기 메시지 로드 시작');
            setTimeout(() => {
              this.refreshMessages().catch(err => {
                ChatFixLogger.error('메시지 새로고침 오류', err);
              });
              
              // 메시지 없으면 기본 메시지 추가
              if (!ChatFixUtils.hasChildren('#messages-container')) {
                ChatFixUtils.addSystemMessage('채팅방에 오신 것을 환영합니다!');
              }
            }, 500);
            
            ChatFixLogger.success('로그인 및 화면 전환 완료');
          } catch (error) {
            ChatFixLogger.error('로그인 처리 중 오류:', error);
            
            // 원본 메서드 호출 시도
            try {
              return await originalHandleLogin.call(this);
            } catch (innerError) {
              ChatFixLogger.error('원본 로그인 메서드 실패:', innerError);
              alert(i18nService.translate('login-error'));
            }
          }
        };
        
        ChatFixState.appliedPatches.push('patchHandleLogin');
      }
      
      ChatFixLogger.success('로그인 후 화면 전환 수정 완료');
      ChatFixState.fixesApplied.loginScreenTransition = true;
      ChatFixState.appliedPatches.push('fixLoginScreenTransition');
      return true;
    } catch (error) {
      ChatFixLogger.error('로그인 후 화면 전환 수정 중 오류 발생', error);
      return false;
    }
  }
};

// 메인 ChatFix 객체
const ChatFix = {
  // 초기화
  async initialize() {
    ChatFixLogger.info(`채팅 수정 패치 v${CHAT_FIX_VERSION} 초기화 중...`);
    
    try {
      // 디버그 패널 생성
      ChatFixPatches.createDebugPanel();
      
      // 종속성 로드
      const dependenciesLoaded = await ChatFixPatches.loadDependencies();
      
      if (!dependenciesLoaded) {
        ChatFixLogger.error('일부 종속성을 로드하지 못했습니다.');
        // 계속 진행 (일부 기능은 작동할 수 있음)
      }
      
      // 자동 패치 적용
      if (ChatFixConfig.autoPatch) {
        await this.applyFixes();
      }
      
      // 자동 진단 시작
      setTimeout(() => {
        this.runDiagnostics();
      }, 2000);
      
      // 상태 업데이트 타이머 시작
      setInterval(() => {
        ChatFixPatches.updateDebugPanel();
      }, 1000);
      
      ChatFixState.initialized = true;
      ChatFixLogger.success('채팅 수정 패치 초기화 완료');
      
      return true;
    } catch (error) {
      ChatFixLogger.error('채팅 수정 패치 초기화 중 오류 발생', error);
      return false;
    }
  },
  
  // 진단 실행
  async runDiagnostics() {
    ChatFixLogger.info('진단 실행 중...');
    ChatFixState.lastAction = '진단';
    
    // 이전 감지된 문제 초기화
    ChatFixState.detectedIssues = [];
    
    try {
      // 1. 화면 표시 문제 확인
      const chatScreen = document.getElementById('chat-screen');
      if (chatScreen) {
        const style = window.getComputedStyle(chatScreen);
        
        if (style.display === 'none' && chatScreen.classList.contains('active')) {
          ChatFixState.detectedIssues.push({
            id: 'screenDisplay',
            type: 'css',
            description: '채팅 화면이 active 클래스를 가지지만 표시되지 않음',
            element: chatScreen
          });
        }
      }
      
      // 2. 메시지 컨테이너 문제 확인
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        if (messagesContainer.childNodes.length === 0) {
          ChatFixState.detectedIssues.push({
            id: 'emptyMessagesContainer',
            type: 'content',
            description: '메시지 컨테이너가 비어 있음',
            element: messagesContainer
          });
        }
        
        const style = window.getComputedStyle(messagesContainer);
        if (style.display === 'none') {
          ChatFixState.detectedIssues.push({
            id: 'messageRendering',
            type: 'css',
            description: '메시지 컨테이너가 표시되지 않음',
            element: messagesContainer
          });
        }
      }
      
      // 3. Supabase 연결 문제 확인
      if (typeof dbService !== 'undefined') {
        if (!dbService.initialized || !dbService.supabase) {
          ChatFixState.detectedIssues.push({
            id: 'supabaseConnection',
            type: 'connection',
            description: 'Supabase 연결이 초기화되지 않음',
            service: dbService
          });
        }
      }
      
      // 4. 채팅 서비스 상태 확인
      if (typeof chatService !== 'undefined') {
        if (chatService.messages && chatService.messages.length > 0 && messagesContainer && messagesContainer.childNodes.length === 0) {
          ChatFixState.detectedIssues.push({
            id: 'messageSyncIssue',
            type: 'sync',
            description: '메시지가 로드되었지만 UI에 표시되지 않음',
            count: chatService.messages.length
          });
        }
      }
      
      // 5. 로그인 후 화면 전환 문제 확인
      if (typeof uiManager !== 'undefined') {
        const activeScreen = ChatFixUtils.getActiveScreenId();
        const user = typeof userService !== 'undefined' ? userService.getCurrentUser() : null;
        
        if (user && activeScreen !== 'chat-screen') {
          ChatFixState.detectedIssues.push({
            id: 'loginScreenTransition',
            type: 'navigation',
            description: '로그인되었지만 채팅 화면으로 전환되지 않음',
            currentScreen: activeScreen
          });
        }
      }
      
      // 진단 결과 업데이트
      ChatFixPatches.updateDebugPanel();
      
      if (ChatFixState.detectedIssues.length === 0) {
        ChatFixLogger.success('진단 완료: 문제가 감지되지 않았습니다.');
      } else {
        ChatFixLogger.warn(`진단 완료: ${ChatFixState.detectedIssues.length}개의 문제가 감지되었습니다.`);
        
        // 수정되지 않은 문제가 있으면 수정 시도
        const hasUnfixedIssues = ChatFixState.detectedIssues.some(issue => !ChatFixState.fixesApplied[issue.id]);
        
        if (hasUnfixedIssues && ChatFixConfig.autoPatch) {
          ChatFixLogger.info('수정되지 않은 문제가 있어 자동 수정을 시도합니다.');
          await this.applyFixes();
        }
      }
      
      return ChatFixState.detectedIssues;
    } catch (error) {
      ChatFixLogger.error('진단 중 오류 발생', error);
      return [];
    }
  },
  
  // 수정 적용
  async applyFixes() {
    ChatFixLogger.info('수정 적용 중...');
    ChatFixState.lastAction = '수정';
    
    try {
      // 1. Supabase 연결 수정
      if (ChatFixConfig.fixSupabase) {
        const supabaseFixed = await ChatFixPatches.fixSupabaseConnection();
        ChatFixLogger.log('Supabase 연결 수정:', supabaseFixed ? '성공' : '실패');
      }
      
      // 2. 화면 전환 및 표시 수정
      const screenFixed = ChatFixPatches.fixScreenDisplay();
      ChatFixLogger.log('화면 전환 및 표시 수정:', screenFixed ? '성공' : '실패');
      
      // 3. 메시지 렌더링 수정
      if (ChatFixConfig.fixRendering) {
        const renderingFixed = ChatFixPatches.fixMessageRendering();
        ChatFixLogger.log('메시지 렌더링 수정:', renderingFixed ? '성공' : '실패');
      }
      
      // 4. 로그인 후 화면 전환 수정
      if (ChatFixConfig.patchMethods) {
        const loginFixed = ChatFixPatches.fixLoginScreenTransition();
        ChatFixLogger.log('로그인 후 화면 전환 수정:', loginFixed ? '성공' : '실패');
      }
      
      // 5. 현재 화면이 채팅 화면이고 사용자가 로그인되어 있으면 메시지 새로고침
      const activeScreen = ChatFixUtils.getActiveScreenId();
      const isLoggedIn = typeof userService !== 'undefined' && userService.isLoggedIn();
      
      if (activeScreen === 'chat-screen' && isLoggedIn) {
        ChatFixLogger.log('채팅 화면 새로고침 시도');
        
        if (typeof uiManager !== 'undefined' && uiManager.refreshMessages) {
          setTimeout(() => {
            uiManager.refreshMessages().catch(err => {
              ChatFixLogger.error('메시지 새로고침 오류', err);
            });
          }, 500);
        } else if (typeof messageRenderer !== 'undefined' && typeof chatService !== 'undefined') {
          setTimeout(async () => {
            try {
              const messages = await chatService.getRecentMessages();
              messageRenderer.renderMessages(messages);
              ChatFixLogger.log('메시지 렌더링 완료');
            } catch (err) {
              ChatFixLogger.error('메시지 렌더링 오류', err);
            }
          }, 500);
        }
      }
      
      // 패널 업데이트
      ChatFixPatches.updateDebugPanel();
      
      ChatFixLogger.success('수정 적용 완료');
      return true;
    } catch (error) {
      ChatFixLogger.error('수정 적용 중 오류 발생', error);
      return false;
    }
  },
  
  // 로그인 처리
  async handleLogin(username, roomId, roomCode) {
    ChatFixLogger.info('로그인 처리 중...');
    
    try {
      // 채팅방 입장
      const result = await appCore.joinChatRoom(roomId, username, roomCode);
      
      if (!result.success) {
        ChatFixLogger.error('로그인 실패:', result.message);
        return { success: false, message: result.message };
      }
      
      // 채팅방 정보 가져오기
      const room = await dbService.getChatRoom(roomId);
      
      // 채팅 화면으로 전환
      document.getElementById('current-room-name').textContent = room.name;
      ChatFixUtils.showScreen('chat-screen');
      
      // 초기 메시지 로드
      setTimeout(() => {
        if (typeof messageRenderer !== 'undefined') {
          ChatFixLogger.log('messageRenderer를 사용하여 메시지 로드');
          
          // 로딩 표시
          messageRenderer.showLoading();
          
          // 최근 메시지 가져오기
          chatService.getRecentMessages().then(messages => {
            ChatFixLogger.log('메시지 로드됨:', messages?.length || 0);
            
            // 메시지 렌더링
            const count = messageRenderer.renderMessages(messages);
            
            // 메시지가 없으면 안내 메시지 표시
            if (count === 0) {
              messageRenderer.showNoMessages();
            }
          }).catch(err => {
            ChatFixLogger.error('메시지 로드 오류:', err);
            messageRenderer.addSystemMessage('메시지를 불러오는 중 오류가 발생했습니다.');
          });
        } else if (typeof uiManager !== 'undefined' && uiManager.refreshMessages) {
          ChatFixLogger.log('uiManager를 사용하여 메시지 로드');
          
          uiManager.refreshMessages().catch(err => {
            ChatFixLogger.error('메시지 새로고침 오류', err);
          });
        }
      }, 500);
      
      ChatFixLogger.success('로그인 성공');
      return { success: true };
    } catch (error) {
      ChatFixLogger.error('로그인 처리 중 오류 발생', error);
      return { success: false, message: 'login-error' };
    }
  }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  ChatFix.initialize();
});

// 전역 객체로 노출
window.ChatFix = ChatFix;

console.log(`%c 채팅 수정 패치 v${CHAT_FIX_VERSION} 로드됨 `, 'background: #3f51b5; color: white; padding: 8px; font-size: 14px; border-radius: 4px;');
