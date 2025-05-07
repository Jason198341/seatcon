# 2025 글로벌 시트 컨퍼런스 채팅 시스템 배포 가이드

이 문서는 2025 글로벌 시트 컨퍼런스 실시간 다국어 번역 채팅 시스템의 배포 및 운영 방법을 설명합니다.

## 시스템 요구사항

- **웹 서버**: Node.js v16.0.0 이상
- **데이터베이스**: Supabase (PostgreSQL)
- **API 연동**: Google Cloud Translation API
- **클라이언트 환경**: 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 배포 단계

### 1. 개발 환경 설정

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd conference-chat
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   - API 키와 연결 정보는 이미 소스 코드에 포함되어 있습니다.
   - 필요한 경우 `js/supabase.js` 및 `js/translation.js` 파일에서 API 키를 업데이트하세요.

### 2. 로컬 테스트

1. **개발 서버 실행**
   ```bash
   npm start
   ```

2. **브라우저에서 테스트**
   - http://localhost:8080 에서 애플리케이션을 테스트하세요.
   - 모든 기능이 제대로 작동하는지 확인하세요.

### 3. 프로덕션 빌드

현재 이 애플리케이션은 별도의 빌드 단계가 필요 없는 순수 HTML/CSS/JavaScript로 구현되어 있습니다. 파일을 그대로 웹 서버에 복사하면 됩니다.

### 4. 서버 배포

#### 옵션 1: 정적 웹 호스팅 서비스 사용

1. **파일 업로드**
   - 모든 파일을 웹 호스팅 서비스(예: Netlify, Vercel, Firebase Hosting)에 업로드합니다.
   - 이 서비스들은 일반적으로 Git 저장소와 연동하여 자동 배포를 지원합니다.

2. **도메인 설정**
   - 호스팅 서비스에서 제공하는 도메인을 사용하거나 커스텀 도메인을 연결합니다.

#### 옵션 2: 자체 웹 서버 구성

1. **Node.js 웹 서버 설정**
   ```bash
   npm install -g http-server
   cd conference-chat
   http-server -p 80
   ```

2. **Nginx를 사용한 배포**
   ```nginx
   server {
       listen 80;
       server_name conference-chat.example.com;
       
       root /path/to/conference-chat;
       index index.html;
       
       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```

