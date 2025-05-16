# API 키 보안 가이드

이 문서는 Global SeatCon 2025 컨퍼런스 채팅 애플리케이션의 API 키 보안을 위한 가이드입니다.

## 현재 API 키 정보

애플리케이션은 다음 API 키를 사용합니다:

- **Supabase URL**: `https://dolywnpcrutdxuxkozae.supabase.co`
- **Supabase 익명 키**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8`
- **Google Cloud Translation API 키**: `AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs`

## 개발 환경에서의 API 키 관리

개발 환경에서는 `env-config.js` 파일에 API 키가 포함되어 있지만, 이 파일은 GitHub에 업로드하지 않도록 `.gitignore` 파일에 추가해야 합니다.

```bash
# .gitignore에 추가
js/env-config.js
```

## 운영 환경에서의 API 키 관리 방법

### 1. 환경 변수 사용

서버 측 환경 변수를 사용하여 API 키를 관리하는 것이 가장 안전합니다. Node.js 서버를 사용하는 경우 다음과 같이 환경 변수를 설정할 수 있습니다:

```javascript
// server.js
const express = require('express');
const app = express();

app.get('/api/config', (req, res) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    TRANSLATION_API_KEY: process.env.TRANSLATION_API_KEY
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

환경 변수는 서버 시작 시 다음과 같이 설정할 수 있습니다:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_KEY=your-anon-key \
TRANSLATION_API_KEY=your-translation-api-key \
node server.js
```

### 2. GitHub Secrets 사용

GitHub Actions를 사용하여 배포하는 경우 GitHub Secrets를 사용하여 API 키를 안전하게 관리할 수 있습니다:

1. GitHub 저장소 설정 → Secrets and variables → Actions으로 이동
2. "New repository secret" 버튼을 클릭하여 다음 비밀을 추가:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `TRANSLATION_API_KEY`

워크플로우 파일에서 다음과 같이 사용할 수 있습니다:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          
      - name: Create env-config.js
        run: |
          echo "window.ENV_CONFIG = {" > js/env-config.js
          echo "  SUPABASE_URL: '${{ secrets.SUPABASE_URL }}'," >> js/env-config.js
          echo "  SUPABASE_KEY: '${{ secrets.SUPABASE_KEY }}'," >> js/env-config.js
          echo "  TRANSLATION_API_KEY: '${{ secrets.TRANSLATION_API_KEY }}'" >> js/env-config.js
          echo "};" >> js/env-config.js
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 3. API 키 제한 설정

API 키 자체에 제한을 설정하는 것이 중요합니다:

#### Google Cloud Translation API 키 제한

1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보로 이동
2. API 키를 선택하고 "편집" 버튼 클릭
3. "API 제한" 섹션에서 "Cloud Translation API"만 선택
4. "애플리케이션 제한" 섹션에서 "HTTP 리퍼러"를 선택하고 웹사이트 도메인 추가

#### Supabase 보안 설정

1. Supabase 대시보드 → Authentication → Policies로 이동
2. 적절한 RLS(Row Level Security) 정책 설정
3. API 키 갱신 주기 설정

## 클라이언트 측 코드 변경

API 키를 서버 측에서 가져오도록 클라이언트 코드를 수정해야 합니다:

```javascript
// js/config.js에서 API 키를 로드하는 방법 예시
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    
    window.CONFIG = {
      SUPABASE_URL: config.SUPABASE_URL,
      SUPABASE_KEY: config.SUPABASE_KEY,
      TRANSLATION_API_KEY: config.TRANSLATION_API_KEY,
      TRANSLATION_API_URL: 'https://translation.googleapis.com/language/translate/v2',
      // ... 다른 설정
    };
    
    // 초기화 완료 이벤트 발생
    window.dispatchEvent(new CustomEvent('config-loaded'));
  } catch (error) {
    console.error('설정 로드 실패:', error);
  }
}

// 설정 로드 시작
loadConfig();
```

## 추가 보안 조치

1. **Content Security Policy (CSP)** 설정
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co https://translation.googleapis.com;">
   ```

2. **HTTPS 사용**: 모든 API 통신은 HTTPS를 통해 이루어져야 합니다.

3. **서버리스 함수 사용**: API 키를 클라이언트에 노출하지 않고 서버리스 함수(AWS Lambda, Vercel Functions, Netlify Functions 등)를 통해 API 요청을 프록시할 수 있습니다.

## 정기적인 보안 검토

1. 분기별로 API 키 갱신
2. 보안 취약점 검사 실행
3. 접근 로그 및 사용량 검토