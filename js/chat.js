/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 채팅 기능 구현
 * 작성일: 2025-05-07
 */

// 채팅 상태 관리
const chatState = {
    currentRoomId: null,
    messages: [],
    pinnedMessages: [],
    lastMessageTimestamp: null,
    isReplying: false,
    replyToMessage: null,
    messageSubscription: null,
    messageUpdateSubscription: null,
    likesSubscription: null,
    preferredLanguage: 'ko',
    
    // 상태 초기화
    reset() {
        this.messages = [];
        this.pinnedMessages = [];
        this.lastMessageTimestamp = null;
        this.isReplying = false;
        this.replyToMessage = null;
        
        // 구독 해제
        this.unsubscribeAll();
    },
    
    // 구독 해제
    unsubscribeAll() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
            this.messageSubscription = null;
        }
        
        if (this.messageUpdateSubscription) {
            this.messageUpdateSubscription.unsubscribe();
            this.messageUpdateSubscription = null;
        }
        
        if (this.likesSubscription) {
            this.likesSubscription.unsubscribe();
            this.likesSubscription = null;
        }
    },
    
    // 선호 언어 설정
    setPreferredLanguage(language) {
        this.preferredLanguage = language;
        localStorage.setItem('preferredLanguage', language);
    },
    
    // 선호 언어 로드
    loadPreferredLanguage() {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
            this.preferredLanguage = savedLanguage;
        }
    }
};

/**
 * 채팅방 초기화 함수
 * @param {string} roomId - 채팅방 ID
 * @returns {Promise<boolean>} - 초기화 성공 여부
 */
async function initializeChat(roomId) {
    try {
        // 기존 구독 해제 및 상태 초기화
        chatState.reset();
        
        // 채팅방 ID 설정
        chatState.currentRoomId = roomId;
        
        // 채팅방의 고정된 메시지 로드
        const pinnedMessages = await window.supabaseService.getPinnedMessages(roomId);
        chatState.pinnedMessages = pinnedMessages || [];
        
        // 고정된 메시지 UI 업데이트
        updatePinnedMessagesUI();
        
        // 채팅방의 메시지 로드
        const messages = await window.supabaseService.getMessages(roomId);
        
        // 메시지 번역 및 상태 업데이트
        if (messages && messages.length > 0) {
            const translatedMessages = await window.translationService.translateMessages(
                messages,
                chatState.preferredLanguage
            );
            
            chatState.messages = translatedMessages;
            chatState.lastMessageTimestamp = new Date(
                translatedMessages[translatedMessages.length - 1].created_at
            ).getTime();
            
            // 메시지 UI 업데이트
            updateMessagesUI();
        }
        
        // 새 메시지 구독
        subscribeToNewMessages();
        
        // 메시지 업데이트 구독
        subscribeToMessageUpdates();
        
        // 좋아요 구독
        subscribeToLikes();
        
        return true;
    } catch (error) {
        console.error('채팅방 초기화 오류:', error);
        return false;
    }
}

/**
 * 새 메시지 구독 함수
 */
