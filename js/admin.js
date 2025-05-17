/**
 * admin.js
 * Global SeatCon 2025 컨퍼런스 채팅 관리자 페이지 로직
 */

// 전역 변수 및 상수
const ADMIN = {
    // 관리자 페이지 상태
    state: {
        initialized: false,
        isLoggedIn: false,
        adminId: null,
        currentTab: 'chatrooms',
        refreshInterval: null
    },
    
    // DOM 요소
    elements: {}
};

// 관리자 페이지 초기화
ADMIN.init = function() {
    if (ADMIN.state.initialized) return;
    
    try {
        console.log('관리자 페이지 초기화 시작...');
        
        // DOM 요소 참조 설정
        ADMIN.setupDOMReferences();
        
        // 이벤트 리스너 등록
        ADMIN.setupEventListeners();
        
        ADMIN.state.initialized = true;
        console.log('관리자 페이지 초기화 완료');
    } catch (error) {
        console.error('관리자 페이지 초기화 실패:', error);
        alert('관리자 페이지 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
    }
};

// DOM 요소 참조 설정
ADMIN.setupDOMReferences = function() {
    // 컨테이너
    ADMIN.elements.adminLoginContainer = document.getElementById('admin-login-container');
    ADMIN.elements.adminDashboard = document.getElementById('admin-dashboard');
    
    // 로그인 화면 요소
    ADMIN.elements.adminIdInput = document.getElementById('admin-id');
    ADMIN.elements.adminPasswordInput = document.getElementById('admin-password');
    ADMIN.elements.adminLoginButton = document.getElementById('admin-login-button');
    ADMIN.elements.adminLoginError = document.getElementById('admin-login-error');
    
    // 대시보드 요소
    ADMIN.elements.adminLogout = document.getElementById('admin-logout');
    ADMIN.elements.tabButtons = document.querySelectorAll('.tab-button');
    ADMIN.elements.tabContents = document.querySelectorAll('.tab-content');
    
    // 채팅방 관리 탭 요소
    ADMIN.elements.roomsList = document.getElementById('rooms-list');
    ADMIN.elements.createRoomButton = document.getElementById('create-room-button');
    
    // 사용자 관리 탭 요소
    ADMIN.elements.usersList = document.getElementById('users-list');
    ADMIN.elements.userSearch = document.getElementById('user-search');
    ADMIN.elements.userSearchButton = document.getElementById('user-search-button');
    
    // 통계 탭 요소
    ADMIN.elements.refreshStats = document.getElementById('refresh-stats');
    ADMIN.elements.totalUsers = document.getElementById('total-users');
    ADMIN.elements.activeUsers = document.getElementById('active-users');
    ADMIN.elements.totalRooms = document.getElementById('total-rooms');
    ADMIN.elements.activeRooms = document.getElementById('active-rooms');
    ADMIN.elements.totalMessages = document.getElementById('total-messages');
    ADMIN.elements.todayMessages = document.getElementById('today-messages');
    ADMIN.elements.dbStatus = document.getElementById('db-status');
    ADMIN.elements.translationStatus = document.getElementById('translation-status');
    
    // 모달 요소
    ADMIN.elements.roomModal = document.getElementById('room-modal');
    ADMIN.elements.roomModalTitle = document.getElementById('room-modal-title');
    ADMIN.elements.roomForm = document.getElementById('room-form');
    ADMIN.elements.roomId = document.getElementById('room-id');
    ADMIN.elements.roomNameInput = document.getElementById('room-name-input');
    ADMIN.elements.roomDescription = document.getElementById('room-description');
    ADMIN.elements.roomMaxUsers = document.getElementById('room-max-users');
    ADMIN.elements.roomSortOrder = document.getElementById('room-sort-order');
    ADMIN.elements.roomIsActive = document.getElementById('room-is-active');
    ADMIN.elements.roomIsPrivate = document.getElementById('room-is-private');
    ADMIN.elements.accessCodeContainer = document.getElementById('access-code-container');
    ADMIN.elements.roomAccessCode = document.getElementById('room-access-code');
    ADMIN.elements.saveRoom = document.getElementById('save-room');
    
    ADMIN.elements.userModal = document.getElementById('user-modal');
    ADMIN.elements.userForm = document.getElementById('user-form');
    ADMIN.elements.editUserId = document.getElementById('edit-user-id');
    ADMIN.elements.editUsername = document.getElementById('edit-username');
    ADMIN.elements.editUserRole = document.getElementById('edit-user-role');
    ADMIN.elements.saveUser = document.getElementById('save-user');
    
    ADMIN.elements.closeModalButtons = document.querySelectorAll('.close-modal');
};

// 이벤트 리스너 등록
ADMIN.setupEventListeners = function() {
    // 로그인 이벤트
    ADMIN.elements.adminLoginButton.addEventListener('click', ADMIN.handleLogin);
    ADMIN.elements.adminIdInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') ADMIN.elements.adminPasswordInput.focus();
    });
    ADMIN.elements.adminPasswordInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') ADMIN.handleLogin();
    });
    
    // 로그아웃 이벤트
    ADMIN.elements.adminLogout.addEventListener('click', ADMIN.handleLogout);
    
    // 탭 전환 이벤트
    ADMIN.elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            ADMIN.switchTab(tab);
        });
    });
    
    // 채팅방 관리 이벤트
    ADMIN.elements.createRoomButton.addEventListener('click', () => ADMIN.openRoomModal());
    ADMIN.elements.saveRoom.addEventListener('click', ADMIN.saveRoom);
    ADMIN.elements.roomIsPrivate.addEventListener('change', ADMIN.toggleAccessCodeField);
    
    // 사용자 관리 이벤트
    ADMIN.elements.userSearchButton.addEventListener('click', ADMIN.searchUsers);
    ADMIN.elements.userSearch.addEventListener('keypress', e => {
        if (e.key === 'Enter') ADMIN.searchUsers();
    });
    ADMIN.elements.saveUser.addEventListener('click', ADMIN.saveUser);
    
    // 통계 새로고침 이벤트
    ADMIN.elements.refreshStats.addEventListener('click', ADMIN.loadStatistics);
    
    // 모달 닫기 이벤트
    ADMIN.elements.closeModalButtons.forEach(button => {
        button.addEventListener('click', ADMIN.closeModals);
    });
    
    // 창 종료 시 자동 로그아웃
    window.addEventListener('beforeunload', ADMIN.handleBeforeUnload);
};

