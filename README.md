# 시트 컨퍼런스 채팅 플랫폼

시트 기술 컨퍼런스를 위한 종합 웹 애플리케이션으로, 전시물 정보 관리, 발표 및
일정 관리, 실시간 다국어 채팅 기능을 제공하는 플랫폼입니다.

## 주요 기능

### 사용자 기능
- **전시물 정보 조회**: 컨퍼런스에 출품된 전시물 목록과 상세 정보를 조회할 수 있습니다.
- **발표 일정 조회**: 컨퍼런스 내 발표 일정을 조회하고 검색할 수 있습니다.
- **컨퍼런스 일정 조회**: 전체 컨퍼런스 일정을 조회하고 유형별로 필터링할 수 있습니다.
- **실시간 채팅**: 다양한 주제의 채팅방에 참여하여 다른 참가자들과 실시간으로 소통할 수 있습니다.
- **다국어 지원**: 채팅 메시지 자동 번역 기능을 통해 다양한 언어로 의사소통이 가능합니다.
- **사용자 계정 관리**: 개인 프로필 및 언어 설정을 관리할 수 있습니다.

### 관리자 기능
- **전시물 관리**: 전시물 정보를 추가, 수정, 삭제할 수 있습니다.
- **발표 관리**: 발표 일정을 추가, 수정, 삭제할 수 있습니다.
- **일정 관리**: 컨퍼런스 일정을 추가, 수정, 삭제할 수 있습니다.
- **채팅방 관리**: 새로운 채팅방을 생성하고 관리할 수 있습니다.
- **사용자 관리**: 사용자 계정을 관리하고 권한을 설정할 수 있습니다.

## 기술 스택

### 프론트엔드
- React.js
- React Router
- React Hook Form
- TailwindCSS
- Zustand (상태관리)
- date-fns (날짜 관리)
- i18next (다국어 지원)

### 백엔드
- Supabase
  - 인증 및 권한 관리
  - PostgreSQL 데이터베이스
  - 실시간 기능 (메시지 처리)
- Google Cloud Translation API (자동 번역)

## 설치 및 실행 방법

### 사전 준비
1. Node.js 14 이상 설치
2. Supabase 계정 (무료 티어로 시작 가능)
3. Google Cloud Platform 계정 (Translation API 사용)

### 설치 과정
1. 저장소 클론
   ```bash
   git clone https://github.com/your-repo/conference-chat.git
   cd conference-chat
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:
   ```
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   REACT_APP_GOOGLE_TRANSLATION_API_KEY=your-google-translation-api-key
   ```

4. 데이터베이스 설정 (최초 1회)
   ```bash
   npm run setup-db
   ```
   자세한 설정 방법은 [DATABASE_SETUP.md](./DATABASE_SETUP.md) 파일을 참조하세요.

5. 개발 서버 실행
   ```bash
   npm start
   ```
   브라우저에서 http://localhost:3000 으로 접속하여 확인할 수 있습니다.

6. 빌드
   ```bash
   npm run build
   ```
   `build` 폴더에 배포용 파일이 생성됩니다.

## 프로젝트 구조

```
conference-chat/
├── public/                 # 정적 파일
├── src/                    # 소스 코드
│   ├── assets/             # 이미지, 폰트 등 자산
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── chat/           # 채팅 관련 컴포넌트
│   │   ├── exhibit/        # 전시물 관련 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   ├── presentation/   # 발표 관련 컴포넌트
│   │   ├── schedule/       # 일정 관련 컴포넌트
│   │   └── user/           # 사용자 관련 컴포넌트
│   ├── context/            # React Context
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── admin/          # 관리자 페이지
│   │   ├── chat/           # 채팅 페이지
│   │   ├── exhibit/        # 전시물 페이지
│   │   ├── presentation/   # 발표 페이지
│   │   ├── schedule/       # 일정 페이지
│   │   └── user/           # 사용자 페이지
│   ├── routes/             # 라우팅 설정
│   ├── services/           # API 통신 및 서비스
│   └── utils/              # 유틸리티 함수
│       └── database/       # 데이터베이스 관련 스크립트
├── .env                    # 환경 변수
├── package.json            # 의존성 및 스크립트
└── tailwind.config.js      # TailwindCSS 설정
```

## 사용 가이드

### 사용자 가이드
1. 회원가입 및 로그인
   - 홈페이지 오른쪽 상단의 프로필 아이콘 클릭
   - 회원가입 또는 로그인 선택
   - 필요한 정보 입력

2. 전시물 탐색
   - 상단 메뉴에서 '전시물' 클릭
   - 목록에서 관심 있는 전시물 선택
   - 상세 정보 확인

3. 발표 일정 확인
   - 상단 메뉴에서 '발표 일정' 클릭
   - 날짜별 또는 유형별로 필터링 가능
   - 특정 발표를 클릭하여 상세 정보 확인

4. 채팅 참여
   - 상단 메뉴에서 '채팅' 클릭
   - 채팅방 목록에서 참여할 방 선택
   - 실시간으로 메시지 전송 및 다른 참가자와 소통

### 관리자 가이드
1. 관리자 페이지 접근
   - 관리자 계정으로 로그인
   - 프로필 메뉴에서 '관리자 페이지' 선택

2. 전시물 관리
   - '전시물 관리' 메뉴 선택
   - 새 전시물 추가, 기존 전시물 수정 또는 삭제

3. 발표 및 일정 관리
   - '발표 관리' 또는 '일정 관리' 메뉴 선택
   - 항목 추가, 수정, 삭제

4. 채팅방 관리
   - '채팅방 관리' 메뉴 선택
   - 새 채팅방 생성 또는 기존 채팅방 관리

5. 사용자 관리
   - '사용자 관리' 메뉴 선택
   - 사용자 계정 조회 및 관리

## 라이센스
이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 기여 방법
1. 이 저장소를 포크(Fork)합니다.
2. 새로운 기능 브랜치를 생성합니다: `git checkout -b feature/awesome-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add awesome feature'`
4. 브랜치를 푸시합니다: `git push origin feature/awesome-feature`
5. Pull Request를 제출합니다.

## 문의사항
버그 리포트나 기능 요청은 GitHub 이슈를 통해 제출해주세요.
