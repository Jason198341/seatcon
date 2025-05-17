/**
 * 사용자 관리 모듈
 * 사용자 목록 관리 및, 상태 추적, 권한 관리 등을 담당합니다.
 */

class UserManager {
    constructor() {
        this.users = [];
        this.activityCheckInterval = null;
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing user manager...');
            
            // 사용자 상태 확인 타이머 시작
            this.startActivityCheck();
            
            console.log('User manager initialized');
            return true;
        } catch (error) {
            console.error('Error initializing user manager:', error);
            return false;
        }
    }

    /**
     * 사용자 상태 확인 타이머 시작
     * @param {number} interval 확인 간격 (밀리초)
     */
    startActivityCheck(interval = 60000) {
        // 이전 타이머가 있으면 정지
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
        }
        
        // 주기적으로 사용자 상태 확인
        this.activityCheckInterval = setInterval(() => {
            this.checkInactiveUsers();
        }, interval);
    }

    /**
     * 사용자 상태 확인 타이머 정지
     */
    stopActivityCheck() {
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
        }
    }

    /**
     * 비활성 사용자 확인 및 처리
     * @returns {Promise<void>}
     * @private
     */
    async checkInactiveUsers() {
        // 현재 사용자 정보
        const currentUser = userService.getCurrentUser();
        
        if (!currentUser || !currentUser.room_id) {
            return;
        }
        
        try {
            // 채팅방의 사용자 목록 가져오기
            const users = await dbService.getRoomUsers(currentUser.room_id);
            
            // 현재 시간
            const now = new Date();
            
            // 비활성 사용자 필터링 (5분 이상 활동 없음)
            const inactiveUsers = users.filter(user => {
                const lastActive = new Date(user.last_active);
                const diffMinutes = (now - lastActive) / (1000 * 60);
                return diffMinutes >= 5;
            });
            
            // 비활성 사용자가 있으면 UI 업데이트
            if (inactiveUsers.length > 0) {
                await uiManager.refreshUserList();
                
                // 시스템 메시지로 알림
                inactiveUsers.forEach(user => {
                    uiManager.addSystemMessage(`${user.username} ${i18nService.translate('is-inactive')}`);
                });
            }
        } catch (error) {
            console.error('Error checking inactive users:', error);
        }
    }

    /**
     * 채팅방의 사용자 목록 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Array>} 사용자 목록
     */
    async getRoomUsers(roomId) {
        try {
            const users = await dbService.getRoomUsers(roomId);
            this.users = users;
            return users;
        } catch (error) {
            console.error('Error getting room users:', error);
            return [];
        }
    }

    /**
     * 현재 채팅방의 사용자 목록 가져오기
     * @returns {Promise<Array>} 사용자 목록
     */
    async getCurrentRoomUsers() {
        const currentUser = userService.getCurrentUser();
        
        if (!currentUser || !currentUser.room_id) {
            return [];
        }
        
        return await this.getRoomUsers(currentUser.room_id);
    }

    /**
     * 사용자 찾기
     * @param {string} userId 사용자 ID
     * @returns {Object|null} 사용자 정보
     */
    findUser(userId) {
        return this.users.find(user => user.id === userId) || null;
    }

    /**
     * 사용자 이름으로 사용자 찾기
     * @param {string} username 사용자 이름
     * @returns {Object|null} 사용자 정보
     */
    findUserByName(username) {
        return this.users.find(user => user.username === username) || null;
    }

    /**
     * 사용자 차단 (관리자 기능)
     * @param {string} userId 차단할 사용자 ID
     * @returns {Promise<boolean>} 차단 성공 여부
     */
    async banUser(userId) {
        try {
            // 실제로는 관리자 권한 확인 필요
            
            // 사용자 찾기
            const user = this.findUser(userId);
            
            if (!user) {
                return false;
            }
            
            // TODO: 사용자 차단 API 호출
            // 현재 데모에서는 구현하지 않음
            
            // 사용자 목록 업데이트
            await this.getCurrentRoomUsers();
            
            return true;
        } catch (error) {
            console.error('Error banning user:', error);
            return false;
        }
    }

    /**
     * 사용자 권한 변경 (관리자 기능)
     * @param {string} userId 사용자 ID
     * @param {string} role 새 권한 ('user', 'admin', 'moderator')
     * @returns {Promise<boolean>} 변경 성공 여부
     */
    async changeUserRole(userId, role) {
        try {
            // 실제로는 관리자 권한 확인 필요
            
            // 사용자 찾기
            const user = this.findUser(userId);
            
            if (!user) {
                return false;
            }
            
            // TODO: 사용자 권한 변경 API 호출
            // 현재 데모에서는 구현하지 않음
            
            // 사용자 목록 업데이트
            await this.getCurrentRoomUsers();
            
            return true;
        } catch (error) {
            console.error('Error changing user role:', error);
            return false;
        }
    }

    /**
     * 모든 사용자의 통계 가져오기 (관리자 기능)
     * @returns {Promise<Object>} 사용자 통계
     */
    async getUserStats() {
        try {
            // TODO: 사용자 통계 API 호출
            // 현재 데모에서는 임의의 값 반환
            
            return {
                totalUsers: 0,
                activeUsers: 0,
                usersByLanguage: {
                    ko: 0,
                    en: 0,
                    ja: 0,
                    zh: 0
                }
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    /**
     * 사용자 활동 데이터 가져오기 (관리자 기능)
     * @param {string} period 기간 ('daily', 'weekly', 'monthly')
     * @returns {Promise<Array>} 활동 데이터
     */
    async getUserActivityData(period = 'daily') {
        try {
            // TODO: 사용자 활동 데이터 API 호출
            // 현재 데모에서는 임의의 값 반환
            
            return [];
        } catch (error) {
            console.error('Error getting user activity data:', error);
            return [];
        }
    }
}

// 싱글톤 인스턴스 생성
const userManager = new UserManager();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    userManager.initialize();
});