function subscribeToNewMessages() {
    if (!chatState.currentRoomId) return;
    
    chatState.messageSubscription = window.supabaseService.subscribeToMessages(
        chatState.currentRoomId,
        async (newMessage) => {
            try {
                // 완전한 메시지 정보 조회
                const { data: fullMessage, error } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        user:user_id (id, username, role, avatar_url),
                        reply_to:reply_to_id (
                            id, 
                            content, 
                            user_id (id, username)
                        ),
                        likes (
                            id,
                            user_id
                        )
                    `)
                    .eq('id', newMessage.id)
                    .single();
                
                if (error) throw error;
                
                // 메시지 번역
                const translatedMessage = await window.translationService.translateMessage(
                    fullMessage,
                    chatState.preferredLanguage
                );
                
                // 메시지 목록에 추가
                chatState.messages.push(translatedMessage);
                chatState.lastMessageTimestamp = new Date(translatedMessage.created_at).getTime();
                
                // 메시지 추가 이벤트 발생
                document.dispatchEvent(new CustomEvent('newMessage', { detail: translatedMessage }));
                
                // 고정된 메시지인 경우 고정 목록 업데이트
                if (translatedMessage.is_pinned) {
                    chatState.pinnedMessages.push(translatedMessage);
                    updatePinnedMessagesUI();
                }
            } catch (error) {
                console.error('새 메시지 처리 오류:', error);
            }
        }
    );
}

/**
 * 메시지 업데이트 구독 함수
 */
function subscribeToMessageUpdates() {
    if (!chatState.currentRoomId) return;
    
    chatState.messageUpdateSubscription = window.supabaseService.subscribeToMessageUpdates(
        chatState.currentRoomId,
        async (updatedMessage) => {
            try {
                // 완전한 메시지 정보 조회
                const { data: fullMessage, error } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        user:user_id (id, username, role, avatar_url),
                        reply_to:reply_to_id (
                            id, 
                            content, 
                            user_id (id, username)
                        ),
                        likes (
                            id,
                            user_id
                        )
                    `)
                    .eq('id', updatedMessage.id)
                    .single();
                
                if (error) throw error;
                
                // 메시지 번역
                const translatedMessage = await window.translationService.translateMessage(
                    fullMessage,
                    chatState.preferredLanguage
                );
                
                // 메시지 목록 업데이트
                const index = chatState.messages.findIndex(m => m.id === translatedMessage.id);
                if (index !== -1) {
                    chatState.messages[index] = translatedMessage;
                }
                
                // 메시지 업데이트 이벤트 발생
                document.dispatchEvent(new CustomEvent('messageUpdated', { detail: translatedMessage }));
                
                // 고정된 메시지 목록 업데이트
                const pinnedIndex = chatState.pinnedMessages.findIndex(m => m.id === translatedMessage.id);
                
                if (translatedMessage.is_pinned) {
                    if (pinnedIndex !== -1) {
                        chatState.pinnedMessages[pinnedIndex] = translatedMessage;
                    } else {
                        chatState.pinnedMessages.push(translatedMessage);
                    }
                } else if (pinnedIndex !== -1) {
                    chatState.pinnedMessages.splice(pinnedIndex, 1);
                }
                
                updatePinnedMessagesUI();
            } catch (error) {
                console.error('메시지 업데이트 처리 오류:', error);
            }
        }
    );
}

/**
 * 좋아요 구독 함수
 */
