# 컨퍼런스 채팅 시스템 디버깅 가이드

## 일반적인 문제 해결 방법

### 1. 실시간 메시지가 전송/수신되지 않는 경우

#### 브라우저 콘솔 확인
1. 브라우저에서 개발자 도구(F12)를 열고 콘솔 탭을 확인합니다.
2. 다음과 같은 로그를 찾아보세요:
   - `Supabase realtime subscription status: SUBSCRIBED` - 연결 성공
   - `Supabase realtime subscription status: CLOSED` - 연결 끊김
   - `Supabase realtime subscription status: CHANNEL_ERROR` - 채널 오류

#### 해결 방법
- **오류 메시지가 있는 경우**: 콘솔 오류 메시지를 확인하고 해당 문제를 해결합니다.
- **연결 문제**: Supabase 프로젝트 설정에서 실시간 기능이 활성화되어 있는지 확인합니다.
- **테이블 권한 문제**: Supabase 대시보드에서 테이블에 대한 RLS 정책이 올바르게 설정되었는지 확인합니다.
- **API 키 문제**: `config.js`에서 Supabase URL과 Anon Key가 올바른지 확인합니다.

### 2. 번역 기능이 작동하지 않는 경우

#### 확인 사항
1. 브라우저 콘솔에서 번역 관련 오류 메시지를 확인합니다.
2. 번역 API 호출 응답 코드를 확인합니다.

#### 해결 방법
- **API 키 문제**: `config.js` 파일에서 Google Cloud Translation API 키가 올바른지 확인합니다.
- **API 할당량 문제**: Google Cloud 콘솔에서 Translation API 사용량과 할당량을 확인합니다.
- **지원되지 않는 언어**: `config.js` 파일의 `LANGUAGES` 배열에 해당 언어가 포함되어 있는지 확인합니다.

### 3. 사용자 로그인/로그아웃 문제

#### 확인 사항
1. 로컬 스토리지에 사용자 정보가 제대로 저장/삭제되고 있는지 확인합니다.
2. 브라우저 콘솔에서 오류 메시지를 확인합니다.

#### 해결 방법
- **로컬 스토리지 문제**: 브라우저 개발자 도구에서 애플리케이션 > 로컬 스토리지를 확인합니다.
- **사용자 정보 형식 오류**: `userManager.js`에서 사용자 정보 검증 로직을 확인합니다.

### 4. 스태프 비밀번호 관련 문제

#### 확인 사항
1. 스태프 역할 선택 시 비밀번호 필드가 나타나는지 확인합니다.
2. 비밀번호 입력 후 오류 메시지가 적절히 표시되는지 확인합니다.
3. 애니메이션 및 트랜지션 효과가 정상적으로 작동하는지 확인합니다.

#### 해결 방법
- **비밀번호 필드가 표시되지 않는 문제**: DOM 개발자 도구에서 `staffPasswordContainer` 요소가 존재하는지 확인합니다. `user.js` 파일의 `setupStaffPasswordField` 함수가 제대로 호출되었는지 확인합니다.
- **애니메이션 문제**: CSS 트랜지션이 제대로 작동하는지 확인합니다. `chat.css`에서 스태프 비밀번호 필드 관련 스타일을 확인합니다.
- **비밀번호 오류 메시지가 표시되지 않는 문제**: `handleLogin` 함수에서 스태프 비밀번호 검증 로직을 확인합니다. 오류 메시지가 올바르게 DOM에 추가되는지 확인합니다.
- **비밀번호 값 확인**: 스태프 비밀번호는 '9881'입니다. 이 값이 `user.js` 파일에 하드코딩되어 있는지 확인합니다.
- **CSS 클래스 추가 문제**: `handleRoleChange` 함수에서 CSS 클래스 추가/제거가 제대로 작동하는지 확인합니다.

### 5. 스태프 메시지 고정 기능 문제

