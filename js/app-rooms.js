/**
 * 채팅방 관리 모듈
 * 채팅방 생성, 관리 및 관련 기능을 처리합니다.
 */

class RoomManager {
    constructor() {
        this.rooms = [];
    }

    /**
     * 모든 채팅방 목록 가져오기
     * @param {boolean} activeOnly 활성화된 채팅방만 가져올지 여부
     * @returns {Promise<Array>} 채팅방 목록
     */
    async getAllRooms(activeOnly = false) {
        try {
            const rooms = await dbService.getChatRooms(activeOnly);
            this.rooms = rooms;
            return rooms;
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
    }

    /**
     * 특정 채팅방 정보 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Object|null>} 채팅방 정보
     */
    async getRoom(roomId) {
        // 메모리 캐시에서 먼저 확인
        const cachedRoom = this.rooms.find(room => room.id === roomId);
        if (cachedRoom) {
            return cachedRoom;
        }
        
        // 데이터베이스에서 가져오기
        return await dbService.getChatRoom(roomId);
    }

    /**
     * 채팅방 참가자 목록 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Array>} 참가자 목록
     */
    async getRoomParticipants(roomId) {
        return await dbService.getRoomUsers(roomId);
    }

    /**
     * 채팅방 참가자 수 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<number>} 참가자 수
     */
    async getRoomParticipantCount(roomId) {
        const participants = await this.getRoomParticipants(roomId);
        return participants.length;
    }

    /**
     * 새 채팅방 생성 (관리자 전용)
     * @param {Object} roomData 채팅방 정보
     * @returns {Promise<{success: boolean, roomId: string|null}>} 생성 결과
     */
    async createRoom(roomData) {
        try {
            // 관리자 페이지에서 구현 예정
            return { success: false, roomId: null };
        } catch (error) {
            console.error('Error creating room:', error);
            return { success: false, roomId: null };
        }
    }

    /**
     * 채팅방 정보 업데이트 (관리자 전용)
     * @param {string} roomId 채팅방 ID
     * @param {Object} updates 업데이트할 정보
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    async updateRoom(roomId, updates) {
        try {
            // 관리자 페이지에서 구현 예정
            return false;
        } catch (error) {
            console.error(`Error updating room ${roomId}:`, error);
            return false;
        }
    }

    /**
     * 채팅방 삭제 (관리자 전용)
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<boolean>} 삭제 성공 여부
     */
    async deleteRoom(roomId) {
        try {
            // 관리자 페이지에서 구현 예정
            return false;
        } catch (error) {
            console.error(`Error deleting room ${roomId}:`, error);
            return false;
        }
    }

    /**
     * 채팅방 상태 변경 (관리자 전용)
     * @param {string} roomId 채팅방 ID
     * @param {string} status 변경할 상태 ('active' 또는 'inactive')
     * @returns {Promise<boolean>} 변경 성공 여부
     */
    async setRoomStatus(roomId, status) {
        try {
            // 관리자 페이지에서 구현 예정
            return false;
        } catch (error) {
            console.error(`Error setting room ${roomId} status:`, error);
            return false;
        }
    }
}

// 싱글톤 인스턴스 생성
const roomManager = new RoomManager();
