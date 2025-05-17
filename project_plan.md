# Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 프로젝트 계획

## 프로젝트 개요
Global SeatCon 2025 컨퍼런스를 위한 다국어 실시간 자동 번역 채팅 애플리케이션입니다. 이 애플리케이션은 다양한 국적의 참가자들이 언어 장벽 없이 자유롭게 소통할 수 있도록 지원합니다.

## 기술 스택
- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드 서비스**: Supabase (데이터베이스, 인증, 실시간 기능)
- **번역 서비스**: Google Cloud Translation API
- **호스팅**: GitHub Pages

## 프로젝트 구조
```
conference-chat/
├── .github/                 # GitHub 관련 파일
│   └── workflows/           # GitHub Actions 워크플로우
│       └── deploy.yml       # 배포 워크플로우
├── assets/                  # 이미지, 아이콘 등 정적 자원
├── css/                     # 스타일시트 파일
│   ├── styles.css           # 메인 스타일시트
│   └── admin-styles.css     # 관리자 페이지 스타일시트
├── js/                      # 자바스크립트 파일
│   ├── app-core.js          # 핵심 애플리케이션 로직
│   ├── app-ui.js            # UI 관련 기능
│   ├── app-i18n.js          # 다국어 처리 기능
│   ├── app-chat.js          # 채팅 관련 기능
│   ├── app-users.js         # 사용자 관리 기능
│   ├── app-rooms.js         # 채팅방 관리 기능
│   ├── admin/               # 관리자 페이지 스크립트
│   │   ├── admin-core.js    # 관리자 핵심 로직
│   │   ├── admin-dashboard.js # 관리자 대시보드
│   │   ├── admin-rooms.js   # 채팅방 관리
│   │   ├── admin-users.js   # 사용자 관리
│   │   └── admin-system.js  # 시스템 상태 모니터링
│   └── services/            # 서비스 모듈
│       ├── dbService.js     # Supabase 연동
│       ├── realtimeService.js # 실시간 기능
│       ├── translationService.js # 번역 서비스
│       ├── userService.js   # 사용자 서비스
│       ├── chatService.js   # 채팅 서비스
│       └── offlineService.js # 오프라인 모드 지원
├── locales/                 # 다국어 리소스
│   └── translations.json    # 다국어 번역 데이터
├── tests/                   # 테스트 파일
│   ├── index.html           # 테스트 페이지
│   ├── service-tests.js     # 서비스 모듈 테스트
│   └── ui-tests.js          # UI 테스트
├── admin/                   # 관리자 페이지
│   └── index.html           # 관리자 메인 페이지
├── index.html               # 메인 페이지
├── offline.html             # 오프라인 페이지
├── service-worker.js        # 서비스 워커
├── manifest.json            # PWA 매니페스트
├── package.json             # 프로젝트 설정 및 의존성
├── README.md                # 프로젝트 설명
└── project_plan.md          # 프로젝트 계획
```

## 개발 작업 계획

### 1단계: 초기 설정 및 기본 구조
- [x] project_plan.md 작성
- [x] 기본 디렉토리 구조 생성
- [x] 기본 HTML 파일 생성
- [x] 기본 CSS 파일 생성
- [x] 서비스 모듈 구현
  - [x] dbService.js
  - [x] realtimeService.js
  - [x] translationService.js
  - [x] userService.js
  - [x] chatService.js
  - [x] offlineService.js
- [x] 다국어 리소스 파일 생성 (translations.json)

### 2단계: 핵심 기능 구현
- [x] 다국어 처리 모듈 구현 (app-i18n.js)
- [x] UI 관련 모듈 구현 (app-ui.js)
- [x] 채팅방 관리 모듈 구현 (app-rooms.js)
- [x] 사용자 관리 모듈 구현 (app-users.js)
- [x] 애플리케이션 핵심 모듈 구현 (app-core.js)

### 3단계: 관리자 기능 구현
- [x] 관리자 페이지 HTML 생성
- [x] 관리자 페이지 CSS 생성
- [x] 관리자 핵심 모듈 구현 (admin-core.js)
- [x] 관리자 대시보드 모듈 구현 (admin-dashboard.js)
- [x] 채팅방 관리 모듈 구현 (admin-rooms.js)
- [x] 사용자 관리 모듈 구현 (admin-users.js)
- [x] 시스템 상태 모듈 구현 (admin-system.js)
- [x] README.md 작성

### 4단계: 테스트 및 최적화
- [x] 테스트 디렉토리 및 테스트 페이지 생성
- [x] 서비스 모듈 테스트 작성 (service-tests.js)
- [x] UI 테스트 작성 (ui-tests.js)
- [x] 서비스 워커 구현
- [x] 오프라인 페이지 생성 (offline.html)
- [x] PWA 지원 추가 (manifest.json)
- [x] 성능 최적화
  - [x] 메시지 캐싱 최적화
  - [x] 번역 결과 캐싱
  - [x] 오프라인 모드 최적화

### 5단계: 배포 및 문서화
- [x] 배포 워크플로우 설정 (.github/workflows/deploy.yml)
- [x] package.json 생성
- [ ] GitHub Pages 배포
- [ ] 사용자 가이드 작성
- [ ] 관리자 가이드 작성

## API 정보
- **Supabase URL**: 
  - `https://veudhigojdukbqfgjeyh.supabase.co` (1차)
  - `https://dolywnpcrutdxuxkozae.supabase.co` (2차, 새로운 API)
- **Google Cloud Translation API Key**: `AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs`

## 현재 진행 상황
- 기본 디렉토리 구조 생성 완료
- 기본 HTML, CSS 파일 생성 완료
- 서비스 모듈 구현 완료
- 다국어 리소스 파일 생성 완료
- 핵심 기능 모듈 구현 완료
- 관리자 기능 구현 완료
- README.md 작성 완료
- 테스트 파일 작성 완료
- 서비스 워커 및 PWA 지원 추가 완료
- 배포 파일 설정 완료

## 다음 단계
- GitHub Pages에 배포
- 사용자 가이드 작성
- 관리자 가이드 작성