function subscribeToLikes() {
    chatState.likesSubscription = window.supabaseService.subscribeToLikes(
        async (payload) => {
            try {
                const like = payload.new || payload.old;
                
                if (!like) return;
                
                // 현재 채팅방의 메시지인지 확인
                const messageIndex = chatState.messages.findIndex(m => m.id === like.message_id);
                if (messageIndex === -1) return;
                
                // 완전한 메시지 정보 조회
                const { data: fullMessage, error } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        user:user_id (id, username, role, avatar_url),
                        reply_to:reply_to_id (
                            id, 
                            content, 
                            user_id (id, username)
                        ),
                        likes (
                            id,
                            user_id
                        )
                    `)
                    .eq('id', like.message_id)
                    .single();
                
                if (error) throw error;
                
                // 메시지 번역
                const translatedMessage = await window.translationService.translateMessage(
                    fullMessage,
                    chatState.preferredLanguage
                );
                
                // 메시지 목록 업데이트
                chatState.messages[messageIndex] = translatedMessage;
                
                // 좋아요 업데이트 이벤트 발생
                document.dispatchEvent(new CustomEvent('likeUpdated', { 
                    detail: {
                        messageId: like.message_id,
                        added: payload.eventType === 'INSERT',
                        userId: like.user_id
                    }
                }));
                
                // 고정된 메시지인 경우 고정 목록도 업데이트
                const pinnedIndex = chatState.pinnedMessages.findIndex(m => m.id === translatedMessage.id);
                if (pinnedIndex !== -1) {
                    chatState.pinnedMessages[pinnedIndex] = translatedMessage;
                    updatePinnedMessagesUI();
                }
            } catch (error) {
                console.error('좋아요 업데이트 처리 오류:', error);
            }
        }
    );
}

/**
 * 메시지 전송 함수
 * @param {string} content - 메시지 내용
 * @returns {Promise<Object>} - 전송된 메시지 객체
 */
async function sendMessage(content) {
    try {
        if (!authState.isValid() || !chatState.currentRoomId) {
            throw new Error('인증되지 않았거나 채팅방이 선택되지 않았습니다.');
        }
        
        // 내용 없는 메시지 방지
        if (!content || content.trim() === '') {
            throw new Error('메시지 내용을 입력해주세요.');
        }
        
        // 언어 감지
        let detectedLanguage;
        try {
            detectedLanguage = await window.translationService.detectLanguage(content);
        } catch (error) {
            console.warn('언어 감지 오류, 기본값 사용:', error);
            detectedLanguage = chatState.preferredLanguage;
        }
        
        // 메시지 생성
        const message = await window.supabaseService.createMessage(
            chatState.currentRoomId,
            authState.user.id,
            content,
            detectedLanguage,
            chatState.isReplying ? chatState.replyToMessage.id : null
        );
        
        // 답장 모드 초기화
        if (chatState.isReplying) {
            cancelReply();
        }
        
        return message;
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        throw error;
    }
}

/**
 * 메시지 좋아요 토글 함수
 * @param {string} messageId - 메시지 ID
 * @returns {Promise<Object>} - 결과 객체
 */
async function toggleLike(messageId) {
    try {
        if (!authState.isValid()) {
            throw new Error('인증되지 않았습니다.');
        }
        
        const result = await window.supabaseService.addLike(messageId, authState.user.id);
        return result;
    } catch (error) {
        console.error('좋아요 토글 오류:', error);
        throw error;
    }
}

/**
 * 메시지 고정 토글 함수
 * @param {string} messageId - 메시지 ID
 * @param {boolean} isPinned - 고정 여부
 * @returns {Promise<Object>} - 업데이트된 메시지 객체
 */
async function togglePinMessage(messageId, isPinned) {
    try {
        // 스태프 권한 확인
        if (!authState.isValid() || authState.user.role !== 'staff') {
            throw new Error('메시지 고정은 스태프만 가능합니다.');
        }
        
        const updatedMessage = await window.supabaseService.togglePinMessage(messageId, isPinned);
        return updatedMessage;
    } catch (error) {
        console.error('메시지 고정 토글 오류:', error);
        throw error;
    }
}

/**
 * 답장 모드 설정 함수
 * @param {Object} message - 답장할 메시지 객체
 */
function setReplyMode(message) {
    chatState.isReplying = true;
    chatState.replyToMessage = message;
    
    // 답장 UI 업데이트 이벤트 발생
    document.dispatchEvent(new CustomEvent('replyModeChanged', { 
        detail: { 
            isReplying: true, 
            message 
        } 
    }));
}

/**
 * 답장 모드 취소 함수
 */
function cancelReply() {
    chatState.isReplying = false;
    chatState.replyToMessage = null;
    
    // 답장 UI 업데이트 이벤트 발생
    document.dispatchEvent(new CustomEvent('replyModeChanged', { 
        detail: { 
            isReplying: false 
        } 
    }));
}

/**
 * 선호 언어 변경 함수
 * @param {string} language - 언어 코드
 */
async function changeLanguage(language) {
    try {
        if (!SUPPORTED_LANGUAGES[language]) {
            throw new Error('지원되지 않는 언어입니다.');
        }
        
        // 현재 언어와 같으면 변경 불필요
        if (chatState.preferredLanguage === language) {
            return true;
        }
        
        // 선호 언어 업데이트
        chatState.setPreferredLanguage(language);
        
        // 로그인 상태인 경우 사용자 정보 업데이트
        if (authState.isValid()) {
            const { data, error } = await supabase
                .from('users')
                .update({ preferred_language: language })
                .eq('id', authState.user.id);
            
            if (error) throw error;
            
            // 사용자 정보 업데이트
            authState.user.preferred_language = language;
            authState.save();
        }
        
        // 기존 메시지 재번역
        if (chatState.messages.length > 0) {
            const translatedMessages = await window.translationService.translateMessages(
                chatState.messages,
                language
            );
            
            chatState.messages = translatedMessages;
            
            // 고정된 메시지도 재번역
            if (chatState.pinnedMessages.length > 0) {
                const translatedPinnedMessages = await window.translationService.translateMessages(
                    chatState.pinnedMessages,
                    language
                );
                
                chatState.pinnedMessages = translatedPinnedMessages;
                updatePinnedMessagesUI();
            }
            
            // 메시지 UI 업데이트
            updateMessagesUI();
        }
        
        // 언어 변경 이벤트 발생
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
        
        return true;
    } catch (error) {
        console.error('언어 변경 오류:', error);
        return false;
    }
}

/**
 * 고정된 메시지 UI 업데이트 함수
 */
function updatePinnedMessagesUI() {
    const pinnedMessagesContainer = document.querySelector('.pinned-messages');
    
    // 고정된 메시지가 없으면 컨테이너 숨김
    if (!chatState.pinnedMessages || chatState.pinnedMessages.length === 0) {
        pinnedMessagesContainer.classList.remove('active');
        pinnedMessagesContainer.innerHTML = '';
        return;
    }
    
    // 고정된 메시지 UI 구성
    pinnedMessagesContainer.innerHTML = '';
    
    chatState.pinnedMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'pinned-message';
        messageElement.dataset.id = message.id;
        
        const content = message.translated_content || message.content;
        
        messageElement.innerHTML = `
            <div class="pinned-message-header">
                <span class="pinned-message-sender">${message.user.username}</span>
                <span class="pinned-message-role ${message.user.role}">${message.user.role}</span>
            </div>
            <div class="pinned-message-content">${content}</div>
            <div class="pinned-message-footer">
                <span class="pinned-message-time">${formatTime(message.created_at)}</span>
                <button class="btn-icon unpin-message-btn" data-id="${message.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        pinnedMessagesContainer.appendChild(messageElement);
    });
    
    // 고정된 메시지 컨테이너 표시
    pinnedMessagesContainer.classList.add('active');
    
    // 고정 해제 버튼 이벤트 추가
    document.querySelectorAll('.unpin-message-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const messageId = button.dataset.id;
            
            try {
                await togglePinMessage(messageId, false);
            } catch (error) {
                console.error('메시지 고정 해제 오류:', error);
                alert('메시지 고정 해제 중 오류가 발생했습니다.');
            }
        });
    });
    
    // 고정된 메시지 클릭 이벤트 추가 (해당 메시지로 스크롤)
    document.querySelectorAll('.pinned-message').forEach(pinnedMessage => {
        pinnedMessage.addEventListener('click', () => {
            const messageId = pinnedMessage.dataset.id;
            const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
            
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth' });
                messageElement.classList.add('highlight');
                
                // 강조 효과 제거
                setTimeout(() => {
                    messageElement.classList.remove('highlight');
                }, 2000);
            }
        });
    });
}

