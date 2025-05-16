// main.js - GitHub Pages 버전
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
  
  // API 키 설정
  const TRANSLATE_API_KEY = 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs';

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
  
  // LocalStorage에서 메시지 가져오기
  function getMessagesFromStorage(roomId) {
    const messagesJson = localStorage.getItem(`chat_messages_${roomId}`);
    return messagesJson ? JSON.parse(messagesJson) : [];
  }
  
  // LocalStorage에 메시지 저장
  function saveMessagesToStorage(roomId, messages) {
    localStorage.setItem(`chat_messages_${roomId}`, JSON.stringify(messages));
  }
  
  // 메시지 저장
  function saveMessage(roomId, userId, username, message, language) {
    const messages = getMessagesFromStorage(roomId);
    
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      room_id: roomId,
      user_id: userId,
      username,
      message,
      language,
      created_at: new Date().toISOString()
    };
    
    messages.push(newMessage);
    saveMessagesToStorage(roomId, messages);
    
    return newMessage;
  }
  
  // 타임스탬프 포맷팅
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // 메시지 ID로 메시지 가져오기
  function getMessageById(messageId) {
    const roomMessages = getMessagesFromStorage(currentRoom);
    return roomMessages.find(message => message.id === messageId);
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
        translatedMessage: `(번역 실패) ${message.message}`
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
  
  // 폼 제출 처리 (로그인)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const language = document.getElementById('language').value;
    const roomId = document.getElementById('room-id').value.trim() || 'general';
    
    if (!username) return;
    
    // 사용자 ID 생성
    const userId = 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
    
    // 사용자 정보 저장
    currentUser = {
      id: userId,
      username,
      language
    };
    
    // LocalStorage에 사용자 정보 저장
    localStorage.setItem('chat_current_user', JSON.stringify(currentUser));
    
    // 채팅방 설정
    currentRoom = roomId;
    roomTitle.textContent = `채팅방: ${roomId}`;
    
    // 타겟 언어 설정
    targetLanguage = language;
    targetLanguageSelect.value = language;
    
    // 이전 메시지 로드
    loadMessages(roomId);
    
    // 시스템 메시지 추가
    addSystemMessage(`${username}님이 입장했습니다.`);
    
    // 화면 전환
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
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
    
    // 메시지 저장
    const savedMessage = saveMessage(
      currentRoom,
      currentUser.id,
      currentUser.username,
      message,
      currentUser.language
    );
    
    // 메시지 표시
    displayMessage(savedMessage);
    
    // 입력창 초기화
    messageInput.value = '';
    
    // 스크롤을 최하단으로
    scrollToBottom();
  }
  
  // 이전 메시지 로드
  function loadMessages(roomId) {
    const messages = getMessagesFromStorage(roomId);
    
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
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.user_id === currentUser.id ? 'self' : 'other');
    
    // 시간 포맷팅
    const timestamp = formatTimestamp(message.created_at);
    
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
      translateMessageElement(message, messageElement);
    }
  }
  
  // 메시지 요소 번역
  async function translateMessageElement(message, messageElement) {
    try {
      // 번역 중임을 표시
      const translatingElement = document.createElement('div');
      translatingElement.classList.add('translated-message');
      translatingElement.textContent = '번역 중...';
      messageElement.appendChild(translatingElement);
      
      // 번역 요청
      const translatedMessage = await translateMessage(message, targetLanguage);
      
      // 번역 결과 표시
      translatingElement.textContent = translatedMessage.translatedMessage;
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
    const messageElements = messagesContainer.querySelectorAll('.message:not(.system)');
    
    messageElements.forEach(async (messageElement) => {
      const messageLanguage = messageElement.dataset.language;
      const messageId = messageElement.dataset.id;
      const translatedElement = messageElement.querySelector('.translated-message');
      
      // 번역이 필요한 경우
      if (messageLanguage !== targetLanguage) {
        if (!translatedElement) {
          const message = getMessageById(messageId);
          if (message) {
            await translateMessageElement(message, messageElement);
          }
        } else {
          translatedElement.textContent = '번역 중...';
          const message = getMessageById(messageId);
          if (message) {
            const translatedMessage = await translateMessage(message, targetLanguage);
            translatedElement.textContent = translatedMessage.translatedMessage;
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
  
  // 이전 세션에서 사용자 정보 복원
  const savedUser = localStorage.getItem('chat_current_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    
    document.getElementById('username').value = user.username;
    document.getElementById('language').value = user.language;
    
    // 사용자에게 이전 세션 정보 알림
    const restoreButton = document.createElement('button');
    restoreButton.textContent = '이전 세션 복원';
    restoreButton.style.marginTop = '10px';
    restoreButton.onclick = () => {
      loginForm.dispatchEvent(new Event('submit'));
    };
    
    loginForm.appendChild(restoreButton);
  }
});