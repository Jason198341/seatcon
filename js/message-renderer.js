/**
 * 향상된 메시지 렌더링 시스템
 * - 메시지 표시 문제 해결을 위한 독립적인 메시지 렌더링 로직
 * - 채팅 화면에서 메시지가 표시되지 않는 백지 화면 문제 해결
 */

class MessageRenderer {
  constructor() {
    // 설정
    this.config = {
      animateMessages: true,        // 메시지 애니메이션 적용
      showTimestamps: true,         // 타임스탬프 표시
      showTranslations: true,       // 번역 표시
      maxInitialMessages: 50,       // 최초 표시할 최대 메시지 수
      messageClassName: 'message',  // 메시지 요소 클래스 이름
      containerSelector: '#messages-container' // 메시지 컨테이너 선택자
    };
    
    // 상태
    this.state = {
      initialized: false,
      messagesRendered: 0,
      lastMessageId: null,
      hasError: false,
      lastError: null
    };
    
    // 참조 캐시
    this.containerElement = null;
  }

  /**
   * 초기화
   * @returns {boolean} 초기화 성공 여부
   */
  initialize() {
    try {
      console.log('MessageRenderer: 초기화 중...');
      
      // 메시지 컨테이너 참조 저장
      this.containerElement = document.querySelector(this.config.containerSelector);
      
      if (!this.containerElement) {
        console.error('MessageRenderer: 메시지 컨테이너를 찾을 수 없습니다:', this.config.containerSelector);
        return false;
      }
      
      // 스타일 추가 (필요한 경우)
      this.addCustomStyles();
      
      // 이벤트 리스너 등록
      this.setupEventListeners();
      
      this.state.initialized = true;
      console.log('MessageRenderer: 초기화 완료');
      return true;
    } catch (error) {
      console.error('MessageRenderer: 초기화 오류:', error);
      this.state.hasError = true;
      this.state.lastError = error;
      return false;
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 컨테이너에 메시지가 추가될 때 이벤트
    if (this.containerElement) {
      // MutationObserver를 사용하여 DOM 변경 감시
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // 새 메시지가 추가됨 (표준 방식으로)
            this.handleNewStandardMessages(mutation.addedNodes);
          }
        });
      });
      
      observer.observe(this.containerElement, { childList: true });
    }
  }

  /**
   * 표준 방식으로 추가된 메시지 처리
   * @param {NodeList} addedNodes 추가된 노드 목록
   */
  handleNewStandardMessages(addedNodes) {
    // 표준 방식으로 추가된 메시지 개선
    addedNodes.forEach(node => {
      // 실제 메시지 요소인지 확인
      if (node.nodeType === Node.ELEMENT_NODE && 
          node.classList && 
          node.classList.contains(this.config.messageClassName)) {
        
        // 이미 처리된 메시지 건너뛰기
        if (node.dataset.enhanced === 'true') return;
        
        // 애니메이션 추가
        if (this.config.animateMessages) {
          node.style.opacity = '0';
          node.style.transform = 'translateY(20px)';
          node.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          
          // 애니메이션 시작
          setTimeout(() => {
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
          }, 10);
        }
        
        // 향상된 기능 추가
        this.enhanceMessageElement(node);
        
        // 처리 표시
        node.dataset.enhanced = 'true';
      }
    });
  }

  /**
   * 메시지 요소 향상
   * @param {HTMLElement} messageElement 메시지 요소
   */
  enhanceMessageElement(messageElement) {
    // 이미 향상된 요소는 건너뛰기
    if (messageElement.dataset.enhanced === 'true') return;
    
    try {
      // 필요한 요소가 없는 경우 추가
      // 1. 답장 버튼이 없으면 추가
      if (!messageElement.querySelector('.action-btn.reply-btn')) {
        const actionsContainer = messageElement.querySelector('.message-actions') || 
                                this.createActionsContainer(messageElement);
        
        const replyButton = document.createElement('button');
        replyButton.className = 'action-btn reply-btn';
        replyButton.innerHTML = '<i class="fas fa-reply"></i>';
        replyButton.title = '답장';
        replyButton.addEventListener('click', () => {
          // 답장 기능 호출
          if (typeof uiManager !== 'undefined' && uiManager.setReplyTo) {
            // 메시지 ID로 원본 메시지 객체 찾기
            const messageId = messageElement.dataset.id;
            if (messageId) {
              // 임시 메시지 객체 생성
              const message = {
                id: messageId,
                username: messageElement.querySelector('.username')?.textContent || '사용자',
                content: messageElement.querySelector('.message-content')?.textContent || ''
              };
              uiManager.setReplyTo(message);
            }
          }
        });
        
        actionsContainer.appendChild(replyButton);
      }
      
      // 2. 복사 버튼이 없으면 추가
      if (!messageElement.querySelector('.action-btn.copy-btn')) {
        const actionsContainer = messageElement.querySelector('.message-actions') || 
                                this.createActionsContainer(messageElement);
        
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn copy-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = '복사';
        copyButton.addEventListener('click', () => {
          const content = messageElement.querySelector('.message-content')?.textContent || '';
          if (content) {
            navigator.clipboard.writeText(content)
              .then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                  copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 1000);
              })
              .catch(err => {
                console.error('메시지 복사 오류:', err);
              });
          }
        });
        
        actionsContainer.appendChild(copyButton);
      }
      
      // 마우스 오버 시 액션 버튼 표시
      messageElement.addEventListener('mouseover', () => {
        const actions = messageElement.querySelector('.message-actions');
        if (actions) actions.style.display = 'flex';
      });
      
      messageElement.addEventListener('mouseout', () => {
        const actions = messageElement.querySelector('.message-actions');
        if (actions) actions.style.display = '';
      });
    } catch (error) {
      console.error('메시지 요소 향상 오류:', error);
    }
  }

  /**
   * 액션 컨테이너 생성
   * @param {HTMLElement} messageElement 메시지 요소
   * @returns {HTMLElement} 액션 컨테이너 요소
   */
  createActionsContainer(messageElement) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'message-actions';
    actionsContainer.style.display = 'none';
    messageElement.appendChild(actionsContainer);
    return actionsContainer;
  }

  /**
   * 사용자 정의 스타일 추가
   */
  addCustomStyles() {
    // 이미 스타일이 추가되었는지 확인
    if (document.getElementById('message-renderer-styles')) return;
    
    // 스타일 요소 생성
    const style = document.createElement('style');
    style.id = 'message-renderer-styles';
    style.textContent = `
      .message {
        position: relative;
        margin-bottom: 16px;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .message-actions {
        position: absolute;
        right: 8px;
        top: -24px;
        display: none;
        background-color: white;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        z-index: 10;
      }
      
      .action-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #757575;
        transition: all 0.2s;
      }
      
      .action-btn:hover {
        color: #3f51b5;
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .system-message {
        text-align: center;
        margin: 12px 0;
        color: #757575;
      }
      
      .system-message p {
        display: inline-block;
        background-color: #f5f5f5;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
      }
      
      .no-messages {
        text-align: center;
        color: #757575;
        margin: 40px 0;
      }
      
      .loading-messages {
        text-align: center;
        color: #757575;
        margin: 40px 0;
      }
      
      .message-group-date {
        text-align: center;
        margin: 20px 0 8px;
        font-size: 12px;
        color: #757575;
      }
      
      .message-group-date span {
        display: inline-block;
        padding: 4px 8px;
        background-color: #f5f5f5;
        border-radius: 12px;
      }
      
      /* 메시지 애니메이션 */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    
    // 문서에 추가
    document.head.appendChild(style);
  }

  /**
   * 메시지 렌더링 - 전체 메시지 목록 렌더링
   * @param {Array} messages 메시지 객체 배열
   * @param {boolean} clearContainer 컨테이너 초기화 여부
   * @returns {number} 렌더링된 메시지 수
   */
  renderMessages(messages, clearContainer = true) {
    if (!this.state.initialized) {
      if (!this.initialize()) {
        console.error('MessageRenderer: 초기화되지 않았습니다.');
        return 0;
      }
    }
    
    try {
      console.log('MessageRenderer: 메시지 렌더링 시작', messages?.length || 0);
      
      // 메시지가 없으면 안내 표시
      if (!messages || messages.length === 0) {
        if (clearContainer) {
          this.containerElement.innerHTML = '<div class="no-messages">표시할 메시지가 없습니다.</div>';
        }
        return 0;
      }
      
      // 컨테이너 초기화
      if (clearContainer) {
        this.containerElement.innerHTML = '';
      }
      
      // 최대 메시지 수 제한
      const messagesToRender = messages.slice(-this.config.maxInitialMessages);
      
      // 날짜별 그룹화 확인
      let currentDate = null;
      
      // 메시지 렌더링
      messagesToRender.forEach((message, index) => {
        // 날짜 구분선 추가
        if (this.config.showTimestamps && message.created_at) {
          const messageDate = new Date(message.created_at).toLocaleDateString();
          
          if (messageDate !== currentDate) {
            currentDate = messageDate;
            this.addDateSeparator(currentDate);
          }
        }
        
        // 메시지 요소 생성 및 추가
        const messageElement = this.createMessageElement(message);
        this.containerElement.appendChild(messageElement);
        
        // 애니메이션 적용 (각 메시지마다 약간의 지연 시간 적용)
        if (this.config.animateMessages) {
          messageElement.style.opacity = '0';
          messageElement.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
          }, 10 + (index * 30)); // 각 메시지마다 30ms 지연
        }
      });
      
      // 상태 업데이트
      this.state.messagesRendered = messagesToRender.length;
      if (messages.length > 0) {
        this.state.lastMessageId = messages[messages.length - 1].id;
      }
      
      // 스크롤 맨 아래로
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
      
      console.log('MessageRenderer: 메시지 렌더링 완료', this.state.messagesRendered);
      return this.state.messagesRendered;
    } catch (error) {
      console.error('MessageRenderer: 메시지 렌더링 오류:', error);
      this.state.hasError = true;
      this.state.lastError = error;
      
      // 오류 발생 시 기본 메시지 표시
      if (clearContainer) {
        this.containerElement.innerHTML = '<div class="system-message"><p>메시지 로드 중 오류가 발생했습니다.</p></div>';
      }
      
      return 0;
    }
  }

  /**
   * 단일 메시지 렌더링
   * @param {Object} message 메시지 객체
   * @returns {HTMLElement} 메시지 요소
   */
  renderSingleMessage(message) {
    if (!this.state.initialized) {
      if (!this.initialize()) {
        console.error('MessageRenderer: 초기화되지 않았습니다.');
        return null;
      }
    }
    
    try {
      // 메시지 요소 생성
      const messageElement = this.createMessageElement(message);
      
      // 컨테이너에 추가
      this.containerElement.appendChild(messageElement);
      
      // 애니메이션 적용
      if (this.config.animateMessages) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          messageElement.style.opacity = '1';
          messageElement.style.transform = 'translateY(0)';
        }, 10);
      }
      
      // 스크롤 맨 아래로
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
      
      return messageElement;
    } catch (error) {
      console.error('MessageRenderer: 단일 메시지 렌더링 오류:', error, message);
      return null;
    }
  }

  /**
   * 날짜 구분선 추가
   * @param {string} dateString 날짜 문자열
   */
  addDateSeparator(dateString) {
    const separator = document.createElement('div');
    separator.className = 'message-group-date';
    separator.innerHTML = `<span>${dateString}</span>`;
    this.containerElement.appendChild(separator);
  }

  /**
   * 메시지 요소 생성
   * @param {Object} message 메시지 객체
   * @returns {HTMLElement} 메시지 요소
   */
  createMessageElement(message) {
    // 현재 사용자 정보 (있으면)
    const currentUser = typeof userService !== 'undefined' ? userService.getCurrentUser() : null;
    const isOwnMessage = currentUser && message.user_id === currentUser.id;
    
    // 메시지 요소 생성
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOwnMessage ? 'own-message' : ''}`;
    messageElement.dataset.id = message.id;
    messageElement.dataset.enhanced = 'true';  // 이미 향상된 요소임을 표시
    
    // 공지사항 메시지
    if (message.is_announcement) {
      messageElement.classList.add('announcement');
    }
    
    // 메시지 헤더 (사용자 이름, 시간)
    const header = document.createElement('div');
    header.className = 'message-header';
    
    // 사용자 이름
    const username = document.createElement('span');
    username.className = 'username';
    username.textContent = message.username;
    header.appendChild(username);
    
    // 시간
    if (message.created_at) {
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = this.formatTime(message.created_at);
      header.appendChild(time);
    }
    
    messageElement.appendChild(header);
    
    // 답장인 경우 원본 메시지 표시
    if (message.reply_to) {
      const replyContainer = document.createElement('div');
      replyContainer.className = 'reply-info';
      
      // 원본 메시지 정보 (없을 경우 대체 텍스트)
      const originalContent = document.createElement('p');
      originalContent.className = 'original-message';
      originalContent.textContent = '답장 메시지';
      
      // 실제 원본 메시지 가져오기 시도
      if (typeof chatService !== 'undefined' && chatService.getMessage) {
        chatService.getMessage(message.reply_to)
          .then(originalMessage => {
            if (originalMessage) {
              originalContent.textContent = `${i18nService?.translate('replying-to') || '답장:'} ${originalMessage.username}: ${originalMessage.content.substring(0, 50)}${originalMessage.content.length > 50 ? '...' : ''}`;
            }
          })
          .catch(err => {
            console.error('원본 메시지 로드 오류:', err);
          });
      }
      
      replyContainer.appendChild(originalContent);
      messageElement.appendChild(replyContainer);
    }
    
    // 메시지 내용
    const content = document.createElement('p');
    content.className = 'message-content';
    content.textContent = message.content;
    messageElement.appendChild(content);
    
    // 번역된 메시지가 있으면 표시
    if (this.config.showTranslations && message.translated && message.translatedContent) {
      const translatedContent = document.createElement('p');
      translatedContent.className = 'translated-content';
      
      const translatedLabel = document.createElement('span');
      translatedLabel.className = 'translated-label';
      translatedLabel.textContent = `${i18nService?.translate('translated-from') || '번역:'} ${i18nService?.getLanguageName(message.language) || message.language}`;
      
      translatedContent.appendChild(translatedLabel);
      translatedContent.appendChild(document.createTextNode(' ' + message.translatedContent));
      
      messageElement.appendChild(translatedContent);
    }
    
    // 메시지 작업 (답장, 복사 등)
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    
    // 답장 버튼
    const replyButton = document.createElement('button');
    replyButton.className = 'action-btn reply-btn';
    replyButton.innerHTML = '<i class="fas fa-reply"></i>';
    replyButton.title = i18nService?.translate('reply') || '답장';
    replyButton.addEventListener('click', () => {
      if (typeof uiManager !== 'undefined' && uiManager.setReplyTo) {
        uiManager.setReplyTo(message);
      }
    });
    actions.appendChild(replyButton);
    
    // 복사 버튼
    const copyButton = document.createElement('button');
    copyButton.className = 'action-btn copy-btn';
    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
    copyButton.title = i18nService?.translate('copy') || '복사';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          copyButton.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
          }, 1000);
        })
        .catch(err => {
          console.error('텍스트 복사 오류:', err);
        });
    });
    actions.appendChild(copyButton);
    
    // 자신의 메시지가 아닌 경우 신고 버튼 추가
    if (!isOwnMessage) {
      const reportButton = document.createElement('button');
      reportButton.className = 'action-btn report-btn';
      reportButton.innerHTML = '<i class="fas fa-flag"></i>';
      reportButton.title = i18nService?.translate('report') || '신고';
      reportButton.addEventListener('click', () => {
        alert(i18nService?.translate('report-message') || '메시지가 신고되었습니다.');
      });
      actions.appendChild(reportButton);
    }
    
    messageElement.appendChild(actions);
    
    return messageElement;
  }

  /**
   * 시스템 메시지 추가
   * @param {string} text 메시지 내용
   * @returns {HTMLElement} 메시지 요소
   */
  addSystemMessage(text) {
    if (!this.state.initialized) {
      if (!this.initialize()) {
        console.error('MessageRenderer: 초기화되지 않았습니다.');
        return null;
      }
    }
    
    try {
      const messageElement = document.createElement('div');
      messageElement.className = 'message system-message';
      messageElement.innerHTML = `<p>${text}</p>`;
      
      this.containerElement.appendChild(messageElement);
      this.scrollToBottom();
      
      return messageElement;
    } catch (error) {
      console.error('MessageRenderer: 시스템 메시지 추가 오류:', error);
      return null;
    }
  }

  /**
   * 로딩 메시지 표시
   * @param {string} text 로딩 메시지 내용
   */
  showLoading(text = '메시지를 불러오는 중...') {
    if (!this.state.initialized) {
      if (!this.initialize()) {
        console.error('MessageRenderer: 초기화되지 않았습니다.');
        return;
      }
    }
    
    this.containerElement.innerHTML = `<div class="loading-messages">${text}</div>`;
  }

  /**
   * 메시지 없음 표시
   * @param {string} text 안내 메시지 내용
   */
  showNoMessages(text = '표시할 메시지가 없습니다.') {
    if (!this.state.initialized) {
      if (!this.initialize()) {
        console.error('MessageRenderer: 초기화되지 않았습니다.');
        return;
      }
    }
    
    this.containerElement.innerHTML = `<div class="no-messages">${text}</div>`;
  }

  /**
   * 스크롤 맨 아래로 이동
   */
  scrollToBottom() {
    if (this.containerElement) {
      this.containerElement.scrollTop = this.containerElement.scrollHeight;
    }
  }

  /**
   * 시간 형식화
   * @param {string} dateString ISO 날짜 문자열
   * @returns {string} 형식화된 시간
   */
  formatTime(dateString) {
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // 오늘 날짜인지 확인
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        // 시간만 표시
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        // 날짜와 시간 표시
        return date.toLocaleString([], { 
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('시간 형식화 오류:', error);
      return '';
    }
  }
}

