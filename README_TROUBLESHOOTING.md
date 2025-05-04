# 컨퍼런스 채팅 시스템 문제 해결 가이드

## 로그인 문제 해결

로그인 과정에서 다음과 같은 문제가 발생할 수 있습니다:

### 1. Supabase 초기화 오류

**증상:**
- 이름, 이메일, 역할을 선택하고 입장하기 버튼을 클릭하면 아무 반응이 없음
- 콘솔에 "Supabase 연결에 실패했습니다" 또는 "Supabase 스크립트 로드 실패" 오류 발생

**해결 방법:**
1. `config.js` 파일의 Supabase API 키와 URL 확인
2. Supabase 스크립트가 정상적으로 로드되었는지 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인
4. 다음 명령을 실행하여 Supabase 테이블이 올바르게 생성되었는지 확인:

```sql
-- Supabase SQL 편집기에서 실행
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

### 2. 테이블 구조 오류

**증상:**
- 로그인은 되지만 메시지 전송이 작동하지 않음
- 콘솔에 SQL 구문 오류 또는 "relation does not exist" 오류 발생

**해결 방법:**
1. `sql/tables.sql` 파일의 SQL 명령문을 Supabase SQL 편집기에서 실행
2. 테이블 구조가 올바른지 확인:
   ```sql
   -- Supabase SQL 편집기에서 실행
   \d comments
   \d message_likes
   ```

### 3. 데이터 로드 오류

**증상:**
- 전시업체 또는 발표자 데이터가 사이드바에 표시되지 않음
- 콘솔에 "데이터 로드에 실패했습니다" 또는 관련 오류 발생

**해결 방법:**
1. 개발자 콘솔에서 `js/data/exhibitors.js` 및 `js/data/presenters.js` 파일이 올바르게 로드되었는지 확인
2. 파일 경로와 스크립트 태그가 올바른지 확인
3. 데이터 형식이 올바른지 확인

## Supabase 설정 가이드

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com/) 계정에 로그인하고 프로젝트 생성
2. 프로젝트 API 키와 URL을 가져와 `config.js` 파일에 복사
3. SQL 편집기에서 `sql/tables.sql` 파일의 내용을 실행

### 2. 권한 설정

Supabase에서 익명 액세스를 활성화하려면:

1. Supabase 프로젝트 대시보드에서 "Authentication" 탭으로 이동
2. "Settings"로 이동하고 "Enable anonymous signup" 활성화
3. "Policies" 탭으로 이동하여 다음 정책을 설정:

```sql
-- 모든 사용자에게 comments 테이블 READ 권한 부여
CREATE POLICY "Anyone can read comments" ON comments
FOR SELECT USING (true);

-- 모든 사용자에게 comments 테이블 INSERT 권한 부여
CREATE POLICY "Anyone can insert comments" ON comments
FOR INSERT WITH CHECK (true);

-- 모든 사용자에게 message_likes 테이블 READ 권한 부여
CREATE POLICY "Anyone can read message_likes" ON message_likes
FOR SELECT USING (true);

-- 모든 사용자에게 message_likes 테이블 INSERT 권한 부여
CREATE POLICY "Anyone can insert message_likes" ON message_likes
FOR INSERT WITH CHECK (true);

-- 모든 사용자에게 message_likes 테이블 DELETE 권한 부여
CREATE POLICY "Anyone can delete message_likes" ON message_likes
FOR DELETE USING (true);
```

## Google Cloud Translation API 설정

### 1. API 키 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Cloud Translation API 활성화
3. API 키 생성
4. API 키를 `config.js` 파일의 `TRANSLATION.API_KEY` 필드에 복사

### 2. API 키 제한 사항 설정 (선택 사항)

1. Google Cloud Console에서 생성한 API 키를 선택
2. "API 제한" 섹션에서 "Cloud Translation API"만 선택
3. "HTTP 리퍼러" 제한을 설정하여 승인된 웹사이트에서만 API 키 사용 가능

## 로컬 개발 환경 설정

### 웹 서버 설정

간단한 로컬 웹 서버를 실행하려면:

```bash
# Node.js로 간단한 웹 서버 실행
npx http-server -p 3000

# 또는 Python으로 실행
python -m http.server 3000
```

그런 다음 웹 브라우저에서 `http://localhost:3000`으로 접속

## 일반적인 문제 해결 팁

1. **개발자 콘솔 확인**
   - 브라우저의 개발자 콘솔(F12)을 열어 오류 메시지 확인
   - 네트워크 탭에서 API 호출 및 응답 확인

2. **로컬 스토리지 초기화**
   - 개발자 콘솔에서 `localStorage.clear()`를 실행하여 저장된 데이터 초기화
   - 페이지 새로고침 후 다시 시도

3. **크로스 오리진 이슈**
   - CORS 오류가 발생하면 로컬 웹 서버를 사용하여 접속
   - `file://` 프로토콜로 직접 HTML 파일을 열면 API 호출이 차단될 수 있음

4. **API 키 노출 방지**
   - 실제 배포 환경에서는 API 키를 프론트엔드 코드에 직접 포함하지 않도록 주의
   - 환경 변수 또는 서버 측 프록시를 사용하여 API 키 보호
