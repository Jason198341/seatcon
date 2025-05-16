-- 관리자 권한으로 채팅방 생성 함수
-- Supabase SQL 에디터에서 실행하여 RLS 정책 우회 함수 생성

-- admin_create_chatroom 함수 생성
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

-- RLS 정책 관련 확인 쿼리 (실행은 하지 않음 - 참고용)
/*
-- 현재 설정된 RLS 정책 확인
SELECT
    n.nspname as schema,
    c.relname as table_name,
    pol.polname as policy_name,
    pol.polpermissive as permissive,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command,
    pg_get_expr(pol.polqual, pol.polrelid) as expression
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY schema, table_name, policy_name;
*/

-- RLS 정책을 임시로 수정 (필요한 경우에만 실행)
/*
-- 채팅방에 대한 RLS 정책 수정
DROP POLICY IF EXISTS "Admins can manage chatrooms" ON chatrooms;
CREATE POLICY "Admins can manage chatrooms"
ON chatrooms FOR ALL
USING (true)
WITH CHECK (true);

-- 테이블에 대한 RLS 비활성화 (테스트 목적으로만 사용, 실제 운영에서는 사용하지 말 것)
ALTER TABLE chatrooms DISABLE ROW LEVEL SECURITY;
*/
