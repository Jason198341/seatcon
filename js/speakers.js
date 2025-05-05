/**
 * 발표자 정보 모듈
 * 
 * 컨퍼런스 발표자 목록 표시 및 관리를 위한 기능을 제공합니다.
 * 검색, 필터링, 다국어 지원 기능을 포함합니다.
 */

import CONFIG from './config.js';
import i18nService from './i18n.js';
import * as utils from './utils.js';

class SpeakersManager {
    constructor() {
        // 발표자 데이터
        this.speakerItems = [];
        this.filteredItems = [];
        this.currentFilter = '';
        
        // DOM 요소 참조
        this.speakersButton = null;
        this.modalContainer = null;
        this.searchInput = null;
        this.resultCount = null;
        this.speakersList = null;
        this.currentFilterText = null;
        this.clearFilterButton = null;
        
        // 이벤트 콜백
        this.onSpeakerSelect = null;
    }

    /**
     * 발표자 관리자 초기화
     * @param {Object} options - 초기화 옵션
     */
    init(options = {}) {
        // 발표자 데이터 설정
        this.speakerItems = options.speakerItems || [];
        this.filteredItems = [...this.speakerItems];
        
        // 이벤트 콜백 설정
        this.onSpeakerSelect = options.onSpeakerSelect || null;
        
        // DOM 요소 참조 가져오기
        this.speakersButton = document.getElementById(options.buttonId || 'speakersButton');
        
        // 발표자 버튼 이벤트 리스너 등록
        if (this.speakersButton) {
            this.speakersButton.addEventListener('click', () => {
                this.showSpeakersModal();
            });
        } else {
            // 버튼이 없으면 생성
            this.createSpeakersButton();
        }
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('SpeakersManager initialized with', this.speakerItems.length, 'items');
        }
    }

    /**
     * 발표자 버튼 생성
     */
    createSpeakersButton() {
        // 헤더 네비게이션에 버튼 추가
        const headerNav = document.querySelector('.header-nav');
        
        if (headerNav) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'header-nav-item';
            
            const button = document.createElement('button');
            button.id = 'speakersButton';
            button.className = 'button secondary';
            button.innerHTML = `<i class="fas fa-microphone mr-1"></i> <span data-i18n="speakersButton">Speakers</span>`;
            
            buttonContainer.appendChild(button);
            
            // 전시물 버튼 다음에 추가
            const exhibitionButton = headerNav.querySelector('#exhibitionButton');
            if (exhibitionButton) {
                const exhibitionContainer = exhibitionButton.closest('.header-nav-item');
                if (exhibitionContainer) {
                    headerNav.insertBefore(buttonContainer, exhibitionContainer.nextSibling);
                } else {
                    headerNav.insertBefore(buttonContainer, headerNav.firstChild);
                }
            } else {
                headerNav.insertBefore(buttonContainer, headerNav.firstChild);
            }
            
            this.speakersButton = button;
            
            // 이벤트 리스너 등록
            this.speakersButton.addEventListener('click', () => {
                this.showSpeakersModal();
            });
            
            // 언어 텍스트 업데이트
            i18nService.updateAllTexts();
        }
    }

    /**
     * 발표자 데이터 설정
     * @param {Array} speakerItems - 발표자 데이터 배열
     */
    setSpeakerItems(speakerItems) {
        this.speakerItems = speakerItems || [];
        this.filteredItems = [...this.speakerItems];
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('SpeakersManager updated with', this.speakerItems.length, 'items');
        }
    }

    /**
     * 발표자 모달 표시
     */
    showSpeakersModal() {
        // 기존 모달 제거
        this.closeSpeakersModal();
        
        // 모달 컨테이너 생성
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'modal-backdrop';
        
        // 모달 내용 생성
        const modalContent = document.createElement('div');
        modalContent.className = 'modal speakers-modal';
        
        // 모달 헤더
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h3 class="modal-title" data-i18n="speakersModalTitle">Conference Speakers</h3>
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
                <input type="text" id="speakersSearch" class="search-input" data-i18n-placeholder="speakersSearchPlaceholder" placeholder="Search speakers...">
                <i class="fas fa-search search-icon"></i>
            </div>
            <div class="search-results-info">
                <span id="speakersResultCount" class="result-count" data-i18n="speakersResultCount" data-i18n-params='{"count": "${this.filteredItems.length}"}'>${this.filteredItems.length} presentations found</span>
                <div class="filter-info" style="display: none;">
                    <span id="currentFilter" data-i18n="currentFilter" data-i18n-params='{"filter": ""}'></span>
                    <button id="clearFilter" class="clear-filter-button" data-i18n="clearFilter">Clear filter</button>
                </div>
            </div>
        `;
        
        // 발표자 목록
        const speakersListContainer = document.createElement('div');
        speakersListContainer.className = 'speakers-list-container';
        
        const speakersList = document.createElement('div');
        speakersList.id = 'speakersList';
        speakersList.className = 'speakers-list';
        
        speakersListContainer.appendChild(speakersList);
        
        // 모달 바디에 요소 추가
        modalBody.appendChild(searchContainer);
        modalBody.appendChild(speakersListContainer);
        
        // 모달 콘텐츠에 요소 추가
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        
        // 모달 컨테이너에 콘텐츠 추가
        this.modalContainer.appendChild(modalContent);
        
        // 페이지에 모달 추가
        document.body.appendChild(this.modalContainer);
        
        // DOM 요소 참조 설정
        this.searchInput = document.getElementById('speakersSearch');
        this.resultCount = document.getElementById('speakersResultCount');
        this.speakersList = document.getElementById('speakersList');
        this.currentFilterText = document.getElementById('currentFilter');
        this.clearFilterButton = document.getElementById('clearFilter');
        
        // 텍스트 업데이트
        i18nService.updateAllTexts();
        
        // 이벤트 리스너 설정
        this.setupModalEventListeners();
        
        // 발표자 목록 렌더링
        this.renderSpeakerItems();
        
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
                this.closeSpeakersModal();
            });
        }
        
        // 배경 클릭 시 닫기
        this.modalContainer.addEventListener('click', (e) => {
            if (e.target === this.modalContainer) {
                this.closeSpeakersModal();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalContainer.classList.contains('show')) {
                this.closeSpeakersModal();
            }
        });
        
        // 검색 입력 이벤트
        if (this.searchInput) {
            this.searchInput.addEventListener('input', utils.debounce(() => {
                this.filterSpeakerItems();
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
     * 발표자 모달 닫기
     */
    closeSpeakersModal() {
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
     * 발표자 아이템 검색 및 필터링
     */
    filterSpeakerItems() {
        if (!this.searchInput) return;
        
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        
        if (searchTerm === this.currentFilter) return;
        
        this.currentFilter = searchTerm;
        
        if (searchTerm) {
            // 검색어로 필터링
            this.filteredItems = this.speakerItems.filter(item => {
                return (
                    (item.topic && item.topic.toLowerCase().includes(searchTerm)) ||
                    (item.department && item.department.toLowerCase().includes(searchTerm)) ||
                    (item.presenter && item.presenter.toLowerCase().includes(searchTerm))
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
            this.filteredItems = [...this.speakerItems];
            
            // 필터 정보 숨기기
            const filterInfo = this.modalContainer.querySelector('.filter-info');
            if (filterInfo) {
                filterInfo.style.display = 'none';
            }
        }
        
        // 결과 수 업데이트
        if (this.resultCount) {
            this.resultCount.setAttribute('data-i18n-params', JSON.stringify({ count: this.filteredItems.length }));
            this.resultCount.textContent = i18nService.get('speakersResultCount', { count: this.filteredItems.length });
        }
        
        // 목록 다시 렌더링
        this.renderSpeakerItems();
    }

    /**
     * 필터 초기화
     */
    clearFilter() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        this.currentFilter = '';
        this.filteredItems = [...this.speakerItems];
        
        // 필터 정보 숨기기
        const filterInfo = this.modalContainer.querySelector('.filter-info');
        if (filterInfo) {
            filterInfo.style.display = 'none';
        }
        
        // 결과 수 업데이트
        if (this.resultCount) {
            this.resultCount.setAttribute('data-i18n-params', JSON.stringify({ count: this.filteredItems.length }));
            this.resultCount.textContent = i18nService.get('speakersResultCount', { count: this.filteredItems.length });
        }
        
        // 목록 다시 렌더링
        this.renderSpeakerItems();
    }

    /**
     * 발표자 목록 렌더링
     */
    renderSpeakerItems() {
        if (!this.speakersList) return;
        
        // 목록 초기화
        this.speakersList.innerHTML = '';
        
        if (this.filteredItems.length === 0) {
            // 결과 없음 표시
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = i18nService.get('noResultsFound');
            this.speakersList.appendChild(noResults);
            return;
        }
        
        // 표 헤더 생성
        const table = document.createElement('table');
        table.className = 'speakers-table';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th data-i18n="speakersNumber">No.</th>
                <th data-i18n="speakersTopic">Topic</th>
                <th data-i18n="speakersGroup">Group</th>
                <th data-i18n="speakersDepartment">Department</th>
                <th data-i18n="speakersPresenter">Presenter</th>
            </tr>
        `;
        
        // 표 본문 생성
        const tbody = document.createElement('tbody');
        
        this.filteredItems.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'speaker-item';
            row.setAttribute('data-speaker-id', item.id || item.no);
            row.innerHTML = `
                <td>${utils.escapeHtml(item.no || '')}</td>
                <td>${utils.escapeHtml(item.topic || '')}</td>
                <td>${utils.escapeHtml(item.group || '')}</td>
                <td>${utils.escapeHtml(item.department || '')}</td>
                <td>${utils.escapeHtml(item.presenter || '')}</td>
            `;
            
            // 행 클릭 이벤트
            row.addEventListener('click', () => {
                this.handleSpeakerSelect(item);
            });
            
            tbody.appendChild(row);
        });
        
        // 표 완성
        table.appendChild(thead);
        table.appendChild(tbody);
        
        // 목록에 표 추가
        this.speakersList.appendChild(table);
        
        // 언어 텍스트 업데이트
        i18nService.updateAllTexts();
    }

    /**
     * 발표자 선택 처리
     * @param {Object} speaker - 선택된 발표자 데이터
     */
    handleSpeakerSelect(speaker) {
        // 선택된 행 하이라이트
        const rows = this.speakersList.querySelectorAll('.speaker-item');
        rows.forEach(row => {
            row.classList.remove('selected');
        });
        
        const selectedRow = this.speakersList.querySelector(`[data-speaker-id="${speaker.id || speaker.no}"]`);
        if (selectedRow) {
            selectedRow.classList.add('selected');
        }
        
        // 선택 이벤트 콜백 호출
        if (typeof this.onSpeakerSelect === 'function') {
            this.onSpeakerSelect(speaker);
        }
    }

    /**
     * 발표자 데이터 변환
     * @param {Array} rawData - 원시 발표자 데이터
     * @returns {Array} - 포맷팅된 발표자 데이터
     */
    static formatSpeakerData(rawData) {
        if (!Array.isArray(rawData)) {
            console.error('Invalid speaker data format');
            return [];
        }
        
        // 원본 데이터 형식에 따라 키 이름을 적절히 변환
        return rawData.map((item, index) => {
            return {
                id: `speaker-${index + 1}`,
                no: index + 1,
                topic: item['발표주제'] || item['Presentation topic'] || item.topic || '',
                group: item['그룹'] || item.group || '',
                department: item['부서'] || item.department || item['Team'] || '',
                presenter: item['발표자'] || item.presenter || item['Mr.'] || ''
            };
        });
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const speakersManager = new SpeakersManager();
export default speakersManager;
