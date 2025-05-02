-- 컨퍼런스 채팅 애플리케이션을 위한 Supabase 테이블 생성 스크립트

-- UUID 확장 활성화 (Supabase에서 이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 메시지 테이블: 채팅 메시지 저장
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL,
    is_moderator BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 강퇴된 사용자 테이블: 강퇴된 사용자 정보 저장
CREATE TABLE IF NOT EXISTS kicked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    kicked_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (room_id, user_id)
);

-- 인덱스 생성: 성능 최적화
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_kicked_users_room_id_user_id ON kicked_users(room_id, user_id);

-- RLS(Row Level Security) 활성화: 보안 강화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kicked_users ENABLE ROW LEVEL SECURITY;

-- 메시지 테이블에 대한 정책 생성: 모든 사용자가 읽고 쓸 수 있음
CREATE POLICY "Anyone can read messages" 
    ON messages FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can insert messages" 
    ON messages FOR INSERT 
    WITH CHECK (true);

-- 강퇴된 사용자 테이블에 대한 정책 생성
CREATE POLICY "Anyone can read kicked users" 
    ON kicked_users FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can insert kicked users" 
    ON kicked_users FOR INSERT 
    WITH CHECK (true);

-- 실시간 구독을 위한 채널 설정
COMMENT ON TABLE messages IS 'Stores chat messages';
COMMENT ON TABLE kicked_users IS 'Stores information about kicked users';

-- 기본 공지사항 메시지 추가 (선택사항)
INSERT INTO messages (
    room_id, 
    user_id, 
    user_name, 
    content, 
    language, 
    is_moderator, 
    is_announcement
) VALUES (
    'conference-chat-room',
    'system',
    'System',
    '컨퍼런스 채팅룸에 오신 것을 환영합니다!',
    'ko',
    true,
    true
);