// 싱글톤 인스턴스 생성
const messageRenderer = new MessageRenderer();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  messageRenderer.initialize();
  
  // uiManager의 refreshMessages 메서드 패치
  if (typeof uiManager !== 'undefined' && uiManager.refreshMessages) {
    console.log('MessageRenderer: uiManager.refreshMessages 패치 적용');
    
    // 원본 메서드 저장
    const originalRefreshMessages = uiManager.refreshMessages;
    
    // 메서드 재정의
    uiManager.refreshMessages = async function() {
      try {
        console.log('MessageRenderer: 패치된 refreshMessages 실행');
        
        // 로딩 표시
        messageRenderer.showLoading();
        
        // 최근 메시지 가져오기
        const messages = await chatService.getRecentMessages();
        console.log('MessageRenderer: 메시지 로드됨', messages?.length || 0);
        
        // 메시지 렌더링
        const count = messageRenderer.renderMessages(messages);
        
        // 메시지가 없으면 안내 메시지 표시
        if (count === 0) {
          messageRenderer.showNoMessages();
          console.log('MessageRenderer: 메시지가 없음');
        }
        
        return true;
      } catch (error) {
        console.error('MessageRenderer: refreshMessages 오류', error);
        
        // 오류 안내 메시지 표시
        messageRenderer.addSystemMessage('메시지 불러오기에 실패했습니다.');
        
        // 패치 실패 시 원본 메서드 시도
        try {
          return await originalRefreshMessages.call(uiManager);
        } catch (innerError) {
          console.error('MessageRenderer: 원본 refreshMessages 실행 중 오류', innerError);
          return false;
        }
      }
    };
  }
  
  // 새 메시지 처리기 패치
  if (typeof chatManager !== 'undefined' && chatManager.handleNewMessage) {
    console.log('MessageRenderer: chatManager.handleNewMessage 패치 적용');
    
    // 원본 메서드 저장
    const originalHandleNewMessage = chatManager.handleNewMessage;
    
    // 메서드 재정의
    chatManager.handleNewMessage = function(message) {
      try {
        console.log('MessageRenderer: 패치된 handleNewMessage 실행');
        
        // 메시지 렌더링
        messageRenderer.renderSingleMessage(message);
        
        // 스크롤이 바닥에 있으면 자동 스크롤
        if (chatManager.isScrolledToBottom) {
          messageRenderer.scrollToBottom();
        } else {
          // 읽지 않은 메시지 수 증가
          chatManager.unreadCount++;
          chatManager.updateUnreadBadge();
        }
        
        // 알림 표시 (브라우저 탭이 포커스되지 않은 경우)
        if (!document.hasFocus()) {
          chatManager.showNotification(message);
        }
      } catch (error) {
        console.error('MessageRenderer: handleNewMessage 오류', error);
        
        // 패치 실패 시 원본 메서드 시도
        try {
          return originalHandleNewMessage.call(chatManager, message);
        } catch (innerError) {
          console.error('MessageRenderer: 원본 handleNewMessage 실행 중 오류', innerError);
        }
      }
    };
  }
});

// 전역 객체로 노출
window.messageRenderer = messageRenderer;

console.log('MessageRenderer 모듈 로드됨');
