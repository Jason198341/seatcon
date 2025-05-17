/**
 * 채팅 기능 모듈
 * 메시지 표시, 전송, 스크롤 관리 등 채팅 관련 기능을 담당합니다.
 */

class ChatManager {
    constructor() {
        this.isScrolledToBottom = true;
        this.unreadCount = 0;
        this.reactions = {
            '👍': 0,
            '👎': 0,
            '❤️': 0,
            '😂': 0,
            '😮': 0,
            '🎉': 0
        };
    }

    /**
     * 초기화: 이벤트 리스너 등록
     */
    initialize() {
        console.log('Initializing chat manager...');
        
        // 스크롤 이벤트 리스너
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.addEventListener('scroll', this.handleScroll.bind(this));
        
        // 메시지 전송 이벤트 리스너
        document.getElementById('send-message-btn').addEventListener('click', this.sendMessage.bind(this));
        
        // 메시지 입력 이벤트 리스너
        const messageInput = document.getElementById('message-input');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 작성 중 상태 이벤트 리스너
        messageInput.addEventListener('input', this.handleTyping.bind(this));
        
        // 콜백 설정
        chatService.setMessageCallback(this.handleNewMessage.bind(this));
        
        console.log('Chat manager initialized');
        return true;
    }

    /**
     * 스크롤 이벤트 처리
     * @param {Event} e 스크롤 이벤트
     */
    handleScroll(e) {
        const container = e.target;
        
        // 스크롤이 바닥에 있는지 확인
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
        
        if (isAtBottom) {
            this.isScrolledToBottom = true;
            
            // 읽지 않은 메시지 초기화
            if (this.unreadCount > 0) {
                this.unreadCount = 0;
                this.updateUnreadBadge();
            }
        } else {
            this.isScrolledToBottom = false;
        }
    }

    /**
     * 작성 중 상태 처리
     */
    handleTyping() {
        // 실제로는 작성 중 상태를 서버에 전송하는 기능 구현 필요
        // 현재 데모에서는 생략
    }

