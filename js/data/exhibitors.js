/**
 * 전시업체 데이터
 * 전시물 리스트 문서에서 추출한 데이터
 */
const EXHIBITORS_DATA = [
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
    },
    {
        id: 3,
        name: '대유에이텍',
        description: '후석 공압식 시트',
        contactPerson: '문지환 매니저',
        contactPhone: '010 3123 6929',
        contactEmail: 'mason@dayou.co.kr',
        boothNumber: 'A-03',
        category: '공압 시트'
    },
    {
        id: 4,
        name: '대유에이텍',
        description: '후석 공압식 시트_발판',
        contactPerson: '문지환 매니저',
        contactPhone: '010 3123 6929',
        contactEmail: 'mason@dayou.co.kr',
        boothNumber: 'A-04',
        category: '공압 시트'
    },
    {
        id: 5,
        name: '대원산업',
        description: '롤러식 마사지 모듈적용 라운지 릴렉스 시트',
        contactPerson: '신재광 책임',
        contactPhone: '010 8720 4434',
        contactEmail: 'jkshin@dwsu.co.kr',
        boothNumber: 'A-05',
        category: '마사지 시트'
    },
    {
        id: 6,
        name: '대원산업',
        description: '롤러식 마사지 모듈적용 라운지 릴렉스 시트',
        contactPerson: '신재광 책임',
        contactPhone: '010 8720 4434',
        contactEmail: 'jkshin@dwsu.co.kr',
        boothNumber: 'A-06',
        category: '마사지 시트'
    },
    {
        id: 7,
        name: 'Brose India',
        description: 'Seat Components: Cushion Extension (Manual)',
        contactPerson: 'Pradnyesh Patil',
        contactPhone: '+91 9552537275',
        contactEmail: 'Pradnyesh.patil@brose.com',
        boothNumber: 'B-01',
        category: '시트 컴포넌트'
    },
    {
        id: 8,
        name: 'Brose India',
        description: 'Seat Components: Calf Rest (Legrest)',
        contactPerson: 'Jeong, Gwang-Ho',
        contactPhone: '+91 7720095473',
        contactEmail: 'Gwang-Ho.Jeong@brose.com',
        boothNumber: 'B-02',
        category: '시트 컴포넌트'
    },
    {
        id: 9,
        name: 'Brose India',
        description: 'Seat Components: Rear Power Striker',
        contactPerson: 'Jeong, Gwang-Ho',
        contactPhone: '+91 7720095473',
        contactEmail: 'Gwang-Ho.Jeong@brose.com',
        boothNumber: 'B-03',
        category: '시트 컴포넌트'
    },
    {
        id: 10,
        name: 'Brose India',
        description: 'Seat Components: Lumbar Support (Power mechanical)',
        contactPerson: 'Jeong, Gwang-Ho',
        contactPhone: '+91 7720095473',
        contactEmail: 'Gwang-Ho.Jeong@brose.com',
        boothNumber: 'B-04',
        category: '시트 컴포넌트'
    },
    {
        id: 11,
        name: 'Brose India',
        description: 'Seat structure: 8 way Power seat with BLDC',
        contactPerson: 'Pradnyesh Patil',
        contactPhone: '+91 9552537275',
        contactEmail: 'Pradnyesh.patil@brose.com',
        boothNumber: 'B-05',
        category: '시트 구조'
    },
    {
        id: 12,
        name: 'Brose India',
        description: 'Seat Structure: Reference seat (Light weight & cost efficient)',
        contactPerson: 'Pradnyesh Patil',
        contactPhone: '+91 9552537275',
        contactEmail: 'Pradnyesh.patil@brose.com',
        boothNumber: 'B-06',
        category: '시트 구조'
    },
    {
        id: 13,
        name: 'Brose India',
        description: 'Seat Structure: Relax seat (combined with all comfrot features)',
        contactPerson: 'Pradnyesh Patil',
        contactPhone: '+91 9552537275',
        contactEmail: 'Pradnyesh.patil@brose.com',
        boothNumber: 'B-07',
        category: '시트 구조'
    },
    {
        id: 14,
        name: 'Brose India',
        description: 'Complete seat: Slim seat with belt integration',
        contactPerson: 'Pradnyesh Patil',
        contactPhone: '+91 9552537275',
        contactEmail: 'Pradnyesh.patil@brose.com',
        boothNumber: 'B-08',
        category: '완성 시트'
    },
    {
        id: 15,
        name: 'Brose India',
        description: 'Seat Components: Power Cushion Extension',
        contactPerson: 'Pradnyesh Patil',
        contactPhone: '+91 9552537275',
        contactEmail: 'Pradnyesh.patil@brose.com',
        boothNumber: 'B-09',
        category: '시트 컴포넌트'
    },
    {
        id: 16,
        name: '디에스시동탄',
        description: '롤러 마사지 시트',
        contactPerson: '최민식 책임',
        contactPhone: '010-4582-4830',
        contactEmail: 'mschoi2@godsc.co.kr',
        boothNumber: 'C-01',
        category: '마사지 시트'
    },
    {
        id: 17,
        name: '디에스시동탄',
        description: '파워스트라이크 적용시트',
        contactPerson: '황인창 책임',
        contactPhone: '010-2547-7249',
        contactEmail: 'ichwang@godsc.co.kr',
        boothNumber: 'C-02',
        category: '시트 기술'
    },
    {
        id: 18,
        name: '디에스시동탄',
        description: '개인특화 엔터테인먼트 시트',
        contactPerson: '박문수 매니저',
        contactPhone: '010-7232-8140',
        contactEmail: 'mspark@godsc.co.kr',
        boothNumber: 'C-03',
        category: '엔터테인먼트 시트'
    },
    {
        id: 19,
        name: '다스',
        description: '파워롱레일+파워스위블 적용 시트 (스위블 브레이크 모듈 별도 전시)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-01',
        category: '시트 레일'
    },
    {
        id: 20,
        name: '다스',
        description: '매뉴얼 릴렉션 시트#1 - 레버타입(틸팅 & 릴렉션)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-02',
        category: '릴렉션 시트'
    },
    {
        id: 21,
        name: '다스',
        description: '매뉴얼 릴렉션 시트#2 - 버튼타입',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-03',
        category: '릴렉션 시트'
    },
    {
        id: 22,
        name: '다스',
        description: '파워 릴렉션 시트#1 - 4절 링크타입',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-04',
        category: '릴렉션 시트'
    },
    {
        id: 23,
        name: '다스',
        description: '파워 릴렉션 시트#2 - 5절 링크타입',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-05',
        category: '릴렉션 시트'
    },
    {
        id: 24,
        name: '다스',
        description: '백 연동 다단 암레스트 시트',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-06',
        category: '암레스트 시트'
    },
    {
        id: 25,
        name: '다스',
        description: 'CORE (DTP10h/DRM10h/DRP10h)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-07',
        category: '코어 부품'
    },
    {
        id: 26,
        name: '다스',
        description: '고강도 래치 (2단 / 1단 - 2종 전시)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-08',
        category: '래치'
    },
    {
        id: 27,
        name: '다스',
        description: '무빙 블레이드 매뉴얼 롱레일',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-09',
        category: '레일'
    },
    {
        id: 28,
        name: '다스',
        description: '고성능 스마트 릴리즈 액츄에이터',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-10',
        category: '액츄에이터'
    },
    {
        id: 29,
        name: '다스',
        description: '경형 표준프레임 1열 (MQ4i 현지화 대응)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-11',
        category: '프레임'
    },
    {
        id: 30,
        name: '다스',
        description: '신흥국 2열 프레임 - 6측 프레임 (MQ4i 현지화 대응)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-12',
        category: '프레임'
    },
    {
        id: 31,
        name: '다스',
        description: '신흥국 2열 프레임 - 4측 프레임 (MQ4i 현지화 대응)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-13',
        category: '프레임'
    },
    {
        id: 32,
        name: '다스',
        description: '신흥국 2열 프레임 - 릴렉션 (MQ4i 현지화 대응)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-14',
        category: '프레임'
    },
    {
        id: 33,
        name: '다스',
        description: '신흥국 3열 프레임 (MQ4i 현지화 대응)',
        contactPerson: '이재갑 책임',
        contactPhone: '010 9681 4567',
        contactEmail: 'LJG4444@i-das.com',
        boothNumber: 'D-15',
        category: '프레임'
    },
    {
        id: 34,
        name: '케이엠모터스㈜',
        description: 'Air-tube형 통풍시트 원단',
        contactPerson: '안윤희 전무(연구소장)',
        contactPhone: '010 3000 5686',
        contactEmail: 'hiyhahn@naver.com',
        boothNumber: 'E-01',
        category: '통풍 시트'
    },
    {
        id: 35,
        name: 'AEW',
        description: '통풍 시트',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-02',
        category: '통풍 시트'
    },
    {
        id: 36,
        name: 'AEW',
        description: 'Rubbing Massage 시트',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-03',
        category: '마사지 시트'
    },
    {
        id: 37,
        name: 'AEW',
        description: 'Adaptive 시트',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-04',
        category: '적응형 시트'
    },
    {
        id: 38,
        name: 'AEW',
        description: '통풍+맛사지 시트',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-05',
        category: '복합 기능 시트'
    },
    {
        id: 39,
        name: 'AEW',
        description: 'Multi function seat',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-06',
        category: '복합 기능 시트'
    },
    {
        id: 40,
        name: 'AEW',
        description: 'CDS 부품',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-07',
        category: '부품'
    },
    {
        id: 41,
        name: 'AEW',
        description: 'CHS 부품',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-08',
        category: '부품'
    },
    {
        id: 42,
        name: 'AEW',
        description: 'OCS 부품',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-09',
        category: '부품'
    },
    {
        id: 43,
        name: 'AEW',
        description: '통풍 부품',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-10',
        category: '통풍 시트'
    },
    {
        id: 44,
        name: 'AEW',
        description: '공압 제품',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-11',
        category: '공압 시트'
    },
    {
        id: 45,
        name: 'AEW',
        description: 'SBR',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-12',
        category: '부품'
    },
    {
        id: 46,
        name: 'AEW',
        description: 'Seat Heater',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-13',
        category: '히터 시트'
    },
    {
        id: 47,
        name: 'AEW',
        description: '공압',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-14',
        category: '공압 시트'
    },
    {
        id: 48,
        name: 'AEW',
        description: '통풍',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-15',
        category: '통풍 시트'
    },
    {
        id: 49,
        name: 'AEW',
        description: '공압',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-16',
        category: '공압 시트'
    },
    {
        id: 50,
        name: 'AEW',
        description: '히터 및 기타',
        contactPerson: '이진성 총감',
        contactPhone: '010 5588 8981',
        contactEmail: 'james.lee@aew-group.com',
        boothNumber: 'E-17',
        category: '히터 시트'
    },
    {
        id: 51,
        name: '리어코리아',
        description: 'Lear ComfortMaxR & Core Mechanism',
        contactPerson: '김용환 책임',
        contactPhone: '010 3778 6934',
        contactEmail: 'jkim@lear.com',
        boothNumber: 'F-01',
        category: '시트 메커니즘'
    },
    {
        id: 52,
        name: '현대트랜시스',
        description: '경형프레임 매뉴얼 레그레스트',
        contactPerson: '황성준 연구',
        contactPhone: '010-2773-3723',
        contactEmail: 'sungjunh@hyundai-transys.com',
        boothNumber: 'F-02',
        category: '프레임'
    },
    {
        id: 53,
        name: '현대트랜시스',
        description: '2세대 경형 슬림 백 프레임',
        contactPerson: '황성준 연구',
        contactPhone: '010-2773-3723',
        contactEmail: 'sungjunh@hyundai-transys.com',
        boothNumber: 'F-03',
        category: '프레임'
    },
    {
        id: 54,
        name: '현대트랜시스',
        description: '경형 프레임(MNL/PWR)',
        contactPerson: '황성준 연구',
        contactPhone: '010-2773-3723',
        contactEmail: 'sungjunh@hyundai-transys.com',
        boothNumber: 'F-04',
        category: '프레임'
    },
    {
        id: 55,
        name: '현대트랜시스',
        description: '콘솔 레일',
        contactPerson: '손동현 책임',
        contactPhone: '010-5241-7542',
        contactEmail: 'dhyeon.son@hyundai-transys.com',
        boothNumber: 'F-05',
        category: '레일'
    },
    {
        id: 56,
        name: '현대트랜시스',
        description: '매뉴얼 리클라이너',
        contactPerson: '손동현 책임',
        contactPhone: '010-5241-7542',
        contactEmail: 'dhyeon.son@hyundai-transys.com',
        boothNumber: 'F-06',
        category: '리클라이너'
    },
    {
        id: 57,
        name: '현대트랜시스',
        description: '파워 리클라이너',
        contactPerson: '손동현 책임',
        contactPhone: '010-5241-7542',
        contactEmail: 'dhyeon.son@hyundai-transys.com',
        boothNumber: 'F-07',
        category: '리클라이너'
    },
    {
        id: 58,
        name: '현대트랜시스',
        description: '대칭 매뉴얼/파워 레일',
        contactPerson: '손동현 책임',
        contactPhone: '010-5241-7542',
        contactEmail: 'dhyeon.son@hyundai-transys.com',
        boothNumber: 'F-08',
        category: '레일'
    },
    {
        id: 59,
        name: '현대트랜시스',
        description: '비대칭 매뉴얼/파워 레일',
        contactPerson: '손동현 책임',
        contactPhone: '010-5241-7542',
        contactEmail: 'dhyeon.son@hyundai-transys.com',
        boothNumber: 'F-09',
        category: '레일'
    },
    {
        id: 60,
        name: '현대트랜시스',
        description: '펌핑',
        contactPerson: '손동현 책임',
        contactPhone: '010-5241-7542',
        contactEmail: 'dhyeon.son@hyundai-transys.com',
        boothNumber: 'F-10',
        category: '펌핑'
    },
    {
        id: 61,
        name: '현대트랜시스',
        description: '제어기 일체형 블로워 모듈',
        contactPerson: '이화준 연구',
        contactPhone: '031-5177-9246',
        contactEmail: '82104532@hyundai-transys.com',
        boothNumber: 'F-11',
        category: '블로워 모듈'
    },
    {
        id: 62,
        name: '현대트랜시스',
        description: '후석 센터 암레스트 직구동 파워사양 선행 연구',
        contactPerson: '송혁 책임',
        contactPhone: '010-2640-8509',
        contactEmail: 'good4jay@hyundai-transys.com',
        boothNumber: 'F-12',
        category: '암레스트'
    },
    {
        id: 63,
        name: '현대트랜시스',
        description: 'SUV차종 2열 워크쓰루 공간 확보를 위한 독립시트 암레스트 백 수납 구조 개발',
        contactPerson: '조용진 연구',
        contactPhone: '010-2656-5415',
        contactEmail: 'dragonj0@hyundai-transys.com',
        boothNumber: 'F-13',
        category: '암레스트'
    }
];

// 카테고리별로 전시업체 그룹화
const EXHIBITOR_CATEGORIES = [
    '시트 메커니즘',
    '시트 기술',
    '공압 시트',
    '마사지 시트',
    '시트 컴포넌트',
    '엔터테인먼트 시트',
    '시트 레일',
    '릴렉션 시트',
    '암레스트 시트',
    '코어 부품',
    '래치',
    '레일',
    '액츄에이터',
    '프레임',
    '통풍 시트',
    '적응형 시트',
    '복합 기능 시트',
    '부품',
    '히터 시트',
    '리클라이너',
    '펌핑',
    '블로워 모듈',
    '암레스트'
];

// 전시업체 회사별 그룹화
const EXHIBITOR_COMPANIES = [
    '대원정밀공업',
    '대유에이텍',
    '대원산업',
    'Brose India',
    '디에스시동탄',
    '다스',
    '케이엠모터스㈜',
    'AEW',
    '리어코리아',
    '현대트랜시스'
];
