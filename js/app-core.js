/**
 * 애플리케이션 핵심 모듈
 * 애플리케이션 초기화 및 전체 흐름을 제어합니다.
 */

class AppCore {
    constructor() {
        this.initialized = false;
    }

    /**
     * 애플리케이션 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing application...');
            
            // 서비스 초기화
            await dbService.initialize();
            await realtimeService.initialize();
            await i18nService.initialize();
            offlineService.initialize();
            
            // 이벤트 리스너 등록
            this.setupServiceListeners();
            
            // 저장된 사용자 정보가 있는지 확인
            const currentUser = userService.getCurrentUser();
            if (currentUser) {
                // 기존 채팅방으로 자동 입장
                await this.rejoinChatRoom(currentUser);
            }
            
            this.initialized = true;
            console.log('Application initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Error initializing application:', error);
            return false;
        }
    }

    /**
     * 서비스 이벤트 리스너 설정
     * @private
     */
    setupServiceListeners() {
        // 언어 변경 이벤트
        i18nService.setLanguageChangeCallback(language => {
            console.log('Language changed to:', language);
            
            // 현재 사용자의 선호 언어 업데이트
            const currentUser = userService.getCurrentUser();
            if (currentUser) {
                userService.updatePreferredLanguage(language);
            }
        });
        
        // 연결 상태 이벤트
        realtimeService.setConnectionStatusCallback(isConnected => {
            console.log('Realtime connection status:', isConnected ? 'connected' : 'disconnected');
        });
        
        // 오프라인 모드 이벤트
        offlineService.setConnectionStatusCallback(isOnline => {
            console.log('Network status:', isOnline ? 'online' : 'offline');
            
            // 온라인 상태로 돌아온 경우 오프라인 메시지 동기화
            if (isOnline && offlineService.getPendingMessageCount() > 0) {
                offlineService.syncOfflineMessages().then(result => {
                    console.log('Synced offline messages:', result);
                });
            }
        });
    }

    /**
     * 기존 채팅방으로 재입장
     * @param {Object} user 사용자 정보
     * @private
     */
    async rejoinChatRoom(user) {
        try {
            console.log('Attempting to rejoin chat room...');
            
            // 채팅방 정보 가져오기
            const room = await dbService.getChatRoom(user.room_id);
            
            if (!room || room.status !== 'active') {
                console.log('Room no longer active or exists');
                userService.clearUserFromLocalStorage();
                return false;
            }
            
            // 채팅방 접근 가능 여부 확인
            if (room.type === 'private') {
                // 비공개 채팅방은 자동 재입장 허용하지 않음
                console.log('Cannot auto-rejoin private room');
                userService.clearUserFromLocalStorage();
                return false;
            }
            
            // 사용자 정보 업데이트
            await userService.updateActivity();
            
            // 채팅방 설정
            await chatService.setRoom(user.room_id);
            
            // 채팅 화면으로 전환
            document.getElementById('current-room-name').textContent = room.name;
            uiManager.showScreen('chat');
            
            // 사용자 목록 새로고침
            await uiManager.refreshUserList();
            
            console.log('Successfully rejoined chat room');
            return true;
        } catch (error) {
            console.error('Error rejoining chat room:', error);
            userService.clearUserFromLocalStorage();
            return false;
        }
    }

    /**
     * 채팅방 입장
     * @param {string} roomId 채팅방 ID
     * @param {string} username 사용자 이름
     * @param {string} accessCode 접근 코드 (비공개 채팅방인 경우)
     * @returns {Promise<{success: boolean, message: string}>} 입장 결과
     */
    async joinChatRoom(roomId, username, accessCode = null) {
        try {
            // 채팅방 접근 가능 여부 확인
            const accessResult = await dbService.validateRoomAccess(roomId, accessCode);
            
            if (!accessResult.success) {
                return { success: false, message: accessResult.message };
            }
            
            // 사용자 생성
            const userResult = await userService.createUser(
                roomId,
                username,
                i18nService.getCurrentLanguage()
            );
            
            if (!userResult.success) {
                return { success: false, message: 'error-creating-user' };
            }
            
            // 채팅방 설정
            const chatResult = await chatService.setRoom(roomId);
            
            if (!chatResult) {
                return { success: false, message: 'error-connecting' };
            }
            
            return { success: true, message: 'joined' };
        } catch (error) {
            console.error('Error joining chat room:', error);
            return { success: false, message: 'unknown-error' };
        }
    }

    /**
     * 채팅방 퇴장
     * @returns {Promise<boolean>} 퇴장 성공 여부
     */
    async leaveChatRoom() {
        try {
            // 사용자 정보 삭제
            await userService.leaveRoom();
            
            // 채팅 서비스 초기화
            chatService.leaveRoom();
            
            return true;
        } catch (error) {
            console.error('Error leaving chat room:', error);
            return false;
        }
    }

    /**
     * 메시지 전송
     * @param {string} content 메시지 내용
     * @param {string|null} replyToId 답장 대상 메시지 ID
     * @returns {Promise<{success: boolean, messageId: string|null}>} 전송 결과
     */
    async sendMessage(content, replyToId = null) {
        // 연결 상태 확인
        if (!offlineService.isConnected()) {
            // 오프라인 상태면 로컬에 저장
            const currentUser = userService.getCurrentUser();
            
            if (!currentUser) {
                return { success: false, messageId: null };
            }
            
            offlineService.saveOfflineMessage({
                room_id: currentUser.room_id,
                user_id: currentUser.id,
                username: currentUser.username,
                content: content,
                language: i18nService.getCurrentLanguage(),
                reply_to: replyToId,
                is_announcement: content.startsWith('/공지 ') || content.startsWith('/notice ')
            });
            
            return { success: true, messageId: null };
        }
        
        // 온라인 상태면 메시지 전송
        return await chatService.sendMessage(
            content,
            i18nService.getCurrentLanguage(),
            replyToId
        );
    }

    /**
     * 관리자 로그인
     * @param {string} adminId 관리자 ID
     * @param {string} password 비밀번호
     * @returns {Promise<{success: boolean, adminId: string|null}>} 로그인 결과
     */
    async adminLogin(adminId, password) {
        return await dbService.authenticateAdmin(adminId, password);
    }
}

// 싱글톤 인스턴스 생성
const appCore = new AppCore();

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    appCore.initialize().then(success => {
        if (success) {
            console.log('Application ready');
        } else {
            console.error('Failed to initialize application');
            alert(i18nService.translate('initialization-error'));
        }
    });
});
