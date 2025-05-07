/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 관리자 채팅방 관리 기능
 * 작성일: 2025-05-07
 */

const adminRooms = {
    /**
     * 룸 관리 페이지 초기화
     */
    async initialize() {
        console.log('채팅방 관리 페이지 초기화 중...');
        
        try {
            // 채팅방 목록 로드
            await this.loadRooms();
            
            // 생성 버튼 이벤트 초기화
            document.getElementById('create-room-btn').addEventListener('click', () => {
                this.openCreateModal();
            });
            
            // 모달 이벤트 초기화
            this.initializeModalEvents();
            
            console.log('채팅방 관리 페이지 초기화 완료');
        } catch (error) {
            console.error('채팅방 관리 페이지 초기화 오류:', error);
            window.uiService.addNotification('채팅방 관리 페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 채팅방 목록 로드
     */
    async loadRooms() {
        try {
            // 채팅방 및 카테고리 조회
            const { data: rooms, error: roomsError } = await supabase
                .from('rooms')
                .select(`
                    *,
                    category:category_id (id, name),
                    creator:created_by (id, username)
                `)
                .order('name');
            
            if (roomsError) throw roomsError;
            
            // 채팅방 테이블 렌더링
            this.renderRoomsTable(rooms);
            
        } catch (error) {
            console.error('채팅방 목록 로드 오류:', error);
            throw error;
        }
    },
    
    /**
     * 채팅방 테이블 렌더링
     * @param {Array} rooms - 채팅방 목록
     */
    renderRoomsTable(rooms) {
        const tableBody = document.getElementById('rooms-table-body');
        
        if (!tableBody) return;
        
        // 테이블 내용 초기화
        tableBody.innerHTML = '';
        
        if (!rooms || rooms.length === 0) {
            // 채팅방이 없는 경우
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="6" class="text-center">채팅방이 없습니다.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // 각 채팅방 행 생성
        rooms.forEach(room => {
            const row = document.createElement('tr');
            
            // 행 내용 설정
            row.innerHTML = `
                <td>${room.id.substring(0, 8)}...</td>
                <td>${room.name}</td>
                <td>${room.category ? room.category.name : '-'}</td>
                <td>${window.utils.formatDate(room.created_at, 'YYYY-MM-DD')}</td>
                <td>
                    <span class="status-badge ${room.is_active ? 'active' : 'inactive'}">
                        ${room.is_active ? '활성화' : '비활성화'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-small edit-room-btn" data-id="${room.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-room-btn" data-id="${room.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            // 행을 테이블에 추가
            tableBody.appendChild(row);
        });
        
        // 수정 버튼 이벤트
        document.querySelectorAll('.edit-room-btn').forEach(button => {
            button.addEventListener('click', () => {
                const roomId = button.dataset.id;
                this.openEditModal(roomId);
            });
        });
        
        // 삭제 버튼 이벤트
        document.querySelectorAll('.delete-room-btn').forEach(button => {
            button.addEventListener('click', () => {
                const roomId = button.dataset.id;
                this.confirmDelete(roomId);
            });
        });
    },
    
    /**
     * 모달 이벤트 초기화
     */
    initializeModalEvents() {
        // 모달 닫기 버튼
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modal = closeBtn.closest('.modal');
                modal.hidden = true;
            });
        });
        
        // 채팅방 모달 외부 클릭
        const roomModal = document.getElementById('room-modal');
        roomModal.addEventListener('click', (event) => {
            if (event.target === roomModal) {
                roomModal.hidden = true;
            }
        });
        
        // 채팅방 폼 제출
        const roomForm = document.getElementById('room-form');
        roomForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // 폼 데이터 수집
            const roomId = document.getElementById('room-id').value;
            const name = document.getElementById('room-name').value;
            const description = document.getElementById('room-description').value;
            const categoryId = document.getElementById('room-category').value;
            const status = document.getElementById('room-status').value;
            
            try {
                if (roomId) {
                    // 채팅방 업데이트
                    await this.updateRoom(roomId, name, description, categoryId, status === 'active');
                } else {
                    // 새 채팅방 생성
                    await this.createRoom(name, description, categoryId);
                }
                
                // 모달 닫기
                roomModal.hidden = true;
                
                // 채팅방 목록 새로고침
                await this.loadRooms();
            } catch (error) {
                console.error('채팅방 저장 오류:', error);
                alert('채팅방 저장 중 오류가 발생했습니다.');
            }
        });
    },
    
    /**
     * 생성 모달 열기
     */
    async openCreateModal() {
        try {
            // 모달 초기화
            document.getElementById('room-modal-title').textContent = '새 채팅방';
            document.getElementById('room-id').value = '';
            document.getElementById('room-name').value = '';
            document.getElementById('room-description').value = '';
            document.getElementById('room-status').value = 'active';
            
            // 카테고리 목록 로드
            await this.loadCategories();
            
            // 모달 표시
            document.getElementById('room-modal').hidden = false;
        } catch (error) {
            console.error('생성 모달 열기 오류:', error);
            alert('모달 초기화 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 수정 모달 열기
     * @param {string} roomId - 채팅방 ID
     */
    async openEditModal(roomId) {
        try {
            // 채팅방 정보 조회
            const { data: room, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single();
            
            if (error) throw error;
            
            // 모달 초기화
            document.getElementById('room-modal-title').textContent = '채팅방 수정';
            document.getElementById('room-id').value = room.id;
            document.getElementById('room-name').value = room.name;
            document.getElementById('room-description').value = room.description || '';
            document.getElementById('room-status').value = room.is_active ? 'active' : 'inactive';
            
            // 카테고리 목록 로드
            await this.loadCategories(room.category_id);
            
            // 모달 표시
            document.getElementById('room-modal').hidden = false;
        } catch (error) {
            console.error('수정 모달 열기 오류:', error);
            alert('채팅방 정보 로드 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 카테고리 목록 로드
     * @param {string} selectedCategoryId - 선택된 카테고리 ID
     */
    async loadCategories(selectedCategoryId = null) {
        try {
            // 카테고리 목록 조회
            const { data: categories, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            // 카테고리 선택 목록 초기화
            const categorySelect = document.getElementById('room-category');
            categorySelect.innerHTML = '';
            
            // 카테고리 옵션 추가
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                
                if (selectedCategoryId && category.id === selectedCategoryId) {
                    option.selected = true;
                }
                
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('카테고리 목록 로드 오류:', error);
            throw error;
        }
    },
    
    /**
     * 새 채팅방 생성
     * @param {string} name - 채팅방 이름
     * @param {string} description - 채팅방 설명
     * @param {string} categoryId - 카테고리 ID
     * @returns {Promise<Object>} - 생성된 채팅방 객체
     */
    async createRoom(name, description, categoryId) {
        try {
            // 로그인 상태 확인
            if (!window.authService.authState.isValid()) {
                throw new Error('인증되지 않았습니다.');
            }
            
            // 채팅방 생성
            const { data: room, error } = await supabase
                .from('rooms')
                .insert([
                    {
                        name,
                        description,
                        category_id: categoryId,
                        created_by: window.authService.authState.user.id,
                        is_active: true
                    }
                ])
                .select()
                .single();
            
            if (error) throw error;
            
            // 생성 알림
            window.uiService.addNotification(`채팅방 '${name}'이(가) 생성되었습니다.`, 'success');
            
            return room;
        } catch (error) {
            console.error('채팅방 생성 오류:', error);
            throw error;
        }
    },
    
    /**
     * 채팅방 업데이트
     * @param {string} roomId - 채팅방 ID
     * @param {string} name - 채팅방 이름
     * @param {string} description - 채팅방 설명
     * @param {string} categoryId - 카테고리 ID
     * @param {boolean} isActive - 활성화 상태
     * @returns {Promise<Object>} - 업데이트된 채팅방 객체
     */
    async updateRoom(roomId, name, description, categoryId, isActive) {
        try {
            // 채팅방 업데이트
            const { data: room, error } = await supabase
                .from('rooms')
                .update({
                    name,
                    description,
                    category_id: categoryId,
                    is_active: isActive
                })
                .eq('id', roomId)
                .select()
                .single();
            
            if (error) throw error;
            
            // 업데이트 알림
            window.uiService.addNotification(`채팅방 '${name}'이(가) 업데이트되었습니다.`, 'success');
            
            return room;
        } catch (error) {
            console.error('채팅방 업데이트 오류:', error);
            throw error;
        }
    },
    
    /**
     * 채팅방 삭제 확인
     * @param {string} roomId - 채팅방 ID
     */
    async confirmDelete(roomId) {
        try {
            // 채팅방 정보 조회
            const { data: room, error } = await supabase
                .from('rooms')
                .select('name')
                .eq('id', roomId)
                .single();
            
            if (error) throw error;
            
            // 삭제 확인
            if (confirm(`채팅방 '${room.name}'을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 모든 메시지도 삭제됩니다.`)) {
                await this.deleteRoom(roomId, room.name);
            }
        } catch (error) {
            console.error('채팅방 삭제 확인 오류:', error);
            alert('채팅방 정보 로드 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 채팅방 삭제
     * @param {string} roomId - 채팅방 ID
     * @param {string} roomName - 채팅방 이름
     */
    async deleteRoom(roomId, roomName) {
        try {
            // 메시지 삭제
            const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .eq('room_id', roomId);
            
            if (messagesError) throw messagesError;
            
            // 채팅방 삭제
            const { error: roomError } = await supabase
                .from('rooms')
                .delete()
                .eq('id', roomId);
            
            if (roomError) throw roomError;
            
            // 삭제 알림
            window.uiService.addNotification(`채팅방 '${roomName}'이(가) 삭제되었습니다.`, 'success');
            
            // 채팅방 목록 새로고침
            await this.loadRooms();
        } catch (error) {
            console.error('채팅방 삭제 오류:', error);
            alert('채팅방 삭제 중 오류가 발생했습니다.');
        }
    }
};

// 전역 객체로 내보내기
window.adminRooms = adminRooms;

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('adminRoomsLoaded'));