/**
 * 메시지 UI 업데이트 함수
 */
function updateMessagesUI() {
    const messagesContainer = document.querySelector('.messages-container');
    
    // 메시지가 없으면 빈 컨테이너 표시
    if (!chatState.messages || chatState.messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comments"></i>
                <p>아직 메시지가 없습니다. 대화를 시작해보세요!</p>
            </div>
        `;
        return;
    }
    
    // 스크롤 위치 저장
    const isScrolledToBottom = isAtBottom(messagesContainer);
    
    // 메시지 UI 구성
    messagesContainer.innerHTML = '';
    
    chatState.messages.forEach(message => {
        const isCurrentUser = authState.isValid() && authState.user.id === message.user_id;
        const messageClass = isCurrentUser ? 'message outgoing' : 'message';
        
        const messageElement = document.createElement('div');
        messageElement.className = messageClass;
        messageElement.dataset.id = message.id;
        
        // 답장 정보 생성
        let replyInfo = '';
        if (message.reply_to) {
            const replyText = message.reply_to.translated_content || message.reply_to.content;
            replyInfo = `
                <div class="message-reply-info" data-reply-id="${message.reply_to.id}">
                    <div class="message-reply-to">
                        <span>회신 대상: ${message.reply_to.user_id.username}</span>
                    </div>
                    <div class="message-reply-text">${replyText}</div>
                </div>
            `;
        }
        
        // 좋아요 정보 생성
        const likes = message.likes || [];
        const likeCount = likes.length;
        const hasLiked = authState.isValid() && likes.some(like => like.user_id === authState.user.id);
        const likeButtonClass = hasLiked ? 'message-like active' : 'message-like';
        
        // 번역된 내용 사용
        const content = message.translated_content || message.content;
        
        // 원본 번역 토글 버튼 (원본 언어가 현재 언어와 다른 경우만 표시)
        let translationToggle = '';
        if (message.original_language !== chatState.preferredLanguage) {
            translationToggle = `
                <div class="message-translation-toggle" data-translated="false">
                    원본 텍스트 보기 (${SUPPORTED_LANGUAGES[message.original_language]})
                </div>
                <div class="message-original-text">${message.content}</div>
            `;
        }
        
        // 아바타 표시 (발신 메시지는 아바타 생략)
        let avatar = '';
        if (!isCurrentUser) {
            avatar = `
                <div class="message-avatar">
                    <img src="img/${message.user.avatar_url}" alt="${message.user.username}" class="avatar">
                </div>
            `;
        }
        
        messageElement.innerHTML = `
            ${avatar}
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.user.username}</span>
                    <span class="message-role ${message.user.role}">${message.user.role}</span>
                </div>
                ${replyInfo}
                <div class="message-text">${content}</div>
                ${translationToggle}
                <div class="message-footer">
                    <div class="message-actions">
                        <div class="${likeButtonClass}" data-id="${message.id}">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${likeCount > 0 ? likeCount : ''}</span>
                        </div>
                        <div class="message-reply" data-id="${message.id}">
                            <i class="fas fa-reply"></i>
                        </div>
                        ${authState.isValid() && authState.user.role === 'staff' ? `
                            <div class="message-pin ${message.is_pinned ? 'active' : ''}" data-id="${message.id}">
                                <i class="fas fa-thumbtack"></i>
                            </div>
                        ` : ''}
                    </div>
                    <div class="message-time">${formatTime(message.created_at)}</div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
    });
    
    // 스크롤 위치 복원 (이전에 맨 아래에 있었다면 맨 아래로 스크롤)
    if (isScrolledToBottom) {
        scrollToBottom(messagesContainer);
    }
    
    // 좋아요 버튼 이벤트 추가
    document.querySelectorAll('.message-like').forEach(button => {
        button.addEventListener('click', async () => {
            if (!authState.isValid()) {
                alert('좋아요를 누르려면 로그인이 필요합니다.');
                return;
            }
            
            const messageId = button.dataset.id;
            
            try {
                await toggleLike(messageId);
            } catch (error) {
                console.error('좋아요 토글 오류:', error);
                alert('좋아요 처리 중 오류가 발생했습니다.');
            }
        });
    });
    
    // 답장 버튼 이벤트 추가
    document.querySelectorAll('.message-reply').forEach(button => {
        button.addEventListener('click', () => {
            if (!authState.isValid()) {
                alert('답장을 보내려면 로그인이 필요합니다.');
                return;
            }
            
            const messageId = button.dataset.id;
            const message = chatState.messages.find(m => m.id === messageId);
            
            if (message) {
                setReplyMode(message);
            }
        });
    });
    
    // 고정 버튼 이벤트 추가
    document.querySelectorAll('.message-pin').forEach(button => {
        button.addEventListener('click', async () => {
            const messageId = button.dataset.id;
            const isPinned = button.classList.contains('active');
            
            try {
                await togglePinMessage(messageId, !isPinned);
            } catch (error) {
                console.error('메시지 고정 토글 오류:', error);
                alert('메시지 고정 처리 중 오류가 발생했습니다.');
            }
        });
    });
    
    // 번역 토글 이벤트 추가
    document.querySelectorAll('.message-translation-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isTranslated = toggle.dataset.translated === 'true';
            const originalText = toggle.nextElementSibling;
            
            if (isTranslated) {
                // 번역본으로 변경
                toggle.dataset.translated = 'false';
                toggle.textContent = `원본 텍스트 보기 (${SUPPORTED_LANGUAGES[message.original_language]})`;
                originalText.style.display = 'none';
            } else {
                // 원본으로 변경
                toggle.dataset.translated = 'true';
                toggle.textContent = '번역본 보기';
                originalText.style.display = 'block';
            }
        });
    });
    
    // 답장 참조 클릭 이벤트 추가 (해당 메시지로 스크롤)
    document.querySelectorAll('.message-reply-info').forEach(replyInfo => {
        replyInfo.addEventListener('click', () => {
            const replyId = replyInfo.dataset.replyId;
            const replyElement = document.querySelector(`.message[data-id="${replyId}"]`);
            
            if (replyElement) {
                replyElement.scrollIntoView({ behavior: 'smooth' });
                replyElement.classList.add('highlight');
                
                // 강조 효과 제거
                setTimeout(() => {
                    replyElement.classList.remove('highlight');
                }, 2000);
            }
        });
    });
}

