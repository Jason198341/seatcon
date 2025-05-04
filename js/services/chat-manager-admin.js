/**
 * 관리자용 채팅 관리 기능
 * ChatManager 클래스의 관리자 전용 기능 확장
 */

/**
 * 관리자 공지사항 메시지 전송
 * @param {string} content - 메시지 내용
 * @returns {Promise<Object|null>} - 전송된 메시지 또는 null
 */
async function sendAnnouncement(content) {
    try {
        if (!this.userService.isAdmin()) {
            this.logger.warn('관리자만 공지사항을 보낼 수 있습니다.');
            throw new Error('관리자 권한이 필요합니다.');
        }
        
        if (!content.trim()) {
            this.logger.warn('빈 공지사항은 전송할 수 없습니다.');
            return null;
        }
        
        // 공지사항 접두사 추가
        const announcementContent = `${this.config.ADMIN.ANNOUNCEMENT_PREFIX} ${content}`;
        
        // Supabase 클라이언트를 통해 공지사항 전송
        const message = await this.supabaseClient.sendAnnouncement(announcementContent);
        
        if (message) {
            // 전송된 메시지를 로컬 메시지 목록에 추가
            this.messages.push(message);
            
            // 메시지 전송 플래그 설정
            this.hasSentMessagesFlag = true;
            
            // 메시지 전송 이벤트 발생
            if (this.listeners.onNewMessage) {
                this.listeners.onNewMessage(message);
            }
            
            this.logger.info('공지사항 전송 완료:', message);
            return message;
        }
        
        return null;
    } catch (error) {
        this.logger.error('공지사항 전송 중 오류 발생:', error);
        
        // 연결 오류 처리
        this.handleConnectionError(error);
        
        throw error;
    }
}

// ChatManager 클래스에 관리자 기능 추가하는 코드
// 아래는 main.js에서 호출되어야 하는 코드로, 추가 기능을 확장하는 방법을 보여줍니다.
// ChatManager.prototype.sendAnnouncement = sendAnnouncement;

/**
 * 관리자 기능을 ChatManager에 확장하는 함수
 * @param {ChatManager} chatManager - 채팅 관리자 인스턴스
 */
function extendChatManagerWithAdminFeatures(chatManager) {
    // 관리자 공지사항 전송 기능 추가
    chatManager.sendAnnouncement = sendAnnouncement.bind(chatManager);
    
    return chatManager;
}
