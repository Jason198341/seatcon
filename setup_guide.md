# Supabase 데이터베이스 설정 가이드

Global SeatCon 2025 컨퍼런스 채팅 애플리케이션의 Supabase 데이터베이스 설정 가이드입니다.

## 1. Supabase 계정 및 프로젝트 생성

1. [Supabase](https://supabase.com/) 웹사이트에 방문하여 계정을 생성합니다.
2. Supabase 대시보드에서 새 프로젝트를 생성합니다.
3. 프로젝트 생성 시 다음 정보를 입력합니다:
   - 프로젝트 이름: `global-seatcon-2025`
   - 데이터베이스 비밀번호: 강력한 비밀번호 설정
   - 지역: 서비스 제공 지역과 가까운 곳 선택

## 2. 데이터베이스 스키마 설정

1. Supabase 프로젝트 대시보드에서 왼쪽 메뉴의 "SQL Editor"를 선택합니다.
2. "New Query"를 클릭하여 새 SQL 쿼리를 생성합니다.
3. 이 프로젝트의 `db_schema.sql` 파일의 내용을 복사하여 SQL 편집기에 붙여넣습니다.
4. "Run" 버튼을 클릭하여 SQL 쿼리를 실행합니다.

## 3. API 키 및 URL 설정

현재 프로젝트는 다음 Supabase 프로젝트를 사용하도록 설정되어 있습니다:

```javascript
// js/config.js 파일의 설정
const CONFIG = {
    SUPABASE_URL: 'https://dolywnpcrutdxuxkozae.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
    TRANSLATION_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs'
};
```

자체 Supabase 프로젝트를 사용하려면:

1. Supabase 프로젝트 대시보드에서 왼쪽 메뉴의 "Project Settings"를 선택합니다.
2. "API" 탭에서 다음 정보를 확인합니다:
   - Project URL: 프로젝트 URL (예: `https://your-project-id.supabase.co`)
   - API Keys - anon public: 익명 공개 키
3. `js/config.js` 파일을 열고 다음 상수를 업데이트합니다:
   ```javascript
   SUPABASE_URL: '여기에_프로젝트_URL_입력',
   SUPABASE_KEY: '여기에_익명_공개_키_입력',
   ```

## 4. Realtime 설정

1. Supabase 프로젝트 대시보드에서 왼쪽 메뉴의 "Database"를 선택합니다.
2. "Realtime" 탭을 선택합니다.
3. 다음 테이블에 대해 Realtime을 활성화합니다:
   - chatrooms
   - messages
   - users
4. Realtime 발행 설정:
   - "Realtime" 탭에서 "Publish all changes by default"를 활성화하거나
   - 특정 테이블에 대해서만 발행 설정을 활성화

## 5. RLS(Row Level Security) 설정

기본적으로 Supabase는 RLS가 활성화되어 있습니다. 애플리케이션 접근을 위해 적절한 정책을 설정해야 합니다:

1. Supabase 대시보드에서 "Authentication" → "Policies"로 이동합니다.
2. 각 테이블에 대한 읽기/쓰기 정책을 설정합니다:

   **chatrooms 테이블:**
   ```sql
   -- 읽기 정책: 모든 사용자가 활성화된 채팅방을 볼 수 있음
   CREATE POLICY "Enable read access for all users" ON chatrooms
   FOR SELECT USING (is_active = true);
   
   -- 쓰기 정책: 관리자만 채팅방을 생성/수정할 수 있음
   CREATE POLICY "Enable insert for admins only" ON chatrooms
   FOR INSERT TO authenticated USING (
     EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
   );
   ```

   **messages 테이블:**
   ```sql
   -- 읽기 정책: 모든 사용자가 메시지를 볼 수 있음
   CREATE POLICY "Enable read access for all users" ON messages
   FOR SELECT USING (true);
   
   -- 쓰기 정책: 인증된 사용자만 메시지를 작성할 수 있음
   CREATE POLICY "Enable insert for authenticated users" ON messages
   FOR INSERT USING (true);
   ```

   **users 테이블:**
   ```sql
   -- 읽기 정책: 모든 사용자가 사용자 목록을 볼 수 있음
   CREATE POLICY "Enable read access for all users" ON users
   FOR SELECT USING (true);
   
   -- 쓰기 정책: 사용자는 자신의 정보만 수정할 수 있음
   CREATE POLICY "Enable update for users based on id" ON users
   FOR UPDATE USING (id = auth.uid());
   ```

## 6. 관리자 계정 설정

기본 관리자 계정은 다음과 같이 설정되어 있습니다:
- 관리자 ID: `kcmmer`
- 비밀번호: `rnrud9881@@HH`

다음 SQL 쿼리로 관리자 계정을 추가할 수 있습니다:
```sql
INSERT INTO users (id, username, preferred_language, role)
VALUES ('admin_kcmmer', 'Admin', 'ko', 'admin')
ON CONFLICT (id) DO NOTHING;
```

## 7. Google Cloud Translation API 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
3. "APIs & Services" → "Library"로 이동합니다.
4. "Cloud Translation API"를 검색하고 활성화합니다.
5. "APIs & Services" → "Credentials"로 이동합니다.
6. "Create Credentials" → "API Key"를 선택합니다.
7. 생성된 API 키를 복사하여 `js/config.js` 파일의 `TRANSLATION_API_KEY` 값에 설정합니다.

## 8. 주의사항

- API 키는 보안을 위해 노출되지 않도록 주의하세요.
- 실제 운영 환경에서는 다음과 같은 보안 조치를 취하세요:
  - 환경 변수를 사용하여 API 키 관리
  - 프로덕션 배포 시 API 키 제한 설정 (Referrer 제한 등)
  - Supabase JWT 토큰 인증을 사용한 보안 강화
- 관리자 인증은 현재 클라이언트 측에서 처리됩니다. 실제 운영 환경에서는 서버 측 인증으로 변경하는 것이 좋습니다.

## 9. 문제 해결

- **Realtime 연결 오류**: Supabase 대시보드에서 Realtime 설정이 활성화되어 있는지 확인하세요.
- **인증 오류**: API 키가 올바르게 설정되어 있는지 확인하세요.
- **RLS 정책 오류**: RLS 정책이 적절하게 설정되어 있는지 확인하세요.
- **번역 API 오류**: Google Cloud Translation API 키가 활성화되어 있고 올바르게 설정되어 있는지 확인하세요.