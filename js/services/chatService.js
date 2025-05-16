// js/services/chatService.js
(function() {
  'use strict';
  
  /**
   * 채팅 서비스 모듈 - 메시지 관리 및 실시간 통신
   * 
   * 설명: 이 모듈은 채팅 메시지 처리 및 실시간 통신을 담당합니다.
   * 메시지 전송, 수신, 저장, 실시간 업데이트 등의 기능을 제공합니다.
   */
  
  // 설정 불러오기
  const config = window.appConfig;
  
  // 디버그 로깅
  function debug(...args) {
    if (config.isDebugMode()) {
      console.log('[Chat Service]', ...args);
    }
  }
  
  // 현재 채팅방 정보
  let currentRoom = null;
  
  // 마지막 메시지 타임스탬프
  let lastMessageTimestamp = null;
  
  // 실시간 구독 채널
  let realtimeChannel = null;
  
  // 폴링 타이머
  let pollingTimer = null;
  
  // 이벤트 리스너
  const eventListeners = {
    messageReceived: [],
    announcementReceived: [],
    connectionStatusChanged: []
  };
  
  /**
   * 이벤트 발생
   * @param {string} eventName - 이벤트 이름
   * @param {Object} data - 이벤트 데이터
   */
  function triggerEvent(eventName, data) {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          debug('이벤트 리스너 오류:', error);
        }
      });
    }
  }
  
  /**
   * 채팅방 참가
   * @param {string} roomId - 채팅방 ID
   * @returns {Promise<Object>} 채팅방 정보
   */
  async function joinRoom(roomId) {
    if (!roomId) {
      roomId = config.getAppConfig().defaultRoom;
    }
    
    // 이전 채팅방이 있으면 정리
    if (currentRoom && currentRoom.id !== roomId) {
      leaveRoom();
    }
    
    // 채팅방 정보 설정
    currentRoom = {
      id: roomId,
      joined: true,
      joinedAt: new Date().toISOString()
    };
    
    // 실시간 업데이트 설정
    setupRealtimeUpdates();
    
    debug('채팅방 참가:', roomId);
    
    return currentRoom;
  }
  
  /**
   * 채팅방 퇴장
   */
  function leaveRoom() {
    if (!currentRoom) {
      return;
    }
    
    // 실시간 업데이트 정리
    clearRealtimeUpdates();
    
    // 채팅방 정보 초기화
    currentRoom = null;
    lastMessageTimestamp = null;
    
    debug('채팅방 퇴장');
  }
  
  /**
   * 실시간 업데이트 설정
   */
  function setupRealtimeUpdates() {
    if (!currentRoom) {
      return;
    }
    
    // 이전 설정이 있으면 정리
    clearRealtimeUpdates();
    
    // 1. Supabase Realtime 구독 설정
    realtimeChannel = window.dbService.setupRealtimeSubscription(
      currentRoom.id,
      handleNewMessage
    );
    
    // 2. 폴링 방식 설정 (백업)
    startPolling();
    
    debug('실시간 업데이트 설정 완료');
  }
  
  /**
   * 실시간 업데이트 정리
   */
  function clearRealtimeUpdates() {
    // Supabase Realtime 구독 해제
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
    
    // 폴링 타이머 정리
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    
    debug('실시간 업데이트 정리 완료');
  }
  
  /**
   * 폴링 시작
   */
  function startPolling() {
    // 이전 타이머가 있으면 정리
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }
    
    // 마지막 메시지 타임스탬프가 없으면 현재 시간으로 설정
    if (!lastMessageTimestamp) {
      lastMessageTimestamp = new Date().toISOString();
    }
    
    // 폴링 간격 설정
    const interval = config.getAppConfig().pollingInterval;
    
    // 폴링 타이머 설정
    pollingTimer = setInterval(
      checkNewMessages, 
      interval
    );
    
    debug('폴링 시작:', interval + 'ms 간격');
  }
  
  /**
   * 새 메시지 확인 (폴링)
   */
  async function checkNewMessages() {
    if (!currentRoom || !lastMessageTimestamp) {
      return;
    }
    
    try {
      debug('새 메시지 확인 중...', lastMessageTimestamp);
      
      // 새 메시지 가져오기
      const { data, error, local } = await window.dbService.getNewMessages(
        currentRoom.id,
        lastMessageTimestamp
      );
      
      if (error && !local) {
        debug('새 메시지 확인 오류:', error);
        return;
      }
      
      // 새 메시지가 있으면 처리
      if (data && data.length > 0) {
        debug(`${data.length}개의 새 메시지 수신`);
        
        // 새 메시지 처리
        data.forEach(handleNewMessage);
        
        // 마지막 메시지 타임스탬프 업데이트
        lastMessageTimestamp = data[data.length - 1].created_at;
      }
    } catch (error) {
      debug('폴링 오류:', error);
    }
  }
  
  /**
   * 새 메시지 처리
   * @param {Object} message - 새 메시지
   */
  function handleNewMessage(message) {
    if (!message) {
      return;
    }
    
    // 내가 보낸 메시지는 무시 (이미 화면에 표시되어 있으므로)
    const currentUser = window.userService.getCurrentUser();
    if (currentUser && message.user_id === currentUser.id) {
      debug('내가 보낸 메시지 무시:', message.id);
      return;
    }
    
    debug('새 메시지 처리:', message);
    
    // 이벤트 발생
    triggerEvent('messageReceived', message);
    
    // 공지사항이면 추가 이벤트 발생
    if (message.isannouncement) {
      triggerEvent('announcementReceived', message);
    }
  }
  
  /**
   * 메시지 전송
   * @param {string} messageText - 메시지 내용
   * @param {Object} replyTo - 답장 대상 정보 (선택)
   * @returns {Promise<Object>} 저장된 메시지
   */
  async function sendMessage(messageText, replyTo = null) {
    if (!messageText || messageText.trim() === '') {
      throw new Error('메시지 내용은 필수입니다.');
    }
    
    if (!currentRoom) {
      throw new Error('참가한 채팅방이 없습니다.');
    }
    
    const currentUser = window.userService.getCurrentUser();
    if (!currentUser) {
      throw new Error('로그인된 사용자가 없습니다.');
    }
    
    // 공지사항 여부 확인 (관리자만 가능)
    const isAnnouncement = window.userService.isAdmin() && 
                         messageText.startsWith(config.getAppConfig().announcementTag);
    
    // 공지사항이면 명령어 제거
    const finalMessage = isAnnouncement 
      ? messageText.substring(config.getAppConfig().announcementTag.length) 
      : messageText;
    
    // 메시지 객체 생성
    const messageData = {
      room_id: currentRoom.id,
      user_id: currentUser.id,
      username: currentUser.username,
      message: finalMessage,
      language: currentUser.preferred_language,
      isannouncement: isAnnouncement
    };
    
    // 답장 정보 추가
    if (replyTo) {
      messageData.reply_to = {
        id: replyTo.id,
        username: replyTo.username,
        message: replyTo.message
      };
    }
    
    debug('메시지 전송 중...', messageData);
    
    try {
      // 메시지 저장
      const { data, error, local } = await window.dbService.saveMessage(messageData);
      
      if (error && !local) {
        throw error;
      }
      
      const savedMessage = data[0];
      debug('메시지 저장 완료:', savedMessage);
      
      // 마지막 메시지 타임스탬프 업데이트
      lastMessageTimestamp = savedMessage.created_at;
      
      return { message: savedMessage, local };
    } catch (error) {
      debug('메시지 전송 오류:', error);
      throw error;
    }
  }
  
  /**
   * 시스템 메시지 전송
   * @param {string} messageText - 메시지 내용
   * @returns {Object} 시스템 메시지
   */
  function sendSystemMessage(messageText) {
    if (!messageText || !currentRoom) {
      return null;
    }
    
    // 시스템 메시지 객체 생성
    const systemMessage = {
      id: `system_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      username: 'System',
      message: messageText,
      language: 'system',
      created_at: new Date().toISOString(),
      isannouncement: false
    };
    
    debug('시스템 메시지 생성:', systemMessage);
    
    // 이벤트 발생
    triggerEvent('messageReceived', systemMessage);
    
    return systemMessage;
  }
  
  /**
   * 이전 메시지 로드
   * @param {number} limit - 가져올 메시지 수
   * @returns {Promise<Array>} 메시지 목록
   */
  async function loadMessages(limit = 50) {
    if (!currentRoom) {
      throw new Error('참가한 채팅방이 없습니다.');
    }
    
    debug('이전 메시지 로드 중...', currentRoom.id);
    
    try {
      // 메시지 가져오기
      const { data, error, local } = await window.dbService.getMessages(
        currentRoom.id,
        limit
      );
      
      if (error && !local) {
        throw error;
      }
      
      debug(`${data.length}개의 메시지 로드 완료`);
      
      // 마지막 메시지 타임스탬프 설정
      if (data.length > 0) {
        lastMessageTimestamp = data[data.length - 1].created_at;
      } else {
        lastMessageTimestamp = new Date().toISOString();
      }
      
      return { messages: data, local };
    } catch (error) {
      debug('메시지 로드 오류:', error);
      throw error;
    }
  }
  
  /**
   * 공지사항 가져오기
   * @returns {Promise<Object>} 공지사항
   */
  async function getAnnouncements() {
    if (!currentRoom) {
      return { announcement: null, local: true };
    }
    
    try {
      debug('공지사항 가져오기 중...', currentRoom.id);
      
      // 공지사항 가져오기
      const { data, error, local } = await window.dbService.getAnnouncements(
        currentRoom.id,
        config.getAppConfig().adminId
      );
      
      if (error && !local) {
        debug('공지사항 가져오기 오류:', error);
      }
      
      // 공지사항이 있으면 반환
      if (data && data.length > 0) {
        debug('공지사항 로드 완료:', data[0]);
        return { announcement: data[0], local };
      }
      
      return { announcement: null, local };
    } catch (error) {
      debug('공지사항 가져오기 오류:', error);
      return { announcement: null, local: true };
    }
  }
  
  /**
   * 이벤트 리스너 등록
   * @param {string} eventName - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  function addEventListener(eventName, callback) {
    if (!eventListeners[eventName]) {
      eventListeners[eventName] = [];
    }
    
    eventListeners[eventName].push(callback);
    
    debug('이벤트 리스너 등록:', eventName);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param {string} eventName - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  function removeEventListener(eventName, callback) {
    if (!eventListeners[eventName]) {
      return;
    }
    
    eventListeners[eventName] = eventListeners[eventName].filter(
      listener => listener !== callback
    );
    
    debug('이벤트 리스너 제거:', eventName);
  }
  
  /**
   * 현재 채팅방 정보 가져오기
   * @returns {Object|null} 채팅방 정보
   */
  function getCurrentRoom() {
    return currentRoom;
  }
  
  // 공개 API
  window.chatService = {
    joinRoom,
    leaveRoom,
    sendMessage,
    sendSystemMessage,
    loadMessages,
    getAnnouncements,
    addEventListener,
    removeEventListener,
    getCurrentRoom,
    checkNewMessages  // 수동 새로고침용
  };
})();