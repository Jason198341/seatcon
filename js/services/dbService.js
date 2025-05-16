// js/services/dbService.js
(function() {
  'use strict';
  
  /**
   * 데이터베이스 서비스 모듈 - Supabase 연결 및 통신 관리
   * 
   * 설명: 이 모듈은 Supabase 데이터베이스 연결 및 데이터 작업을 담당합니다.
   * 연결 실패 시 로컬 스토리지로 폴백하는 메커니즘을 포함합니다.
   */
  
  // 설정 불러오기
  const config = window.appConfig;
  
  // 디버그 로깅
  function debug(...args) {
    if (config.isDebugMode()) {
      console.log('[DB Service]', ...args);
    }
  }
  
  // Supabase 클라이언트
  let supabase = null;
  
  // 연결 상태
  let connectionStatus = {
    online: false,
    initialized: false,
    lastError: null
  };
  
  // 오프라인 캐시
  let offlineCache = {
    messages: {},
    users: {}
  };
  
  // 데이터베이스 초기화
  function initialize() {
    if (connectionStatus.initialized) {
      return Promise.resolve(connectionStatus);
    }
    
    try {
      debug('Supabase 클라이언트 초기화 중...');
      
      // Supabase 클라이언트 생성
      supabase = window.supabase.createClient(
        config.getSupabaseUrl(),
        config.getSupabaseKey()
      );
      
      connectionStatus.initialized = true;
      
      // 연결 테스트
      return testConnection();
    } catch (error) {
      debug('초기화 오류:', error);
      connectionStatus.online = false;
      connectionStatus.lastError = error;
      return Promise.resolve(connectionStatus);
    }
  }
  
  // 연결 테스트
  async function testConnection() {
    try {
      debug('Supabase 연결 테스트 중...');
      
      // 간단한 쿼리로 연결 테스트
      const { error } = await supabase
        .from('messages')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      connectionStatus.online = true;
      debug('Supabase 연결 성공');
      return connectionStatus;
    } catch (error) {
      debug('Supabase 연결 실패:', error);
      connectionStatus.online = false;
      connectionStatus.lastError = error;
      return connectionStatus;
    }
  }
  
  // 오프라인 모드에서 메시지 저장
  function saveMessageLocally(roomId, message) {
    if (!offlineCache.messages[roomId]) {
      offlineCache.messages[roomId] = [];
    }
    
    // 중복 방지
    const exists = offlineCache.messages[roomId].some(m => m.id === message.id);
    if (!exists) {
      offlineCache.messages[roomId].push(message);
      
      // 로컬 스토리지에도 저장
      const localMessages = getLocalMessages(roomId);
      localMessages.push(message);
      saveLocalMessages(roomId, localMessages);
    }
  }
  
  // 로컬 메시지 가져오기
  function getLocalMessages(roomId) {
    const messagesJson = localStorage.getItem(`chat_messages_${roomId}`);
    return messagesJson ? JSON.parse(messagesJson) : [];
  }
  
  // 로컬 메시지 저장
  function saveLocalMessages(roomId, messages) {
    // 메시지 수가 너무 많으면 최근 메시지만 유지
    if (messages.length > config.getAppConfig().maxMessagesInMemory) {
      messages = messages.slice(-config.getAppConfig().maxMessagesInMemory);
    }
    
    localStorage.setItem(`chat_messages_${roomId}`, JSON.stringify(messages));
  }
  
  // Supabase에 사용자 생성
  async function createUser(userData) {
    await initialize();
    
    try {
      if (!connectionStatus.online) {
        debug('오프라인 모드: 로컬에만 사용자 저장');
        return {
          data: userData,
          error: null,
          local: true
        };
      }
      
      debug('Supabase에 사용자 저장 중...', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select();
      
      if (error) {
        throw error;
      }
      
      debug('사용자 저장 완료:', data);
      return { data, error: null, local: false };
    } catch (error) {
      debug('사용자 저장 오류:', error);
      
      // 로컬에만 저장
      if (!offlineCache.users[userData.id]) {
        offlineCache.users[userData.id] = userData;
      }
      
      return {
        data: userData,
        error,
        local: true
      };
    }
  }
  
  // Supabase에 메시지 저장
  async function saveMessage(messageData) {
    await initialize();
    
    try {
      if (!connectionStatus.online) {
        debug('오프라인 모드: 로컬에만 메시지 저장');
        
        // 로컬 ID 생성
        const localMessage = {
          ...messageData,
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          created_at: new Date().toISOString()
        };
        
        saveMessageLocally(messageData.room_id, localMessage);
        
        return {
          data: [localMessage],
          error: null,
          local: true
        };
      }
      
      debug('Supabase에 메시지 저장 중...', messageData);
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select();
      
      if (error) {
        throw error;
      }
      
      debug('메시지 저장 완료:', data);
      
      // 로컬 캐시에도 저장 (오프라인 폴백을 위해)
      saveMessageLocally(messageData.room_id, data[0]);
      
      return { data, error: null, local: false };
    } catch (error) {
      debug('메시지 저장 오류:', error);
      
      // 로컬 ID 생성
      const localMessage = {
        ...messageData,
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString()
      };
      
      // 로컬에만 저장
      saveMessageLocally(messageData.room_id, localMessage);
      
      return {
        data: [localMessage],
        error,
        local: true
      };
    }
  }
  
  // 메시지 목록 가져오기
  async function getMessages(roomId, limit = 50) {
    await initialize();
    
    try {
      if (!connectionStatus.online) {
        debug('오프라인 모드: 로컬 메시지 사용');
        const localMessages = getLocalMessages(roomId);
        return {
          data: localMessages.slice(-limit),
          error: null,
          local: true
        };
      }
      
      debug('Supabase에서 메시지 가져오는 중...', roomId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      debug(`${data.length}개의 메시지 로드 완료`);
      
      // 로컬 캐시 업데이트
      data.forEach(message => saveMessageLocally(roomId, message));
      
      return { data, error: null, local: false };
    } catch (error) {
      debug('메시지 로드 오류:', error);
      
      // 오류 시 로컬 메시지 사용
      const localMessages = getLocalMessages(roomId);
      
      return {
        data: localMessages.slice(-limit),
        error,
        local: true
      };
    }
  }
  
  // 특정 시간 이후의 메시지 가져오기
  async function getNewMessages(roomId, timestamp) {
    await initialize();
    
    try {
      if (!connectionStatus.online) {
        debug('오프라인 모드: 새 메시지를 가져올 수 없음');
        return {
          data: [],
          error: null,
          local: true
        };
      }
      
      debug('새 메시지 가져오는 중...', roomId, timestamp);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .gt('created_at', timestamp)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      debug(`${data.length}개의 새 메시지 로드 완료`);
      
      // 로컬 캐시 업데이트
      data.forEach(message => saveMessageLocally(roomId, message));
      
      return { data, error: null, local: false };
    } catch (error) {
      debug('새 메시지 로드 오류:', error);
      return {
        data: [],
        error,
        local: true
      };
    }
  }
  
  // 공지사항 가져오기
  async function getAnnouncements(roomId, adminId) {
    await initialize();
    
    try {
      if (!connectionStatus.online) {
        debug('오프라인 모드: 로컬 공지사항 사용');
        
        // 로컬 메시지에서 공지사항 필터링
        const localMessages = getLocalMessages(roomId);
        const announcements = localMessages.filter(m => 
          m.user_id === adminId && m.isannouncement === true
        );
        
        return {
          data: announcements.length > 0 ? [announcements[announcements.length - 1]] : [],
          error: null,
          local: true
        };
      }
      
      debug('공지사항 가져오는 중...', roomId, adminId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', adminId)
        .eq('isannouncement', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      debug('공지사항 로드 완료:', data);
      
      return { data, error: null, local: false };
    } catch (error) {
      debug('공지사항 로드 오류:', error);
      
      // 로컬 메시지에서 공지사항 필터링
      const localMessages = getLocalMessages(roomId);
      const announcements = localMessages.filter(m => 
        m.user_id === adminId && m.isannouncement === true
      );
      
      return {
        data: announcements.length > 0 ? [announcements[announcements.length - 1]] : [],
        error,
        local: true
      };
    }
  }
  
  // Realtime 구독 설정
  function setupRealtimeSubscription(roomId, callback) {
    if (!connectionStatus.online) {
      debug('오프라인 모드: Realtime 구독 불가');
      return null;
    }
    
    debug('Realtime 구독 설정 중...', roomId);
    
    try {
      const channel = supabase
        .channel(`room:${roomId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        }, (payload) => {
          debug('새 메시지 수신:', payload);
          
          // 로컬 캐시에 저장
          saveMessageLocally(roomId, payload.new);
          
          // 콜백 호출
          if (typeof callback === 'function') {
            callback(payload.new);
          }
        })
        .subscribe((status) => {
          debug('Realtime 구독 상태:', status);
        });
      
      return channel;
    } catch (error) {
      debug('Realtime 구독 오류:', error);
      return null;
    }
  }
  
  // 공개 API
  window.dbService = {
    initialize,
    testConnection,
    getConnectionStatus: () => ({ ...connectionStatus }),
    createUser,
    saveMessage,
    getMessages,
    getNewMessages,
    getAnnouncements,
    setupRealtimeSubscription,
    getLocalMessages,
    saveLocalMessages
  };
})();