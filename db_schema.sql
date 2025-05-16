-- Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 데이터베이스 스키마

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 채팅방 테이블에 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chatrooms_is_active ON chatrooms(is_active);
CREATE INDEX IF NOT EXISTS idx_chatrooms_sort_order ON chatrooms(sort_order);
CREATE INDEX IF NOT EXISTS idx_chatrooms_is_private ON chatrooms(is_private);

-- 채팅방 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_chatroom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 채팅방 업데이트 시간 자동 갱신 트리거
DROP TRIGGER IF EXISTS update_chatrooms_updated_at ON chatrooms;
CREATE TRIGGER update_chatrooms_updated_at
BEFORE UPDATE ON chatrooms
FOR EACH ROW
EXECUTE FUNCTION update_chatroom_updated_at();

-- Supabase Realtime 설정을 위한 데이터베이스 트리거 함수
CREATE OR REPLACE FUNCTION on_message_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('new_message', json_build_object(
        'chatroom_id', NEW.chatroom_id,
        'id', NEW.id,
        'user_id', NEW.user_id,
        'username', NEW.username,
        'message', NEW.message,
        'language', NEW.language,
        'created_at', NEW.created_at,
        'isannouncement', NEW.isannouncement,
        'reply_to', NEW.reply_to
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

-- 사용자 변경 시 트리거 함수
CREATE OR REPLACE FUNCTION on_user_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('user_change', json_build_object(
        'id', COALESCE(NEW.id, OLD.id),
        'username', COALESCE(NEW.username, OLD.username),
        'preferred_language', COALESCE(NEW.preferred_language, OLD.preferred_language),
        'room_id', COALESCE(NEW.room_id, OLD.room_id),
        'last_activity', COALESCE(NEW.last_activity, OLD.last_activity),
        'role', COALESCE(NEW.role, OLD.role),
        'operation', TG_OP
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 사용자 변경 시 트리거 등록
DROP TRIGGER IF EXISTS user_change_trigger ON users;
CREATE TRIGGER user_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION on_user_change();

-- RLS(Row Level Security) 정책 설정

-- RLS 활성화
ALTER TABLE chatrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 채팅방 정책
CREATE POLICY "Anyone can view active chatrooms"
ON chatrooms FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage chatrooms"
ON chatrooms FOR ALL
USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = current_setting('request.jwt.claim.sub', true)::text
    AND users.role = 'admin'
));

-- 메시지 정책
CREATE POLICY "Anyone can view messages"
ON messages FOR SELECT
USING (true);

CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
WITH CHECK (true);

-- 사용자 정책
CREATE POLICY "Anyone can view users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (id = current_setting('request.jwt.claim.sub', true)::text);

CREATE POLICY "Anyone can insert users"
ON users FOR INSERT
WITH CHECK (true);

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

-- 관리자 사용자 생성
INSERT INTO users (id, username, preferred_language, role)
VALUES ('admin_kcmmer', 'Admin', 'ko', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 샘플 메시지 생성 (선택 사항)
DO $$
DECLARE
    main_room_id UUID;
BEGIN
    -- 메인 채팅방 ID 가져오기
    SELECT id INTO main_room_id FROM chatrooms WHERE name = '메인 채팅방' LIMIT 1;
    
    -- 샘플 메시지 추가
    INSERT INTO messages (chatroom_id, user_id, username, message, language, isannouncement)
    VALUES
        (main_room_id, 'admin_kcmmer', 'Admin', 'Global SeatCon 2025 컨퍼런스 채팅에 오신 것을 환영합니다!', 'ko', TRUE),
        (main_room_id, 'admin_kcmmer', 'Admin', '이 채팅은 실시간으로 여러 언어로 번역됩니다. 자유롭게 참여해주세요.', 'ko', TRUE),
        (main_room_id, 'system', 'System', '채팅 시스템이 준비되었습니다.', 'ko', FALSE);
END $$;

-- Supabase Realtime 설정 활성화
-- 주의: 이 부분은 Supabase 대시보드에서 UI를 통해 설정해야 합니다.
-- 1. Supabase 대시보드 -> Database -> Realtime
-- 2. "Enable Realtime" 활성화
-- 3. chatrooms, messages, users 테이블에 대한 Realtime 활성화

-- 완료 메시지
SELECT 'Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 데이터베이스 스키마 설정이 완료되었습니다.' as result;