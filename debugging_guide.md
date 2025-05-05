# 컨퍼런스 채팅 시스템 디버깅 가이드

이 문서는 2025 글로벌 시트 컨퍼런스 채팅 시스템의 문제 해결 및 디버깅을 위한 가이드입니다.

## 1. 주요 오류 유형 및 해결 방법

### 1.1 환경 변수 및 API 키 문제

#### 문제: "Unable to load configuration" 오류
- **증상**: 애플리케이션 로드 시 "설정을 로드할 수 없습니다" 오류 메시지
- **원인**: 환경 변수를 읽을 수 없거나 서버가 실행되지 않음
- **해결 방법**:
  1. `.env` 파일이 프로젝트 루트에 있는지 확인
  2. `.env` 파일에 필요한 모든 키가 있는지 확인 (SUPABASE_URL, SUPABASE_KEY, TRANSLATION_API_KEY)
  3. `server.js` 파일이 실행 중인지 확인 (`npm start` 명령으로 실행)
  4. 개발 환경에서는 `/env-setup.html`에서 설정 확인 및 업데이트

#### 문제: API 키 오류 또는 액세스 거부
- **증상**: API 요청이 실패하고 401, 403 오류 발생
- **해결 방법**:
  1. API 키의 유효성 및 활성 상태 확인
  2. Supabase 프로젝트 설정에서 Anonymous API 키가 활성화되어 있는지 확인
  3. Google Cloud Console에서 Translation API가 활성화되어 있는지 확인
  4. API 키에 필요한 권한이 모두 부여되었는지 확인

### 1.2 모듈 의존성 문제

#### 문제: `i18nService is not defined`
- **원인**: `mobile-ui.js` 파일에서 i18n 모듈을 제대로 가져오지 못함
- **해결 방법**: 
  ```javascript
  // mobile-ui.js 맨 위에 i18nService 가져오기 추가
  import i18nService from './i18n.js';
  ```

#### 문제: 불필요한 모듈 참조
- **설명**: `exhibition.js`와 `speakers.js` 모듈은 현재 버전에서 제거됨
- **해결 방법**: 이 모듈들에 대한 참조가 있는 코드 모두 제거

### 1.3 Supabase 연결 문제

#### 문제: 실시간 구독 오류
- **증상**: 메시지가 실시간으로 업데이트되지 않음
- **해결 방법**:
  1. 브라우저 콘솔에서 `Supabase realtime test status:` 확인
  2. 상태가 `SUBSCRIBED`가 아닌 경우, 네트워크 연결 확인
  3. Supabase API 키와 URL이 올바른지 확인
  4. 환경 변수가 올바르게 로드되었는지 확인 (콘솔에서 `CONFIG.isConfigLoaded()` 호출로 확인)

### 1.4 로그아웃 문제

#### 문제: 불완전한 로그아웃
- **증상**: 로그아웃 후 다시 로그인할 때 이전 사용자 정보가 남아있음
- **해결 방법**:
  1. `user.js`에서 폼 초기화 코드 확인
  2. `supabase-client.js`에서 `clearUserInfo()` 함수 실행 확인
  3. 로컬 스토리지에서 사용자 정보와 메시지 캐시가 제대로 삭제되었는지 확인

### 1.5 다국어 지원 문제

#### 문제: 번역이 제대로 적용되지 않음
- **증상**: 언어 변경 후에도 텍스트가 업데이트되지 않음
- **해결 방법**:
  1. `i18nService.updateAllTexts()` 호출 확인
  2. 번역 키가 올바르게 정의되어 있는지 확인
  3. `data-i18n` 속성이 올바르게 설정되어 있는지 확인
  4. API 키가 올바르게 로드되었는지 확인

## 2. 로깅 및 디버깅 도구

### 2.1 콘솔 로깅

앱은 `utils.js`의 로깅 유틸리티를 사용합니다:

```javascript
// 정보 로깅
utils.log('Message', data);

// 경고 로깅
utils.logWarning('Warning', data);

// 오류 로깅
utils.logError('Error', error);
```

### 2.2 디버그 모드 활성화

`config.js` 파일에서 디버그 모드를 활성화하여 자세한 로그를 볼 수 있습니다:

```javascript
DEBUG_MODE: true, // 개발용, 배포 시 false로 변경
```

### 2.3 환경 변수 상태 확인

브라우저 콘솔에서 다음 명령으로 환경 변수 로드 상태를 확인할 수 있습니다:

```javascript
// 설정 로드 여부 확인
console.log('설정 로드 상태:', CONFIG.isConfigLoaded());

// Supabase URL 확인 (실제 값이 아닌 마스킹된 확인만 가능)
console.log('Supabase URL 설정됨:', !!CONFIG.SUPABASE_URL);

// Translation API 키 확인 (실제 값이 아닌 마스킹된 확인만 가능)
console.log('번역 API 키 설정됨:', !!CONFIG.TRANSLATION_API_KEY);
```

### 2.4 네트워크 모니터링

1. 브라우저 개발자 도구의 Network 탭 사용
2. Supabase 요청과 Google Translation API 요청 검사
3. 오류 상태 코드 (4xx, 5xx) 확인
4. `/api/config` 엔드포인트 응답 확인 (서버 모드에서만 사용 가능)

## 3. 환경 변수 설정 문제 해결

### 3.1 서버 모드 환경 변수 (권장)

서버 모드에서 환경 변수를 사용할 때 문제 해결:

1. **서버 로그 확인**
   - 서버 시작 시 `환경 변수가 성공적으로 로드되었습니다` 메시지 확인
   - 오류 메시지가 있는지 확인

