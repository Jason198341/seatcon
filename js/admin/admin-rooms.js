/**
 * 관리자 채팅방 관리 모듈
 * 채팅방 목록, 추가, 수정, 삭제 등을 담당합니다.
 */

class AdminRooms {
    constructor() {
        this.rooms = [];
        this.editingRoomId = null;
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing admin rooms...');
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 채팅방 목록 로드
            await this.loadRooms();
            
            console.log('Admin rooms initialized');
            return true;
        } catch (error) {
            console.error('Error initializing admin rooms:', error);
            return false;
        }
    }

    /**
     * 이벤트 리스너 설정
     * @private
     */
    setupEventListeners() {
        // 채팅방 추가 버튼
        document.getElementById('add-room-btn').addEventListener('click', () => {
            this.showRoomModal();
        });
        
        // 채팅방 폼 제출
        document.getElementById('room-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRoom();
        });
        
        // 모달 닫기 버튼
        document.querySelectorAll('.close-modal-btn, .cancel-modal-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.hideRoomModal();
            });
        });
        
        // 채팅방 유형 변경 시 접근 코드 필드 표시/숨김
        document.getElementById('room-type').addEventListener('change', (e) => {
            this.toggleAccessCodeField(e.target.value);
        });
    }

    /**
     * 채팅방 목록 로드
     * @returns {Promise<boolean>} 로드 성공 여부
     * @private
     */
    async loadRooms() {
        try {
            // 모든 채팅방 가져오기
            this.rooms = await dbService.getChatRooms(false);
            
            // 테이블에 표시
            this.displayRooms();
            
            return true;
        } catch (error) {
            console.error('Error loading rooms:', error);
            adminCore.showMessage('채팅방 목록을 불러오는 중 오류가 발생했습니다.');
            return false;
        }
    }

    /**
     * 채팅방 테이블에 표시
     * @private
     */
    async displayRooms() {
        const tableBody = document.getElementById('rooms-table-body');
        tableBody.innerHTML = '';
        
        if (this.rooms.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">채팅방이 없습니다.</td>
                </tr>
            `;
            return;
        }
        
        // 채팅방 참가자 수 가져오기
        const roomStats = await Promise.all(this.rooms.map(async (room) => {
            const userCount = await this.getRoomUserCount(room.id);
            return { ...room, userCount };
        }));
        
        // 테이블에 표시
        roomStats.forEach(room => {
            const row = document.createElement('tr');
            
            // 생성일 포맷
            const createdDate = new Date(room.created_at);
            const formattedDate = createdDate.toLocaleDateString() + ' ' + 
                                 createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            row.innerHTML = `
                <td>${room.id}</td>
                <td>${room.name}</td>
                <td>${room.description || '-'}</td>
                <td>
                    <span class="status-badge ${room.status === 'active' ? 'active' : 'inactive'}">
                        ${room.status === 'active' ? '활성화' : '비활성화'}
                    </span>
                </td>
                <td>${room.type === 'public' ? '공개' : '비공개'}</td>
                <td>${formattedDate}</td>
                <td>${room.userCount} / ${room.max_users}</td>
                <td class="actions">
                    <button class="btn action-btn edit-room-btn" data-id="${room.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn action-btn delete-room-btn" data-id="${room.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // 수정 버튼 이벤트 리스너
        document.querySelectorAll('.edit-room-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const roomId = e.currentTarget.dataset.id;
                this.editRoom(roomId);
            });
        });
        
        // 삭제 버튼 이벤트 리스너
        document.querySelectorAll('.delete-room-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const roomId = e.currentTarget.dataset.id;
                this.deleteRoom(roomId);
            });
        });
    }

    /**
     * 채팅방의 참가자 수 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<number>} 참가자 수
     * @private
     */
    async getRoomUserCount(roomId) {
        try {
            const users = await dbService.getRoomUsers(roomId);
            return users.length;
        } catch (error) {
            console.error(`Error getting user count for room ${roomId}:`, error);
            return 0;
        }
    }

    /**
     * 채팅방 모달 표시
     * @param {Object|null} room 편집할 채팅방 (없으면 새 채팅방)
     * @private
     */
    showRoomModal(room = null) {
        const modal = document.getElementById('room-modal');
        const modalTitle = document.getElementById('room-modal-title');
        const form = document.getElementById('room-form');
        
        // 모달 제목 설정
        modalTitle.textContent = room ? '채팅방 수정' : '새 채팅방 추가';
        
        // 폼 초기화
        form.reset();
        
        // 편집 모드인 경우 폼에 데이터 채우기
        if (room) {
            this.editingRoomId = room.id;
            document.getElementById('room-id').value = room.id;
            document.getElementById('room-name').value = room.name;
            document.getElementById('room-description').value = room.description || '';
            document.getElementById('room-type').value = room.type;
            document.getElementById('room-access-code').value = room.access_code || '';
            document.getElementById('room-max-users').value = room.max_users;
            document.getElementById('room-status').value = room.status;
            
            // 접근 코드 필드 표시/숨김
            this.toggleAccessCodeField(room.type);
        } else {
            this.editingRoomId = null;
            document.getElementById('room-id').value = '';
            
            // 접근 코드 필드 숨김
            this.toggleAccessCodeField('public');
        }
        
        // 모달 표시
        modal.classList.add('active');
    }

    /**
     * 채팅방 모달 숨김
     * @private
     */
    hideRoomModal() {
        const modal = document.getElementById('room-modal');
        modal.classList.remove('active');
        this.editingRoomId = null;
    }

    /**
     * 접근 코드 필드 표시/숨김
     * @param {string} roomType 채팅방 유형 ('public', 'private')
     * @private
     */
    toggleAccessCodeField(roomType) {
        const accessCodeContainer = document.getElementById('access-code-container');
        
        if (roomType === 'private') {
            accessCodeContainer.classList.remove('hidden');
        } else {
            accessCodeContainer.classList.add('hidden');
        }
    }

    /**
     * 채팅방 수정
     * @param {string} roomId 채팅방 ID
     * @private
     */
    editRoom(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        
        if (room) {
            this.showRoomModal(room);
        } else {
            adminCore.showMessage('채팅방을 찾을 수 없습니다.');
        }
    }

    /**
     * 채팅방 삭제
     * @param {string} roomId 채팅방 ID
     * @private
     */
    async deleteRoom(roomId) {
        const confirmed = await adminCore.confirm('정말 이 채팅방을 삭제하시겠습니까?');
        
        if (!confirmed) {
            return;
        }
        
        try {
            const result = await roomManager.deleteRoom(roomId);
            
            if (result) {
                adminCore.showMessage('채팅방이 삭제되었습니다.', 'success');
                await this.loadRooms();
            } else {
                adminCore.showMessage('채팅방 삭제 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            adminCore.showMessage('채팅방 삭제 중 오류가 발생했습니다.');
        }
    }

    /**
     * 채팅방 저장
     * @private
     */
    async saveRoom() {
        // 폼 데이터 가져오기
        const roomId = document.getElementById('room-id').value;
        const name = document.getElementById('room-name').value.trim();
        const description = document.getElementById('room-description').value.trim();
        const type = document.getElementById('room-type').value;
        const accessCode = document.getElementById('room-access-code').value.trim();
        const maxUsers = parseInt(document.getElementById('room-max-users').value);
        const status = document.getElementById('room-status').value;
        
        // 유효성 검사
        if (!name) {
            adminCore.showMessage('채팅방 이름을 입력하세요.');
            return;
        }
        
        if (type === 'private' && !accessCode) {
            adminCore.showMessage('비공개 채팅방에는 접근 코드가 필요합니다.');
            return;
        }
        
        if (isNaN(maxUsers) || maxUsers < 1) {
            adminCore.showMessage('유효한 최대 사용자 수를 입력하세요.');
            return;
        }
        
        // 채팅방 데이터
        const roomData = {
            name,
            description,
            type,
            access_code: type === 'private' ? accessCode : null,
            max_users: maxUsers,
            status
        };
        
        try {
            let result;
            
            if (this.editingRoomId) {
                // 채팅방 업데이트
                result = await roomManager.updateRoom(this.editingRoomId, roomData);
                
                if (result) {
                    adminCore.showMessage('채팅방이 업데이트되었습니다.', 'success');
                    this.hideRoomModal();
                    await this.loadRooms();
                } else {
                    adminCore.showMessage('채팅방 업데이트 중 오류가 발생했습니다.');
                }
            } else {
                // 새 채팅방 생성
                result = await roomManager.createRoom(roomData);
                
                if (result.success) {
                    adminCore.showMessage('새 채팅방이 생성되었습니다.', 'success');
                    this.hideRoomModal();
                    await this.loadRooms();
                } else {
                    adminCore.showMessage('채팅방 생성 중 오류가 발생했습니다.');
                }
            }
        } catch (error) {
            console.error('Error saving room:', error);
            adminCore.showMessage('채팅방 저장 중 오류가 발생했습니다.');
        }
    }
}

// 싱글톤 인스턴스 생성
const adminRooms = new AdminRooms();
