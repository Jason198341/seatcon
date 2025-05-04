-- 컨퍼런스 실시간 번역 채팅 시스템 데이터베이스 스키마
-- Supabase에서 실행할 SQL 스크립트

-- 메시지 테이블 생성
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    speaker_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_generated_id TEXT,
    user_role TEXT,
    language TEXT
);

-- 메시지 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS public.message_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (message_id, user_email)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_speaker_id ON public.comments(speaker_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);
CREATE INDEX IF NOT EXISTS idx_message_likes_message_id ON public.message_likes(message_id);

-- RLS(Row Level Security) 정책 설정
-- 모든 사용자가 메시지와 좋아요에 접근할 수 있도록 설정
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to comments" ON public.comments
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public access to message_likes" ON public.message_likes
    FOR ALL TO anon
    USING (true)
    WITH CHECK (true);

-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_likes;

-- 메시지 데이터 보존 정책 (옵션)
-- 예: 30일 이후 자동 삭제
-- COMMENT ON TABLE public.comments IS '{"retentionPeriod": "30 days"}';

-- 기본 화자 정보 (옵션)
INSERT INTO public.speakers (id, name, role, created_at)
VALUES 
    ('global-chat', '전체 채팅', 'global', NOW())
ON CONFLICT (id) DO NOTHING;
