/**
 * 전시물 목록 모듈
 * 
 * 컨퍼런스 전시물 목록 표시 및 관리를 위한 기능을 제공합니다.
 * 검색, 필터링, 다국어 지원 기능을 포함합니다.
 */

import CONFIG from './config.js';
import i18nService from './i18n.js';
import * as utils from './utils.js';

class ExhibitionManager {
    constructor() {
        // 전시물 데이터
        this.exhibitionItems = [];
        this.filteredItems = [];
        this.currentFilter = '';
        
        // DOM 요소 참조
        this.exhibitionButton = null;
        this.modalContainer = null;
        this.searchInput = null;
        this.resultCount = null;
        this.exhibitionList = null;
        this.currentFilterText = null;
        this.clearFilterButton = null;
        
        // 이벤트 콜백
        this.onExhibitionSelect = null;
    }

    /**
     * 전시물 관리자 초기화
     * @param {Object} options - 초기화 옵션
     */
    init(options = {}) {
        // 전시물 데이터 설정
        this.exhibitionItems = options.exhibitionItems || [];
        this.filteredItems = [...this.exhibitionItems];
        
        // 이벤트 콜백 설정
        this.onExhibitionSelect = options.onExhibitionSelect || null;
        
        // DOM 요소 참조 가져오기
        this.exhibitionButton = document.getElementById(options.buttonId || 'exhibitionButton');
        
        // 전시물 버튼 이벤트 리스너 등록
        if (this.exhibitionButton) {
            this.exhibitionButton.addEventListener('click', () => {
                this.showExhibitionModal();
            });
        } else {
            // 버튼이 없으면 생성
            this.createExhibitionButton();
        }
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('ExhibitionManager initialized with', this.exhibitionItems.length, 'items');
        }
    }

    /**
     * 전시물 버튼 생성
     */
    createExhibitionButton() {
        // 헤더 네비게이션에 버튼 추가
        const headerNav = document.querySelector('.header-nav');
        
        if (headerNav) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'header-nav-item';
            
            const button = document.createElement('button');
            button.id = 'exhibitionButton';
            button.className = 'button secondary';
            button.innerHTML = `<i class="fas fa-list-ul mr-1"></i> <span data-i18n="exhibitionButton">Exhibition Items</span>`;
            
            buttonContainer.appendChild(button);
            headerNav.insertBefore(buttonContainer, headerNav.firstChild);
            
            this.exhibitionButton = button;
            
            // 이벤트 리스너 등록
            this.exhibitionButton.addEventListener('click', () => {
                this.showExhibitionModal();
            });
            
            // 언어 텍스트 업데이트
            i18nService.updateAllTexts();
        }
    }

    /**
     * 전시물 데이터 설정
     * @param {Array} exhibitionItems - 전시물 데이터 배열
     */
    setExhibitionItems(exhibitionItems) {
        this.exhibitionItems = exhibitionItems || [];
        this.filteredItems = [...this.exhibitionItems];
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('ExhibitionManager updated with', this.exhibitionItems.length, 'items');
        }
    }

    /**
     * 전시물 모달 표시
     */
    showExhibitionModal() {
        // 기존 모달 제거
        this.closeExhibitionModal();
        
        // 모달 컨테이너 생성
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'modal-backdrop';
        
        // 모달 내용 생성
        const modalContent = document.createElement('div');
        modalContent.className = 'modal exhibition-modal';
        
        // 모달 헤더
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h3 class="modal-title" data-i18n="exhibitionModalTitle">Exhibition Items</h3>
            <button class="modal-close">&times;</button>
        `;
        
        // 모달 바디
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        // 검색 영역
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <input type="text" id="exhibitionSearch" class="search-input" data-i18n-placeholder="exhibitionSearchPlaceholder" placeholder="Search exhibitions...">
                <i class="fas fa-search search-icon"></i>
            </div>
            <div class="search-results-info">
                <span id="exhibitionResultCount" class="result-count" data-i18n="exhibitionResultCount" data-i18n-params='{"count": "${this.filteredItems.length}"}'>${this.filteredItems.length} items found</span>
                <div class="filter-info" style="display: none;">
                    <span id="currentFilter" data-i18n="currentFilter" data-i18n-params='{"filter": ""}'></span>
                    <button id="clearFilter" class="clear-filter-button" data-i18n="clearFilter">Clear filter</button>
                </div>
            </div>
        `;
        
        // 전시물 목록
        const exhibitionListContainer = document.createElement('div');
        exhibitionListContainer.className = 'exhibition-list-container';
        
        const exhibitionList = document.createElement('div');
        exhibitionList.id = 'exhibitionList';
        exhibitionList.className = 'exhibition-list';
        
        exhibitionListContainer.appendChild(exhibitionList);
        
        // 모달 바디에 요소 추가
        modalBody.appendChild(searchContainer);
        modalBody.appendChild(exhibitionListContainer);
        
        // 모달 콘텐츠에 요소 추가
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        
        // 모달 컨테이너에 콘텐츠 추가
        this.modalContainer.appendChild(modalContent);
        
        // 페이지에 모달 추가
        document.body.appendChild(this.modalContainer);
        
        // DOM 요소 참조 설정
        this.searchInput = document.getElementById('exhibitionSearch');
        this.resultCount = document.getElementById('exhibitionResultCount');
        this.exhibitionList = document.getElementById('exhibitionList');
        this.currentFilterText = document.getElementById('currentFilter');
        this.clearFilterButton = document.getElementById('clearFilter');
        
        // 텍스트 업데이트
        i18nService.updateAllTexts();
        
        // 이벤트 리스너 설정
        this.setupModalEventListeners();
        
        // 전시물 목록 렌더링
        this.renderExhibitionItems();
        
        // 모달 표시 애니메이션
        setTimeout(() => {
            this.modalContainer.classList.add('show');
        }, 10);
    }

    /**
     * 모달 이벤트 리스너 설정
     */
    setupModalEventListeners() {
        // 닫기 버튼 이벤트
        const closeButton = this.modalContainer.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeExhibitionModal();
            });
        }
        
        // 배경 클릭 시 닫기
        this.modalContainer.addEventListener('click', (e) => {
            if (e.target === this.modalContainer) {
                this.closeExhibitionModal();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalContainer.classList.contains('show')) {
                this.closeExhibitionModal();
            }
        });
        
        // 검색 입력 이벤트
        if (this.searchInput) {
            this.searchInput.addEventListener('input', utils.debounce(() => {
                this.filterExhibitionItems();
            }, 300));
        }
        
        // 필터 초기화 버튼 이벤트
        if (this.clearFilterButton) {
            this.clearFilterButton.addEventListener('click', () => {
                this.clearFilter();
            });
        }
    }

    /**
     * 전시물 모달 닫기
     */
    closeExhibitionModal() {
        if (this.modalContainer) {
            this.modalContainer.classList.remove('show');
            
            // 애니메이션 후 제거
            setTimeout(() => {
                if (this.modalContainer.parentNode) {
                    document.body.removeChild(this.modalContainer);
                }
                this.modalContainer = null;
            }, 300);
        }
    }

    /**
     * 전시물 아이템 검색 및 필터링
     */
    filterExhibitionItems() {
        if (!this.searchInput) return;
        
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        
        if (searchTerm === this.currentFilter) return;
        
        this.currentFilter = searchTerm;
        
        if (searchTerm) {
            // 검색어로 필터링
            this.filteredItems = this.exhibitionItems.filter(item => {
                return (
                    (item.title && item.title.toLowerCase().includes(searchTerm)) ||
                    (item.company && item.company.toLowerCase().includes(searchTerm)) ||
                    (item.name && item.name.toLowerCase().includes(searchTerm))
                );
            });
            
            // 필터 정보 표시
            const filterInfo = this.modalContainer.querySelector('.filter-info');
            if (filterInfo) {
                filterInfo.style.display = 'flex';
                if (this.currentFilterText) {
                    this.currentFilterText.setAttribute('data-i18n-params', JSON.stringify({ filter: searchTerm }));
                    this.currentFilterText.textContent = i18nService.get('currentFilter', { filter: searchTerm });
                }
            }
        } else {
            // 필터 초기화
            this.filteredItems = [...this.exhibitionItems];
            
            // 필터 정보 숨기기
            const filterInfo = this.modalContainer.querySelector('.filter-info');
            if (filterInfo) {
                filterInfo.style.display = 'none';
            }
        }
        
        // 결과 수 업데이트
        if (this.resultCount) {
            this.resultCount.setAttribute('data-i18n-params', JSON.stringify({ count: this.filteredItems.length }));
            this.resultCount.textContent = i18nService.get('exhibitionResultCount', { count: this.filteredItems.length });
        }
        
        // 목록 다시 렌더링
        this.renderExhibitionItems();
    }

    /**
     * 필터 초기화
     */
    clearFilter() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        this.currentFilter = '';
        this.filteredItems = [...this.exhibitionItems];
        
        // 필터 정보 숨기기
        const filterInfo = this.modalContainer.querySelector('.filter-info');
        if (filterInfo) {
            filterInfo.style.display = 'none';
        }
        
        // 결과 수 업데이트
        if (this.resultCount) {
            this.resultCount.setAttribute('data-i18n-params', JSON.stringify({ count: this.filteredItems.length }));
            this.resultCount.textContent = i18nService.get('exhibitionResultCount', { count: this.filteredItems.length });
        }
        
        // 목록 다시 렌더링
        this.renderExhibitionItems();
    }

    /**
     * 전시물 목록 렌더링
     */
    renderExhibitionItems() {
        if (!this.exhibitionList) return;
        
        // 목록 초기화
        this.exhibitionList.innerHTML = '';
        
        if (this.filteredItems.length === 0) {
            // 결과 없음 표시
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = i18nService.get('noResultsFound');
            this.exhibitionList.appendChild(noResults);
            return;
        }
        
        // 표 헤더 생성
        const table = document.createElement('table');
        table.className = 'exhibition-table';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th data-i18n="exhibitionNumber">No.</th>
                <th data-i18n="exhibitionName">Name</th>
                <th data-i18n="exhibitionCompany">Company</th>
                <th data-i18n="exhibitionContact">Contact</th>
                <th data-i18n="exhibitionPhone">Phone</th>
                <th data-i18n="exhibitionEmail">Email</th>
            </tr>
        `;
        
        // 표 본문 생성
        const tbody = document.createElement('tbody');
        
        this.filteredItems.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'exhibition-item';
            row.setAttribute('data-exhibition-id', item.id || item.no);
            row.innerHTML = `
                <td>${utils.escapeHtml(item.no || '')}</td>
                <td>${utils.escapeHtml(item.title || '')}</td>
                <td>${utils.escapeHtml(item.company || '')}</td>
                <td>${utils.escapeHtml(item.name || '')}</td>
                <td>${utils.escapeHtml(item.phone || '')}</td>
                <td>${utils.escapeHtml(item.email || '')}</td>
            `;
            
            // 행 클릭 이벤트
            row.addEventListener('click', () => {
                this.handleExhibitionSelect(item);
            });
            
            tbody.appendChild(row);
        });
        
        // 표 완성
        table.appendChild(thead);
        table.appendChild(tbody);
        
        // 목록에 표 추가
        this.exhibitionList.appendChild(table);
        
        // 언어 텍스트 업데이트
        i18nService.updateAllTexts();
    }

    /**
     * 전시물 선택 처리
     * @param {Object} exhibition - 선택된 전시물 데이터
     */
    handleExhibitionSelect(exhibition) {
        // 선택된 행 하이라이트
        const rows = this.exhibitionList.querySelectorAll('.exhibition-item');
        rows.forEach(row => {
            row.classList.remove('selected');
        });
        
        const selectedRow = this.exhibitionList.querySelector(`[data-exhibition-id="${exhibition.id || exhibition.no}"]`);
        if (selectedRow) {
            selectedRow.classList.add('selected');
        }
        
        // 선택 이벤트 콜백 호출
        if (typeof this.onExhibitionSelect === 'function') {
            this.onExhibitionSelect(exhibition);
        }
    }

    /**
     * 전시물 데이터 변환
     * @param {Array} rawData - 원시 전시물 데이터
     * @returns {Array} - 포맷팅된 전시물 데이터
     */
    static formatExhibitionData(rawData) {
        if (!Array.isArray(rawData)) {
            console.error('Invalid exhibition data format');
            return [];
        }
        
        return rawData.map(item => {
            return {
                id: item.NO || item.no || '',
                no: item.NO || item.no || '',
                title: item.기술명 || item.title || '',
                company: item.회사명 || item.company || '',
                name: item.이름 || item.name || '',
                phone: item.연락처 || item.phone || '',
                email: item.메일 || item.email || ''
            };
        });
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const exhibitionManager = new ExhibitionManager();
export default exhibitionManager;
