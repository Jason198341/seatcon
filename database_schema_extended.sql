-- 컨퍼런스 실시간 번역 채팅 시스템 확장 데이터베이스 스키마
-- Supabase에서 실행할 SQL 스크립트

-- 채팅방 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS public.room_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 채팅방 테이블 생성
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.room_categories(id),
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    max_participants INTEGER DEFAULT 0,
    room_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 0, 8)
);

-- 메시지 테이블 수정 (reply_to_id 필드 추가)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.chat_rooms(id);
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.comments(id);
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;

-- 관리자 테이블 생성
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_rooms_category_id ON public.chat_rooms(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_room_id ON public.comments(room_id);
CREATE INDEX IF NOT EXISTS idx_comments_reply_to_id ON public.comments(reply_to_id);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to room_categories" ON public.room_categories
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow public access to chat_rooms" ON public.chat_rooms
    FOR SELECT TO anon
    USING (is_public = true OR true);

CREATE POLICY "Allow admin access to admin_users" ON public.admin_users
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_categories;

-- 기본 카테고리 생성
INSERT INTO public.room_categories (name, description, icon, color)
VALUES 
    ('일반', '일반 주제의 채팅방입니다.', 'comments', '#3498db'),
    ('기술', '기술 관련 주제의 채팅방입니다.', 'code', '#2ecc71'),
    ('질문', '질문과 답변을 위한 채팅방입니다.', 'question', '#e74c3c'),
    ('발표', '발표자 채팅방입니다.', 'microphone', '#9b59b6')
ON CONFLICT DO NOTHING;

-- 기본 채팅방 생성
WITH general_category AS (
    SELECT id FROM public.room_categories WHERE name = '일반' LIMIT 1
)
INSERT INTO public.chat_rooms (name, description, category_id, icon, is_active, is_public)
VALUES 
    ('전체 채팅', '모든 참가자를 위한 전체 채팅방입니다.', (SELECT id FROM general_category), 'globe', true, true),
    ('기술 지원', '기술 지원을 위한 채팅방입니다.', (SELECT id FROM general_category), 'support', true, true)
ON CONFLICT DO NOTHING;

-- 기본 관리자 사용자 생성 (비밀번호: rnrud9881)
INSERT INTO public.admin_users (email, password_hash, name)
VALUES 
    ('admin@conference.com', '$2a$10$7JHAkPtEKAm4HJVTWKTvROenwtbK1RH4YzP8H6UQo1SkdEeeFSvgu', '관리자')
ON CONFLICT DO NOTHING;

-- 이전 speaker_id를 room_id로 마이그레이션하는 함수 (선택사항)
CREATE OR REPLACE FUNCTION migrate_speaker_id_to_room_id() RETURNS void AS $$
DECLARE
    room_record RECORD;
    old_speaker_id TEXT;
BEGIN
    -- 각 채팅방 순회
    FOR room_record IN SELECT id, name FROM public.chat_rooms LOOP
        -- speaker_id가 'global-chat'인 메시지는 '전체 채팅' 채팅방으로 마이그레이션
        IF room_record.name = '전체 채팅' THEN
            old_speaker_id := 'global-chat';
        ELSE
            CONTINUE;
        END IF;
        
        -- 메시지 업데이트
        UPDATE public.comments
        SET room_id = room_record.id
        WHERE speaker_id = old_speaker_id AND room_id IS NULL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 마이그레이션 함수 실행 (한 번만 실행)
SELECT migrate_speaker_id_to_room_id();