// 로그인 처리
ADMIN.handleLogin = async function() {
    try {
        // 입력값 가져오기
        const adminId = ADMIN.elements.adminIdInput.value;
        const password = ADMIN.elements.adminPasswordInput.value;
        
        // 입력값 검증
        if (!adminId || !password) {
            ADMIN.showLoginError('관리자 ID와 비밀번호를 모두 입력해주세요.');
            return;
        }
        
        console.log('로그인 시도:', adminId, password);
        
        // 관리자 인증
        if (adminId === 'kcmmer' && password === 'rnrud9881@@HH') {
            console.log('직접 로그인 성공');
            
            // 로그인 상태 저장
            ADMIN.state.isLoggedIn = true;
            ADMIN.state.adminId = adminId;
            
            // 로컬 스토리지에 세션 저장
            localStorage.setItem('admin_session', JSON.stringify({
                id: adminId,
                role: 'admin',
                timestamp: new Date().getTime()
            }));
            
            // 데이터 로드
            await ADMIN.loadInitialData();
            
            // 대시보드 화면으로 전환
            ADMIN.showDashboard();
            
            // 정기적인 데이터 새로고침 설정
            ADMIN.state.refreshInterval = setInterval(ADMIN.refreshData, 60000);
            
            return;
        }
        
        // 우회용 인증 시도
        const isAuthenticated = await userService.authenticateAdmin(adminId, password);
        
        if (isAuthenticated) {
            // 로그인 상태 저장
            ADMIN.state.isLoggedIn = true;
            ADMIN.state.adminId = adminId;
            
            // 데이터 로드
            await ADMIN.loadInitialData();
            
            // 대시보드 화면으로 전환
            ADMIN.showDashboard();
            
            // 정기적인 데이터 샀로고침 설정
            ADMIN.state.refreshInterval = setInterval(ADMIN.refreshData, 60000);
        } else {
            ADMIN.showLoginError('관리자 ID 또는 비밀번호가 올바르지 않습니다.');
        }
    } catch (error) {
        console.error('관리자 로그인 처리 실패:', error);
        ADMIN.showLoginError('로그인 처리 중 오류가 발생했습니다.');
    }
};

