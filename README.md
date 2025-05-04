# 프리미엄 컨퍼런스 채팅 시스템

## 프로젝트 소개
프리미엄 컨퍼런스 채팅 시스템은 컨퍼런스 및 전시회 환경에서 참가자, 전시자, 발표자 간의 원활한 소통을 지원하는 고급 실시간 채팅 애플리케이션입니다. Google Cloud Translation API를 활용한 다국어 실시간 번역 기능을 제공하며, Supabase를 통해 안정적인 실시간 메시징과 데이터 관리를 구현했습니다.

## 핵심 기능
- **다국어 실시간 번역**: 여러 언어로 원활한 소통
- **역할 기반 인터페이스**: 발표자, 전시자, 참가자별 맞춤형 UI
- **전시업체 및 일정 정보 통합**: 컨퍼런스 정보를 한 곳에서 확인
- **실시간 메시징 및 좋아요**: 적극적인 소통 지원
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

## 사용 방법

### 로그인
1. 이름, 이메일, 역할(참가자, 전시자, 발표자, 스태프), 선호 언어를 입력하여 채팅방에 입장합니다.

### 채팅
1. 메시지 입력창에 메시지를 입력하고 전송 버튼을 클릭하여 메시지를 보냅니다.
2. 이모지 버튼을 클릭하여 이모지를 추가할 수 있습니다.
3. 다른 언어로 작성된 메시지는 자동으로 사용자의 선호 언어로 번역됩니다.
4. 메시지에 좋아요를 표시할 수 있습니다.

### 사이드바 활용
1. 좌측 사이드바에서 전시업체 정보와 컨퍼런스 일정을 확인할 수 있습니다.
2. 우측 사이드바에서 현재 접속 중인 참가자 목록을 확인할 수 있습니다.

### 설정
1. 상단 프로필 아이콘을 클릭하여 설정 모달을 열 수 있습니다.
2. 언어, 테마, 알림, 글꼴 크기 등을 설정할 수 있습니다.

## 개발자 문서

자세한 개발자 문서는 `docs` 디렉토리에서 확인할 수 있습니다:

- [아키텍처 문서](docs/architecture.md)
- [API 문서](docs/api.md)
- [컴포넌트 문서](docs/components.md)

## 기술 스택
- **프론트엔드**: HTML5, CSS3, JavaScript
- **백엔드**: Supabase
- **API**: Google Cloud Translation API
- **도구**: Webpack, ESLint, Prettier

## 기여 방법
1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/awesome-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add awesome feature'`
4. 브랜치를 푸시합니다: `git push origin feature/awesome-feature`
5. Pull Request를 생성합니다.

## 라이센스
MIT 라이센스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 문의처
프로젝트 관리자: example@example.com