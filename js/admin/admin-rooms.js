/**
 * 관리자 채팅방 관리 모듈
 * 관리자 페이지의 채팅방 관리 기능을 처리합니다.
 */

class AdminRooms {
    constructor() {
        this.roomsTableBody = document.getElementById('rooms-table-body');
        this.addRoomBtn = document.getElementById('add-room-btn');
        this.roomModal = document.getElementById('room-modal');
        this.roomForm = document.getElementById('room-form');
        this.roomModalTitle = document.getElementById('room-modal-title');
        this.roomIdInput = document.getElementById('room-id');
        this.roomNameInput = document.getElementById('room-name');
        this.roomDescriptionInput = document.getElementById('room-description');
        this.roomTypeInput = document.getElementById('room-type');
        this.accessCodeContainer = document.getElementById('access-code-container');
        this.roomAccessCodeInput = document.getElementById('room-access-code');
        this.roomMaxUsersInput = document.getElementById('room-max-users');
        this.roomStatusInput = document.getElementById('room-status');
        this.saveRoomBtn = document.getElementById('save-room-btn');
        this.closeModalBtns = document.querySelectorAll('.close-modal-btn, .cancel-modal-btn');
        
        this.rooms = [];
    }

    /**
     * 채팅방 관리 초기화
     */
    initialize() {
        // 이벤트 리스너 등록
        this.setupEventListeners();
        
        // 채팅방 목록 로드
        this.loadRooms();
    }