// 로그아웃 처리
ADMIN.handleLogout = function() {
    // 로그인 상태 초기화
    ADMIN.state.isLoggedIn = false;
    ADMIN.state.adminId = null;
    
    // 정기적인 데이터 새로고침 중지
    if (ADMIN.state.refreshInterval) {
        clearInterval(ADMIN.state.refreshInterval);
        ADMIN.state.refreshInterval = null;
    }
    
    // 입력 필드 초기화
    ADMIN.elements.adminIdInput.value = '';
    ADMIN.elements.adminPasswordInput.value = '';
    ADMIN.elements.adminLoginError.textContent = '';
    
    // 로그인 화면으로 전환
    ADMIN.showLoginScreen();
};

// 창 종료 시 처리
ADMIN.handleBeforeUnload = function(event) {
    if (ADMIN.state.isLoggedIn) {
        ADMIN.handleLogout();
    }
};

// 로그인 에러 표시
ADMIN.showLoginError = function(message) {
    ADMIN.elements.adminLoginError.textContent = message;
    
    // 3초 후 에러 메시지 초기화
    setTimeout(() => {
        ADMIN.elements.adminLoginError.textContent = '';
    }, 3000);
};

// 로그인 화면 표시
ADMIN.showLoginScreen = function() {
    ADMIN.elements.adminDashboard.classList.add('hidden');
    ADMIN.elements.adminLoginContainer.classList.remove('hidden');
};

// 대시보드 화면 표시
ADMIN.showDashboard = function() {
    ADMIN.elements.adminLoginContainer.classList.add('hidden');
    ADMIN.elements.adminDashboard.classList.remove('hidden');
};

// 초기 데이터 로드
ADMIN.loadInitialData = async function() {
    try {
        // 채팅방 목록 로드
        await ADMIN.loadChatRooms();
        
        // 사용자 목록 로드
        await ADMIN.loadUsers();
        
        // 통계 정보 로드
        await ADMIN.loadStatistics();
    } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
        alert('데이터 로드에 실패했습니다.');
    }
};

// 데이터 새로고침
ADMIN.refreshData = async function() {
    if (!ADMIN.state.isLoggedIn) return;
    
    try {
        // 현재 선택된 탭에 따라 데이터 새로고침
        switch (ADMIN.state.currentTab) {
            case 'chatrooms':
                await ADMIN.loadChatRooms();
                break;
            case 'users':
                await ADMIN.loadUsers();
                break;
            case 'stats':
                await ADMIN.loadStatistics();
                break;
        }
    } catch (error) {
        console.error('데이터 새로고침 실패:', error);
    }
};

