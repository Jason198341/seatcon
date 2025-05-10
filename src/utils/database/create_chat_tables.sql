-- chat_rooms 테이블 생성
CREATE TABLE IF NOT EXISTS chat_rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- messages 테이블 생성
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  original_language VARCHAR(10) DEFAULT 'ko',
  reply_to INTEGER REFERENCES messages(id) ON DELETE SET NULL, -- 답장 대상 메시지 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 샘플 채팅방 생성
INSERT INTO chat_rooms (name, description, created_at, updated_at)
VALUES 
  ('일반 대화방', '컨퍼런스 관련 일반 대화를 나누는 공간입니다.', NOW(), NOW()),
  ('협력사 소통방', '협력사 관계자들을 위한 대화방입니다.', NOW(), NOW()),
  ('기술 질문방', '시트 기술 관련 질문과 답변을 나누는 공간입니다.', NOW(), NOW()),
  ('전시 안내방', '전시물에 대한 안내와 질문을 위한 공간입니다.', NOW(), NOW()),
  ('일정 안내방', '컨퍼런스 일정에 대한 안내를 제공하는 공간입니다.', NOW(), NOW());

-- RLS(Row Level Security) 정책 설정
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 채팅방을 읽을 수 있음
CREATE POLICY chat_rooms_select_all ON chat_rooms
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 모든 인증된 사용자는 채팅방을 생성할 수 있음
CREATE POLICY chat_rooms_insert_all ON chat_rooms
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 관리자만 채팅방을 수정/삭제할 수 있음
CREATE POLICY chat_rooms_update_admin ON chat_rooms
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY chat_rooms_delete_admin ON chat_rooms
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- 모든 인증된 사용자는 메시지를 읽을 수 있음
CREATE POLICY messages_select_all ON messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 모든 인증된 사용자는 메시지를 생성할 수 있음
CREATE POLICY messages_insert_all ON messages
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 사용자는 자신의 메시지만 수정/삭제할 수 있음
CREATE POLICY messages_update_own ON messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY messages_delete_own ON messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- 관리자는 모든 메시지를 수정/삭제할 수 있음
CREATE POLICY messages_admin_all ON messages
  FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- 실시간 구독을 위한 publications 생성
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 메시지 테이블 인덱스 생성
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_reply_to ON messages(reply_to);
