-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  preferred_language VARCHAR(10) DEFAULT 'ko',
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- 기본 관리자 계정 생성 (비밀번호는 Supabase Auth에서 별도로 설정해야 함)
INSERT INTO users (id, name, email, preferred_language, role, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '관리자', 'admin@example.com', 'ko', 'admin', NOW());

-- RLS(Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 읽을 수 있음
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id OR auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- 사용자는 자신의 프로필만 업데이트할 수 있음 (역할 변경 제외)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (role IS NULL OR role = 'user'));

-- 관리자는 모든 사용자 정보를 읽고 업데이트할 수 있음
CREATE POLICY users_admin_all ON users
  FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));
