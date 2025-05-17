/**
 * 사용자 서비스
 * 사용자 정보 관리 및 처리를 담당합니다.
 */

class UserService {
    constructor() {
        this.currentUser = null;
        this.users = []; // 현재 채팅방의 사용자 목록
    }

    /**
     * 현재 사용자 정보 설정
     * @param {Object} user 사용자 정보
     */
    setCurrentUser(user) {
        this.currentUser = user;
        this.saveUserToLocalStorage();
    }

    /**
     * 현재 사용자 정보 가져오기
     * @returns {Object|null} 현재 사용자 정보
     */
    getCurrentUser() {
        if (!this.currentUser) {
            this.loadUserFromLocalStorage();
        }
        return this.currentUser;
    }

    /**
     * 사용자 정보를 LocalStorage에 저장
     */
    saveUserToLocalStorage() {
        try {
            if (this.currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            console.error('Error saving user to localStorage:', error);
        }
    }

    /**
     * LocalStorage에서 사용자 정보 불러오기
     */
    loadUserFromLocalStorage() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
        } catch (error) {
            console.error('Error loading user from localStorage:', error);
            this.currentUser = null;
        }
    }

    /**
     * LocalStorage에서 사용자 정보 삭제
     */
    clearUserFromLocalStorage() {
        try {
            localStorage.removeItem('currentUser');
            this.currentUser = null;
        } catch (error) {
            console.error('Error clearing user from localStorage:', error);
        }
    }

    /**
     * 새 사용자 생성 및 채팅방 입장
     * @param {string} roomId 채팅방 ID
     * @param {string} username 사용자 이름
     * @param {string} preferredLanguage 선호 언어
     * @returns {Promise<{success: boolean, user: Object|null}>} 생성 결과
     */
    async createUser(roomId, username, preferredLanguage) {
        try {
            const result = await dbService.addUserToRoom(roomId, username, preferredLanguage);
            
            if (!result.success) {
                return { success: false, user: null };
            }
            
            // 사용자 정보 객체 생성
            const user = {
                id: result.userId,
                room_id: roomId,
                username: username,
                preferred_language: preferredLanguage,
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString()
            };
            
            // 현재 사용자로 설정
            this.setCurrentUser(user);
            
            return { success: true, user };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, user: null };
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
            const result = await dbService.updateUser(this.currentUser.id, {
                preferred_language: language
            });
            
            if (result) {
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
     * 사용자 활동 시간 업데이트
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    async updateActivity() {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            const result = await dbService.updateUserActivity(this.currentUser.id);
            
            if (result) {
                this.currentUser.last_active = new Date().toISOString();
                this.saveUserToLocalStorage();
            }
            
            return result;
        } catch (error) {
            console.error('Error updating user activity:', error);
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
            const result = await dbService.removeUser(this.currentUser.id);
            
            if (result) {
                this.clearUserFromLocalStorage();
            }
            
            return result;
        } catch (error) {
            console.error('Error leaving room:', error);
            return false;
        }
    }

    /**
     * 채팅방 사용자 목록 가져오기 및 업데이트
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Array>} 사용자 목록
     */
    async refreshUserList(roomId) {
        try {
            const users = await dbService.getRoomUsers(roomId);
            this.users = users;
            return users;
        } catch (error) {
            console.error('Error refreshing user list:', error);
            return [];
        }
    }

    /**
     * 현재 채팅방 사용자 목록 가져오기
     * @returns {Array} 사용자 목록
     */
    getUserList() {
        return this.users;
    }

    /**
     * 사용자 ID로 사용자 정보 찾기
     * @param {string} userId 사용자 ID
     * @returns {Object|null} 사용자 정보
     */
    getUserById(userId) {
        return this.users.find(user => user.id === userId) || null;
    }

    /**
     * 사용자 이름으로 사용자 정보 찾기
     * @param {string} username 사용자 이름
     * @returns {Object|null} 사용자 정보
     */
    getUserByUsername(username) {
        return this.users.find(user => user.username === username) || null;
    }

    /**
     * 현재 채팅방 사용자 수 가져오기
     * @returns {number} 사용자 수
     */
    getUserCount() {
        return this.users.length;
    }

    /**
     * 새 사용자 목록에 추가
     * @param {Object} user 사용자 정보
     */
    addUser(user) {
        // 이미 존재하는 사용자면 업데이트
        const index = this.users.findIndex(u => u.id === user.id);
        if (index >= 0) {
            this.users[index] = user;
        } else {
            this.users.push(user);
        }
    }

    /**
     * 사용자 목록에서 사용자 제거
     * @param {string} userId 사용자 ID
     */
    removeUser(userId) {
        this.users = this.users.filter(user => user.id !== userId);
    }
}

// 싱글톤 인스턴스 생성
const userService = new UserService();
