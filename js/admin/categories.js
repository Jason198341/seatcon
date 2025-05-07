/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 관리자 카테고리 관리 기능
 * 작성일: 2025-05-07
 */

const adminCategories = {
    /**
     * 카테고리 관리 페이지 초기화
     */
    async initialize() {
        console.log('카테고리 관리 페이지 초기화 중...');
        
        try {
            // 카테고리 목록 로드
            await this.loadCategories();
            
            // 생성 버튼 이벤트 초기화
            document.getElementById('create-category-btn').addEventListener('click', () => {
                this.openCreateModal();
            });
            
            // 모달 이벤트 초기화
            this.initializeModalEvents();
            
            console.log('카테고리 관리 페이지 초기화 완료');
        } catch (error) {
            console.error('카테고리 관리 페이지 초기화 오류:', error);
            window.uiService.addNotification('카테고리 관리 페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 카테고리 목록 로드
     */
    async loadCategories() {
        try {
            // 카테고리 목록 및 관련 채팅방 수 조회
            const { data: categories, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            
            if (categoriesError) throw categoriesError;
            
            // 각 카테고리별 채팅방 수 조회
            const categoryCounts = {};
            
            for (const category of categories) {
                const { count, error } = await supabase
                    .from('rooms')
                    .select('id', { count: 'exact', head: true })
                    .eq('category_id', category.id);
                
                if (error) throw error;
                
                categoryCounts[category.id] = count;
            }
            
            // 카테고리 테이블 렌더링
            this.renderCategoriesTable(categories, categoryCounts);
            
        } catch (error) {
            console.error('카테고리 목록 로드 오류:', error);
            throw error;
        }
    },
    
    /**
     * 카테고리 테이블 렌더링
     * @param {Array} categories - 카테고리 목록
     * @param {Object} categoryCounts - 카테고리별 채팅방 수
     */
    renderCategoriesTable(categories, categoryCounts) {
        const tableBody = document.getElementById('categories-table-body');
        
        if (!tableBody) return;
        
        // 테이블 내용 초기화
        tableBody.innerHTML = '';
        
        if (!categories || categories.length === 0) {
            // 카테고리가 없는 경우
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="6" class="text-center">카테고리가 없습니다.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // 각 카테고리 행 생성
        categories.forEach(category => {
            const row = document.createElement('tr');
            
            // 행 내용 설정
            row.innerHTML = `
                <td>${category.id.substring(0, 8)}...</td>
                <td>${category.name}</td>
                <td>${category.description || '-'}</td>
                <td>${window.utils.formatDate(category.created_at, 'YYYY-MM-DD')}</td>
                <td>${categoryCounts[category.id] || 0}</td>
                <td class="actions">
                    <button class="btn btn-small edit-category-btn" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-category-btn" data-id="${category.id}" ${categoryCounts[category.id] > 0 ? 'disabled' : ''}>
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            // 행을 테이블에 추가
            tableBody.appendChild(row);
        });
        
        // 수정 버튼 이벤트
        document.querySelectorAll('.edit-category-btn').forEach(button => {
            button.addEventListener('click', () => {
                const categoryId = button.dataset.id;
                this.openEditModal(categoryId);
            });
        });
        
        // 삭제 버튼 이벤트
        document.querySelectorAll('.delete-category-btn').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', () => {
                    const categoryId = button.dataset.id;
                    this.confirmDelete(categoryId);
                });
            } else {
                // 비활성 버튼에 툴팁 추가
                button.title = '채팅방이 있는 카테고리는 삭제할 수 없습니다.';
            }
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
        
        // 카테고리 모달 외부 클릭
        const categoryModal = document.getElementById('category-modal');
        categoryModal.addEventListener('click', (event) => {
            if (event.target === categoryModal) {
                categoryModal.hidden = true;
            }
        });
        
        // 카테고리 폼 제출
        const categoryForm = document.getElementById('category-form');
        categoryForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // 폼 데이터 수집
            const categoryId = document.getElementById('category-id').value;
            const name = document.getElementById('category-name').value;
            const description = document.getElementById('category-description').value;
            
            try {
                if (categoryId) {
                    // 카테고리 업데이트
                    await this.updateCategory(categoryId, name, description);
                } else {
                    // 새 카테고리 생성
                    await this.createCategory(name, description);
                }
                
                // 모달 닫기
                categoryModal.hidden = true;
                
                // 카테고리 목록 새로고침
                await this.loadCategories();
            } catch (error) {
                console.error('카테고리 저장 오류:', error);
                alert('카테고리 저장 중 오류가 발생했습니다.');
            }
        });
    },
    
    /**
     * 생성 모달 열기
     */
    openCreateModal() {
        // 모달 초기화
        document.getElementById('category-modal-title').textContent = '새 카테고리';
        document.getElementById('category-id').value = '';
        document.getElementById('category-name').value = '';
        document.getElementById('category-description').value = '';
        
        // 모달 표시
        document.getElementById('category-modal').hidden = false;
    },
    
    /**
     * 수정 모달 열기
     * @param {string} categoryId - 카테고리 ID
     */
    async openEditModal(categoryId) {
        try {
            // 카테고리 정보 조회
            const { data: category, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', categoryId)
                .single();
            
            if (error) throw error;
            
            // 모달 초기화
            document.getElementById('category-modal-title').textContent = '카테고리 수정';
            document.getElementById('category-id').value = category.id;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-description').value = category.description || '';
            
            // 모달 표시
            document.getElementById('category-modal').hidden = false;
        } catch (error) {
            console.error('수정 모달 열기 오류:', error);
            alert('카테고리 정보 로드 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 새 카테고리 생성
     * @param {string} name - 카테고리 이름
     * @param {string} description - 카테고리 설명
     * @returns {Promise<Object>} - 생성된 카테고리 객체
     */
    async createCategory(name, description) {
        try {
            // 카테고리 생성
            const { data: category, error } = await supabase
                .from('categories')
                .insert([
                    {
                        name,
                        description
                    }
                ])
                .select()
                .single();
            
            if (error) throw error;
            
            // 생성 알림
            window.uiService.addNotification(`카테고리 '${name}'이(가) 생성되었습니다.`, 'success');
            
            return category;
        } catch (error) {
            console.error('카테고리 생성 오류:', error);
            throw error;
        }
    },
    
    /**
     * 카테고리 업데이트
     * @param {string} categoryId - 카테고리 ID
     * @param {string} name - 카테고리 이름
     * @param {string} description - 카테고리 설명
     * @returns {Promise<Object>} - 업데이트된 카테고리 객체
     */
    async updateCategory(categoryId, name, description) {
        try {
            // 카테고리 업데이트
            const { data: category, error } = await supabase
                .from('categories')
                .update({
                    name,
                    description
                })
                .eq('id', categoryId)
                .select()
                .single();
            
            if (error) throw error;
            
            // 업데이트 알림
            window.uiService.addNotification(`카테고리 '${name}'이(가) 업데이트되었습니다.`, 'success');
            
            return category;
        } catch (error) {
            console.error('카테고리 업데이트 오류:', error);
            throw error;
        }
    },
    
    /**
     * 카테고리 삭제 확인
     * @param {string} categoryId - 카테고리 ID
     */
    async confirmDelete(categoryId) {
        try {
            // 카테고리 정보 조회
            const { data: category, error } = await supabase
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .single();
            
            if (error) throw error;
            
            // 삭제 확인
            if (confirm(`카테고리 '${category.name}'을(를) 삭제하시겠습니까?`)) {
                await this.deleteCategory(categoryId, category.name);
            }
        } catch (error) {
            console.error('카테고리 삭제 확인 오류:', error);
            alert('카테고리 정보 로드 중 오류가 발생했습니다.');
        }
    },
    
    /**
     * 카테고리 삭제
     * @param {string} categoryId - 카테고리 ID
     * @param {string} categoryName - 카테고리 이름
     */
    async deleteCategory(categoryId, categoryName) {
        try {
            // 카테고리 삭제
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);
            
            if (error) throw error;
            
            // 삭제 알림
            window.uiService.addNotification(`카테고리 '${categoryName}'이(가) 삭제되었습니다.`, 'success');
            
            // 카테고리 목록 새로고침
            await this.loadCategories();
        } catch (error) {
            console.error('카테고리 삭제 오류:', error);
            alert('카테고리 삭제 중 오류가 발생했습니다.');
        }
    }
};

// 전역 객체로 내보내기
window.adminCategories = adminCategories;

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('adminCategoriesLoaded'));
