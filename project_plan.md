# Global SeatCon 2025 컨퍼런스 채팅 애플리케이션 프로젝트 계획

## 1. 프로젝트 개요
Global SeatCon 2025 행사를 위한 다국어 실시간 채팅 애플리케이션 개발 프로젝트입니다. 다양한 언어를 사용하는 참가자들이 실시간으로 소통할 수 있도록 번역 기능을 포함한 채팅 플랫폼을 구현합니다.

## 2. 기술 스택
- **프론트엔드**: 순수 HTML, CSS, JavaScript (프레임워크 미사용)
- **백엔드**: Supabase (PostgreSQL + Realtime)
- **번역 API**: Google Cloud Translation API
- **로컬 저장소**: LocalStorage
- **호스팅**: GitHub Pages / 내장 웹 서버

## 3. API 서비스 정보
- **Supabase URL**: `https://dolywnpcrutdxuxkozae.supabase.co`
- **Supabase 익명 키**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8`
- **Google Cloud Translation API 키**: `AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs`

## 4. 파일 구조
```
conference-chat/
├── index.html                # 메인 애플리케이션 화면
├── admin.html                # 관리자 페이지
├── 404.html                  # 404 오류 페이지
├── chat/                     # 채팅 관련 파일
│   └── index.html            # 채팅 애플리케이션 화면
├── css/
│   ├── styles.css            # 메인 스타일시트
│   └── admin.css             # 관리자 페이지 스타일시트
├── js/
│   ├── config.js             # 애플리케이션 설정 및 API 키
│   ├── main.js               # 메인 애플리케이션 로직
│   ├── admin.js              # 관리자 페이지 로직
│   └── services/
│       ├── dbService.js      # Supabase 연결 및 데이터 관리
│       ├── realtimeService.js # 실시간 통신 처리
│       ├── translationService.js # 번역 기능
│       ├── userService.js    # 사용자 관리 
│       ├── chatService.js    # 채팅 메시지 처리
│       └── offlineService.js # 오프라인 모드 지원
├── assets/                   # 정적 리소스
│   └── images/               # 이미지 파일
├── db_schema.sql             # 데이터베이스 스키마
├── server.js                 # Node.js 웹 서버 (로컬 테스트용)
├── package.json              # 프로젝트 의존성 및 스크립트
├── README.md                 # 프로젝트 설명 문서
├── DEPLOY.md                 # 배포 가이드
└── setup_guide.md            # 설정 가이드
```

## 5. 현재 진행 상황
- [✓] 프로젝트 구조 및 파일 생성 완료
- [✓] HTML/CSS 구현 완료
- [✓] 핵심 JavaScript 서비스 모듈 구현 완료
  - [✓] dbService.js (Supabase 연결 및 데이터 관리)
  - [✓] realtimeService.js (실시간 통신 처리)
  - [✓] translationService.js (번역 기능)
  - [✓] userService.js (사용자 관리)
  - [✓] chatService.js (채팅 메시지 처리)
  - [✓] offlineService.js (오프라인 모드 지원)
- [✓] 메인 애플리케이션 로직(main.js) 구현 완료
- [✓] 데이터베이스 스키마 설계 완료
- [✓] README.md 및 문서 작성 완료

## 6. 해결해야 할 과제
1. [!] **Supabase 프로젝트 설정 및 초기화**
   - 데이터베이스 테이블 생성 및 초기 데이터 설정
   - Supabase Realtime 설정
   - API 권한 설정

2. [!] **관리자 페이지 기능 구현**
   - 관리자 페이지(admin.js) 구현 완료
   - 채팅방 관리 기능 테스트
   - 사용자 관리 기능 테스트

3. [!] **통합 테스트**
   - 다양한 브라우저에서의 호환성 테스트
   - 모바일 기기 지원 확인
   - 오프라인 모드 기능 테스트

4. [!] **배포 준비**
   - 설정 파일(config.js) 보안 강화
   - API 키 환경 변수 처리

## 7. 작업 계획
1. **Supabase 프로젝트 설정 및 초기화**
   - Supabase 프로젝트에 db_schema.sql 적용
   - 채팅방 초기 데이터 생성
   - Supabase Realtime 기능 활성화

2. **관리자 페이지 구현 완료**
   - admin.js 코드 최적화 및 기능 보완
   - 권한 관리 기능 개선

3. **CSS 최적화 및 모바일 지원 강화**
   - 반응형 디자인 개선
   - 모바일 기기에서의 사용성 테스트

4. **성능 최적화**
   - 대량 메시지 처리 성능 개선
   - 번역 서비스 캐시 최적화

5. **보안 강화**
   - API 키 보안 처리
   - Supabase RLS(Row Level Security) 설정
   - 관리자 인증 보안 강화

## 8. 배포 계획
1. 최종 테스트
2. GitHub Pages에 배포
3. 관리자 계정 설정 및 보안 강화
4. 사용자 가이드 작성

## 9. 테스트 계획
1. **기능 테스트**
   - 사용자 등록 및 로그인 테스트
   - 채팅 메시지 전송/수신 테스트
   - 번역 기능 테스트
   - 오프라인 모드 테스트
   - 관리자 기능 테스트

2. **호환성 테스트**
   - Chrome, Firefox, Safari, Edge 브라우저 테스트
   - iOS, Android 모바일 기기 테스트

3. **성능 테스트**
   - 대량 메시지 처리 테스트
   - 동시 접속 사용자 처리 테스트
   - 네트워크 지연 시나리오 테스트
