-- 컨퍼런스 채팅 애플리케이션 데이터베이스 스키마

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

-- RLS(Row Level Security) 설정: 보안 강화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kicked_users ENABLE ROW LEVEL SECURITY;

-- 메시지 테이블에 대한 정책 생성
CREATE POLICY messages_read_policy ON messages
    FOR SELECT USING (true); -- 모든 사용자가 메시지를 읽을 수 있음

CREATE POLICY messages_insert_policy ON messages
    FOR INSERT WITH CHECK (true); -- 모든 사용자가 메시지를 작성할 수 있음

-- 강퇴된 사용자 테이블에 대한 정책 생성
CREATE POLICY kicked_users_read_policy ON kicked_users
    FOR SELECT USING (true); -- 모든 사용자가 강퇴 목록을 확인할 수 있음

CREATE POLICY kicked_users_insert_policy ON kicked_users
    FOR INSERT WITH CHECK (true); -- 모든 사용자가 강퇴 정보를 추가할 수 있음(실제로는 앱 로직에서 진행자만 가능하도록 제한)

-- 함수: 메시지 테이블 자동 생성
CREATE OR REPLACE FUNCTION create_messages_table()
RETURNS void AS $$
BEGIN
    -- 이미 테이블이 있는지 확인
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') THEN
        -- 메시지 테이블 생성
        CREATE TABLE messages (
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
        
        -- 인덱스 생성
        CREATE INDEX idx_messages_room_id ON messages(room_id);
        CREATE INDEX idx_messages_user_id ON messages(user_id);
        CREATE INDEX idx_messages_created_at ON messages(created_at);
        
        -- RLS 활성화
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        
        -- 정책 생성
        CREATE POLICY messages_read_policy ON messages
            FOR SELECT USING (true);
        
        CREATE POLICY messages_insert_policy ON messages
            FOR INSERT WITH CHECK (true);
    END IF;
    
    -- 강퇴된 사용자 테이블 확인
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'kicked_users') THEN
        -- 강퇴된 사용자 테이블 생성
        CREATE TABLE kicked_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            room_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            kicked_by TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE (room_id, user_id)
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_kicked_users_room_id_user_id ON kicked_users(room_id, user_id);
        
        -- RLS 활성화
        ALTER TABLE kicked_users ENABLE ROW LEVEL SECURITY;
        
        -- 정책 생성
        CREATE POLICY kicked_users_read_policy ON kicked_users
            FOR SELECT USING (true);
        
        CREATE POLICY kicked_users_insert_policy ON kicked_users
            FOR INSERT WITH CHECK (true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 실시간 구독을 위한 채널 설정
COMMENT ON TABLE messages IS 'Stores chat messages';
COMMENT ON TABLE kicked_users IS 'Stores information about kicked users';
