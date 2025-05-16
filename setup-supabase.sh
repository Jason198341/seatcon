#!/bin/bash

# Supabase 셋업 스크립트
# 
# 이 스크립트는 Supabase 프로젝트에 필요한 테이블과 인덱스를 생성합니다.
# Supabase CLI가 설치되어 있어야 합니다.

echo "Supabase 테이블 셋업 시작..."

# 설정 파일에서 환경 변수 로드
source .env

# 필요한 환경 변수 확인
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "오류: .env 파일에 SUPABASE_URL 또는 SUPABASE_KEY가 없습니다."
  exit 1
fi

# Supabase URL에서 프로젝트 ID 추출
PROJECT_ID=$(echo "$SUPABASE_URL" | awk -F'/' '{print $3}' | awk -F'.' '{print $1}')

echo "Supabase 프로젝트 ID: $PROJECT_ID"
echo "테이블 생성 중..."

# SQL 스크립트 실행
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "name": "create_tables",
  "sql": "$(cat ./supabase/updated_schema.sql | tr -d '\n' | sed 's/"/\\"/g')"
}
EOF

if [ $? -eq 0 ]; then
  echo "테이블 생성 성공!"
  echo "이제 Supabase 실시간 기능을 활성화해야 합니다."
  echo "Supabase 대시보드에서 다음을 수행하세요:"
  echo "1. 프로젝트 > 데이터베이스 > 복제"
  echo "2. 실시간 기능 활성화"
  echo "3. 'messages' 테이블에 대한 실시간 구독 허용"
  echo ""
  echo "셋업 완료!"
else
  echo "테이블 생성 실패. Supabase 대시보드에서 직접 SQL 스크립트를 실행하세요."
  exit 1
fi
