/**
 * app-chat.js
 * Global SeatCon 2025 Conference Chat
 * 채팅 기능 관련 모듈
 */

// APP 객체는 이미 window.APP으로 초기화되어 있음

// 채팅 모듈
APP.chat = (() => {
    // 렌더링 최적화 설정
    const RENDER_DEBOUNCE_TIME = 50; // 렌더링 디바운스 시간 (ms)
    let renderTimer = null;
    
    // 메시지 이벤트 처리
    const handleMessageEvent = function(eventType, messageData) {
        // 렌더링 최적화: 디바운스 처리
        if (renderTimer) {
            clearTimeout(renderTimer);
        }
        
        renderTimer = setTimeout(() => {
            switch (eventType) {
                case 'new':
                    // 새 메시지 추가 - 중복 메시지 확인
                    const existingMessage = document.querySelector(`.message[data-id="${messageData.id}"]`);
                    if (!existingMessage) {
                        renderMessage(messageData);
                        
                        // 맨 아래로 스크롤 (자동 스크롤이 활성화된 경우에만)
                        if (APP.messages.pendingScrollToBottom) {
                            APP.ui.scrollToBottom();
                        }
                    }
                    break;
                    
                case 'list':
                    // 메시지 목록 렌더링
                    renderMessageList(messageData);
                    APP.ui.scrollToBottom();
                    break;
                    
                case 'update':
                    // 메시지 업데이트
                    updateMessage(messageData);
                    break;
            }
        }, RENDER_DEBOUNCE_TIME);
    };
    
    // 메시지 영역 스크롤 이벤트 처리
    const handleMessageScroll = function() {
        if (!APP.elements.messageContainer) return;
        
        const container = APP.elements.messageContainer;
        
        // 스크롤이 맨 위에 도달하면 더 오래된 메시지 로드
        if (container.scrollTop <= 50) {
            loadOlderMessages();
        }
        
        // 스크롤이 맨 아래에 가까우면 자동 스크롤 활성화
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        APP.messages.pendingScrollToBottom = isNearBottom;
    };
    
    // 더 오래된 메시지 로드
    const loadOlderMessages = async function() {
        if (!APP.state.currentRoomId || !APP.state.servicesReady) return;
        
        try {
            // 로딩 표시 - 상단에만 작게 표시
            const loadingIndicator = document.getElementById('older-messages-loading');
            if (!loadingIndicator && APP.elements.messageContainer) {
                const indicator = document.createElement('div');
                indicator.id = 'older-messages-loading';
                indicator.className = 'messages-loading';
                indicator.textContent = APP.i18n.translate('chat.loading') || 'Loading...';
                APP.elements.messageContainer.prepend(indicator);
            }
            
            // 메시지 목록 크기 저장 (스크롤 위치 유지 목적)
            const oldScrollHeight = APP.elements.messageContainer ? APP.elements.messageContainer.scrollHeight : 0;
            
            // 더 오래된 메시지 로드
            await chatService.loadOlderMessages();
            
            // 스크롤 위치 유지
            setTimeout(() => {
                if (!APP.elements.messageContainer) return;
                
                const newScrollHeight = APP.elements.messageContainer.scrollHeight;
                const heightDiff = newScrollHeight - oldScrollHeight;
                
                if (heightDiff > 0) {
                    APP.elements.messageContainer.scrollTop = heightDiff;
                }
                
                // 로딩 표시 제거
                const loadingIndicator = document.getElementById('older-messages-loading');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }, 100);
        } catch (error) {
            console.error('이전 메시지 로드 실패:', error);
            
            // 로딩 표시 제거
            const loadingIndicator = document.getElementById('older-messages-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    };
    
    // 메시지 전송
    const sendMessage = async function() {
        if (!APP.elements.messageInput) return;
        
        const messageText = APP.elements.messageInput.value.trim();
        
        if (!messageText) return;
        
        try {
            // 공지사항 여부 확인
            const isAnnouncement = messageText.startsWith('/공지 ');
            const finalText = isAnnouncement ? messageText.substring(4).trim() : messageText;
            
            // 메시지 전송
            if (isAnnouncement) {
                await chatService.sendAnnouncement(finalText);
            } else {
                await chatService.sendMessage(finalText);
            }
            
            // 입력 필드 초기화
            APP.elements.messageInput.value = '';
            APP.ui.autoResizeMessageInput();
            
            // 답장 정보 초기화
            clearReplyPreview();
            
            // 입력 필드에 포커스
            APP.elements.messageInput.focus();
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            APP.ui.showError(APP.i18n.translate('error.sendMessage') || 'Failed to send the message.');
        }
    };
    
    // 메시지 목록 렌더링
    const renderMessageList = function(messages) {
        if (!messages || messages.length === 0 || !APP.elements.messageContainer) {
            return;
        }
        
        // 메시지 컨테이너 초기화
        APP.elements.messageContainer.innerHTML = '';
        APP.messages.lastMessageTime = null;
        
        // 현재 채팅방에 속한 메시지만 필터링
        const filteredMessages = Array.isArray(messages) ? messages.filter(message => 
            message && message.chatroom_id === APP.state.currentRoomId
        ) : [];
        
        // 만약 메시지가 없으면 안내 메시지 표시
        if (filteredMessages.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-messages';
            emptyDiv.textContent = APP.i18n.translate('chat.noMessages') || 'No messages in this chat room yet. Start the conversation!';
            APP.elements.messageContainer.appendChild(emptyDiv);
            return;
        }
        
        // 날짜순 정렬
        filteredMessages.sort((a, b) => {
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        // 대량의 메시지 렌더링 성능 최적화: 배치 처리
        const batchSize = APP.performance.messageRenderBatchSize;
        
        const renderBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + batchSize, filteredMessages.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                renderMessage(filteredMessages[i], true);
            }
            
            // 다음 배치가 있으면 처리
            if (endIndex < filteredMessages.length) {
                setTimeout(() => renderBatch(endIndex), 10);
            } else {
                // 모든 메시지 렌더링 완료 후 스크롤 처리
                APP.ui.scrollToBottom();
            }
        };
        
        // 첫 번째 배치 렌더링 시작
        renderBatch(0);
    };
    
    // 단일 메시지 렌더링
    const renderMessage = function(message, skipScroll = false) {
        if (!message || !message.id || !message.message || !APP.elements.messageContainer) {
            console.warn('유효하지 않은 메시지 무시:', message);
            return;
        }
        
        // 중복 메시지 확인
        if (document.querySelector(`.message[data-id="${message.id}"]`)) {
            // 이미 렌더링된 메시지는 업데이트만 진행
            updateMessage(message);
            return;
        }
        
        // 메시지 시간 표시 여부 결정
        const messageDate = new Date(message.created_at);
        const showTime = !APP.messages.lastMessageTime || 
            (messageDate.getTime() - APP.messages.lastMessageTime.getTime() > 5 * 60 * 1000);
        
        if (showTime) {
            APP.messages.lastMessageTime = messageDate;
            
            // 시간 구분선 추가
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time-divider';
            timeDiv.textContent = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            APP.elements.messageContainer.appendChild(timeDiv);
        }
        
        // 메시지 요소 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.dataset.id = message.id;
        
        // 자신의 메시지인지 공지인지에 따라 클래스 추가
        if (message.user_id === APP.state.currentUser?.id) {
            messageDiv.classList.add('own');
        }
        
        if (message.isannouncement) {
            messageDiv.classList.add('announcement');
        }
        
        // 메시지 동기화 상태에 따른 클래스 추가
        if (message.isPending) {
            messageDiv.classList.add('pending');
        }
        
        if (message.isSyncing) {
            messageDiv.classList.add('syncing');
        }
        
        if (message.syncFailed) {
            messageDiv.classList.add('sync-failed');
        }
        
        // 메시지 내용 구성
        let messageContent = '';
        
        // 답장 정보가 있는 경우 추가
        if (message.reply_to) {
            messageContent += `
                <div class="reply-info">
                    <div class="reply-username">${message.reply_to.username}</div>
                    <div class="reply-text">${message.reply_to.message}</div>
                </div>
            `;
        }
        
        // 공지사항이 아닌 경우 메시지 헤더 추가
        if (!message.isannouncement) {
            messageContent += `
                <div class="message-header">
                    <span class="message-username">${message.username}</span>
                    <span class="message-time">${APP.messages.timeFormat.format(messageDate)}</span>
                </div>
            `;
        }
        
        // 메시지 텍스트 추가
        messageContent += `<div class="message-text">${formatMessageText(message.message)}</div>`;
        
        // 번역된 메시지인 경우 원본 표시 버튼 추가
        if (message.translated && message.original_message) {
            messageContent += `
                <div class="translation-info">
                    <span class="translation-label">${APP.i18n.translate('chat.translated') || 'Translated'}</span>
                    <button class="show-original" data-original="${encodeURIComponent(message.original_message)}" data-language="${message.language}">${APP.i18n.translate('chat.showOriginal') || 'Show Original'}</button>
                </div>
            `;
        }
        
        // 메시지 상태 표시
        if (message.isPending) {
            messageContent += `<div class="message-status pending">${APP.i18n.translate('chat.sending') || 'Sending...'}</div>`;
        } else if (message.isSyncing) {
            messageContent += `<div class="message-status syncing">${APP.i18n.translate('chat.syncing') || 'Syncing...'}</div>`;
        } else if (message.syncFailed) {
            messageContent += `<div class="message-status failed">${APP.i18n.translate('chat.sendFailed') || 'Send Failed'}</div>`;
        }
        
        // 메시지 작업 버튼 추가 (자신의 메시지가 아닌 경우에만 답장 버튼 표시)
        if (!message.isannouncement && message.user_id !== APP.state.currentUser?.id) {
            messageContent += `
                <div class="message-actions">
                    <button class="reply-button" data-id="${message.id}">${APP.i18n.translate('chat.reply') || 'Reply'}</button>
                </div>
            `;
        }
        
        // 메시지 내용 설정
        messageDiv.innerHTML = messageContent;
        
        // 메시지 이벤트 리스너 등록
        const replyButton = messageDiv.querySelector('.reply-button');
        if (replyButton) {
            replyButton.addEventListener('click', () => {
                setReplyTo(message);
            });
        }
        
        const showOriginalButton = messageDiv.querySelector('.show-original');
        if (showOriginalButton) {
            showOriginalButton.addEventListener('click', function() {
                const originalText = decodeURIComponent(this.dataset.original);
                const language = translationService.getLanguageName(this.dataset.language);
                
                // 원본 메시지 표시 (모달 대신 알림창 사용)
                alert(`${APP.i18n.translate('chat.originalMessage') || 'Original message'} (${language}):\n${originalText}`);
            });
        }
        
        // 메시지 컨테이너에 추가
        APP.elements.messageContainer.appendChild(messageDiv);
        
        // 스크롤 최하단으로 이동 (옵션에 따라)
        if (!skipScroll && APP.messages.pendingScrollToBottom) {
            APP.ui.scrollToBottom();
        }
    };
    
    // 메시지 업데이트
    const updateMessage = function(message) {
        if (!message) return;
        
        // 메시지 요소 찾기
        const messageDiv = document.querySelector(`.message[data-id="${message.id}"]`);
        if (!messageDiv) return;
        
        // 상태 클래스 업데이트
        messageDiv.classList.remove('pending', 'syncing', 'sync-failed');
        
        if (message.isPending) {
            messageDiv.classList.add('pending');
        }
        
        if (message.isSyncing) {
            messageDiv.classList.add('syncing');
        }
        
        if (message.syncFailed) {
            messageDiv.classList.add('sync-failed');
        }
        
        // 메시지 텍스트 업데이트 (번역된 경우)
        const messageTextElement = messageDiv.querySelector('.message-text');
        if (messageTextElement && message.message) {
            messageTextElement.innerHTML = formatMessageText(message.message);
        }
        
        // 원본 메시지 버튼 추가 또는 업데이트 (번역된 경우)
        let translationInfoElement = messageDiv.querySelector('.translation-info');
        
        if (message.translated && message.original_message) {
            if (!translationInfoElement) {
                translationInfoElement = document.createElement('div');
                translationInfoElement.className = 'translation-info';
                
                // 메시지 텍스트 요소 다음에 삽입
                if (messageTextElement) {
                    messageTextElement.insertAdjacentElement('afterend', translationInfoElement);
                } else {
                    messageDiv.appendChild(translationInfoElement);
                }
            }
            
            translationInfoElement.innerHTML = `
                <span class="translation-label">${APP.i18n.translate('chat.translated') || 'Translated'}</span>
                <button class="show-original" data-original="${encodeURIComponent(message.original_message)}" data-language="${message.language}">${APP.i18n.translate('chat.showOriginal') || 'Show Original'}</button>
            `;
            
            // 원본 메시지 표시 버튼 이벤트 등록
            const showOriginalButton = translationInfoElement.querySelector('.show-original');
            if (showOriginalButton) {
                showOriginalButton.addEventListener('click', function() {
                    const originalText = decodeURIComponent(this.dataset.original);
                    const language = translationService.getLanguageName(this.dataset.language);
                    
                    alert(`${APP.i18n.translate('chat.originalMessage') || 'Original message'} (${language}):\n${originalText}`);
                });
            }
        } else if (translationInfoElement) {
            // 번역 정보가 없어지면 요소 제거
            translationInfoElement.remove();
        }
        
        // 상태 메시지 업데이트
        let statusDiv = messageDiv.querySelector('.message-status');
        
        if (!statusDiv && (message.isPending || message.isSyncing || message.syncFailed)) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'message-status';
            messageDiv.appendChild(statusDiv);
        }
        
        if (statusDiv) {
            if (message.isPending) {
                statusDiv.className = 'message-status pending';
                statusDiv.textContent = APP.i18n.translate('chat.sending') || 'Sending...';
            } else if (message.isSyncing) {
                statusDiv.className = 'message-status syncing';
                statusDiv.textContent = APP.i18n.translate('chat.syncing') || 'Syncing...';
            } else if (message.syncFailed) {
                statusDiv.className = 'message-status failed';
                statusDiv.textContent = APP.i18n.translate('chat.sendFailed') || 'Send Failed';
            } else {
                statusDiv.remove();
            }
        }
    };
    
    // 메시지 텍스트 포맷팅
    const formatMessageText = function(text) {
        if (!text) return '';
        
        // HTML 이스케이프
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // URL을 링크로 변환
        text = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // 줄바꿈 처리
        text = text.replace(/\n/g, '<br>');
        
        // 이모지 강조 (선택 사항)
        text = text.replace(/([\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}])/gu, '<span class="emoji">$1</span>');
        
        return text;
    };
    
    // 답장 설정
    const setReplyTo = function(message) {
        if (!message || !APP.elements.replyPreview) return;
        
        // 답장 정보 설정
        chatService.setReplyTo(message);
        
        // 답장 미리보기 표시
        const previewContent = APP.elements.replyPreview.querySelector('.reply-content');
        if (previewContent) {
            previewContent.textContent = `${message.username}: ${message.message}`;
        }
        
        // 답장 미리보기 표시 및 입력 필드 포커스
        APP.elements.replyPreview.classList.add('active');
        if (APP.elements.messageInput) {
            APP.elements.messageInput.focus();
        }
        
        // 취소 버튼 이벤트 리스너 등록
        const cancelButton = APP.elements.replyPreview.querySelector('.cancel-reply');
        if (cancelButton) {
            cancelButton.onclick = clearReplyPreview;
        }
    };
    
    // 답장 미리보기 초기화
    const clearReplyPreview = function() {
        // 답장 정보 초기화
        if (APP.state.servicesReady) {
            chatService.clearReplyTo();
        }
        
        // 답장 미리보기 숨기기
        if (APP.elements.replyPreview) {
            APP.elements.replyPreview.classList.remove('active');
        }
    };
    
    // 연결 상태 변경 처리
    const handleConnectionChange = function(status) {
        updateConnectionStatus();
    };
    
    // 연결 상태 업데이트
    const updateConnectionStatus = function() {
        // 기본 상태 설정
        let isOnline = true;
        let realtimeStatus = 'online';
        
        try {
            // 서비스가 준비되었는지 확인
            if (APP.state.servicesReady) {
                // 네트워크 상태 확인
                isOnline = navigator.onLine;
                
                // offlineService가 준비되었는지 확인
                if (typeof offlineService !== 'undefined' && typeof offlineService.isNetworkOnline === 'function') {
                    isOnline = offlineService.isNetworkOnline();
                }
                
                // realtimeService가 준비되었는지 확인
                if (typeof realtimeService !== 'undefined' && typeof realtimeService.getConnectionStatus === 'function') {
                    realtimeStatus = realtimeService.getConnectionStatus();
                }
            }
        } catch (error) {
            console.warn('연결 상태 확인 중 오류 발생:', error);
        }
        
        // 연결 상태에 따른 클래스 및 텍스트 설정
        let statusClass = '';
        let statusText = '';
        
        if (!isOnline) {
            statusClass = 'offline';
            statusText = APP.i18n.translate('connection.offline') || '오프라인';
        } else if (realtimeStatus === 'connecting') {
            statusClass = 'connecting';
            statusText = APP.i18n.translate('connection.connecting') || '연결 중...';
        } else {
            statusClass = 'online';
            statusText = APP.i18n.translate('connection.online') || '온라인';
        }
        
        // 로그인 화면 상태 표시
        if (APP.elements.connectionIndicator) {
            APP.elements.connectionIndicator.className = statusClass;
        }
        
        if (APP.elements.connectionText) {
            APP.elements.connectionText.textContent = statusText;
        }
        
        // 채팅 화면 상태 표시
        if (APP.elements.chatConnectionIndicator) {
            APP.elements.chatConnectionIndicator.className = statusClass;
        }
        
        if (APP.elements.chatConnectionText) {
            APP.elements.chatConnectionText.textContent = statusText;
        }
        
        // 동기화 상태 표시
        if (APP.elements.syncStatus && APP.state.servicesReady) {
            let offlineCount = 0;
            
            try {
                if (typeof offlineService !== 'undefined' && typeof offlineService.getOfflineMessageCount === 'function') {
                    offlineCount = offlineService.getOfflineMessageCount();
                }
            } catch (error) {
                console.warn('오프라인 메시지 수 확인 중 오류 발생:', error);
            }
            
            if (offlineCount > 0 && isOnline) {
                APP.elements.syncStatus.classList.remove('hidden');
            } else {
                APP.elements.syncStatus.classList.add('hidden');
            }
        }
    };
    
    // 공개 API
    return {
        handleMessageEvent,
        handleMessageScroll,
        loadOlderMessages,
        sendMessage,
        renderMessageList,
        renderMessage,
        updateMessage,
        formatMessageText,
        setReplyTo,
        clearReplyPreview,
        handleConnectionChange,
        updateConnectionStatus
    };
})();
