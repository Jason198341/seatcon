/**
 * 사이드바 컴포넌트
 * 사이드바 UI 및 데이터 표시 관리
 */
class SidebarComponent {
    /**
     * 사이드바 컴포넌트 생성자
     * @param {Object} dataManager - 데이터 관리자
     * @param {Object} userService - 사용자 서비스
     * @param {Object} logger - 로거 서비스
     */
    constructor(dataManager, userService, logger) {
        this.dataManager = dataManager;
        this.userService = userService;
        this.logger = logger || console;
        this.elements = {
            // 정보 패널 (좌측)
            infoPanel: null,
            exhibitorsTab: null,
            scheduleTab: null,
            exhibitorsList: null,
            scheduleList: null,
            exhibitorSearch: null,
            scheduleSearch: null,
            
            // 참가자 패널 (우측)
            participantsPanel: null,
            participantsList: null,
            participantSearch: null,
            participantFilters: null,
        };
        this.currentTab = 'exhibitors';
        this.currentFilter = 'all';
        this.exhibitorDisplayMode = 'list'; // 'list' 또는 'category'
        
        this.init();
        // 참가자 실시간 구독 시작 (supabaseClient는 window에서 참조)
        if (window.supabaseClient) {
            this.subscribeParticipantsRealtime(window.supabaseClient);
        }
    }

