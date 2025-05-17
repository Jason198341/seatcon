/**
 * 사용자 서비스
 * 사용자 정보 관리, 인증, 세션 등을 처리합니다.
 */

class UserService {
    constructor() {
        this.currentUser = null;
    }

    /**
     * 초기화: 로컬 스토리지에서 사용자 정보 불러오기
     */
    initialize() {
        try {
            this.loadUserFromLocalStorage();
            return true;
        } catch (error) {
            console.error('Error initializing user service:', error);
            return false;
        }
    }

    /**
     * 로컬 스토리지에서 사용자 정보 불러오기
     * @private
     */
    loadUserFromLocalStorage() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('User loaded from localStorage:', this.currentUser.username);
            }
        } catch (error) {
            console.error('Error loading user data from localStorage:', error);
            this.currentUser = null;
        }
    }

    /**
     * 로컬 스토리지에 사용자 정보 저장
     * @private
     */
    saveUserToLocalStorage() {
        try {
            if (this.currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            } else {
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error('Error saving user data to localStorage:', error);
        }
    }

    /**
     * 로컬 스토리지에서 사용자 정보 삭제
     */
    clearUserFromLocalStorage() {
        try {
            localStorage.removeItem('currentUser');
            this.currentUser = null;
        } catch (error) {
            console.error('Error clearing user data from localStorage:', error);
        }
    }

    /**
     * 현재 사용자 정보 가져오기
     * @returns {Object|null} 사용자 정보
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 새 사용자 생성
     * @param {string} roomId 채팅방 ID
     * @param {string} username 사용자 이름
     * @param {string} preferredLanguage 선호 언어
     * @returns {Promise<{success: boolean, userId: string|null}>} 생성 결과
     */
    async createUser(roomId, username, preferredLanguage) {
        try {
            console.log('Creating new user:', username, 'in room:', roomId);
            
            // 사용자 추가
            const result = await dbService.addUserToRoom(roomId, username, preferredLanguage);
            
            if (!result.success) {
                console.error('Failed to add user to room');
                return { success: false, userId: null };
            }
            
            // 현재 사용자 설정
            this.currentUser = {
                id: result.userId,
                room_id: roomId,
                username: username,
                preferred_language: preferredLanguage
            };
            
            // 로컬 스토리지에 저장
            this.saveUserToLocalStorage();
            
            console.log('User created successfully:', this.currentUser);
            return { success: true, userId: result.userId };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, userId: null };
        }
    }

    /**
     * 사용자 활동 시간 업데이트
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    async updateActivity() {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            const result = await dbService.updateUserActivity(this.currentUser.id);
            return result;
        } catch (error) {
            console.error('Error updating user activity:', error);
            return false;
        }
    }

    /**
     * 사용자 선호 언어 업데이트
     * @param {string} language 언어 코드
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    async updatePreferredLanguage(language) {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            // 데이터베이스 업데이트
            const result = await dbService.updateUser(this.currentUser.id, {
                preferred_language: language
            });
            
            if (result) {
                // 로컬 사용자 정보 업데이트
                this.currentUser.preferred_language = language;
                this.saveUserToLocalStorage();
            }
            
            return result;
        } catch (error) {
            console.error('Error updating preferred language:', error);
            return false;
        }
    }

    /**
     * 채팅방 퇴장
     * @returns {Promise<boolean>} 퇴장 성공 여부
     */
    async leaveRoom() {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            // 데이터베이스에서 사용자 삭제
            const result = await dbService.removeUser(this.currentUser.id);
            
            // 로컬 데이터 삭제
            this.clearUserFromLocalStorage();
            
            return result;
        } catch (error) {
            console.error('Error leaving room:', error);
            return false;
        }
    }

    /**
     * 사용자 존재 여부 확인
     * @returns {boolean} 사용자 존재 여부
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * 채팅방의 다른 사용자 목록 가져오기
     * @returns {Promise<Array>} 사용자 목록
     */
    async getRoomUsers() {
        if (!this.currentUser) {
            return [];
        }
        
        try {
            // 채팅방의 모든 사용자 가져오기
            const users = await dbService.getRoomUsers(this.currentUser.room_id);
            
            // 자신을 제외한 사용자 필터링
            return users.filter(user => user.id !== this.currentUser.id);
        } catch (error) {
            console.error('Error getting room users:', error);
            return [];
        }
    }

    /**
     * 주기적으로 사용자 활동 업데이트 (온라인 상태 유지)
     * @param {number} interval 업데이트 간격 (밀리초)
     */
    startActivityUpdates(interval = 30000) {
        // 이전 타이머가 있으면 정지
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
        }
        
        // 주기적으로 활동 업데이트
        this.activityTimer = setInterval(() => {
            if (this.isLoggedIn()) {
                this.updateActivity();
            } else {
                clearInterval(this.activityTimer);
            }
        }, interval);
    }

    /**
     * 활동 업데이트 중지
     */
    stopActivityUpdates() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
    }
}

// 싱글톤 인스턴스 생성
const userService = new UserService();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    userService.initialize();
});
