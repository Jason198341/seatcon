/**
 * 채팅 관리 모듈
 * 
 * 채팅 UI 및 상호작용, 메시지 표시, 좋아요 기능 등을 관리합니다.
 * 실시간 메시지 수신 및 번역 기능을 제공합니다.
 */

import CONFIG from './config.js';
import supabaseClient from './supabase-client.js';
import translationService from './translation.js';
import userManager from './user.js';

class ChatManager {
    constructor() {
        // DOM 요소 참조
        this.chatContainer = null;
        this.messageList = null;
        this.messageForm = null;
        this.messageInput = null;
        this.sendButton = null;
        this.loadMoreButton = null;
        
        // 메시지 관련 상태
        this.messages = [];
        this.messagesMap = {};
        this.likesMap = {};
        this.lastLoadedMessageTimestamp = null;
        this.isLoadingMore = false;
        this.isScrolling = false;
        this.shouldScrollToBottom = true;
        this.isSubmitting = false;
        
        // 스피커 ID
        this.currentSpeakerId = 'global-chat';
    }

    /**
     * 채팅 관리자 초기화
     * @param {Object} options - 초기화 옵션
     */
    init(options = {}) {
        // DOM 요소 참조 설정
        this.chatContainer = document.getElementById(options.containerid || 'chatContainer');
        this.messageList = document.getElementById(options.messageListId || 'messageList');
        this.messageForm = document.getElementById(options.messageFormId || 'messageForm');
        this.messageInput = document.getElementById(options.messageInputId || 'messageInput');
        this.sendButton = document.getElementById(options.sendButtonId || 'sendButton');
        this.loadMoreButton = document.getElementById(options.loadMoreButtonId || 'loadMoreButton');
        
        // 스피커 ID 설정
        this.currentSpeakerId = options.speakerId || 'global-chat';
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 메시지 로드
        this.loadMessages();
        
        // 실시간 구독 설정
        this.setupSubscriptions();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('ChatManager initialized', {
                speakerId: this.currentSpeakerId
            });
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 메시지 폼 제출 이벤트
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMessageSubmit();
            });
        }
        
        // 이전 메시지 로드 버튼 클릭 이벤트
        if (this.loadMoreButton) {
            this.loadMoreButton.addEventListener('click', () => {
                this.loadMoreMessages();
            });
        }
        
        // 메시지 입력창 키 이벤트 (Enter 키로 전송)
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                // Shift+Enter는 줄바꿈, Enter만 누르면 전송
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleMessageSubmit();
                }
            });
            
            // 입력 중 높이 자동 조절
            this.messageInput.addEventListener('input', () => {
                this.adjustTextareaHeight();
            });
        }
        
        // 채팅창 스크롤 이벤트
        if (this.messageList) {
            this.messageList.addEventListener('scroll', () => {
                this.handleScroll();
            });
        }
    }

    /**
     * 메시지 로드
     */
    async loadMessages() {
        const currentUser = userManager.getCurrentUser();
        
        if (!currentUser) {
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Cannot load messages: No user logged in');
            }
            
            // 로그인 상태가 아니면 UI 비활성화
            this.disableChat();
            return;
        }
        
        // UI 로딩 상태 표시
        this.setLoadingState(true);
        
        try {
            // 메시지 로드
            const messages = await supabaseClient.getMessages(
                this.currentSpeakerId,
                CONFIG.CHAT.HISTORY_LOAD_COUNT
            );
            
            // 메시지 맵 및 리스트 업데이트
            this.messages = messages;
            this.updateMessagesMap();
            
            // 좋아요 정보 로드
            await this.loadLikesInfo();
            
            // 메시지 표시
            this.renderMessages();
            
            // 채팅창 하단으로 스크롤
            this.scrollToBottom();
            
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError('메시지를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
        } finally {
            // 로딩 상태 해제
            this.setLoadingState(false);
        }
    }

    /**
     * 이전 메시지 더 로드
     */
    async loadMoreMessages() {
        if (this.isLoadingMore || this.messages.length === 0) {
            return;
        }
        
        // 로딩 중 상태 설정
        this.isLoadingMore = true;
        this.loadMoreButton.disabled = true;
        this.loadMoreButton.textContent = '불러오는 중...';
        
        try {
            // 가장 오래된 메시지의 시간 저장
            const oldestMessage = this.messages[0];
            const beforeTimestamp = oldestMessage.created_at;
            
            // 이전 메시지 로드
            const { data, error } = await supabaseClient.supabase
                .from('comments')
                .select('*')
                .eq('speaker_id', this.currentSpeakerId)
                .lt('created_at', beforeTimestamp)
                .order('created_at', { ascending: false })
                .limit(CONFIG.CHAT.HISTORY_LOAD_COUNT);
                
            if (error) {
                throw error;
            }
            
            // 시간 순으로 정렬
            const olderMessages = data.reverse();
            
            if (olderMessages.length === 0) {
                this.loadMoreButton.textContent = '더 이상 메시지가 없습니다';
                this.loadMoreButton.disabled = true;
                return;
            }
            
            // 사용자 선호 언어로 메시지 번역
            const translatedMessages = await translationService.translateMessages(
                olderMessages,
                supabaseClient.getPreferredLanguage()
            );
            
            // 현재 스크롤 위치 저장
            const firstMessageElement = this.messageList.querySelector('.message');
            const scrollOffset = firstMessageElement ? firstMessageElement.offsetTop : 0;
            
            // 메시지 배열에 추가
            this.messages = [...translatedMessages, ...this.messages];
            this.updateMessagesMap();
            
            // 좋아요 정보 업데이트
            await this.loadLikesInfo();
            
            // 메시지 다시 렌더링
            this.renderMessages();
            
            // 스크롤 위치 복원
            if (firstMessageElement) {
                const newFirstMessage = this.messageList.querySelector(`[data-message-id="${oldestMessage.id}"]`);
                if (newFirstMessage) {
                    this.messageList.scrollTop = newFirstMessage.offsetTop - scrollOffset;
                }
            }
            
            this.loadMoreButton.textContent = '이전 메시지 더 보기';
            
        } catch (error) {
            console.error('Error loading more messages:', error);
            this.loadMoreButton.textContent = '로드 실패 - 다시 시도';
        } finally {
            this.isLoadingMore = false;
            this.loadMoreButton.disabled = false;
        }
    }

    /**
     * 메시지 맵 업데이트
     */
    updateMessagesMap() {
        this.messagesMap = {};
        
        this.messages.forEach(message => {
            this.messagesMap[message.id] = message;
        });
    }

    /**
     * 좋아요 정보 로드
     */
    async loadLikesInfo() {
        if (this.messages.length === 0) return;
        
        try {
            // 메시지 ID 배열 추출
            const messageIds = this.messages.map(message => message.id);
            
            // 좋아요 정보 조회
            this.likesMap = await supabaseClient.getLikesForMessages(messageIds);
            
        } catch (error) {
            console.error('Error loading likes info:', error);
        }
    }

    /**
     * 구독 설정
     */
    setupSubscriptions() {
        // 메시지 실시간 구독
        supabaseClient.subscribeToMessages((event, message) => {
            if (event === 'new_message') {
                this.handleNewMessage(message);
            }
        });
        
        // 좋아요 실시간 구독
        supabaseClient.subscribeToLikes((event, like) => {
            if (event === 'new_like') {
                this.handleNewLike(like);
            } else if (event === 'remove_like') {
                this.handleRemoveLike(like);
            }
        });
    }

    /**
     * 새 메시지 처리
     * @param {Object} message - 새 메시지 객체
     */
    handleNewMessage(message) {
        // 현재 스피커 ID와 일치하는 메시지만 표시
        if (message.speaker_id !== this.currentSpeakerId) {
            return;
        }
        
        // 중복 메시지 확인
        if (this.messagesMap[message.id]) {
            return;
        }
        
        // 메시지 맵과 배열에 추가
        this.messagesMap[message.id] = message;
        this.messages.push(message);
        
        // 좋아요 정보 초기화
        if (!this.likesMap[message.id]) {
            this.likesMap[message.id] = [];
        }
        
        // 새 메시지 표시
        this.renderMessage(message);
        
        // 스크롤 위치 업데이트
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
        } else {
            // 새 메시지 알림 표시
            this.showNewMessageNotification();
        }
    }

    /**
     * 새 좋아요 처리
     * @param {Object} like - 좋아요 객체
     */
    handleNewLike(like) {
        // 없는 메시지면 무시
        if (!this.messagesMap[like.message_id]) {
            return;
        }
        
        // 좋아요 목록에 추가
        if (!this.likesMap[like.message_id]) {
            this.likesMap[like.message_id] = [];
        }
        
        // 중복 확인
        const existing = this.likesMap[like.message_id].find(
            l => l.user_email === like.user_email
        );
        
        if (!existing) {
            this.likesMap[like.message_id].push(like);
        }
        
        // 좋아요 UI 업데이트
        this.updateLikeUI(like.message_id);
    }

    /**
     * 좋아요 제거 처리
     * @param {Object} like - 제거된 좋아요 객체
     */
    handleRemoveLike(like) {
        // 없는 메시지면 무시
        if (!this.messagesMap[like.message_id]) {
            return;
        }
        
        // 좋아요 목록에서 제거
        if (this.likesMap[like.message_id]) {
            this.likesMap[like.message_id] = this.likesMap[like.message_id].filter(
                l => l.user_email !== like.user_email
            );
        }
        
        // 좋아요 UI 업데이트
        this.updateLikeUI(like.message_id);
    }

    /**
     * 메시지 제출 처리
     */
    async handleMessageSubmit() {
        // 현재 사용자 확인
        const currentUser = userManager.getCurrentUser();
        
        if (!currentUser) {
            this.showError('메시지를 보내려면 로그인이 필요합니다.');
            return;
        }
        
        // 입력값 가져오기
        const messageContent = this.messageInput.value.trim();
        
        // 빈 메시지 확인
        if (!messageContent) {
            return;
        }
        
        // 메시지 길이 제한 확인
        if (messageContent.length > CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
            this.showError(`메시지는 최대 ${CONFIG.CHAT.MAX_MESSAGE_LENGTH}자까지 입력 가능합니다.`);
            return;
        }
        
        // 중복 제출 방지
        if (this.isSubmitting) {
            return;
        }
        
        // 제출 중 UI 설정
        this.isSubmitting = true;
        this.setSubmittingState(true);
        
        try {
            // 메시지 전송
            const sentMessage = await supabaseClient.sendMessage(messageContent, this.currentSpeakerId);
            
            if (!sentMessage) {
                throw new Error('메시지 전송에 실패했습니다.');
            }
            
            // 입력창 초기화
            this.messageInput.value = '';
            this.adjustTextareaHeight();
            
            // 전송 성공 시 하단으로 스크롤
            this.shouldScrollToBottom = true;
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('메시지 전송 중 오류가 발생했습니다.');
        } finally {
            this.isSubmitting = false;
            this.setSubmittingState(false);
        }
    }

    /**
     * 좋아요 토글
     * @param {string} messageId - 메시지 ID
     */
    async toggleLike(messageId) {
        const currentUser = userManager.getCurrentUser();
        
        if (!currentUser) {
            this.showError('좋아요를 추가하려면 로그인이 필요합니다.');
            return;
        }
        
        const likeButton = this.messageList.querySelector(`[data-message-id="${messageId}"] .like-button`);
        
        if (likeButton) {
            // 버튼 비활성화로 중복 클릭 방지
            likeButton.disabled = true;
        }
        
        try {
            // 현재 좋아요 상태 확인
            const hasLiked = await supabaseClient.hasLiked(messageId);
            
            if (hasLiked) {
                // 좋아요 제거
                await supabaseClient.removeLike(messageId);
            } else {
                // 좋아요 추가
                await supabaseClient.addLike(messageId);
            }
            
        } catch (error) {
            console.error('Error toggling like:', error);
            this.showError('좋아요 처리 중 오류가 발생했습니다.');
        } finally {
            if (likeButton) {
                likeButton.disabled = false;
            }
        }
    }

    /**
     * 번역 토글
     * @param {string} messageId - 메시지 ID
     */
    toggleTranslation(messageId) {
        const message = this.messagesMap[messageId];
        
        if (!message) {
            return;
        }
        
        // 번역 표시 토글
        const messageElement = this.messageList.querySelector(`[data-message-id="${messageId}"]`);
        
        if (messageElement) {
            const contentElement = messageElement.querySelector('.message-content');
            const originalElement = messageElement.querySelector('.original-content');
            const translatedElement = messageElement.querySelector('.translated-content');
            const toggleButton = messageElement.querySelector('.translation-toggle');
            
            // 번역된 내용이 있는 경우
            if (message.isTranslated && translatedElement && originalElement) {
                const isShowingTranslation = contentElement.classList.contains('showing-translation');
                
                if (isShowingTranslation) {
                    // 원본 표시로 전환
                    contentElement.classList.remove('showing-translation');
                    originalElement.style.display = 'block';
                    translatedElement.style.display = 'none';
                    toggleButton.textContent = '번역 보기';
                } else {
                    // 번역 표시로 전환
                    contentElement.classList.add('showing-translation');
                    originalElement.style.display = 'none';
                    translatedElement.style.display = 'block';
                    toggleButton.textContent = '원문 보기';
                }
            }
        }
    }

    /**
     * 메시지 렌더링
     */
    renderMessages() {
        if (!this.messageList) return;
        
        // 메시지 목록 초기화
        this.messageList.innerHTML = '';
        
        // 메시지가 없을 때
        if (this.messages.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // 메시지 렌더링
        this.messages.forEach(message => {
            this.renderMessage(message, false);
        });
        
        // 로드 더 보기 버튼 표시 설정
        if (this.loadMoreButton) {
            this.loadMoreButton.style.display = this.messages.length >= CONFIG.CHAT.HISTORY_LOAD_COUNT ? 'block' : 'none';
        }
    }

    /**
     * 개별 메시지 렌더링
     * @param {Object} message - 메시지 객체
     * @param {boolean} isNew - 새 메시지 여부
     */
    renderMessage(message, isNew = true) {
        if (!this.messageList || !message) return;
        
        // 메시지 요소 생성
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.dataset.messageId = message.id;
        
        // 현재 사용자의 메시지인지 확인
        const currentUser = userManager.getCurrentUser();
        const isCurrentUser = currentUser && message.author_email === currentUser.email;
        
        if (isCurrentUser) {
            messageElement.classList.add('own-message');
        }
        
        // 사용자 역할에 따른 스타일 적용
        if (message.user_role) {
            const roleInfo = userManager.getRoleInfo(message.user_role);
            if (roleInfo) {
                messageElement.dataset.userRole = message.user_role;
                messageElement.style.setProperty('--role-color', roleInfo.color);
            }
        }
        
        // 메시지 내용 구성
        const messageContent = this.createMessageContent(message);
        
        // 메시지 메타 정보 구성
        const messageMetaInfo = this.createMessageMetaInfo(message);
        
        // 메시지 좋아요 UI 구성
        const messageLikesElement = this.createMessageLikes(message);
        
        // 메시지 요소에 추가
        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageMetaInfo);
        messageElement.appendChild(messageLikesElement);
        
        // 모션 효과 설정
        if (isNew) {
            messageElement.classList.add('new-message-animation');
            setTimeout(() => {
                messageElement.classList.remove('new-message-animation');
            }, 500);
            
            this.messageList.appendChild(messageElement);
        } else {
            this.messageList.appendChild(messageElement);
        }
        
        // 이벤트 리스너 설정
        this.setupMessageEventListeners(messageElement, message.id);
    }

    /**
     * 메시지 내용 요소 생성
     * @param {Object} message - 메시지 객체
     * @returns {HTMLElement} - 메시지 내용 요소
     */
    createMessageContent(message) {
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content';
        
        // 원본 내용 요소
        const originalContent = document.createElement('div');
        originalContent.className = 'original-content';
        originalContent.innerHTML = this.formatMessageContent(message.content);
        
        contentWrapper.appendChild(originalContent);
        
        // 번역 내용이 있는 경우
        if (message.isTranslated && message.translatedContent) {
            // 번역 내용 요소
            const translatedContent = document.createElement('div');
            translatedContent.className = 'translated-content';
            translatedContent.innerHTML = this.formatMessageContent(message.translatedContent);
            translatedContent.style.display = 'none';
            
            contentWrapper.appendChild(translatedContent);
            
            // 번역 토글 버튼
            const toggleButton = document.createElement('button');
            toggleButton.className = 'translation-toggle';
            toggleButton.textContent = '번역 보기';
            toggleButton.title = `${message.language} → ${message.targetLanguage}`;
            
            contentWrapper.appendChild(toggleButton);
        }
        
        return contentWrapper;
    }

    /**
     * 메시지 메타 정보 요소 생성
     * @param {Object} message - 메시지 객체
     * @returns {HTMLElement} - 메시지 메타 정보 요소
     */
    createMessageMetaInfo(message) {
        const metaInfo = document.createElement('div');
        metaInfo.className = 'message-meta';
        
        // 작성자 이름
        const authorName = document.createElement('span');
        authorName.className = 'author-name';
        authorName.textContent = message.author_name;
        
        // 작성 시간
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = this.formatTimestamp(message.created_at);
        timestamp.title = new Date(message.created_at).toLocaleString();
        
        // 언어 표시
        const language = document.createElement('span');
        language.className = 'language-tag';
        
        if (message.language) {
            const langInfo = translationService.getLanguageInfo(message.language);
            language.textContent = langInfo ? langInfo.flag : message.language;
            language.title = langInfo ? langInfo.name : message.language;
        }
        
        metaInfo.appendChild(authorName);
        metaInfo.appendChild(timestamp);
        metaInfo.appendChild(language);
        
        return metaInfo;
    }

    /**
     * 메시지 좋아요 요소 생성
     * @param {Object} message - 메시지 객체
     * @returns {HTMLElement} - 메시지 좋아요 요소
     */
    createMessageLikes(message) {
        const likesElement = document.createElement('div');
        likesElement.className = 'message-likes';
        
        // 좋아요 버튼
        const likeButton = document.createElement('button');
        likeButton.className = 'like-button';
        likeButton.innerHTML = '<i class="fa-regular fa-heart"></i>';
        likeButton.title = '좋아요';
        
        // 좋아요 카운트
        const likeCount = document.createElement('span');
        likeCount.className = 'like-count';
        
        // 좋아요 목록
        const likes = this.likesMap[message.id] || [];
        likeCount.textContent = likes.length > 0 ? likes.length : '';
        
        // 현재 사용자의 좋아요 여부 확인
        const currentUser = userManager.getCurrentUser();
        if (currentUser && likes.some(like => like.user_email === currentUser.email)) {
            likeButton.classList.add('liked');
            likeButton.innerHTML = '<i class="fa-solid fa-heart"></i>';
        }
        
        // 좋아요 툴팁
        if (likes.length > 0) {
            const likeNames = likes.map(like => like.user_name).join(', ');
            likeButton.title = `좋아요: ${likeNames}`;
        }
        
        likesElement.appendChild(likeButton);
        likesElement.appendChild(likeCount);
        
        return likesElement;
    }

    /**
     * 메시지 이벤트 리스너 설정
     * @param {HTMLElement} messageElement - 메시지 요소
     * @param {string} messageId - 메시지 ID
     */
    setupMessageEventListeners(messageElement, messageId) {
        // 좋아요 버튼 클릭 이벤트
        const likeButton = messageElement.querySelector('.like-button');
        if (likeButton) {
            likeButton.addEventListener('click', () => {
                this.toggleLike(messageId);
            });
        }
        
        // 번역 토글 버튼 클릭 이벤트
        const toggleButton = messageElement.querySelector('.translation-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleTranslation(messageId);
            });
        }
    }

    /**
     * 좋아요 UI 업데이트
     * @param {string} messageId - 메시지 ID
     */
    updateLikeUI(messageId) {
        const messageElement = this.messageList.querySelector(`[data-message-id="${messageId}"]`);
        
        if (!messageElement) return;
        
        const likeButton = messageElement.querySelector('.like-button');
        const likeCount = messageElement.querySelector('.like-count');
        
        if (!likeButton || !likeCount) return;
        
        // 좋아요 목록
        const likes = this.likesMap[messageId] || [];
        
        // 좋아요 카운트 업데이트
        likeCount.textContent = likes.length > 0 ? likes.length : '';
        
        // 현재 사용자의 좋아요 여부 확인
        const currentUser = userManager.getCurrentUser();
        
        if (currentUser && likes.some(like => like.user_email === currentUser.email)) {
            likeButton.classList.add('liked');
            likeButton.innerHTML = '<i class="fa-solid fa-heart"></i>';
        } else {
            likeButton.classList.remove('liked');
            likeButton.innerHTML = '<i class="fa-regular fa-heart"></i>';
        }
        
        // 좋아요 툴팁 업데이트
        if (likes.length > 0) {
            const likeNames = likes.map(like => like.user_name).join(', ');
            likeButton.title = `좋아요: ${likeNames}`;
        } else {
            likeButton.title = '좋아요';
        }
    }

    /**
     * 텍스트 영역 높이 조절
     */
    adjustTextareaHeight() {
        if (!this.messageInput) return;
        
        // 높이 초기화
        this.messageInput.style.height = 'auto';
        
        // 스크롤 높이로 설정 (자동 높이 조절)
        const newHeight = Math.min(this.messageInput.scrollHeight, 150);
        this.messageInput.style.height = `${newHeight}px`;
    }

    /**
     * 스크롤 이벤트 처리
     */
    handleScroll() {
        if (!this.messageList || this.isScrolling) return;
        
        // 스크롤 위치 계산
        const { scrollTop, scrollHeight, clientHeight } = this.messageList;
        
        // 하단에서의 거리
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // 스크롤이 하단에 가까우면 자동 스크롤 활성화
        this.shouldScrollToBottom = distanceFromBottom < 100;
        
        // 새 메시지 알림 처리
        if (this.shouldScrollToBottom) {
            this.hideNewMessageNotification();
        }
    }

    /**
     * 하단으로 스크롤
     */
    scrollToBottom() {
        if (!this.messageList) return;
        
        this.isScrolling = true;
        
        // 부드러운 스크롤
        this.messageList.scrollTo({
            top: this.messageList.scrollHeight,
            behavior: 'smooth'
        });
        
        // 스크롤 상태 리셋
        setTimeout(() => {
            this.isScrolling = false;
        }, 300);
        
        // 새 메시지 알림 숨기기
        this.hideNewMessageNotification();
    }

    /**
     * 메시지 내용 포맷팅
     * @param {string} content - 메시지 내용
     * @returns {string} - 포맷팅된 내용
     */
    formatMessageContent(content) {
        if (!content) return '';
        
        let formattedContent = this.escapeHtml(content);
        
        // 줄바꿈 처리
        formattedContent = formattedContent.replace(/\n/g, '<br>');
        
        // URL 링크 처리
        formattedContent = formattedContent.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // 이모티콘 강조
        formattedContent = this.enhanceEmojis(formattedContent);
        
        return formattedContent;
    }

    /**
     * 타임스탬프 포맷팅
     * @param {string} timestamp - ISO 형식 타임스탬프
     * @returns {string} - 포맷팅된 타임스탬프
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        
        // 당일 메시지는 시간만 표시
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // 당일이 아닌 메시지는 날짜와 시간 모두 표시
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 이모티콘 강조
     * @param {string} content - 메시지 내용
     * @returns {string} - 이모티콘이 강조된 내용
     */
    enhanceEmojis(content) {
        // 유니코드 이모티콘 정규식
        const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        
        // 이모티콘에 강조 클래스 추가
        return content.replace(emojiRegex, match => `<span class="emoji">${match}</span>`);
    }

    /**
     * HTML 이스케이프 처리
     * @param {string} unsafe - 이스케이프 처리할 문자열
     * @returns {string} - 이스케이프 처리된 문자열
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * 로딩 상태 설정
     * @param {boolean} isLoading - 로딩 중 여부
     */
    setLoadingState(isLoading) {
        if (this.chatContainer) {
            if (isLoading) {
                this.chatContainer.classList.add('loading');
            } else {
                this.chatContainer.classList.remove('loading');
            }
        }
    }

    /**
     * 제출 중 상태 설정
     * @param {boolean} isSubmitting - 제출 중 여부
     */
    setSubmittingState(isSubmitting) {
        if (this.sendButton) {
            this.sendButton.disabled = isSubmitting;
            this.sendButton.innerHTML = isSubmitting ? 
                '<i class="fas fa-spinner fa-spin"></i>' : 
                '<i class="fas fa-paper-plane"></i>';
        }
        
        if (this.messageInput) {
            this.messageInput.disabled = isSubmitting;
        }
    }

    /**
     * 채팅 비활성화
     */
    disableChat() {
        if (this.messageForm) {
            this.messageForm.classList.add('disabled');
        }
        
        if (this.messageInput) {
            this.messageInput.disabled = true;
            this.messageInput.placeholder = '로그인 후 메시지를 보낼 수 있습니다.';
        }
        
        if (this.sendButton) {
            this.sendButton.disabled = true;
        }
    }

    /**
     * 채팅 활성화
     */
    enableChat() {
        if (this.messageForm) {
            this.messageForm.classList.remove('disabled');
        }
        
        if (this.messageInput) {
            this.messageInput.disabled = false;
            this.messageInput.placeholder = '메시지를 입력하세요...';
        }
        
        if (this.sendButton) {
            this.sendButton.disabled = false;
        }
    }

    /**
     * 빈 상태 표시
     */
    showEmptyState() {
        if (!this.messageList) return;
        
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon"><i class="far fa-comments"></i></div>
            <h3>아직 메시지가 없습니다.</h3>
            <p>첫 메시지를 작성해보세요!</p>
        `;
        
        this.messageList.appendChild(emptyState);
    }

    /**
     * 오류 메시지 표시
     * @param {string} message - 오류 메시지
     */
    showError(message) {
        // 토스트 형태의 오류 메시지
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 2초 후 자동 제거
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }

    /**
     * 새 메시지 알림 표시
     */
    showNewMessageNotification() {
        // 이미 알림이 있으면 무시
        if (document.querySelector('.new-message-notification')) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = 'new-message-notification';
        notification.innerHTML = `
            <span>새 메시지</span>
            <button><i class="fas fa-arrow-down"></i></button>
        `;
        
        // 알림 클릭 시 하단으로 스크롤
        notification.addEventListener('click', () => {
            this.scrollToBottom();
        });
        
        document.body.appendChild(notification);
    }

    /**
     * 새 메시지 알림 숨기기
     */
    hideNewMessageNotification() {
        const notification = document.querySelector('.new-message-notification');
        
        if (notification) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    /**
     * 언어 변경 처리
     * @param {string} languageCode - 언어 코드
     */
    async handleLanguageChange(languageCode) {
        if (!translationService.isSupportedLanguage(languageCode)) return;
        
        try {
            // 메시지 다시 로드
            await this.loadMessages();
        } catch (error) {
            console.error('Error reloading messages after language change:', error);
        }
    }

    /**
     * 정리
     */
    cleanup() {
        // 실시간 구독 해제
        supabaseClient.cleanup();
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const chatManager = new ChatManager();
export default chatManager;
