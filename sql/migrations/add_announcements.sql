-- 2025-05-04: 공지사항 기능 추가를 위한 마이그레이션 스크립트

-- comments 테이블에 is_announcement 컬럼 추가
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE;

-- 기존 데이터에서 공지사항으로 처리할 메시지 업데이트 (관리자 메시지 중 "[공지]"가 포함된 메시지)
UPDATE comments 
SET is_announcement = TRUE 
WHERE 
  user_role = 'admin' AND 
  content LIKE '%📢 [공지]%';

-- 인덱스 추가로 공지사항 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_comments_is_announcement ON comments (is_announcement) WHERE is_announcement = TRUE;

-- 공지사항 조회를 위한 뷰 생성
CREATE OR REPLACE VIEW announcements AS
SELECT 
  id, 
  speaker_id, 
  author_name, 
  author_email, 
  content, 
  created_at, 
  client_generated_id, 
  user_role, 
  language
FROM 
  comments
WHERE 
  is_announcement = TRUE
ORDER BY 
  created_at DESC;

-- 설명
COMMENT ON COLUMN comments.is_announcement IS '관리자가 전송한 공지사항 여부';
COMMENT ON VIEW announcements IS '관리자가 전송한 공지사항만 조회하는 뷰';
