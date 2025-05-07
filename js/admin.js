/**
 * 관리자 페이지 관련 모듈
 * 
 * 채팅방 및 카테고리 관리, 통계 기능 등을 제공합니다.
 * 관리자 인증 및 권한 관리 기능도 포함합니다.
 */

import CONFIG from './config.js';
import supabaseClient from './supabase-client.js';

class AdminManager {
    constructor() {
        // DOM 요소 참조
        this.adminLoginContainer = null;
        this.adminDashboard = null;
        this.adminLoginForm = null;
        this.adminPassword = null;
        this.adminLoginButton = null;
        this.adminLogoutButton = null;
        
        // 탭 관련 요소
        this.roomsTab = null;
        this.categoriesTab = null;
        this.statisticsTab = null;
        this.roomsTabButton = null;
        this.categoriesTabButton = null;
        this.statisticsTabButton = null;
        
        // 데이터 테이블
        this.roomsTable = null;
        this.categoriesTable = null;
        
        // 모달 요소
        this.roomModal = null;
        this.categoryModal = null;
        this.confirmDeleteModal = null;
        
        // 상태 변수
        this.isLoggedIn = false;
        this.isLoading = false;
        this.currentTab = 'rooms';
        this.rooms = [];
        this.categories = [];
        this.statistics = {
            totalMessages: 0,
            activeUsers: 0,
            activeRooms: 0,
            translatedMessages: 0
        };
        
        // 관리자 비밀번호
        this.correctPassword = 'rnrud9881';
        
        // 삭제 콜백
        this.deleteCallback = null;
        this.deleteTarget = null;
    }