    /**
     * 사이드바 컴포넌트 초기화
     */
    init() {
        try {
            this.logger.info('사이드바 컴포넌트 초기화 중...');
            
            // DOM 요소 참조 가져오기
            this.elements.infoPanel = document.getElementById('info-panel');
            this.elements.exhibitorsTab = document.getElementById('exhibitors-tab');
            this.elements.scheduleTab = document.getElementById('schedule-tab');
            this.elements.exhibitorsList = document.querySelector('.exhibitors-list');
            this.elements.scheduleList = document.querySelector('.schedule-list');
            this.elements.exhibitorSearch = document.querySelector('.exhibitor-search');
            this.elements.scheduleSearch = document.querySelector('.schedule-search');
            
            this.elements.participantsPanel = document.getElementById('participants-panel');
            this.elements.participantsList = document.querySelector('.participants-list');
            this.elements.participantSearch = document.querySelector('.participant-search');
            this.elements.participantFilters = document.querySelectorAll('.participant-filter');
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            this.logger.info('사이드바 컴포넌트 초기화 완료');
        } catch (error) {
            this.logger.error('사이드바 컴포넌트 초기화 중 오류 발생:', error);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        try {
            // 탭 전환 이벤트
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', this.handleTabClick.bind(this));
            });
            
            // 검색 이벤트
            this.elements.exhibitorSearch?.addEventListener('input', this.handleExhibitorSearch.bind(this));
            this.elements.scheduleSearch?.addEventListener('input', this.handleScheduleSearch.bind(this));
            this.elements.participantSearch?.addEventListener('input', this.handleParticipantSearch.bind(this));
            
            // 참가자 필터 이벤트
            this.elements.participantFilters?.forEach(filter => {
                filter.addEventListener('click', this.handleParticipantFilter.bind(this));
            });
            
            // 전시업체 탭에 헤더 메뉴 추가
            this.addExhibitorTabControls();
        } catch (error) {
            this.logger.error('이벤트 리스너 설정 중 오류 발생:', error);
        }
    }

    /**
     * 전시업체 탭 컨트롤 추가
     */
    addExhibitorTabControls() {
        if (!this.elements.exhibitorsTab) return;
        
        // 이미 헤더 메뉴가 있는지 확인
        const existingControls = this.elements.exhibitorsTab.querySelector('.exhibitor-view-controls');
        if (existingControls) return;
        
        // 헤더 메뉴 생성
        const controls = document.createElement('div');
        controls.className = 'exhibitor-view-controls';
        controls.innerHTML = `
            <div class="view-mode-buttons">
                <button class="view-mode-btn active" data-mode="list" title="목록 보기">
                    <i class="fas fa-list"></i>
                </button>
                <button class="view-mode-btn" data-mode="category" title="카테고리별 보기">
                    <i class="fas fa-th-large"></i>
                </button>
                <button class="view-mode-btn" data-mode="company" title="회사별 보기">
                    <i class="fas fa-building"></i>
                </button>
            </div>
        `;
        
        // 검색 바 뒤에 추가
        const searchBar = this.elements.exhibitorsTab.querySelector('.search-bar');
        if (searchBar) {
            searchBar.after(controls);
            
            // 뷰 모드 버튼 이벤트 리스너 추가
            controls.querySelectorAll('.view-mode-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.currentTarget.dataset.mode;
                    this.changeExhibitorDisplayMode(mode);
                    
                    // 버튼 활성화 상태 변경
                    controls.querySelectorAll('.view-mode-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    e.currentTarget.classList.add('active');
                });
            });
        }
    }

    /**
     * 전시업체 표시 모드 변경
     * @param {string} mode - 표시 모드 ('list', 'category', 'company')
     */
    changeExhibitorDisplayMode(mode) {
        if (mode === this.exhibitorDisplayMode) return;
        
        this.exhibitorDisplayMode = mode;
        this.logger.debug(`전시업체 표시 모드 변경: ${mode}`);
        
        // 검색창 값 초기화
        if (this.elements.exhibitorSearch) {
            this.elements.exhibitorSearch.value = '';
        }
        
        // 모드에 따라 전시업체 목록 업데이트
        switch (mode) {
            case 'list':
                this.updateExhibitorsList(this.dataManager.getExhibitors());
                break;
            case 'category':
                this.updateExhibitorsByCategory();
                break;
            case 'company':
                this.updateExhibitorsByCompany();
                break;
        }
    }

    /**
     * 카테고리별 전시업체 목록 업데이트
     */
    updateExhibitorsByCategory() {
        try {
            if (!this.elements.exhibitorsList) return;
            
            // 목록 비우기
            this.elements.exhibitorsList.innerHTML = '';
            
            // 카테고리별 그룹화된 데이터 가져오기
            const categorizedExhibitors = this.dataManager.getExhibitorsByCategory();
            const categories = this.dataManager.categories;
            
            if (!categories || categories.length === 0) {
                this.elements.exhibitorsList.innerHTML = `
                    <div class="empty-result">
                        <p>카테고리 정보가 없습니다.</p>
                    </div>
                `;
                return;
            }
            
            // 각 카테고리별 섹션 생성
            categories.forEach(category => {
                const exhibitors = categorizedExhibitors[category] || [];
                
                if (exhibitors.length === 0) return; // 해당 카테고리에 전시업체가 없으면 건너뜀
                
                // 카테고리 섹션 생성
                const section = document.createElement('div');
                section.className = 'category-section';
                
                // 카테고리 헤더
                const header = document.createElement('div');
                header.className = 'category-header';
                header.innerHTML = `
                    <h3 class="category-title">${category}</h3>
                    <span class="category-count">${exhibitors.length}</span>
                `;
                
                // 카테고리 콘텐츠
                const content = document.createElement('div');
                content.className = 'category-content';
                
                // 전시업체 카드 추가
                exhibitors.forEach(exhibitor => {
                    const card = this.createExhibitorCard(exhibitor);
                    content.appendChild(card);
                });
                
                // 섹션에 헤더와 콘텐츠 추가
                section.appendChild(header);
                section.appendChild(content);
                
                // 목록에 섹션 추가
                this.elements.exhibitorsList.appendChild(section);
            });
            
            this.logger.debug(`카테고리별 전시업체 목록 업데이트: ${categories.length}개 카테고리`);
        } catch (error) {
            this.logger.error('카테고리별 전시업체 목록 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 회사별 전시업체 목록 업데이트
     */
    updateExhibitorsByCompany() {
        try {
            if (!this.elements.exhibitorsList) return;
            
            // 목록 비우기
            this.elements.exhibitorsList.innerHTML = '';
            
            // 회사별 그룹화된 데이터 가져오기
            const companyExhibitors = this.dataManager.getExhibitorsByCompany();
            const companies = this.dataManager.companies;
            
            if (!companies || companies.length === 0) {
                this.elements.exhibitorsList.innerHTML = `
                    <div class="empty-result">
                        <p>회사 정보가 없습니다.</p>
                    </div>
                `;
                return;
            }
            
            // 각 회사별 섹션 생성
            companies.forEach(company => {
                const exhibitors = companyExhibitors[company] || [];
                
                if (exhibitors.length === 0) return; // 해당 회사에 전시업체가 없으면 건너뜀
                
                // 회사 섹션 생성
                const section = document.createElement('div');
                section.className = 'company-section';
                
                // 회사 헤더
                const header = document.createElement('div');
                header.className = 'company-header';
                header.innerHTML = `
                    <h3 class="company-title">${company}</h3>
                    <span class="company-count">${exhibitors.length}</span>
                `;
                
                // 회사 콘텐츠
                const content = document.createElement('div');
                content.className = 'company-content';
                
                // 전시업체 카드 추가
                exhibitors.forEach(exhibitor => {
                    const card = this.createExhibitorCard(exhibitor);
                    content.appendChild(card);
                });
                
                // 섹션에 헤더와 콘텐츠 추가
                section.appendChild(header);
                section.appendChild(content);
                
                // 목록에 섹션 추가
                this.elements.exhibitorsList.appendChild(section);
            });
            
            this.logger.debug(`회사별 전시업체 목록 업데이트: ${companies.length}개 회사`);
        } catch (error) {
            this.logger.error('회사별 전시업체 목록 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 탭 클릭 이벤트 처리
     * @param {Event} event - 이벤트 객체
     */
    handleTabClick(event) {
        try {
            const tab = event.target.dataset.tab;
            
            if (!tab || tab === this.currentTab) return;
            
            // 현재 탭 업데이트
            this.currentTab = tab;
            
            // 탭 버튼 활성화 상태 업데이트
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.dataset.tab === tab) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // 탭 콘텐츠 표시/숨김
            document.querySelectorAll('.tab-content').forEach(content => {
                if (content.id === `${tab}-tab`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
            
            this.logger.debug(`탭 전환: ${tab}`);
        } catch (error) {
            this.logger.error('탭 클릭 이벤트 처리 중 오류 발생:', error);
        }
    }

    /**
     * 전시업체 검색 이벤트 처리
     * @param {Event} event - 이벤트 객체
     */
    handleExhibitorSearch(event) {
        try {
            const query = event.target.value.trim().toLowerCase();
            
            // 모드를 목록 보기로 변경
            if (this.exhibitorDisplayMode !== 'list') {
                this.exhibitorDisplayMode = 'list';
                
                // 버튼 활성화 상태 변경
                const controls = this.elements.exhibitorsTab.querySelector('.exhibitor-view-controls');
                if (controls) {
                    controls.querySelectorAll('.view-mode-btn').forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.mode === 'list') {
                            btn.classList.add('active');
                        }
                    });
                }
            }
            
            // 검색 결과에 맞는 전시업체 목록 업데이트
            this.updateExhibitorsList(this.dataManager.searchExhibitors(query));
            
            this.logger.debug(`전시업체 검색: ${query}`);
        } catch (error) {
            this.logger.error('전시업체 검색 이벤트 처리 중 오류 발생:', error);
        }
    }

    /**
     * 일정 검색 이벤트 처리
     * @param {Event} event - 이벤트 객체
     */
    handleScheduleSearch(event) {
        try {
            const query = event.target.value.trim().toLowerCase();
            
            // 검색 결과에 맞는 일정 목록 업데이트
            this.updateScheduleList(this.dataManager.searchSchedule(query));
            
            this.logger.debug(`일정 검색: ${query}`);
        } catch (error) {
            this.logger.error('일정 검색 이벤트 처리 중 오류 발생:', error);
        }
    }

    /**
     * 참가자 검색 이벤트 처리
     * @param {Event} event - 이벤트 객체
     */
    handleParticipantSearch(event) {
        try {
            const query = event.target.value.trim().toLowerCase();
            
            // 검색 결과에 맞는 참가자 목록 업데이트
            this.updateParticipantsList(this.dataManager.searchParticipants(query));
            
            this.logger.debug(`참가자 검색: ${query}`);
        } catch (error) {
            this.logger.error('참가자 검색 이벤트 처리 중 오류 발생:', error);
        }
    }

    /**
     * 참가자 필터 이벤트 처리
     * @param {Event} event - 이벤트 객체
     */
    handleParticipantFilter(event) {
        try {
            const filter = event.target.dataset.filter;
            
            if (!filter || filter === this.currentFilter) return;
            
            // 현재 필터 업데이트
            this.currentFilter = filter;
            
            // 필터 버튼 활성화 상태 업데이트
            this.elements.participantFilters.forEach(btn => {
                if (btn.dataset.filter === filter) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // 참가자 목록 업데이트
            this.updateParticipantsList(this.dataManager.getParticipantsByRole(filter));
            
            this.logger.debug(`참가자 필터 변경: ${filter}`);
        } catch (error) {
            this.logger.error('참가자 필터 이벤트 처리 중 오류 발생:', error);
        }
    }

    /**
     * 전시업체 목록 업데이트
     * @param {Array} exhibitors - 전시업체 목록
     */
    updateExhibitorsList(exhibitors) {
        try {
            if (!this.elements.exhibitorsList) return;
            
            // 목록 비우기
            this.elements.exhibitorsList.innerHTML = '';
            
            if (!exhibitors || exhibitors.length === 0) {
                // 검색 결과가 없는 경우
                this.elements.exhibitorsList.innerHTML = `
                    <div class="empty-result">
                        <p>검색 결과가 없습니다.</p>
                    </div>
                `;
                return;
            }
            
            // 전시업체 카드 추가
            exhibitors.forEach(exhibitor => {
                const card = this.createExhibitorCard(exhibitor);
                this.elements.exhibitorsList.appendChild(card);
            });
            
            this.logger.debug(`전시업체 목록 업데이트: ${exhibitors.length}개 항목`);
        } catch (error) {
            this.logger.error('전시업체 목록 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 전시업체 카드 생성
     * @param {Object} exhibitor - 전시업체 데이터
     * @returns {HTMLElement} - 전시업체 카드 요소
     */
    createExhibitorCard(exhibitor) {
        try {
            const card = document.createElement('div');
            card.className = 'exhibitor-card';
            card.dataset.id = exhibitor.id;
            
            // 카테고리 라벨
            const categoryLabel = exhibitor.category ? 
                `<span class="category-label">${exhibitor.category}</span>` : '';
            
            card.innerHTML = `
                <div class="exhibitor-header">
                    <div class="exhibitor-name">${exhibitor.name}</div>
                    ${categoryLabel}
                </div>
                <div class="exhibitor-detail">${exhibitor.description}</div>
                <div class="exhibitor-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>부스: ${exhibitor.boothNumber || 'N/A'}</span>
                </div>
                <div class="exhibitor-contact">
                    <div class="contact-item" title="담당자">
                        <i class="fas fa-user"></i>
                        <span>${exhibitor.contactPerson || 'N/A'}</span>
                    </div>
                    <div class="contact-item" title="연락처">
                        <i class="fas fa-phone"></i>
                        <span>${exhibitor.contactPhone || 'N/A'}</span>
                    </div>
                    <div class="contact-item" title="이메일">
                        <i class="fas fa-envelope"></i>
                        <span>${exhibitor.contactEmail || 'N/A'}</span>
                    </div>
                </div>
                <div class="exhibitor-actions">
                    <button class="btn-detail" title="상세 정보">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn-contact" title="연락하기">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>
            `;
            
            // 클릭 이벤트 - 전시업체 상세 정보 표시
            card.querySelector('.btn-detail').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showExhibitorDetail(exhibitor);
            });
            
            // 클릭 이벤트 - 담당자 연락
            card.querySelector('.btn-contact').addEventListener('click', (e) => {
                e.stopPropagation();
                this.contactExhibitor(exhibitor);
            });
            
            return card;
        } catch (error) {
            this.logger.error('전시업체 카드 생성 중 오류 발생:', error);
            
            // 오류 발생 시 기본 카드 반환
            const fallbackCard = document.createElement('div');
            fallbackCard.className = 'exhibitor-card';
            fallbackCard.textContent = '정보를 표시할 수 없습니다.';
            return fallbackCard;
        }
    }

    /**
     * 전시업체 상세 정보 표시
     * @param {Object} exhibitor - 전시업체 데이터
     */
    showExhibitorDetail(exhibitor) {
        try {
            // 상세 정보 모달 또는 별도 화면 구현
            const event = new CustomEvent('sidebar:exhibitor-detail', {
                detail: { exhibitor },
            });
            document.dispatchEvent(event);
            
            this.logger.debug('전시업체 상세 정보 이벤트 발생:', exhibitor);
        } catch (error) {
            this.logger.error('전시업체 상세 정보 표시 중 오류 발생:', error);
        }
    }

    /**
     * 전시업체 담당자 연락
     * @param {Object} exhibitor - 전시업체 데이터
     */
    contactExhibitor(exhibitor) {
        try {
            // 담당자 정보로 채팅 프롬프트 생성
            const event = new CustomEvent('sidebar:contact-exhibitor', {
                detail: { exhibitor },
            });
            document.dispatchEvent(event);
            
            this.logger.debug('전시업체 담당자 연락 이벤트 발생:', exhibitor);
        } catch (error) {
            this.logger.error('전시업체 담당자 연락 중 오류 발생:', error);
        }
    }

    /**
     * 일정 목록 업데이트
     * @param {Array} schedules - 일정 목록
     */
    updateScheduleList(schedules) {
        try {
            if (!this.elements.scheduleList) return;
            
            // 목록 비우기
            this.elements.scheduleList.innerHTML = '';
            
            if (!schedules || schedules.length === 0) {
                // 검색 결과가 없는 경우
                this.elements.scheduleList.innerHTML = `
                    <div class="empty-result">
                        <p>검색 결과가 없습니다.</p>
                    </div>
                `;
                return;
            }
            
            // 날짜별로 그룹화
            const scheduleByDate = {};
            schedules.forEach(schedule => {
                const date = schedule.date || '미정';
                if (!scheduleByDate[date]) {
                    scheduleByDate[date] = [];
                }
                scheduleByDate[date].push(schedule);
            });
            
            // 날짜순으로 정렬
            const sortedDates = Object.keys(scheduleByDate).sort();
            
            // 각 날짜별 섹션 생성
            sortedDates.forEach(date => {
                const dateSection = document.createElement('div');
                dateSection.className = 'date-section';
                
                // 날짜 헤더
                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.innerHTML = `
                    <h3>${this.formatDate(date)}</h3>
                    <span class="schedule-count">${scheduleByDate[date].length}개 일정</span>
                `;
                
                // 일정 카드 추가
                const dateContent = document.createElement('div');
                dateContent.className = 'date-content';
                
                // 시간순으로 정렬
                const sortedSchedules = scheduleByDate[date].sort((a, b) => {
                    const timeA = a.time?.split(' - ')[0] || '';
                    const timeB = b.time?.split(' - ')[0] || '';
                    return timeA.localeCompare(timeB);
                });
                
                sortedSchedules.forEach(schedule => {
                    const card = this.createScheduleCard(schedule);
                    dateContent.appendChild(card);
                });
                
                // 섹션에 헤더와 콘텐츠 추가
                dateSection.appendChild(dateHeader);
                dateSection.appendChild(dateContent);
                
                // 목록에 섹션 추가
                this.elements.scheduleList.appendChild(dateSection);
            });
            
            this.logger.debug(`일정 목록 업데이트: ${schedules.length}개 항목`);
        } catch (error) {
            this.logger.error('일정 목록 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 일정 카드 생성
     * @param {Object} schedule - 일정 데이터
     * @returns {HTMLElement} - 일정 카드 요소
     */
    createScheduleCard(schedule) {
        try {
            const card = document.createElement('div');
            card.className = 'schedule-card';
            card.dataset.id = schedule.id;
            
            // 태그 생성
            let tagsHtml = '';
            if (schedule.tags && schedule.tags.length > 0) {
                tagsHtml = '<div class="schedule-tags">';
                schedule.tags.forEach(tag => {
                    tagsHtml += `<span class="tag">${tag}</span>`;
                });
                tagsHtml += '</div>';
            }
            
            card.innerHTML = `
                <div class="schedule-time">
                    <i class="far fa-clock"></i>
                    <span>${schedule.time || '시간 미정'}</span>
                </div>
                <div class="schedule-content">
                    <div class="schedule-title">${schedule.title || '제목 없음'}</div>
                    <div class="schedule-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${schedule.location || '장소 미정'}</span>
                    </div>
                    ${tagsHtml}
                </div>
                <div class="schedule-presenter">
                    <div class="presenter-avatar">${this.getInitials(schedule.presenter)}</div>
                    <div class="presenter-info">
                        <div class="presenter-name">${schedule.presenter || '발표자 미정'}</div>
                        <div class="presenter-department">${schedule.department || ''}</div>
                    </div>
                </div>
                <div class="schedule-actions">
                    <button class="btn-detail" title="상세 정보">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            `;
            
            // 클릭 이벤트 - 일정 상세 정보 표시
            card.querySelector('.btn-detail').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showScheduleDetail(schedule);
            });
            
            return card;
        } catch (error) {
            this.logger.error('일정 카드 생성 중 오류 발생:', error);
            
            // 오류 발생 시 기본 카드 반환
            const fallbackCard = document.createElement('div');
            fallbackCard.className = 'schedule-card';
            fallbackCard.textContent = '정보를 표시할 수 없습니다.';
            return fallbackCard;
        }
    }

    /**
     * 일정 상세 정보 표시
     * @param {Object} schedule - 일정 데이터
     */
    showScheduleDetail(schedule) {
        try {
            // 상세 정보 모달 또는 별도 화면 구현
            const event = new CustomEvent('sidebar:schedule-detail', {
                detail: { schedule },
            });
            document.dispatchEvent(event);
            
            this.logger.debug('일정 상세 정보 이벤트 발생:', schedule);
        } catch (error) {
            this.logger.error('일정 상세 정보 표시 중 오류 발생:', error);
        }
    }

    /**
     * 통역가 메시지 리스트를 참가자 패널에 표시
     */
    async updateInterpreterMessagesList() {
        const list = this.elements.participantsList;
        if (!list) return;
        list.innerHTML = '<div class="placeholder-item">불러오는 중...</div>';
        try {
            const messages = await window.supabaseClient.getInterpreterMessages(50);
            list.innerHTML = '';
            if (!messages || messages.length === 0) {
                list.innerHTML = '<div class="placeholder-item">통역가 메시지가 없습니다.</div>';
                return;
            }
            for (const msg of messages) {
                const item = document.createElement('div');
                item.className = 'interpreter-message-item';
                item.innerHTML = `
                    <div class="interpreter-message-meta">
                        <span class="interpreter-name">${msg.author_name || '통역가'}</span>
                        <span class="interpreter-time">${this.formatDate(msg.created_at)}</span>
                    </div>
                    <div class="interpreter-message-content">${msg.content}</div>
                `;
                list.appendChild(item);
            }
        } catch (error) {
            list.innerHTML = '<div class="placeholder-item">통역가 메시지 불러오기 실패</div>';
            this.logger.error('통역가 메시지 표시 중 오류:', error);
        }
    }

    /**
     * 사용자 이니셜 계산
     * @param {string} name - 사용자 이름
     * @returns {string} - 이니셜
     */
    getInitials(name) {
        if (!name) return '';
        
        // 한글 이름 처리 (예: "홍길동" -> "홍")
        if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3]/.test(name)) {
            return name.charAt(0);
        }
        
        // 영문 이름 처리 (예: "John Doe" -> "JD")
        const parts = name.split(' ').filter(part => part.length > 0);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    /**
     * 역할 표시 이름 가져오기
     * @param {string} role - 역할 코드
     * @returns {string} - 역할 표시 이름
     */
    getRoleDisplayName(role) {
        const map = {
            attendee: '참가자',
            exhibitor: '전시자',
            presenter: '발표자',
            staff: '스태프',
            admin: '관리자',
            interpreter: '통역사',
        };
        return map[role] || role;
    }

    /**
     * 날짜 포맷팅
     * @param {string} dateStr - 날짜 문자열
     * @returns {string} - 포맷된 날짜
     */
    formatDate(dateStr) {
        try {
            if (!dateStr || dateStr === '미정') return '날짜 미정';
            
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) {
                return dateStr;
            }
            
            // 주중 날짜 포맷 (예: 2023년 5월 15일 월요일)
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
            });
        } catch (error) {
            this.logger.error('날짜 포맷팅 중 오류 발생:', error);
            return dateStr;
        }
    }

    /**
     * 데이터 로드 및 표시
     */
    loadData() {
        try {
            // 전시업체 목록 업데이트
            if (this.exhibitorDisplayMode === 'list') {
                this.updateExhibitorsList(this.dataManager.getExhibitors());
            } else if (this.exhibitorDisplayMode === 'category') {
                this.updateExhibitorsByCategory();
            } else if (this.exhibitorDisplayMode === 'company') {
                this.updateExhibitorsByCompany();
            }
            
            // 일정 목록 업데이트
            this.updateScheduleList(this.dataManager.getSchedule());
            
            // 참가자 목록 업데이트
            this.updateParticipantsList(this.dataManager.getParticipantsByRole(this.currentFilter));
            
            this.logger.info('사이드바 데이터 로드 완료');
        } catch (error) {
            this.logger.error('사이드바 데이터 로드 중 오류 발생:', error);
        }
    }

    /**
     * 사이드바 표시 (모바일 화면에서 사용)
     * @param {string} panel - 표시할 패널 (info 또는 participants)
     */
    show(panel) {
        try {
            // 모바일 화면에서 사이드바 표시
            if (panel === 'info' && this.elements.infoPanel) {
                this.elements.infoPanel.classList.add('active');
                this.elements.infoPanel.classList.remove('hidden');
                
                if (this.elements.participantsPanel) {
                    this.elements.participantsPanel.classList.remove('active');
                    this.elements.participantsPanel.classList.add('hidden');
                }
            } else if (panel === 'participants' && this.elements.participantsPanel) {
                this.elements.participantsPanel.classList.add('active');
                this.elements.participantsPanel.classList.remove('hidden');
                
                if (this.elements.infoPanel) {
                    this.elements.infoPanel.classList.remove('active');
                    this.elements.infoPanel.classList.add('hidden');
                }
            }
            
            this.logger.debug(`사이드바 표시: ${panel}`);
        } catch (error) {
            this.logger.error('사이드바 표시 중 오류 발생:', error);
        }
    }

    /**
     * 사이드바 숨기기 (모바일 화면에서 사용)
     */
    hide() {
        try {
            // 모바일 화면에서 사이드바 숨기기
            if (this.elements.infoPanel) {
                this.elements.infoPanel.classList.remove('active');
                this.elements.infoPanel.classList.add('hidden');
            }
            
            if (this.elements.participantsPanel) {
                this.elements.participantsPanel.classList.remove('active');
                this.elements.participantsPanel.classList.add('hidden');
            }
            
            this.logger.debug('사이드바 숨김');
        } catch (error) {
            this.logger.error('사이드바 숨기기 중 오류 발생:', error);
        }
    }

    /**
     * 참가자 실시간 구독 시작
     * @param {SupabaseClient} supabaseClient
     */
    subscribeParticipantsRealtime(supabaseClient) {
        if (!supabaseClient) return;
        // comments 테이블에 실시간 구독(통역가 메시지)
        supabaseClient.supabase
            .from('comments')
            .on('*', async () => {
                await this.updateInterpreterMessagesList();
            })
            .subscribe();
        // 최초 1회 로드
        this.updateInterpreterMessagesList();
    }

    // 참가자 목록 UI 갱신 함수는 더 이상 사용하지 않음
    updateParticipantsList() {
        // 참가자 대신 통역가 메시지 표시
        this.updateInterpreterMessagesList();
    }
}

// === 실시간 참가자 목록 구독 및 UI 갱신 ===
const ONLINE_TIMEOUT_MS = 2 * 60 * 1000; // 2분
let participantSubscription = null;

async function updateParticipantListUI() {
    const now = Date.now();
    const { data, error } = await window.supabaseClient
        .from('participants')
        .select('*');
    if (error) {
        console.error('[참가자 목록 로드 오류]', error);
        return;
    }
    // 2분 이내 + is_online=true만 표시
    const onlineParticipants = (data || []).filter(p => p.is_online && (now - new Date(p.last_active_at).getTime() < ONLINE_TIMEOUT_MS));
    // UI에 onlineParticipants를 표시하는 코드 (예시)
    const listEl = document.getElementById('participant-list');
    if (listEl) {
        listEl.innerHTML = onlineParticipants.map(p => `<li>${p.name} (${p.role}, ${p.language})</li>`).join('');
    }
}

function subscribeParticipantsRealtime() {
    if (participantSubscription) return;
    participantSubscription = window.supabaseClient
        .from('participants')
        .on('*', payload => {
            updateParticipantListUI();
        })
        .subscribe();
    // 최초 1회 로드
    updateParticipantListUI();
}
