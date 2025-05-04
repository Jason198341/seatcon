/**
 * 전시물 관리 모듈
 * 
 * 컨퍼런스의 전시물 목록을 관리하고 화면에 표시하는 기능을 제공합니다.
 */

import CONFIG from './config.js';
import i18nService from './i18n.js';

class ExhibitionManager {
    constructor() {
        // DOM 요소 참조
        this.exhibitionContainer = null;
        this.exhibitionList = null;
        this.exhibitionButton = null;
        this.exhibitionModal = null;
        this.exhibitionSearchInput = null;
        
        // 전시물 데이터
        this.exhibitionItems = [];
        
        // 필터링 상태
        this.currentFilter = '';
    }

    /**
     * 초기화
     */
    init() {
        // DOM 요소 참조 가져오기
        this.exhibitionContainer = document.getElementById('exhibitionContainer');
        this.exhibitionList = document.getElementById('exhibitionList');
        this.exhibitionButton = document.getElementById('exhibitionButton');
        this.exhibitionModal = document.getElementById('exhibitionModal');
        this.exhibitionSearchInput = document.getElementById('exhibitionSearch');
        
        if (!this.exhibitionContainer || !this.exhibitionList) {
            console.error('Exhibition elements not found in DOM');
            return false;
        }
        
        // 전시물 데이터 로드
        this.loadExhibitionData();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('ExhibitionManager initialized');
        }
        
