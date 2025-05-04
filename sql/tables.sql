-- Supabase 테이블 생성 스크립트

-- 메시지 테이블 (comments)
CREATE TABLE IF NOT EXISTS comments (
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

-- 메시지 좋아요 테이블 (message_likes)
CREATE TABLE IF NOT EXISTS message_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (message_id, user_email)
);

-- 실시간 구독을 위한 변경 알림 설정
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;

-- 기본 권한 정책 설정
CREATE POLICY "Anyone can insert comments" 
  ON comments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view comments" 
  ON comments FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert likes" 
  ON message_likes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their own likes" 
  ON message_likes FOR DELETE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view likes" 
  ON message_likes FOR SELECT 
  USING (true);
