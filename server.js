/**
 * 컨퍼런스 채팅 환경 변수 관리 서버
 * 
 * 이 서버는 환경 변수를 안전하게 관리하여 프론트엔드에 제공합니다.
 * 실제 API 키를 클라이언트에 노출하지 않고 필요한 설정만 제공합니다.
 */

// 필요한 모듈 로드
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// .env 파일 로드
const result = dotenv.config();
if (result.error) {
    console.warn('.env 파일을 로드할 수 없습니다. 환경 변수가 시스템에 직접 설정되어 있는지 확인하세요.');
}

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 8090;

// 정적 파일 제공 - 웹 애플리케이션 파일
app.use(express.static(__dirname));

// 환경 변수 상태 확인 및 처리
function getRequiredEnvVars() {
    // 필요한 환경 변수 목록
    const requiredEnvVars = [
        'SUPABASE_URL',
        'SUPABASE_KEY',
        'TRANSLATION_API_KEY'
    ];
    
    // 환경 변수 상태 확인
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.warn(`경고: 일부 환경 변수가 설정되지 않았습니다: ${missingVars.join(', ')}`);
    }
    
    return requiredEnvVars;
}

// 클라이언트에 제공할 환경 변수 객체 생성
function getSecuredConfig() {
    // 필요한 환경 변수 목록
    const requiredVars = getRequiredEnvVars();
    
    // 클라이언트에 제공할 환경 변수 객체
    const config = {};
    
    // 필요한 환경 변수만 포함
    requiredVars.forEach(varName => {
        config[varName] = process.env[varName] || '';
    });
    
    return config;
}

// /api/config 엔드포인트 - 환경 변수 제공
app.get('/api/config', (req, res) => {
    // 개발/프로덕션 환경 구분
    const isDevMode = process.env.NODE_ENV !== 'production';
    
    // 헤더 설정
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    
    if (isDevMode) {
        // 개발 환경 - 모든 설정 제공
        const config = getSecuredConfig();
        if (Object.values(config).some(val => val)) {
            return res.json(config);
        }
        
        // 환경 변수가 설정되지 않은 경우
        return res.status(404).json({
            error: '환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.'
        });
    } else {
        // 프로덕션 환경 - 스크립트 요청 및 IP 확인 등 추가 보안 조치 가능
        const config = getSecuredConfig();
        if (Object.values(config).some(val => val)) {
            return res.json(config);
        }
        
        // 환경 변수가 설정되지 않은 경우
        return res.status(500).json({
            error: '서버 설정 오류: 환경 변수가 구성되지 않았습니다.'
        });
    }
});

// HTML 파일을 읽고 환경 변수 주입
function injectEnvVarsToHTML(filePath, res) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('HTML 파일 읽기 오류:', err);
            return res.status(500).send('서버 오류');
        }
        
        // 클라이언트에 제공할 설정 가져오기
        const config = getSecuredConfig();
        
        // HTML에 환경 변수 스크립트 추가
        const envVarsScript = `<script>window.ENV_VARS = ${JSON.stringify(config)};</script>`;
        const injectedData = data.replace('</head>', `${envVarsScript}\n</head>`);
        
        // 수정된 HTML 응답
        res.send(injectedData);
    });
}

// 메인 페이지 라우트 - 환경 변수 주입
app.get('/', (req, res) => {
    injectEnvVarsToHTML(path.join(__dirname, 'index.html'), res);
});

// 환경 변수 설정 페이지 (개발 모드에서만 제공)
app.get('/env-setup.html', (req, res) => {
    // 프로덕션 환경에서는 접근 제한
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).send('프로덕션 환경에서는 이 페이지에 접근할 수 없습니다.');
    }
    
    // 개발 환경에서는 페이지 제공
    res.sendFile(path.join(__dirname, 'env-setup.html'));
});

// 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
    // 필요한 환경 변수 확인
    const requiredVars = getRequiredEnvVars();
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    res.json({
        status: missingVars.length === 0 ? 'ok' : 'warning',
        message: missingVars.length === 0 ? '서버가 정상 작동 중입니다.' : '일부 환경 변수가 누락되었습니다.',
        missingEnvVars: missingVars.length > 0 ? missingVars : undefined,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV || 'development'
    });
});

// 404 처리
app.use((req, res) => {
    res.status(404).send('페이지를 찾을 수 없습니다.');
});

// 서버 시작
app.listen(PORT, () => {
    console.log('======================================================');
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
    
    // 환경 변수 상태 확인
    const requiredVars = getRequiredEnvVars();
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.warn('경고: 다음 환경 변수가 설정되지 않았습니다:');
        missingVars.forEach(varName => {
            console.warn(`- ${varName}`);
        });
        console.warn('.env 파일 또는 시스템 환경 변수를 확인하세요.');
    } else {
        console.log('모든 필수 환경 변수가 설정되었습니다.');
    }
    console.log('======================================================');
});
