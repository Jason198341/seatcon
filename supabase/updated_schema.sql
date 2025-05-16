-- supabase/updated_schema.sql

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  username VARCHAR NOT NULL,
  preferred_language VARCHAR NOT NULL DEFAULT 'ko',
  room_id VARCHAR NOT NULL DEFAULT 'general',
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  isannouncement BOOLEAN DEFAULT false,
  reply_to JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages(room_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_isannouncement_idx ON messages(isannouncement);
CREATE INDEX IF NOT EXISTS users_room_id_idx ON users(room_id);
CREATE INDEX IF NOT EXISTS users_last_activity_idx ON users(last_activity);

-- RLS 정책 적용 (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 누구나 사용자를 생성하고 조회할 수 있음
CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Anyone can read users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update users" ON users
  FOR UPDATE USING (true);

-- 누구나 메시지를 읽고 쓸 수 있음
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Anyone can read messages" ON messages
  FOR SELECT USING (true);

-- 함수 생성: 사용자 활동 시간 업데이트
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_activity = NOW() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성: 메시지가 생성될 때마다 사용자 활동 시간 업데이트
DROP TRIGGER IF EXISTS trigger_update_user_activity ON messages;
CREATE TRIGGER trigger_update_user_activity
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_user_activity();