2. **환경 변수 검증**
   ```bash
   # Linux/macOS
   echo $SUPABASE_URL
   echo $SUPABASE_KEY
   echo $TRANSLATION_API_KEY
   
   # Windows
   echo %SUPABASE_URL%
   echo %SUPABASE_KEY%
   echo %TRANSLATION_API_KEY%
   ```

3. **서버 재시작**
   - 환경 변수를 변경한 후에는 항상 서버를 재시작해야 합니다
   ```bash
   npm start
   ```

### 3.2 브라우저 환경 설정 (개발용)

브라우저 로컬 스토리지를 사용할 때 문제 해결:

1. **로컬 스토리지 확인**
   - 개발자 도구 > Application > Local Storage
   - `env_supabaseUrl`, `env_supabaseKey`, `env_translationApiKey` 항목 확인

2. **환경 설정 페이지 사용**
   - `/env-setup.html` 페이지 접속
   - 설정 입력 및 저장
   - 성공 메시지 확인

3. **로컬 스토리지 초기화**
   - 문제가 지속되면 로컬 스토리지 초기화 후 다시 설정
   ```javascript
   localStorage.removeItem('env_supabaseUrl');
   localStorage.removeItem('env_supabaseKey');
   localStorage.removeItem('env_translationApiKey');
   ```

### 3.3 혼합 모드 문제

로컬 스토리지와 서버 환경 변수를 동시에 사용할 때 발생할 수 있는 문제:

- **증상**: 서버 API와 클라이언트 API 사이의 불일치
- **원인**: 서버와 클라이언트가 서로 다른 설정을 사용
- **해결 방법**:
  1. 서버 모드에서는 `/env-setup.html` 사용 시 경고 표시 확인
  2. 한 가지 방식만 사용하는 것이 좋음(서버 모드 권장)
  3. 개발 시에는 로컬 스토리지, 프로덕션에서는 서버 환경 변수 사용

## 4. 테스트 시나리오

### 4.1 기본 기능 테스트

1. **사용자 등록 및 로그인**
   - 다양한 역할(참가자, 스태프)로 등록
   - 이메일 형식 유효성 검사
   - 스태프 비밀번호 검증

2. **채팅 기능**
   - 메시지 전송
   - 실시간 메시지 수신
   - 좋아요 기능

3. **언어 설정**
   - 언어 변경
   - 메시지 자동 번역
   - 인터페이스 언어 업데이트

### 4.2 에지 케이스 테스트

1. **오프라인 상태 처리**
   - 네트워크 연결 끊김 시 동작
   - 재연결 시 동기화

2. **긴 메시지 처리**
   - 최대 길이 메시지 (1000자)
   - 여러 줄 메시지

3. **다양한 언어 조합**
   - 한 대화에서 여러 언어 사용
   - 특수 문자 및 이모지 포함

4. **환경 변수 전환 테스트**
   - 서버 모드와 클라이언트 모드 전환 시 동작 확인
   - 설정 변경 후 앱 동작 확인

## 5. 성능 최적화

### 5.1 번역 캐시

번역 결과는 `translationCache`에 저장되며, 24시간 후 만료됩니다. 캐시를 조회하거나 정리하려면:

```javascript
// 캐시된 번역 확인
console.log(translationService.translationCache);

// 캐시 정리
translationService.cleanupExpiredCache();
```

### 5.2 메모리 사용량

큰 메시지 히스토리를 로드할 때 메모리 사용량이 높아질 수 있습니다. 문제 발생 시:

1. `CONFIG.CHAT.HISTORY_LOAD_COUNT` 값을 줄임
2. 미사용 메시지를 메모리에서 해제

### 5.3 API 호출 최적화

번역 API 요청을 최적화하기 위한 방법:

1. 번역 캐시 활용 (기본 설정)
2. 동일한 원본 언어에서 동일한 대상 언어로의 중복 번역 방지
3. 번역이 필요하지 않은 경우(원본 언어와 대상 언어가 같을 때) 번역 건너뛰기

## 6. 배포 체크리스트

배포 전 다음 사항을 확인하십시오:

1. **API 키 보안**
   - Supabase 키와 Google Translation API 키를 환경 변수로 이동
   - 프로덕션 버전에서는 `.env` 파일 또는 서버 환경 변수 사용
   - `/env-setup.html` 페이지 제거 또는 접근 제한

2. **디버그 모드 비활성화**
   ```javascript
   DEBUG_MODE: false,
   ```

3. **오류 처리 강화**
   - 사용자 친화적인 오류 메시지 확인
   - 자동 재시도 로직 점검

4. **성능 테스트**
   - 대량의 동시 사용자 시뮬레이션
   - 다양한 기기 및 브라우저에서 테스트

## 7. 환경 변수 보안 최선 사례

1. **API 키 유출 방지**
   - `.env` 파일을 `.gitignore`에 포함 (이미 설정됨)
   - API 키를 코드나 리포지토리에 직접 포함하지 않음
   - 민감한 키에 대한 접근 제한 및 정기적인 교체

2. **권한 최소화**
   - Supabase Anonymous 키는 필요한 최소한의 권한만 가지도록 설정
   - Google Cloud API 키는 특정 API와 도메인으로 제한

3. **배포 환경 설정**
   - 서버에서는 환경 변수를 OS 또는 컨테이너 수준에서 설정
   - 클라우드 서비스 사용 시 보안 저장소 활용 (예: AWS Parameter Store, Google Secret Manager)

## 8. 연락처 및 지원

문제 해결에 도움이 필요하면 다음으로 연락하세요:

- **기술 지원**: support@conferenceapp.com
- **개발자 문의**: dev@conferenceapp.com
- **API 키 발급 및 관리**: security@conferenceapp.com

---

최종 업데이트: 2025년 5월 5일