#### 확인 사항
1. 스태프 메시지가 상단에 고정되는지 확인합니다.
2. 새로운 스태프 메시지 작성 시 고정된 메시지가 업데이트되는지 확인합니다.

#### 해결 방법
- **고정 메시지 컨테이너 문제**: `chat.js` 파일의 `createPinnedMessageContainer` 함수가 제대로 호출되었는지 확인합니다.
- **마지막 스태프 메시지 검색 문제**: `findLastStaffMessage` 함수가 정상적으로 작동하는지 확인합니다.
- **고정 메시지 업데이트 문제**: `updatePinnedMessage` 함수가 제대로 호출되는지 확인합니다.
- **스태프 역할 식별 문제**: 사용자 역할이 올바르게 저장되고 있는지 확인합니다.

## Supabase 관련 문제

### 테이블 및 정책 확인

1. Supabase 대시보드에서 테이블 구조를 확인합니다.
   - `comments` 테이블과 `message_likes` 테이블이 존재하는지 확인
   - 각 테이블의 컬럼 구조가 올바른지 확인

2. RLS 정책을 확인합니다.
   - 모든 테이블에 대해 적절한 읽기/쓰기 권한이 설정되어 있는지 확인

3. 실시간 구독 설정을 확인합니다.
   - Database > Replication > Supabase Realtime에서 `comments`와 `message_likes` 테이블이 활성화되어 있는지 확인

### SQL 스크립트 실행 방법

1. Supabase 대시보드에서 SQL 편집기로 이동합니다.
2. `database_schema.sql` 파일의 내용을 복사하여 편집기에 붙여넣습니다.
3. 스크립트를 실행하고 오류 메시지가 있는지 확인합니다.

## 코드 디버깅 팁

### 디버그 모드 활성화

`config.js` 파일에서 `CONFIG.APP.DEBUG_MODE = true`로 설정되어 있는지 확인합니다. 디버그 모드를 활성화하면 더 자세한 로그 정보가 콘솔에 출력됩니다.

### 실시간 구독 디버깅

```javascript
// 테스트용 구독 코드
const channel = supabaseClient.supabase.channel('test');
channel.subscribe(status => {
  console.log(`Test subscription status: ${status}`);
});
```

### 기본 테스트 메시지 전송

```javascript
// 테스트 메시지 직접 삽입 (SQL 편집기에서 실행)
INSERT INTO public.comments (speaker_id, author_name, author_email, content, user_role, language)
VALUES ('global-chat', '테스트 사용자', 'test@example.com', '테스트 메시지입니다.', 'attendee', 'ko');
```

### 스태프 역할 메시지 테스트

```javascript
// 스태프 메시지 직접 삽입 (SQL 편집기에서 실행)
INSERT INTO public.comments (speaker_id, author_name, author_email, content, user_role, language)
VALUES ('global-chat', '테스트 스태프', 'staff@example.com', '공지사항: 테스트 메시지입니다.', 'staff', 'ko');
```

### CSS 애니메이션 디버깅

브라우저 개발자 도구의 Elements 탭에서 요소를 선택한 후:
1. Styles 패널에서 트랜지션 및 애니메이션 관련 CSS 속성을 확인합니다.
2. 요소의 클래스가 제대로 추가/제거되는지 확인합니다.
3. 애니메이션 효과를 일시 중지하려면 개발자 도구의 Animation 패널을 사용합니다.

## 성능 최적화 팁

1. 번역 캐시 확인: 로컬 스토리지에 번역 결과가 캐시되어 있는지 확인합니다.
2. 네트워크 요청 모니터링: 개발자 도구의 네트워크 탭에서 API 호출을 모니터링합니다.
3. 메모리 사용량 확인: 장시간 사용 시 메모리 누수가 발생하는지 확인합니다.
4. 애니메이션 성능: 복잡한 애니메이션이 성능에 영향을 주는지 확인합니다.
