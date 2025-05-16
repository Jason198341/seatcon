# Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 론칭 체크리스트

## 1. 사전 준비

### 1.1 서버 및 환경 설정
- [ ] Node.js 설치 확인 (v14.x 이상)
- [ ] npm 패키지 설치: `npm install`
- [ ] 환경 변수 설정 확인
- [ ] local_setup.js 실행하여 기본 설정 상태 검증: `node local_setup.js`

### 1.2 Supabase 설정
- [ ] Supabase 프로젝트 초기화
  - [ ] db_schema.sql을 Supabase SQL Editor에서 실행
  - [ ] Realtime 기능 활성화
  - [ ] RLS(Row Level Security) 정책 설정
- [ ] API 키 및 URL 확인
  - [ ] js/config.js 파일에서 SUPABASE_URL 및 SUPABASE_KEY 확인
  - [ ] js/env-config.js 파일에서 환경 변수 설정 확인

### 1.3 Google Cloud Translation API 설정
- [ ] Google Cloud Translation API 활성화 확인
- [ ] API 키 유효성 확인
  - [ ] js/config.js 파일에서 TRANSLATION_API_KEY 확인

## 2. 로컬 테스트

### 2.1 웹 서버 실행
- [ ] `npm start` 명령으로 로컬 서버 실행
- [ ] 브라우저에서 접속 확인: http://localhost:3000

### 2.2 기능 테스트
- [ ] 메인 페이지 로드 확인
- [ ] 사용자 로그인 테스트
  - [ ] 이름 입력 및 선호 언어 선택
  - [ ] 채팅방 선택 및 입장
- [ ] 채팅 기능 테스트
  - [ ] 메시지 전송 및 수신
  - [ ] 자동 번역 확인
  - [ ] 답장 기능 확인
- [ ] 관리자 기능 테스트
  - [ ] 관리자 로그인 (ID: kcmmer, 비밀번호: rnrud9881@@HH)
  - [ ] 채팅방 관리 기능
  - [ ] 사용자 관리 기능
  - [ ] 시스템 상태 모니터링

### 2.3 오프라인 모드 테스트
- [ ] 네트워크 연결 끊김 시뮬레이션
- [ ] 오프라인 상태에서 메시지 작성
- [ ] 네트워크 연결 복구 후 메시지 동기화 확인

### 2.4 다양한 환경 테스트
- [ ] 크로스 브라우저 테스트
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] 모바일 호환성 테스트
  - [ ] iOS (iPhone, iPad)
  - [ ] Android

## 3. 보안 검토

### 3.1 API 키 보안
- [ ] 실제 배포 환경에서 API 키 보호 방안 확인
- [ ] 클라이언트 측 보안 취약점 검토

### 3.2 인증 및 권한
- [ ] 관리자 인증 보안 검토
- [ ] Supabase RLS 정책 검토

## 4. 배포 준비

### 4.1 코드 최적화
- [ ] JavaScript 코드 최종 검토
- [ ] CSS 최적화 확인
- [ ] 불필요한 주석 및 로그 정리

### 4.2 배포 설정
- [ ] 배포용 환경 변수 설정
- [ ] 정적 파일 최적화

## 5. 최종 배포

### 5.1 GitHub Pages 배포
- [ ] GitHub Pages 배포 설정
- [ ] CNAME 설정 (필요한 경우)

### 5.2 배포 후 테스트
- [ ] 라이브 환경에서 모든 기능 테스트
- [ ] 에러 모니터링 설정

## 6. 론칭 후 계획

### 6.1 모니터링 및 유지보수
- [ ] 오류 및 로그 모니터링 계획
- [ ] 사용자 피드백 수집 방안

### 6.2 향후 개선 사항
- [ ] 성능 최적화 계획
- [ ] 추가 기능 개발 계획