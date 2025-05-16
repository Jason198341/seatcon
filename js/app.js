// js/app.js - 애플리케이션 진입점 (개선된 버전)
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';
  
  /**
   * Global SeatCon 2025 메인 애플리케이션 스크립트
   * 개선된 버전: 오류 처리, 사용자 경험, 실시간 통신 개선
   */
  
  // UI 요소 초기화
  let loadingContainer, systemNotification, notificationMessage, closeNotification,
      loginContainer, chatContainer, loginForm, loginStatus, messagesContainer, messageInput, 
      sendButton, userCountElement, targetLanguageSelect, refreshButton, logoutButton, 
      replyPopover, cancelReplyButton, replyUsername, replyContent, announcementsContainer,
      connectionStatus, connectionText;
  
  // DOM 요소 초기화
  function initializeUI() {
    loadingContainer = document.getElementById('loading-container');
    systemNotification = document.getElementById('system-notification');
    notificationMessage = document.getElementById('notification-message');
    closeNotification = document.getElementById('close-notification');
    loginContainer = document.getElementById('login-container');
    chatContainer = document.getElementById('chat-container');
    loginForm = document.getElementById('login-form');
    loginStatus = document.getElementById('login-status');
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
    connectionStatus = document.getElementById('connection-status');
    connectionText = document.getElementById('connection-text');
  }
  
  // 애플리케이션 상태
  const state = {
    currentUser: null,
    currentRoom: 'general',
    targetLanguage: window.appConfig.getAppConfig().defaultLanguage,
    replyingToMessage: null,
    lastMessageTimestamp: null,
    currentChannel: null,
    pollingTimer: null,
    translationCache: {},
    onlineUsers: {},
    connectionState: 'connecting' // 'connected', 'disconnected'
  };
  
  // 초기화 함수 호출
  initializeUI();
  
  // 디버그 모드
  const DEBUG = window.appConfig.isDebugMode();
  const ADMIN_ID = window.appConfig.getAppConfig().adminId;
  
  /**
   * 디버그 로그
   */
  function debug(...args) {
    if (DEBUG) {
      console.log('[App]', ...args);
    }
  }
  
  /**
   * 시스템 알림 표시
   * @param {string} message - 알림 메시지
   * @param {string} type - 알림 유형 (error, success, warning)
   * @param {number} duration - 표시 시간 (ms), 0이면 자동으로 닫지 않음
   */
  function showNotification(message, type = 'error', duration = 5000) {
    notificationMessage.textContent = message;
    
    systemNotification.className = 'system-notification';
    systemNotification.classList.add(type);
    
    // 아이콘 설정
    const iconElement = systemNotification.querySelector('.notification-content i');
    iconElement.className = 'fas';
    
    if (type === 'error') {
      iconElement.classList.add('fa-exclamation-circle');
    } else if (type === 'success') {
      iconElement.classList.add('fa-check-circle');
    } else if (type === 'warning') {
      iconElement.classList.add('fa-exclamation-triangle');
    } else {
      iconElement.classList.add('fa-info-circle');
    }
    
    systemNotification.classList.remove('hidden');
    
    // 자동으로 닫히게 설정
    if (duration > 0) {
      setTimeout(() => {
        systemNotification.classList.add('hidden');
      }, duration);
    }
  }
  
  /**
   * 연결 상태 업데이트
   * @param {string} status - 연결 상태 ('connected', 'connecting', 'disconnected')
   * @param {string} message - 상태 메시지 (선택적)
   */
  function updateConnectionStatus(status, message = '') {
    if (!connectionStatus || !connectionText) {
      return;
    }
    
    state.connectionState = status;
    
    connectionStatus.classList.remove('hidden');
    
    if (status === 'connected') {
      connectionStatus.classList.add('online');
      connectionText.innerHTML = '<i class="fas fa-check-circle"></i> ' + 
        (message || window.i18n.translate('status.connected'));
    } else if (status === 'connecting') {
      connectionStatus.classList.remove('online');
      connectionText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
        (message || window.i18n.translate('status.connecting'));
    } else {
      connectionStatus.classList.remove('online');
      connectionText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + 
        (message || window.i18n.translate('status.disconnected'));
    }
    
    // 5초 후 숨김
    setTimeout(() => {
      connectionStatus.classList.add('hidden');
    }, 5000);
  }
  
  /**
   * 로딩 표시
   * @param {boolean} show - 표시 여부
   * @param {string} message - 로딩 메시지
   */
  function showLoading(show, message = '') {
    if (!loadingContainer) {
      return;
    }
    
    if (show) {
      const loadingText = loadingContainer.querySelector('.loading-text');
      if (loadingText && message) {
        loadingText.textContent = message;
      }
      loadingContainer.classList.remove('hidden');
    } else {
      loadingContainer.classList.add('hidden');
    }
  }
  
  /**
   * 애플리케이션 초기화
   */
  async function initializeApp() {
    // 로딩 표시
    showLoading(true, window.i18n.translate('loading.initializing'));
    
    try {
      // 1. Supabase 초기화
      await window.supabaseInit.initialize();
      
      // 2. DB 서비스 초기화
      await window.dbService.initialize();
      
      // 3. 연결 상태 확인
      const connectionStatus = window.dbService.getConnectionStatus();
      
      // 4. 저장된 언어 설정 불러오기
      const savedLanguage = localStorage.getItem('preferred_language') || window.appConfig.getAppConfig().defaultLanguage;
      state.targetLanguage = savedLanguage;
      
      // 5. 언어 선택기 설정
      document.querySelectorAll('.language-selector').forEach(select => {
        select.value = savedLanguage;
      });
      
      // 6. i18n 언어 변경
      window.i18n.changeLanguage(savedLanguage);
      
      // 7. 알림 닫기 이벤트 등록
      closeNotification.addEventListener('click', () => {
        systemNotification.classList.add('hidden');
      });
      
      // 8. Supabase 테이블 설정 확인
      const setupRequired = localStorage.getItem('supabase_setup_required');
      if (setupRequired === 'true') {
        showNotification(
          window.i18n.translate('notification.db_setup_required'),
          'warning',
          0  // 자동으로 닫히지 않음
        );
      }
      
      // 9. 저장된 세션이 있으면 자동 로그인
      const savedUser = window.userService.restoreSession();
      if (savedUser) {
        debug('저장된 세션 발견:', savedUser);
        
        // 사용자 정보 설정
        state.currentUser = savedUser;
        
        // 채팅방 자동 연결
        state.currentRoom = savedUser.roomId || window.appConfig.getAppConfig().defaultRoom;
        
        // 실제 로그인 시도
        await loginWithExistingSession(savedUser);
      } else {
        // 로그인 화면 표시
        showLoginForm();
      }
    } catch (error) {
      console.error('초기화 오류:', error);
      // 오류 발생 시 로그인 화면 표시
      showLoginForm();
      showNotification(window.i18n.translate('error.initialization'), 'error');
    } finally {
      // 로딩 숨김
      showLoading(false);
    }
  }
  
  /**
   * 기존 세션으로 로그인
   */
  async function loginWithExistingSession(user) {
    try {
      showLoading(true, window.i18n.translate('loading.logging_in'));
      
      // 1. DB에 사용자 정보 업데이트
      const { data, error, local } = await window.dbService.createUser({
        id: user.id,
        username: user.username,
        preferred_language: user.preferred_language || state.targetLanguage,
        room_id: state.currentRoom,
        last_activity: new Date().toISOString()
      });
      
      if (error && !local) {
        throw error;
      }
      
      // 2. 채팅 서비스에 사용자 설정
      await window.chatService.joinRoom(state.currentRoom);
      
      // 3. 이전 메시지 로드
      await loadMessages();
      
      // 4. 공지사항 가져오기
      await fetchAnnouncements();
      
      // 5. 자동 사용자 활동 업데이트 설정
      startUserActivityUpdates();
      
      // 6. 연결 상태에 따라 화면 표시
      if (local) {
        updateConnectionStatus('disconnected');
        showNotification(window.i18n.translate('notification.offline_mode'), 'warning');
      } else {
        updateConnectionStatus('connected');
      }
      
      // 7. 화면 전환
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
      
      // 8. 오프라인 캐시 동기화 시도
      window.dbService.syncOfflineCache(state.currentRoom);
      
      // 9. 시스템 메시지 추가
      const joinMessage = window.i18n.translate('system.welcome');
      addSystemMessage(joinMessage);
    } catch (error) {
      console.error('세션 복원 오류:', error);
      showLoginForm();
      showNotification(window.i18n.translate('error.session_restore'), 'error');
    } finally {
      showLoading(false);
    }
  }
  
  /**
   * 로그인 폼 표시
   */
  function showLoginForm() {
    loadingContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    loginStatus.classList.add('hidden');
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
    
    // 로딩 표시
    showLoading(true, window.i18n.translate('loading.logging_in'));
    
    try {
      // 언어 설정 변경
      window.i18n.changeLanguage(language);
      targetLanguageSelect.value = language;
      state.targetLanguage = language;
      
      // 사용자 생성
      const { data, error, local, user } = await window.userService.createUser(username, language, roomId);
      
      if (error && !local) {
        throw error;
      }
      
      // 세션 유지
      state.currentUser = user;
      
      // 채팅방 설정
      state.currentRoom = roomId;
      
      // 채팅 서비스에 사용자 설정
      await window.chatService.joinRoom(roomId);
      
      // 이전 메시지 로드
      await loadMessages();
      
      // 공지사항 가져오기
      await fetchAnnouncements();
      
      // 자동 사용자 활동 업데이트 설정
      startUserActivityUpdates();
      
      // 연결 상태에 따라 화면 표시
      if (local) {
        updateConnectionStatus('disconnected');
        showNotification(window.i18n.translate('notification.offline_mode'), 'warning');
      } else {
        updateConnectionStatus('connected');
      }
      
      // 화면 전환
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
      
      // 시스템 메시지 추가
      const joinMessageKey = 'system.user_joined';
      const joinMessage = window.i18n.translate(joinMessageKey, { username });
      addSystemMessage(joinMessage);
    } catch (error) {
      console.error('로그인 오류:', error);
      
      // 오류 표시
      loginStatus.textContent = window.i18n.translate('error.login');
      loginStatus.classList.remove('hidden');
      loginStatus.classList.add('error');
      
      // 3초 후 숨김
      setTimeout(() => {
        loginStatus.classList.add('hidden');
      }, 3000);
    } finally {
      // 로딩 숨김
      showLoading(false);
    }
  });
  
  /**
   * 사용자 활동 업데이트 시작
   */
  function startUserActivityUpdates() {
    // 30초마다 사용자 활동 업데이트
    setInterval(() => {
      if (state.currentUser && state.currentRoom) {
        window.dbService.updateUserActivity(state.currentUser.id, state.currentRoom);
      }
    }, 30000);
  }
  
  /**
   * 메시지 전송
   */
  async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
      debug('메시지 전송 중...', message);
      
      // 전송 중 상태로 UI 업데이트
      messageInput.disabled = true;
      sendButton.disabled = true;
      
      // 메시지 전송
      const { message: savedMessage, local } = await window.chatService.sendMessage(message, state.replyingToMessage);
      
      // 입력창 초기화
      messageInput.value = '';
      
      // 답장 모드 취소
      if (state.replyingToMessage) {
        replyPopover.classList.add('hidden');
        state.replyingToMessage = null;
      }
      
      // 로컬 모드일 경우 안내
      if (local) {
        showNotification(window.i18n.translate('notification.message_local'), 'warning', 3000);
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      showNotification(window.i18n.translate('error.send_message'), 'error');
    } finally {
      messageInput.disabled = false;
      sendButton.disabled = false;
      messageInput.focus();
    }
  }
  
  /**
   * 메시지 목록 로드
   */
  async function loadMessages() {
    try {
      debug('메시지 로드 중...', state.currentRoom);
      
      // UI 업데이트
      messagesContainer.innerHTML = '<div class="loading-messages">' + window.i18n.translate('loading.messages') + '</div>';
      
      // 메시지 로드
      const { messages, local } = await window.chatService.loadMessages();
      
      // UI 업데이트
      messagesContainer.innerHTML = '';
      
      // 메시지가 없으면 안내 메시지 표시
      if (messages.length === 0) {
        addSystemMessage(window.i18n.translate('chat.no_messages'));
      } else {
        // 메시지 표시
        messages.forEach(message => {
          const isLocal = message.id.toString().startsWith('local_');
          displayMessage(message, isLocal);
        });
      }
      
      // 스크롤을 최하단으로
      scrollToBottom();
      
      return { messages, local };
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      
      // 오류 표시
      messagesContainer.innerHTML = '';
      addSystemMessage(window.i18n.translate('error.load_messages'));
      
      return { messages: [], local: true };
    }
  }
  
  /**
   * 공지사항 가져오기
   */
  async function fetchAnnouncements() {
    try {
      // 공지사항 가져오기
      const { announcement, local } = await window.chatService.getAnnouncements();
      
      // 공지사항이 있으면 표시
      if (announcement) {
        addAnnouncement(announcement);
      }
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
    }
  }
  
  // 이벤트 리스너 등록
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  refreshButton.addEventListener('click', () => {
    // 새로고침 중 표시
    refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    refreshButton.disabled = true;
    
    // 메시지 다시 로드
    loadMessages().then(() => {
      // UI 복원
      refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
      refreshButton.disabled = false;
      
      // 알림 표시
      showNotification(window.i18n.translate('notification.refreshed'), 'success', 2000);
    }).catch(error => {
      // UI 복원
      refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
      refreshButton.disabled = false;
      
      // 오류 알림
      showNotification(window.i18n.translate('error.refresh'), 'error');
    });
  });
  
  logoutButton.addEventListener('click', () => {
    // 로그아웃 확인
    if (!confirm(window.i18n.translate('confirmation.logout'))) {
      return;
    }
    
    // 사용자 정보 정리
    window.userService.logout();
    
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
