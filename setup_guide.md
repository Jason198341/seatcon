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

## 3. API 키 및 URL 확인

1. Supabase 프로젝트 대시보드에서 왼쪽 메뉴의 "Project Settings"를 선택합니다.
2. "API" 탭에서 다음 정보를 확인합니다:
   - Project URL: 프로젝트 URL (예: `https://dolywnpcrutdxuxkozae.supabase.co`)
   - API Keys - anon public: 익명 공개 키 (현재 프로젝트에 설정됨)

## 4. Realtime 설정

1. Supabase 프로젝트 대시보드에서 왼쪽 메뉴의 "Database"를 선택합니다.
2. "Realtime" 탭을 선택합니다.
3. 다음 테이블에 대해 Realtime을 활성화합니다:
   - chatrooms
   - messages
   - users

## 5. 애플리케이션 설정 확인

1. 애플리케이션의 `js/services/dbService.js` 파일에서 다음 상수가 올바르게 설정되어 있는지 확인합니다:
   ```javascript
   const SUPABASE_URL = 'https://dolywnpcrutdxuxkozae.supabase.co';
   const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8';
   ```

## 6. 관리자 계정 설정

기본 관리자 계정은 다음과 같이 설정되어 있습니다:
- 관리자 ID: `kcmmer`
- 비밀번호: `rnrud9881@@HH`

## 7. 주의사항

- API 키는 보안을 위해 노출되지 않도록 주의하세요.
- 실제 운영 환경에서는 Supabase 프로젝트의 보안 설정을 적절하게 구성하세요.
- 관리자 인증은 현재 클라이언트 측에서 처리됩니다. 실제 운영 환경에서는 서버 측 인증으로 변경하는 것이 좋습니다.