// 탭 전환
ADMIN.switchTab = function(tab) {
    if (!tab) return;
    
    // 현재 탭 설정
    ADMIN.state.currentTab = tab;
    
    // 탭 버튼 활성화 상태 변경
    ADMIN.elements.tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tab) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // 탭 내용 표시/숨김 처리
    ADMIN.elements.tabContents.forEach(content => {
        if (content.id === `${tab}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // 탭 전환 시 데이터 새로고침
    ADMIN.refreshData();
};

// 채팅방 목록 로드
ADMIN.loadChatRooms = async function() {
    try {
        // 모든 채팅방 조회
        const rooms = await dbService.getChatRooms(false);
        
        // 채팅방 목록 HTML 생성
        let roomsHTML = '';
        
        rooms.forEach(room => {
            roomsHTML += `
                <tr data-id="${room.id}">
                    <td>${room.name}</td>
                    <td>${room.description || ''}</td>
                    <td>${new Date(room.created_at).toLocaleString()}</td>
                    <td>
                        <span class="active-status ${room.is_active ? 'active' : 'inactive'}">
                            ${room.is_active ? '활성' : '비활성'}
                        </span>
                    </td>
                    <td>${room.max_users}</td>
                    <td>${room.is_private ? `비공개 ${room.access_code ? '(코드)' : ''}` : '공개'}</td>
                    <td>${room.sort_order}</td>
                    <td class="table-actions">
                        <button class="edit-button" data-id="${room.id}">
                            ✎
                        </button>
                        <button class="toggle-button" data-id="${room.id}" data-active="${room.is_active}">
                            ${room.is_active ? '비활성화' : '활성화'}
                        </button>
                        <button class="delete-button" data-id="${room.id}">
                            ✕
                        </button>
                    </td>
                </tr>
            `;
        });
        
        // 채팅방 목록 업데이트
        ADMIN.elements.roomsList.innerHTML = roomsHTML || '<tr><td colspan="8">채팅방이 없습니다</td></tr>';
        
        // 채팅방 작업 버튼 이벤트 리스너 등록
        ADMIN.elements.roomsList.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', () => {
                const roomId = button.getAttribute('data-id');
                ADMIN.openRoomModal(roomId);
            });
        });
        
        ADMIN.elements.roomsList.querySelectorAll('.toggle-button').forEach(button => {
            button.addEventListener('click', () => {
                const roomId = button.getAttribute('data-id');
                const isActive = button.getAttribute('data-active') === 'true';
                ADMIN.toggleRoomStatus(roomId, !isActive);
            });
        });
        
        ADMIN.elements.roomsList.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', () => {
                const roomId = button.getAttribute('data-id');
                ADMIN.deleteRoom(roomId);
            });
        });
    } catch (error) {
        console.error('채팅방 목록 로드 실패:', error);
        alert('채팅방 목록을 불러오는데 실패했습니다.');
    }
};

// 사용자 목록 로드
ADMIN.loadUsers = async function(searchTerm = '') {
    try {
        // 사용자 검색 옵션 설정
        const options = {};
        
        if (searchTerm) {
            options.searchTerm = searchTerm;
        }
        
        // 사용자 목록 조회
        const users = await userService.getUsers(options);
        
        // 사용자 목록 HTML 생성
        let usersHTML = '';
        
        users.forEach(user => {
            const lastActivity = new Date(user.last_activity).toLocaleString();
            
            usersHTML += `
                <tr data-id="${user.id}">
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${translationService.getLanguageName(user.preferred_language)}</td>
                    <td>${user.room_id || '-'}</td>
                    <td>${lastActivity}</td>
                    <td>${user.role === 'admin' ? '관리자' : '일반 사용자'}</td>
                    <td class="table-actions">
                        <button class="edit-user-button" data-id="${user.id}">
                            권한 변경
                        </button>
                    </td>
                </tr>
            `;
        });
        
        // 사용자 목록 업데이트
        ADMIN.elements.usersList.innerHTML = usersHTML || '<tr><td colspan="7">사용자가 없습니다</td></tr>';
        
        // 사용자 편집 버튼 이벤트 리스너 등록
        ADMIN.elements.usersList.querySelectorAll('.edit-user-button').forEach(button => {
            button.addEventListener('click', () => {
                const userId = button.getAttribute('data-id');
                ADMIN.openUserModal(userId);
            });
        });
    } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        alert('사용자 목록을 불러오는데 실패했습니다.');
    }
};

// 사용자 검색
ADMIN.searchUsers = function() {
    const searchTerm = ADMIN.elements.userSearch.value.trim();
    ADMIN.loadUsers(searchTerm);
};

// 통계 정보 로드
ADMIN.loadStatistics = async function() {
    try {
        // 통계 정보 조회
        const stats = await dbService.getStatistics();
        
        // 통계 정보 업데이트
        ADMIN.elements.totalUsers.textContent = stats.users.total;
        ADMIN.elements.activeUsers.textContent = stats.users.active;
        ADMIN.elements.totalRooms.textContent = stats.rooms.total;
        ADMIN.elements.activeRooms.textContent = stats.rooms.active;
        ADMIN.elements.totalMessages.textContent = stats.messages.total;
        ADMIN.elements.todayMessages.textContent = stats.messages.today;
        
        // 시스템 상태 확인
        const dbStatus = await dbService.testConnection();
        ADMIN.elements.dbStatus.textContent = dbStatus ? '정상' : '오류';
        ADMIN.elements.dbStatus.className = 'stat-value ' + (dbStatus ? 'status-good' : 'status-bad');
        
        const translationStatus = await translationService.testConnection();
        ADMIN.elements.translationStatus.textContent = translationStatus ? '정상' : '오류';
        ADMIN.elements.translationStatus.className = 'stat-value ' + (translationStatus ? 'status-good' : 'status-bad');
    } catch (error) {
        console.error('통계 정보 로드 실패:', error);
        alert('통계 정보를 불러오는데 실패했습니다.');
    }
};

// 채팅방 모달 열기
ADMIN.openRoomModal = async function(roomId = null) {
    try {
        // 모달 타이틀 설정
        ADMIN.elements.roomModalTitle.textContent = roomId ? '채팅방 수정' : '새 채팅방 생성';
        
        // 폼 초기화
        ADMIN.elements.roomForm.reset();
        ADMIN.elements.accessCodeContainer.classList.add('hidden');
        
        if (roomId) {
            // 채팅방 정보 로드
            const room = await dbService.getChatRoomById(roomId);
            
            // 폼에 채팅방 정보 설정
            ADMIN.elements.roomId.value = room.id;
            ADMIN.elements.roomNameInput.value = room.name;
            ADMIN.elements.roomDescription.value = room.description || '';
            ADMIN.elements.roomMaxUsers.value = room.max_users;
            ADMIN.elements.roomSortOrder.value = room.sort_order;
            ADMIN.elements.roomIsActive.checked = room.is_active;
            ADMIN.elements.roomIsPrivate.checked = room.is_private;
            
            if (room.is_private) {
                ADMIN.elements.accessCodeContainer.classList.remove('hidden');
                ADMIN.elements.roomAccessCode.value = room.access_code || '';
            }
        } else {
            // 새 채팅방 기본값 설정
            ADMIN.elements.roomId.value = '';
            ADMIN.elements.roomMaxUsers.value = 100;
            ADMIN.elements.roomSortOrder.value = 0;
            ADMIN.elements.roomIsActive.checked = true;
            ADMIN.elements.roomIsPrivate.checked = false;
        }
        
        // 모달 표시
        ADMIN.elements.roomModal.classList.remove('hidden');
    } catch (error) {
        console.error('채팅방 모달 열기 실패:', error);
        alert('채팅방 정보를 불러오는데 실패했습니다.');
    }
};

// 접근 코드 필드 토글
ADMIN.toggleAccessCodeField = function() {
    if (ADMIN.elements.roomIsPrivate.checked) {
        ADMIN.elements.accessCodeContainer.classList.remove('hidden');
    } else {
        ADMIN.elements.accessCodeContainer.classList.add('hidden');
    }
};

// 채팅방 저장
ADMIN.saveRoom = async function() {
    // 입력값 검증
    const name = ADMIN.elements.roomNameInput.value.trim();
    if (!name) {
        alert('채팅방 이름을 입력해주세요.');
        return;
    }
    
    // 채팅방 데이터 준비
    const roomData = {
        name: name,
        description: ADMIN.elements.roomDescription.value.trim(),
        max_users: parseInt(ADMIN.elements.roomMaxUsers.value) || 100,
        sort_order: parseInt(ADMIN.elements.roomSortOrder.value) || 0,
        is_active: ADMIN.elements.roomIsActive.checked,
        is_private: ADMIN.elements.roomIsPrivate.checked,
        access_code: ADMIN.elements.roomIsPrivate.checked ? ADMIN.elements.roomAccessCode.value.trim() : null,
        created_by: ADMIN.state.adminId,
        updated_at: new Date().toISOString()
    };
    
    // 비공개 채팅방인 경우 접근 코드 검증
    if (roomData.is_private && !roomData.access_code) {
        alert('비공개 채팅방은 접근 코드를 설정해야 합니다.');
        return;
    }
    
    try {
        const roomId = ADMIN.elements.roomId.value;
        
        // 저장 버튼 비활성화 (중복 클릭 방지)
        ADMIN.elements.saveRoom.disabled = true;
        
        if (roomId) {
            // 기존 채팅방 수정
            await dbService.updateChatRoom(roomId, roomData);
            console.log('채팅방 수정 완료:', roomId);
        } else {
            // 새 채팅방 생성
            roomData.created_at = new Date().toISOString();
            await dbService.createChatRoom(roomData);
            console.log('채팅방 생성 완료');
        }
        
        // 채팅방 목록 새로고침
        await ADMIN.loadChatRooms();
        
        // 모달 닫기
        ADMIN.closeModals();
    } catch (error) {
        console.error('채팅방 저장 실패:', error);
        alert('채팅방 저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
        // 저장 버튼 다시 활성화
        ADMIN.elements.saveRoom.disabled = false;
    }
};

// 채팅방 상태 토글
ADMIN.toggleRoomStatus = async function(roomId, isActive) {
    if (!roomId) return;
    
    try {
        // 상태 변경 버튼 찾기 및 비활성화
        const toggleButton = document.querySelector(`.toggle-button[data-id="${roomId}"]`);
        if (toggleButton) {
            toggleButton.disabled = true;
        }
        
        // 채팅방 상태 업데이트
        await dbService.updateChatRoom(roomId, {
            is_active: isActive,
            updated_at: new Date().toISOString()
        });
        
        console.log(`채팅방 상태 변경 완료 (ID: ${roomId}, 활성: ${isActive})`);
        
        // 채팅방 목록 새로고침
        await ADMIN.loadChatRooms();
    } catch (error) {
        console.error('채팅방 상태 변경 실패:', error);
        alert('채팅방 상태 변경에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        
        // 상태 변경 버튼 다시 활성화
        const toggleButton = document.querySelector(`.toggle-button[data-id="${roomId}"]`);
        if (toggleButton) {
            toggleButton.disabled = false;
        }
    }
};

// 채팅방 삭제
ADMIN.deleteRoom = async function(roomId) {
    if (!roomId) return;
    
    // 삭제 확인
    if (!confirm('정말로 이 채팅방을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 채팅 내역이 삭제됩니다.')) {
        return;
    }
    
    try {
        // 삭제 버튼 찾기 및 비활성화
        const deleteButton = document.querySelector(`.delete-button[data-id="${roomId}"]`);
        if (deleteButton) {
            deleteButton.disabled = true;
            deleteButton.textContent = '삭제 중...';
        }
        
        // 채팅방 삭제
        await dbService.deleteChatRoom(roomId);
        
        console.log(`채팅방 삭제 완료 (ID: ${roomId})`);
        
        // 채팅방 목록 새로고침
        await ADMIN.loadChatRooms();
    } catch (error) {
        console.error('채팅방 삭제 실패:', error);
        alert('채팅방 삭제에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        
        // 삭제 버튼 다시 활성화
        const deleteButton = document.querySelector(`.delete-button[data-id="${roomId}"]`);
        if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.textContent = '✕';
        }
    }
};

// 사용자 모달 열기
ADMIN.openUserModal = async function(userId) {
    if (!userId) return;
    
    try {
        // 사용자 정보 로드
        const users = await userService.getUsers({ userId });
        
        if (users.length === 0) {
            alert('사용자를 찾을 수 없습니다.');
            return;
        }
        
        const user = users[0];
        
        // 폼에 사용자 정보 설정
        ADMIN.elements.editUserId.value = user.id;
        ADMIN.elements.editUsername.value = user.username;
        ADMIN.elements.editUserRole.value = user.role || 'user';
        
        // 모달 표시
        ADMIN.elements.userModal.classList.remove('hidden');
    } catch (error) {
        console.error('사용자 모달 열기 실패:', error);
        alert('사용자 정보를 불러오는데 실패했습니다.');
    }
};

// 사용자 저장
ADMIN.saveUser = async function() {
    const userId = ADMIN.elements.editUserId.value;
    const role = ADMIN.elements.editUserRole.value;
    
    if (!userId) {
        alert('사용자 ID가 유효하지 않습니다.');
        return;
    }
    
    try {
        // 사용자 권한 업데이트
        await userService.updateUserRole(userId, role);
        
        console.log(`사용자 권한 변경 완료 (ID: ${userId}, 권한: ${role})`);
        
        // 사용자 목록 새로고침
        await ADMIN.loadUsers();
        
        // 모달 닫기
        ADMIN.closeModals();
    } catch (error) {
        console.error('사용자 저장 실패:', error);
        alert('사용자 정보 저장에 실패했습니다.');
    }
};

// 모달 닫기
ADMIN.closeModals = function() {
    // 모든 모달 숨기기
    ADMIN.elements.roomModal.classList.add('hidden');
    ADMIN.elements.userModal.classList.add('hidden');
};

// 페이지 로드 시 관리자 페이지 초기화
document.addEventListener('DOMContentLoaded', ADMIN.init);
