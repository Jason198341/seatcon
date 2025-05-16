// main.js - Global SeatCon 2025
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  
  // UI 요소
  const UI = {
    loginContainer: document.getElementById('login-container'),
    chatContainer: document.getElementById('chat-container'),
    loginForm: document.getElementById('login-form'),
    messagesContainer: document.getElementById('messages-container'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    roomTitle: document.getElementById('room-title'),
    targetLanguageSelect: document.getElementById('target-language'),
    refreshButton: document.getElementById('refresh-button'),
    logoutButton: document.getElementById('logout-button'),
    replyPopover: document.getElementById('reply-popover'),
    cancelReplyButton: document.getElementById('cancel-reply'),
    replyUsername: document.getElementById('reply-username'),
    replyContent: document.getElementById('reply-content'),
    announcementsContainer: document.getElementById('announcements-container')
  };
  
  // 애플리케이션 상태
  const state = {
    targetLanguage: window.appConfig.getAppConfig().defaultLanguage,
    replyingToMessage: null
  };
  
  /**
   * 애플리케이션 초기화
   */
  async function initializeApp() {
    // 초기 디버그 정보
    if (window.appConfig.isDebugMode()) {
      console.log('Global SeatCon 2025 채팅 애플리케이션 초기화...');
      console.log('설정:', window.appConfig.getAppConfig());
    }
    
    // 저장된 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('preferred_language') || window.appConfig.getAppConfig().defaultLanguage;
    state.targetLanguage = savedLanguage;
    
    // 언어 선택기 설정
    document.querySelectorAll('.language-selector').forEach(select => {
      select.value = savedLanguage;
    });
    
    // i18n 언어 변경
    window.i18n.changeLanguage(savedLanguage);
    
    // 데이터베이스 초기화
    const connectionStatus = await window.dbService.initialize();
    
    // 저장된 세션이 있으면 자동 로그인
    const savedUser = window.userService.restoreSession();
    if (savedUser) {
      try {
        // 채팅방 자동 연결
        const roomId = savedUser.roomId || window.appConfig.getAppConfig().defaultRoom;
        await loginUser(savedUser.username, savedUser.preferred_language, roomId);
      } catch (error) {
        console.error('세션 복원 오류:', error);
        showLoginForm();
      }
    } else {
      showLoginForm();
    }
    
    // 이벤트 핸들러 등록
    registerEventHandlers();
  }
  
  /**
   * 이벤트 핸들러 등록
   */
  function registerEventHandlers() {
    // 로그인 폼 제출
    UI.loginForm.addEventListener('submit', handleLogin);
    
    // 메시지 전송
    UI.sendButton.addEventListener('click', handleSendMessage);
    UI.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
    
    // 새로고침 버튼
    UI.refreshButton.addEventListener('click', () => {
      window.chatService.checkNewMessages();
      showStatus(window.i18n.translate('status.refreshed'));
    });
    
    // 로그아웃 버튼
    UI.logoutButton.addEventListener('click', handleLogout);
    
    // 언어 변경
    UI.targetLanguageSelect.addEventListener('change', (e) => {
      state.targetLanguage = e.target.value;
      window.userService.updateLanguage(e.target.value);
      updateMessagesTranslation();
    });
    
    // 번역 취소
    UI.cancelReplyButton.addEventListener('click', cancelReply);
    
    // 채팅 서비스 이벤트 등록
    window.chatService.addEventListener('messageReceived', displayMessage);
    window.chatService.addEventListener('announcementReceived', addAnnouncement);
  }
  
  /**
   * 로그인 폼 표시
   */
  function showLoginForm() {
    UI.loginContainer.classList.remove('hidden');
    UI.chatContainer.classList.add('hidden');
  }
  
  /**
   * 사용자 로그인 처리
   * @param {string} username - 사용자 이름
   * @param {string} language - 선호 언어
   * @param {string} roomId - 채팅방 ID
   */
  async function loginUser(username, language, roomId) {
    try {
      // 언어 설정
      window.i18n.changeLanguage(language);
      UI.targetLanguageSelect.value = language;
      state.targetLanguage = language;
      
      // 사용자 생성
      const { user, local } = await window.userService.createUser(
        username, 
        language, 
        roomId
      );
      
      // 채팅방 설정
      await window.chatService.joinRoom(roomId);
      
      // 타이틀 업데이트
      UI.roomTitle.textContent = `Global SeatCon 2025 - ${roomId}${local ? ' (로컬 모드)' : ''}`;
      
      // 이전 메시지 로드
      const { messages } = await window.chatService.loadMessages();
      
      // 메시지 표시
      UI.messagesContainer.innerHTML = '';
      messages.forEach(message => displayMessage(message));
      
      // 공지사항 가져오기
      const { announcement } = await window.chatService.getAnnouncements();
      if (announcement) {
        addAnnouncement(announcement);
      }
      
      // 입장 메시지 추가
      const joinMessageText = window.i18n.translate('system.user_joined', { username });
      window.chatService.sendSystemMessage(joinMessageText);
      
      // 화면 전환
      UI.loginContainer.classList.add('hidden');
      UI.chatContainer.classList.remove('hidden');
      
      // 스크롤 최하단으로
      scrollToBottom();
    } catch (error) {
      console.error('로그인 오류:', error);
      showStatus(window.i18n.translate('status.login_error'), true);
    }
  }
  
  /**
   * 로그인 폼 처리
   * @param {Event} e - 이벤트 객체
   */
  async function handleLogin(e) {
    e.preventDefault();
    
    // 폼 데이터 가져오기
    const username = document.getElementById('username').value.trim();
    const language = document.getElementById('language').value;
    const roomId = document.getElementById('room-id').value.trim() || window.appConfig.getAppConfig().defaultRoom;
    
    if (!username) return;
    
    // 로그인 처리
    await loginUser(username, language, roomId);
  }
  
  /**
   * 로그아웃 처리
   */
  function handleLogout() {
    // 로그아웃
    window.userService.logout();
    window.chatService.leaveRoom();
    
    // 화면 전환
    showLoginForm();
    
    // 페이지 새로고침
    window.location.reload();
  }
  
  /**
   * 메시지 전송 처리
   */
  async function handleSendMessage() {
    const messageText = UI.messageInput.value.trim();
    
    if (!messageText) return;
    
    try {
      // 메시지 전송
      const { message } = await window.chatService.sendMessage(
        messageText, 
        state.replyingToMessage
      );
      
      // 내가 보낸 메시지 표시
      displayMessage(message);
      
      // 입력창 초기화
      UI.messageInput.value = '';
      
      // 답장 모드 취소
      cancelReply();
      
      // 스크롤 최하단으로
      scrollToBottom();
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      showStatus(window.i18n.translate('status.send_error'), true);
    }
  }
  
  /**
   * 상태 메시지 표시
   * @param {string} message - 메시지 내용
   * @param {boolean} isError - 오류 여부
   */
  function showStatus(message, isError = false) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${isError ? 'error' : 'success'}`;
    statusDiv.textContent = message;
    
    UI.messagesContainer.appendChild(statusDiv);
    
    setTimeout(() => {
      if (statusDiv && statusDiv.parentNode) {
        statusDiv.remove();
      }
    }, 5000);
    
    scrollToBottom();
  }
  
  /**
   * 타임스탬프 포맷팅
   * @param {string} timestamp - ISO 형식 타임스탬프
   * @returns {string} 포맷된 시간
   */
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  /**
   * 메시지 표시
   * @param {Object} message - 메시지 객체
   */
  function displayMessage(message) {
    // 이미 표시된 메시지인지 확인 (중복 방지)
    if (document.querySelector(`.message[data-id="${message.id}"]`)) {
      return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // 시스템 메시지인 경우
    if (message.user_id === 'system') {
      messageElement.classList.add('system');
      messageElement.innerHTML = `<div class="message-content">${message.message}</div>`;
    } else {
      // 일반 메시지
      const currentUser = window.userService.getCurrentUser();
      
      if (currentUser && message.user_id === currentUser.id) {
        messageElement.classList.add('self');
      } else if (window.appConfig.isAdmin(message.user_id)) {
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
      if (window.appConfig.isAdmin(message.user_id)) {
        messageHtml += `<span class="admin-badge">${window.i18n.translate('message.admin')}</span>`;
      }
      
      messageHtml += `</span>
          <span class="timestamp">${formatTimestamp(message.created_at)}</span>
        </div>
        <div class="message-content">${message.message}</div>
      `;
      
      // 메시지 액션 버튼 (다른 사람의 메시지에 대한 회신 기능)
      if (currentUser && message.user_id !== currentUser.id) {
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
          startReply({
            id: message.id,
            username: message.username,
            message: message.message
          });
        });
      }
      
      // 스와이프 이벤트 설정 (모바일)
      setupSwipeEvents(messageElement, message);
      
      // 번역이 필요한 경우
      if (message.language !== state.targetLanguage && message.language !== 'system') {
        translateMessageElement(message, messageElement);
      }
    }
    
    // 메시지 ID 저장
    messageElement.dataset.id = message.id;
    messageElement.dataset.language = message.language;
    
    UI.messagesContainer.appendChild(messageElement);
    
    // 스크롤 최하단으로 (새 메시지일 경우)
    const isNewMessage = Date.now() - new Date(message.created_at).getTime() < 10000;
    if (isNewMessage) {
      scrollToBottom();
    }
  }
  
  /**
   * 스와이프 이벤트 설정
   * @param {HTMLElement} element - 메시지 요소
   * @param {Object} message - 메시지 객체
   */
  function setupSwipeEvents(element, message) {
    let touchStartX = 0;
    let touchEndX = 0;
    
    element.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    element.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
    
    function handleSwipe() {
      // 왼쪽으로 스와이프 (다른 사람의 메시지에 대한 회신)
      const currentUser = window.userService.getCurrentUser();
      if (currentUser && message.user_id !== currentUser.id && touchEndX < touchStartX - 50) {
        // 회신 정보 설정
        startReply({
          id: message.id,
          username: message.username,
          message: message.message
        });
      }
    }
  }
  
  /**
   * 메시지 요소 번역
   * @param {Object} message - 메시지 객체
   * @param {HTMLElement} messageElement - 메시지 요소
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
      const translatedMessage = await window.translationService.translateMessage(
        message, 
        state.targetLanguage
      );
      
      // 번역 결과 표시
      translatingElement.textContent = translatedMessage.translatedMessage;
    } catch (error) {
      console.error('번역 오류:', error);
      
      // 번역 실패 메시지
      const translatedElement = messageElement.querySelector('.translated-message');
      if (translatedElement) {
        translatedElement.textContent = window.i18n.translate('message.translation_failed');
      }
    }
  }
  
  /**
   * 메시지 번역 상태 업데이트
   */
  async function updateMessagesTranslation() {
    const messageElements = UI.messagesContainer.querySelectorAll('.message:not(.system)');
    
    for (const messageElement of messageElements) {
      const messageLanguage = messageElement.dataset.language;
      const messageId = messageElement.dataset.id;
      let translatedElement = messageElement.querySelector('.translated-message');
      
      // 번역이 필요한 경우
      if (messageLanguage !== state.targetLanguage && messageLanguage !== 'system') {
        if (!translatedElement) {
          // 메시지 요소 찾기
          const messageBubble = messageElement.querySelector('.message-bubble');
          if (!messageBubble) continue;
          
          // 번역 요소 생성
          translatedElement = document.createElement('div');
          translatedElement.classList.add('translated-message');
          translatedElement.textContent = window.i18n.translate('message.translated');
          messageBubble.appendChild(translatedElement);
          
          // 메시지 가져오기
          try {
            // 이미 표시된 메시지의 내용 가져오기
            const contentElement = messageElement.querySelector('.message-content');
            if (!contentElement) continue;
            
            const message = {
              id: messageId,
              message: contentElement.textContent,
              language: messageLanguage
            };
            
            // 번역 요청
            const translatedMessage = await window.translationService.translateMessage(
              message, 
              state.targetLanguage
            );
            
            // 번역 결과 표시
            translatedElement.textContent = translatedMessage.translatedMessage;
          } catch (error) {
            console.error('번역 업데이트 오류:', error);
            translatedElement.textContent = window.i18n.translate('message.translation_failed');
          }
        } else {
          // 이미 번역 요소가 있는 경우, 다시 번역
          translatedElement.textContent = window.i18n.translate('message.translated');
          
          try {
            // 이미 표시된 메시지의 내용 가져오기
            const contentElement = messageElement.querySelector('.message-content');
            if (!contentElement) continue;
            
            const message = {
              id: messageId,
              message: contentElement.textContent,
              language: messageLanguage
            };
            
            // 번역 요청
            const translatedMessage = await window.translationService.translateMessage(
              message, 
              state.targetLanguage
            );
            
            // 번역 결과 표시
            translatedElement.textContent = translatedMessage.translatedMessage;
          } catch (error) {
            console.error('번역 업데이트 오류:', error);
            translatedElement.textContent = window.i18n.translate('message.translation_failed');
          }
        }
      } else {
        // 번역이 필요 없는 경우
        if (translatedElement) {
          translatedElement.remove();
        }
      }
    }
  }
  
  /**
   * 답장 시작
   * @param {Object} message - 답장할 메시지
   */
  function startReply(message) {
    state.replyingToMessage = message;
    
    // 답장 팝오버 표시
    UI.replyUsername.textContent = message.username;
    UI.replyContent.textContent = message.message;
    UI.replyPopover.classList.remove('hidden');
    
    // 입력창에 포커스
    UI.messageInput.focus();
  }
  
  /**
   * 답장 취소
   */
  function cancelReply() {
    state.replyingToMessage = null;
    UI.replyPopover.classList.add('hidden');
  }
  
  /**
   * 공지사항 추가
   * @param {Object} message - 공지사항 메시지
   */
  function addAnnouncement(message) {
    // 이미 표시된 공지사항은 다시 추가하지 않음
    if (document.querySelector(`.announcement[data-id="${message.id}"]`)) {
      return;
    }
    
    // 이전 공지사항 제거
    UI.announcementsContainer.innerHTML = '';
    
    // 공지사항 요소 생성
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
    
    // 공지사항 표시
    UI.announcementsContainer.appendChild(announcementElement);
    UI.announcementsContainer.classList.remove('hidden');
  }
  
  /**
   * 스크롤을 최하단으로
   */
  function scrollToBottom() {
    UI.messagesContainer.scrollTop = UI.messagesContainer.scrollHeight;
  }
  
  // 애플리케이션 초기화
  initializeApp();
});