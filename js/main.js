// main.js - Global SeatCon 2025
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  
  // Supabase 클라이언트 초기화
  const supabase = window.supabase.createClient(
    window.appConfig.getSupabaseUrl(),
    window.appConfig.getSupabaseKey()
  );
  
  // UI 요소
  let loginContainer, chatContainer, loginForm, messagesContainer, messageInput, 
      sendButton, userCountElement, targetLanguageSelect, refreshButton, 
      logoutButton, replyPopover, cancelReplyButton, replyUsername, 
      replyContent, announcementsContainer;
  
  // DOM 요소 초기화
  function initializeUI() {
    loginContainer = document.getElementById('login-container');
    chatContainer = document.getElementById('chat-container');
    loginForm = document.getElementById('login-form');
    messagesContainer = document.getElementById('messages-container');
    messageInput = document.getElementById('message-input');
    sendButton = document.getElementById('send-button');
    userCountElement = document.getElementById('user-count');
    targetLanguageSelect = document.getElementById('target-language');
    refreshButton = document.getElementById('refresh-button');
    logoutButton = document.getElementById('logout-button');
    replyPopover = document.getElementById('reply-popover');
    cancelReplyButton = document.getElementById('cancel-reply');
    replyUsername = document.getElementById('reply-username');
    replyContent = document.getElementById('reply-content');
    announcementsContainer = document.getElementById('announcements-container');
  }
  
  // 초기화 함수 호출
  initializeUI();
  
  // 애플리케이션 상태
  const state = {
    currentUser: null,
    currentRoom: 'general',
    targetLanguage: window.appConfig.getAppConfig().defaultLanguage,
    replyingToMessage: null,
    lastMessageTimestamp: null,
    currentChannel: null,
    pollingTimer: null,
    translationCache: {}
  };

  // 디버그 모드
  const DEBUG = window.appConfig.isDebugMode();
  const ADMIN_ID = window.appConfig.getAppConfig().adminId;
  
  /**
   * 디버그 로그
   */
  function debug(...args) {
    if (DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  }
  
  /**
   * 애플리케이션 초기화
   */
  async function initializeApp() {
    // 저장된 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('preferred_language') || window.appConfig.getAppConfig().defaultLanguage;
    state.targetLanguage = savedLanguage;
    
    // 언어 선택기 설정
    document.querySelectorAll('.language-selector').forEach(select => {
      select.value = savedLanguage;
    });
    
    // i18n 언어 변경
    window.i18n.changeLanguage(savedLanguage);
    
    // 저장된 세션이 있으면 자동 로그인
    const savedUser = restoreSession();
    if (savedUser) {
      try {
        // 사용자 정보 설정
        state.currentUser = savedUser;
        
        // 채팅방 자동 연결
        state.currentRoom = savedUser.roomId || window.appConfig.getAppConfig().defaultRoom;
        
        // 이전 메시지 로드
        await loadMessages();
        
        // 공지사항 가져오기
        await fetchAnnouncements();
        
        // 실시간 업데이트 설정
        setupRealtimeUpdates();
        
        // 화면 전환
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
      } catch (error) {
        console.error('세션 복원 오류:', error);
        showLoginForm();
      }
    } else {
      showLoginForm();
    }
  }
  
  /**
   * 세션 복원
   */
  function restoreSession() {
    try {
      const savedUser = localStorage.getItem('chat_current_user');
      const savedLanguage = localStorage.getItem('preferred_language');
      
      if (savedUser) {
        const user = JSON.parse(savedUser);
        
        // 언어 정보 업데이트
        if (savedLanguage && savedLanguage !== user.preferred_language) {
          user.preferred_language = savedLanguage;
        }
        
        debug('세션 복원 완료:', user);
        return user;
      }
    } catch (error) {
      debug('세션 복원 오류:', error);
      localStorage.removeItem('chat_current_user');
    }
    
    return null;
  }
  
  /**
   * 로그인 폼 표시
   */
  function showLoginForm() {
    loginContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
  }
  
  /**
   * 로그인 폼 제출 처리
   */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const language = document.getElementById('language').value;
    const roomId = document.getElementById('room-id').value.trim() || window.appConfig.getAppConfig().defaultRoom;
    
    if (!username) return;
    
    try {
      // 언어 설정 변경
      window.i18n.changeLanguage(language);
      targetLanguageSelect.value = language;
      state.targetLanguage = language;
      
      // 사용자 ID 생성
      const userId = username === ADMIN_ID ? ADMIN_ID : 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
      debug('사용자 ID 생성:', userId);
      
      // Supabase에 사용자 저장
      debug('Supabase에 사용자 저장 중...');
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: userId,
            username: username,
            preferred_language: language,
            created_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          debug('사용자 저장 오류:', error);
          throw error;
        }
        
        debug('사용자 저장 완료:', data);
      } catch (error) {
        debug('사용자 저장 무시 (테이블이 없거나 접근 권한 없음):', error);
      }
      
      // 사용자 정보 저장
      state.currentUser = {
        id: userId,
        username,
        language,
        roomId
      };
      
      // LocalStorage에 사용자 정보 저장
      localStorage.setItem('chat_current_user', JSON.stringify(state.currentUser));
      localStorage.setItem('preferred_language', language);
      
      // 채팅방 설정
      state.currentRoom = roomId;
      
      // 타겟 언어 설정
      state.targetLanguage = language;
      targetLanguageSelect.value = language;
      
      // 이전 메시지 로드
      await loadMessages();
      
      // 공지사항 가져오기
      await fetchAnnouncements();
      
      // 실시간 업데이트 설정
      setupRealtimeUpdates();
      
      // 시스템 메시지 추가
      const joinMessageKey = 'system.user_joined';
      const joinMessage = window.i18n.translate(joinMessageKey, { username });
      addSystemMessage(joinMessage);
      
      // 화면 전환
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
      
      // 오류 발생 시 로컬 모드로 폴백
      debug('로컬 모드로 전환');
      const userId = username === ADMIN_ID ? ADMIN_ID : 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
      state.currentUser = {
        id: userId,
        username,
        language,
        roomId
      };
      
      localStorage.setItem('chat_current_user', JSON.stringify(state.currentUser));
      localStorage.setItem('preferred_language', language);
      
      state.currentRoom = roomId;
      state.targetLanguage = language;
      targetLanguageSelect.value = language;
      
      loadLocalMessages();
      
      const joinMessageKey = 'system.user_joined';
      const joinMessage = window.i18n.translate(joinMessageKey, { username });
      addSystemMessage(joinMessage + ' (로컬 모드)');
      
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    }
  });
  
  /**
   * Supabase Realtime 구독 설정
   */
  function setupRealtimeSubscription() {
    debug('Realtime 구독 설정 중...', state.currentRoom);
    
    // 이전 구독이 있으면 해제
    if (state.currentChannel) {
      debug('이전 구독 해제');
      state.currentChannel.unsubscribe();
    }
    
    try {
      // 새 채널 구독
      state.currentChannel = supabase
        .channel(`room:${state.currentRoom}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `room_id=eq.${state.currentRoom}`
        }, (payload) => {
          // 새 메시지가 수신되면 화면에 표시 (자신이 보낸 메시지는 제외)
          debug('새 메시지 수신:', payload);
          const message = payload.new;
          if (message.user_id !== state.currentUser.id) {
            displayMessage(message);
            
            // 관리자 메시지면 공지사항으로 처리
            if (message.user_id === ADMIN_ID && message.isannouncement) {
              addAnnouncement(message);
            }
            
            scrollToBottom();
          }
        })
        .subscribe((status) => {
          debug('Realtime 구독 상태:', status);
          if (status === 'SUBSCRIBED') {
            showStatus(window.i18n.translate('status.connected'));
          } else if (status === 'CHANNEL_ERROR') {
            showStatus(window.i18n.translate('status.connection_error'), true);
            // Realtime 연결이 안되면 폴링 방식으로 전환
            startPolling();
          }
        });
    } catch (error) {
      debug('Realtime 구독 오류:', error);
      showStatus(window.i18n.translate('status.connection_error'), true);
      // 오류 발생 시 폴링 방식으로 전환
      startPolling();
    }
  }
  
  /**
   * 폴링 방식으로 메시지 가져오기 시작
   */
  function startPolling() {
    debug('폴링 방식으로 메시지 가져오기 시작');
    
    // 기존 타이머가 있으면 정리
    if (state.pollingTimer) {
      clearInterval(state.pollingTimer);
    }
    
    // 마지막 메시지 타임스탬프가 없으면 현재 시간 기준으로 설정
    if (!state.lastMessageTimestamp) {
      state.lastMessageTimestamp = new Date().toISOString();
    }
    
    // 주기적으로 새 메시지 확인
    state.pollingTimer = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', state.currentRoom)
          .gt('created_at', state.lastMessageTimestamp)
          .order('created_at', { ascending: true });
        
        if (error) {
          debug('폴링 오류:', error);
          return;
        }
        
        if (data && data.length > 0) {
          debug(`새 메시지 ${data.length}개 가져옴`);
          
          // 메시지 표시
          data.forEach(message => {
            // 내가 보낸 메시지는 이미 표시되었으므로 제외
            if (message.user_id !== state.currentUser.id) {
              displayMessage(message);
              
              // 관리자 메시지면 공지사항으로 처리
              if (message.user_id === ADMIN_ID && message.isannouncement) {
                addAnnouncement(message);
              }
            }
          });
          
          // 마지막 메시지 타임스탬프 업데이트
          state.lastMessageTimestamp = data[data.length - 1].created_at;
          
          // 스크롤을 최하단으로
          scrollToBottom();
        }
      } catch (error) {
        debug('폴링 중 오류 발생:', error);
      }
    }, window.appConfig.getAppConfig().pollingInterval);
  }
  
  /**
   * 실시간 업데이트 설정
   */
  function setupRealtimeUpdates() {
    // 1. Supabase Realtime 구독 설정
    setupRealtimeSubscription();
    
    // 2. 폴링 방식 설정 (백업)
    startPolling();
  }
  
  /**
   * 이전 메시지 로드 (Supabase)
   */
  async function loadMessages() {
    try {
      debug('메시지 로드 중...', state.currentRoom);
      // Supabase에서 메시지 가져오기
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', state.currentRoom)
        .order('created_at', { ascending: true });
      
      if (error) {
        debug('메시지 로드 오류:', error);
        throw error;
      }
      
      debug(`${data.length}개의 메시지 로드 완료`);
      
      // 메시지 표시
      messagesContainer.innerHTML = '';
      data.forEach(message => {
        displayMessage(message);
      });
      
      // 마지막 메시지 타임스탬프 설정
      if (data.length > 0) {
        state.lastMessageTimestamp = data[data.length - 1].created_at;
      } else {
        state.lastMessageTimestamp = new Date().toISOString();
      }
      
      // 스크롤을 최하단으로
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      
      // 오류 발생 시 로컬 메시지 사용
      debug('로컬 메시지 사용');
      loadLocalMessages();
      
      // 사용자에게 알림
      showStatus('메시지를 불러오는 중 오류가 발생했습니다. 로컬 메시지를 표시합니다.', true);
    }
  }
  
  /**
   * 공지사항 가져오기
   */
  async function fetchAnnouncements() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', state.currentRoom)
        .eq('user_id', ADMIN_ID)
        .eq('isannouncement', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        debug('공지사항 오류:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        addAnnouncement(data[0]);
      }
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
    }
  }
  
  /**
   * 새로운 메시지 수동으로 확인
   */
  async function checkNewMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', state.currentRoom)
        .gt('created_at', state.lastMessageTimestamp)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const message = window.i18n.translate('status.new_messages', { count: data.length });
        showStatus(message);
        
        // 메시지 표시
        data.forEach(message => {
          // 내가 보낸 메시지는 이미 표시되었으므로 제외
          if (message.user_id !== state.currentUser.id) {
            displayMessage(message);
            
            // 관리자 메시지면 공지사항으로 처리
            if (message.user_id === ADMIN_ID && message.isannouncement) {
              addAnnouncement(message);
            }
          }
        });
        
        // 마지막 메시지 타임스탬프 업데이트
        state.lastMessageTimestamp = data[data.length - 1].created_at;
        
        // 스크롤을 최하단으로
        scrollToBottom();
      } else {
        showStatus(window.i18n.translate('status.no_new_messages'));
      }
    } catch (error) {
      console.error('메시지 새로고침 오류:', error);
      showStatus('새로고침 중 오류가 발생했습니다.', true);
    }
  }
  
  /**
   * 로컬 메시지 관련 함수
   */
  function getLocalMessages() {
    const messagesJson = localStorage.getItem(`chat_messages_${state.currentRoom}`);
    return messagesJson ? JSON.parse(messagesJson) : [];
  }
  
  function saveLocalMessages(messages) {
    localStorage.setItem(`chat_messages_${state.currentRoom}`, JSON.stringify(messages));
  }
  
  function loadLocalMessages() {
    const messages = getLocalMessages();
    
    // 메시지 표시
    messagesContainer.innerHTML = '';
    messages.forEach(message => {
      displayMessage(message);
    });
    
    // 스크롤을 최하단으로
    scrollToBottom();
  }
  
  /**
   * 상태 메시지 표시
   */
  function showStatus(message, isError = false) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${isError ? 'error' : 'success'}`;
    statusDiv.textContent = message;
    
    messagesContainer.appendChild(statusDiv);
    
    setTimeout(() => {
      if (statusDiv && statusDiv.parentNode) {
        statusDiv.remove();
      }
    }, 5000);
    
    scrollToBottom();
  }
  
  /**
   * 시스템 메시지 추가
   */
  function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system');
    messageElement.innerHTML = `<div class="message-content">${message}</div>`;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }
  
  /**
   * 공지사항 추가
   */
  function addAnnouncement(message) {
    // 이미 표시된 공지사항은 다시 추가하지 않음
    if (document.querySelector(`.announcement[data-id="${message.id}"]`)) {
      return;
    }
    
    announcementsContainer.innerHTML = ''; // 이전 공지사항 제거
    
    const announcementElement = document.createElement('div');
    announcementElement.classList.add('announcement');
    announcementElement.dataset.id = message.id;
    
    announcementElement.innerHTML = `
      <div class="announcement-icon">
        <i class="fas fa-bullhorn"></i>
      </div>
      <div class="announcement-content">
        <h3>${window.i18n.translate('announcement.title')}</h3>
        <div class="announcement-text">${message.message}</div>
      </div>
    `;
    
    announcementsContainer.appendChild(announcementElement);
    announcementsContainer.classList.remove('hidden');
  }
  
  /**
   * 메시지 전송
   */
  async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
      debug('메시지 전송 중...', message);
      
      // 공지사항 여부 확인 (관리자만 가능)
      const isAnnouncement = state.currentUser.id === ADMIN_ID && 
                           message.startsWith(window.appConfig.getAppConfig().announcementTag);
      
      // 메시지 객체 생성
      const messageObj = {
        room_id: state.currentRoom,
        user_id: state.currentUser.id,
        username: state.currentUser.username,
        message: isAnnouncement ? message.substring(window.appConfig.getAppConfig().announcementTag.length) : message,
        language: state.currentUser.language,
        created_at: new Date().toISOString(),
        isannouncement: isAnnouncement
      };
      
      // 답장 정보 추가
      if (state.replyingToMessage) {
        messageObj.reply_to = {
          id: state.replyingToMessage.id,
          username: state.replyingToMessage.username,
          message: state.replyingToMessage.message
        };
      }
      
      // Supabase에 메시지 저장
      const { data, error } = await supabase
        .from('messages')
        .insert(messageObj)
        .select();
      
      if (error) {
        debug('메시지 저장 오류:', error);
        debug('오류 메시지:', error.message);
        debug('오류 세부정보:', error.details);
        throw error;
      }
      
      debug('메시지 저장 완료:', data);
      
      // 내가 보낸 메시지 표시
      displayMessage(data[0]);
      
      // 공지사항이면 공지사항 영역에 추가
      if (isAnnouncement) {
        addAnnouncement(data[0]);
      }
      
      // 입력창 초기화
      messageInput.value = '';
      
      // 답장 모드 취소
      if (state.replyingToMessage) {
        replyPopover.classList.add('hidden');
        state.replyingToMessage = null;
      }
      
      // 스크롤을 최하단으로
      scrollToBottom();
      
      // 마지막 메시지 타임스탬프 업데이트
      state.lastMessageTimestamp = data[0].created_at;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // 오류 발생 시 로컬에만 저장
      debug('로컬에 메시지 저장');
      
      // 메시지 객체 생성
      const localMessage = {
        id: `local_${Date.now()}`,
        room_id: state.currentRoom,
        user_id: state.currentUser.id,
        username: state.currentUser.username,
        message: message,
        language: state.currentUser.language,
        created_at: new Date().toISOString(),
        isannouncement: false
      };
      
      // 답장 정보 추가
      if (state.replyingToMessage) {
        localMessage.reply_to = {
          id: state.replyingToMessage.id,
          username: state.replyingToMessage.username,
          message: state.replyingToMessage.message
        };
        
        // 답장 모드 취소
        replyPopover.classList.add('hidden');
        state.replyingToMessage = null;
      }
      
      // 로컬 메시지 저장
      const messages = getLocalMessages();
      messages.push(localMessage);
      saveLocalMessages(messages);
      
      // 메시지 표시
      displayMessage(localMessage);
      
      // 입력창 초기화
      messageInput.value = '';
      
      // 스크롤을 최하단으로
      scrollToBottom();
      
      // 사용자에게 알림
      showStatus('메시지 전송 중 오류가 발생했습니다. 로컬에만 저장됩니다.', true);
    }
  }
  
  /**
   * 텍스트 번역
   */
  async function translateText(text, targetLanguage) {
    // 캐시 키 생성
    const cacheKey = `${text}_${targetLanguage}`;
    
    // 캐시 확인
    if (state.translationCache[cacheKey]) {
      debug('캐시에서 번역 사용');
      return state.translationCache[cacheKey];
    }
    
    try {
      debug('번역 요청 중...', text.substring(0, 20) + '...', targetLanguage);
      
      const response = await fetch(`${window.appConfig.getTranslateEndpoint()}?key=${window.appConfig.getTranslateApiKey()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage
        })
      });
      
      const data = await response.json();
      
      if (data.data && data.data.translations && data.data.translations.length > 0) {
        const translatedText = data.data.translations[0].translatedText;
        
        // 캐시에 저장
        state.translationCache[cacheKey] = translatedText;
        
        return translatedText;
      }
      
      throw new Error('번역 실패: 응답에 번역 결과가 없습니다.');
    } catch (error) {
      debug('번역 오류:', error);
      return text; // 오류 발생 시 원본 텍스트 반환
    }
  }
  
  /**
   * 메시지 번역
   */
  async function translateMessage(message, targetLanguage) {
    if (message.language === targetLanguage) {
      return {
        ...message,
        translatedMessage: message.message
      };
    }
    
    try {
      const translatedText = await translateText(message.message, targetLanguage);
      return {
        ...message,
        translatedMessage: translatedText
      };
    } catch (error) {
      console.error('Error translating message:', error);
      return {
        ...message,
        translatedMessage: window.i18n.translate('message.translation_failed')
      };
    }
  }
  
  /**
   * 메시지 표시
   */
  function displayMessage(message) {
    // 이미 표시된 메시지인지 확인 (중복 방지)
    if (document.querySelector(`.message[data-id="${message.id}"]`)) {
      return;
    }
    
    debug('메시지 표시:', message);
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // 시스템 메시지인 경우
    if (message.user_id === 'system') {
      messageElement.classList.add('system');
      messageElement.innerHTML = `<div class="message-content">${message.message}</div>`;
    } else {
      // 일반 메시지
      if (message.user_id === state.currentUser.id) {
        messageElement.classList.add('self');
      } else if (message.user_id === ADMIN_ID) {
        messageElement.classList.add('admin');
      } else {
        messageElement.classList.add('other');
      }
      
      // 기본 메시지 구조
      let messageHtml = `<div class="message-bubble">`;
      
      // 답장이 있는 경우
      if (message.reply_to) {
        messageHtml += `
          <div class="replied-message">
            <div class="replied-username">${message.reply_to.username}</div>
            <div class="replied-content">${message.reply_to.message}</div>
          </div>
        `;
      }
      
      // 메시지 헤더
      messageHtml += `
        <div class="message-header">
          <span class="username">${message.username}`;
      
      // 관리자 배지
      if (message.user_id === ADMIN_ID) {
        messageHtml += `<span class="admin-badge">${window.i18n.translate('message.admin')}</span>`;
      }
      
      messageHtml += `</span>
          <span class="timestamp">${formatTimestamp(message.created_at)}</span>
        </div>
        <div class="message-content">${message.message}</div>
      `;
      
      // 메시지 액션 버튼 (다른 사람의 메시지에 대한 회신 기능)
      if (message.user_id !== state.currentUser.id) {
        messageHtml += `
          <div class="message-actions">
            <button class="message-action-button reply-button" title="${window.i18n.translate('button.reply')}">
              <i class="fas fa-reply"></i>
            </button>
          </div>
        `;
      }
      
      messageHtml += `</div>`;
      
      // HTML 설정
      messageElement.innerHTML = messageHtml;
      
      // 회신 버튼 이벤트 설정
      const replyButton = messageElement.querySelector('.reply-button');
      if (replyButton) {
        replyButton.addEventListener('click', () => {
          // 회신 정보 설정
          state.replyingToMessage = {
            id: message.id,
            username: message.username,
            message: message.message
          };
          
          // 회신 팝오버 표시
          replyUsername.textContent = message.username;
          replyContent.textContent = message.message;
          replyPopover.classList.remove('hidden');
          
          // 입력창에 포커스
          messageInput.focus();
        });
      }
      
      // 스와이프 이벤트 설정 (모바일)
      let touchStartX = 0;
      let touchEndX = 0;
      
      messageElement.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });
      
      messageElement.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      });
      
      function handleSwipe() {
        // 왼쪽으로 스와이프 (다른 사람의 메시지에 대한 회신)
        if (message.user_id !== state.currentUser.id && touchEndX < touchStartX - 50) {
          // 회신 정보 설정
          state.replyingToMessage = {
            id: message.id,
            username: message.username,
            message: message.message
          };
          
          // 회신 팝오버 표시
          replyUsername.textContent = message.username;
          replyContent.textContent = message.message;
          replyPopover.classList.remove('hidden');
          
          // 입력창에 포커스
          messageInput.focus();
        }
      }
      
      // 번역이 필요한 경우
      if (message.language !== state.targetLanguage && message.language !== 'system') {
        translateMessageElement(message, messageElement);
      }
    }
    
    // 메시지 ID 저장
    messageElement.dataset.id = message.id;
    messageElement.dataset.language = message.language;
    
    messagesContainer.appendChild(messageElement);
  }
  
  /**
   * 메시지 요소 번역
   */
  async function translateMessageElement(message, messageElement) {
    try {
      // 번역 중임을 표시
      const messageBubble = messageElement.querySelector('.message-bubble');
      if (!messageBubble) return;
      
      const translatingElement = document.createElement('div');
      translatingElement.classList.add('translated-message');
      translatingElement.textContent = window.i18n.translate('message.translated');
      messageBubble.appendChild(translatingElement);
      
      // 번역 요청
      const translatedMessage = await translateMessage(message, state.targetLanguage);
      
      // 번역 결과 표시
      translatingElement.textContent = translatedMessage.translatedMessage;
    } catch (error) {
      console.error('Translation error:', error);
      
      // 번역 실패 메시지
      const translatedElement = messageElement.querySelector('.translated-message');
      if (translatedElement) {
        translatedElement.textContent = window.i18n.translate('message.translation_failed');
      }
    }
  }
  
  /**
   * 언어 변경 시 메시지 번역 상태 업데이트
   */
  async function updateMessagesTranslation() {
    const messageElements = messagesContainer.querySelectorAll('.message:not(.system)');
    
    messageElements.forEach(async (messageElement) => {
      const messageLanguage = messageElement.dataset.language;
      const messageId = messageElement.dataset.id;
      let translatedElement = messageElement.querySelector('.translated-message');
      
      // 번역이 필요한 경우
      if (messageLanguage !== state.targetLanguage && messageLanguage !== 'system') {
        if (!translatedElement) {
          // 메시지 가져오기
          try {
            // 메시지 내용 가져오기
            const contentElement = messageElement.querySelector('.message-content');
            if (!contentElement) return;
            
            const message = {
              id: messageId,
              message: contentElement.textContent,
              language: messageLanguage
            };
            
            const messageBubble = messageElement.querySelector('.message-bubble');
            if (!messageBubble) return;
            
            // 번역 요소 생성
            translatedElement = document.createElement('div');
            translatedElement.classList.add('translated-message');
            translatedElement.textContent = window.i18n.translate('message.translated');
            messageBubble.appendChild(translatedElement);
            
            // 번역 요청
            const translatedMessage = await translateMessage(message, state.targetLanguage);
            
            // 번역 결과 표시
            translatedElement.textContent = translatedMessage.translatedMessage;
          } catch (error) {
            console.error('Error fetching message for translation:', error);
            
            if (translatedElement) {
              translatedElement.textContent = window.i18n.translate('message.translation_failed');
            }
          }
        } else {
          // 이미 번역 요소가 있는 경우, 다시 번역
          translatedElement.textContent = window.i18n.translate('message.translated');
          
          try {
            // 메시지 내용 가져오기
            const contentElement = messageElement.querySelector('.message-content');
            if (!contentElement) return;
            
            const message = {
              id: messageId,
              message: contentElement.textContent,
              language: messageLanguage
            };
            
            // 번역 요청
            const translatedMessage = await translateMessage(message, state.targetLanguage);
            
            // 번역 결과 표시
            translatedElement.textContent = translatedMessage.translatedMessage;
          } catch (error) {
            console.error('Error updating translation:', error);
            translatedElement.textContent = window.i18n.translate('message.translation_failed');
          }
        }
      } else {
        // 번역이 필요 없는 경우
        if (translatedElement) {
          translatedElement.remove();
        }
      }
    });
  }
  
  /**
   * 접속자 수 업데이트
   */
  async function updateUserCount() {
    // userCountElement가 없으면 조기 반환
    if (!userCountElement) {
      debug('userCountElement를 찾을 수 없습니다');
      return;
    }
    
    try {
      // 간단하게 현재 users 테이블에 있는 사용자 수를 표시
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        debug('접속자 수 조회 오류:', error);
        // 기본값 표시
        userCountElement.textContent = '1';
        return;
      }
      
      // 최소 접속자 수는 1명 (자기 자신)
      const userCount = count ? Math.max(1, count) : 1;
      userCountElement.textContent = userCount.toString();
    } catch (error) {
      debug('접속자 수 업데이트 오류:', error);
      // 오류 시 기본값 표시
      userCountElement.textContent = '1';
    }
  }
  
  // 페이지 로드 후 setTimeout으로 접속자 수 업데이트 함수 호출
  setTimeout(updateUserCount, 1000);
  
  // 주기적으로 접속자 수 업데이트 (30초마다)
  setInterval(updateUserCount, 30000);
  
  /**
   * 타임스탬프 포맷팅
   */
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  /**
   * 스크롤을 최하단으로
   */
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 이벤트 핸들러 등록
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  refreshButton.addEventListener('click', () => {
    checkNewMessages();
  });
  
  logoutButton.addEventListener('click', () => {
    // 세션 정보 삭제
    localStorage.removeItem('chat_current_user');
    
    // 페이지 새로고침
    window.location.reload();
  });
  
  cancelReplyButton.addEventListener('click', () => {
    replyPopover.classList.add('hidden');
    state.replyingToMessage = null;
  });
  
  targetLanguageSelect.addEventListener('change', (e) => {
    state.targetLanguage = e.target.value;
    // 언어 설정 저장
    localStorage.setItem('preferred_language', state.targetLanguage);
    // 기존 메시지 번역 상태 업데이트
    updateMessagesTranslation();
  });
  
  // 애플리케이션 초기화
  initializeApp();
});