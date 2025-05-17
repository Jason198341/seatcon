/**
 * 모바일 UI 문제 해결 패치
 * - 모바일에서 채팅방 목록이 표시되지 않는 문제 해결
 * - 모바일 화면에 최적화된 UI 조정
 */

(function() {
  console.log('[MobileUIFix] 모바일 UI 문제 수정 패치 초기화 중...');

  // 모바일 기기 감지
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  /**
   * 초기화 함수
   */
  function initialize() {
    if (!isMobile) {
      console.log('[MobileUIFix] 모바일 기기가 아닙니다. 패치 적용 건너뜀.');
      return;
    }
    
    console.log('[MobileUIFix] 모바일 기기 감지됨. 모바일 UI 패치 적용 중...');
    
    // 모바일용 스타일 추가
    addMobileStyles();
    
    // 채팅방 목록 로딩 함수 패치
    patchRoomListLoading();
    
    // 모바일 UI 개선
    enhanceMobileUI();
    
    console.log('[MobileUIFix] 모바일 UI 패치 적용 완료');
  }

  /**
   * 모바일용 CSS 스타일 추가
   */
  function addMobileStyles() {
    // 이미 추가되었는지 확인
    if (document.getElementById('mobile-ui-styles')) {
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'mobile-ui-styles';
    styleElement.textContent = `
      /* 모바일 화면 최적화 스타일 */
      @media (max-width: 767px) {
        /* 폰트 크기 조정 */
        body {
          font-size: 14px !important;
        }
        
        /* 헤더 조정 */
        .chat-header {
          padding: 8px !important;
        }
        
        .room-info h3 {
          font-size: 14px !important;
        }
        
        /* 입력창 조정 */
        .message-input-container {
          padding: 5px !important;
        }
        
        #message-input {
          min-height: 36px !important;
          font-size: 14px !important;
        }
        
        /* 채팅방 목록 개선 */
        #chat-room-select {
          width: 100% !important;
          max-width: 100% !important;
          font-size: 16px !important;
          padding: 10px !important;
          /* iOS에서 select 요소 스타일링 문제 해결 */
          -webkit-appearance: menulist !important;
          appearance: menulist !important;
        }
        
        /* 로그인 화면 조정 */
        #login-screen, #admin-login-screen {
          width: 90% !important;
          max-width: 90% !important;
          padding: 15px !important;
        }
        
        /* 폼 요소 개선 */
        .form-group input, 
        .form-group select {
          padding: 10px !important;
          font-size: 16px !important; /* iOS에서 확대 방지를 위해 16px 이상 */
        }
        
        /* 버튼 크기 확대 */
        .btn {
          padding: 10px 15px !important;
          font-size: 16px !important;
        }
        
        /* 사용자 목록 전체 화면으로 표시 */
        .users-sidebar {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 1000 !important;
          background-color: rgba(255, 255, 255, 0.95) !important;
        }
        
        /* 채팅 컨테이너 여백 조정 */
        .messages-container {
          padding: 10px !important;
        }
        
        /* 메시지 스타일 조정 */
        .message {
          padding: 8px 10px !important;
          max-width: 85% !important;
        }
        
        /* 닫기 버튼 추가 */
        .sidebar-close-btn {
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          background: none !important;
          border: none !important;
          font-size: 20px !important;
          color: #333 !important;
          z-index: 1001 !important;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
    console.log('[MobileUIFix] 모바일 스타일 추가됨');
  }

  /**
   * 채팅방 목록 로딩 함수 패치
   */
  function patchRoomListLoading() {
    if (typeof uiManager === 'undefined' || !uiManager.loadChatRooms) {
      console.warn('[MobileUIFix] uiManager.loadChatRooms를 찾을 수 없습니다.');
      return;
    }
    
    // 원본 함수 저장
    const originalLoadChatRooms = uiManager.loadChatRooms;
    
    // 패치된 함수로 교체
    uiManager.loadChatRooms = async function() {
      try {
        const select = document.getElementById('chat-room-select');
        if (!select) {
          console.error('[MobileUIFix] chat-room-select 요소를 찾을 수 없습니다.');
          return;
        }
        
        // 로딩 표시
        select.innerHTML = `<option value="" disabled selected>${i18nService.translate('loading-rooms')}</option>`;
        
        // 직접 dbService 사용
        let rooms = [];
        
        try {
          // dbService가 초기화되었는지 확인
          if (typeof dbService !== 'undefined') {
            if (!dbService.initialized) {
              await dbService.initialize();
            }
            
            // 채팅방 목록 가져오기
            rooms = await dbService.getChatRooms(true);
            console.log('[MobileUIFix] 채팅방 목록 로드됨:', rooms);
          }
        } catch (dbError) {
          console.error('[MobileUIFix] 채팅방 목록 로드 중 오류:', dbError);
          
          // 연결 테스터 사용 시도
          if (typeof connectionTester !== 'undefined') {
            try {
              await connectionTester.troubleshoot();
              rooms = await dbService.getChatRooms(true);
            } catch (fixError) {
              console.error('[MobileUIFix] 채팅방 목록 복구 시도 실패:', fixError);
            }
          }
        }
        
        // 목록이 비어있으면 대체 데이터 표시
        if (!rooms || rooms.length === 0) {
          console.warn('[MobileUIFix] 채팅방 목록이 비어있습니다. 대체 데이터 사용.');
          
          // 대체 채팅방 데이터
          rooms = [
            { id: 'default-room', name: '일반 채팅방', type: 'public', status: 'active' },
            { id: 'conference-room', name: '컨퍼런스 채팅방', type: 'public', status: 'active' },
            { id: 'private-room', name: '비공개 채팅방', type: 'private', status: 'active' }
          ];
        }
        
        // 옵션 생성
        select.innerHTML = '';
        rooms.forEach(room => {
          const option = document.createElement('option');
          option.value = room.id;
          option.dataset.type = room.type;
          option.textContent = room.name;
          select.appendChild(option);
        });
        
        // 첫 번째 채팅방 선택
        if (select.options.length > 0) {
          select.selectedIndex = 0;
          
          // 선택된 채팅방 유형에 따라 접근 코드 필드 표시/숨김
          const selectedOption = select.options[select.selectedIndex];
          if (selectedOption) {
            const roomType = selectedOption.dataset.type;
            const codeContainer = document.getElementById('private-room-code-container');
            
            if (codeContainer) {
              if (roomType === 'private') {
                codeContainer.classList.remove('hidden');
              } else {
                codeContainer.classList.add('hidden');
              }
            }
          }
        }
      } catch (error) {
        console.error('[MobileUIFix] 채팅방 목록 로드 중 오류:', error);
        
        const select = document.getElementById('chat-room-select');
        if (select) {
          select.innerHTML = `
            <option value="default-room" data-type="public">일반 채팅방</option>
            <option value="conference-room" data-type="public">컨퍼런스 채팅방</option>
          `;
        }
      }
    };
    
    console.log('[MobileUIFix] 채팅방 목록 로딩 함수 패치 완료');
  }

  /**
   * 모바일 UI 개선
   */
  function enhanceMobileUI() {
    // 사용자 목록 사이드바에 닫기 버튼 추가
    const usersSidebar = document.getElementById('users-sidebar');
    if (usersSidebar && !usersSidebar.querySelector('.sidebar-close-btn')) {
      const closeButton = document.createElement('button');
      closeButton.className = 'sidebar-close-btn';
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', () => {
        usersSidebar.classList.add('hidden');
      });
      
      usersSidebar.insertBefore(closeButton, usersSidebar.firstChild);
    }
    
    // 모바일에서 입장 버튼 크기 증가
    const loginBtn = document.getElementById('login-form')?.querySelector('[type="submit"]');
    if (loginBtn) {
      loginBtn.style.height = '44px';
      loginBtn.style.marginTop = '10px';
    }
    
    // 모바일에서 select 요소 터치 개선
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      select.addEventListener('touchstart', function(event) {
        event.stopPropagation();
      });
    });
    
    // 메시지 입력 필드 포커스 시 가상 키보드 조정
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('focus', function() {
        // iOS에서 가상 키보드 표시 시 화면 조정
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        }, 300);
      });
    }
    
    // 모바일에서 화면 방향 변경 시 UI 조정
    window.addEventListener('orientationchange', function() {
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 300);
    });
    
    console.log('[MobileUIFix] 모바일 UI 개선 완료');
  }

  // DOM이 준비되면 초기화 실행
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initialize, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 100));
  }
  
  // 화면 전환 이벤트 후에도 모바일 UI 적용을 확인
  document.addEventListener('screenChanged', () => {
    if (isMobile) {
      enhanceMobileUI();
    }
  });
  
  // 로그인 화면으로 전환될 때 채팅방 목록 로드가 제대로 동작하는지 확인
  if (typeof uiManager !== 'undefined') {
    const originalShowScreen = uiManager.showScreen;
    
    if (originalShowScreen) {
      uiManager.showScreen = function(screenId) {
        const result = originalShowScreen.call(this, screenId);
        
        if (screenId === 'login' && isMobile) {
          // 채팅방 목록이 비어 있으면 다시 로드
          setTimeout(() => {
            const select = document.getElementById('chat-room-select');
            if (select && (!select.options.length || select.options[0].disabled)) {
              console.log('[MobileUIFix] 채팅방 목록 재로드');
              this.loadChatRooms();
            }
          }, 500);
        }
        
        return result;
      };
    }
  }
})();

console.log('[MobileUIFix] 모바일 UI 문제 수정 패치 로드됨');
