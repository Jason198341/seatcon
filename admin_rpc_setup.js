/**
 * admin_rpc_setup.js
 * Supabase 관리자 RPC 함수 설정 스크립트
 * 
 * 이 스크립트는 Supabase에 관리자 권한 우회를 위한 RPC 함수를 생성합니다.
 */

const https = require('https');
const fs = require('fs');

// config.js에서 API 키와 URL 가져오기
const CONFIG = {
    SUPABASE_URL: 'https://dolywnpcrutdxuxkozae.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8'
};

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// 로그 유틸리티
const log = {
    info: (message) => console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`),
    success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
    warning: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
    error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
    title: (message) => console.log(`\n${colors.magenta}=== ${message} ===${colors.reset}\n`)
};

// Supabase SQL 쿼리 실행 함수
async function executeSQLQuery(sql) {
    return new Promise((resolve, reject) => {
        const url = new URL('/rest/v1/rpc/execute_sql', CONFIG.SUPABASE_URL);
        const options = {
            method: 'POST',
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'params=single-object'
            }
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsedData = JSON.parse(responseData);
                            resolve(parsedData);
                        } catch (e) {
                            // 응답이 JSON이 아닐 경우에도 성공으로 처리
                            resolve({ success: true, message: responseData });
                        }
                    } else {
                        reject(new Error(`SQL 쿼리 실행 실패: 상태 코드 ${res.statusCode}, 응답: ${responseData}`));
                    }
                } catch (e) {
                    reject(new Error(`응답 처리 실패: ${e.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(JSON.stringify({
            query: sql
        }));
        req.end();
    });
}

// 관리자 RPC 함수 생성
async function createAdminRPCFunctions() {
    log.title('관리자 RPC 함수 생성');
    
    try {
        // admin_create_chatroom 함수 생성
        log.info('admin_create_chatroom 함수 생성 중...');
        await executeSQLQuery(`
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
        `);
        log.success('admin_create_chatroom 함수 생성 완료');
        
        // admin_update_chatroom 함수 생성
        log.info('admin_update_chatroom 함수 생성 중...');
        await executeSQLQuery(`
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
        `);
        log.success('admin_update_chatroom 함수 생성 완료');
        
        // admin_delete_chatroom 함수 생성
        log.info('admin_delete_chatroom 함수 생성 중...');
        await executeSQLQuery(`
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
        `);
        log.success('admin_delete_chatroom 함수 생성 완료');
        
        // RLS 정책 수정
        log.info('RLS 정책 수정 중...');
        await executeSQLQuery(`
-- 채팅방 정책 재설정
DROP POLICY IF EXISTS "Anyone can view active chatrooms" ON chatrooms;
DROP POLICY IF EXISTS "Admins can manage chatrooms" ON chatrooms;

-- 모든 사용자가 활성화된 채팅방 조회 가능
CREATE POLICY "Anyone can view active chatrooms"
ON chatrooms FOR SELECT
USING (is_active = true);

-- 누구나 채팅방 생성 가능 (관리자 함수 사용)
CREATE POLICY "Anyone can create chatrooms"
ON chatrooms FOR INSERT
WITH CHECK (true);

-- 누구나 채팅방 수정 가능 (관리자 함수 사용)
CREATE POLICY "Anyone can update chatrooms"
ON chatrooms FOR UPDATE
USING (true)
WITH CHECK (true);

-- 누구나 채팅방 삭제 가능 (관리자 함수 사용)
CREATE POLICY "Anyone can delete chatrooms"
ON chatrooms FOR DELETE
USING (true);
        `);
        log.success('RLS 정책 수정 완료');
        
    } catch (error) {
        log.error(`관리자 RPC 함수 생성 중 오류 발생: ${error.message}`);
        throw error;
    }
}

// 사용자 입력 함수
function question(query) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => readline.question(query, answer => {
        readline.close();
        resolve(answer);
    }));
}

// Supabase 설정 안내
function printManualSetupInstructions() {
    log.title('Supabase 수동 설정 안내');
    log.info('이 스크립트는 Supabase API를 통한 SQL 실행을 시도하지만, 실패할 경우 다음 수동 설정을 따라주세요:');
    log.info('');
    log.info('1. Supabase 계정으로 로그인: https://supabase.com/dashboard');
    log.info('2. 프로젝트를 선택하거나 새 프로젝트 생성');
    log.info('3. SQL 편집기로 이동: 왼쪽 메뉴에서 "SQL Editor" 선택');
    log.info('4. "New Query" 클릭하여 새 SQL 쿼리 생성');
    log.info('5. db_admin_functions.sql 파일의 내용을 복사하여 SQL 편집기에 붙여넣기');
    log.info('6. "Run" 버튼 클릭하여 SQL 쿼리 실행');
    log.info('');
    log.info('추가 설정:');
    log.info('1. Realtime 활성화: Database -> Realtime 메뉴에서 활성화');
    log.info('2. 함수 확인: Database -> Functions 메뉴에서 함수가 생성되었는지 확인');
    log.info('');
}

// 메인 함수
async function main() {
    log.title('Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 관리자 함수 설정');
    
    try {
        // 사용자 확인
        const answer = await question('Supabase에 관리자 RPC 함수를 생성하시겠습니까? (y/n): ');
        
        if (answer.toLowerCase() === 'y') {
            // 관리자 RPC 함수 생성
            await createAdminRPCFunctions();
            log.success('관리자 RPC 함수 생성이 완료되었습니다.');
        } else {
            log.info('관리자 RPC 함수 생성을 건너뜁니다.');
        }
        
        // Supabase 수동 설정 안내
        printManualSetupInstructions();
    } catch (error) {
        log.error(`오류 발생: ${error.message}`);
    }
}

// 스크립트 실행
main();