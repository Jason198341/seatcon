-- Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 통합 SQL 스크립트
-- 기존 데이터 삭제 및 새로운 스키마 적용

-- =============================================================
-- 1. 기존 테이블 및 함수 삭제
-- =============================================================

-- 기존 테이블 삭제
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS chatrooms CASCADE;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS update_chatroom_updated_at() CASCADE;
DROP FUNCTION IF EXISTS on_message_insert() CASCADE;
DROP FUNCTION IF EXISTS on_user_change() CASCADE;
DROP FUNCTION IF EXISTS admin_create_chatroom() CASCADE;
DROP FUNCTION IF EXISTS admin_update_chatroom() CASCADE;
DROP FUNCTION IF EXISTS admin_delete_chatroom() CASCADE;

-- =============================================================
-- 2. 기본 스키마 생성
-- =============================================================

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

-- =============================================================
-- 3. 트리거 및 함수 생성
-- =============================================================

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

-- =============================================================
-- 4. 관리자 RPC 함수 생성
-- =============================================================

-- 관리자 권한으로 채팅방 생성 함수
CREATE OR REPLACE FUNCTION admin_create_chatroom(
    room_name TEXT,
    room_description TEXT DEFAULT NULL,
    room_max_users INTEGER DEFAULT 100,
    room_sort_order INTEGER DEFAULT 0,
    room_is_active BOOLEAN DEFAULT TRUE,
    room_is_private BOOLEAN DEFAULT FALSE,
    room_access_code TEXT DEFAULT NULL,
    room_created_by TEXT DEFAULT NULL
) 
RETURNS SETOF chatrooms
SECURITY DEFINER -- 함수 생성자의 권한으로 실행 (superuser)
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO chatrooms (
        name,
        description,
        max_users,
        sort_order,
        is_active,
        is_private,
        access_code,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        room_name,
        room_description,
        room_max_users,
        room_sort_order,
        room_is_active,
        room_is_private,
        room_access_code,
        room_created_by,
        NOW(),
        NOW()
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- 관리자 권한으로 채팅방 업데이트 함수
CREATE OR REPLACE FUNCTION admin_update_chatroom(
    room_id UUID,
    room_name TEXT,
    room_description TEXT DEFAULT NULL,
    room_max_users INTEGER DEFAULT 100,
    room_sort_order INTEGER DEFAULT 0,
    room_is_active BOOLEAN DEFAULT TRUE,
    room_is_private BOOLEAN DEFAULT FALSE,
    room_access_code TEXT DEFAULT NULL
) 
RETURNS SETOF chatrooms
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE chatrooms SET
        name = room_name,
        description = room_description,
        max_users = room_max_users,
        sort_order = room_sort_order,
        is_active = room_is_active,
        is_private = room_is_private,
        access_code = room_access_code,
        updated_at = NOW()
    WHERE id = room_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- 관리자 권한으로 채팅방 삭제 함수
CREATE OR REPLACE FUNCTION admin_delete_chatroom(
    room_id UUID
) 
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM chatrooms WHERE id = room_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 5. RLS(Row Level Security) 정책 설정
-- =============================================================

-- RLS 활성화
ALTER TABLE chatrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 이전 정책 삭제
DROP POLICY IF EXISTS "Anyone can view active chatrooms" ON chatrooms;
DROP POLICY IF EXISTS "Admins can manage chatrooms" ON chatrooms;
DROP POLICY IF EXISTS "Anyone can create chatrooms" ON chatrooms;
DROP POLICY IF EXISTS "Anyone can update chatrooms" ON chatrooms;
DROP POLICY IF EXISTS "Anyone can delete chatrooms" ON chatrooms;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;

-- 채팅방 정책
CREATE POLICY "Anyone can view active chatrooms"
ON chatrooms FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can create chatrooms"
ON chatrooms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update chatrooms"
ON chatrooms FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete chatrooms"
ON chatrooms FOR DELETE
USING (true);

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
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can insert users"
ON users FOR INSERT
WITH CHECK (true);

-- =============================================================
-- 6. 초기 데이터 생성
-- =============================================================

-- 기본 채팅방 생성
INSERT INTO chatrooms (name, description, is_active, max_users, is_private, sort_order, created_by, created_at, updated_at)
VALUES 
    ('메인 채팅방', 'Global SeatCon 2025 메인 채팅방입니다. 모든 참가자가 대화할 수 있는 공간입니다.', TRUE, 500, FALSE, 0, 'admin_init', NOW(), NOW()),
    ('기술 토론', '기술 관련 주제에 대해 토론하는 채팅방입니다.', TRUE, 200, FALSE, 1, 'admin_init', NOW(), NOW()),
    ('네트워킹', '다른 참가자들과 네트워킹을 위한 채팅방입니다.', TRUE, 200, FALSE, 2, 'admin_init', NOW(), NOW()),
    ('Q&A', '발표자에게 질문하는 채팅방입니다.', TRUE, 300, FALSE, 3, 'admin_init', NOW(), NOW()),
    ('VIP 라운지', 'VIP 참가자를 위한 비공개 채팅방입니다.', TRUE, 50, TRUE, 4, 'admin_init', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- VIP 라운지에 접근 코드 설정
UPDATE chatrooms
SET access_code = 'vip2025'
WHERE name = 'VIP 라운지' AND access_code IS NULL;

-- 관리자 사용자 생성
INSERT INTO users (id, username, preferred_language, role, last_activity)
VALUES ('admin_kcmmer', 'Admin', 'ko', 'admin', NOW())
ON CONFLICT (id) DO NOTHING;

-- 메인 채팅방 ID 가져오기
DO $$
DECLARE
    main_room_id UUID;
BEGIN
    -- 메인 채팅방 ID 가져오기
    SELECT id INTO main_room_id FROM chatrooms WHERE name = '메인 채팅방' LIMIT 1;
    
    -- 샘플 메시지 추가
    IF main_room_id IS NOT NULL THEN
        INSERT INTO messages (chatroom_id, user_id, username, message, language, isannouncement)
        VALUES
            (main_room_id, 'admin_kcmmer', 'Admin', 'Global SeatCon 2025 컨퍼런스 채팅에 오신 것을 환영합니다!', 'ko', TRUE),
            (main_room_id, 'admin_kcmmer', 'Admin', '이 채팅은 실시간으로 여러 언어로 번역됩니다. 자유롭게 참여해주세요.', 'ko', TRUE),
            (main_room_id, 'system', 'System', '채팅 시스템이 준비되었습니다.', 'ko', FALSE);
    END IF;
END $$;

-- =============================================================
-- 7. Supabase Realtime 설정 활성화
-- =============================================================
-- 주의: 이 부분은 Supabase 대시보드에서 UI를 통해 설정해야 합니다.
-- 1. Supabase 대시보드 -> Database -> Realtime
-- 2. "Enable Realtime" 활성화
-- 3. chatrooms, messages, users 테이블에 대한 Realtime 활성화

-- 완료 메시지
SELECT 'Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 데이터베이스 설정 완료' as result;