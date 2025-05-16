# 배포 가이드

Global SeatCon 2025 컨퍼런스 채팅 애플리케이션의 배포 가이드입니다. 로컬 서버와 GitHub Pages 배포 방법을 설명합니다.

## 1. 로컬 서버 배포 (개발 및 테스트용)

### 필요 조건
- Node.js 14.x 이상 설치

### 설치 및 실행
```bash
# 프로젝트 디렉토리로 이동
cd conference-chat

# 필요한 의존성 패키지 설치
npm install

# 로컬 서버 실행
npm start
```

서버가 시작되면 다음 URL로 접속할 수 있습니다:
- 메인 페이지: http://localhost:3000
- 채팅 애플리케이션: http://localhost:3000/chat/
- 관리자 페이지: http://localhost:3000/admin.html

### 개발 모드로 실행
파일 변경 시 자동으로 서버를 재시작하는 개발 모드로 실행할 수 있습니다:
```bash
npm run dev
```

## 2. GitHub Pages 배포 (프로덕션용)

GitHub Pages는 정적 웹사이트를 무료로 호스팅할 수 있는 서비스입니다.

### 배포 준비

1. **보안 설정 확인**
   - `js/config.js` 파일에 있는 API 키를 확인하고, 필요한 경우 대체하세요.
   - 프로덕션 환경에서는 API 키를 환경 변수나 보안 스토리지에 저장하는 것이 좋습니다.

2. **GitHub Pages에 배포하기 전에 다음 사항을 고려하세요**
   - CORS (Cross-Origin Resource Sharing) 이슈: Supabase 및 Google Cloud Translation API는 CORS 설정이 필요할 수 있습니다.
   - Supabase 프로젝트의 RLS(Row Level Security) 정책을 적절히 설정하세요.
   - Google Cloud Translation API 키에 웹사이트 제한을 설정하세요.

### GitHub Pages 배포 과정

1. GitHub 저장소 생성 및 코드 푸시:
   ```bash
   # Git 저장소 초기화 (이미 초기화된 경우 생략)
   git init

   # 파일 추가
   git add .

   # 커밋
   git commit -m "Initial release of Global SeatCon 2025 Conference Chat"

   # GitHub 저장소 추가 (저장소 URL은 실제 저장소로 변경)
   git remote add origin https://github.com/your-username/conference-chat.git

   # 코드 푸시
   git push -u origin main
   ```

2. GitHub 저장소 설정에서 Pages 활성화:
   - 저장소 설정 → Pages → Source: "Deploy from a branch" → Branch: "main" → 저장

3. 배포 후 확인:
   - 배포가 완료되면 `https://[사용자명].github.io/conference-chat` 주소로 접속 가능
   - 채팅 애플리케이션은 `https://[사용자명].github.io/conference-chat/chat/` 에서 사용 가능
   - 관리자 페이지는 `https://[사용자명].github.io/conference-chat/admin.html` 에서 접속 가능

## 3. 다른 호스팅 서비스 배포

### 정적 웹 호스팅 서비스
다음과 같은 정적 웹 호스팅 서비스에 배포할 수 있습니다:
- Vercel
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront

#### Vercel 배포 예시
1. Vercel CLI 설치:
   ```bash
   npm install -g vercel
   ```

2. 배포:
   ```bash
   vercel login
   vercel
   ```

#### Netlify 배포 예시
1. Netlify CLI 설치:
   ```bash
   npm install -g netlify-cli
   ```

2. 배포:
   ```bash
   netlify login
   netlify deploy
   ```

## 4. 보안 주의사항

1. **API 키 보안**
   - 정적 웹 호스팅은 공개적으로 접근 가능한 파일을 제공합니다.
   - js/config.js 파일에 민감한 API 키를 그대로 노출하면 보안 위험이 있습니다.
   - 프로덕션 환경에서 API 키 보안을 위한 방법:
     - Google Cloud Translation API 키에 HTTP 리퍼러 제한 설정
     - Supabase JWT 토큰 인증 사용
     - 서버리스 함수를 통한 API 키 숨기기 (Netlify Functions, Vercel Serverless Functions)
     - API 게이트웨이 사용 (AWS API Gateway, Firebase Functions)

2. **Supabase 설정**
   - 프로덕션 환경에서는 Supabase 프로젝트의 보안 설정을 적절하게 구성하세요.
   - RLS(Row Level Security) 정책을 설정하여 데이터 접근을 제한하세요.
   - 안전한 인증 방식을 사용하세요.

3. **관리자 인증**
   - 현재 관리자 인증은 클라이언트 측에서 처리됩니다.
   - 실제 운영 환경에서는 서버 측 인증으로 변경하는 것이 좋습니다.

## 5. 성능 최적화

1. **파일 압축**
   - HTML, CSS, JavaScript 파일을 압축하여 용량 감소
   - 이미지 최적화

2. **CDN 사용**
   - 정적 리소스를 CDN을 통해 제공하여 로딩 속도 향상

3. **캐싱 전략**
   - 브라우저 캐싱 적용
   - 서비스 워커를 활용한 오프라인 지원 강화

4. **코드 분할**
   - 큰 JavaScript 파일을 여러 작은 파일로 분할하여 필요한 부분만 로드

## 6. 확장 및 유지 보수

1. **모니터링 설정**
   - 사용자 활동 및 오류 로깅
   - Supabase 데이터베이스 성능 모니터링

2. **백업 전략**
   - 정기적인 데이터베이스 백업
   - 데이터 복구 계획 수립

3. **확장 계획**
   - 사용자 수 증가에 따른 확장 전략
   - 새로운 기능 추가 계획