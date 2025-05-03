/**
 * 입력 중 표시 관리 모듈
 * 
 * 사용자의 입력 중 상태를 관리하고 실시간으로 표시합니다.
 * Supabase 채널을 사용하여 입력 중 이벤트를 전송 및 수신합니다.
 */
class TypingIndicatorManager {
    constructor() {
        // 입력 중인 사용자 맵 (사용자 ID -> 타임스탬프)
        this.typingUsers = new Map();
        
        // 내 입력 중 상태
        this.isTyping = false;
        
        // 입력 타이머
        this.typingTimer = null;
        
        // 표시 타이머
        this.displayTimer = null;
        
        // 설정
        this.settings = {
            typingTimeout: 3000,      // 입력 중 상태 유지 시간 (밀리초)
            displayInterval: 1000,     // 표시 갱신 간격 (밀리초)
            debounceTime: 300,         // 디바운스 시간 (밀리초)
            presence: true             // Presence 채널 사용 여부
        };
        
        // Supabase 클라이언트 참조
        this.supabaseClient = null;
        
        // 채널 참조
        this.channel = null;
        
        // 초기화
        this.init();
    }
    
    /**
     * 입력 중 표시 관리자 초기화
     */
    init() {
        console.log('입력 중 표시 관리자 초기화');
        
        // 표시 갱신 타이머 시작
        this.startDisplayTimer();
    }
    
    /**
     * Supabase 클라이언트 설정
     * @param {Object} client - Supabase 클라이언트
     * @param {string} roomId - 채팅방 ID
     */
    setClient(client, roomId) {
        this.supabaseClient = client;
        this.roomId = roomId;
        
        // 채널 설정
        this.setupChannel();
    }
    
    /**
     * 채널 설정
     */
    setupChannel() {
        if (!this.supabaseClient) {
            console.warn('Supabase 클라이언트가 설정되지 않았습니다.');
            return;
        }
        
        // 기존 채널 정리
        this.cleanupChannel();
        
        // 사용할 채널 유형 결정 (Presence 또는 Broadcast)
        if (this.settings.presence) {
            this.setupPresenceChannel();
        } else {
            this.setupBroadcastChannel();
        }
    }
    
