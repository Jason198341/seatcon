/**
 * 채팅방 관리 모듈
 * 채팅방 관리 및 관련 기능을 처리합니다.
 */

class RoomManager {
    constructor() {
        this.rooms = [];
        this.currentRoomId = null;
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing room manager...');
            
            // 채팅방 목록 로드
            await this.loadRooms();
            
            console.log('Room manager initialized');
            return true;
        } catch (error) {
            console.error('Error initializing room manager:', error);
            return false;
        }
    }

    /**
     * 채팅방 목록 로드
     * @param {boolean} activeOnly 활성화된 채팅방만 가져올지 여부
     * @returns {Promise<Array>} 채팅방 목록
     */
    async loadRooms(activeOnly = false) {
        try {
            this.rooms = await dbService.getChatRooms(activeOnly);
            return this.rooms;
        } catch (error) {
            console.error('Error loading rooms:', error);
            return [];
        }
    }

    /**
     * 채팅방 정보 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Object|null>} 채팅방 정보
     */
    async getRoom(roomId) {
        // 이미 로드된 채팅방 목록에서 확인
        const cachedRoom = this.rooms.find(room => room.id === roomId);
        
        if (cachedRoom) {
            return cachedRoom;
        }
        
        // 데이터베이스에서 가져오기
        try {
            return await dbService.getChatRoom(roomId);
        } catch (error) {
            console.error('Error getting room:', error);
            return null;
        }
    }

    /**
     * 현재 채팅방 설정
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<boolean>} 설정 성공 여부
     */
    async setCurrentRoom(roomId) {
        try {
            const room = await this.getRoom(roomId);
            
            if (!room) {
                console.error('Room not found:', roomId);
                return false;
            }
            
            this.currentRoomId = roomId;
            return true;
        } catch (error) {
            console.error('Error setting current room:', error);
            return false;
        }
    }

    /**
     * 현재 채팅방 가져오기
     * @returns {Promise<Object|null>} 채팅방 정보
     */
    async getCurrentRoom() {
        if (!this.currentRoomId) {
            return null;
        }
        
        return await this.getRoom(this.currentRoomId);
    }

    /**
     * 채팅방의 참가자 수 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<number>} 참가자 수
     */
    async getUserCount(roomId) {
        try {
            const users = await dbService.getRoomUsers(roomId);
            return users.length;
        } catch (error) {
            console.error('Error getting user count:', error);
            return 0;
        }
    }

    /**
     * 채팅방 접근 코드 확인
     * @param {string} roomId 채팅방 ID
     * @param {string} accessCode 접근 코드
     * @returns {Promise<boolean>} 접근 가능 여부
     */
    async checkAccessCode(roomId, accessCode) {
        try {
            const result = await dbService.validateRoomAccess(roomId, accessCode);
            return result.success;
        } catch (error) {
            console.error('Error checking access code:', error);
            return false;
        }
    }

    /**
     * 새 채팅방 생성 (관리자 기능)
     * @param {Object} roomData 채팅방 정보
     * @returns {Promise<{success: boolean, roomId: string|null}>} 생성 결과
     */
    async createRoom(roomData) {
        try {
            // 실제로는 관리자 권한 확인 필요
            
            // TODO: 채팅방 생성 API 호출
            // 현재 데모에서는 구현하지 않음
            
            // 채팅방 목록 새로고침
            await this.loadRooms();
            
            return { success: true, roomId: 'new-room-id' };
        } catch (error) {
            console.error('Error creating room:', error);
            return { success: false, roomId: null };
        }
    }

    /**
     * 채팅방 정보 업데이트 (관리자 기능)
     * @param {string} roomId 채팅방 ID
     * @param {Object} updates 업데이트할 정보
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    async updateRoom(roomId, updates) {
        try {
            // 실제로는 관리자 권한 확인 필요
            
            // TODO: 채팅방 업데이트 API 호출
            // 현재 데모에서는 구현하지 않음
            
            // 채팅방 목록 새로고침
            await this.loadRooms();
            
            return true;
        } catch (error) {
            console.error('Error updating room:', error);
            return false;
        }
    }

    /**
     * 채팅방 삭제 (관리자 기능)
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<boolean>} 삭제 성공 여부
     */
    async deleteRoom(roomId) {
        try {
            // 실제로는 관리자 권한 확인 필요
            
            // TODO: 채팅방 삭제 API 호출
            // 현재 데모에서는 구현하지 않음
            
            // 채팅방 목록 새로고침
            await this.loadRooms();
            
            return true;
        } catch (error) {
            console.error('Error deleting room:', error);
            return false;
        }
    }

    /**
     * 모든 채팅방의 통계 가져오기 (관리자 기능)
     * @returns {Promise<Array>} 채팅방 통계 목록
     */
    async getRoomStats() {
        try {
            // 모든 채팅방 가져오기
            const rooms = await this.loadRooms(false);
            
            // 각 채팅방의 통계 계산
            const roomStats = await Promise.all(rooms.map(async (room) => {
                // 참가자 수
                const userCount = await this.getUserCount(room.id);
                
                // TODO: 메시지 수, 활동량 등 추가 통계
                
                return {
                    ...room,
                    userCount,
                    messageCount: 0, // 데모에서는 임의의 값
                    activityLevel: 'medium' // 데모에서는 임의의 값
                };
            }));
            
            return roomStats;
        } catch (error) {
            console.error('Error getting room stats:', error);
            return [];
        }
    }
}

// 싱글톤 인스턴스 생성
const roomManager = new RoomManager();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    roomManager.initialize();
});
