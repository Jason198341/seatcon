@echo off
echo 컨퍼런스 채팅 앱 업데이트 시작...

echo 기존 파일 백업 중...
copy "C:\MYCLAUDE_PROJECT\conference-chat\js\app.js" "C:\MYCLAUDE_PROJECT\conference-chat\js\app.js.bak"
copy "C:\MYCLAUDE_PROJECT\conference-chat\js\database.js" "C:\MYCLAUDE_PROJECT\conference-chat\js\database.js.bak"

echo 새 파일 적용 중...
copy "C:\MYCLAUDE_PROJECT\conference-chat\js\app.js.new" "C:\MYCLAUDE_PROJECT\conference-chat\js\app.js"
copy "C:\MYCLAUDE_PROJECT\conference-chat\js\database_fixed.js" "C:\MYCLAUDE_PROJECT\conference-chat\js\database.js"

echo 업데이트 완료!
echo 실시간 메시지 동기화 문제가 해결되었습니다.
pause
