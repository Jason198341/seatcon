# 컨퍼런스 채팅 시스템 로그인 문제 해결 가이드

## 로그인 과정에서 발생하는 일반적인 문제

컨퍼런스 채팅 시스템의 로그인 과정에서 다음과 같은 문제가 자주 발생할 수 있습니다:

1. 이름, 이메일, 역할을 입력하고 입장하기 버튼을 클릭했을 때 반응이 없음
2. 콘솔에 "Supabase 연결에 실패했습니다" 또는 관련 오류가 표시됨
3. Supabase 테이블이 없다는 오류가 콘솔에 표시됨
4. 로그인은 되지만 메시지 전송이 작동하지 않음

이 문서에서는 각 문제의 원인과 해결 방법을 단계별로 설명합니다.

## 필수 사전 요구사항

로그인이 정상적으로 작동하려면 다음 조건이 충족되어야 합니다:

1. Supabase 프로젝트가 생성되어 있어야 함
2. `config.js` 파일에 올바른 Supabase API 키와 URL이 설정되어 있어야 함
3. Supabase 데이터베이스에 필요한 테이블이 생성되어 있어야 함
4. `index.html` 파일에 Supabase 스크립트가 로드되어 있어야 함

## 문제 1: Supabase 스크립트 로드 실패

### 증상
- 콘솔에 "supabase is not defined" 오류 메시지가 표시됨
- 로그인 버튼 클릭 시 반응 없음

### 해결 방법

1. `index.html` 파일에 Supabase 스크립트가 올바르게 로드되었는지 확인:

```html
<!-- 다음 줄이 <head> 또는 <body> 끝 부분에 추가되어 있어야 함 -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

2. 로컬 환경에서 실행 중인 경우 웹 서버를 통해 접속해야 합니다:
   - `file://` 프로토콜로 직접 파일을 열면 외부 스크립트 로드에 문제가 발생할 수 있음
   - 간단한 웹 서버를 사용하여 접속 (예: `npx http-server`)

## 문제 2: Supabase 연결 오류

### 증상
- 콘솔에 "Supabase 연결에 실패했습니다" 오류 메시지가 표시됨
- 로그인 중 "Supabase 연결에 실패했습니다" 알림이 표시됨

### 해결 방법

1. `config.js` 파일에서 Supabase 연결 정보가 올바른지 확인:

```javascript
const CONFIG = {
    // Supabase 연결 설정
    SUPABASE: {
        URL: 'https://veudhigojdukbqfgjeyh.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao',
    },
    // ...
};
```

