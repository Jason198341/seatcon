-- supabase/setup.sql

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  username VARCHAR NOT NULL,
  preferred_language VARCHAR NOT NULL DEFAULT 'ko',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  username VARCHAR NOT NULL,
  message TEXT NOT NULL,
  language VARCHAR NOT NULL DEFAULT 'ko',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages(room_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- RLS 정책 적용 (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 누구나 사용자를 생성하고 조회할 수 있음
CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Anyone can read users" ON users
  FOR SELECT USING (true);

-- 누구나 메시지를 읽고 쓸 수 있음
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Anyone can read messages" ON messages
  FOR SELECT USING (true);