/**
 * 시간 형식화 함수
 * @param {string} dateStr - 날짜 문자열
 * @returns {string} - 형식화된 시간 문자열
 */
function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // 현재 선택된 언어에 따라 형식 변경
    const language = chatState.preferredLanguage;
    
    // 방금 전
    if (diffMin < 1) {
        return language === 'ko' ? '방금 전' :
            language === 'en' ? 'Just now' :
            language === 'hi' ? 'अभी अभी' :
            '刚刚';
    }
    
    // 분 단위
    if (diffMin < 60) {
        return language === 'ko' ? `${diffMin}분 전` :
            language === 'en' ? `${diffMin} min ago` :
            language === 'hi' ? `${diffMin} मिनट पहले` :
            `${diffMin}分钟前`;
    }
    
    // 시간 단위
    if (diffHours < 24) {
        return language === 'ko' ? `${diffHours}시간 전` :
            language === 'en' ? `${diffHours} hr ago` :
            language === 'hi' ? `${diffHours} घंटे पहले` :
            `${diffHours}小时前`;
    }
    
    // 날짜 형식
    if (diffDays < 7) {
        return language === 'ko' ? `${diffDays}일 전` :
            language === 'en' ? `${diffDays} days ago` :
            language === 'hi' ? `${diffDays} दिन पहले` :
            `${diffDays}天前`;
    }
    
    // 완전한 날짜 형식
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString(
        language === 'ko' ? 'ko-KR' :
        language === 'en' ? 'en-US' :
        language === 'hi' ? 'hi-IN' :
        'zh-CN',
        options
    );
}