3. **Apache를 사용한 배포**
   ```apache
   <VirtualHost *:80>
       ServerName conference-chat.example.com
       DocumentRoot /path/to/conference-chat
       
       <Directory /path/to/conference-chat>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

### 5. Supabase 데이터베이스 설정

Supabase 프로젝트가 이미 설정되어 있으며, 스키마는 `js/supabase.js` 파일에 문서화되어 있습니다. 새로운 Supabase 프로젝트를 설정하려면:

1. **Supabase 계정 생성 및 프로젝트 설정**
   - [Supabase](https://supabase.io/)에서 계정을 생성하고 새 프로젝트를 설정합니다.
   - 프로젝트 설정에서 URL과 API 키를 확인합니다.

2. **데이터베이스 스키마 생성**
   - 아래 스키마 SQL을 Supabase SQL 에디터에서 실행합니다:

   ```sql
   -- 사용자 테이블
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       username TEXT NOT NULL,
       preferred_language TEXT NOT NULL DEFAULT 'ko',
       role TEXT NOT NULL DEFAULT 'participant',
       avatar_url TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- 카테고리 테이블
   CREATE TABLE categories (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name TEXT NOT NULL,
       description TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- 채팅방 테이블
   CREATE TABLE rooms (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name TEXT NOT NULL,
       description TEXT,
       category_id UUID REFERENCES categories(id),
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       created_by UUID REFERENCES users(id),
       is_active BOOLEAN NOT NULL DEFAULT TRUE
   );

   -- 메시지 테이블
   CREATE TABLE messages (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       room_id UUID REFERENCES rooms(id) NOT NULL,
       user_id UUID REFERENCES users(id) NOT NULL,
       content TEXT NOT NULL,
       original_language TEXT NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       reply_to_id UUID REFERENCES messages(id),
       is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
       is_deleted BOOLEAN NOT NULL DEFAULT FALSE
   );

   -- 번역 캐시 테이블
   CREATE TABLE translation_cache (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       original_text TEXT NOT NULL,
       target_language TEXT NOT NULL,
       translated_text TEXT NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- 좋아요 테이블
   CREATE TABLE likes (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       message_id UUID REFERENCES messages(id) NOT NULL,
       user_id UUID REFERENCES users(id) NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       UNIQUE(message_id, user_id)
   );

   -- 인덱스 생성
   CREATE INDEX idx_messages_room_id ON messages(room_id);
   CREATE INDEX idx_messages_user_id ON messages(user_id);
   CREATE INDEX idx_messages_created_at ON messages(created_at);
   CREATE INDEX idx_translation_cache_original_target ON translation_cache(original_text, target_language);
   CREATE INDEX idx_likes_message_id ON likes(message_id);
   CREATE INDEX idx_likes_user_id ON likes(user_id);
   ```

3. **행 수준 보안 (RLS) 정책 설정**
   - 필요한 경우 Supabase 대시보드에서 RLS 정책을 설정합니다. 이 애플리케이션은 기본적으로 모든 사용자가 데이터에 접근할 수 있는 단순한 RLS 정책을 사용합니다.

### 6. Google Cloud Translation API 설정

1. **Google Cloud 계정 설정**
   - [Google Cloud Console](https://console.cloud.google.com/)에서 계정을 생성하고 프로젝트를 설정합니다.

2. **Cloud Translation API 활성화**
   - Google Cloud Console에서 Cloud Translation API를 활성화합니다.

3. **API 키 생성**
   - API 키를 생성하고 적절한 제한(HTTP 리퍼러 제한 등)을 설정합니다.
   - 생성된 API 키를 `js/translation.js` 파일에 업데이트합니다.

### 7. 보안 고려사항

1. **API 키 보호**
   - 프로덕션 환경에서는 Supabase와 Google Cloud API 키를 보호하기 위해 환경 변수와 서버 측 프록시를 고려하세요.
   - 클라이언트 측 JS에서 API 키를 직접 사용하는 것은 보안상 최선의 방법이 아닙니다.

2. **CORS 설정**
   - 필요한 경우 API 요청의 CORS(Cross-Origin Resource Sharing) 설정을 구성하세요.

3. **HTTPS 사용**
   - 프로덕션 배포에는 항상 HTTPS를 사용하여 데이터 전송을 암호화하세요.
   - Let's Encrypt에서 무료 SSL 인증서를 얻을 수 있습니다.

### 8. 운영 환경 모니터링

1. **로그 모니터링**
   - 애플리케이션 로그를 모니터링하기 위한 시스템을 설정하세요.
   - 브라우저 콘솔 오류를 추적하기 위해 프론트엔드 모니터링 도구(예: Sentry)를 통합하는 것을 고려하세요.

2. **성능 모니터링**
   - 사용자 경험을 최적화하기 위해 애플리케이션 성능을 모니터링하세요.
   - Google Analytics 또는 Plausible Analytics를 통합하여 사용자 행동을 추적하세요.

3. **API 사용량 모니터링**
   - Google Cloud Console에서 Translation API 사용량과 비용을 정기적으로 확인하세요.
   - 번역 캐시 시스템이 API 호출을 효과적으로 줄이는지 확인하세요.

### 9. 확장성 고려사항

1. **대규모 이벤트 준비**
   - 많은 참가자가 있는 대규모 이벤트의 경우, 서버 리소스를 늘리는 것을 고려하세요.
   - 동시 접속자 수에 따라 웹 서버 구성을 최적화하세요.

2. **데이터베이스 확장**
   - 많은 채팅 메시지가 예상되는 경우, Supabase 계획을 업그레이드하거나 데이터베이스 성능을 최적화하세요.

3. **캐싱 전략**
   - CDN(Content Delivery Network)을 사용하여 정적 자산을 캐싱하세요.
   - 로컬 스토리지 및 세션 스토리지 사용을 최적화하세요.

### 10. 문제 해결

1. **일반적인 배포 문제**
   - **404 오류**: 파일 경로와 서버 구성을 확인하세요.
   - **CORS 오류**: API 요청에 대한 CORS 헤더를 확인하세요.
   - **API 키 오류**: API 키가 유효하고 올바르게 구성되어 있는지 확인하세요.

2. **Supabase 연결 문제**
   - Supabase 프로젝트가 활성 상태인지 확인하세요.
   - 네트워크 연결과 방화벽 설정을 확인하세요.

3. **번역 API 문제**
   - API 키가 유효하고 할당량이 남아 있는지 확인하세요.
   - API 요청 형식이 올바른지 확인하세요.

### 11. 유지 관리

1. **정기 백업**
   - Supabase 데이터베이스를 정기적으로 백업하세요.
   - 중요한 구성 파일을 백업 저장소에 보관하세요.

2. **업데이트 및 패치**
   - 보안 취약점에 대한 패치를 정기적으로 적용하세요.
   - 종속성을 최신 버전으로 유지하세요.

3. **사용자 피드백 수집**
   - 지속적인 개선을 위해 사용자 피드백을 수집하고 반영하세요.
   - 사용자 경험과 접근성 개선에 집중하세요.
