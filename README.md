# Global SeatCon 2025 컨퍼런스 채팅 애플리케이션

다국어 실시간 채팅 애플리케이션으로, Global SeatCon 2025 행사에서 다양한 언어를 사용하는 참가자들이 소통할 수 있는 플랫폼입니다.

## 주요 기능

- **실시간 채팅**: Supabase Realtime을 활용한 실시간 메시지 송수신
- **자동 번역**: Google Cloud Translation API를 활용한 메시지 자동 번역
- **다국어 지원**: 한국어, 영어, 일본어, 중국어 인터페이스 제공
- **오프라인 모드**: 네트워크 연결 끊김 시 자동 오프라인 모드 전환 및 재연결 시 동기화
- **답장 기능**: 특정 메시지에 대한 답장 기능
- **공지사항**: 관리자 전용 공지사항 기능
- **다중 채팅방**: 여러 개의 채팅방 지원 및 비공개 채팅방 기능
- **관리자 기능**: 채팅방 관리, 사용자 관리, 시스템 상태 확인

## 기술 스택

- **프론트엔드**: 순수 HTML, CSS, JavaScript (프레임워크 미사용)
- **백엔드**: Supabase (PostgreSQL + Realtime)
- **번역 API**: Google Cloud Translation API
- **로컬 저장소**: LocalStorage
- **호스팅**: 내장 웹 서버 / GitHub Pages

## 설치 및 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/conference-chat.git
cd conference-chat
```

### 2. 환경 설정
1. [setup_guide.md](setup_guide.md) 파일을 참고하여 Supabase 프로젝트 설정
2. 필요한 경우 `js/config.js` 파일에서 Supabase URL 및 키를 수정
3. 필요한 경우 `js/config.js` 파일에서 Google Cloud Translation API 키를 수정

### 3. 로컬에서 실행
#### 방법 1: Node.js 웹 서버 사용
```bash
# 의존성 패키지 설치 (개발 목적일 경우)
npm install

# 서버 실행
npm start

# 개발 모드로 실행 (자동 새로고침)
npm run dev
```
서버가 시작되면 다음 URL로 접속할 수 있습니다:
- 메인 페이지: http://localhost:3000
- 채팅 애플리케이션: http://localhost:3000/chat/
- 관리자 페이지: http://localhost:3000/admin.html

#### 방법 2: 정적 파일 서버 사용
Visual Studio Code의 Live Server 확장 프로그램 또는 Python의 내장 HTTP 서버 등을 사용할 수 있습니다.

```bash
# Python 내장 HTTP 서버 사용 예시
python -m http.server 3000
```

### 4. 배포
GitHub Pages 또는 다른 정적 웹 호스팅 서비스에 배포할 수 있습니다. 자세한 배포 방법은 [DEPLOY.md](DEPLOY.md) 파일을 참고하세요.

## 사용자 가이드

### 일반 사용자

1. 메인 페이지에 접속
2. "채팅 참여하기" 버튼 클릭
3. 사용자 이름과 선호 언어 선택 후 채팅방 선택
4. 비공개 채팅방의 경우 접근 코드(VIP 라운지: `vip2025`) 입력
5. 채팅방에서 메시지 작성 및 전송
6. 다른 사용자의 메시지에 답장 가능
7. 언어 변경 버튼을 통해 언어 변경 가능
8. 사용자 목록 버튼을 통해 현재 접속 중인 사용자 확인

### 관리자

1. 메인 페이지에서 "관리자 페이지" 버튼 클릭
2. 관리자 ID와 비밀번호로 로그인
   - 기본 관리자 계정: ID `kcmmer`, 비밀번호 `rnrud9881@@HH`
3. 탭을 통해 채팅방 관리, 사용자 관리, 통계 및 상태 확인
4. 채팅방 관리 탭에서 채팅방 생성, 수정, 삭제, 활성화/비활성화
5. 사용자 관리 탭에서 사용자 검색 및 권한 변경
6. 통계 탭에서 시스템 상태 및 각종 통계 확인

## 공지사항 작성 방법

관리자는 일반 채팅 화면에서 메시지 앞에 `/공지` 접두사를 붙여 공지사항을 작성할 수 있습니다.
예시: `/공지 모든 참가자께 안내드립니다. 10분 후 세션이 시작됩니다.`

## 오프라인 모드

네트워크 연결이 끊어지면 자동으로 오프라인 모드로 전환됩니다. 이 상태에서 작성한 메시지는 로컬에 저장되며, 네트워크 연결이 복구되면 자동으로 서버에 전송됩니다.

## API 서비스 정보

- **Supabase URL**: `https://dolywnpcrutdxuxkozae.supabase.co`
- **Google Cloud Translation API**: 메시지 자동 번역 기능 제공

## 업데이트 내역 (2025.05.17)

