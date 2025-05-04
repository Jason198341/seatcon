/**
 * 발표자 관리 모듈
 * 
 * 컨퍼런스의 발표자 정보를 관리하고 화면에 표시하는 기능을 제공합니다.
 */

import CONFIG from './config.js';
import i18nService from './i18n.js';

class SpeakersManager {
    constructor() {
        // DOM 요소 참조
        this.speakersContainer = null;
        this.speakersList = null;
        this.speakersButton = null;
        this.speakersModal = null;
        this.speakersSearchInput = null;
        
        // 발표자 데이터
        this.speakersItems = [];
        
        // 필터링 상태
        this.currentFilter = '';
    }

    /**
     * 초기화
     */
    init() {
        // DOM 요소 참조 가져오기
        this.speakersContainer = document.getElementById('speakersContainer');
        this.speakersList = document.getElementById('speakersList');
        this.speakersButton = document.getElementById('speakersButton');
        this.speakersModal = document.getElementById('speakersModal');
        this.speakersSearchInput = document.getElementById('speakersSearch');
        
        if (!this.speakersContainer || !this.speakersList) {
            console.error('Speakers elements not found in DOM');
            return false;
        }
        
        // 발표자 데이터 로드
        this.loadSpeakersData();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('SpeakersManager initialized');
        }
        
