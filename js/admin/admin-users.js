/**
 * 관리자 사용자 관리 모듈
 * 관리자 페이지의 사용자 관리 기능을 처리합니다.
 */

class AdminUsers {
    constructor() {
        this.usersTableBody = document.getElementById('users-table-body');
        this.userSearchInput = document.getElementById('user-search');
        this.userModal = document.getElementById('user-modal');
        this.userForm = document.getElementById('user-form');
        this.userModalTitle = document.getElementById('user-modal-title');
        this.userIdInput = document.getElementById('user-id');
        this.userNameInput = document.getElementById('user-name');
        this.userRoleInput = document.getElementById('user-role');
        this.saveUserBtn = document.getElementById('save-user-btn');
        this.closeModalBtns = document.querySelectorAll('.close-modal-btn, .cancel-modal-btn');
        
        this.users = [];
        this.filteredUsers = [];
    }

    /**
     * 사용자 관리 초기화
     */
    initialize() {
        // 이벤트 리스너 등록
        this.setupEventListeners();
        
        // 사용자 목록 로드
        this.loadUsers();
    }

    /**
     * 이벤트 리스너 등록
     * @private
     */
    setupEventListeners() {
        // 사용자 검색 이벤트
        this.userSearchInput.addEventListener('input', () => {
            this.filterUsers();
        });
        
        // 모달 닫기 버튼
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });
        
        // 사용자 폼 제출 이벤트
        this.userForm.addEventListener('submit', e => {
            e.preventDefault();
            this.handleUserFormSubmit();
        });
    }

    /**
     * 사용자 목록 로드
     * @private
     */
    async loadUsers() {
        try {
            // 모든 채팅방의 사용자 목록 가져오기
            const rooms = await dbService.getChatRooms();
            let allUsers = [];
            
            for (const room of rooms) {
                const roomUsers = await dbService.getRoomUsers(room.id);
                
                // 채팅방 정보 추가
                roomUsers.forEach(user => {
                    user.room_name = room.name;
                });
                
                allUsers = allUsers.concat(roomUsers);
            }
            
            this.users = allUsers;
            this.filteredUsers = [...allUsers];
            
            // 테이블 업데이트
            this.updateUsersTable();
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    /**
     * 사용자 필터링
     * @private
     */
    filterUsers() {
        const searchTerm = this.userSearchInput.value.toLowerCase();
        
        if (!searchTerm) {
            this.filteredUsers = [...this.users];
        } else {
            this.filteredUsers = this.users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.id.toLowerCase().includes(searchTerm) ||
                user.preferred_language.toLowerCase().includes(searchTerm) ||
                user.room_name.toLowerCase().includes(searchTerm)
            );
        }
        
        this.updateUsersTable();
    }

    /**
     * 사용자 테이블 업데이트
     * @private
     */
    updateUsersTable() {
        // 테이블 초기화
        this.usersTableBody.innerHTML = '';
        
        // 사용자 목록 표시
        this.filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.preferred_language}</td>
                <td>${this.formatTime(user.last_active)}</td>
                <td>${user.room_name}</td>
                <td>${user.role || 'user'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn edit-user-btn" data-user-id="${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn delete-user-btn" data-user-id="${user.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            this.usersTableBody.appendChild(row);
        });
        
        // 수정 버튼 이벤트 등록
        const editBtns = document.querySelectorAll('.edit-user-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-user-id');
                this.showEditUserModal(userId);
            });
        });
        
        // 삭제 버튼 이벤트 등록
        const deleteBtns = document.querySelectorAll('.delete-user-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-user-id');
                this.confirmDeleteUser(userId);
            });
        });
    }

    /**
     * 사용자 수정 모달 표시
     * @param {string} userId 사용자 ID
     * @private
     */
    showEditUserModal(userId) {
        // 모달 제목 설정
        this.userModalTitle.textContent = '사용자 정보 수정';
        
        // 사용자 정보 가져오기
        const user = this.users.find(u => u.id === userId);
        
        if (!user) {
            return;
        }
        
        // 폼 값 설정
        this.userIdInput.value = user.id;
        this.userNameInput.value = user.username;
        this.userRoleInput.value = user.role || 'user';
        
        // 모달 표시
        this.userModal.classList.add('active');
    }

    /**
     * 모달 숨기기
     * @private
     */
    hideModal() {
        this.userModal.classList.remove('active');
    }

    /**
     * 사용자 폼 제출 처리
     * @private
     */
    async handleUserFormSubmit() {
        try {
            const userId = this.userIdInput.value;
            
            // 사용자 데이터 준비
            const userData = {
                username: this.userNameInput.value,
                role: this.userRoleInput.value
            };
            
            // 사용자 정보 업데이트
            const result = await this.updateUser(userId, userData);
            
            if (result) {
                // 모달 숨기기
                this.hideModal();
                
                // 사용자 목록 새로고침
                this.loadUsers();
            }
        } catch (error) {
            console.error('Error submitting user form:', error);
            alert('사용자 정보 저장 중 오류가 발생했습니다.');
        }
    }

    /**
     * 사용자 정보 업데이트
     * @param {string} userId 사용자 ID
     * @param {Object} userData 사용자 데이터
     * @returns {Promise<boolean>} 업데이트 성공 여부
     * @private
     */
    async updateUser(userId, userData) {
        try {
            // 실제 애플리케이션에서는 데이터베이스에 저장
            // 여기서는 데모를 위한 가상 구현
            console.log('Updating user:', userId, userData);
            
            // 현재 사용자 객체 업데이트
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex >= 0) {
                this.users[userIndex] = {
                    ...this.users[userIndex],
                    ...userData
                };
            }
            
            // 성공으로 가정
            return true;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            return false;
        }
    }

    /**
     * 사용자 삭제 확인
     * @param {string} userId 사용자 ID
     * @private
     */
    confirmDeleteUser(userId) {
        // 삭제 확인
        if (confirm('정말 이 사용자를 강제 퇴장시키겠습니까?')) {
            this.deleteUser(userId);
        }
    }

    /**
     * 사용자 삭제 (강제 퇴장)
     * @param {string} userId 사용자 ID
     * @returns {Promise<boolean>} 삭제 성공 여부
     * @private
     */
    async deleteUser(userId) {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 삭제
            // 여기서는 데모를 위한 가상 구현
            console.log('Kicking user:', userId);
            
            // 현재 사용자 목록에서 제거
            this.users = this.users.filter(u => u.id !== userId);
            this.filteredUsers = this.filteredUsers.filter(u => u.id !== userId);
            
            // 테이블 업데이트
            this.updateUsersTable();
            
            return true;
        } catch (error) {
            console.error(`Error kicking user ${userId}:`, error);
            return false;
        }
    }

    /**
     * 시간 포맷
     * @param {string} timestamp ISO 형식 시간
     * @returns {string} 포맷된 시간
     * @private
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
}

// 싱글톤 인스턴스 생성
const adminUsers = new AdminUsers();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminUsers.initialize();
});
