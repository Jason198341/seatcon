# Global SeatCon 2025 채팅 애플리케이션

Global SeatCon 2025 컨퍼런스를 위한 다국어 실시간 자동 번역 채팅 애플리케이션입니다. 이 애플리케이션은 다양한 국적의 참가자들이 언어 장벽 없이 자유롭게 소통할 수 있도록 지원합니다.

## 주요 기능

- **실시간 다국어 채팅**: 메시지 자동 번역으로 언어 장벽 없이 소통 가능
- **다국어 지원**: 한국어, 영어, 일본어, 중국어 지원
- **오프라인 모드**: 네트워크 연결이 불안정한 상황에서도 사용 가능
- **PWA 지원**: 모바일 및 데스크톱에서 앱처럼 설치하고 사용 가능
- **다양한 채팅방**: 공개/비공개 채팅방 지원
- **관리자 기능**: 채팅방 및 사용자 관리, 모니터링

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드 서비스**: Supabase (데이터베이스, 인증, 실시간 기능)
- **번역 서비스**: Google Cloud Translation API
- **호스팅**: GitHub Pages

## 개발 환경 설정

### 요구 사항

- Node.js 14 이상
- NPM 6 이상

### 설치 및 실행

1. 저장소를 클론합니다:

```bash
git clone https://github.com/username/conference-chat.git
cd conference-chat
```

2. 의존성을 설치합니다:

```bash
npm install
```

3. 로컬 서버를 실행합니다:

```bash
npm start
```

4. 브라우저에서 http://localhost:8080 으로 접속합니다.

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
├── admin/                   # 관리자 페이지
│   └── index.html           # 관리자 메인 페이지
├── index.html               # 메인 페이지
├── offline.html             # 오프라인 페이지
├── service-worker.js        # 서비스 워커
├── manifest.json            # PWA 매니페스트
├── package.json             # 프로젝트 설정 및 의존성
└── README.md                # 프로젝트 설명
```

## 사용자 가이드

### 일반 사용자

1. 홈페이지에서 원하는 언어를 선택합니다.
2. "채팅 참여하기" 버튼을 클릭합니다.
3. 사용자 이름을 입력하고 채팅방을 선택합니다.
4. 비공개 채팅방의 경우 접근 코드를 입력합니다.
5. 채팅 화면에서 메시지를 입력하고 전송합니다.
6. 다른 언어로 된 메시지는 자동으로 현재 선택한 언어로 번역됩니다.

### 관리자

1. 홈페이지에서 "관리자 페이지" 버튼을 클릭합니다.
2. 관리자 아이디와 비밀번호를 입력합니다.
3. 관리자 대시보드에서 다양한 기능을 사용할 수 있습니다:
   - 채팅방 생성, 수정, 삭제
   - 사용자 관리 및 권한 설정
   - 시스템 상태 모니터링
   - 활동 통계 조회

## 배포

GitHub Actions를 사용하여 GitHub Pages에 자동으로 배포됩니다. `main` 브랜치에 변경 사항을 푸시하면 자동으로 배포가 시작됩니다.

수동으로 배포하려면:

```bash
npm run deploy
```

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 문의

문의사항이 있으시면 [issues](https://github.com/username/conference-chat/issues)에 등록해주세요.
