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
        
        this.init();
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
        } catch (error) {
            this.logger.error('이벤트 리스너 설정 중 오류 발생:', error);
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
            
            card.innerHTML = `
                <div class="exhibitor-name">${exhibitor.name}</div>
                <div class="exhibitor-detail">${exhibitor.description}</div>
                <div class="exhibitor-booth">부스: ${exhibitor.boothNumber || 'N/A'}</div>
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
            `;
            
            // 클릭 이벤트 - 전시업체 상세 정보 표시
            card.addEventListener('click', () => {
                this.showExhibitorDetail(exhibitor);
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
            
            // 일정 카드 추가
            schedules.forEach(schedule => {
                const card = this.createScheduleCard(schedule);
                this.elements.scheduleList.appendChild(card);
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
            
            card.innerHTML = `
                <div class="schedule-time">${schedule.time || ''} ${schedule.date ? `| ${this.formatDate(schedule.date)}` : ''}</div>
                <div class="schedule-title">${schedule.title || 'No Title'}</div>
                <div class="schedule-location">${schedule.location || 'N/A'}</div>
                <div class="schedule-presenter">
                    <div class="presenter-avatar">${this.getInitials(schedule.presenter)}</div>
                    <div class="presenter-info">
                        <div class="presenter-name">${schedule.presenter || 'N/A'}</div>
                        <div class="presenter-department">${schedule.department || ''}</div>
                    </div>
                </div>
            `;
            
            // 클릭 이벤트 - 일정 상세 정보 표시
            card.addEventListener('click', () => {
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
     * 참가자 목록 업데이트
     * @param {Array} participants - 참가자 목록
     */
    updateParticipantsList(participants) {
        try {
            if (!this.elements.participantsList) return;
            
            // 목록 비우기
            this.elements.participantsList.innerHTML = '';
            
            if (!participants || participants.length === 0) {
                // 검색 결과가 없는 경우
                this.elements.participantsList.innerHTML = `
                    <div class="empty-result">
                        <p>참가자가 없습니다.</p>
                    </div>
                `;
                return;
            }
            
            // 참가자 항목 추가
            participants.forEach(participant => {
                const item = this.createParticipantItem(participant);
                this.elements.participantsList.appendChild(item);
            });
            
            this.logger.debug(`참가자 목록 업데이트: ${participants.length}명`);
        } catch (error) {
            this.logger.error('참가자 목록 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 참가자 항목 생성
     * @param {Object} participant - 참가자 데이터
     * @returns {HTMLElement} - 참가자 항목 요소
     */
    createParticipantItem(participant) {
        try {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.dataset.email = participant.email;
            
            // 사용자 이니셜 계산
            const initials = this.getInitials(participant.name);
            
            // 온라인 상태 설정
            const onlineStatusClass = participant.online ? 'has-online-indicator' : '';
            const onlineIndicator = participant.online ? '<div class="online-indicator"></div>' : '';
            
            item.innerHTML = `
                <div class="participant-avatar ${onlineStatusClass}">
                    ${initials}
                    ${onlineIndicator}
                </div>
                <div class="participant-info">
                    <div class="participant-name">${participant.name}
                        <span class="role-badge ${participant.role}">${this.getRoleDisplayName(participant.role)}</span>
                    </div>
                    <div class="participant-email">${participant.email}</div>
                </div>
            `;
            
            return item;
        } catch (error) {
            this.logger.error('참가자 항목 생성 중 오류 발생:', error);
            
            // 오류 발생 시 기본 항목 반환
            const fallbackItem = document.createElement('div');
            fallbackItem.className = 'participant-item';
            fallbackItem.textContent = '정보를 표시할 수 없습니다.';
            return fallbackItem;
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
        const roleMap = {
            'attendee': '참가자',
            'exhibitor': '전시자',
            'presenter': '발표자',
            'staff': '스태프',
        };
        
        return roleMap[role] || role;
    }

    /**
     * 날짜 포맷팅
     * @param {string} dateStr - 날짜 문자열
     * @returns {string} - 포맷된 날짜
     */
    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) {
                return dateStr;
            }
            
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
            this.updateExhibitorsList(this.dataManager.getExhibitors());
            
            // 일정 목록 업데이트
            this.updateScheduleList(this.dataManager.getSchedule());
            
            // 참가자 목록 업데이트
            this.updateParticipantsList(this.dataManager.getParticipants());
            
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
                
                if (this.elements.participantsPanel) {
                    this.elements.participantsPanel.classList.remove('active');
                }
            } else if (panel === 'participants' && this.elements.participantsPanel) {
                this.elements.participantsPanel.classList.add('active');
                
                if (this.elements.infoPanel) {
                    this.elements.infoPanel.classList.remove('active');
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
            }
            
            if (this.elements.participantsPanel) {
                this.elements.participantsPanel.classList.remove('active');
            }
            
            this.logger.debug('사이드바 숨김');
        } catch (error) {
            this.logger.error('사이드바 숨기기 중 오류 발생:', error);
        }
    }
}
