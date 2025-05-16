-- Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 데이터베이스 스키마

-- 채팅방 테이블 생성
CREATE TABLE IF NOT EXISTS chatrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    max_users INTEGER DEFAULT 100,
    is_private BOOLEAN DEFAULT FALSE,
    access_code VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);

-- 메시지 테이블 생성
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatroom_id UUID NOT NULL REFERENCES chatrooms(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    isannouncement BOOLEAN DEFAULT FALSE,
    reply_to JSONB
);

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'ko',
    room_id UUID REFERENCES chatrooms(id) ON DELETE SET NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'user'
);

-- 메시지 테이블에 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_messages_chatroom_id ON messages(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- 사용자 테이블에 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_room_id ON users(room_id);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

-- 채팅방 테이블에 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chatrooms_is_active ON chatrooms(is_active);
CREATE INDEX IF NOT EXISTS idx_chatrooms_sort_order ON chatrooms(sort_order);

-- Supabase Realtime 설정을 위한 데이터베이스 트리거 함수
CREATE OR REPLACE FUNCTION on_message_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('new_message', json_build_object(
        'chatroom_id', NEW.chatroom_id,
        'id', NEW.id,
        'username', NEW.username,
        'message', NEW.message
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 메시지 삽입 시 트리거 등록
DROP TRIGGER IF EXISTS message_insert_trigger ON messages;
CREATE TRIGGER message_insert_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION on_message_insert();

-- 기본 채팅방 생성
INSERT INTO chatrooms (name, description, is_active, max_users, is_private, sort_order)
VALUES 
    ('메인 채팅방', 'Global SeatCon 2025 메인 채팅방입니다. 모든 참가자가 대화할 수 있는 공간입니다.', TRUE, 500, FALSE, 0),
    ('기술 토론', '기술 관련 주제에 대해 토론하는 채팅방입니다.', TRUE, 200, FALSE, 1),
    ('네트워킹', '다른 참가자들과 네트워킹을 위한 채팅방입니다.', TRUE, 200, FALSE, 2),
    ('Q&A', '발표자에게 질문하는 채팅방입니다.', TRUE, 300, FALSE, 3),
    ('VIP 라운지', 'VIP 참가자를 위한 비공개 채팅방입니다.', TRUE, 50, TRUE, 4)
ON CONFLICT (id) DO NOTHING;

-- VIP 라운지에 접근 코드 설정
UPDATE chatrooms
SET access_code = 'vip2025'
WHERE name = 'VIP 라운지' AND access_code IS NULL;

-- 관리자 사용자 생성 (실제 환경에서는 더 안전한 방법으로 처리해야 함)
INSERT INTO users (id, username, preferred_language, role)
VALUES ('admin_kcmmer', 'Admin', 'ko', 'admin')
ON CONFLICT (id) DO NOTHING;