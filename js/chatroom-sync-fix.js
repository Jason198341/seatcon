/**
 * 모바일-웹 채팅방 목록 동기화 문제 해결 패치
 * - 모바일과 웹에서 다른 채팅방 목록이 표시되는 문제 해결
 * - 데이터베이스 연결 및 데이터 일관성 문제 수정
 */

(function() {
  console.log('[ChatRoomSyncFix] 모바일-웹 채팅방 목록 동기화 문제 패치 초기화...');

  // 글로벌 설정
  const CONFIG = {
    // 기본 Supabase 설정
    primaryURL: 'https://dolywnpcrutdxuxkozae.supabase.co',
    primaryKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
    
    // 백업 Supabase 설정
    backupURL: 'https://veudhigojdukbqfgjeyh.supabase.co',
    backupKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao',
    
    // 디버그 모드
    debug: true,
    
    // 채팅방 캐시 키
    roomsCacheKey: 'chatRoomsCache',
    
    // 캐시 만료 시간 (10분)
    cacheTTL: 10 * 60 * 1000
  };

  // 환경 확인
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  /**
   * 로깅 유틸리티
   */
  const logger = {
    log(message, data) {
      if (CONFIG.debug) {
        console.log(`[ChatRoomSyncFix] ${message}`, data || '');
      }
    },
    
    error(message, data) {
      if (CONFIG.debug) {
        console.error(`[ChatRoomSyncFix] ${message}`, data || '');
      }
    },
    
    warn(message, data) {
      if (CONFIG.debug) {
        console.warn(`[ChatRoomSyncFix] ${message}`, data || '');
      }
    },
    
    success(message) {
      if (CONFIG.debug) {
        console.log(`%c [ChatRoomSyncFix] ${message}`, 'color: green; font-weight: bold;');
      }
    }
  };

  /**
   * 채팅방 목록 캐시 관리
   */
  const roomsCache = {
    /**
     * 캐시에서 채팅방 목록 가져오기
     * @returns {Array|null} 채팅방 목록 또는 null
     */
    getCache() {
      try {
        const cacheData = localStorage.getItem(CONFIG.roomsCacheKey);
        
        if (!cacheData) {
          return null;
        }
        
        const cache = JSON.parse(cacheData);
        
        // 만료 확인
        if (cache.timestamp + CONFIG.cacheTTL < Date.now()) {
          logger.log('캐시가 만료되었습니다');
          localStorage.removeItem(CONFIG.roomsCacheKey);
          return null;
        }
        
        logger.log('캐시에서 채팅방 목록 로드:', cache.rooms.length);
        return cache.rooms;
      } catch (error) {
        logger.error('캐시 로드 중 오류:', error);
        return null;
      }
    },
    
    /**
     * 채팅방 목록을 캐시에 저장
     * @param {Array} rooms 채팅방 목록
     */
    setCache(rooms) {
      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        return;
      }
      
      try {
        const cacheData = {
          timestamp: Date.now(),
          rooms: rooms
        };
        
        localStorage.setItem(CONFIG.roomsCacheKey, JSON.stringify(cacheData));
        logger.log('채팅방 목록 캐시 저장:', rooms.length);
      } catch (error) {
        logger.error('캐시 저장 중 오류:', error);
      }
    },
    
    /**
     * 캐시 삭제
     */
    clearCache() {
      localStorage.removeItem(CONFIG.roomsCacheKey);
      logger.log('채팅방 목록 캐시 삭제됨');
    }
  };

  /**
   * 직접 Supabase 연결 및 쿼리 수행
   */
  const directSupabase = {
    /**
     * 기본 Supabase 클라이언트 생성
     * @returns {Object} Supabase 클라이언트
     */
    getPrimaryClient() {
      return supabase.createClient(CONFIG.primaryURL, CONFIG.primaryKey);
    },
    
    /**
     * 백업 Supabase 클라이언트 생성
     * @returns {Object} Supabase 클라이언트
     */
    getBackupClient() {
      return supabase.createClient(CONFIG.backupURL, CONFIG.backupKey);
    },
    
    /**
     * 두 URL에서 모두 채팅방 목록 가져오기 및 병합
     * @param {boolean} activeOnly 활성화된 채팅방만 가져올지 여부
     * @returns {Promise<Array>} 채팅방 목록
     */
    async fetchAllRooms(activeOnly = true) {
      logger.log('양쪽 Supabase에서 채팅방 목록 가져오기 시도');
      
      // 캐시 확인
      const cachedRooms = roomsCache.getCache();
      if (cachedRooms) {
        logger.success('캐시에서 채팅방 목록 반환');
        return cachedRooms;
      }
      
      let primaryRooms = [];
      let backupRooms = [];
      let errors = [];
      
      // 기본 URL에서 채팅방 가져오기
      try {
        const primaryClient = this.getPrimaryClient();
        let query = primaryClient.from('chatrooms').select('*');
        
        if (activeOnly) {
          query = query.eq('status', 'active');
        }
        
        const { data, error } = await query.order('created_at');
        
        if (error) {
          logger.error('기본 URL에서 채팅방 가져오기 오류:', error);
          errors.push({ source: 'primary', error });
        } else if (data) {
          primaryRooms = data;
          logger.success(`기본 URL에서 ${data.length}개 채팅방 가져옴`);
        }
      } catch (error) {
        logger.error('기본 URL 쿼리 중 예외 발생:', error);
        errors.push({ source: 'primary', error });
      }
      
      // 백업 URL에서 채팅방 가져오기
      try {
        const backupClient = this.getBackupClient();
        let query = backupClient.from('chatrooms').select('*');
        
        if (activeOnly) {
          query = query.eq('status', 'active');
        }
        
        const { data, error } = await query.order('created_at');
        
        if (error) {
          logger.error('백업 URL에서 채팅방 가져오기 오류:', error);
          errors.push({ source: 'backup', error });
        } else if (data) {
          backupRooms = data;
          logger.success(`백업 URL에서 ${data.length}개 채팅방 가져옴`);
        }
      } catch (error) {
        logger.error('백업 URL 쿼리 중 예외 발생:', error);
        errors.push({ source: 'backup', error });
      }
      
      // 결과 병합 (중복 제거)
      const allRooms = [...primaryRooms];
      const primaryIds = primaryRooms.map(room => room.id);
      
      // 백업에서 가져온 방 중 기본에 없는 것만 추가
      backupRooms.forEach(backupRoom => {
        if (!primaryIds.includes(backupRoom.id)) {
          allRooms.push(backupRoom);
        }
      });
      
      logger.log(`총 ${allRooms.length}개의 고유한 채팅방 발견`);
      
      // 결과 캐싱
      if (allRooms.length > 0) {
        roomsCache.setCache(allRooms);
      }
      
      // 양쪽 모두 실패했고 캐시도 없으면 기본 채팅방 제공
      if (allRooms.length === 0 && errors.length === 2) {
        logger.warn('양쪽 Supabase에서 채팅방을 가져오지 못함, 기본 채팅방 반환');
        
        const defaultRooms = [
          {
            id: 'default-room-1',
            name: '일반 채팅방',
            description: '모든 참가자를 위한 기본 채팅방',
            type: 'public',
            status: 'active',
            max_users: 100,
            created_at: new Date().toISOString()
          },
          {
            id: 'default-room-2',
            name: '컨퍼런스 채팅방',
            description: '발표자 질문 및 토론을 위한 채팅방',
            type: 'public',
            status: 'active',
            max_users: 200,
            created_at: new Date().toISOString()
          }
        ];
        
        return defaultRooms;
      }
      
      return allRooms;
    },
    
    /**
     * 특정 채팅방 정보 가져오기 (양쪽 시도)
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Object|null>} 채팅방 정보
     */
    async fetchRoom(roomId) {
      logger.log('채팅방 정보 가져오기:', roomId);
      
      if (!roomId) {
        logger.error('유효하지 않은 roomId');
        return null;
      }
      
      // 캐시에서 먼저 확인
      const cachedRooms = roomsCache.getCache();
      if (cachedRooms) {
        const cachedRoom = cachedRooms.find(room => room.id === roomId);
        if (cachedRoom) {
          logger.success('캐시에서 채팅방 정보 반환');
          return cachedRoom;
        }
      }
      
      // 기본 URL에서 시도
      try {
        const primaryClient = this.getPrimaryClient();
        const { data, error } = await primaryClient
          .from('chatrooms')
          .select('*')
          .eq('id', roomId)
          .single();
        
        if (!error && data) {
          logger.success('기본 URL에서 채팅방 정보 가져옴');
          return data;
        }
        
        logger.warn('기본 URL에서 채팅방을 찾을 수 없음, 백업 URL 시도');
      } catch (error) {
        logger.error('기본 URL에서 채팅방 정보 가져오기 오류:', error);
      }
      
      // 백업 URL에서 시도
      try {
        const backupClient = this.getBackupClient();
        const { data, error } = await backupClient
          .from('chatrooms')
          .select('*')
          .eq('id', roomId)
          .single();
        
        if (!error && data) {
          logger.success('백업 URL에서 채팅방 정보 가져옴');
          return data;
        }
        
        logger.error('양쪽 URL에서 채팅방을 찾을 수 없음:', roomId);
      } catch (error) {
        logger.error('백업 URL에서 채팅방 정보 가져오기 오류:', error);
      }
      
      return null;
    },
    
    /**
     * 채팅방 접근 권한 확인
     * @param {string} roomId 채팅방 ID
     * @param {string} accessCode 접근 코드 (비공개 채팅방)
     * @returns {Promise<{success: boolean, message: string}>} 접근 결과
     */
    async validateRoomAccess(roomId, accessCode = null) {
      logger.log('채팅방 접근 권한 확인:', roomId);
      
      if (!roomId) {
        return { success: false, message: 'invalid-room-id' };
      }
      
      // 채팅방 정보 가져오기
      const room = await this.fetchRoom(roomId);
      
      if (!room) {
        return { success: false, message: 'room-not-found' };
      }
      
      if (room.status !== 'active') {
        return { success: false, message: 'room-closed' };
      }
      
      // 비공개 채팅방 접근 코드 검증
      if (room.type === 'private') {
        if (!accessCode || accessCode !== room.access_code) {
          return { success: false, message: 'incorrect-code' };
        }
      }
      
      return { success: true, message: 'access-granted' };
    }
  };

  /**
   * 패치 모듈 초기화
   */
  function initialize() {
    logger.log('모바일-웹 채팅방 목록 동기화 패치 초기화 중...');
    
    try {
      // Supabase 라이브러리 확인
      if (typeof supabase === 'undefined') {
        logger.error('Supabase 라이브러리를 찾을 수 없습니다.');
        setTimeout(initialize, 1000); // 1초 후 다시 시도
        return;
      }
      
      // dbService 패치
      patchDbService();
      
      // UI 패치
      patchUIManager();
      
      // 이벤트 리스너 설정
      setupEventListeners();
      
      logger.success('모바일-웹 채팅방 목록 동기화 패치 초기화 완료!');
    } catch (error) {
      logger.error('패치 초기화 중 오류 발생:', error);
    }
  }

  /**
   * dbService 패치
   */
  function patchDbService() {
    if (typeof dbService === 'undefined') {
      logger.error('dbService를 찾을 수 없습니다.');
      return;
    }
    
    logger.log('dbService 패치 적용 중...');
    
    // 1. getChatRooms 함수 패치
    const originalGetChatRooms = dbService.getChatRooms;
    dbService.getChatRooms = async function(activeOnly = false) {
      logger.log('패치된 getChatRooms 호출:', { activeOnly });
      
      try {
        // 캐시 확인
        const cachedRooms = roomsCache.getCache();
        if (cachedRooms) {
          // activeOnly 필터링
          if (activeOnly) {
            const activeRooms = cachedRooms.filter(room => room.status === 'active');
            return activeRooms;
          }
          return cachedRooms;
        }
        
        // 직접 양쪽 Supabase에서 채팅방 가져오기
        const rooms = await directSupabase.fetchAllRooms(activeOnly);
        
        if (rooms && rooms.length > 0) {
          return rooms;
        }
        
        // 직접 가져오기 실패 시 원본 함수 시도
        logger.log('직접 가져오기 실패, 원본 함수 시도');
        const originalResult = await originalGetChatRooms.call(this, activeOnly);
        
        if (originalResult && originalResult.length > 0) {
          // 결과가 있으면 캐시 업데이트
          roomsCache.setCache(originalResult);
          return originalResult;
        }
        
        // 모든 시도 실패 시 기본 채팅방 제공
        logger.warn('모든 시도 실패, 기본 채팅방 반환');
        return [
          {
            id: 'default-room-1',
            name: '일반 채팅방',
            description: '모든 참가자를 위한 기본 채팅방',
            type: 'public',
            status: 'active',
            max_users: 100,
            created_at: new Date().toISOString()
          },
          {
            id: 'default-room-2',
            name: '컨퍼런스 채팅방',
            description: '발표자 질문 및 토론을 위한 채팅방',
            type: 'public',
            status: 'active',
            max_users: 200,
            created_at: new Date().toISOString()
          }
        ];
      } catch (error) {
        logger.error('패치된 getChatRooms 중 오류:', error);
        
        // 오류 발생 시 원본 함수 시도
        try {
          return await originalGetChatRooms.call(this, activeOnly);
        } catch (fallbackError) {
          logger.error('원본 getChatRooms 중 오류:', fallbackError);
          return [];
        }
      }
    };
    
    // 2. getChatRoom 함수 패치
    const originalGetChatRoom = dbService.getChatRoom;
    dbService.getChatRoom = async function(roomId) {
      logger.log('패치된 getChatRoom 호출:', roomId);
      
      if (!roomId) {
        logger.error('유효하지 않은 roomId');
        return null;
      }
      
      try {
        // 직접 양쪽 Supabase에서 채팅방 정보 가져오기
        const room = await directSupabase.fetchRoom(roomId);
        
        if (room) {
          return room;
        }
        
        // 직접 가져오기 실패 시 원본 함수 시도
        logger.log('직접 가져오기 실패, 원본 함수 시도');
        return await originalGetChatRoom.call(this, roomId);
      } catch (error) {
        logger.error('패치된 getChatRoom 중 오류:', error);
        
        // 오류 발생 시 원본 함수 시도
        try {
          return await originalGetChatRoom.call(this, roomId);
        } catch (fallbackError) {
          logger.error('원본 getChatRoom 중 오류:', fallbackError);
          return null;
        }
      }
    };
    
    // 3. validateRoomAccess 함수 패치
    const originalValidateRoomAccess = dbService.validateRoomAccess;
    dbService.validateRoomAccess = async function(roomId, accessCode = null) {
      logger.log('패치된 validateRoomAccess 호출:', roomId);
      
      if (!roomId) {
        return { success: false, message: 'invalid-room-id' };
      }
      
      try {
        // 직접 접근 권한 확인
        const result = await directSupabase.validateRoomAccess(roomId, accessCode);
        
        if (result.success) {
          return result;
        }
        
        // room-not-found 오류 시 원본 함수 시도
        if (result.message === 'room-not-found') {
          logger.log('직접 접근 확인 실패, 원본 함수 시도');
          return await originalValidateRoomAccess.call(this, roomId, accessCode);
        }
        
        return result;
      } catch (error) {
        logger.error('패치된 validateRoomAccess 중 오류:', error);
        
        // 오류 발생 시 원본 함수 시도
        try {
          return await originalValidateRoomAccess.call(this, roomId, accessCode);
        } catch (fallbackError) {
          logger.error('원본 validateRoomAccess 중 오류:', fallbackError);
          return { success: false, message: 'validation-error' };
        }
      }
    };
    
    // 4. initialize 함수 패치
    const originalInitialize = dbService.initialize;
    dbService.initialize = async function() {
      logger.log('패치된 dbService.initialize 호출');
      
      try {
        // 원본 초기화 함수 호출
        const result = await originalInitialize.call(this);
        
        if (result) {
          // 초기화 성공 후 채팅방 목록 미리 로드하여 캐싱
          const rooms = await directSupabase.fetchAllRooms(true);
          
          if (rooms && rooms.length > 0) {
            logger.success('채팅방 목록 사전 로드 및 캐싱 완료');
          }
        }
        
        return result;
      } catch (error) {
        logger.error('패치된 initialize 중 오류:', error);
        
        // Supabase 클라이언트 생성 시도
        try {
          this.supabase = supabase.createClient(CONFIG.primaryURL, CONFIG.primaryKey);
          this.initialized = true;
          
          if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange(true);
          }
          
          logger.success('대체 Supabase 클라이언트 생성 성공');
          return true;
        } catch (fallbackError) {
          logger.error('대체 Supabase 클라이언트 생성 실패:', fallbackError);
          return false;
        }
      }
    };
    
    logger.success('dbService 패치 적용 완료');
  }

  /**
   * UI 관리자 패치
   */
  function patchUIManager() {
    if (typeof uiManager === 'undefined') {
      logger.error('uiManager를 찾을 수 없습니다.');
      return;
    }
    
    logger.log('uiManager 패치 적용 중...');
    
    // loadChatRooms 함수 패치
    const originalLoadChatRooms = uiManager.loadChatRooms;
    uiManager.loadChatRooms = async function() {
      logger.log('패치된 loadChatRooms 호출');
      
      try {
        const select = document.getElementById('chat-room-select');
        
        if (!select) {
          logger.error('chat-room-select 요소를 찾을 수 없습니다.');
          return;
        }
        
        // 로딩 표시
        select.innerHTML = `<option value="" disabled selected>${i18nService.translate('loading-rooms')}</option>`;
        
        // 직접 채팅방 목록 로드 시도
        let rooms = await directSupabase.fetchAllRooms(true);
        
        if (!rooms || rooms.length === 0) {
          logger.warn('직접 로드 실패, 원본 함수 시도');
          
          try {
            // 원본 함수 호출 시도
            await originalLoadChatRooms.call(this);
            return;
          } catch (fallbackError) {
            logger.error('원본 loadChatRooms 중 오류:', fallbackError);
            
            // dbService 직접 사용
            rooms = await dbService.getChatRooms(true);
          }
        }
        
        // 채팅방 목록이 있으면 옵션 생성
        if (rooms && rooms.length > 0) {
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
          select.selectedIndex = 0;
          
          // 선택된 채팅방 유형에 따라 접근 코드 필드 표시/숨김
          const selectedOption = select.options[0];
          const roomType = selectedOption ? selectedOption.dataset.type : null;
          const codeContainer = document.getElementById('private-room-code-container');
          
          if (codeContainer && roomType) {
            if (roomType === 'private') {
              codeContainer.classList.remove('hidden');
            } else {
              codeContainer.classList.add('hidden');
            }
          }
          
          logger.success('채팅방 목록 로드 및 표시 완료');
        } else {
          // 채팅방 목록이 없으면 메시지 표시
          select.innerHTML = `<option value="" disabled selected>채팅방을 찾을 수 없습니다</option>`;
          logger.error('채팅방 목록을 로드할 수 없습니다.');
        }
      } catch (error) {
        logger.error('패치된 loadChatRooms 중 오류:', error);
        
        // 오류 발생 시 원본 함수 시도
        try {
          await originalLoadChatRooms.call(this);
        } catch (fallbackError) {
          logger.error('원본 loadChatRooms 중 오류:', fallbackError);
          
          // 최후의 수단: 기본 옵션 설정
          const select = document.getElementById('chat-room-select');
          
          if (select) {
            select.innerHTML = `
              <option value="default-room-1" data-type="public">일반 채팅방</option>
              <option value="default-room-2" data-type="public">컨퍼런스 채팅방</option>
            `;
          }
        }
      }
    };
    
    // handleLogin 함수 패치
    const originalHandleLogin = uiManager.handleLogin;
    uiManager.handleLogin = async function() {
      logger.log('패치된 handleLogin 호출');
      
      try {
        const username = document.getElementById('username').value.trim();
        const roomId = document.getElementById('chat-room-select').value;
        const roomCode = document.getElementById('room-code') ? document.getElementById('room-code').value.trim() : '';
        
        if (!username) {
          alert(i18nService.translate('enter-username'));
          return;
        }
        
        if (!roomId) {
          alert(i18nService.translate('select-room'));
          return;
        }
        
        logger.log('로그인 시도:', { username, roomId });
        
        // 채팅방 접근 권한 확인
        const accessResult = await directSupabase.validateRoomAccess(roomId, roomCode);
        
        if (!accessResult.success) {
          logger.error('접근 권한 확인 실패:', accessResult.message);
          
          if (accessResult.message === 'room-not-found') {
            alert('선택한 채팅방을 찾을 수 없습니다. 다른 채팅방을 선택해주세요.');
          } else if (accessResult.message === 'incorrect-code') {
            alert('입장 코드가 올바르지 않습니다.');
          } else if (accessResult.message === 'room-closed') {
            alert('이 채팅방은 현재 닫혀 있습니다.');
          } else {
            alert(i18nService.translate(accessResult.message));
          }
          
          return;
        }
        
        // 원본 함수 호출
        await originalHandleLogin.call(this);
        
      } catch (error) {
        logger.error('패치된 handleLogin 중 오류:', error);
        
        // 오류 발생 시 원본 함수 시도
        try {
          await originalHandleLogin.call(this);
        } catch (fallbackError) {
          logger.error('원본 handleLogin 중 오류:', fallbackError);
          alert('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    };
    
    logger.success('uiManager 패치 적용 완료');
  }

  /**
   * 이벤트 리스너 설정
   */
  function setupEventListeners() {
    logger.log('이벤트 리스너 설정 중...');
    
    // 모바일 환경에서 추가 처리
    if (isMobile) {
      logger.log('모바일 환경 감지됨, 추가 최적화 적용');
      
      // 채팅방 선택 처리
      const roomSelect = document.getElementById('chat-room-select');
      
      if (roomSelect) {
        roomSelect.addEventListener('change', async function() {
          try {
            const selectedId = this.value;
            
            if (!selectedId) return;
            
            logger.log('채팅방 선택됨:', selectedId);
            
            // 채팅방 정보 미리 로드 (오류 방지)
            const roomInfo = await dbService.getChatRoom(selectedId);
            
            logger.log('선택된 채팅방 정보:', roomInfo);
            
            // 비공개 채팅방 접근 코드 필드 표시/숨김
            const codeContainer = document.getElementById('private-room-code-container');
            
            if (codeContainer) {
              if (roomInfo && roomInfo.type === 'private') {
                codeContainer.classList.remove('hidden');
              } else {
                codeContainer.classList.add('hidden');
              }
            }
          } catch (error) {
            logger.error('채팅방 선택 처리 중 오류:', error);
          }
        });
      }
    }
    
    // 로그인 버튼 클릭 시 캐시 새로고침
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
      const submitButton = loginForm.querySelector('[type="submit"]');
      
      if (submitButton) {
        submitButton.addEventListener('click', function() {
          // 캐시 만료 설정 (강제 새로고침을 위해)
          roomsCache.clearCache();
        });
      }
    }
    
    // 페이지 로드 직후 캐시 새로고침 및 채팅방 목록 로드
    document.addEventListener('DOMContentLoaded', async function() {
      // 기존 캐시가 아주 오래된 경우 삭제
      const cacheData = localStorage.getItem(CONFIG.roomsCacheKey);
      
      if (cacheData) {
        try {
          const cache = JSON.parse(cacheData);
          const oneHour = 60 * 60 * 1000;
          
          if (cache.timestamp + oneHour < Date.now()) {
            logger.log('오래된 캐시 삭제 (1시간 이상)');
            roomsCache.clearCache();
          }
        } catch (error) {
          logger.error('캐시 확인 중 오류:', error);
          roomsCache.clearCache();
        }
      }
      
      // 채팅방 목록 미리 로드
      if (typeof dbService !== 'undefined' && dbService.getChatRooms) {
        try {
          logger.log('페이지 로드 시 채팅방 목록 사전 로드');
          const rooms = await dbService.getChatRooms(true);
          
          if (rooms && rooms.length > 0) {
            logger.success('채팅방 목록 사전 로드 완료:', rooms.length);
          }
        } catch (error) {
          logger.error('채팅방 목록 사전 로드 중 오류:', error);
        }
      }
    });
    
    logger.success('이벤트 리스너 설정 완료');
  }

  // 초기화 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

console.log('[ChatRoomSyncFix] 모바일-웹 채팅방 목록 동기화 문제 해결 패치 로드됨');
