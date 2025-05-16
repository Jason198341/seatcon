// main.js - Supabase Realtime 연동 버전
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

  // Supabase 설정
  const SUPABASE_URL = 'https://dolywnpcrutdxuxkozae.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  
  // 실시간 채널 구독 설정
  let currentChannel = null;
  
  // Supabase Realtime 구독 설정
  function setupRealtime(roomId) {
    // 이전 구독이 있으면 해제
    if (currentChannel) {
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
        const message = payload.new;
        if (message.user_id !== currentUser.id) {
          displayMessage(message);
          scrollToBottom();
        }
      })
      .subscribe();
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
    
    try {
      // 사용자 ID 생성
      const userId = 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
      
      // Supabase에 사용자 저장
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
        throw error;
      }
      
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
      await loadMessages(roomId);
      
      // 시스템 메시지 추가
      const joinMessage = `${username}님이 입장했습니다.`;
      addSystemMessage(joinMessage);
      
      // Supabase에 입장 메시지 저장 (선택사항)
      await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: 'system',
          username: 'System',
          message: joinMessage,
          language: 'ko',
          created_at: new Date().toISOString()
        });
      
      // 화면 전환
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
      
      // 오류 발생 시 로컬 모드로 폴백
      const userId = 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
      currentUser = {
        id: userId,
        username,
        language
      };
      
      localStorage.setItem('chat_current_user', JSON.stringify(currentUser));
      currentRoom = roomId;
      roomTitle.textContent = `채팅방: ${roomId} (로컬 모드)`;
      targetLanguage = language;
      targetLanguageSelect.value = language;
      
      loadLocalMessages(roomId);
      addSystemMessage(`${username}님이 입장했습니다. (로컬 모드)`);
      
      loginContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
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
  async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
      // Supabase에 메시지 저장
      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: currentRoom,
          user_id: currentUser.id,
          username: currentUser.username,
          message: message,
          language: currentUser.language,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // 메시지 표시 (실시간 구독을 통해 받아볼 수도 있지만, 자신이 보낸 메시지는 바로 표시)
      displayMessage(data[0]);
      
      // 입력창 초기화
      messageInput.value = '';
      
      // 스크롤을 최하단으로
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // 오류 발생 시 로컬에만 저장
      const localMessage = {
        id: `local_${Date.now()}`,
        room_id: currentRoom,
        user_id: currentUser.id,
        username: currentUser.username,
        message: message,
        language: currentUser.language,
        created_at: new Date().toISOString()
      };
      
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
      alert('메시지 전송 중 오류가 발생했습니다. 로컬에만 저장됩니다.');
    }
  }
  
  // 이전 메시지 로드 (Supabase)
  async function loadMessages(roomId) {
    try {
      // Supabase에서 메시지 가져오기
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // 메시지 표시
      messagesContainer.innerHTML = '';
      data.forEach(message => {
        displayMessage(message);
      });
      
      // 실시간 구독 설정
      setupRealtime(roomId);
      
      // 스크롤을 최하단으로
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      
      // 오류 발생 시 로컬 메시지 사용
      loadLocalMessages(roomId);
      
      // 사용자에게 알림
      alert('메시지를 불러오는 중 오류가 발생했습니다. 로컬 메시지를 표시합니다.');
    }
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
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // 시스템 메시지인 경우
    if (message.user_id === 'system') {
      messageElement.classList.add('system');
      messageElement.innerHTML = `<div class="message-content">${message.message}</div>`;
    } else {
      // 일반 메시지
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
      
      // 번역이 필요한 경우
      if (message.language !== targetLanguage) {
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
      let translatedElement = messageElement.querySelector('.translated-message');
      
      // 번역이 필요한 경우
      if (messageLanguage !== targetLanguage) {
        if (!translatedElement) {
          // Supabase에서 메시지 가져오기 (로컬에 없는 경우)
          try {
            const { data, error } = await supabase
              .from('messages')
              .select('*')
              .eq('id', messageId)
              .single();
            
            if (error) throw error;
            
            await translateMessageElement(data, messageElement);
          } catch (error) {
            console.error('Error fetching message for translation:', error);
            
            // 로컬에서 메시지 찾기
            const messages = getLocalMessages(currentRoom);
            const message = messages.find(m => m.id === messageId);
            
            if (message) {
              await translateMessageElement(message, messageElement);
            }
          }
        } else {
          // 이미 번역 요소가 있는 경우, 다시 번역
          translatedElement.textContent = '번역 중...';
          
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
              translatedElement.textContent = '번역 실패';
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