        return true;
    }

    /**
     * 발표자 데이터 로드
     */
    loadSpeakersData() {
        // 발표자 데이터 (하드코딩된 데이터)
        this.speakersItems = [
            { id: 1, topic: "24~25년 시트 TRM 기술 트랜드 분석", group: "남양", department: "MLV내장설계1팀", presenter: "나선채 책임", englishTopic: "24~25 Seat TRM Technology Trend Analysis" },
            { id: 2, topic: "Feature 기반 시트 중장기 개발 전략", group: "남양", department: "바디선행개발팀", presenter: "이상학 책임", englishTopic: "Feature-Based Seat Mid - to Long-Term Development Strategy" },
            { id: 3, topic: "바디 아키텍처 운영 전략", group: "남양", department: "아키텍처시스템기획팀", presenter: "백설 책임", englishTopic: "Body Architecture Operation Strategy" },
            { id: 4, topic: "SDV 개발전략과 바디부문 대응방안", group: "남양", department: "바디융합선행개발팀", presenter: "이상현 책임", englishTopic: "SDV Development Strategy and Body Division Response Plan" },
            { id: 5, topic: "현대내장디자인 미래 운영전략", group: "남양", department: "현대내장디자인실", presenter: "하성동 선임", englishTopic: "Hyundai Interior Design Future Operation Strategy" },
            { id: 6, topic: "기아 시트 미래 운영전력", group: "남양", department: "기아넥스트내장DeX팀", presenter: "노태형 책임", englishTopic: "Kia Seat Future Operating Power" },
            { id: 7, topic: "시트관련 미래 재료운영전략", group: "남양", department: "내외장재료개발팀", presenter: "서원진 책임", englishTopic: "Seat-Related Future Material Management Strategy" },
            { id: 8, topic: "유럽 시트 관련 경쟁사 트랜드 및 고객 니즈", group: "해외연구소", department: "유럽연구소", presenter: "김현우 수석", englishTopic: "European Competitors' Trends and Customer Needs Related to Seats" },
            { id: 9, topic: "중국 시트 관련 경쟁사 트랜드 및 고객 니즈", group: "해외연구소", department: "중국연구소", presenter: "장이젠 책임", englishTopic: "Chinese Competitors' Trends and Customer Needs Related to Seats" },
            { id: 10, topic: "인도네시아 시트 관련 경쟁사 트랜드 및 고객 니즈", group: "해외연구소", department: "인도네시아연구소", presenter: "세티아완 책임", englishTopic: "Indonesian Competitors' Trends and Customer Needs Related to Seats" }
        ];
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log(`Loaded ${this.speakersItems.length} speaker items`);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모달 열기 버튼 클릭 이벤트
        if (this.speakersButton) {
            this.speakersButton.addEventListener('click', () => {
                this.openSpeakersModal();
            });
        }
        
        // 모달 닫기 버튼 클릭 이벤트
        const closeButtons = document.querySelectorAll('.speakers-modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeSpeakersModal();
            });
        });
        
        // 모달 배경 클릭 시 닫기
        if (this.speakersModal) {
            this.speakersModal.addEventListener('click', (e) => {
                if (e.target === this.speakersModal) {
                    this.closeSpeakersModal();
                }
            });
        }
        
        // ESC 키 누를 때 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.speakersModal && 
                this.speakersModal.classList.contains('show')) {
                this.closeSpeakersModal();
            }
        });
        
        // 검색 입력 이벤트
        if (this.speakersSearchInput) {
            this.speakersSearchInput.addEventListener('input', (e) => {
                this.filterSpeakers(e.target.value.trim().toLowerCase());
            });
        }
        
        // 그룹별 필터링 버튼 이벤트 - 동적으로 추가되는 요소라 이벤트 위임 사용
        if (this.speakersList) {
            this.speakersList.addEventListener('click', (e) => {
                if (e.target.classList.contains('group-filter')) {
                    const group = e.target.dataset.group;
                    this.filterByGroup(group);
                    e.preventDefault();
                }
            });
        }
    }

    /**
     * 모달 열기
     */
    openSpeakersModal() {
        if (!this.speakersModal) return;
        
        // 목록 렌더링
        this.renderSpeakersList();
        
        // 모달 표시
        this.speakersModal.style.display = 'flex';
        setTimeout(() => {
            this.speakersModal.classList.add('show');
        }, 10);
        
        // 스크롤 막기
        document.body.classList.add('modal-open');
        
        // 검색창에 포커스
        if (this.speakersSearchInput) {
            setTimeout(() => {
                this.speakersSearchInput.focus();
            }, 100);
        }
    }

    /**
     * 모달 닫기
     */
    closeSpeakersModal() {
        if (!this.speakersModal) return;
        
        // 모달 숨기기
        this.speakersModal.classList.remove('show');
        setTimeout(() => {
            this.speakersModal.style.display = 'none';
        }, 300);
        
        // 스크롤 복원
        document.body.classList.remove('modal-open');
        
        // 검색 입력 초기화
        if (this.speakersSearchInput) {
            this.speakersSearchInput.value = '';
        }
        
        // 필터 초기화
        this.currentFilter = '';
    }

    /**
     * 발표자 목록 렌더링
     */
    renderSpeakersList() {
        if (!this.speakersList) return;
        
        // 그룹별 그룹화
        const groupedItems = this.groupByCategory(this.speakersItems);
        
        // 필터링된 아이템 가져오기
        const filteredItems = this.getFilteredItems();
        
        // 목록 초기화
        this.speakersList.innerHTML = '';
        
        // 검색 결과 카운트
        const resultCount = document.createElement('div');
        resultCount.className = 'search-result-count';
        resultCount.textContent = i18nService.get('speakersResultCount').replace('{count}', filteredItems.length);
        this.speakersList.appendChild(resultCount);
        
        // 필터 표시
        if (this.currentFilter) {
            const filterInfo = document.createElement('div');
            filterInfo.className = 'filter-info';
            
            const filterText = document.createElement('span');
            filterText.textContent = i18nService.get('currentFilter').replace('{filter}', this.currentFilter);
            
            const clearFilter = document.createElement('button');
            clearFilter.className = 'clear-filter';
            clearFilter.textContent = i18nService.get('clearFilter');
            clearFilter.addEventListener('click', () => {
                this.clearFilter();
            });
            
            filterInfo.appendChild(filterText);
            filterInfo.appendChild(clearFilter);
            this.speakersList.appendChild(filterInfo);
        }
        
        // 그룹화된 목록 렌더링
        if (this.currentFilter) {
            // 필터 적용 시 평면 목록으로 표시
            this.renderFilteredList(filteredItems);
        } else {
            // 필터 없을 때 그룹화 목록
            this.renderGroupedList(groupedItems);
        }
    }

    /**
     * 필터링된 목록 렌더링
     * @param {Array} items - 필터링된 아이템 목록
     */
    renderFilteredList(items) {
        if (!this.speakersList || !items.length) return;
        
        const table = document.createElement('table');
        table.className = 'speakers-table';
        
        // 테이블 헤더
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        ['speakersNumber', 'speakersTopic', 'speakersGroup', 'speakersDepartment', 'speakersPresenter'].forEach(key => {
            const th = document.createElement('th');
            th.textContent = i18nService.get(key);
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // 테이블 바디
        const tbody = document.createElement('tbody');
        
        items.forEach(item => {
            const row = document.createElement('tr');
            
            // 번호
            const idCell = document.createElement('td');
            idCell.textContent = item.id;
            row.appendChild(idCell);
            
            // 발표 주제
            const topicCell = document.createElement('td');
            topicCell.textContent = item.topic;
            
            // 영문 주제가 있으면 툴팁으로 표시
            if (item.englishTopic) {
                topicCell.title = item.englishTopic;
                topicCell.classList.add('has-tooltip');
            }
            
            row.appendChild(topicCell);
            
            // 그룹
            const groupCell = document.createElement('td');
            const groupLink = document.createElement('a');
            groupLink.href = '#';
            groupLink.className = 'group-filter';
            groupLink.dataset.group = item.group;
            groupLink.textContent = item.group;
            groupCell.appendChild(groupLink);
            row.appendChild(groupCell);
            
            // 부서
            const departmentCell = document.createElement('td');
            departmentCell.textContent = item.department;
            row.appendChild(departmentCell);
            
            // 발표자
            const presenterCell = document.createElement('td');
            presenterCell.textContent = item.presenter;
            row.appendChild(presenterCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        this.speakersList.appendChild(table);
    }

    /**
     * 그룹화된 목록 렌더링
     * @param {Object} groups - 그룹별로 그룹화된 아이템
     */
    renderGroupedList(groups) {
        if (!this.speakersList) return;
        
        // 그룹 목록
        const groupList = document.createElement('div');
        groupList.className = 'group-list';
        
        // 지정된 순서로 그룹 정렬
        const groupOrder = ['남양', '해외연구소'];
        const sortedGroups = Object.keys(groups).sort((a, b) => {
            const indexA = groupOrder.indexOf(a);
            const indexB = groupOrder.indexOf(b);
            
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        
        sortedGroups.forEach(group => {
            const items = groups[group];
            
            // 그룹 섹션
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';
            
            // 그룹 헤더
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            
            const groupName = document.createElement('h3');
            groupName.textContent = group;
            
            const itemCount = document.createElement('span');
            itemCount.className = 'item-count';
            itemCount.textContent = `(${items.length})`;
            
            groupHeader.appendChild(groupName);
            groupHeader.appendChild(itemCount);
            groupSection.appendChild(groupHeader);
            
            // 아이템 목록
            const itemList = document.createElement('div');
            itemList.className = 'presentation-list';
            
            items.forEach(item => {
                const presentationItem = document.createElement('div');
                presentationItem.className = 'presentation-item';
                
                // 발표 번호
                const itemNumber = document.createElement('div');
                itemNumber.className = 'presentation-number';
                itemNumber.textContent = item.id;
                
                // 발표 정보
                const itemInfo = document.createElement('div');
                itemInfo.className = 'presentation-info';
                
                // 발표 주제
                const topicElement = document.createElement('div');
                topicElement.className = 'presentation-topic';
                topicElement.textContent = item.topic;
                
                // 영문 주제가 있으면 툴팁으로 표시
                if (item.englishTopic) {
                    topicElement.title = item.englishTopic;
                    topicElement.classList.add('has-tooltip');
                }
                
                // 발표자 정보
                const presenterInfo = document.createElement('div');
                presenterInfo.className = 'presenter-info';
                
                const departmentElement = document.createElement('span');
                departmentElement.className = 'department';
                departmentElement.textContent = item.department;
                
                const presenterElement = document.createElement('span');
                presenterElement.className = 'presenter';
                presenterElement.textContent = item.presenter;
                
                presenterInfo.appendChild(departmentElement);
                presenterInfo.appendChild(document.createTextNode(' '));
                presenterInfo.appendChild(presenterElement);
                
                itemInfo.appendChild(topicElement);
                itemInfo.appendChild(presenterInfo);
                
                presentationItem.appendChild(itemNumber);
                presentationItem.appendChild(itemInfo);
                
                itemList.appendChild(presentationItem);
            });
            
            groupSection.appendChild(itemList);
            groupList.appendChild(groupSection);
        });
        
        this.speakersList.appendChild(groupList);
    }

    /**
     * 카테고리별로 아이템 그룹화
     * @param {Array} items - 그룹화할 아이템 목록
     * @returns {Object} - 카테고리별로 그룹화된 아이템
     */
    groupByCategory(items) {
        const groups = {};
        
        items.forEach(item => {
            if (!groups[item.group]) {
                groups[item.group] = [];
            }
            groups[item.group].push(item);
        });
        
        return groups;
    }

    /**
     * 필터링된 아이템 가져오기
     * @returns {Array} - 필터링된 아이템 목록
     */
    getFilteredItems() {
        if (!this.currentFilter) {
            return [...this.speakersItems];
        }
        
        return this.speakersItems.filter(item => {
            // 그룹으로 필터링
            if (this.currentFilter.startsWith('group:')) {
                const group = this.currentFilter.substring(6);
                return item.group.toLowerCase() === group.toLowerCase();
            }
            
            // 검색어로 필터링
            const searchLower = this.currentFilter.toLowerCase();
            return item.topic.toLowerCase().includes(searchLower) ||
                   (item.englishTopic && item.englishTopic.toLowerCase().includes(searchLower)) ||
                   item.group.toLowerCase().includes(searchLower) ||
                   item.department.toLowerCase().includes(searchLower) ||
                   item.presenter.toLowerCase().includes(searchLower);
        });
    }

    /**
     * 발표자 필터링
     * @param {string} query - 검색어
     */
    filterSpeakers(query) {
        this.currentFilter = query;
        this.renderSpeakersList();
    }

    /**
     * 그룹별 필터링
     * @param {string} group - 그룹명
     */
    filterByGroup(group) {
        if (!group) return;
        
        this.currentFilter = `group:${group}`;
        
        // 검색 입력창 업데이트
        if (this.speakersSearchInput) {
            this.speakersSearchInput.value = group;
        }
        
        this.renderSpeakersList();
    }

    /**
     * 필터 초기화
     */
    clearFilter() {
        this.currentFilter = '';
        
        // 검색 입력창 초기화
        if (this.speakersSearchInput) {
            this.speakersSearchInput.value = '';
        }
        
        this.renderSpeakersList();
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const speakersManager = new SpeakersManager();
export default speakersManager;
