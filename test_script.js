#!/usr/bin/env node

/**
 * test_script.js
 * Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 테스트 스크립트
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 로그 함수
const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    step: (msg) => console.log(`${colors.cyan}[STEP]${colors.reset} ${msg}`),
    header: (msg) => {
        console.log('\n' + '='.repeat(80));
        console.log(`${colors.magenta}${msg}${colors.reset}`);
        console.log('='.repeat(80));
    }
};

// 프로젝트 디렉토리
const projectDir = path.resolve(__dirname);

// 테스트할 파일들
const requiredFiles = [
    'index.html',
    'admin.html',
    '404.html',
    'chat/index.html',
    'js/config.js',
    'js/main.js',
    'js/admin.js',
    'js/services/dbService.js',
    'js/services/realtimeService.js',
    'js/services/translationService.js',
    'js/services/userService.js',
    'js/services/chatService.js',
    'js/services/offlineService.js',
    'css/styles.css',
    'css/admin.css',
    'db_schema.sql',
    'server.js',
    'package.json',
    'README.md',
    'DEPLOY.md',
    'setup_guide.md'
];

// 테스트 함수들
const tests = {
    // 1. 필수 파일 존재 확인
    async checkRequiredFiles() {
        log.header('필수 파일 존재 확인');
        
        const missingFiles = [];
        
        for (const file of requiredFiles) {
            try {
                const filePath = path.join(projectDir, file);
                await fs.access(filePath);
                log.success(`파일 확인: ${file}`);
            } catch (err) {
                log.error(`파일 없음: ${file}`);
                missingFiles.push(file);
            }
        }
        
        if (missingFiles.length === 0) {
            log.success('모든 필수 파일이 존재합니다.');
            return true;
        } else {
            log.error(`${missingFiles.length}개의 파일이 누락되었습니다.`);
            return false;
        }
    },
    
    // 2. 설정 파일 검증
    async validateConfigFile() {
        log.header('설정 파일 검증');
        
        try {
            const configPath = path.join(projectDir, 'js', 'config.js');
            const configContent = await fs.readFile(configPath, 'utf8');
            
            // API 키 확인
            const hasSupabaseUrl = configContent.includes('SUPABASE_URL');
            const hasSupabaseKey = configContent.includes('SUPABASE_KEY');
            const hasTranslationApiKey = configContent.includes('TRANSLATION_API_KEY');
            
            if (hasSupabaseUrl && hasSupabaseKey && hasTranslationApiKey) {
                log.success('모든 API 키가 설정되어 있습니다.');
                
                // 구체적인 값 확인
                if (configContent.includes('yourusername')) {
                    log.warning('기본 자리표시자 값이 있습니다. 실제 API 키로 업데이트하세요.');
                }
                
                return true;
            } else {
                if (!hasSupabaseUrl) log.error('SUPABASE_URL이 누락되었습니다.');
                if (!hasSupabaseKey) log.error('SUPABASE_KEY가 누락되었습니다.');
                if (!hasTranslationApiKey) log.error('TRANSLATION_API_KEY가 누락되었습니다.');
                
                return false;
            }
        } catch (err) {
            log.error(`설정 파일 검증 실패: ${err.message}`);
            return false;
        }
    },
    
    // 3. 패키지 의존성 확인
    async checkDependencies() {
        log.header('패키지 의존성 확인');
        
        try {
            const packagePath = path.join(projectDir, 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf8');
            const packageData = JSON.parse(packageContent);
            
            // 필수 스크립트 확인
            const hasStartScript = packageData.scripts && packageData.scripts.start;
            const hasDevScript = packageData.scripts && packageData.scripts.dev;
            
            if (hasStartScript && hasDevScript) {
                log.success('필수 스크립트가 설정되어 있습니다.');
            } else {
                if (!hasStartScript) log.error('시작 스크립트가 누락되었습니다.');
                if (!hasDevScript) log.error('개발 스크립트가 누락되었습니다.');
            }
            
            // nodemon 의존성 확인
            const hasNodemon = packageData.devDependencies && packageData.devDependencies.nodemon;
            
            if (hasNodemon) {
                log.success('nodemon 의존성이 설정되어 있습니다.');
            } else {
                log.warning('nodemon 의존성이 누락되었습니다. 개발 모드에서 자동 새로고침이 동작하지 않을 수 있습니다.');
            }
            
            return hasStartScript && hasDevScript;
        } catch (err) {
            log.error(`패키지 의존성 확인 실패: ${err.message}`);
            return false;
        }
    },
    
    // 4. 포트 사용 가능 여부 확인
    async checkPortAvailability() {
        log.header('포트 사용 가능 여부 확인');
        
        const port = 3000;
        
        return new Promise(resolve => {
            const server = http.createServer();
            
            server.once('error', err => {
                if (err.code === 'EADDRINUSE') {
                    log.error(`포트 ${port}가 이미 사용 중입니다. 다른 포트를 사용하세요.`);
                    resolve(false);
                } else {
                    log.error(`포트 확인 중 오류 발생: ${err.message}`);
                    resolve(false);
                }
            });
            
            server.once('listening', () => {
                server.close(() => {
                    log.success(`포트 ${port}가 사용 가능합니다.`);
                    resolve(true);
                });
            });
            
            server.listen(port);
        });
    },
    
    // 5. HTML 유효성 검사
    async validateHTML() {
        log.header('HTML 파일 유효성 검사');
        
        try {
            const htmlFiles = [
                'index.html',
                'admin.html',
                '404.html',
                'chat/index.html'
            ];
            
            let allValid = true;
            
            for (const file of htmlFiles) {
                const filePath = path.join(projectDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                // 간단한 유효성 검사
                const hasDocType = content.includes('<!DOCTYPE html>');
                const hasHtml = content.includes('<html');
                const hasHead = content.includes('<head>');
                const hasBody = content.includes('<body>');
                const hasClosingTags = content.includes('</html>') && 
                                      content.includes('</head>') && 
                                      content.includes('</body>');
                
                if (hasDocType && hasHtml && hasHead && hasBody && hasClosingTags) {
                    log.success(`HTML 유효성 검사 통과: ${file}`);
                } else {
                    log.error(`HTML 유효성 검사 실패: ${file}`);
                    if (!hasDocType) log.warning('DOCTYPE 선언이 누락되었습니다.');
                    if (!hasHtml) log.warning('html 태그가 누락되었습니다.');
                    if (!hasHead) log.warning('head 태그가 누락되었습니다.');
                    if (!hasBody) log.warning('body 태그가 누락되었습니다.');
                    if (!hasClosingTags) log.warning('닫는 태그가 누락되었습니다.');
                    
                    allValid = false;
                }
            }
            
            return allValid;
        } catch (err) {
            log.error(`HTML 유효성 검사 실패: ${err.message}`);
            return false;
        }
    }
};

// 메인 테스트 함수
async function runTests() {
    log.header('Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 테스트 시작');
    
    const results = {
        requiredFiles: await tests.checkRequiredFiles(),
        configFile: await tests.validateConfigFile(),
        dependencies: await tests.checkDependencies(),
        portAvailability: await tests.checkPortAvailability(),
        htmlValidity: await tests.validateHTML()
    };
    
    // 결과 요약
    log.header('테스트 결과 요약');
    
    let allPassed = true;
    for (const [test, result] of Object.entries(results)) {
        if (result) {
            log.success(`✓ ${test} 테스트 통과`);
        } else {
            log.error(`✗ ${test} 테스트 실패`);
            allPassed = false;
        }
    }
    
    // 전체 결과
    log.header(allPassed ? '모든 테스트 통과!' : '일부 테스트 실패');
    
    if (allPassed) {
        log.success('애플리케이션이 론칭 준비가 되었습니다.');
        log.info('서버를 시작하려면 다음 명령어를 실행하세요:');
        log.info('  npm start');
    } else {
        log.warning('론칭 전에 실패한 테스트를 확인하고 문제를 해결하세요.');
    }
    
    return allPassed;
}

// 테스트 실행
runTests().then(passed => {
    process.exit(passed ? 0 : 1);
});