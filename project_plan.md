# 컨퍼런스 실시간 다국어 번역 채팅 시스템 프로젝트 계획

## 1. 프로젝트 개요
이 프로젝트는 2025 글로벌 시트 컨퍼런스를 위한 실시간 다국어 번역 채팅 시스템을 구현합니다. 사용자들이 자신의 모국어로 소통할 수 있도록 하는 웹/모바일 최적화 채팅 솔루션입니다.

## 2. 기술 스택
- **프론트엔드**: HTML, CSS, JavaScript (ES6+)
- **백엔드**: Supabase (PostgreSQL, 실시간 기능)
- **번역 서비스**: Google Cloud Translation API
- **라이브러리**: Supabase Client, Font Awesome
- **개발 도구**: Node.js, http-server

## 3. 주요 기능 요구사항
1. **실시간 채팅 시스템**
   - Supabase 실시간 데이터베이스를 활용한 즉각적인 메시지 전송/수신
   - 사용자 역할 기반 접근 제어 (참가자, 발표자, 스태프 등)
   - 메시지 좋아요 기능과 실시간 알림

2. **다국어 번역 지원**
   - Google Cloud Translation API를 활용한 자동 언어 감지
   - 사용자 선호 언어로 실시간 메시지 번역
   - 한국어, 영어, 힌디어, 중국어 지원
   - 번역 결과 캐싱으로 API 호출 최적화

3. **메시지 답장 기능**
   - 왓츠앱 스타일 슬라이드 액션으로 답장 UI 구현
   - 원본 메시지 참조 기능 및 답장 내용 스레드 표시
   - 답장 시 원본 메시지로 쉽게 이동 가능한 네비게이션

4. **관리자 페이지 구현**
   - 보안된 관리자 로그인 (비밀번호: rnrud9881)
   - 채팅방 생성, 수정, 삭제 및 카테고리화 기능
   - 통계 기능을 통한 채팅 활동 모니터링

5. **반응형 디자인**
   - 모바일, 태블릿, 데스크톱 지원 레이아웃
   - 다크/라이트 모드 테마 전환 기능
   - 하단 고정 채팅 UI로 사용성 개선

6. **고급 UI 기능**
   - 스태프 메시지 상단 고정 공지 기능
   - 새 메시지 알림 및 스크롤 위치 관리
   - 언어별 맞춤 타임스탬프 포맷

## 4. 데이터베이스 스키마 설계
1. **사용자 (users)**
   - id, username, preferred_language, role, avatar_url, created_at

2. **채팅방 (rooms)**
   - id, name, description, category_id, created_at, created_by, is_active

3. **카테고리 (categories)**
   - id, name, description, created_at

4. **메시지 (messages)**
   - id, room_id, user_id, content, original_language, created_at, 
   - reply_to_id (nullable), is_pinned, is_deleted

5. **번역 캐시 (translation_cache)**
   - id, original_text, target_language, translated_text, created_at

6. **좋아요 (likes)**
   - id, message_id, user_id, created_at

## 5. 개발 단계 및 파일 구조
1. **초기 설정**
   - [x] project_plan.md (현재 파일)
   - [x] 기본 디렉토리 구조 생성
   - [x] package.json 생성
   - [x] .gitignore 파일 생성

2. **프론트엔드 개발**
   - [x] HTML 구조 (index.html, admin.html)
   - [x] CSS 스타일링 (styles.css, dark-theme.css)
   - [x] JavaScript 기능 구현 (js/ 디렉토리)

3. **백엔드 통합**
   - [x] Supabase 초기화 및 설정 (js/supabase.js)
   - [x] 사용자 인증 기능 구현 (js/auth.js)
   - [x] 채팅 기능 구현 (js/chat.js)
   - [x] 번역 서비스 통합 (js/translation.js)

4. **관리자 기능 개발**
   - [x] 관리자 페이지 구현 (admin.html, js/admin.js)
   - [x] 채팅방 관리 기능 (js/room-management.js)
   - [x] 사용자 관리 기능 (js/user-management.js)

5. **테스트 및 최적화**
   - [x] 기능 테스트 및 디버깅
   - [x] 성능 최적화
   - [x] 보안 강화

6. **문서화 및 배포**
   - [x] 사용자 가이드 작성
   - [x] 관리자 가이드 작성
   - [x] 배포 문서 작성

## 6. API 키 및 서비스 정보
- **Supabase URL**: `https://veudhigojdukbqfgjeyh.supabase.co`
- **Supabase Anonymous Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao`
- **Google Cloud Translation API Key**: `AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs`

## 7. 진행 상황 추적
| 단계 | 상태 | 완료일 |
|-----|------|-------|
| 프로젝트 계획 수립 | 완료 | 2025-05-07 |
| 기본 디렉토리 구조 생성 | 완료 | 2025-05-07 |
| 프론트엔드 개발 | 대기 중 | |
| 백엔드 통합 | 대기 중 | |
| 관리자 기능 개발 | 대기 중 | |
| 테스트 및 최적화 | 대기 중 | |
| 문서화 및 배포 | 완료 | 2025-05-07 |
