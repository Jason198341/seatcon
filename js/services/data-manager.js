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
            // 실제 구현에서는 API 또는 Supabase에서 데이터를 가져올 수 있음
            // 예시 데이터
            this.exhibitors = [
                {
                    id: 1,
                    name: '대원정밀공업',
                    description: '차세대 코어 메커니즘 개발 (트랙, 리클라이너, 기어박스, 펌핑디바이스, 랫치)',
                    contactPerson: '진우재 팀장',
                    contactPhone: '010 8761 5269',
                    contactEmail: 'woojae_jin@dwjm.co.kr',
                    boothNumber: 'A-01',
                },
                {
                    id: 2,
                    name: '대유에이텍',
                    description: 'LCD 터치 디스플레이 백 시트 공기 청정기',
                    contactPerson: '김상현 매니저',
                    contactPhone: '010 9463 3658',
                    contactEmail: 'shkim@dayou.co.kr',
                    boothNumber: 'A-02',
                },
                {
                    id: 3,
                    name: '대유에이텍',
                    description: '후석 공압식 시트',
                    contactPerson: '문지환 매니저',
                    contactPhone: '010 3123 6929',
                    contactEmail: 'mason@dayou.co.kr',
                    boothNumber: 'A-03',
                },
                {
                    id: 4,
                    name: '대유에이텍',
                    description: '후석 공압식 시트_발판',
                    contactPerson: '문지환 매니저',
                    contactPhone: '010 3123 6929',
                    contactEmail: 'mason@dayou.co.kr',
                    boothNumber: 'A-04',
                },
                {
                    id: 5,
                    name: '대원산업',
                    description: '롤러식 마사지 모듈적용 라운지 릴렉스 시트',
                    contactPerson: '신재광 책임',
                    contactPhone: '010 8720 4434',
                    contactEmail: 'jkshin@dwsu.co.kr',
                    boothNumber: 'A-05',
                },
                {
                    id: 6,
                    name: 'Brose India',
                    description: 'Seat Components: Cushion Extension (Manual)',
                    contactPerson: 'Pradnyesh Patil',
                    contactPhone: '+91 9552537275',
                    contactEmail: 'Pradnyesh.patil@brose.com',
                    boothNumber: 'B-01',
                },
                {
                    id: 7,
                    name: 'Brose India',
                    description: 'Seat Components: Calf Rest (Legrest)',
                    contactPerson: 'Jeong, Gwang-Ho',
                    contactPhone: '+91 7720095473',
                    contactEmail: 'Gwang-Ho.Jeong@brose.com',
                    boothNumber: 'B-02',
                },
                {
                    id: 8,
                    name: '디에스시동탄',
                    description: '롤러 마사지 시트',
                    contactPerson: '최민식 책임',
                    contactPhone: '010-4582-4830',
                    contactEmail: 'mschoi2@godsc.co.kr',
                    boothNumber: 'B-03',
                },
                {
                    id: 9,
                    name: '디에스시동탄',
                    description: '파워스트라이크 적용시트',
                    contactPerson: '황인창 책임',
                    contactPhone: '010-2547-7249',
                    contactEmail: 'ichwang@godsc.co.kr',
                    boothNumber: 'B-04',
                },
                {
                    id: 10,
                    name: '다스',
                    description: '파워롱레일+파워스위블 적용 시트 (스위블 브레이크 모듈 별도 전시)',
                    contactPerson: '이재갑 책임',
                    contactPhone: '010 9681 4567',
                    contactEmail: 'LJG4444@i-das.com',
                    boothNumber: 'C-01',
                },
            ];
            
            this.logger.info(`${this.exhibitors.length}개 전시업체 데이터를 로드했습니다.`);
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
            // 실제 구현에서는 API 또는 Supabase에서 데이터를 가져올 수 있음
            // 예시 데이터
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
                },
                {
                    id: 3,
                    title: '바디 아키텍처 운영 전략',
                    presenter: '백설 책임',
                    department: '아키텍처시스템기획팀',
                    time: '11:30 - 12:15',
                    date: '2023-05-15',
                    location: '메인 홀',
                },
                {
                    id: 4,
                    title: 'SDV 개발전략과 바디부문 대응방안',
                    presenter: '이상현 책임',
                    department: '바디융합선행개발팀',
                    time: '13:30 - 14:15',
                    date: '2023-05-15',
                    location: '메인 홀',
                },
                {
                    id: 5,
                    title: '현대내장디자인 미래 운영전략',
                    presenter: '하성동',
                    department: '현대내장디자인실',
                    time: '14:30 - 15:15',
                    date: '2023-05-15',
                    location: '메인 홀',
                },
                {
                    id: 6,
                    title: '기아 시트 미래 운영전력',
                    presenter: '노태형 책임',
                    department: '기아넥스트내장DeX팀',
                    time: '15:30 - 16:15',
                    date: '2023-05-15',
                    location: '메인 홀',
                },
                {
                    id: 7,
                    title: '시트관련 미래 재료운영전략',
                    presenter: '서원진 책임',
                    department: '내외장재료개발팀',
                    time: '16:30 - 17:15',
                    date: '2023-05-15',
                    location: '메인 홀',
                },
            ];
            
            this.logger.info(`${this.schedule.length}개 일정 데이터를 로드했습니다.`);
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
            exhibitor.contactPerson.toLowerCase().includes(searchTerm)
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
            item.department.toLowerCase().includes(searchTerm)
        );
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
}
