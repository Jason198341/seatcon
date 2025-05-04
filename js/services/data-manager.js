/**
 * 데이터 관리 서비스
 * 전시업체 및 컨퍼런스 관련 데이터 관리
 */
class DataManager {
    /**
     * 데이터 관리자 생성자
     * @param {Object} config - 애플리케이션 설정
     * @param {Object} logger - 로거 서비스
     */
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || console;
        this.exhibitors = [];
        this.schedule = [];
        this.participants = [];
        this.categories = [];
        this.companies = [];
    }

    /**
     * 데이터 관리자 초기화
     * @returns {Promise<boolean>} - 초기화 성공 여부
     */
    async init() {
        try {
            this.logger.info('데이터 관리자 초기화 중...');
            
            // 전시업체 데이터 로드
            await this.loadExhibitors();
            
            // 일정 데이터 로드
            await this.loadSchedule();
            
            this.logger.info('데이터 관리자 초기화 완료');
            return true;
        } catch (error) {
            this.logger.error('데이터 관리자 초기화 중 오류 발생:', error);
            throw new Error('데이터 로드에 실패했습니다.');
        }
    }

    /**
     * 전시업체 데이터 로드
     * @returns {Promise<void>}
     */
    async loadExhibitors() {
        try {
            // exhibitors.js에서 정의된 EXHIBITORS_DATA 가져오기
            if (typeof EXHIBITORS_DATA !== 'undefined') {
                this.exhibitors = EXHIBITORS_DATA;
                this.categories = EXHIBITOR_CATEGORIES || [];
                this.companies = EXHIBITOR_COMPANIES || [];
                this.logger.info(`${this.exhibitors.length}개 전시업체 데이터를 로드했습니다.`);
                this.logger.info(`${this.categories.length}개 카테고리를 로드했습니다.`);
                this.logger.info(`${this.companies.length}개 회사를 로드했습니다.`);
            } else {
                // 예시 데이터 (EXHIBITORS_DATA가 정의되지 않은 경우)
                this.exhibitors = [
                    {
                        id: 1,
                        name: '대원정밀공업',
                        description: '차세대 코어 메커니즘 개발 (트랙, 리클라이너, 기어박스, 펌핑디바이스, 랫치)',
                        contactPerson: '진우재 팀장',
                        contactPhone: '010 8761 5269',
                        contactEmail: 'woojae_jin@dwjm.co.kr',
                        boothNumber: 'A-01',
                        category: '시트 메커니즘'
                    },
                    {
                        id: 2,
                        name: '대유에이텍',
                        description: 'LCD 터치 디스플레이 백 시트 공기 청정기',
                        contactPerson: '김상현 매니저',
                        contactPhone: '010 9463 3658',
                        contactEmail: 'shkim@dayou.co.kr',
                        boothNumber: 'A-02',
                        category: '시트 기술'
                    }
                ];
                this.logger.warn('EXHIBITORS_DATA가 정의되지 않아 예시 데이터를 사용합니다.');
            }
        } catch (error) {
            this.logger.error('전시업체 데이터 로드 중 오류 발생:', error);
            throw new Error('전시업체 데이터 로드에 실패했습니다.');
        }
    }

    /**
     * 일정 데이터 로드
     * @returns {Promise<void>}
     */
    async loadSchedule() {
        try {
            // presenters.js에서 정의된 SCHEDULE_DATA와 PRESENTER_DATA 가져오기
            if (typeof SCHEDULE_DATA !== 'undefined' && typeof PRESENTER_DATA !== 'undefined') {
                this.schedule = SCHEDULE_DATA;
                this.presenters = PRESENTER_DATA;
                this.logger.info(`${this.schedule.length}개 일정 데이터를 로드했습니다.`);
                this.logger.info(`${this.presenters.length}개 발표자 데이터를 로드했습니다.`);
            } else {
                // 예시 데이터 (SCHEDULE_DATA가 정의되지 않은 경우)
                this.schedule = [
                    {
                        id: 1,
                        title: '24~25년 시트 TRM 기술 트랜드 분석',
                        presenter: '나선채 책임',
                        department: 'MLV내장설계1팀',
                        time: '09:30 - 10:15',
                        date: '2023-05-15',
                        location: '메인 홀',
                    },
                    {
                        id: 2,
                        title: 'Feature 기반 시트 중장기 개발 전략',
                        presenter: '이상학 책임',
                        department: '바디선행개발팀',
                        time: '10:30 - 11:15',
                        date: '2023-05-15',
                        location: '메인 홀',
                    }
                ];
                this.logger.warn('SCHEDULE_DATA가 정의되지 않아 예시 데이터를 사용합니다.');
            }
        } catch (error) {
            this.logger.error('일정 데이터 로드 중 오류 발생:', error);
            throw new Error('일정 데이터 로드에 실패했습니다.');
        }
    }

    /**
     * 참가자 추가
     * @param {Object} participant - 참가자 정보
     * @returns {boolean} - 성공 여부
     */
    addParticipant(participant) {
        try {
            // 이미 존재하는 참가자인지 확인
            const existingIndex = this.participants.findIndex(p => p.email === participant.email);
            
            if (existingIndex >= 0) {
                // 기존 참가자 정보 업데이트
                this.participants[existingIndex] = {
                    ...this.participants[existingIndex],
                    ...participant,
                    lastActive: new Date(),
                };
            } else {
                // 새 참가자 추가
                this.participants.push({
                    ...participant,
                    id: this.participants.length + 1,
                    joined: new Date(),
                    lastActive: new Date(),
                    online: true,
                });
            }
            
            this.logger.info('참가자 추가/업데이트:', participant);
            return true;
        } catch (error) {
            this.logger.error('참가자 추가 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 참가자 상태 업데이트
     * @param {string} email - 참가자 이메일
     * @param {boolean} online - 온라인 상태
     * @returns {boolean} - 성공 여부
     */
    updateParticipantStatus(email, online) {
        try {
            const index = this.participants.findIndex(p => p.email === email);
            
            if (index >= 0) {
                this.participants[index].online = online;
                this.participants[index].lastActive = new Date();
                this.logger.info(`참가자 ${email}의 상태를 ${online ? '온라인' : '오프라인'}으로 업데이트`);
                return true;
            }
            
            this.logger.warn(`참가자 ${email}를 찾을 수 없음`);
            return false;
        } catch (error) {
            this.logger.error('참가자 상태 업데이트 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 모든 전시업체 정보 가져오기
     * @returns {Array} - 전시업체 목록
     */
    getExhibitors() {
        return this.exhibitors;
    }

    /**
     * 특정 전시업체 정보 가져오기
     * @param {number} id - 전시업체 ID
     * @returns {Object|null} - 전시업체 정보 또는 null
     */
    getExhibitorById(id) {
        return this.exhibitors.find(exhibitor => exhibitor.id === id) || null;
    }

    /**
     * 전시업체 카테고리별 그룹화
     * @returns {Object} - 카테고리별 전시업체 그룹
     */
    getExhibitorsByCategory() {
        const result = {};
        
        this.categories.forEach(category => {
            result[category] = this.exhibitors.filter(exhibitor => exhibitor.category === category);
        });
        
        return result;
    }

    /**
     * 전시업체 회사별 그룹화
     * @returns {Object} - 회사별 전시업체 그룹
     */
    getExhibitorsByCompany() {
        const result = {};
        
        this.companies.forEach(company => {
            result[company] = this.exhibitors.filter(exhibitor => exhibitor.name === company);
        });
        
        return result;
    }

    /**
     * 전시업체 검색
     * @param {string} query - 검색어
     * @returns {Array} - 검색 결과
     */
    searchExhibitors(query) {
        if (!query) return this.exhibitors;
        
        const searchTerm = query.toLowerCase();
        
        return this.exhibitors.filter(exhibitor => 
            exhibitor.name.toLowerCase().includes(searchTerm) ||
            exhibitor.description.toLowerCase().includes(searchTerm) ||
            exhibitor.contactPerson.toLowerCase().includes(searchTerm) ||
            exhibitor.category.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * 모든 일정 정보 가져오기
     * @returns {Array} - 일정 목록
     */
    getSchedule() {
        return this.schedule;
    }

    /**
     * 특정 일정 정보 가져오기
     * @param {number} id - 일정 ID
     * @returns {Object|null} - 일정 정보 또는 null
     */
    getScheduleById(id) {
        return this.schedule.find(item => item.id === id) || null;
    }

    /**
     * 특정 발표자 정보 가져오기
     * @param {number} id - 발표자 ID
     * @returns {Object|null} - 발표자 정보 또는 null
     */
    getPresenterById(id) {
        if (!this.presenters) return null;
        return this.presenters.find(presenter => presenter.id === id) || null;
    }

    /**
     * 일정 검색
     * @param {string} query - 검색어
     * @returns {Array} - 검색 결과
     */
    searchSchedule(query) {
        if (!query) return this.schedule;
        
        const searchTerm = query.toLowerCase();
        
        return this.schedule.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.presenter.toLowerCase().includes(searchTerm) ||
            item.department.toLowerCase().includes(searchTerm) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    /**
     * 날짜별 일정 그룹화
     * @returns {Object} - 날짜별 일정 그룹
     */
    getScheduleByDate() {
        const result = {};
        
        this.schedule.forEach(item => {
            if (!result[item.date]) {
                result[item.date] = [];
            }
            
            result[item.date].push(item);
        });
        
        // 각 날짜별 시간순 정렬
        for (const date in result) {
            result[date].sort((a, b) => {
                const timeA = a.time.split(' - ')[0];
                const timeB = b.time.split(' - ')[0];
                return timeA.localeCompare(timeB);
            });
        }
        
        return result;
    }

    /**
     * 모든 참가자 정보 가져오기
     * @returns {Array} - 참가자 목록
     */
    getParticipants() {
        return this.participants;
    }

    /**
     * 특정 역할의 참가자 목록 가져오기
     * @param {string} role - 역할 (attendee, exhibitor, presenter, staff)
     * @returns {Array} - 참가자 목록
     */
    getParticipantsByRole(role) {
        if (role === 'all') return this.participants;
        return this.participants.filter(participant => participant.role === role);
    }

    /**
     * 온라인 참가자 목록 가져오기
     * @returns {Array} - 온라인 참가자 목록
     */
    getOnlineParticipants() {
        return this.participants.filter(participant => participant.online);
    }

    /**
     * 참가자 검색
     * @param {string} query - 검색어
     * @returns {Array} - 검색 결과
     */
    searchParticipants(query) {
        if (!query) return this.participants;
        
        const searchTerm = query.toLowerCase();
        
        return this.participants.filter(participant => 
            participant.name.toLowerCase().includes(searchTerm) ||
            participant.email.toLowerCase().includes(searchTerm)
        );
    }
    
    /**
     * 참가자 정보 저장
     * @returns {boolean} - 성공 여부
     */
    saveParticipantsData() {
        try {
            // 실제 구현에서는 서버에 저장하거나 Supabase에 업데이트할 수 있음
            this.logger.info('참가자 데이터 저장');
            return true;
        } catch (error) {
            this.logger.error('참가자 데이터 저장 중 오류 발생:', error);
            return false;
        }
    }
    
    /**
     * 비활성 참가자 정리
     * @param {number} inactiveTimeMs - 비활성 시간 (밀리초)
     * @returns {number} - 정리된 참가자 수
     */
    cleanupInactiveParticipants(inactiveTimeMs = 3600000) { // 기본값: 1시간
        try {
            const now = new Date();
            const inactiveParticipants = this.participants.filter(participant => {
                const lastActive = new Date(participant.lastActive);
                return participant.online && now - lastActive > inactiveTimeMs;
            });
            
            inactiveParticipants.forEach(participant => {
                this.updateParticipantStatus(participant.email, false);
            });
            
            this.logger.info(`${inactiveParticipants.length}명의 비활성 참가자 정리`);
            return inactiveParticipants.length;
        } catch (error) {
            this.logger.error('비활성 참가자 정리 중 오류 발생:', error);
            return 0;
        }
    }

    /**
     * Supabase에서 참가자 목록을 받아와 갱신
     * @param {SupabaseClient} supabaseClient - Supabase 클라이언트 인스턴스
     * @returns {Promise<Array>} - 참가자 목록
     */
    async fetchParticipantsFromDB(supabaseClient) {
        if (!supabaseClient || !supabaseClient.supabase) return [];
        try {
            const { data, error } = await supabaseClient.supabase
                .from('participants')
                .select('*');
            if (!error && data) {
                this.participants = data;
                this.logger.info('DB에서 참가자 목록 갱신:', data.length);
                return data;
            }
            this.logger.error('DB 참가자 목록 조회 오류:', error);
            return [];
        } catch (err) {
            this.logger.error('DB 참가자 목록 조회 중 예외:', err);
            return [];
        }
    }
}
