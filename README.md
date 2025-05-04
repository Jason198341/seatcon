# 프리미엄 컨퍼런스 채팅 시스템

## 프로젝트 소개
프리미엄 컨퍼런스 채팅 시스템은 컨퍼런스 및 전시회 환경에서 참가자, 전시자, 발표자 간의 원활한 소통을 지원하는 고급 실시간 채팅 애플리케이션입니다. Google Cloud Translation API를 활용한 다국어 실시간 번역 기능을 제공하며, Supabase를 통해 안정적인 실시간 메시징과 데이터 관리를 구현했습니다.

## 핵심 기능
- **다국어 실시간 번역**: 여러 언어로 원활한 소통
- **역할 기반 인터페이스**: 발표자, 전시자, 참가자별 맞춤형 UI
- **전시업체 및 일정 정보 통합**: 컨퍼런스 정보를 한 곳에서 확인
- **실시간 메시징 및 좋아요**: 적극적인 소통 지원
- **관리자 공지사항 기능**: 중요 공지를 모든 참가자에게 전달
- **오프라인 지원 모드**: 네트워크 연결 문제 시에도 안정적 사용
- **모바일 및 데스크톱 반응형 디자인**: 모든 기기에서 편리한 접근성
- **고급 UI/UX**: 프리미엄 사용자 경험 제공

## 설치 및 실행 방법

### 필수 요구사항
- Node.js 14.x 이상
- npm 또는 yarn
- 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전 권장)

### 설치 방법
1. 저장소 클론
   ```
   git clone https://github.com/your-username/conference-chat.git
   cd conference-chat
   ```

2. 의존성 설치
   ```
   npm install
   ```
   또는
   ```
   yarn install
   ```

### 개발 환경 실행
```
npm start
```
또는
```
yarn start
```

이후 웹 브라우저에서 `http://localhost:3000` 주소로 접속하면 애플리케이션을 사용할 수 있습니다.

### 빌드 방법
```
npm run build
```
또는
```
yarn build
```

빌드된 파일은 `dist` 디렉토리에 생성됩니다.

## 설정 방법

### API 키 설정
`js/config/config.js` 파일에서 다음 부분을 수정하여 API 키를 설정할 수 있습니다:

```javascript
// Supabase 연결 설정
SUPABASE: {
  URL: 'YOUR_SUPABASE_URL',
  KEY: 'YOUR_SUPABASE_KEY',
},

// Google Cloud Translation API 설정
TRANSLATION: {
  API_KEY: 'YOUR_GOOGLE_TRANSLATION_API_KEY',
  // ...
},
```

### 데이터베이스 설정
Supabase 프로젝트에서 필요한 테이블을 생성하기 위해 `sql/tables.sql` 스크립트를 실행합니다.

```sql
-- 메시지 테이블
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    speaker_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_generated_id TEXT,
    user_role TEXT,
    language TEXT,
    is_announcement BOOLEAN DEFAULT FALSE
);

-- 메시지 좋아요 테이블
CREATE TABLE IF NOT EXISTS message_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (message_id, user_email)
);
```

## 사용 방법

### 로그인
1. 이름, 이메일, 역할(참가자, 전시자, 발표자, 스태프), 선호 언어를 입력하여 채팅방에 입장합니다.

### 채팅
1. 메시지 입력창에 메시지를 입력하고 전송 버튼을 클릭하여 메시지를 보냅니다.
2. 이모지 버튼을 클릭하여 이모지를 추가할 수 있습니다.
3. 다른 언어로 작성된 메시지는 자동으로 사용자의 선호 언어로 번역됩니다.
4. 메시지에 좋아요를 표시할 수 있습니다.

### 공지사항 (관리자 전용)
1. 관리자로 로그인한 경우, 공지사항을 전송할 수 있습니다.
2. 공지사항은 특별한 스타일로 모든 사용자에게 표시됩니다.
3. 공지사항도 자동으로 각 사용자의 선호 언어로 번역됩니다.

### 오프라인 모드
1. 네트워크 연결이 끊긴 상태에서도 메시지를 입력할 수 있습니다.
2. 메시지는 로컬에 저장되고, 연결이 복구되면 자동으로 전송됩니다.
3. 연결 상태는 화면 상단에 표시됩니다.

### 사이드바 활용
1. 좌측 사이드바에서 전시업체 정보와 컨퍼런스 일정을 확인할 수 있습니다.
2. 우측 사이드바에서 현재 접속 중인 참가자 목록을 확인할 수 있습니다.

### 설정
1. 상단 프로필 아이콘을 클릭하여 설정 모달을 열 수 있습니다.
2. 언어, 테마, 알림, 글꼴 크기 등을 설정할 수 있습니다.

## 최신 업데이트 (2025-05-04)

### 기능 개선
- **공지사항 기능**: 관리자가 중요 공지를 전체 참가자에게 전달하는 기능 추가
- **메시지 표시 최적화**: 공지사항 전용 UI 템플릿 및 스타일 추가
- **연결 안정성 강화**: 네트워크 연결 문제 시 자동 재연결 및 오프라인 메시지 처리 개선
- **메시지 전송 과정 최적화**: 메시지 전송, 수신, 표시 프로세스 개선

### 버그 수정
- Supabase 연결 문제 해결
- 메시지 중복 표시 문제 해결
- 번역 캐싱 관련 오류 수정
- 다국어 지원 관련 오류 수정

## 개발자 문서

자세한 개발자 문서는 각 파일을 참조하세요:

- [프로젝트 계획](project_plan.md): 전체 개발 계획 및 진행 상황
- [테스트 계획](testing_plan.md): 테스트 시나리오 및 방법
- [문제 해결 가이드](README_TROUBLESHOOTING.md): 일반적인 문제 해결 방법
- [공지사항 기능 가이드](ANNOUNCEMENT_FEATURE.md): 공지사항 기능 사용 방법

## 폴더 구조
```
conference-chat/
├── css/                      # 스타일시트 파일
├── js/                       # JavaScript 파일
│   ├── components/           # UI 컴포넌트
│   ├── config/               # 애플리케이션 설정
│   ├── data/                 # 데이터 파일 (전시업체, 발표자 정보)
│   ├── services/             # 서비스 (채팅, 번역, 데이터 관리)
│   └── utils/                # 유틸리티 함수
├── sql/                      # SQL 스크립트
│   └── migrations/           # 마이그레이션 스크립트
└── index.html                # 메인 HTML 파일
```

## 기술 스택
- **프론트엔드**: HTML5, CSS3, JavaScript
- **백엔드**: Supabase (PostgreSQL, 실시간 API)
- **API**: Google Cloud Translation API
- **스타일**: CSS 변수, 플렉스박스, 그리드
- **아이콘**: FontAwesome
- **폰트**: Google Fonts, Pretendard

## 기여 방법
1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/awesome-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add awesome feature'`
4. 브랜치를 푸시합니다: `git push origin feature/awesome-feature`
5. Pull Request를 생성합니다.

## 라이센스
MIT 라이센스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 문의처
프로젝트 관리자: project-manager@conference-chat.com