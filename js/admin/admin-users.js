/**
 * 관리자 사용자 관리 모듈
 * 사용자 목록, 권한 관리, 차단 등을 담당합니다.
 */

class AdminUsers {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.editingUserId = null;
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing admin users...');
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 사용자 목록 로드
            await this.loadUsers();
            
            console.log('Admin users initialized');
            return true;
        } catch (error) {
            console.error('Error initializing admin users:', error);
            return false;
        }
    }

    /**
     * 이벤트 리스너 설정
     * @private
     */
    setupEventListeners() {
        // 사용자 검색
        document.getElementById('user-search').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });
        
        // 사용자 폼 제출
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });
        
        // 모달 닫기 버튼
        document.querySelectorAll('.close-modal-btn, .cancel-modal-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.hideUserModal();
            });
        });
    }

    /**
     * 사용자 목록 로드
     * @returns {Promise<boolean>} 로드 성공 여부
     * @private
     */
    async loadUsers() {
        try {
            // 모든 채팅방 가져오기
            const rooms = await dbService.getChatRooms(false);
            
            // 모든 채팅방의 사용자 가져오기
            const usersPromises = rooms.map(room => dbService.getRoomUsers(room.id));
            const usersLists = await Promise.all(usersPromises);
            
            // 사용자 목록 병합
            this.users = [];
            
            usersLists.forEach((usersList, index) => {
                // 방 정보 추가
                const roomInfo = rooms[index];
                
                usersList.forEach(user => {
                    user.roomName = roomInfo.name;
                    this.users.push(user);
                });
            });
            
            // 필터링된 사용자 목록 초기화
            this.filteredUsers = [...this.users];
            
            // 테이블에 표시
            this.displayUsers();
            
            return true;
        } catch (error) {
            console.error('Error loading users:', error);
            adminCore.showMessage('사용자 목록을 불러오는 중 오류가 발생했습니다.');
            return false;
        }
    }

    /**
     * 사용자 테이블에 표시
     * @private
     */
    displayUsers() {
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';
        
        if (this.filteredUsers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">사용자가 없습니다.</td>
                </tr>
            `;
            return;
        }
        
        // 테이블에 표시
        this.filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            
            // 최근 활동 시간 포맷
            const lastActive = new Date(user.last_active);
            const formattedLastActive = lastActive.toLocaleDateString() + ' ' + 
                                      lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // 선호 언어 한글명
            const languages = {
                'ko': '한국어',
                'en': '영어',
                'ja': '일본어',
                'zh': '중국어'
            };
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${languages[user.preferred_language] || user.preferred_language}</td>
                <td>${formattedLastActive}</td>
                <td>${user.roomName}</td>
                <td>${user.role || '일반 사용자'}</td>
                <td class="actions">
                    <button class="btn action-btn edit-user-btn" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn action-btn ban-user-btn" data-id="${user.id}">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // 수정 버튼 이벤트 리스너
        document.querySelectorAll('.edit-user-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                this.editUser(userId);
            });
        });
        
        // 차단 버튼 이벤트 리스너
        document.querySelectorAll('.ban-user-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.id;
                this.banUser(userId);
            });
        });
    }

    /**
     * 사용자 필터링
     * @param {string} searchText 검색어
     * @private
     */
    filterUsers(searchText) {
        if (!searchText) {
            this.filteredUsers = [...this.users];
        } else {
            const lowerSearchText = searchText.toLowerCase();
            
            this.filteredUsers = this.users.filter(user => {
                return user.username.toLowerCase().includes(lowerSearchText) ||
                       user.id.toLowerCase().includes(lowerSearchText) ||
                       user.roomName.toLowerCase().includes(lowerSearchText);
            });
        }
        
        this.displayUsers();
    }

    /**
     * 사용자 모달 표시
     * @param {Object|null} user 편집할 사용자 (없으면 새 사용자)
     * @private
     */
    showUserModal(user = null) {
        const modal = document.getElementById('user-modal');
        const modalTitle = document.getElementById('user-modal-title');
        const form = document.getElementById('user-form');
        
        // 모달 제목 설정
        modalTitle.textContent = user ? '사용자 정보 수정' : '새 사용자 추가';
        
        // 폼 초기화
        form.reset();
        
        // 편집 모드인 경우 폼에 데이터 채우기
        if (user) {
            this.editingUserId = user.id;
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-name').value = user.username;
            document.getElementById('user-role').value = user.role || 'user';
        } else {
            this.editingUserId = null;
            document.getElementById('user-id').value = '';
        }
        
        // 모달 표시
        modal.classList.add('active');
    }

    /**
     * 사용자 모달 숨김
     * @private
     */
    hideUserModal() {
        const modal = document.getElementById('user-modal');
        modal.classList.remove('active');
        this.editingUserId = null;
    }

    /**
     * 사용자 수정
     * @param {string} userId 사용자 ID
     * @private
     */
    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        
        if (user) {
            this.showUserModal(user);
        } else {
            adminCore.showMessage('사용자를 찾을 수 없습니다.');
        }
    }

    /**
     * 사용자 차단
     * @param {string} userId 사용자 ID
     * @private
     */
    async banUser(userId) {
        const user = this.users.find(u => u.id === userId);
        
        if (!user) {
            adminCore.showMessage('사용자를 찾을 수 없습니다.');
            return;
        }
        
        const confirmed = await adminCore.confirm(`"${user.username}" 사용자를 차단하시겠습니까?`);
        
        if (!confirmed) {
            return;
        }
        
        try {
            // TODO: 실제 사용자 차단 API 호출
            // 현재 데모에서는 사용자 삭제
            const result = await dbService.removeUser(userId);
            
            if (result) {
                adminCore.showMessage(`"${user.username}" 사용자가 차단되었습니다.`, 'success');
                await this.loadUsers();
            } else {
                adminCore.showMessage('사용자 차단 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Error banning user:', error);
            adminCore.showMessage('사용자 차단 중 오류가 발생했습니다.');
        }
    }

    /**
     * 사용자 저장
     * @private
     */
    async saveUser() {
        // 폼 데이터 가져오기
        const username = document.getElementById('user-name').value.trim();
        const role = document.getElementById('user-role').value;
        
        // 유효성 검사
        if (!username) {
            adminCore.showMessage('사용자 이름을 입력하세요.');
            return;
        }
        
        // 사용자가 존재하는지 확인
        if (!this.editingUserId) {
            adminCore.showMessage('새 사용자를 추가할 수 없습니다.');
            return;
        }
        
        // 현재 사용자 정보 가져오기
        const user = this.users.find(u => u.id === this.editingUserId);
        
        if (!user) {
            adminCore.showMessage('사용자를 찾을 수 없습니다.');
            return;
        }
        
        try {
            // 사용자 업데이트
            const result = await dbService.updateUser(this.editingUserId, {
                username: username,
                role: role
            });
            
            if (result) {
                adminCore.showMessage('사용자 정보가 업데이트되었습니다.', 'success');
                this.hideUserModal();
                await this.loadUsers();
            } else {
                adminCore.showMessage('사용자 정보 업데이트 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            adminCore.showMessage('사용자 정보 저장 중 오류가 발생했습니다.');
        }
    }

    /**
     * 사용자 통계 가져오기
     * @returns {Promise<Object>} 사용자 통계
     */
    async getUserStats() {
        try {
            // 언어별 사용자 수
            const languageStats = {
                ko: 0,
                en: 0,
                ja: 0,
                zh: 0
            };
            
            this.users.forEach(user => {
                if (languageStats.hasOwnProperty(user.preferred_language)) {
                    languageStats[user.preferred_language]++;
                }
            });
            
            // 활성 사용자 수
            const now = new Date();
            const activeUsers = this.users.filter(user => {
                const lastActive = new Date(user.last_active);
                const diffMinutes = (now - lastActive) / (1000 * 60);
                return diffMinutes < 15; // 15분 이내 활동
            }).length;
            
            return {
                total: this.users.length,
                active: activeUsers,
                languageStats
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {
                total: 0,
                active: 0,
                languageStats: { ko: 0, en: 0, ja: 0, zh: 0 }
            };
        }
    }
}

// 싱글톤 인스턴스 생성
const adminUsers = new AdminUsers();
