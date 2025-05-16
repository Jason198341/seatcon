// main.js - Global SeatCon 2025
document.addEventListener('DOMContentLoaded', () => {
  // 요소 가져오기
  const loginContainer = document.getElementById('login-container');
  const chatContainer = document.getElementById('chat-container');
  const loginForm = document.getElementById('login-form');
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const roomTitle = document.getElementById('room-title');
  const targetLanguageSelect = document.getElementById('target-language');
  const refreshButton = document.getElementById('refresh-button');
  const logoutButton = document.getElementById('logout-button');
  const replyPopover = document.getElementById('reply-popover');
  const cancelReplyButton = document.getElementById('cancel-reply');
  const replyUsername = document.getElementById('reply-username');
  const replyContent = document.getElementById('reply-content');
  const announcementsContainer = document.getElementById('announcements-container');
  
  // API 키 설정
  const TRANSLATE_API_KEY = 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs';

  // Supabase 설정
  const SUPABASE_URL = 'https://dolywnpcrutdxuxkozae.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // 사용자 정보
  let currentUser = {
    id: null,
    username: '',
    language: 'en'
  };
  
  // 현재 채팅방
  let currentRoom = 'general';
  
  // 선택된 번역 언어
  let targetLanguage = 'en';
  
  // 실시간 채널 구독 설정
  let currentChannel = null;
  
  // 마지막 메시지 타임스탬프 (폴링 방식에 사용)
  let lastMessageTimestamp = null;
  
  // 폴링 간격 (밀리초)
  const POLLING_INTERVAL = 3000;
  
  // 폴링 타이머 참조
  let pollingTimer = null;
  
  // 관리자 ID
  const ADMIN_ID = 'kcmmer1';
  
  // 대답할 메시지
  let replyingToMessage = null;
  
  // 디버그 모드
  const DEBUG = true;
  
  // 디버그 로그
  function debug(...args) {
    if (DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  }
  
  // 상태 표시
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
  
  // Supabase Realtime 구독 설정
  function setupRealtimeSubscription(roomId) {
    debug('Realtime 구독 설정 중...', roomId);
    
    // 이전 구독이 있으면 해제
    if (currentChannel) {
      debug('이전 구독 해제');
      currentChannel.unsubscribe();
    }
    
    // 새 채널 구독
    currentChannel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        // 새 메시지가 수신되면 화면에 표시 (자신이 보낸 메시지는 제외)
        debug('새 메시지 수신:', payload);
        const message = payload.new;
        if (message.user_id !== currentUser.id) {
          displayMessage(message);
          
          // 관리자 메시지면 공지사항으로 처리
          if (message.user_id === ADMIN_ID && message.isAnnouncement) {
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
          startPolling(roomId);
        }
      });
  }
  
  // 폴링 방식으로 메시지 가져오기 시작
  function startPolling(roomId) {
    debug('폴링 방식으로 메시지 가져오기 시작');
    
    // 기존 타이머가 있으면 정리
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }
    
    // 마지막 메시지 타임스탬프가 없으면 현재 시간 기준으로 설정
    if (!lastMessageTimestamp) {
      lastMessageTimestamp = new Date().toISOString();
    }
    
    // 주기적으로 새 메시지 확인
    pollingTimer = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .gt('created_at', lastMessageTimestamp)
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
            if (message.user_id !== currentUser.id) {
              displayMessage(message);
              
              // 관리자 메시지면 공지사항으로 처리
              if (message.user_id === ADMIN_ID && message.isAnnouncement) {
                addAnnouncement(message);
              }
            }
          });
          
          // 마지막 메시지 타임스탬프 업데이트
          lastMessageTimestamp = data[data.length - 1].created_at;
          
          // 스크롤을 최하단으로
          scrollToBottom();
        }
      } catch (error) {
        debug('폴링 중 오류 발생:', error);
      }
    }, POLLING_INTERVAL);
  }
  
  // 새로운 메시지 수동으로 확인
  async function checkNewMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', currentRoom)
        .gt('created_at', lastMessageTimestamp)
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
          if (message.user_id !== currentUser.id) {
            displayMessage(message);
            
            // 관리자 메시지면 공지사항으로 처리
            if (message.user_id === ADMIN_ID && message.isAnnouncement) {
              addAnnouncement(message);
            }
          }
        });
        
        // 마지막 메시지 타임스탬프 업데이트
        lastMessageTimestamp = data[data.length - 1].created_at;
        
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
  
  // 타임스탬프 포맷팅
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // 메시지 번역
  async function translateText(text, targetLanguage) {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_API_KEY}`, {
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
        return data.data.translations[0].translatedText;
      }
      
      throw new Error('번역 실패');
    } catch (error) {
      console.error('Translation error:', error);
      return text; // 오류 발생 시 원본 텍스트 반환
    }
  }
  
  // 메시지 번역 처리
  async function translateMessage(message, targetLang) {
    if (message.language === targetLang) {
      return {
        ...message,
        translatedMessage: message.message
      };
    }
    
    try {
      const translatedText = await translateText(message.message, targetLang);
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
  
  // 시스템 메시지 추가
  function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system');
    messageElement.innerHTML = `<div class="message-content">${message}</div>`;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }
  
  // 공지사항 추가
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
  
  // 공지사항 가져오기
  async function fetchAnnouncements(roomId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', ADMIN_ID)
        .eq('isAnnouncement', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        addAnnouncement(data[0]);
      }
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
    }
  }
  
  // 폼 제출 처리 (로그인)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const language = document.getElementById('language').value;
    const roomId = document.getElementById('room-id').value.trim() || 'general';
    
    if (!username) return;
    
    try {
      // 언어 설정 변경
      window.i18n.changeLanguage(language);
      targetLanguageSelect.value = language;
      targetLanguage = language;
      
      // 사용자 ID 생성
      const userId = username === ADMIN_ID ? ADMIN_ID : 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
      debug('사용자 ID 생성:', userId);
      
      // Supabase에 사용자 저장
      debug('Supabase에 사용자 저장 중...');
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
      
      // 사용자 정보 저장
      currentUser = {
        id: userId,
        username,
        language
      };
      
      // LocalStorage에 사용자 정보 저장
      localStorage.setItem('chat_current_user', JSON.stringify(currentUser));
      localStorage.setItem('preferred_language', language);
      
      // 채팅방 설정
      currentRoom = roomId;
      roomTitle.textContent = `Global SeatCon 2025 - ${roomId}`;
      
      // 타겟 언어 설정
      targetLanguage = language;
      targetLanguageSelect.value = language;
      
      // 이전 메시지 로드
      await loadMessages(roomId);
      
      // 공지사항 가져오기
      await fetchAnnouncements(roomId);
      
      // 시스템 메시지 추가
      const joinMessageKey = 'system.user_joined';
      const joinMessage = window.i18n.translate(joinMessageKey, { username });
      addSystemMessage(joinMessage);
      
      // Supabase에 입장 메시지 저장
      debug('입장 메시지 저장 중...');
      await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: 'system',
          username: 'System',
          message: joinMessage,
          language: 'system',
          created_at: new Date().toISOString()
        });
      
      // 화면 전환
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
      
      // 오류 발생 시 로컬 모드로 폴백
      debug('로컬 모드로 전환');
      const userId = username === ADMIN_ID ? ADMIN_ID : 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
      currentUser = {
        id: userId,
        username,
        language
      };
      
      localStorage.setItem('chat_current_user', JSON.stringify(currentUser));
      localStorage.setItem('preferred_language', language);
      
      currentRoom = roomId;
      roomTitle.textContent = `Global SeatCon 2025 - ${roomId} (로컬 모드)`;
      targetLanguage = language;
      targetLanguageSelect.value = language;
      
      loadLocalMessages(roomId);
      
      const joinMessageKey = 'system.user_joined';
      const joinMessage = window.i18n.translate(joinMessageKey, { username });
      addSystemMessage(joinMessage + ' (로컬 모드)');
      
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    }
  });
  
  // 메시지 전송
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // 새로고침 버튼
  refreshButton.addEventListener('click', () => {
    checkNewMessages();
  });
  
  // 로그아웃 버튼
  logoutButton.addEventListener('click', () => {
    // 세션 정보 삭제
    localStorage.removeItem('chat_current_user');
    
    // 언어 설정은 유지
    const language = localStorage.getItem('preferred_language') || 'en';
    
    // 페이지 새로고침
    window.location.reload();
  });
  
  // 언어 변경
  targetLanguageSelect.addEventListener('change', (e) => {
    targetLanguage = e.target.value;
    // 언어 설정 저장
    localStorage.setItem('preferred_language', targetLanguage);
    // 기존 메시지 번역 상태 업데이트
    updateMessagesTranslation();
  });
  
  // 번역 취소
  cancelReplyButton.addEventListener('click', () => {
    replyPopover.classList.add('hidden');
    replyingToMessage = null;
  });
  
  // 메시지 전송 함수
  async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
      debug('메시지 전송 중...', message);
      
      // 공지사항 여부 확인 (관리자만 가능)
      const isAnnouncement = currentUser.id === ADMIN_ID && message.startsWith('/공지 ');
      
      // 메시지 객체 생성
      const messageObj = {
        room_id: currentRoom,
        user_id: currentUser.id,
        username: currentUser.username,
        message: isAnnouncement ? message.substring(4) : message,
        language: currentUser.language,
        created_at: new Date().toISOString(),
        isAnnouncement: isAnnouncement
      };
      
      // 답장 정보 추가
      if (replyingToMessage) {
        messageObj.reply_to = {
          id: replyingToMessage.id,
          username: replyingToMessage.username,
          message: replyingToMessage.message
        };
      }
      
      // Supabase에 메시지 저장
      const { data, error } = await supabase
        .from('messages')
        .insert(messageObj)
        .select();
      
      if (error) {
        debug('메시지 저장 오류:', error);
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
      if (replyingToMessage) {
        replyPopover.classList.add('hidden');
        replyingToMessage = null;
      }
      
      // 스크롤을 최하단으로
      scrollToBottom();
      
      // 마지막 메시지 타임스탬프 업데이트
      lastMessageTimestamp = data[0].created_at;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // 오류 발생 시 로컬에만 저장
      debug('로컬에 메시지 저장');
      
      // 메시지 객체 생성
      const localMessage = {
        id: `local_${Date.now()}`,
        room_id: currentRoom,
        user_id: currentUser.id,
        username: currentUser.username,
        message: message,
        language: currentUser.language,
        created_at: new Date().toISOString(),
        isAnnouncement: false
      };
      
      // 답장 정보 추가
      if (replyingToMessage) {
        localMessage.reply_to = {
          id: replyingToMessage.id,
          username: replyingToMessage.username,
          message: replyingToMessage.message
        };
        
        // 답장 모드 취소
        replyPopover.classList.add('hidden');
        replyingToMessage = null;
      }
      
      // 로컬 메시지 저장
      const messages = getLocalMessages(currentRoom);
      messages.push(localMessage);
      saveLocalMessages(currentRoom, messages);
      
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
  
  // 이전 메시지 로드 (Supabase)
  async function loadMessages(roomId) {
    try {
      debug('메시지 로드 중...', roomId);
      // Supabase에서 메시지 가져오기
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
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
        lastMessageTimestamp = data[data.length - 1].created_at;
      } else {
        lastMessageTimestamp = new Date().toISOString();
      }
      
      // 실시간 업데이트 설정
      setupRealtimeUpdate(roomId);
      
      // 스크롤을 최하단으로
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      
      // 오류 발생 시 로컬 메시지 사용
      debug('로컬 메시지 사용');
      loadLocalMessages(roomId);
      
      // 사용자에게 알림
      showStatus('메시지를 불러오는 중 오류가 발생했습니다. 로컬 메시지를 표시합니다.', true);
    }
  }
  
  // 실시간 업데이트 설정 (폴링 + Supabase Realtime 모두 시도)
  function setupRealtimeUpdate(roomId) {
    // 1. Supabase Realtime 구독 시도
    setupRealtimeSubscription(roomId);
    
    // 2. 폴링 방식도 같이 사용 (백업)
    startPolling(roomId);
  }
  
  // 로컬 메시지 관련 함수
  function getLocalMessages(roomId) {
    const messagesJson = localStorage.getItem(`chat_messages_${roomId}`);
    return messagesJson ? JSON.parse(messagesJson) : [];
  }
  
  function saveLocalMessages(roomId, messages) {
    localStorage.setItem(`chat_messages_${roomId}`, JSON.stringify(messages));
  }
  
  function loadLocalMessages(roomId) {
    const messages = getLocalMessages(roomId);
    
    // 메시지 표시
    messagesContainer.innerHTML = '';
    messages.forEach(message => {
      displayMessage(message);
    });
    
    // 스크롤을 최하단으로
    scrollToBottom();
  }
  
  // 메시지 표시
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
      if (message.user_id === currentUser.id) {
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
      if (message.user_id !== currentUser.id) {
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
          replyingToMessage = {
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
        if (message.user_id !== currentUser.id && touchEndX < touchStartX - 50) {
          // 회신 정보 설정
          replyingToMessage = {
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
      if (message.language !== targetLanguage && message.language !== 'system') {
        translateMessageElement(message, messageElement);
      }
    }
    
    // 메시지 ID 저장
    messageElement.dataset.id = message.id;
    messageElement.dataset.language = message.language;
    
    messagesContainer.appendChild(messageElement);
  }
  
  // 메시지 요소 번역
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
      const translatedMessage = await translateMessage(message, targetLanguage);
      
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
  
  // 언어 변경 시 메시지 번역 상태 업데이트
  function updateMessagesTranslation() {
    const messageElements = messagesContainer.querySelectorAll('.message:not(.system)');
    
    messageElements.forEach(async (messageElement) => {
      const messageLanguage = messageElement.dataset.language;
      const messageId = messageElement.dataset.id;
      let translatedElement = messageElement.querySelector('.translated-message');
      
      // 번역이 필요한 경우
      if (messageLanguage !== targetLanguage && messageLanguage !== 'system') {
        if (!translatedElement) {
          // Supabase에서 메시지 가져오기 (로컬에 없는 경우)
          try {
            const { data, error } = await supabase
              .from('messages')
              .select('*')
              .eq('id', messageId)
              .single();
            
            if (error) throw error;
            
            const messageBubble = messageElement.querySelector('.message-bubble');
            if (!messageBubble) return;
            
            const newTranslatedElement = document.createElement('div');
            newTranslatedElement.classList.add('translated-message');
            newTranslatedElement.textContent = window.i18n.translate('message.translated');
            messageBubble.appendChild(newTranslatedElement);
            
            const translatedMessage = await translateMessage(data, targetLanguage);
            newTranslatedElement.textContent = translatedMessage.translatedMessage;
          } catch (error) {
            console.error('Error fetching message for translation:', error);
            
            // 로컬에서 메시지 찾기
            const messages = getLocalMessages(currentRoom);
            const message = messages.find(m => m.id === messageId);
            
            if (message) {
              const messageBubble = messageElement.querySelector('.message-bubble');
              if (!messageBubble) return;
              
              const newTranslatedElement = document.createElement('div');
              newTranslatedElement.classList.add('translated-message');
              newTranslatedElement.textContent = window.i18n.translate('message.translated');
              messageBubble.appendChild(newTranslatedElement);
              
              const translatedMessage = await translateMessage(message, targetLanguage);
              newTranslatedElement.textContent = translatedMessage.translatedMessage;
            }
          }
        } else {
          // 이미 번역 요소가 있는 경우, 다시 번역
          translatedElement.textContent = window.i18n.translate('message.translated');
          
          try {
            const { data, error } = await supabase
              .from('messages')
              .select('*')
              .eq('id', messageId)
              .single();
            
            if (error) throw error;
            
            const translatedMessage = await translateMessage(data, targetLanguage);
            translatedElement.textContent = translatedMessage.translatedMessage;
          } catch (error) {
            console.error('Error updating translation:', error);
            
            // 로컬에서 메시지 찾기
            const messages = getLocalMessages(currentRoom);
            const message = messages.find(m => m.id === messageId);
            
            if (message) {
              const translatedMessage = await translateMessage(message, targetLanguage);
              translatedElement.textContent = translatedMessage.translatedMessage;
            } else {
              translatedElement.textContent = window.i18n.translate('message.translation_failed');
            }
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
  
  // 스크롤을 최하단으로
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Supabase 연결 상태 확인
  async function checkSupabaseConnection() {
    try {
      debug('Supabase 연결 확인 중...');
      const { error } = await supabase.from('messages').select('count').limit(1);
      
      if (error) {
        debug('Supabase 연결 실패:', error);
        showStatus('Supabase 데이터베이스에 연결할 수 없습니다. 로컬 모드로 작동합니다.', true);
        return false;
      }
      
      debug('Supabase 연결 성공');
      return true;
    } catch (error) {
      debug('Supabase 연결 확인 중 오류:', error);
      showStatus('Supabase 연결 확인 중 오류가 발생했습니다.', true);
      return false;
    }
  }
  
  // 초기화
  async function init() {
    // 저장된 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('preferred_language') || 'en';
    targetLanguage = savedLanguage;
    
    // 언어 선택기 설정
    document.querySelectorAll('.language-selector').forEach(select => {
      select.value = savedLanguage;
    });
    
    // i18n 언어 변경
    window.i18n.changeLanguage(savedLanguage);
    
    // Supabase 연결 확인
    await checkSupabaseConnection();
    
    // 저장된 사용자 정보 확인
    const savedUser = localStorage.getItem('chat_current_user');
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        
        // 채팅방 자동 연결
        currentRoom = 'general'; // 기본 채팅방
        roomTitle.textContent = `Global SeatCon 2025 - ${currentRoom}`;
        
        // 이전 메시지 로드
        await loadMessages(currentRoom);
        
        // 공지사항 가져오기
        await fetchAnnouncements(currentRoom);
        
        // 화면 전환
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        
        debug('세션 복원 완료:', currentUser);
      } catch (error) {
        console.error('세션 복원 오류:', error);
        localStorage.removeItem('chat_current_user');
      }
    }
  }
  
  // 초기화 함수 실행
  init();
});