        return true;
    }

    /**
     * 전시물 데이터 로드
     */
    loadExhibitionData() {
        // 전시물 데이터 (하드코딩된 데이터)
        this.exhibitionItems = [
            { id: 1, name: "차세대 코어 메커니즘 개발", company: "대원정밀공업", contact: "진우재 팀장", phone: "010 8761 5269", email: "woojae_jin@dwjm.co.kr" },
            { id: 2, name: "LCD 터치 디스플레이 백 시트 공기 청정기", company: "대유에이텍", contact: "김상현 매니저", phone: "010 9463 3658", email: "shkim@dayou.co.kr" },
            { id: 3, name: "후석 공압식 시트", company: "대유에이텍", contact: "문지환 매니저", phone: "010 3123 6929", email: "mason@dayou.co.kr" },
            { id: 4, name: "후석 공압식 시트_발판", company: "대유에이텍", contact: "문지환 매니저", phone: "010 3123 6929", email: "mason@dayou.co.kr" },
            { id: 5, name: "롤러식 마사지 모듈적용 라운지 릴렉스 시트", company: "대원산업", contact: "신재광 책임", phone: "010 8720 4434", email: "jkshin@dwsu.co.kr" },
            { id: 6, name: "롤러식 마사지 모듈적용 라운지 릴렉스 시트", company: "대원산업", contact: "신재광 책임", phone: "010 8720 4434", email: "jkshin@dwsu.co.kr" },
            { id: 7, name: "Seat Components: Cushion Extension (Manual)", company: "Brose India", contact: "Pradnyesh Patil", phone: "+91 9552537275", email: "Pradnyesh.patil@brose.com" },
            { id: 8, name: "Seat Components: Calf Rest (Legrest)", company: "Brose India", contact: "Jeong, Gwang-Ho", phone: "+91 7720095473", email: "Gwang-Ho.Jeong@brose.com" },
            { id: 9, name: "Seat Components: Rear Power Striker", company: "Brose India", contact: "", phone: "", email: "" },
            { id: 10, name: "Seat Components: Lumbar Support (Power mechanical)", company: "Brose India", contact: "", phone: "", email: "" },
            { id: 11, name: "Seat structure: 8 way Power seat with BLDC", company: "Brose India", contact: "", phone: "", email: "" },
            { id: 12, name: "Seat Structure: Reference seat (Light weight & cost efficient)", company: "Brose India", contact: "", phone: "", email: "" },
            { id: 13, name: "Seat Structure: Relax seat(combined with all comfrot features)", company: "Brose India", contact: "", phone: "", email: "" },
            { id: 14, name: "Complete seat: Slim seat with belt integration", company: "Brose India", contact: "", phone: "", email: "" },
            { id: 15, name: "Seat Components: Power Cushion Extension", company: "Brose India", contact: "", phone: "", email: "" },
            { id: 16, name: "롤러 마사지 시트", company: "디에스시동탄", contact: "최민식 책임", phone: "010-4582-4830", email: "mschoi2@godsc.co.kr" },
            { id: 17, name: "파워스트라이크 적용시트", company: "디에스시동탄", contact: "황인창 책임", phone: "010-2547-7249", email: "ichwang@godsc.co.kr" },
            { id: 18, name: "개인특화 엔터테인먼트 시트", company: "디에스시동탄", contact: "박문수 매니저", phone: "010-7232-8140", email: "mspark@godsc.co.kr" },
            { id: 19, name: "파워롱레일+파워스위블 적용 시트(스위블 브레이크 모듈 별도 전시)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 20, name: "매뉴얼 릴렉션 시트#1 - 레버타입(틸팅 & 릴렉션)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 21, name: "매뉴얼 릴렉션 시트#2 - 버튼타입", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 22, name: "파워 릴렉션 시트#1 - 4절 링크타입", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 23, name: "파워 릴렉션 시트#2 - 5절 링크타입", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 24, name: "백 연동 다단 암레스트 시트", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 25, name: "CORE(DTP10h/DRM10h/DRP10h)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 26, name: "고강도 래치(2단 / 1단 - 2종 전시)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 27, name: "무빙 블레이드 매뉴얼 롱레일", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 28, name: "고성능 스마트 릴리즈 액츄에이터", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 29, name: "경형 표준프레임 1열(MQ4i 현지화 대응)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 30, name: "신흥국 2열 프레임 - 6측 프레임(MQ4i 현지화 대응)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 31, name: "신흥국 2열 프레임 - 4측 프레임(MQ4i 현지화 대응)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 32, name: "신흥국 2열 프레임 - 릴렉션(MQ4i 현지화 대응)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 33, name: "신흥국 3열 프레임(MQ4i 현지화 대응)", company: "다스", contact: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
            { id: 34, name: "Air-tube형 통풍시트 원단", company: "케이엠모터스㈜", contact: "안윤희 전무(연구소장)", phone: "010 3000 5686", email: "hiyhahn@naver.com" },
            { id: 35, name: "통풍 시트", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 36, name: "Rubbing Massage 시트", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 37, name: "Adaptive 시트", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 38, name: "통풍+맛사지 시트", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 39, name: "Multi function seat", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 40, name: "CDS 부품", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 41, name: "CHS 부품", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 42, name: "OCS 부품", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 43, name: "통풍 부품", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 44, name: "공압 제품", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 45, name: "SBR", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 46, name: "Seat Heater", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 47, name: "공압", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 48, name: "통풍", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 49, name: "공압", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 50, name: "히터 및 기타", company: "AEW", contact: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
            { id: 51, name: "Lear ComfortMaxR & Core Mechanism", company: "리어코리아", contact: "김용환 책임", phone: "010 3778 6934", email: "jkim@lear.com" },
            { id: 52, name: "경형프레임 매뉴얼 레그레스트", company: "현대트랜시스", contact: "황성준 연구", phone: "010-2773-3723", email: "sungjunh@hyundai-transys.com" },
            { id: 53, name: "2세대 경형 슬림 백 프레임", company: "현대트랜시스", contact: "황성준 연구", phone: "010-2773-3723", email: "sungjunh@hyundai-transys.com" },
            { id: 54, name: "경형 프레임(MNL/PWR)", company: "현대트랜시스", contact: "황성준 연구", phone: "010-2773-3723", email: "sungjunh@hyundai-transys.com" },
            { id: 55, name: "콘솔 레일", company: "현대트랜시스", contact: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
            { id: 56, name: "매뉴얼 리클라이너", company: "현대트랜시스", contact: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
            { id: 57, name: "파워 리클라이너", company: "현대트랜시스", contact: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
            { id: 58, name: "대칭 매뉴얼/파워 레일", company: "현대트랜시스", contact: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
            { id: 59, name: "비대칭 매뉴얼/파워 레일", company: "현대트랜시스", contact: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
            { id: 60, name: "펌핑", company: "현대트랜시스", contact: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
            { id: 61, name: "제어기 일체형 블로워 모듈", company: "현대트랜시스", contact: "이화준 연구", phone: "031-5177-9246", email: "82104532@hyundai-transys.com" },
            { id: 62, name: "후석 센터 암레스트 직구동 파워사양 선행 연구", company: "현대트랜시스", contact: "송혁 책임", phone: "010-2640-8509", email: "good4jay@hyundai-transys.com" },
            { id: 63, name: "SUV차종 2열 워크쓰루 공간 확보를 위한 독립시트 암레스트 백 수납 구조 개발", company: "현대트랜시스", contact: "조용진 연구", phone: "010-2656-5415", email: "dragonj0@hyundai-transys.com" }
        ];
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log(`Loaded ${this.exhibitionItems.length} exhibition items`);
        }
        
        // 기업별 정렬
        this.exhibitionItems.sort((a, b) => a.company.localeCompare(b.company));
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모달 열기 버튼 클릭 이벤트
        if (this.exhibitionButton) {
            this.exhibitionButton.addEventListener('click', () => {
                this.openExhibitionModal();
            });
        }
        
        // 모달 닫기 버튼 클릭 이벤트
        const closeButtons = document.querySelectorAll('.exhibition-modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeExhibitionModal();
            });
        });
        
        // 모달 배경 클릭 시 닫기
        if (this.exhibitionModal) {
            this.exhibitionModal.addEventListener('click', (e) => {
                if (e.target === this.exhibitionModal) {
                    this.closeExhibitionModal();
                }
            });
        }
        
        // ESC 키 누를 때 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.exhibitionModal && 
                this.exhibitionModal.classList.contains('show')) {
                this.closeExhibitionModal();
            }
        });
        
        // 검색 입력 이벤트
        if (this.exhibitionSearchInput) {
            this.exhibitionSearchInput.addEventListener('input', (e) => {
                this.filterExhibitions(e.target.value.trim().toLowerCase());
            });
        }
        
        // 기업별 필터링 버튼 이벤트 - 동적으로 추가되는 요소라 이벤트 위임 사용
        if (this.exhibitionList) {
            this.exhibitionList.addEventListener('click', (e) => {
                if (e.target.classList.contains('company-filter')) {
                    const company = e.target.dataset.company;
                    this.filterByCompany(company);
                    e.preventDefault();
                }
            });
        }
    }

    /**
     * 모달 열기
     */
    openExhibitionModal() {
        if (!this.exhibitionModal) return;
        
        // 목록 렌더링
        this.renderExhibitionList();
        
        // 모달 표시
        this.exhibitionModal.style.display = 'flex';
        setTimeout(() => {
            this.exhibitionModal.classList.add('show');
        }, 10);
        
        // 스크롤 막기
        document.body.classList.add('modal-open');
        
        // 검색창에 포커스
        if (this.exhibitionSearchInput) {
            setTimeout(() => {
                this.exhibitionSearchInput.focus();
            }, 100);
        }
    }

    /**
     * 모달 닫기
     */
    closeExhibitionModal() {
        if (!this.exhibitionModal) return;
        
        // 모달 숨기기
        this.exhibitionModal.classList.remove('show');
        setTimeout(() => {
            this.exhibitionModal.style.display = 'none';
        }, 300);
        
        // 스크롤 복원
        document.body.classList.remove('modal-open');
        
        // 검색 입력 초기화
        if (this.exhibitionSearchInput) {
            this.exhibitionSearchInput.value = '';
        }
        
        // 필터 초기화
        this.currentFilter = '';
    }

    /**
     * 전시물 목록 렌더링
     */
    renderExhibitionList() {
        if (!this.exhibitionList) return;
        
        // 기업별 그룹화
        const groupedItems = this.groupByCompany(this.exhibitionItems);
        
        // 필터링된 아이템 가져오기
        const filteredItems = this.getFilteredItems();
        
        // 목록 초기화
        this.exhibitionList.innerHTML = '';
        
        // 검색 결과 카운트
        const resultCount = document.createElement('div');
        resultCount.className = 'search-result-count';
        resultCount.textContent = i18nService.get('exhibitionResultCount').replace('{count}', filteredItems.length);
        this.exhibitionList.appendChild(resultCount);
        
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
            this.exhibitionList.appendChild(filterInfo);
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
        if (!this.exhibitionList || !items.length) return;
        
        const table = document.createElement('table');
        table.className = 'exhibition-table';
        
        // 테이블 헤더
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        ['exhibitionNumber', 'exhibitionName', 'exhibitionCompany', 'exhibitionContact', 'exhibitionPhone', 'exhibitionEmail'].forEach(key => {
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
            
            // 전시물명
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            row.appendChild(nameCell);
            
            // 회사명
            const companyCell = document.createElement('td');
            const companyLink = document.createElement('a');
            companyLink.href = '#';
            companyLink.className = 'company-filter';
            companyLink.dataset.company = item.company;
            companyLink.textContent = item.company;
            companyCell.appendChild(companyLink);
            row.appendChild(companyCell);
            
            // 담당자
            const contactCell = document.createElement('td');
            contactCell.textContent = item.contact || '-';
            row.appendChild(contactCell);
            
            // 연락처
            const phoneCell = document.createElement('td');
            if (item.phone) {
                const phoneLink = document.createElement('a');
                phoneLink.href = `tel:${item.phone.replace(/\s/g, '')}`;
                phoneLink.textContent = item.phone;
                phoneCell.appendChild(phoneLink);
            } else {
                phoneCell.textContent = '-';
            }
            row.appendChild(phoneCell);
            
            // 이메일
            const emailCell = document.createElement('td');
            if (item.email) {
                const emailLink = document.createElement('a');
                emailLink.href = `mailto:${item.email}`;
                emailLink.textContent = item.email;
                emailCell.appendChild(emailLink);
            } else {
                emailCell.textContent = '-';
            }
            row.appendChild(emailCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        this.exhibitionList.appendChild(table);
    }

    /**
     * 그룹화된 목록 렌더링
     * @param {Object} groups - 회사별로 그룹화된 아이템
     */
    renderGroupedList(groups) {
        if (!this.exhibitionList) return;
        
        // 회사 목록
        const companyList = document.createElement('div');
        companyList.className = 'company-list';
        
        Object.keys(groups).sort().forEach(company => {
            const items = groups[company];
            
            // 회사 섹션
            const companySection = document.createElement('div');
            companySection.className = 'company-section';
            
            // 회사 헤더
            const companyHeader = document.createElement('div');
            companyHeader.className = 'company-header';
            
            const companyName = document.createElement('h3');
            companyName.textContent = company;
            
            const itemCount = document.createElement('span');
            itemCount.className = 'item-count';
            itemCount.textContent = `(${items.length})`;
            
            companyHeader.appendChild(companyName);
            companyHeader.appendChild(itemCount);
            companySection.appendChild(companyHeader);
            
            // 아이템 목록
            const itemList = document.createElement('ul');
            itemList.className = 'item-list';
            
            items.forEach(item => {
                const listItem = document.createElement('li');
                
                const itemName = document.createElement('div');
                itemName.className = 'item-name';
                itemName.textContent = `${item.id}. ${item.name}`;
                
                const itemDetails = document.createElement('div');
                itemDetails.className = 'item-details';
                
                if (item.contact) {
                    const contact = document.createElement('span');
                    contact.className = 'item-contact';
                    contact.textContent = item.contact;
                    itemDetails.appendChild(contact);
                }
                
                if (item.phone) {
                    const phone = document.createElement('a');
                    phone.className = 'item-phone';
                    phone.href = `tel:${item.phone.replace(/\s/g, '')}`;
                    phone.textContent = item.phone;
                    itemDetails.appendChild(phone);
                }
                
                if (item.email) {
                    const email = document.createElement('a');
                    email.className = 'item-email';
                    email.href = `mailto:${item.email}`;
                    email.textContent = item.email;
                    itemDetails.appendChild(email);
                }
                
                listItem.appendChild(itemName);
                listItem.appendChild(itemDetails);
                itemList.appendChild(listItem);
            });
            
            companySection.appendChild(itemList);
            companyList.appendChild(companySection);
        });
        
        this.exhibitionList.appendChild(companyList);
    }

    /**
     * 회사별로 아이템 그룹화
     * @param {Array} items - 그룹화할 아이템 목록
     * @returns {Object} - 회사별로 그룹화된 아이템
     */
    groupByCompany(items) {
        const groups = {};
        
        items.forEach(item => {
            if (!groups[item.company]) {
                groups[item.company] = [];
            }
            groups[item.company].push(item);
        });
        
        return groups;
    }

    /**
     * 필터링된 아이템 가져오기
     * @returns {Array} - 필터링된 아이템 목록
     */
    getFilteredItems() {
        if (!this.currentFilter) {
            return [...this.exhibitionItems];
        }
        
        return this.exhibitionItems.filter(item => {
            // 회사명으로 필터링
            if (this.currentFilter.startsWith('company:')) {
                const company = this.currentFilter.substring(8);
                return item.company.toLowerCase() === company.toLowerCase();
            }
            
            // 검색어로 필터링
            const searchLower = this.currentFilter.toLowerCase();
            return item.name.toLowerCase().includes(searchLower) ||
                   item.company.toLowerCase().includes(searchLower) ||
                   (item.contact && item.contact.toLowerCase().includes(searchLower)) ||
                   (item.email && item.email.toLowerCase().includes(searchLower));
        });
    }

    /**
     * 전시물 검색 필터링
     * @param {string} query - 검색어
     */
    filterExhibitions(query) {
        this.currentFilter = query;
        this.renderExhibitionList();
    }

    /**
     * 회사별 필터링
     * @param {string} company - 회사명
     */
    filterByCompany(company) {
        if (!company) return;
        
        this.currentFilter = `company:${company}`;
        
        // 검색 입력창 업데이트
        if (this.exhibitionSearchInput) {
            this.exhibitionSearchInput.value = company;
        }
        
        this.renderExhibitionList();
    }

    /**
     * 필터 초기화
     */
    clearFilter() {
        this.currentFilter = '';
        
        // 검색 입력창 초기화
        if (this.exhibitionSearchInput) {
            this.exhibitionSearchInput.value = '';
        }
        
        this.renderExhibitionList();
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const exhibitionManager = new ExhibitionManager();
export default exhibitionManager;
