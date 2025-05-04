/**
 * 관리자 공지사항 기능 확장
 * ChatManager 클래스에 추가해야 하는 메서드
 */

/**
 * 관리자 공지사항 메시지 전송
 * @param {string} content - 메시지 내용
 * @returns {Promise<Object|null>} - 전송된 메시지 또는 null
 */
async sendAnnouncement(content) {
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
        
        // 관리자 정보 가져오기
        const currentUser = this.userService.getCurrentUser();
        
        const clientGeneratedId = Date.now().toString();
        
        try {
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
            
            // 연결 상태 업데이트
            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network Error') ||
                error.message.includes('Connection error') ||
                error.message.includes('Supabase 연결이 끊어졌습니다')
            ) {
                this.connectionStatus = 'disconnected';
            }
            
            // 개발 환경에서는 임시 응답 생성
            if (this.config && this.config.DEBUG && this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 임시 공지사항을 생성합니다.');
                return {
                    id: 'local-announcement-' + clientGeneratedId,
                    speaker_id: 'global-chat',
                    author_name: currentUser.name,
                    author_email: currentUser.email,
                    content: announcementContent,
                    client_generated_id: clientGeneratedId,
                    user_role: 'admin',
                    language: currentUser.language,
                    created_at: new Date().toISOString(),
                    status: 'local',
                    is_announcement: true
                };
            }
            
            throw new Error('공지사항 전송에 실패했습니다.');
        }
    } catch (error) {
        this.logger.error('공지사항 전송 중 오류 발생:', error);
        throw error;
    }
}
