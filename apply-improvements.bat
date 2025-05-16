@echo off
REM 개선된 파일 적용 스크립트 (Windows용)
REM 이 스크립트는 개선된 파일들을 기존 파일로 복사합니다.

echo Conference-Chat 개선 파일 적용 시작...

REM 1. HTML 파일 업데이트
if exist "index.html.improved" (
  echo index.html 업데이트 중...
  copy /Y index.html.improved index.html
) else (
  echo index.html.improved 파일을 찾을 수 없습니다.
)

REM 2. JS 파일 업데이트
if exist "js\app.js" (
  echo main.js 업데이트 중...
  copy /Y js\app.js js\main.js
) else (
  echo js\app.js 파일을 찾을 수 없습니다.
)

REM 3. DB 서비스 업데이트
if exist "js\services\improved_dbService.js" (
  echo dbService.js 업데이트 중...
  copy /Y js\services\improved_dbService.js js\services\dbService.js
) else (
  echo js\services\improved_dbService.js 파일을 찾을 수 없습니다.
)

echo 파일 업데이트 완료!
echo.
echo 다음 단계: 
echo 1. index.html 파일을 편집하여 다음 스크립트 추가:
echo    - js/i18n.js 다음에 js/init-supabase.js
echo    - css/styles.css 다음에 css/status.css
echo.
echo 2. Supabase 대시보드에서 updated_schema.sql 파일의 내용을 SQL 편집기에서 실행하세요.
echo.
pause
