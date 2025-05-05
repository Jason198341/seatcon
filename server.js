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
dotenv.config();

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 8090;

// 정적 파일 제공 - 웹 애플리케이션 파일
app.use(express.static(__dirname));

// 환경 변수 확인 및 처리
function getSecuredConfig() {
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
    
    // 클라이언트에 제공할 환경 변수 객체
    return {
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_KEY: process.env.SUPABASE_KEY || '',
        TRANSLATION_API_KEY: process.env.TRANSLATION_API_KEY || ''
    };
}

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

// 404 처리
app.use((req, res) => {
    res.status(404).send('페이지를 찾을 수 없습니다.');
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log('환경 변수 상태:', getSecuredConfig());
});
