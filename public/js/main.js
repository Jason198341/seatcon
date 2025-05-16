// public/js/main.js
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
  
  // 사용자 정보
  let currentUser = {
    id: null,
    username: '',
    language: 'ko'
  };
  
  // 현재 채팅방
  let currentRoom = 'general';
  
  // 선택된 번역 언어
  let targetLanguage = 'ko';
  
  // Socket.io 연결
  const socket = io();
  
  // 폼 제출 처리 (로그인)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const language = document.getElementById('language').value;
    const roomId = document.getElementById('room-id').value.trim() || 'general';
    
    if (!username) return;
    
    try {
      // 임시 사용자 생성
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, preferredLanguage: language })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '사용자를 생성할 수 없습니다.');
      }
      
      // 사용자 정보 저장
      currentUser = {
        id: data.data.id,
        username,
        language
      };
      
      // 채팅방 설정
      currentRoom = roomId;
      roomTitle.textContent = `채팅방: ${roomId}`;
      
      // 타겟 언어 설정
      targetLanguage = language;
      targetLanguageSelect.value = language;
      
      // 채팅방 참가
      socket.emit('join_room', {
        roomId,
        userId: currentUser.id,
        username: currentUser.username,
        language: currentUser.language
      });
      
      // 이전 메시지 로드
      loadMessages(roomId);
      
      // 화면 전환
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
  });
  
  // 메시지 전송
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // 언어 변경
  targetLanguageSelect.addEventListener('change', (e) => {
    targetLanguage = e.target.value;
    // 기존 메시지 번역 상태 업데이트
    updateMessagesTranslation();
  });
  
  // 메시지 전송 함수
  function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // 메시지 전송
    socket.emit('send_message', {
      roomId: currentRoom,
      userId: currentUser.id,
      username: currentUser.username,
      message,
      language: currentUser.language
    });
    
    // 입력창 초기화
    messageInput.value = '';
  }
  
  // 이전 메시지 로드
  async function loadMessages(roomId) {
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '메시지를 불러올 수 없습니다.');
      }
      
      // 메시지 표시
      messagesContainer.innerHTML = '';
      data.data.forEach(message => {
        displayMessage(message);
      });
      
      // 스크롤을 최하단으로
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      alert('메시지를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  // 메시지 표시
  function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.user_id === currentUser.id ? 'self' : 'other');
    
    // 시간 포맷팅
    const timestamp = new Date(message.created_at).toLocaleTimeString();
    
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="username">${message.username}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${message.message}</div>
    `;
    
    // 메시지 ID 저장
    messageElement.dataset.id = message.id;
    messageElement.dataset.language = message.language;
    
    messagesContainer.appendChild(messageElement);
    
    // 번역이 필요한 경우
    if (message.language !== targetLanguage) {
      translateMessage(message, messageElement);
    }
  }
  
  // 메시지 번역
  async function translateMessage(message, messageElement) {
    try {
      // 번역 중임을 표시
      const translatingElement = document.createElement('div');
      translatingElement.classList.add('translated-message');
      translatingElement.textContent = '번역 중...';
      messageElement.appendChild(translatingElement);
      
      // 번역 요청
      const response = await fetch('/api/chat/messages/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: message.id,
          targetLanguage
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '번역에 실패했습니다.');
      }
      
      // 번역 결과 표시
      translatingElement.textContent = data.data.translatedMessage;
    } catch (error) {
      console.error('Translation error:', error);
      
      // 번역 실패 메시지
      const translatedElement = messageElement.querySelector('.translated-message');
      if (translatedElement) {
        translatedElement.textContent = '번역 실패';
      }
    }
  }
  
  // 언어 변경 시 메시지 번역 상태 업데이트
  function updateMessagesTranslation() {
    const messageElements = messagesContainer.querySelectorAll('.message');
    
    messageElements.forEach(messageElement => {
      const messageLanguage = messageElement.dataset.language;
      const messageId = messageElement.dataset.id;
      const translatedElement = messageElement.querySelector('.translated-message');
      
      // 번역이 필요한 경우
      if (messageLanguage !== targetLanguage) {
        if (!translatedElement) {
          // 번역 요청
          socket.emit('translate_message', {
            messageId,
            targetLanguage
          });
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
  
  // Socket.io 이벤트 처리
  
  // 사용자 입장
  socket.on('user_joined', (data) => {
    // 시스템 메시지 표시
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system');
    messageElement.innerHTML = `<div class="message-content">${data.message}</div>`;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  });
  
  // 메시지 수신
  socket.on('receive_message', (message) => {
    displayMessage(message);
    scrollToBottom();
  });
  
  // 번역된 메시지 수신
  socket.on('translated_message', (data) => {
    const messageElement = document.querySelector(`.message[data-id="${data.id}"]`);
    
    if (!messageElement) return;
    
    let translatedElement = messageElement.querySelector('.translated-message');
    
    if (!translatedElement) {
      translatedElement = document.createElement('div');
      translatedElement.classList.add('translated-message');
      messageElement.appendChild(translatedElement);
    }
    
    translatedElement.textContent = data.translatedMessage;
  });
  
  // 오류 처리
  socket.on('error', (data) => {
    console.error('Socket error:', data.message);
    alert('오류가 발생했습니다: ' + data.message);
  });
});