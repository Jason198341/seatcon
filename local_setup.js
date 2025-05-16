/**
 * local_setup.js
 * Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 로컬 환경 설정 스크립트
 * 
 * 이 스크립트는 Supabase 연결 테스트 및 환경 설정 상태를 확인합니다.
 * 
 * 실행 방법:
 * 1. Node.js가 설치되어 있어야 합니다.
 * 2. 터미널에서 다음 명령어를 실행합니다: node local_setup.js
 */

const https = require('https');
const fs = require('fs');

// config.js에서 API 키와 URL 가져오기
const CONFIG = {
    SUPABASE_URL: 'https://dolywnpcrutdxuxkozae.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
    TRANSLATION_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs'
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

// Supabase API 요청 함수
async function supabaseRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, CONFIG.SUPABASE_URL);
        const options = {
            method,
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({ statusCode: res.statusCode, data: parsedData });
                } catch (e) {
                    reject(new Error(`응답 파싱 실패: ${e.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Google Cloud Translation API 테스트 함수
async function testTranslationAPI() {
    return new Promise((resolve, reject) => {
        const text = 'Hello';
        const target = 'ko';
        const url = `https://translation.googleapis.com/language/translate/v2?key=${CONFIG.TRANSLATION_API_KEY}&q=${encodeURIComponent(text)}&target=${target}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.error) {
                        reject(new Error(`번역 API 오류: ${response.error.message}`));
                    } else {
                        resolve(response);
                    }
                } catch (e) {
                    reject(new Error(`응답 파싱 실패: ${e.message}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// 서버 연결 테스트 함수
async function testServerConnection() {
    log.title('서버 연결 테스트');
    
    try {
        // 로컬 서버 설정 확인
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        log.info(`프로젝트명: ${packageJson.name}`);
        log.info(`버전: ${packageJson.version}`);
        log.info(`실행 스크립트: ${packageJson.scripts.start}`);
        log.success('서버 스크립트 확인 완료');
    } catch (error) {
        log.error(`서버 설정 확인 실패: ${error.message}`);
    }
}

// Supabase 연결 테스트 함수
async function testSupabaseConnection() {
    log.title('Supabase 연결 테스트');
    
    try {
        log.info(`Supabase URL: ${CONFIG.SUPABASE_URL}`);
        log.info('API 키 유효성 검사 중...');
        
        // 테이블 목록 조회 시도
        const response = await supabaseRequest('/rest/v1/?select=*');
        
        if (response.statusCode === 200) {
            log.success('Supabase 연결 성공');
            return true;
        } else {
            log.error(`Supabase 연결 실패: 상태 코드 ${response.statusCode}`);
            if (response.data && response.data.error) {
                log.error(`오류 메시지: ${response.data.error}`);
            }
            return false;
        }
    } catch (error) {
        log.error(`Supabase 연결 테스트 실패: ${error.message}`);
        return false;
    }
}

// 채팅방 테이블 확인 함수
async function checkChatroomsTable() {
    try {
        const response = await supabaseRequest('/rest/v1/chatrooms?select=id,name&limit=1');
        
        if (response.statusCode === 200) {
            if (response.data && response.data.length > 0) {
                log.success(`채팅방 테이블 확인 완료: ${response.data.length}개의 채팅방 확인됨`);
                return true;
            } else {
                log.warning('채팅방 테이블이 존재하지만 데이터가 없습니다.');
                return false;
            }
        } else {
            log.error(`채팅방 테이블 확인 실패: 상태 코드 ${response.statusCode}`);
            if (response.data && response.data.error) {
                log.error(`오류 메시지: ${response.data.error}`);
            }
            return false;
        }
    } catch (error) {
        log.error(`채팅방 테이블 확인 실패: ${error.message}`);
        return false;
    }
}

// 번역 API 연결 테스트 함수
async function testTranslationAPIConnection() {
    log.title('Google Cloud Translation API 연결 테스트');
    
    try {
        log.info(`Translation API 키: ${CONFIG.TRANSLATION_API_KEY.substring(0, 10)}...`);
        log.info('번역 API 요청 테스트 중...');
        
        const response = await testTranslationAPI();
        
        if (response && response.data && response.data.translations) {
            const translatedText = response.data.translations[0].translatedText;
            log.success(`번역 API 연결 성공: 'Hello' → '${translatedText}'`);
            return true;
        } else {
            log.error('번역 API 응답 형식 오류');
            return false;
        }
    } catch (error) {
        log.error(`번역 API 연결 테스트 실패: ${error.message}`);
        return false;
    }
}

// 초기화 함수
async function checkInitialization() {
    log.title('애플리케이션 초기화 상태 확인');
    
    try {
        // 필수 파일 확인
        const requiredFiles = [
            './index.html',
            './admin.html',
            './chat/index.html',
            './js/config.js',
            './js/main.js',
            './css/styles.css',
            './server.js'
        ];
        
        let allFilesExist = true;
        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                log.info(`파일 확인: ${file} - 존재함`);
            } else {
                log.error(`파일 확인: ${file} - 존재하지 않음`);
                allFilesExist = false;
            }
        }
        
        if (allFilesExist) {
            log.success('모든 필수 파일이 존재합니다.');
        } else {
            log.error('일부 필수 파일이 누락되었습니다.');
        }
        
        // JS 서비스 모듈 확인
        const serviceModules = [
            './js/services/dbService.js',
            './js/services/realtimeService.js',
            './js/services/translationService.js',
            './js/services/userService.js',
            './js/services/chatService.js',
            './js/services/offlineService.js'
        ];
        
        let allModulesExist = true;
        for (const module of serviceModules) {
            if (fs.existsSync(module)) {
                log.info(`모듈 확인: ${module} - 존재함`);
            } else {
                log.error(`모듈 확인: ${module} - 존재하지 않음`);
                allModulesExist = false;
            }
        }
        
        if (allModulesExist) {
            log.success('모든 서비스 모듈이 존재합니다.');
        } else {
            log.error('일부 서비스 모듈이 누락되었습니다.');
        }
        
        return allFilesExist && allModulesExist;
    } catch (error) {
        log.error(`초기화 상태 확인 실패: ${error.message}`);
        return false;
    }
}

// 테스트 실행 및 결과 보고
async function runTests() {
    log.title('Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 설정 테스트');
    log.info('테스트 시작: ' + new Date().toLocaleString());
    
    try {
        let allTestsPassed = true;
        
        // 초기화 상태 확인
        const initResult = await checkInitialization();
        allTestsPassed = allTestsPassed && initResult;
        
        // 서버 연결 테스트
        await testServerConnection();
        
        // Supabase 연결 테스트
        const supabaseResult = await testSupabaseConnection();
        allTestsPassed = allTestsPassed && supabaseResult;
        
        // 채팅방 테이블 확인
        if (supabaseResult) {
            const chatroomsResult = await checkChatroomsTable();
            allTestsPassed = allTestsPassed && chatroomsResult;
        }
        
        // 번역 API 테스트
        const translationResult = await testTranslationAPIConnection();
        allTestsPassed = allTestsPassed && translationResult;
        
        // 종합 결과 보고
        log.title('테스트 결과 요약');
        
        if (allTestsPassed) {
            log.success('모든 테스트가 성공적으로 완료되었습니다!');
            log.success('애플리케이션을 실행할 준비가 되었습니다.');
            log.info('실행 명령어: npm start');
        } else {
            log.warning('일부 테스트에 실패했습니다.');
            log.info('실패한 테스트를 해결한 후 다시 시도하세요.');
        }
    } catch (error) {
        log.error(`테스트 실행 중 오류 발생: ${error.message}`);
    }
    
    log.info('테스트 종료: ' + new Date().toLocaleString());
}

// 테스트 실행
runTests();
