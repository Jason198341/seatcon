const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 환경 변수 또는 기본값 사용
const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.NODE_ENV !== 'production';

// MIME 타입 매핑
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject'
};

// 보안 헤더
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co https://translation.googleapis.com;",
    'Referrer-Policy': 'no-referrer-when-downgrade',
    'Feature-Policy': "camera 'none'; microphone 'none'; geolocation 'none'"
};

// 캐싱 헤더
const getCacheHeaders = (extname) => {
    // 개발 모드에서는 캐싱 비활성화
    if (DEV_MODE) {
        return {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
    }

    // 정적 리소스에 대해 장기 캐싱 적용
    const staticAssetExts = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot'];
    if (staticAssetExts.includes(extname)) {
        return {
            'Cache-Control': 'public, max-age=86400'  // 24시간 캐싱
        };
    }

    // HTML에 대해 짧은 캐싱 적용
    if (extname === '.html') {
        return {
            'Cache-Control': 'public, max-age=3600'  // 1시간 캐싱
        };
    }

    // 기본 캐싱 설정
    return {
        'Cache-Control': 'public, max-age=3600'
    };
};

// 로그 함수
const log = (message, type = 'info') => {
    const now = new Date().toISOString();
    const coloredType = (() => {
        switch (type) {
            case 'error': return '\x1b[31m[ERROR]\x1b[0m';
            case 'warn': return '\x1b[33m[WARN]\x1b[0m';
            case 'success': return '\x1b[32m[SUCCESS]\x1b[0m';
            default: return '\x1b[36m[INFO]\x1b[0m';
        }
    })();
    
    console.log(`${now} ${coloredType} ${message}`);
};

// 요청 처리
const handleRequest = (req, res) => {
    // 요청 URL 파싱
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 로그 기록
    log(`${req.method} ${pathname}`);

    // URL 경로 정규화
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    // 디렉토리인 경우 index.html 파일 찾기
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    // 파일 확장자 확인
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'text/plain';

    // 파일 읽기
    fs.readFile(filePath, (err, content) => {
        if (err) {
            // 파일을 찾을 수 없는 경우 404 페이지 표시
            if (err.code === 'ENOENT') {
                log(`파일 찾을 수 없음: ${filePath}`, 'error');
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(404, { 
                            'Content-Type': 'text/html',
                            ...SECURITY_HEADERS
                        });
                        res.end(content);
                    }
                });
            } else {
                // 서버 오류
                log(`서버 오류: ${err.code}`, 'error');
                res.writeHead(500);
                res.end('서버 오류가 발생했습니다.');
            }
        } else {
            // 성공적으로 파일을 읽은 경우
            const headers = {
                'Content-Type': contentType,
                ...SECURITY_HEADERS,
                ...getCacheHeaders(extname)
            };

            res.writeHead(200, headers);
            res.end(content);
        }
    });
};

// 서버 생성
const server = http.createServer(handleRequest);

// 서버 시작
server.listen(PORT, () => {
    log(`서버가 실행 중입니다: http://localhost:${PORT}`, 'success');
    log(`관리자 페이지: http://localhost:${PORT}/admin.html`, 'success');
    log(`채팅 애플리케이션: http://localhost:${PORT}/chat/`, 'success');
    log(`개발 모드: ${DEV_MODE ? '활성화' : '비활성화'}`, 'info');
    
    // 환경 정보 표시
    log(`Node.js 버전: ${process.version}`, 'info');
    log(`OS: ${process.platform} ${process.arch}`, 'info');
});

// 에러 핸들링
server.on('error', (err) => {
    log(`서버 오류 발생: ${err.message}`, 'error');
    if (err.code === 'EADDRINUSE') {
        log(`포트 ${PORT}가 이미 사용 중입니다. 다른 포트를 사용하세요.`, 'error');
        process.exit(1);
    }
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
    log('서버를 종료합니다...', 'info');
    server.close(() => {
        log('서버가 종료되었습니다.', 'success');
        process.exit(0);
    });
});