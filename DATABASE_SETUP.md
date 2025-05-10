# 데이터베이스 설정 가이드

이 문서는 시트 컨퍼런스 채팅 플랫폼의 데이터베이스 설정 방법을 안내합니다.

## 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com/)에 로그인합니다.
2. 이미 생성된 프로젝트를 사용하거나, 새 프로젝트를 생성합니다.
3. 프로젝트의 URL과 익명 API 키를 `.env` 파일에 설정했는지 확인합니다.

```
REACT_APP_SUPABASE_URL=https://veudhigojdukbqfgjeyh.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao
REACT_APP_GOOGLE_TRANSLATION_API_KEY=AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs
```

## 2. SQL 함수 설정

데이터베이스 스키마를 적용하기 위해 먼저 Supabase에 SQL 함수를 생성해야 합니다.

1. Supabase 대시보드에서 **SQL 편집기**로 이동합니다.
2. 새 쿼리를 생성하고 다음 SQL을 실행합니다:

```sql
-- SQL 쿼리 실행 함수 생성
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
```

이 함수는 애플리케이션에서 SQL 쿼리를 실행할 수 있게 해줍니다.

## 3. 데이터베이스 테이블 생성 및 초기 데이터 삽입

다음 명령을 실행하여 데이터베이스 테이블을 생성하고 초기 데이터를 삽입합니다:

```bash
npm run setup-db
```

이 명령은 다음 작업을 수행합니다:
- 테이블 생성: `users`, `exhibits`, `presentations`, `schedules`, `chat_rooms`, `messages`
- 초기 데이터 삽입
- RLS(Row Level Security) 정책 설정
- 실시간 기능 설정

## 4. 설정 확인

설정이 완료되면 다음 사항을 확인하세요:

1. Supabase 대시보드의 **테이블 편집기**에서 모든 테이블이 생성되었는지 확인합니다.
2. 각 테이블에 초기 데이터가 삽입되었는지 확인합니다.
3. RLS 정책이 설정되었는지 확인합니다.

## 5. 관리자 계정 설정

초기 데이터에는 기본 관리자 계정이 포함되어 있습니다:
- 이메일: `admin@example.com`
- 역할: `admin`

하지만 실제 암호는 Supabase Auth에서 별도로 설정해야 합니다:

1. Supabase 대시보드에서 **Authentication > Users**로 이동합니다.
2. 관리자 계정을 찾아 암호를 설정합니다. 기존 계정이 없는 경우, 새 계정을 생성하고 올바른 UUID를 `users` 테이블에 설정합니다.

## 문제 해결

데이터베이스 설정 중 문제가 발생하면 다음 사항을 확인하세요:

1. Supabase 프로젝트의 URL과 익명 키가 올바르게 설정되었는지 확인합니다.
2. SQL 함수 `exec_sql`이 생성되었는지 확인합니다.
3. 오류 메시지를 확인하고 필요에 따라 SQL 스키마를 수정합니다.

자세한 내용은 `src/utils/database` 폴더의 파일을 참조하세요.
