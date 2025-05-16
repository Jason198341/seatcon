#!/bin/bash

# 개선된 파일 적용 스크립트
#
# 이 스크립트는 개선된 파일들을 기존 파일로 복사합니다.

echo "Conference-Chat 개선 파일 적용 시작..."

# 1. HTML 파일 업데이트
if [ -f "index.html.improved" ]; then
  echo "index.html 업데이트 중..."
  cp index.html.improved index.html
else
  echo "index.html.improved 파일을 찾을 수 없습니다."
fi

# 2. JS 파일 업데이트
if [ -f "js/app.js" ]; then
  echo "main.js 업데이트 중..."
  cp js/app.js js/main.js
else
  echo "js/app.js 파일을 찾을 수 없습니다."
fi

# 3. DB 서비스 업데이트
if [ -f "js/services/improved_dbService.js" ]; then
  echo "dbService.js 업데이트 중..."
  cp js/services/improved_dbService.js js/services/dbService.js
else
  echo "js/services/improved_dbService.js 파일을 찾을 수 없습니다."
fi

# 4. Supabase 초기화 스크립트 추가
if [ -f "js/init-supabase.js" ]; then
  echo "Supabase 초기화 스크립트 추가 중..."
  # index.html에 스크립트 태그 추가
  sed -i 's|<script src="js/i18n.js"></script>|<script src="js/i18n.js"></script>\n    <script src="js/init-supabase.js"></script>|g' index.html
else
  echo "js/init-supabase.js 파일을 찾을 수 없습니다."
fi

# 5. CSS 파일 추가
if [ -f "css/status.css" ]; then
  echo "CSS 파일 추가 중..."
  # index.html에 스타일시트 링크 추가
  sed -i 's|<link rel="stylesheet" href="css/styles.css">|<link rel="stylesheet" href="css/styles.css">\n    <link rel="stylesheet" href="css/status.css">|g' index.html
else
  echo "css/status.css 파일을 찾을 수 없습니다."
fi

# 6. 권한 부여
chmod +x setup-supabase.sh

echo "파일 업데이트 완료!"
echo "이제 Supabase 설정을 진행해야 합니다."
echo "다음 명령어를 실행하여 Supabase 테이블을 설정하세요:"
echo "./setup-supabase.sh"