    /**
     * 메시지 전송
     */
    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) {
            return;
        }
        
        try {
            // 답장 대상 가져오기
            const replyToId = uiManager.replyTo ? uiManager.replyTo.id : null;
            
            // 메시지 전송
            const result = await appCore.sendMessage(content, replyToId);
            
            if (!result.success) {
                console.error('Failed to send message');
                
                // 오프라인이면 로컬에 저장
                if (!offlineService.isConnected()) {
                    uiManager.addSystemMessage(i18nService.translate('message-saved-offline'));
                } else {
                    uiManager.addSystemMessage(i18nService.translate('error-sending'));
                }
            }
            
            // 입력 필드 초기화
            input.value = '';
            
            // 답장 모드 초기화
            if (uiManager.replyTo) {
                uiManager.cancelReply();
            }
            
            // 입력 필드에 포커스
            input.focus();
        } catch (error) {
            console.error('Error sending message:', error);
            uiManager.addSystemMessage(i18nService.translate('error-sending'));
        }
    }

    /**
     * 새 메시지 수신 처리
     * @param {Object} message 메시지 객체
     */
    handleNewMessage(message) {
        // 메시지 표시
        this.displayMessage(message);
        
        // 스크롤이 바닥에 있으면 자동 스크롤
        if (this.isScrolledToBottom) {
            this.scrollToBottom();
        } else {
            // 읽지 않은 메시지 수 증가
            this.unreadCount++;
            this.updateUnreadBadge();
        }
        
        // 알림 표시 (브라우저 탭이 포커스되지 않은 경우)
        if (!document.hasFocus()) {
            this.showNotification(message);
        }
    }

    /**
     * 메시지 표시
     * @param {Object} message 메시지 객체
     */
    displayMessage(message) {
        // uiManager를 사용하여 메시지 요소 생성
        const messageElement = uiManager.createMessageElement(message);
        
        // 메시지 컨테이너에 추가
        const container = document.getElementById('messages-container');
        container.appendChild(messageElement);
    }

    /**
     * 스크롤을 메시지 컨테이너의 바닥으로 이동
     */
    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }

    /**
     * 읽지 않은 메시지 뱃지 업데이트
     */
    updateUnreadBadge() {
        const badge = document.getElementById('unread-badge');
        
        if (!badge) {
            // 뱃지가 없으면 생성
            if (this.unreadCount > 0) {
                const container = document.querySelector('.chat-container');
                
                const newBadge = document.createElement('div');
                newBadge.id = 'unread-badge';
                newBadge.className = 'unread-badge';
                newBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                newBadge.addEventListener('click', () => {
                    this.scrollToBottom();
                });
                
                container.appendChild(newBadge);
            }
        } else {
            // 뱃지 업데이트
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    /**
     * 브라우저 알림 표시
     * @param {Object} message 메시지 객체
     */
    showNotification(message) {
        // 알림 권한 확인
        if (Notification.permission !== 'granted') {
            return;
        }
        
        try {
            // 메시지 내용 준비
            const title = message.username;
            const options = {
                body: message.translated && message.translatedContent ? message.translatedContent : message.content,
                icon: './assets/icon-192x192.png'
            };
            
            // 알림 표시
            const notification = new Notification(title, options);
            
            // 알림 클릭 시 채팅 창으로 포커스
            notification.onclick = () => {
                window.focus();
                this.scrollToBottom();
            };
            
            // 5초 후 알림 닫기
            setTimeout(() => {
                notification.close();
            }, 5000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    /**
     * 알림 권한 요청
     * @returns {Promise<boolean>} 권한 부여 여부
     */
    async requestNotificationPermission() {
        try {
            // 권한이 이미 부여되었는지 확인
            if (Notification.permission === 'granted') {
                return true;
            }
            
            // 권한이 이미 거부되었는지 확인
            if (Notification.permission === 'denied') {
                return false;
            }
            
            // 권한 요청
            const permission = await Notification.requestPermission();
            
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * 메시지 검색
     * @param {string} query 검색어
     * @returns {Array} 검색 결과
     */
    searchMessages(query) {
        if (!query) {
            return [];
        }
        
        const container = document.getElementById('messages-container');
        const messages = container.querySelectorAll('.message');
        const results = [];
        
        messages.forEach(message => {
            const content = message.querySelector('.message-content');
            
            if (content && content.textContent.toLowerCase().includes(query.toLowerCase())) {
                results.push(message);
            }
        });
        
        return results;
    }

    /**
     * 검색 결과 강조
     * @param {Array} results 검색 결과 요소 배열
     * @param {number} index 현재 인덱스
     */
    highlightSearchResult(results, index) {
        // 모든 하이라이트 제거
        document.querySelectorAll('.message.highlighted').forEach(message => {
            message.classList.remove('highlighted');
        });
        
        if (results.length === 0 || index < 0 || index >= results.length) {
            return;
        }
        
        // 현재 결과 강조
        const currentResult = results[index];
        currentResult.classList.add('highlighted');
        
        // 결과로 스크롤
        currentResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * 메시지에 반응 추가
     * @param {string} messageId 메시지 ID
     * @param {string} reaction 반응 이모티콘
     */
    addReaction(messageId, reaction) {
        // 지원하는 반응인지 확인
        if (!this.reactions.hasOwnProperty(reaction)) {
            return;
        }
        
        // 메시지 요소 찾기
        const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
        
        if (!messageElement) {
            return;
        }
        
        // 반응 요소 찾기 또는 생성
        let reactionsContainer = messageElement.querySelector('.message-reactions');
        
        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'message-reactions';
            messageElement.appendChild(reactionsContainer);
        }
        
        // 반응 버튼 찾기 또는 생성
        let reactionButton = reactionsContainer.querySelector(`.reaction-btn[data-reaction="${reaction}"]`);
        
        if (!reactionButton) {
            reactionButton = document.createElement('button');
            reactionButton.className = 'reaction-btn';
            reactionButton.dataset.reaction = reaction;
            reactionButton.dataset.count = '0';
            reactionButton.textContent = `${reaction} 0`;
            reactionButton.addEventListener('click', () => {
                this.toggleReaction(messageId, reaction);
            });
            
            reactionsContainer.appendChild(reactionButton);
        }
        
        // 반응 증가
        const count = parseInt(reactionButton.dataset.count) + 1;
        reactionButton.dataset.count = count.toString();
        reactionButton.textContent = `${reaction} ${count}`;
        
        // 서버에 반응 저장 (실제 구현은 생략)
    }

    /**
     * 반응 토글
     * @param {string} messageId 메시지 ID
     * @param {string} reaction 반응 이모티콘
     */
    toggleReaction(messageId, reaction) {
        // 실제로는 서버에 반응 추가/제거 요청을 보내는 기능 구현 필요
        // 현재 데모에서는 UI만 변경
        
        // 메시지 요소 찾기
        const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
        
        if (!messageElement) {
            return;
        }
        
        // 반응 버튼 찾기
        const reactionButton = messageElement.querySelector(`.reaction-btn[data-reaction="${reaction}"]`);
        
        if (!reactionButton) {
            return;
        }
        
        // 현재 카운트 가져오기
        let count = parseInt(reactionButton.dataset.count);
        
        // 현재 사용자의 반응 상태 확인 (실제로는 서버에서 확인 필요)
        const hasReacted = reactionButton.classList.contains('reacted');
        
        if (hasReacted) {
            // 반응 제거
            count = Math.max(0, count - 1);
            reactionButton.classList.remove('reacted');
        } else {
            // 반응 추가
            count++;
            reactionButton.classList.add('reacted');
        }
        
        // 버튼 업데이트
        reactionButton.dataset.count = count.toString();
        reactionButton.textContent = `${reaction} ${count}`;
        
        // 반응이 0이면 버튼 제거
        if (count === 0) {
            reactionButton.remove();
            
            // 반응 컨테이너에 버튼이 없으면 컨테이너도 제거
            const reactionsContainer = messageElement.querySelector('.message-reactions');
            
            if (reactionsContainer && reactionsContainer.children.length === 0) {
                reactionsContainer.remove();
            }
        }
    }
}

// 싱글톤 인스턴스 생성
const chatManager = new ChatManager();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    chatManager.initialize();
    
    // 페이지 로드 시 알림 권한 확인
    Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
    }).catch(error => {
        console.error('Error requesting notification permission:', error);
    });
});
