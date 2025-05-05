# 컨퍼런스 실시간 번역 채팅 시스템

## 프로젝트 소개
현대자동차그룹 시트기술 컨퍼런스 2025를 위한 실시간 다국어 번역 채팅 시스템입니다. 참가자들이 자신의 선호 언어로 소통할 수 있는 웹/모바일 최적화 채팅 솔루션을 제공합니다.

## 주요 기능

- 실시간 메시지 송수신
- 자동 언어 감지 및 번역
- 다국어 지원 (한국어, 영어, 힌디어, 중국어)
- 스태프 메시지 상단 고정 기능 (공지사항)
- 스태프 역할 비밀번호 보호 기능
- 화자별 채팅방 분리
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 다크/라이트 모드 지원
- 메시지 좋아요 기능

## 설치 및 실행 방법

### 사전 준비

1. Node.js가 설치되어 있어야 합니다.
2. Supabase 프로젝트가 설정되어 있어야 합니다.
3. Google Cloud Translation API가 활성화되어 있어야 합니다.

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd conference-chat

# 의존성 설치
npm install
```

### Supabase 설정

1. Supabase 프로젝트에서 `database_schema.sql` 파일의 내용을 SQL 편집기에서 실행하여 필요한 테이블을 생성합니다.
2. config.js 파일에 Supabase URL과 Anon Key가 올바르게 설정되어 있는지 확인합니다.

### 실행

```bash
# 개발 서버 실행
npm start
```

브라우저에서 http://localhost:8090 으로 접속하여 애플리케이션을 확인할 수 있습니다.

## 프로젝트 구조

```
conference-chat/
├── js/              # 자바스크립트 모듈
│   ├── config.js            # 설정 파일 (API 키 등)
│   ├── supabase-client.js   # Supabase 연결 및 데이터 처리
│   ├── translation.js       # 번역 서비스 구현
│   ├── chat.js              # 채팅 UI 관리
│   ├── i18n.js              # 다국어 처리
│   ├── mobile-ui.js         # 모바일 UI 관련
│   ├── user.js              # 사용자 정보 관리
│   ├── utils.js             # 유틸리티 함수
│   └── main.js              # 메인 애플리케이션 파일
├── styles/          # CSS 스타일시트
│   ├── main.css             # 기본 스타일시트
│   ├── chat.css             # 채팅 UI 관련 스타일
│   └── responsive.css       # 반응형 디자인 스타일
├── assets/          # 이미지 및 아이콘
│   └── icons/               # 아이콘 파일들
├── index.html       # 메인 HTML 파일
├── database_schema.sql  # 데이터베이스 스키마 스크립트
├── package.json     # 프로젝트 메타데이터
├── debugging_guide.md   # 디버깅 가이드
├── project_plan.md      # 프로젝트 계획
└── README.md        # 문서
```

## 최근 업데이트 (2025년 5월 4일)

- i18nService 모듈 가져오기 문제 수정
- 불필요한 모듈 제거 (exhibition.js, speakers.js)
- 로그아웃 기능 개선
- 디