1. 코드 버그 수정
   - app-core.js 파일의 문법 오류 해결 (Unexpected token ':')
   - APP 객체 초기화 문제 해결
   - 모듈 로드 순서 및 의존성 문제 수정
   - 환경 설정 로드 오류 예외 처리 추가
2. 성능 개선
   - 중복 코드 제거 및 최적화
   - 메모리 누수 방지를 위한 코드 개선
   - 환경 설정 안정성 향상
3. 보안 개선
   - Content-Security-Policy 설정 강화
   - 오류 처리 및 로깅 강화
   - 예외 상황 처리 향상
4. UI/UX 개선
   - 로딩 상태 표시 개선
   - 오류 메시지 명확화
   - 사용자 피드백 향상

## 프로젝트 구조

```
conference-chat/
├── index.html                # 메인 애플리케이션 화면
├── admin.html                # 관리자 페이지
├── 404.html                  # 404 오류 페이지
├── chat/                     # 채팅 관련 파일
│   └── index.html            # 채팅 애플리케이션 화면
├── css/
│   ├── styles.css            # 메인 스타일시트
│   └── admin.css             # 관리자 페이지 스타일시트
├── js/
│   ├── config.js             # 애플리케이션 설정 및 API 키
│   ├── env-config.js         # 환경 변수 설정
│   ├── main.js               # 메인 애플리케이션 로직
│   ├── admin.js              # 관리자 페이지 로직
│   ├── modules/              # 모듈화된 앱 컴포넌트
│   │   ├── app-core.js       # 앱 핵심 로직
│   │   ├── app-ui.js         # UI 관련 기능
│   │   ├── app-i18n.js       # 다국어 처리
│   │   ├── app-chat.js       # 채팅 기능
│   │   ├── app-users.js      # 사용자 관리
│   │   ├── app-rooms.js      # 채팅방 관리
│   │   └── main.js           # 앱 진입점
│   └── services/
│       ├── dbService.js      # Supabase 연결 및 데이터 관리
│       ├── realtimeService.js# 실시간 통신 처리
│       ├── translationService.js # 번역 기능
│       ├── userService.js    # 사용자 관리 
│       ├── chatService.js    # 채팅 메시지 처리
│       └── offlineService.js # 오프라인 모드 지원
├── assets/                   # 정적 리소스
│   └── images/               # 이미지 파일
├── db_schema.sql             # 데이터베이스 스키마
├── db_admin_functions.sql    # 관리자 함수 정의
├── final_db_setup.sql        # 최종 DB 설정
├── server.js                 # Node.js 웹 서버 (로컬 테스트용)
├── package.json              # 프로젝트 의존성 및 스크립트
├── project_plan.md           # 프로젝트 계획 문서
├── README.md                 # 프로젝트 설명 문서
├── DEPLOY.md                 # 배포 가이드
├── SECURITY.md               # 보안 정책
└── setup_guide.md            # 설정 가이드
```

## 알려진 문제점 및 해결 방법

### 초기에 발생한 문제
1. `Uncaught SyntaxError: Unexpected token ':' (at app-core.js:14:19)` - app-core.js 파일에서 문법 오류
   - 해결: APP 객체 초기화 코드 수정 및 안전한 참조 로직 추가
   
2. `APP 객체가 정의되지 않았거나 초기화 함수가 없습니다.` - APP 객체 초기화 문제
   - 해결: 모듈 로드 순서 수정 및 의존성 문제 해결

### API 키 오류
- Supabase URL 및 키가 올바르게 설정되어 있는지 확인합니다.
- Google Cloud Translation API 키가 올바르게 설정되어 있고 API가 활성화되어 있는지 확인합니다.

### 실시간 통신 오류
- Supabase 프로젝트에서 Realtime 기능이 활성화되어 있는지 확인합니다.
- 브라우저 콘솔에서 오류 메시지를 확인합니다.

### 번역 오류
- Google Cloud Translation API의 할당량을 초과했을 수 있습니다. API 사용량을 확인하세요.
- 지원하지 않는 언어로 번역을 시도했을 수 있습니다.

## 성능 최적화

- 메시지 번역 결과를 캐싱하여 중복된 API 요청을 방지합니다.
- 오프라인 모드에서 사용하기 위한 필수 리소스를 미리 로드합니다.
- 메시지 목록 페이징을 통해 대용량 채팅 처리를 최적화합니다.
- APP 객체 초기화 로직 개선으로 성능 향상

## 추가 정보

자세한 설정 방법은 [setup_guide.md](setup_guide.md)를 참고하세요.  
배포 방법에 대한 자세한 정보는 [DEPLOY.md](DEPLOY.md)를 참고하세요.
보안 관련 정보는 [SECURITY.md](SECURITY.md)를 참고하세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.