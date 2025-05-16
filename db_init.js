/**
 * db_init.js
 * Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 데이터베이스 초기화 스크립트
 * 
 * 이 스크립트는 Supabase 데이터베이스 초기화를 위한 것입니다.
 * db_schema.sql 파일을 직접 Supabase에 적용합니다.
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

// Supabase 테이블 존재 여부 확인 함수
async function checkTableExists(tableName) {
    return new Promise((resolve, reject) => {
        const url = new URL(`/rest/v1/${tableName}?limit=0`, CONFIG.SUPABASE_URL);
        const options = {
            method: 'GET',
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
            }
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                // 200은 테이블 존재, 404는 테이블 없음
                resolve(res.statusCode === 200);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// 데이터베이스 초기화 함수
async function initializeDatabase() {
    log.title('Supabase 데이터베이스 초기화');
    
    try {
        // 스키마 파일 읽기
        log.info('db_schema.sql 파일 읽는 중...');
        const schemaSQL = fs.readFileSync('./db_schema.sql', 'utf8');
        
        // 테이블 존재 여부 확인
        log.info('테이블 존재 여부 확인 중...');
        const chatroomsExists = await checkTableExists('chatrooms');
        const messagesExists = await checkTableExists('messages');
        const usersExists = await checkTableExists('users');
        
        if (chatroomsExists && messagesExists && usersExists) {
            log.warning('이미 모든 테이블이 존재합니다.');
            const answer = await question('테이블을 삭제하고 다시 생성하시겠습니까? (y/n): ');
            
            if (answer.toLowerCase() !== 'y') {
                log.info('데이터베이스 초기화를 건너뜁니다.');
                return;
            }
            
            // 테이블 삭제
            log.info('기존 테이블 삭제 중...');
            await executeSQLQuery(`
                DROP TABLE IF EXISTS messages;
                DROP TABLE IF EXISTS users;
                DROP TABLE IF EXISTS chatrooms;
            `);
            log.success('기존 테이블 삭제 완료');
        }
        
        // SQL 스크립트 실행
        log.info('SQL 스키마 적용 중...');
        await executeSQLQuery(schemaSQL);
        log.success('SQL 스키마 적용 완료');
        
        // 테이블 생성 확인
        log.info('테이블 생성 확인 중...');
        const chatroomsCreated = await checkTableExists('chatrooms');
        const messagesCreated = await checkTableExists('messages');
        const usersCreated = await checkTableExists('users');
        
        if (chatroomsCreated && messagesCreated && usersCreated) {
            log.success('모든 테이블이 성공적으로 생성되었습니다.');
        } else {
            log.error('일부 테이블이 생성되지 않았습니다:');
            log.error(`- chatrooms: ${chatroomsCreated ? '생성됨' : '생성되지 않음'}`);
            log.error(`- messages: ${messagesCreated ? '생성됨' : '생성되지 않음'}`);
            log.error(`- users: ${usersCreated ? '생성됨' : '생성되지 않음'}`);
        }
    } catch (error) {
        log.error(`데이터베이스 초기화 중 오류 발생: ${error.message}`);
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
function printSetupInstructions() {
    log.title('Supabase 수동 설정 안내');
    log.info('이 스크립트는 Supabase API를 통한 SQL 실행을 시도하지만, 실패할 경우 다음 수동 설정을 따라주세요:');
    log.info('');
    log.info('1. Supabase 계정으로 로그인: https://supabase.com/dashboard');
    log.info('2. 프로젝트를 선택하거나 새 프로젝트 생성');
    log.info('3. SQL 편집기로 이동: 왼쪽 메뉴에서 "SQL Editor" 선택');
    log.info('4. "New Query" 클릭하여 새 SQL 쿼리 생성');
    log.info('5. db_schema.sql 파일의 내용을 복사하여 SQL 편집기에 붙여넣기');
    log.info('6. "Run" 버튼 클릭하여 SQL 쿼리 실행');
    log.info('');
    log.info('추가 설정:');
    log.info('1. Realtime 활성화: Database -> Realtime 메뉴에서 활성화');
    log.info('2. 테이블 확인: Database -> Tables 메뉴에서 테이블이 생성되었는지 확인');
    log.info('');
}

// 메인 함수
async function main() {
    log.title('Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 데이터베이스 설정');
    
    try {
        // 사용자 확인
        const answer = await question('Supabase 데이터베이스를 초기화하시겠습니까? (y/n): ');
        
        if (answer.toLowerCase() === 'y') {
            // 데이터베이스 초기화
            await initializeDatabase();
        } else {
            log.info('데이터베이스 초기화를 건너뜁니다.');
        }
        
        // Supabase 수동 설정 안내
        printSetupInstructions();
    } catch (error) {
        log.error(`오류 발생: ${error.message}`);
    }
}

// 스크립트 실행
main();