    /**
     * 이벤트 리스너 등록
     * @private
     */
    setupEventListeners() {
        // 새 채팅방 추가 버튼
        this.addRoomBtn.addEventListener('click', () => {
            this.showAddRoomModal();
        });
        
        // 모달 닫기 버튼
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });
        
        // 채팅방 유형 변경 이벤트
        this.roomTypeInput.addEventListener('change', () => {
            this.toggleAccessCodeContainer();
        });
        
        // 채팅방 폼 제출 이벤트
        this.roomForm.addEventListener('submit', e => {
            e.preventDefault();
            this.handleRoomFormSubmit();
        });
    }

    /**
     * 채팅방 목록 로드
     * @private
     */
    async loadRooms() {
        try {
            // 채팅방 목록 가져오기
            const rooms = await dbService.getChatRooms();
            this.rooms = rooms;
            
            // 테이블 업데이트
            this.updateRoomsTable();
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    }

    /**
     * 채팅방 테이블 업데이트
     * @private
     */
    updateRoomsTable() {
        // 테이블 초기화
        this.roomsTableBody.innerHTML = '';
        
        // 채팅방 목록 표시
        this.rooms.forEach(room => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${room.id}</td>
                <td>${room.name}</td>
                <td>${room.description || '-'}</td>
                <td><span class="status-badge ${room.status}">${room.status}</span></td>
                <td>${room.type}</td>
                <td>${this.formatDate(room.created_at)}</td>
                <td id="room-user-count-${room.id}">...</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn edit-room-btn" data-room-id="${room.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn delete-room-btn" data-room-id="${room.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            this.roomsTableBody.appendChild(row);
            
            // 참가자 수 로드
            this.loadRoomUserCount(room.id);
        });
        
        // 수정 버튼 이벤트 등록
        const editBtns = document.querySelectorAll('.edit-room-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const roomId = btn.getAttribute('data-room-id');
                this.showEditRoomModal(roomId);
            });
        });
        
        // 삭제 버튼 이벤트 등록
        const deleteBtns = document.querySelectorAll('.delete-room-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const roomId = btn.getAttribute('data-room-id');
                this.confirmDeleteRoom(roomId);
            });
        });
    }

    /**
     * 채팅방 참가자 수 로드
     * @param {string} roomId 채팅방 ID
     * @private
     */
    async loadRoomUserCount(roomId) {
        try {
            // 참가자 수 가져오기
            const users = await dbService.getRoomUsers(roomId);
            
            // 참가자 수 표시
            const countElement = document.getElementById(`room-user-count-${roomId}`);
            if (countElement) {
                countElement.textContent = users.length;
            }
        } catch (error) {
            console.error(`Error loading user count for room ${roomId}:`, error);
        }
    }

    /**
     * 새 채팅방 추가 모달 표시
     * @private
     */
    showAddRoomModal() {
        // 모달 제목 설정
        this.roomModalTitle.textContent = '새 채팅방 추가';
        
        // 폼 초기화
        this.roomForm.reset();
        this.roomIdInput.value = '';
        
        // 접근 코드 컨테이너 상태 업데이트
        this.toggleAccessCodeContainer();
        
        // 모달 표시
        this.roomModal.classList.add('active');
    }

    /**
     * 채팅방 수정 모달 표시
     * @param {string} roomId 채팅방 ID
     * @private
     */
    showEditRoomModal(roomId) {
        // 모달 제목 설정
        this.roomModalTitle.textContent = '채팅방 수정';
        
        // 채팅방 정보 가져오기
        const room = this.rooms.find(r => r.id === roomId);
        
        if (!room) {
            return;
        }
        
        // 폼 값 설정
        this.roomIdInput.value = room.id;
        this.roomNameInput.value = room.name;
        this.roomDescriptionInput.value = room.description || '';
        this.roomTypeInput.value = room.type;
        this.roomAccessCodeInput.value = room.access_code || '';
        this.roomMaxUsersInput.value = room.max_users;
        this.roomStatusInput.value = room.status;
        
        // 접근 코드 컨테이너 상태 업데이트
        this.toggleAccessCodeContainer();
        
        // 모달 표시
        this.roomModal.classList.add('active');
    }

    /**
     * 모달 숨기기
     * @private
     */
    hideModal() {
        this.roomModal.classList.remove('active');
    }

    /**
     * 접근 코드 컨테이너 토글
     * @private
     */
    toggleAccessCodeContainer() {
        if (this.roomTypeInput.value === 'private') {
            this.accessCodeContainer.classList.remove('hidden');
        } else {
            this.accessCodeContainer.classList.add('hidden');
        }
    }

    /**
     * 채팅방 폼 제출 처리
     * @private
     */
    async handleRoomFormSubmit() {
        try {
            const roomId = this.roomIdInput.value;
            
            // 채팅방 데이터 준비
            const roomData = {
                name: this.roomNameInput.value,
                description: this.roomDescriptionInput.value,
                type: this.roomTypeInput.value,
                access_code: this.roomTypeInput.value === 'private' ? this.roomAccessCodeInput.value : null,
                max_users: parseInt(this.roomMaxUsersInput.value),
                status: this.roomStatusInput.value
            };
            
            let result;
            
            if (roomId) {
                // 채팅방 수정
                result = await this.updateRoom(roomId, roomData);
            } else {
                // 새 채팅방 추가
                result = await this.createRoom(roomData);
            }
            
            if (result) {
                // 모달 숨기기
                this.hideModal();
                
                // 채팅방 목록 새로고침
                this.loadRooms();
            }
        } catch (error) {
            console.error('Error submitting room form:', error);
            alert('채팅방 저장 중 오류가 발생했습니다.');
        }
    }

    /**
     * 새 채팅방 생성
     * @param {Object} roomData 채팅방 데이터
     * @returns {Promise<boolean>} 생성 성공 여부
     * @private
     */
    async createRoom(roomData) {
        try {
            // 실제 애플리케이션에서는 데이터베이스에 저장
            // 여기서는 데모를 위한 가상 구현
            console.log('Creating room:', roomData);
            
            // 성공으로 가정
            return true;
        } catch (error) {
            console.error('Error creating room:', error);
            return false;
        }
    }

    /**
     * 채팅방 정보 업데이트
     * @param {string} roomId 채팅방 ID
     * @param {Object} roomData 채팅방 데이터
     * @returns {Promise<boolean>} 업데이트 성공 여부
     * @private
     */
    async updateRoom(roomId, roomData) {
        try {
            // 실제 애플리케이션에서는 데이터베이스에 저장
            // 여기서는 데모를 위한 가상 구현
            console.log('Updating room:', roomId, roomData);
            
            // 성공으로 가정
            return true;
        } catch (error) {
            console.error(`Error updating room ${roomId}:`, error);
            return false;
        }
    }

    /**
     * 채팅방 삭제 확인
     * @param {string} roomId 채팅방 ID
     * @private
     */
    confirmDeleteRoom(roomId) {
        // 삭제 확인
        if (confirm('정말 이 채팅방을 삭제하시겠습니까?')) {
            this.deleteRoom(roomId);
        }
    }

    /**
     * 채팅방 삭제
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<boolean>} 삭제 성공 여부
     * @private
     */
    async deleteRoom(roomId) {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 삭제
            // 여기서는 데모를 위한 가상 구현
            console.log('Deleting room:', roomId);
            
            // 성공으로 가정
            
            // 채팅방 목록 새로고침
            this.loadRooms();
            
            return true;
        } catch (error) {
            console.error(`Error deleting room ${roomId}:`, error);
            return false;
        }
    }

    /**
     * 날짜 포맷
     * @param {string} dateString ISO 형식 날짜
     * @returns {string} 포맷된 날짜
     * @private
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}

// 싱글톤 인스턴스 생성
const adminRooms = new AdminRooms();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminRooms.initialize();
});
