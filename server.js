const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
};

// 간단한 HTTP 서버 생성
const server = http.createServer((req, res) => {
    console.log(`요청: ${req.method} ${req.url}`);

    // URL 경로 정규화
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
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
                console.error(`파일 찾을 수 없음: ${filePath}`);
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content);
                    }
                });
            } else {
                // 서버 오류
                console.error(`서버 오류: ${err.code}`);
                res.writeHead(500);
                res.end('서버 오류가 발생했습니다.');
            }
        } else {
            // 성공적으로 파일을 읽은 경우
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// 서버 시작
server.listen(PORT, () => {
    console.log(`서버가 실행 중입니다: http://localhost:${PORT}`);
    console.log(`관리자 페이지: http://localhost:${PORT}/admin.html`);
    console.log(`채팅 애플리케이션: http://localhost:${PORT}/chat/`);
});