/**
 * 스크롤이 맨 아래인지 확인하는 함수
 * @param {HTMLElement} element - 스크롤 엘리먼트
 * @returns {boolean} - 맨 아래 여부
 */
function isAtBottom(element) {
    const tolerance = 20; // 여유 픽셀 수
    return element.scrollHeight - element.scrollTop - element.clientHeight <= tolerance;
}

/**
 * 맨 아래로 스크롤하는 함수
 * @param {HTMLElement} element - 스크롤 엘리먼트
 */
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

// 새 메시지 이벤트 처리
document.addEventListener('newMessage', (e) => {
    const message = e.detail;
    const messagesContainer = document.querySelector('.messages-container');
    
    // 메시지 요소 생성
    const isCurrentUser = authState.isValid() && authState.user.id === message.user_id;
    const messageClass = isCurrentUser ? 'message outgoing' : 'message';
    
    const messageElement = document.createElement('div');
    messageElement.className = messageClass;
    messageElement.dataset.id = message.id;
    
    // 현재 스크롤 위치 확인
    const isScrolledToBottom = isAtBottom(messagesContainer);
    
    // UI 업데이트 함수 호출
    updateMessagesUI();
    
    // 스크롤 위치 조정
    if (isScrolledToBottom || isCurrentUser) {
        // 맨 아래에 있었거나 자신의 메시지인 경우 맨 아래로 스크롤
        scrollToBottom(messagesContainer);
    } else {
        // 스크롤을 내리지 않은 상태에서 새 메시지가 도착한 경우 알림 표시
        const newMessagesAlert = document.getElementById('new-messages-alert');
        newMessagesAlert.hidden = false;
    }
});

// 언어 변경 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    // 저장된 선호 언어 로드
    chatState.loadPreferredLanguage();
    
    // 언어 선택기 초기화
    const languageSelector = document.getElementById('language');
    if (languageSelector) {
        languageSelector.value = chatState.preferredLanguage;
        
        // 언어 변경 이벤트 추가
        languageSelector.addEventListener('change', async () => {
            const selectedLanguage = languageSelector.value;
            await changeLanguage(selectedLanguage);
            
            // 인증된 사용자인 경우 선호 언어 저장
            if (authState.isValid()) {
                authState.user.preferred_language = selectedLanguage;
                authState.save();
            }
        });
    }
});

// 모듈 내보내기
window.chatService = {
    chatState,
    initializeChat,
    sendMessage,
    toggleLike,
    togglePinMessage,
    setReplyMode,
    cancelReply,
    changeLanguage,
    updatePinnedMessagesUI,
    updateMessagesUI,
    formatTime,
    scrollToBottom
};

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('chatServiceLoaded'));