    /**
     * 관리자 매니저 초기화
     */
    init() {
        // DOM 요소 참조 설정
        this.setupDOMReferences();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 로컬 스토리지에서 로그인 상태 확인
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        
        if (isLoggedIn) {
            this.isLoggedIn = true;
            this.showDashboard();
            this.loadData();
        } else {
            this.showLoginForm();
        }
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('AdminManager initialized', {
                isLoggedIn: this.isLoggedIn
            });
        }
    }

    /**
     * DOM 요소 참조 설정
     */
    setupDOMReferences() {
        // 로그인 관련
        this.adminLoginContainer = document.getElementById('adminLoginContainer');
        this.adminDashboard = document.getElementById('adminDashboard');
        this.adminLoginForm = document.getElementById('adminLoginForm');
        this.adminPassword = document.getElementById('adminPassword');
        this.adminLoginButton = document.getElementById('adminLoginButton');
        this.adminLogoutButton = document.getElementById('adminLogoutButton');
        
        // 탭 관련
        this.roomsTab = document.getElementById('roomsTab');
        this.categoriesTab = document.getElementById('categoriesTab');
        this.statisticsTab = document.getElementById('statisticsTab');
        this.roomsTabButton = document.getElementById('roomsTabButton');
        this.categoriesTabButton = document.getElementById('categoriesTabButton');
        this.statisticsTabButton = document.getElementById('statisticsTabButton');
        
        // 데이터 테이블
        this.roomsTable = document.getElementById('roomsTable');
        this.categoriesTable = document.getElementById('categoriesTable');
        
        // 모달 요소
        this.roomModal = document.getElementById('roomModal');
        this.categoryModal = document.getElementById('categoryModal');
        this.confirmDeleteModal = document.getElementById('confirmDeleteModal');
        
        // 생성 버튼
        this.createRoomButton = document.getElementById('createRoomButton');
        this.createCategoryButton = document.getElementById('createCategoryButton');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 로그인 폼 제출
        if (this.adminLoginForm) {
            this.adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // 로그아웃 버튼
        if (this.adminLogoutButton) {
            this.adminLogoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // 탭 전환 버튼
        if (this.roomsTabButton) {
            this.roomsTabButton.addEventListener('click', () => {
                this.switchTab('rooms');
            });
        }
        
        if (this.categoriesTabButton) {
            this.categoriesTabButton.addEventListener('click', () => {
                this.switchTab('categories');
            });
        }
        
        if (this.statisticsTabButton) {
            this.statisticsTabButton.addEventListener('click', () => {
                this.switchTab('statistics');
            });
        }
        
        // 생성 버튼
        if (this.createRoomButton) {
            this.createRoomButton.addEventListener('click', () => {
                this.showRoomModal();
            });
        }
        
        if (this.createCategoryButton) {
            this.createCategoryButton.addEventListener('click', () => {
                this.showCategoryModal();
            });
        }
        
        // 모달 관련
        const closeRoomModalBtn = document.getElementById('closeRoomModal');
        const cancelRoomBtn = document.getElementById('cancelRoomButton');
        const saveRoomBtn = document.getElementById('saveRoomButton');
        
        if (closeRoomModalBtn) {
            closeRoomModalBtn.addEventListener('click', () => {
                this.hideRoomModal();
            });
        }
        
        if (cancelRoomBtn) {
            cancelRoomBtn.addEventListener('click', () => {
                this.hideRoomModal();
            });
        }
        
        if (saveRoomBtn) {
            saveRoomBtn.addEventListener('click', () => {
                this.saveRoom();
            });
        }
        
        const closeCategoryModalBtn = document.getElementById('closeCategoryModal');
        const cancelCategoryBtn = document.getElementById('cancelCategoryButton');
        const saveCategoryBtn = document.getElementById('saveCategoryButton');
        
        if (closeCategoryModalBtn) {
            closeCategoryModalBtn.addEventListener('click', () => {
                this.hideCategoryModal();
            });
        }
        
        if (cancelCategoryBtn) {
            cancelCategoryBtn.addEventListener('click', () => {
                this.hideCategoryModal();
            });
        }
        
        if (saveCategoryBtn) {
            saveCategoryBtn.addEventListener('click', () => {
                this.saveCategory();
            });
        }
        
        // 삭제 확인 모달
        const closeConfirmDeleteModal = document.getElementById('closeConfirmDeleteModal');
        const cancelDeleteButton = document.getElementById('cancelDeleteButton');
        const confirmDeleteButton = document.getElementById('confirmDeleteButton');
        
        if (closeConfirmDeleteModal) {
            closeConfirmDeleteModal.addEventListener('click', () => {
                this.hideDeleteConfirmModal();
            });
        }
        
        if (cancelDeleteButton) {
            cancelDeleteButton.addEventListener('click', () => {
                this.hideDeleteConfirmModal();
            });
        }
        
        if (confirmDeleteButton) {
            confirmDeleteButton.addEventListener('click', () => {
                this.confirmDelete();
            });
        }
        
        // 아이콘 미리보기
        const roomIcon = document.getElementById('roomIcon');
        if (roomIcon) {
            roomIcon.addEventListener('input', (e) => {
                this.updateIconPreview(e.target.value, 'iconPreview');
            });
        }
        
        const categoryIcon = document.getElementById('categoryIcon');
        if (categoryIcon) {
            categoryIcon.addEventListener('input', (e) => {
                this.updateIconPreview(e.target.value, 'categoryIconPreview');
            });
        }
        
        // 필터링 요소
        const roomSearchInput = document.getElementById('roomSearchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const activeRoomsOnly = document.getElementById('activeRoomsOnly');
        
        if (roomSearchInput) {
            roomSearchInput.addEventListener('input', () => {
                this.filterRooms();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filterRooms();
            });
        }
        
        if (activeRoomsOnly) {
            activeRoomsOnly.addEventListener('change', () => {
                this.filterRooms();
            });
        }
    }

    /**
     * 로그인 처리
     */
    handleLogin() {
        const password = this.adminPassword.value.trim();
        
        if (!password) {
            this.showError('비밀번호를 입력해주세요.');
            return;
        }
        
        if (password === this.correctPassword) {
            this.isLoggedIn = true;
            localStorage.setItem('adminLoggedIn', 'true');
            
            // 로그인 성공 메시지
            this.showSuccess('관리자 로그인에 성공했습니다.');
            
            // 대시보드 표시
            this.showDashboard();
            
            // 데이터 로드
            this.loadData();
            
            // 로그아웃 버튼 표시
            if (this.adminLogoutButton) {
                this.adminLogoutButton.style.display = 'inline-block';
            }
        } else {
            this.showError('비밀번호가 올바르지 않습니다.');
            
            // 비밀번호 필드 초기화 및 포커스
            this.adminPassword.value = '';
            this.adminPassword.focus();
        }
    }

    /**
     * 로그아웃 처리
     */
    handleLogout() {
        const confirmLogout = confirm('정말 로그아웃하시겠습니까?');
        
        if (confirmLogout) {
            this.isLoggedIn = false;
            localStorage.removeItem('adminLoggedIn');
            
            // 로그인 폼 표시
            this.showLoginForm();
            
            // 로그아웃 버튼 숨김
            if (this.adminLogoutButton) {
                this.adminLogoutButton.style.display = 'none';
            }
            
            // 로그아웃 성공 메시지
            this.showSuccess('로그아웃되었습니다.');
        }
    }

    /**
     * 데이터 로드
     */
    async loadData() {
        if (!this.isLoggedIn) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            // 카테고리 데이터 로드
            await this.loadCategories();
            
            // 채팅방 데이터 로드
            await this.loadRooms();
            
            // 통계 데이터 로드
            await this.loadStatistics();
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Admin data loaded successfully');
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 채팅방 데이터 로드
     */
    async loadRooms() {
        try {
            // 로딩 상태 표시
            this.showRoomsLoading(true);
            
            // Supabase에서 채팅방 목록 로드
            const { data, error } = await supabaseClient.supabase
                .from('chat_rooms')
                .select(`
                    *,
                    room_categories(id, name, color, icon)
                `)
                .order('created_at', { ascending: false });
                
            if (error) {
                throw error;
            }
            
            this.rooms = data || [];
            
            // 채팅방 목록 표시
            this.renderRooms();
            
            // 카테고리 필터 업데이트
            this.updateCategoryFilter();
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log(`${this.rooms.length} rooms loaded`);
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
            this.showError('채팅방 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            // 로딩 상태 해제
            this.showRoomsLoading(false);
        }
    }

    /**
     * 카테고리 데이터 로드
     */
    async loadCategories() {
        try {
            // 로딩 상태 표시
            this.showCategoriesLoading(true);
            
            // Supabase에서 카테고리 목록 로드
            const { data, error } = await supabaseClient.supabase
                .from('room_categories')
                .select('*')
                .order('name', { ascending: true });
                
            if (error) {
                throw error;
            }
            
            this.categories = data || [];
            
            // 카테고리 목록 표시
            this.renderCategories();
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log(`${this.categories.length} categories loaded`);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('카테고리 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            // 로딩 상태 해제
            this.showCategoriesLoading(false);
        }
    }

    /**
     * 통계 데이터 로드
     */
    async loadStatistics() {
        try {
            // 통계 로딩 시작
            this.showStatisticsLoading(true);
            
            // 메시지 통계
            const { count: totalMessages, error: messagesError } = await supabaseClient.supabase
                .from('comments')
                .select('*', { count: 'exact', head: true });
                
            if (messagesError) {
                throw messagesError;
            }
            
            // 활성 사용자 통계 (최근 24시간)
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            
            const { data: recentUsers, error: usersError } = await supabaseClient.supabase
                .from('comments')
                .select('author_email')
                .gt('created_at', oneDayAgo.toISOString())
                .limit(1000);
                
            if (usersError) {
                throw usersError;
            }
            
            // 유니크 사용자 계산
            const uniqueUsers = new Set();
            recentUsers.forEach(message => {
                uniqueUsers.add(message.author_email);
            });
            
            // 활성 채팅방 통계
            const { data: activeRooms, error: roomsError } = await supabaseClient.supabase
                .from('chat_rooms')
                .select('*')
                .eq('is_active', true);
                
            if (roomsError) {
                throw roomsError;
            }
            
            // 번역된 메시지 통계
            const { data: translatedMessages, error: translationError } = await supabaseClient.supabase
                .from('comments')
                .select('id')
                .not('language', 'eq', supabaseClient.getPreferredLanguage())
                .limit(1); // 실제 프로덕션에서는 정확한 통계를 위해 수정 필요
                
            if (translationError) {
                throw translationError;
            }
            
            // 통계 데이터 업데이트
            this.statistics = {
                totalMessages: totalMessages || 0,
                activeUsers: uniqueUsers.size || 0,
                activeRooms: activeRooms.length || 0,
                translatedMessages: translatedMessages.length * 10 || 0 // 샘플 통계
            };
            
            // 통계 표시
            this.renderStatistics();
            
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.showError('통계 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            // 통계 로딩 종료
            this.showStatisticsLoading(false);
        }
    }

    /**
     * 채팅방 목록 렌더링
     */
    renderRooms() {
        if (!this.roomsTable) {
            return;
        }
        
        const tbody = this.roomsTable.querySelector('tbody');
        if (!tbody) {
            return;
        }
        
        // 테이블 초기화
        tbody.innerHTML = '';
        
        // 빈 상태 표시
        const emptyState = document.getElementById('roomsEmptyState');
        
        if (this.rooms.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }
        
        // 채팅방 목록 렌더링
        this.rooms.forEach(room => {
            const tr = document.createElement('tr');
            
            // 카테고리 정보
            const categoryName = room.room_categories ? room.room_categories.name : '없음';
            const categoryColor = room.room_categories ? room.room_categories.color : '#aaa';
            
            tr.innerHTML = `
                <td>
                    <div class="room-name">
                        <i class="fas fa-${this.escapeHtml(room.icon || 'comments')}" style="margin-right: 8px; color: ${categoryColor};"></i>
                        <span>${this.escapeHtml(room.name)}</span>
                    </div>
                </td>
                <td>
                    <span class="category-tag" style="background-color: ${categoryColor};">
                        ${this.escapeHtml(categoryName)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${room.is_active ? 'active' : 'inactive'}">
                        ${room.is_active ? '활성화' : '비활성화'}
                    </span>
                </td>
                <td>${this.formatDate(room.created_at)}</td>
                <td class="actions">
                    <button class="action-button edit-button" data-id="${room.id}" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button delete-button" data-id="${room.id}" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // 이벤트 리스너 추가
            const editButton = tr.querySelector('.edit-button');
            const deleteButton = tr.querySelector('.delete-button');
            
            if (editButton) {
                editButton.addEventListener('click', () => {
                    this.editRoom(room.id);
                });
            }
            
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    this.confirmDeleteRoom(room.id, room.name);
                });
            }
            
            tbody.appendChild(tr);
        });
    }

    /**
     * 카테고리 목록 렌더링
     */
    renderCategories() {
        if (!this.categoriesTable) {
            return;
        }
        
        const tbody = this.categoriesTable.querySelector('tbody');
        if (!tbody) {
            return;
        }
        
        // 테이블 초기화
        tbody.innerHTML = '';
        
        // 빈 상태 표시
        const emptyState = document.getElementById('categoriesEmptyState');
        
        if (this.categories.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }
        
        // 카테고리 목록 렌더링
        this.categories.forEach(category => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>
                    <div class="category-name">
                        <i class="fas fa-${this.escapeHtml(category.icon || 'folder')}" style="margin-right: 8px; color: ${category.color};"></i>
                        <span>${this.escapeHtml(category.name)}</span>
                    </div>
                </td>
                <td>${this.escapeHtml(category.description || '설명 없음')}</td>
                <td>
                    <i class="fas fa-${this.escapeHtml(category.icon || 'folder')}" style="color: ${category.color};"></i>
                </td>
                <td>
                    <div class="color-preview" style="background-color: ${category.color};"></div>
                    <span>${category.color}</span>
                </td>
                <td class="actions">
                    <button class="action-button edit-button" data-id="${category.id}" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button delete-button" data-id="${category.id}" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // 이벤트 리스너 추가
            const editButton = tr.querySelector('.edit-button');
            const deleteButton = tr.querySelector('.delete-button');
            
            if (editButton) {
                editButton.addEventListener('click', () => {
                    this.editCategory(category.id);
                });
            }
            
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    this.confirmDeleteCategory(category.id, category.name);
                });
            }
            
            tbody.appendChild(tr);
        });
    }

    /**
     * 통계 렌더링
     */
    renderStatistics() {
        // 통계 카드 업데이트
        document.getElementById('totalMessagesCount').textContent = this.statistics.totalMessages.toLocaleString();
        document.getElementById('activeUsersCount').textContent = this.statistics.activeUsers.toLocaleString();
        document.getElementById('activeRoomsCount').textContent = this.statistics.activeRooms.toLocaleString();
        document.getElementById('translatedMessagesCount').textContent = this.statistics.translatedMessages.toLocaleString();
        
        // 차트 컨테이너 (추가 구현 필요)
        const activityChart = document.getElementById('activityChart');
        const languageChart = document.getElementById('languageChart');
        
        if (activityChart) {
            activityChart.innerHTML = '<div class="chart-placeholder-text">데이터 차트 준비 중...</div>';
        }
        
        if (languageChart) {
            languageChart.innerHTML = '<div class="chart-placeholder-text">언어별 분포 차트 준비 중...</div>';
        }
    }

    /**
     * 카테고리 필터 업데이트
     */
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) {
            return;
        }
        
        // 옵션 초기화
        categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
        
        // 카테고리 옵션 추가
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    /**
     * 채팅방 생성 모달 표시
     */
    showRoomModal(roomId = null) {
        if (!this.roomModal) {
            return;
        }
        
        // 모달 초기화
        const roomForm = document.getElementById('roomForm');
        if (roomForm) {
            roomForm.reset();
        }
        
        // 카테고리 옵션 로드
        this.loadRoomCategoryOptions();
        
        // 편집 모드인 경우 룸 데이터 로드
        if (roomId) {
            const room = this.rooms.find(r => r.id === roomId);
            if (room) {
                // 폼 필드에 데이터 설정
                document.getElementById('roomId').value = room.id;
                document.getElementById('roomName').value = room.name;
                document.getElementById('roomDescription').value = room.description || '';
                document.getElementById('roomCategory').value = room.category_id || '';
                document.getElementById('roomIcon').value = room.icon || 'comments';
                document.getElementById('roomIsActive').checked = room.is_active;
                document.getElementById('roomIsPublic').checked = room.is_public;
                
                // 아이콘 미리보기 업데이트
                this.updateIconPreview(room.icon || 'comments', 'iconPreview');
                
                // 모달 제목 변경
                document.getElementById('roomModalTitle').textContent = '채팅방 수정';
            }
        } else {
            // 생성 모드 - 기본값 설정
            document.getElementById('roomId').value = '';
            document.getElementById('roomModalTitle').textContent = '새 채팅방 생성';
            document.getElementById('roomIcon').value = 'comments';
            document.getElementById('roomIsActive').checked = true;
            document.getElementById('roomIsPublic').checked = true;
            
            // 아이콘 미리보기 업데이트
            this.updateIconPreview('comments', 'iconPreview');
        }
        
        // 모달 표시
        this.roomModal.style.display = 'block';
        
        // 입력 필드에 포커스
        document.getElementById('roomName').focus();
    }

    /**
     * 채팅방 모달 숨기기
     */
    hideRoomModal() {
        if (this.roomModal) {
            this.roomModal.style.display = 'none';
        }
    }

    /**
     * 카테고리 생성 모달 표시
     */
    showCategoryModal(categoryId = null) {
        if (!this.categoryModal) {
            return;
        }
        
        // 모달 초기화
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.reset();
        }
        
        // 편집 모드인 경우 카테고리 데이터 로드
        if (categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            if (category) {
                // 폼 필드에 데이터 설정
                document.getElementById('categoryId').value = category.id;
                document.getElementById('categoryName').value = category.name;
                document.getElementById('categoryDescription').value = category.description || '';
                document.getElementById('categoryIcon').value = category.icon || 'folder';
                document.getElementById('categoryColor').value = category.color || '#3498db';
                
                // 아이콘 미리보기 업데이트
                this.updateIconPreview(category.icon || 'folder', 'categoryIconPreview');
                
                // 모달 제목 변경
                document.getElementById('categoryModalTitle').textContent = '카테고리 수정';
            }
        } else {
            // 생성 모드 - 기본값 설정
            document.getElementById('categoryId').value = '';
            document.getElementById('categoryModalTitle').textContent = '새 카테고리 생성';
            document.getElementById('categoryIcon').value = 'folder';
            document.getElementById('categoryColor').value = '#3498db';
            
            // 아이콘 미리보기 업데이트
            this.updateIconPreview('folder', 'categoryIconPreview');
        }
        
        // 모달 표시
        this.categoryModal.style.display = 'block';
        
        // 입력 필드에 포커스
        document.getElementById('categoryName').focus();
    }

    /**
     * 카테고리 모달 숨기기
     */
    hideCategoryModal() {
        if (this.categoryModal) {
            this.categoryModal.style.display = 'none';
        }
    }

    /**
     * 채팅방 카테고리 옵션 로드
     */
    loadRoomCategoryOptions() {
        const categorySelect = document.getElementById('roomCategory');
        if (!categorySelect) {
            return;
        }
        
        // 옵션 초기화
        categorySelect.innerHTML = '<option value="" disabled selected>카테고리 선택</option>';
        
        // 카테고리 옵션 추가
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    /**
     * 아이콘 미리보기 업데이트
     */
    updateIconPreview(iconName, previewId) {
        const previewElement = document.getElementById(previewId);
        if (!previewElement) {
            return;
        }
        
        // 아이콘 클래스 업데이트
        previewElement.className = '';
        previewElement.classList.add('fas', `fa-${iconName || 'question'}`);
    }

    /**
     * 채팅방 저장
     */
    async saveRoom() {
        const roomId = document.getElementById('roomId').value;
        const name = document.getElementById('roomName').value.trim();
        const description = document.getElementById('roomDescription').value.trim();
        const categoryId = document.getElementById('roomCategory').value;
        const icon = document.getElementById('roomIcon').value.trim() || 'comments';
        const isActive = document.getElementById('roomIsActive').checked;
        const isPublic = document.getElementById('roomIsPublic').checked;
        
        // 유효성 검사
        if (!name) {
            this.showError('채팅방 이름을 입력해주세요.');
            return;
        }
        
        // 로딩 상태 표시
        this.setLoading(true);
        
        try {
            let result;
            
            if (roomId) {
                // 기존 채팅방 업데이트
                const { data, error } = await supabaseClient.supabase
                    .from('chat_rooms')
                    .update({
                        name,
                        description,
                        category_id: categoryId || null,
                        icon,
                        is_active: isActive,
                        is_public: isPublic,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', roomId)
                    .select(`
                        *,
                        room_categories(id, name, color, icon)
                    `);
                    
                if (error) {
                    throw error;
                }
                
                result = data;
                this.showSuccess('채팅방이 업데이트되었습니다.');
                
            } else {
                // 새 채팅방 생성
                const { data, error } = await supabaseClient.supabase
                    .from('chat_rooms')
                    .insert({
                        name,
                        description,
                        category_id: categoryId || null,
                        icon,
                        is_active: isActive,
                        is_public: isPublic
                    })
                    .select(`
                        *,
                        room_categories(id, name, color, icon)
                    `);
                    
                if (error) {
                    throw error;
                }
                
                result = data;
                this.showSuccess('새 채팅방이 생성되었습니다.');
            }
            
            // 채팅방 목록 업데이트
            if (result && result.length > 0) {
                await this.loadRooms();
            }
            
            // 모달 닫기
            this.hideRoomModal();
            
        } catch (error) {
            console.error('Error saving room:', error);
            this.showError('채팅방 저장 중 오류가 발생했습니다.');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 카테고리 저장
     */
    async saveCategory() {
        const categoryId = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const description = document.getElementById('categoryDescription').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || 'folder';
        const color = document.getElementById('categoryColor').value || '#3498db';
        
        // 유효성 검사
        if (!name) {
            this.showError('카테고리 이름을 입력해주세요.');
            return;
        }
        
        // 로딩 상태 표시
        this.setLoading(true);
        
        try {
            let result;
            
            if (categoryId) {
                // 기존 카테고리 업데이트
                const { data, error } = await supabaseClient.supabase
                    .from('room_categories')
                    .update({
                        name,
                        description,
                        icon,
                        color,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', categoryId)
                    .select();
                    
                if (error) {
                    throw error;
                }
                
                result = data;
                this.showSuccess('카테고리가 업데이트되었습니다.');
                
            } else {
                // 새 카테고리 생성
                const { data, error } = await supabaseClient.supabase
                    .from('room_categories')
                    .insert({
                        name,
                        description,
                        icon,
                        color
                    })
                    .select();
                    
                if (error) {
                    throw error;
                }
                
                result = data;
                this.showSuccess('새 카테고리가 생성되었습니다.');
            }
            
            // 카테고리 목록 업데이트
            if (result && result.length > 0) {
                await this.loadCategories();
                await this.loadRooms(); // 관련 채팅방 목록도 업데이트
            }
            
            // 모달 닫기
            this.hideCategoryModal();
            
        } catch (error) {
            console.error('Error saving category:', error);
            this.showError('카테고리 저장 중 오류가 발생했습니다.');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 채팅방 편집
     * @param {string} roomId - 채팅방 ID
     */
    editRoom(roomId) {
        this.showRoomModal(roomId);
    }

    /**
     * 카테고리 편집
     * @param {string} categoryId - 카테고리 ID
     */
    editCategory(categoryId) {
        this.showCategoryModal(categoryId);
    }

    /**
     * 채팅방 삭제 확인
     * @param {string} roomId - 채팅방 ID
     * @param {string} roomName - 채팅방 이름
     */
    confirmDeleteRoom(roomId, roomName) {
        this.showDeleteConfirmModal(
            `채팅방 "${roomName}"을(를) 삭제하시겠습니까?`,
            async () => {
                await this.deleteRoom(roomId);
            }
        );
    }

    /**
     * 카테고리 삭제 확인
     * @param {string} categoryId - 카테고리 ID
     * @param {string} categoryName - 카테고리 이름
     */
    confirmDeleteCategory(categoryId, categoryName) {
        this.showDeleteConfirmModal(
            `카테고리 "${categoryName}"을(를) 삭제하시겠습니까? 이 카테고리를 사용하는 모든 채팅방은 카테고리가 없음으로 변경됩니다.`,
            async () => {
                await this.deleteCategory(categoryId);
            }
        );
    }

    /**
     * 삭제 확인 모달 표시
     * @param {string} message - 확인 메시지
     * @param {Function} callback - 확인 시 실행할 콜백 함수
     */
    showDeleteConfirmModal(message, callback) {
        if (!this.confirmDeleteModal) {
            return;
        }
        
        // 메시지 설정
        const messageElement = document.getElementById('deleteConfirmMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        // 콜백 설정
        this.deleteCallback = callback;
        
        // 모달 표시
        this.confirmDeleteModal.style.display = 'block';
    }

    /**
     * 삭제 확인 모달 숨기기
     */
    hideDeleteConfirmModal() {
        if (this.confirmDeleteModal) {
            this.confirmDeleteModal.style.display = 'none';
        }
        
        // 콜백 초기화
        this.deleteCallback = null;
    }

    /**
     * 삭제 작업 실행
     */
    async confirmDelete() {
        if (typeof this.deleteCallback === 'function') {
            // 로딩 상태 표시
            this.setLoading(true);
            
            try {
                // 콜백 실행
                await this.deleteCallback();
            } catch (error) {
                console.error('Error during delete operation:', error);
                this.showError('삭제 중 오류가 발생했습니다.');
            } finally {
                // 로딩 상태 해제
                this.setLoading(false);
                
                // 모달 닫기
                this.hideDeleteConfirmModal();
            }
        } else {
            // 모달 닫기
            this.hideDeleteConfirmModal();
        }
    }

    /**
     * 채팅방 삭제
     * @param {string} roomId - 채팅방 ID
     */
    async deleteRoom(roomId) {
        try {
            // 채팅방 삭제
            const { error } = await supabaseClient.supabase
                .from('chat_rooms')
                .delete()
                .eq('id', roomId);
                
            if (error) {
                throw error;
            }
            
            // 채팅방 목록 업데이트
            await this.loadRooms();
            
            this.showSuccess('채팅방이 삭제되었습니다.');
            
        } catch (error) {
            console.error('Error deleting room:', error);
            this.showError('채팅방 삭제 중 오류가 발생했습니다.');
            throw error; // 상위 함수에서 처리하도록 오류 전파
        }
    }

    /**
     * 카테고리 삭제
     * @param {string} categoryId - 카테고리 ID
     */
    async deleteCategory(categoryId) {
        try {
            // 해당 카테고리를 사용하는 채팅방의 카테고리 ID를 NULL로 설정
            const { error: roomUpdateError } = await supabaseClient.supabase
                .from('chat_rooms')
                .update({ category_id: null })
                .eq('category_id', categoryId);
                
            if (roomUpdateError) {
                throw roomUpdateError;
            }
            
            // 카테고리 삭제
            const { error } = await supabaseClient.supabase
                .from('room_categories')
                .delete()
                .eq('id', categoryId);
                
            if (error) {
                throw error;
            }
            
            // 카테고리 및 채팅방 목록 업데이트
            await this.loadCategories();
            await this.loadRooms();
            
            this.showSuccess('카테고리가 삭제되었습니다.');
            
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showError('카테고리 삭제 중 오류가 발생했습니다.');
            throw error; // 상위 함수에서 처리하도록 오류 전파
        }
    }

    /**
     * 채팅방 필터링
     */
    filterRooms() {
        if (!this.roomsTable) {
            return;
        }
        
        const searchInput = document.getElementById('roomSearchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const activeOnlyCheckbox = document.getElementById('activeRoomsOnly');
        
        if (!searchInput || !categoryFilter || !activeOnlyCheckbox) {
            return;
        }
        
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categoryFilter.value;
        const activeOnly = activeOnlyCheckbox.checked;
        
        const rows = this.roomsTable.querySelectorAll('tbody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const roomNameElement = row.querySelector('.room-name span');
            const categoryElement = row.querySelector('.category-tag');
            const statusElement = row.querySelector('.status-badge');
            
            if (!roomNameElement || !categoryElement || !statusElement) {
                return;
            }
            
            const roomName = roomNameElement.textContent.toLowerCase();
            const isActive = statusElement.classList.contains('active');
            const roomId = row.querySelector('.action-button').dataset.id;
            const room = this.rooms.find(r => r.id === roomId);
            
            // 조건에 맞는지 확인
            const matchesSearch = !searchTerm || roomName.includes(searchTerm);
            const matchesCategory = !selectedCategory || (room && room.category_id === selectedCategory);
            const matchesStatus = !activeOnly || isActive;
            
            // 모든 조건에 맞으면 표시
            const isVisible = matchesSearch && matchesCategory && matchesStatus;
            row.style.display = isVisible ? '' : 'none';
            
            if (isVisible) {
                visibleCount++;
            }
        });
        
        // 빈 상태 메시지 표시
        const emptyState = document.getElementById('roomsEmptyState');
        if (emptyState) {
            emptyState.style.display = (visibleCount === 0) ? 'flex' : 'none';
            
            // 검색 결과가 없는 경우 메시지 변경
            if (visibleCount === 0 && (searchTerm || selectedCategory || activeOnly)) {
                const emptyIcon = emptyState.querySelector('.empty-icon');
                const emptyTitle = emptyState.querySelector('h3');
                const emptyText = emptyState.querySelector('p');
                
                if (emptyIcon && emptyTitle && emptyText) {
                    emptyIcon.innerHTML = '<i class="fas fa-search"></i>';
                    emptyTitle.textContent = '검색 결과가 없습니다';
                    emptyText.textContent = '검색 조건을 변경하여 다시 시도해보세요.';
                }
            } else {
                const emptyIcon = emptyState.querySelector('.empty-icon');
                const emptyTitle = emptyState.querySelector('h3');
                const emptyText = emptyState.querySelector('p');
                
                if (emptyIcon && emptyTitle && emptyText) {
                    emptyIcon.innerHTML = '<i class="far fa-comments"></i>';
                    emptyTitle.textContent = '채팅방이 없습니다';
                    emptyText.textContent = '새 채팅방을 추가해보세요!';
                }
            }
        }
    }

    /**
     * 탭 전환
     * @param {string} tab - 탭 ID
     */
    switchTab(tab) {
        if (this.currentTab === tab) {
            return;
        }
        
        // 모든 탭 컨텐츠 숨기기
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // 모든 탭 버튼 비활성화
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // 선택한 탭 컨텐츠 표시
        const selectedTab = document.getElementById(`${tab}Tab`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // 선택한 탭 버튼 활성화
        const selectedButton = document.getElementById(`${tab}TabButton`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        // 현재 탭 업데이트
        this.currentTab = tab;
        
        // 탭 전환 이벤트
        window.dispatchEvent(new CustomEvent('tab-changed', { 
            detail: { tab } 
        }));
    }

    /**
     * 로그인 폼 표시
     */
    showLoginForm() {
        if (this.adminLoginContainer) {
            this.adminLoginContainer.style.display = 'flex';
        }
        
        if (this.adminDashboard) {
            this.adminDashboard.style.display = 'none';
        }
        
        // 비밀번호 필드 초기화 및 포커스
        if (this.adminPassword) {
            this.adminPassword.value = '';
            this.adminPassword.focus();
        }
    }

    /**
     * 대시보드 표시
     */
    showDashboard() {
        if (this.adminLoginContainer) {
            this.adminLoginContainer.style.display = 'none';
        }
        
        if (this.adminDashboard) {
            this.adminDashboard.style.display = 'block';
        }
        
        // 로그아웃 버튼 표시
        if (this.adminLogoutButton) {
            this.adminLogoutButton.style.display = 'inline-block';
        }
        
        // 기본 탭 활성화
        this.switchTab('rooms');
    }

    /**
     * 로딩 상태 설정
     * @param {boolean} isLoading - 로딩 중 여부
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        
        if (isLoading) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }

    /**
     * 룸 로딩 상태 표시
     * @param {boolean} isLoading - 로딩 중 여부
     */
    showRoomsLoading(isLoading) {
        const loadingState = document.getElementById('roomsLoadingState');
        const emptyState = document.getElementById('roomsEmptyState');
        
        if (loadingState) {
            loadingState.style.display = isLoading ? 'flex' : 'none';
        }
        
        if (emptyState && isLoading) {
            emptyState.style.display = 'none';
        }
    }

    /**
     * 카테고리 로딩 상태 표시
     * @param {boolean} isLoading - 로딩 중 여부
     */
    showCategoriesLoading(isLoading) {
        const loadingState = document.getElementById('categoriesLoadingState');
        const emptyState = document.getElementById('categoriesEmptyState');
        
        if (loadingState) {
            loadingState.style.display = isLoading ? 'flex' : 'none';
        }
        
        if (emptyState && isLoading) {
            emptyState.style.display = 'none';
        }
    }

    /**
     * 통계 로딩 상태 표시
     * @param {boolean} isLoading - 로딩 중 여부
     */
    showStatisticsLoading(isLoading) {
        const loadingSpinners = document.querySelectorAll('.statistics-tab .loading-spinner-sm');
        
        loadingSpinners.forEach(spinner => {
            spinner.style.display = isLoading ? 'inline-block' : 'none';
        });
    }

    /**
     * 성공 메시지 표시
     * @param {string} message - 메시지
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * 오류 메시지 표시
     * @param {string} message - 메시지
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * 토스트 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 메시지 타입 (success, error, info)
     */
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        });
        
        // 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // 아이콘 추가
        let icon = 'info-circle';
        if (type === 'success') {
            icon = 'check-circle';
        } else if (type === 'error') {
            icon = 'exclamation-circle';
        }
        
        const iconElement = document.createElement('i');
        iconElement.className = `fas fa-${icon}`;
        iconElement.style.marginRight = '8px';
        
        toast.insertBefore(iconElement, toast.firstChild);
        
        // 토스트 스타일 설정
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '10px 15px';
        toast.style.borderRadius = '4px';
        toast.style.color = '#fff';
        toast.style.fontSize = '14px';
        toast.style.zIndex = '9999';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease';
        
        if (type === 'success') {
            toast.style.backgroundColor = '#2ecc71';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#e74c3c';
        } else {
            toast.style.backgroundColor = '#3498db';
        }
        
        // 토스트 문서에 추가
        document.body.appendChild(toast);
        
        // 애니메이션 효과
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            
            // 애니메이션 완료 후 요소 제거
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 날짜 포맷팅
     * @param {string} dateString - ISO 형식 날짜 문자열
     * @returns {string} - 포맷팅된 날짜 문자열
     */
    formatDate(dateString) {
        if (!dateString) {
            return '-';
        }
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * HTML 이스케이프 처리
     * @param {string} unsafe - 이스케이프 처리할 문자열
     * @returns {string} - 이스케이프 처리된 문자열
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            return '';
        }
        
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// 관리자 매니저 인스턴스 생성 및 초기화
const adminManager = new AdminManager();
document.addEventListener('DOMContentLoaded', () => {
    adminManager.init();
});

export default adminManager;
