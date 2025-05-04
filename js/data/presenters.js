/**
 * 발표자 데이터
 * 컨퍼런스 발표자 리스트 문서에서 추출한 데이터
 */
const PRESENTERS_DATA = [
    {
        id: 1,
        name: '나선채',
        role: '책임',
        team: 'MLV내장설계1팀',
        organization: '남양',
        title: '24~25년 시트 TRM 기술 트랜드 분석',
        titleEn: '24~25 Seat TRM Technology Trend Analysis',
        description: '자동차 시트 기술의 최신 트렌드와 향후 2년간의 기술 로드맵을 분석합니다.',
        time: '10:00 - 10:45',
        date: '2025-05-10',
        day: 1,
        track: 'A',
        language: 'ko',
        slideUrl: '',
        contactEmail: 'seonchae.na@example.com'
    },
    {
        id: 2,
        name: '이상학',
        role: '책임',
        team: '바디선행개발팀',
        organization: '남양',
        title: 'Feature 기반 시트 중장기 개발 전략',
        titleEn: 'Feature-Based Seat Mid - to Long-Term Development Strategy',
        description: '사용자 경험과 기능성 중심의 자동차 시트 중장기 개발 전략을 소개합니다.',
        time: '11:00 - 11:45',
        date: '2025-05-10',
        day: 1,
        track: 'A',
        language: 'ko',
        slideUrl: '',
        contactEmail: 'sanghak.lee@example.com'
    },
    {
        id: 3,
        name: '백설',
        role: '책임',
        team: '아키텍처시스템기획팀',
        organization: '남양',
        title: '바디 아키텍처 운영 전략',
        titleEn: 'Body Architecture Operation Strategy',
        description: '향후 자동차 바디 아키텍처의 운영 전략과 시트와의 연계성을 설명합니다.',
        time: '13:00 - 13:45',
        date: '2025-05-10',
        day: 1,
        track: 'A',
        language: 'ko',
        slideUrl: '',
        contactEmail: 'seol.baeg@example.com'
    },
    {
        id: 4,
        name: '이상현',
        role: '책임',
        team: '바디융합선행개발팀',
        organization: '남양',
        title: 'SDV 개발전략과 바디부문 대응방안',
        titleEn: 'SDV Development Strategy and Body Division Response Plan',
        description: '중앙집중형 E/E 아키텍처와 48V 전력시스템을 중심으로 한 SDV(Software Defined Vehicle) 대응 전략을 소개합니다.',
        time: '14:00 - 14:45',
        date: '2025-05-10',
        day: 1,
        track: 'A',
        language: 'ko',
        slideUrl: '',
        contactEmail: 'sanghyun.lee@example.com'
    },
    {
        id: 5,
        name: '하성동',
        role: '책임',
        team: '현대내장디자인실',
        organization: '남양',
        title: '현대내장디자인 미래 운영전략',
        titleEn: 'Hyundai Interior Design Future Operation Strategy',
        description: '자동차 내장 디자인의 미래 트렌드와 시트 디자인의 방향성에 대해 논의합니다.',
        time: '15:00 - 15:45',
        date: '2025-05-10',
        day: 1,
        track: 'A',
        language: 'ko',
        slideUrl: '',
        contactEmail: 'seongdong.ha@example.com'
    },
    {
        id: 6,
        name: '노태형',
        role: '책임',
        team: '기아넥스트내장DeX팀',
        organization: '남양',
        title: '기아 시트 미래 운영전력',
        titleEn: 'Kia Seat Future Operating Power',
        description: '기아자동차의 미래 시트 운영 전략과 혁신 방향을 소개합니다.',
        time: '16:00 - 16:45',
        date: '2025-05-10',
        day: 1,
        track: 'A',
        language: 'ko',
        slideUrl: '',
        contactEmail: 'taehyung.roh@example.com'
    },
    {
        id: 7,
        name: '서원진',
        role: '책임',
        team: '내외장재료개발팀',
        organization: '남양',
        title: '시트관련 미래 재료운영전략',
        titleEn: 'Seat-Related Future Material Management Strategy',
        description: '지속가능한 자동차 시트 소재와 미래 재료 운영 전략에 대해 논의합니다.',
        time: '10:00 - 10:45',
        date: '2025-05-11',
        day: 2,
        track: 'A',
        language: 'ko',
        slideUrl: '',
        contactEmail: 'wonjin.seo@example.com'
    },
    {
        id: 8,
        name: 'Michael Schmidt',
        role: 'Research Lead',
        team: 'European Research Center',
        organization: '유럽연구소',
        title: '유럽 시장 시트 기술 트렌드',
        titleEn: 'European Market Seat Technology Trends',
        description: '유럽 자동차 시장의 최신 시트 기술 트렌드와 고객 요구사항을 분석합니다.',
        time: '11:00 - 11:45',
        date: '2025-05-11',
        day: 2,
        track: 'B',
        language: 'en',
        slideUrl: '',
        contactEmail: 'michael.schmidt@example.com'
    },
    {
        id: 9,
        name: 'Li Wei',
        role: 'Director',
        team: 'China Technical Center',
        organization: '중국연구소',
        title: '중국 시장 시트 기술 동향',
        titleEn: 'Chinese Market Seat Technology Trends',
        description: '중국 자동차 시장의 시트 관련 기술 동향과 현지 고객의 요구사항을 소개합니다.',
        time: '13:00 - 13:45',
        date: '2025-05-11',
        day: 2,
        track: 'B',
        language: 'zh',
        slideUrl: '',
        contactEmail: 'wei.li@example.com'
    },
    {
        id: 10,
        name: 'Ahmad Fauzi',
        role: 'Senior Engineer',
        team: 'Indonesia R&D Center',
        organization: '인니연구소',
        title: '동남아시아 시장 시트 요구사항',
        titleEn: 'Southeast Asian Market Seat Requirements',
        description: '동남아시아 지역의 기후와 사용 환경에 특화된 시트 기술 요구사항을 분석합니다.',
        time: '14:00 - 14:45',
        date: '2025-05-11',
        day: 2,
        track: 'B',
        language: 'en',
        slideUrl: '',
        contactEmail: 'ahmad.fauzi@example.com'
    }
];

// 조직별로 발표자 그룹화
const PRESENTER_ORGANIZATIONS = [
    '남양',
    '유럽연구소',
    '중국연구소',
    '인니연구소'
];

// 날짜별로 일정 그룹화
const SCHEDULE_DATES = [
    {
        date: '2025-05-10',
        label: '5월 10일 (1일차)'
    },
    {
        date: '2025-05-11',
        label: '5월 11일 (2일차)'
    }
];

// 트랙별로 일정 그룹화
const SCHEDULE_TRACKS = [
    {
        id: 'A',
        name: '메인 트랙',
        room: '그랜드 볼룸'
    },
    {
        id: 'B',
        name: '글로벌 트랙',
        room: '세미나룸 B'
    }
];

// 일정 데이터 생성 (발표자 데이터 기반)
const SCHEDULE_DATA = PRESENTERS_DATA.map(presenter => {
    return {
        id: presenter.id,
        title: presenter.title,
        titleEn: presenter.titleEn,
        description: presenter.description,
        speaker: presenter.name,
        speakerRole: presenter.role,
        speakerTeam: presenter.team,
        organization: presenter.organization,
        time: presenter.time,
        date: presenter.date,
        day: presenter.day,
        track: presenter.track,
        room: SCHEDULE_TRACKS.find(track => track.id === presenter.track)?.room || '미정',
        language: presenter.language
    };
});