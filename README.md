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
- 전시물 및 발표자 정보 조회 기능

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

### 환경 변수 설정

#### 방법 1: .env 파일 사용 (권장)

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 채웁니다:

```
# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Google Cloud Translation API 설정
TRANSLATION_API_KEY=your_translation_api_key
```

#### 방법 2: 개발 환경에서 웹 인터페이스 사용

1. 서버를 실행합니다.
2. 브라우저에서 `/env-setup.html`에 접속합니다.
3. 필요한 API 키를 입력하고 저장합니다.
4. 메인 페이지를 새로고침하면 저장된 설정이 적용됩니다.

#### 방법 3: 서버 환경 변수 설정 (프로덕션)

서버 실행 시 환경 변수를 설정합니다:

```bash
# Linux/macOS
export SUPABASE_URL=your_supabase_url
export SUPABASE_KEY=your_supabase_key
export TRANSLATION_API_KEY=your_translation_api_key
npm start

# Windows
set SUPABASE_URL=your_supabase_url
set SUPABASE_KEY=your_supabase_key
set TRANSLATION_API_KEY=your_translation_api_key
npm start
```

### Supabase 설정

1. Supabase 프로젝트에서 `database_schema.sql` 파일의 내용을 SQL 편집기에서 실행하여 필요한 테이블을 생성합니다.
2. 환경 변수에 Supabase URL과 Anonymous Key가 올바르게 설정되어 있는지 확인합니다.

### 실행

```bash
# 개발 서버 실행 (HTTP 서버 사용)
npm run dev

# 프로덕션 서버 실행 (Express 서버, 환경 변수 주입)
npm start
```

브라우저에서 http://localhost:8090 으로 접속하여 애플리케이션을 확인할 수 있습니다.

## 프로젝트 구조

```
conference-chat/
├── js/              # 자바스크립트 모듈
│   ├── config.js            # 설정 파일 (API 키 등)
│   ├── env.js               # 환경 변수 로드 모듈
│   ├── supabase-client.js   # Supabase 연결 및 데이터 처리
│   ├── translation.js       # 번역 서비스 구현
│   ├── chat.js              # 채팅 UI 관리
│   ├── i18n.js              # 다국어 처리
│   ├── exhibition.js        # 전시물 정보 관리
│   ├── speakers.js          # 발표자 정보 관리
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
├── .env             # 환경 변수 파일 (git에서 무시됨)
├── .gitignore       # git 무시 파일 목록
├── env-setup.html   # 환경 변수 설정 페이지 (개발용)
├── index.html       # 메인 HTML 파일
├── server.js        # 환경 변수 주입 서버 (프로덕션용)
├── database_schema.sql  # 데이터베이스 스키마 스크립트
├── package.json     # 프로젝트 메타데이터
├── debugging_guide.md   # 디버깅 가이드
├── project_plan.md      # 프로젝트 계획
└── README.md        # 문서
```

## 보안 고려사항

- `.env` 파일과 같은 API 키가 포함된 파일은 항상 `.gitignore`에 추가하여 저장소에 올라가지 않도록 주의합니다.
- 실제 배포 환경에서는 환경 변수를 서버 설정이나 컨테이너 설정에서 관리하는 것이 좋습니다.
- 클라이언트 측에서는 필요한 최소한의 권한만 부여된 API 키를 사용합니다.
- 보안상 중요한 API 키는 가능하면 서버 측 요청을 통해 사용합니다.

## 최근 업데이트 (2025년 5월 5일)

- API 키 보안 강화 - 환경 변수 활용 구현
- 전시물 및 발표자 데이터 통합
- 로그아웃 기능 개선
- UI/UX 개선

## 라이센스

이 프로젝트는 모든 권리가 보유된 비공개 소프트웨어입니다.
