# 시트 컨퍼런스 앱 데이터베이스 설정

이 폴더에는 Supabase 테이블 생성 및 초기 데이터 삽입을 위한 SQL 스크립트가 포함되어 있습니다.

## 테이블 구조

프로젝트에서 사용하는 테이블 구조는 다음과 같습니다:

1. **users**: 사용자 정보 (관리자/일반 사용자)
2. **exhibits**: 전시물 정보
3. **schedules**: 컨퍼런스 일정
4. **presentations**: 발표 일정
5. **chat_rooms**: 채팅방 정보
6. **messages**: 채팅 메시지

## SQL 스크립트 적용 방법

Supabase Dashboard를 통해 각 SQL 파일의 내용을 실행하여 테이블을 생성하고 초기 데이터를 삽입할 수 있습니다:

1. [Supabase 대시보드](https://app.supabase.io/)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 "SQL Editor"를 클릭합니다.
4. "New Query"를 클릭합니다.
5. SQL 파일의 내용을 복사하여 붙여넣습니다.
6. "Run"을 클릭하여 쿼리를 실행합니다.

## 테이블 생성 순서

테이블 간 외래 키 참조가 있으므로 다음 순서로 테이블을 생성하는 것이 좋습니다:

1. users
2. exhibits
3. schedules
4. presentations
5. chat_rooms
6. messages
