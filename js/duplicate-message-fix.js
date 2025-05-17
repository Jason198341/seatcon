/**
 * 메시지 중복 표시 문제 해결 패치
 * - 같은 메시지가 두 번 표시되는 문제 해결
 * - 실시간 메시지 수신 처리 로직 수정
 */

// 메시지 중복 방지를 위한 ID 캐시
const processedMessageIds = new Set();

(function() {
  console.log('[DuplicateMessageFix] 메시지 중복 표시 문제 수정 패치 초기화 중...');

  // 메시지 처리 함수의 원본 저장 변수
  let originalHandleNewMessage = null;
  let originalRealtimeMessageCallback = null;

  /**
   * 초기화 함수
   */
  function initialize() {
    // chatService의 onNewMessage 함수 패치
    if (typeof chatService !== 'undefined' && chatService.onNewMessage) {
      console.log('[DuplicateMessageFix] 원본 chatService.onNewMessage 저장');
      originalRealtimeMessageCallback = chatService.onNewMessage;
      
      // 중복 검사를 위한 래퍼 함수로 교체
      chatService.onNewMessage = function(message) {
        if (!message || !message.id) {
          console.warn('[DuplicateMessageFix] 메시지 ID가 없습니다:', message);
          return originalRealtimeMessageCallback.call(this, message);
        }
        
        // 이미 처리된 메시지인지 확인
        if (processedMessageIds.has(message.id)) {
          console.log('[DuplicateMessageFix] 중복 메시지 필터링:', message.id);
          return; // 중복 메시지는 무시
        }
        
        // 캐시에 메시지 ID 추가
        processedMessageIds.add(message.id);
        
        // 캐시 크기 제한 (최근 100개만 유지)
        if (processedMessageIds.size > 100) {
          const oldestId = Array.from(processedMessageIds)[0];
          processedMessageIds.delete(oldestId);
        }
        
        // 원본 콜백 호출
        return originalRealtimeMessageCallback.call(this, message);
      };
    }
    
    // chatManager의 handleNewMessage 함수 패치
    if (typeof chatManager !== 'undefined' && chatManager.handleNewMessage) {
      console.log('[DuplicateMessageFix] 원본 chatManager.handleNewMessage 저장');
      originalHandleNewMessage = chatManager.handleNewMessage;
      
      // 중복 검사를 위한 래퍼 함수로 교체
      chatManager.handleNewMessage = function(message) {
        if (!message || !message.id) {
          console.warn('[DuplicateMessageFix] 메시지 ID가 없습니다:', message);
          return originalHandleNewMessage.call(this, message);
        }
        
        // 이미 처리된 메시지인지 확인
        if (processedMessageIds.has(message.id)) {
          console.log('[DuplicateMessageFix] 중복 메시지 필터링:', message.id);
          return; // 중복 메시지는 무시
        }
        
        // 캐시에 메시지 ID 추가
        processedMessageIds.add(message.id);
        
        // 원본 함수 호출
        return originalHandleNewMessage.call(this, message);
      };
    }
    
    // messageRenderer가 있는 경우 renderSingleMessage 함수 패치
    if (typeof messageRenderer !== 'undefined' && messageRenderer.renderSingleMessage) {
      const originalRenderSingleMessage = messageRenderer.renderSingleMessage;
      
      messageRenderer.renderSingleMessage = function(message) {
        if (!message || !message.id) {
          console.warn('[DuplicateMessageFix] 메시지 ID가 없습니다:', message);
          return originalRenderSingleMessage.call(this, message);
        }
        
        // 이미 렌더링된 메시지인지 확인
        const existingMsg = document.querySelector(`.message[data-id="${message.id}"]`);
        if (existingMsg) {
          console.log('[DuplicateMessageFix] 이미 렌더링된 메시지 건너뛰기:', message.id);
          return existingMsg;
        }
        
        // 원본 함수 호출
        return originalRenderSingleMessage.call(this, message);
      };
    }
    
    // realtimeService 패치
    if (typeof realtimeService !== 'undefined') {
      // 이미 처리된 메시지가 있는지 확인하는 기능 추가
      realtimeService.isMessageProcessed = function(messageId) {
        return processedMessageIds.has(messageId);
      };
      
      // 처리된 메시지 ID 추가 기능
      realtimeService.markMessageAsProcessed = function(messageId) {
        processedMessageIds.add(messageId);
      };
    }
    
    console.log('[DuplicateMessageFix] 메시지 중복 표시 문제 수정 패치 초기화 완료');
  }

  // DOM이 준비되면 초기화 실행
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initialize, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 100));
  }
  
  // 가끔 앱 초기화가 지연되는 경우에 대비하여 추가 체크
  setTimeout(() => {
    if (originalHandleNewMessage === null && originalRealtimeMessageCallback === null) {
      console.log('[DuplicateMessageFix] 지연된 초기화 시도...');
      initialize();
    }
  }, 2000);
})();

console.log('[DuplicateMessageFix] 메시지 중복 표시 문제 수정 패치 로드됨');