2. Supabase 프로젝트가 활성 상태인지 확인:
   - [Supabase 대시보드](https://app.supabase.com/)에 로그인하고 프로젝트 상태 확인
   - 프로젝트가 일시 중지되었거나 삭제된 경우 다시 활성화하거나 새 프로젝트 생성

3. 개발자 콘솔에서 네트워크 탭을 확인하여 Supabase API 호출이 성공하는지 확인:
   - 상태 코드 4xx 또는 5xx인 경우 자세한 오류 메시지 확인

## 문제 3: Supabase 테이블 없음 오류

### 증상
- 콘솔에 "relation 'comments' does not exist" 오류 메시지가 표시됨
- 로그인 후 메시지를 보내려고 할 때 오류 발생

### 해결 방법

1. Supabase SQL 편집기에서 테이블 생성:
   - Supabase 대시보드 > SQL 편집기로 이동
   - `sql/tables.sql` 파일의 내용을 복사하여 실행

```sql
-- comments 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    speaker_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_generated_id TEXT,
    user_role TEXT,
    language TEXT
);

-- message_likes 테이블 생성
CREATE TABLE IF NOT EXISTS message_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (message_id, user_email)
);

-- 실시간 구독을 위한 변경 알림 설정
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;

-- 기본 권한 정책 설정
CREATE POLICY "Anyone can insert comments" 
  ON comments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view comments" 
  ON comments FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert likes" 
  ON message_likes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their own likes" 
  ON message_likes FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view likes" 
  ON message_likes FOR SELECT 
  USING (true);
```

2. 테이블이 올바르게 생성되었는지 확인:
   - Supabase 대시보드 > 테이블 탭에서 `comments`와 `message_likes` 테이블이 있는지 확인
   - 또는 다음 SQL 쿼리 실행:

```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'comments'
);

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'message_likes'
);
```

## 문제 4: 권한 정책 오류

### 증상
- 콘솔에 "new row violates row-level security policy" 오류 메시지가 표시됨
- 메시지 전송 시 "메시지 전송에 실패했습니다" 알림이 표시됨

### 해결 방법

1. Supabase 대시보드 > 인증 > 정책에서 테이블 권한 설정 확인:
   - `comments` 테이블에 INSERT 및 SELECT 권한이 있는지 확인
   - `message_likes` 테이블에 INSERT, DELETE, SELECT 권한이 있는지 확인

2. SQL 편집기에서 권한 정책 추가:

```sql
-- 누구나 comments 테이블을 읽을 수 있도록 설정
CREATE POLICY "Anyone can view comments" 
  ON comments FOR SELECT 
  USING (true);

-- 누구나 comments 테이블에 삽입할 수 있도록 설정
CREATE POLICY "Anyone can insert comments" 
  ON comments FOR INSERT 
  WITH CHECK (true);

-- 누구나 message_likes 테이블을 읽을 수 있도록 설정
CREATE POLICY "Anyone can view likes" 
  ON message_likes FOR SELECT 
  USING (true);

-- 누구나 message_likes 테이블에 삽입할 수 있도록 설정
CREATE POLICY "Anyone can insert likes" 
  ON message_likes FOR INSERT 
  WITH CHECK (true);

-- 누구나 message_likes 테이블에서 삭제할 수 있도록 설정
CREATE POLICY "Anyone can delete likes" 
  ON message_likes FOR DELETE 
  USING (true);
```

## 문제 5: 실시간 구독 오류

### 증상
- 메시지는 전송되지만 다른 사용자에게 실시간으로 표시되지 않음
- 페이지를 새로 고침해야만 새 메시지가 표시됨

### 해결 방법

1. Supabase에서 실시간 기능이 활성화되어 있는지 확인:
   - Supabase 대시보드 > 데이터베이스 > 실시간 메뉴에서 설정 확인
   - 실시간 기능이 비활성화된 경우 활성화

2. 테이블에 실시간 변경 알림이 활성화되어 있는지 확인:
   - Supabase 대시보드 > 데이터베이스 > 실시간 메뉴에서 테이블 확인
   - 또는 다음 SQL 쿼리 실행:

```sql
-- 실시간 변경 알림 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE comments, message_likes;
```

3. 클라이언트 코드에서 올바른 채널 구독 확인:
   - `supabase-client.js` 파일에서 `subscribeToMessages` 및 `subscribeToLikes` 함수 확인

## 문제 6: Google Cloud Translation API 오류

### 증상
- 메시지가 전송되고 표시되지만 번역이 작동하지 않음
- 콘솔에 "Google Cloud Translation API 오류" 관련 메시지가 표시됨

### 해결 방법

1. `config.js` 파일에서 Google Cloud Translation API 키가 올바른지 확인:

```javascript
const CONFIG = {
    // ...
    // Google Cloud Translation API 설정
    TRANSLATION: {
        API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs',
        // ...
    },
    // ...
};
```

2. Google Cloud 콘솔에서 API 키가 활성화되어 있고 제한 사항이 올바르게 설정되어 있는지 확인:
   - [Google Cloud 콘솔](https://console.cloud.google.com/)에 로그인
   - API 및 서비스 > 사용자 인증 정보에서 API 키 확인
   - API 키에 Cloud Translation API 권한이 있는지 확인

3. 개발자 콘솔 네트워크 탭에서 Translation API 호출 확인:
   - API 호출 상태 코드 및 응답 데이터 확인
   - 할당량 초과 또는 결제 문제가 있는 경우 Google Cloud 콘솔에서 확인

## 문제 7: 브라우저 호환성 문제

### 증상
- 특정 브라우저에서만 로그인 또는 기능이 작동하지 않음
- 콘솔에 브라우저 호환성 관련 오류가 표시됨

### 해결 방법

1. 최신 버전의 모던 브라우저 사용:
   - Chrome, Firefox, Safari, Edge 최신 버전 권장
   - Internet Explorer는 지원하지 않음

2. 브라우저 캐시 및 쿠키 정리:
   - 브라우저 설정 > 개인정보 및 보안 > 인터넷 사용 기록 삭제
   - 캐시된 이미지 및 파일, 쿠키 선택 후 삭제

3. 개발자 도구에서 애플리케이션 탭 확인:
   - 로컬 스토리지 및 세션 스토리지 확인
   - 캐시 관련 문제 확인

## 문제 8: 데이터 구조 문제

### 증상
- 로그인 및 메시지 전송은 되지만 전시업체 정보나 일정 정보가 표시되지 않음
- 콘솔에 "Cannot read property of undefined" 유형의 오류가 표시됨

### 해결 방법

1. `js/data/exhibitors.js` 및 `js/data/presenters.js` 파일이 올바르게 로드되었는지 확인:
   - `index.html` 파일에 다음과 같은 스크립트 태그가 있는지 확인

```html
<!-- 데이터 파일 -->
<script src="js/data/exhibitors.js"></script>
<script src="js/data/presenters.js"></script>
```

2. 개발자 콘솔에서 전역 변수 확인:
   - 콘솔에 `EXHIBITORS_DATA`, `SCHEDULE_DATA`, `PRESENTER_DATA` 변수가 정의되어 있는지 확인
   - 변수가 정의되어 있지 않은 경우 데이터 파일 경로 및 구문 오류 확인

3. 데이터 구조가 올바른지 확인:
   - 각 데이터 객체가 필요한 모든 필드를 포함하고 있는지 확인
   - 배열 및 객체 구문이 올바른지 확인

## 디버깅 팁

### 개발자 콘솔 활용

1. 브라우저 개발자 콘솔 열기:
   - Chrome/Edge: F12 또는 Ctrl+Shift+I (Mac: Cmd+Option+I)
   - Firefox: F12 또는 Ctrl+Shift+K (Mac: Cmd+Option+K)

2. 콘솔 탭에서 오류 메시지 확인:
   - 빨간색 오류 메시지가 있는지 확인
   - 오류 메시지 클릭 시 소스 코드 위치로 이동

3. 네트워크 탭에서 API 요청 확인:
   - Supabase 및 Google Translation API 호출 상태 확인
   - 요청 헤더 및 응답 데이터 확인

4. 로깅 활성화:
   - `config.js` 파일에서 로깅 설정 활성화:
   ```javascript
   DEBUG: {
       ENABLED: true,
       LOG_LEVEL: 'debug', // debug, info, warn, error
   },
   ```

### 테스트 계정 사용

테스트 계정을 사용하여 로그인 및 기능을 확인:

- 이름: 테스트 사용자
- 이메일: test@example.com
- 역할: 참가자 (attendee)
- 언어: 한국어 (ko)

### 로컬 스토리지 초기화

문제가 지속되는 경우 브라우저 로컬 스토리지를 초기화:

1. 개발자 콘솔 > 애플리케이션 탭 > 로컬 스토리지 선택
2. 오른쪽 마우스 클릭 > 모두 지우기 또는 콘솔 탭에서 다음 명령 실행:
   ```javascript
   localStorage.clear();
   ```
3. 페이지 새로고침 후 다시 로그인

## 문의 및 추가 지원

위 해결 방법으로 문제가 해결되지 않는 경우 다음 정보와 함께 개발팀에 문의해주세요:

1. 브라우저 및 버전 정보
2. 오류 메시지 전체 내용
3. 문제 발생 단계
4. 스크린샷(가능한 경우)

개발팀 연락처: dev-support@conference-chat.com
