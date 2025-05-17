/**
 * 실시간 메시지 처리 서비스
 * Supabase Realtime을 사용하여 실시간 메시지 수신 및 처리를 담당합니다.
 */

class RealtimeService {
    constructor() {
        this.initialized = false;
        this.currentRoomId = null;
        this.messageSubscription = null;
        this.userSubscription = null;
        this.onNewMessage = null;
        this.onUserJoin = null;
        this.onUserLeave = null;
        this.onConnectionStatusChange = null;
    }

    /**
     * 실시간 서비스 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            // Supabase 클라이언트가 초기화되었는지 확인
            if (!dbService.initialized) {
                await dbService.initialize();
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing Realtime service:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * 초기화 상태 확인 및 필요시 초기화 실행
     * @returns {Promise<boolean>} 초기화 상태
     */
    async ensureInitialized() {
        if (!this.initialized) {
            return await this.initialize();
        }
        return true;
    }

    /**
     * 채팅방 메시지 구독
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<boolean>} 구독 성공 여부
     */
    async subscribeToRoomMessages(roomId) {
        await this.ensureInitialized();
        
        // 이전 구독이 있으면 해제
        this.unsubscribeFromCurrentRoom();
        
        try {
            this.currentRoomId = roomId;
            
            // 메시지 구독
            this.messageSubscription = dbService.supabase
                .channel(`room-messages-${roomId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_id=eq.${roomId}`
                }, (payload) => {
                    if (this.onNewMessage) {
                        this.onNewMessage(payload.new);
                    }
                })
                .subscribe((status) => {
                    console.log(`Message subscription status: ${status}`);
                    
                    if (this.onConnectionStatusChange) {
                        this.onConnectionStatusChange(status === 'SUBSCRIBED');
                    }
                });
            
            // 사용자 구독 (입장/퇴장)
            this.userSubscription = dbService.supabase
                .channel(`room-users-${roomId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'users',
                    filter: `room_id=eq.${roomId}`
                }, (payload) => {
                    if (this.onUserJoin) {
                        this.onUserJoin(payload.new);
                    }
                })
                .on('postgres_changes', {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'users',
                    filter: `room_id=eq.${roomId}`
                }, (payload) => {
                    if (this.onUserLeave) {
                        this.onUserLeave(payload.old);
                    }
                })
                .subscribe();
            
            return true;
        } catch (error) {
            console.error(`Error subscribing to room ${roomId}:`, error);
            this.currentRoomId = null;
            return false;
        }
    }

    /**
     * 현재 채팅방 구독 해제
     */
    unsubscribeFromCurrentRoom() {
        if (this.messageSubscription) {
            dbService.supabase.removeChannel(this.messageSubscription);
            this.messageSubscription = null;
        }
        
        if (this.userSubscription) {
            dbService.supabase.removeChannel(this.userSubscription);
            this.userSubscription = null;
        }
        
        this.currentRoomId = null;
    }

    /**
     * 실시간 메시지 콜백 설정
     * @param {Function} callback 새 메시지 수신 시 호출될 콜백 함수
     */
    setMessageCallback(callback) {
        this.onNewMessage = callback;
    }

    /**
     * 사용자 입장 콜백 설정
     * @param {Function} callback 사용자 입장 시 호출될 콜백 함수
     */
    setUserJoinCallback(callback) {
        this.onUserJoin = callback;
    }

    /**
     * 사용자 퇴장 콜백 설정
     * @param {Function} callback 사용자 퇴장 시 호출될 콜백 함수
     */
    setUserLeaveCallback(callback) {
        this.onUserLeave = callback;
    }

    /**
     * 연결 상태 변경 콜백 설정
     * @param {Function} callback 연결 상태 변경 시 호출될 콜백 함수
     */
    setConnectionStatusCallback(callback) {
        this.onConnectionStatusChange = callback;
    }
}

// 싱글톤 인스턴스 생성
const realtimeService = new RealtimeService();