    /**
     * Presence 채널 설정
     */
    setupPresenceChannel() {
        // 채널 생성
        this.channel = this.supabaseClient
            .channel(`room:${this.roomId}`)
            .on('presence', { event: 'sync' }, () => {
                // 모든 사용자 상태 동기화
                const presenceState = this.channel.presenceState();
                this.syncTypingStates(presenceState);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // 새 사용자 참여
                this.handlePresenceJoin(newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // 사용자 퇴장
                this.handlePresenceLeave(leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // 구독 성공
                    console.log('입력 중 표시 채널 구독 성공');
                } else {
                    console.warn(`입력 중 표시 채널 구독 상태: ${status}`);
                }
            });
    }
    
    /**
     * Broadcast 채널 설정
     */
    setupBroadcastChannel() {
        // 채널 생성
        this.channel = this.supabaseClient
            .channel(`typing:${this.roomId}`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                // 입력 중 이벤트 수신
                this.handleTypingEvent(payload);
            })
            .on('broadcast', { event: 'stop_typing' }, (payload) => {
                // 입력 중단 이벤트 수신
                this.handleStopTypingEvent(payload);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // 구독 성공
                    console.log('입력 중 표시 채널 구독 성공');
                } else {
                    console.warn(`입력 중 표시 채널 구독 상태: ${status}`);
                }
            });
    }
    
    /**
     * 채널 정리
     */
    cleanupChannel() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
    }
    
    /**
     * 입력 중 상태 동기화
     * @param {Object} presenceState - Presence 상태 객체
     */
    syncTypingStates(presenceState) {
        // 타이핑 사용자 맵 초기화
        this.typingUsers.clear();
        
        // 각 사용자의 상태 확인
        for (const [key, userStates] of Object.entries(presenceState)) {
            for (const state of userStates) {
                // 입력 중인 사용자만 추가
                if (state.isTyping && state.user_id) {
                    this.typingUsers.set(state.user_id, {
                        timestamp: Date.now(),
                        name: state.user_name || state.user_id
                    });
                }
            }
        }
        
        // UI 업데이트
        this.updateTypingIndicator();
    }
    
    /**
     * Presence 참여 처리
     * @param {Array} newPresences - 새로 참여한 사용자 배열
     */
    handlePresenceJoin(newPresences) {
        for (const presence of newPresences) {
            // 입력 중인 사용자만 추가
            if (presence.isTyping && presence.user_id) {
                this.typingUsers.set(presence.user_id, {
                    timestamp: Date.now(),
                    name: presence.user_name || presence.user_id
                });
            }
        }
        
        // UI 업데이트
        this.updateTypingIndicator();
    }
    
    /**
     * Presence 퇴장 처리
     * @param {Array} leftPresences - 퇴장한 사용자 배열
     */
    handlePresenceLeave(leftPresences) {
        for (const presence of leftPresences) {
            // 사용자 제거
            if (presence.user_id) {
                this.typingUsers.delete(presence.user_id);
            }
        }
        
        // UI 업데이트
        this.updateTypingIndicator();
    }
    
    /**
     * 입력 중 이벤트 처리
     * @param {Object} payload - 이벤트 페이로드
     */
    handleTypingEvent(payload) {
        if (!payload || !payload.user_id) return;
        
        // 내 이벤트는 무시
        if (this.isCurrentUser(payload.user_id)) return;
        
        // 입력 중 사용자 추가/갱신
        this.typingUsers.set(payload.user_id, {
            timestamp: Date.now(),
            name: payload.user_name || payload.user_id
        });
        
        // UI 업데이트
        this.updateTypingIndicator();
    }
    
    /**
     * 입력 중단 이벤트 처리
     * @param {Object} payload - 이벤트 페이로드
     */
    handleStopTypingEvent(payload) {
        if (!payload || !payload.user_id) return;
        
        // 내 이벤트는 무시
        if (this.isCurrentUser(payload.user_id)) return;
        
        // 입력 중 사용자 제거
        this.typingUsers.delete(payload.user_id);
        
        // UI 업데이트
        this.updateTypingIndicator();
    }
    
    /**
     * 현재 사용자인지 확인
     * @param {string} userId - 사용자 ID
     * @returns {boolean} - 현재 사용자 여부
     */
    isCurrentUser(userId) {
        // 데이터베이스 서비스에서 현재 사용자 정보 가져오기
        if (window.databaseService && databaseService.currentUser) {
            return userId === databaseService.currentUser.email;
        }
        return false;
    }
    
    /**
     * 입력 중 표시 업데이트
     */
    updateTypingIndicator() {
        // 만료된 입력 중 상태 제거
        this.cleanExpiredTypingStates();
        
        // 입력 중인 사용자가 없으면 표시기 숨김
        if (this.typingUsers.size === 0) {
            this.hideTypingIndicator();
            return;
        }
        
        // 입력 중인 사용자 이름 추출
        const typingUserNames = Array.from(this.typingUsers.values())
            .map(data => data.name);
        
        // 표시 텍스트 생성
        let displayText = '';
        
        if (typingUserNames.length === 1) {
            displayText = `${typingUserNames[0]}님이 입력 중입니다...`;
        } else if (typingUserNames.length === 2) {
            displayText = `${typingUserNames[0]}님과 ${typingUserNames[1]}님이 입력 중입니다...`;
        } else {
            displayText = `${typingUserNames[0]}님 외 ${typingUserNames.length - 1}명이 입력 중입니다...`;
        }
        
        // 표시기 업데이트
        this.showTypingIndicator(displayText);
    }
    
    /**
     * 입력 중 표시기 표시
     * @param {string} text - 표시할 텍스트
     */
    showTypingIndicator(text) {
        // 표시기 요소 확인
        let indicator = document.querySelector('.typing-indicator');
        
        // 없으면 생성
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            
            // 내용 생성
            indicator.innerHTML = `
                <span class="typing-text"></span>
                <span class="typing-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </span>
            `;
            
            // 채팅 메시지 컨테이너에 추가
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.appendChild(indicator);
            }
        }
        
        // 텍스트 업데이트
        const textElement = indicator.querySelector('.typing-text');
        if (textElement) {
            textElement.textContent = text;
        }
        
        // 표시
        indicator.classList.add('visible');
    }
    
    /**
     * 입력 중 표시기 숨김
     */
    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.classList.remove('visible');
        }
    }
    
    /**
     * 만료된 입력 중 상태 제거
     */
    cleanExpiredTypingStates() {
        const now = Date.now();
        
        for (const [userId, data] of this.typingUsers.entries()) {
            // 타임아웃 확인
            if (now - data.timestamp > this.settings.typingTimeout) {
                this.typingUsers.delete(userId);
            }
        }
    }
    
    /**
     * 표시 갱신 타이머 시작
     */
    startDisplayTimer() {
        // 기존 타이머 정리
        this.stopDisplayTimer();
        
        // 새 타이머 설정
        this.displayTimer = setInterval(() => {
            this.updateTypingIndicator();
        }, this.settings.displayInterval);
    }
    
    /**
     * 표시 갱신 타이머 정지
     */
    stopDisplayTimer() {
        if (this.displayTimer) {
            clearInterval(this.displayTimer);
            this.displayTimer = null;
        }
    }
    
    /**
     * 입력 중 상태 업데이트
     * @param {boolean} isTyping - 입력 중 여부
     */
    updateTypingState(isTyping) {
        // 변경이 없으면 무시
        if (this.isTyping === isTyping) return;
        
        this.isTyping = isTyping;
        
        // 현재 사용자 정보 확인
        if (!window.databaseService || !databaseService.currentUser) return;
        
        const currentUser = databaseService.currentUser;
        
        // Supabase 채널이 없으면 무시
        if (!this.channel) return;
        
        // Presence 채널 사용 시
        if (this.settings.presence) {
            // 입력 중 상태 업데이트
            this.channel.track({
                user_id: currentUser.email,
                user_name: currentUser.name,
                isTyping,
                timestamp: Date.now()
            });
        } else {
            // Broadcast 채널 사용 시
            const eventName = isTyping ? 'typing' : 'stop_typing';
            
            // 이벤트 브로드캐스트
            this.channel.send({
                type: 'broadcast',
                event: eventName,
                payload: {
                    user_id: currentUser.email,
                    user_name: currentUser.name,
                    timestamp: Date.now()
                }
            });
        }
    }
    
    /**
     * 메시지 입력 이벤트 처리
     */
    handleMessageInput() {
        // 입력 중 상태로 변경
        this.updateTypingState(true);
        
        // 기존 타이머 정리
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        
        // 타임아웃 타이머 설정
        this.typingTimer = setTimeout(() => {
            // 입력 중단 상태로 변경
            this.updateTypingState(false);
        }, this.settings.typingTimeout);
    }
    
    /**
     * 메시지 전송 이벤트 처리
     */
    handleMessageSent() {
        // 입력 중단 상태로 변경
        this.updateTypingState(false);
        
        // 타이머 정리
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }
    
    /**
     * 인스턴스 정리
     */
    dispose() {
        // 채널 정리
        this.cleanupChannel();
        
        // 타이머 정리
        this.stopDisplayTimer();
        
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
        
        // 데이터 정리
        this.typingUsers.clear();
        this.isTyping = false;
    }
}

// 전역 인스턴스 생성
const typingIndicatorManager = new TypingIndicatorManager();