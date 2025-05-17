# Global SeatCon 2025 컨퍼런스 채팅 애플리케이션

## 프로젝트 소개
Global SeatCon 2025 컨퍼런스를 위한 다국어 실시간 자동 번역 채팅 애플리케이션입니다. 다양한 국적의 참가자들이 언어 장벽 없이 자유롭게 소통할 수 있도록 지원합니다.

## 주요 기능
- **실시간 채팅**: Supabase의 실시간 기능을 활용한 즉각적인 메시지 송수신
- **자동 번역**: Google Cloud Translation API를 활용한 메시지 자동 번역
- **다국어 인터페이스**: 한국어, 영어, 일본어, 중국어 지원
- **다중 채팅방**: 주제별, 세션별 채팅방 지원
- **비공개 채팅방**: 접근 코드를 통한 비공개 채팅방 지원
- **답장 기능**: 특정 메시지에 대한 답장 기능
- **공지사항**: 중요 공지사항 전파 기능
- **오프라인 모드**: 네트워크 불안정 시 로컬 저장 및 자동 동기화
- **관리자 기능**: 채팅방 관리, 사용자 관리, 시스템 모니터링

## 기술 스택
- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드 서비스**: Supabase (데이터베이스, 인증, 실시간 기능)
- **번역 서비스**: Google Cloud Translation API
- **호스팅**: GitHub Pages

## 설치 및 실행 방법
1. 저장소 클론
   ```
   git clone https://github.com/yourusername/conference-chat.git
   cd conference-chat
   ```

2. 의존성 설치 (필요한 경우)
   ```
   npm install
   ```

3. 환경 변수 설정
   - `.env` 파일을 생성하고 다음 정보 입력
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   TRANSLATION_API_KEY=your_google_translation_api_key
   ```

4. 로컬 서버 실행
   ```
   npm start
   ```

5. 브라우저에서 애플리케이션 접속
   ```
   http://localhost:3000
   ```

## 데이터베이스 구조
Supabase에 다음과 같은 테이블이 필요합니다:

1. **chatrooms**
   - id (uuid, primary key)
   - name (text)
   - description (text)
   - type (text: 'public' or 'private')
   - access_code (text, nullable)
   - max_users (integer)
   - status (text: 'active' or 'inactive')
   - created_at (timestamp)

2. **users**
   - id (uuid, primary key)
   - room_id (uuid, foreign key)
   - username (text)
   - preferred_language (text)
   - role (text, default: 'user')
   - created_at (timestamp)
   - last_active (timestamp)

3. **messages**
   - id (uuid, primary key)
   - room_id (uuid, foreign key)
   - user_id (uuid, foreign key)
   - username (text)
   - content (text)
   - language (text)
   - reply_to (uuid, nullable)
   - is_announcement (boolean)
   - created_at (timestamp)

4. **translations**
   - id (uuid, primary key)
   - message_id (uuid, foreign key)
   - language (text)
   - translation (text)
   - created_at (timestamp)

5. **admins**
   - id (uuid, primary key)
   - admin_id (text)
   - password (text)
   - name (text)
   - created_at (timestamp)

## 사용법

### 일반 사용자
1. 메인 페이지에서 '채팅 참여하기' 버튼 클릭
2. 사용자 이름 입력 및 선호 언어 선택
3. 참여할 채팅방 선택 (비공개 채팅방인 경우 접근 코드 입력)
4. 채팅방에서 자유롭게 대화 (자동 번역 기능)

### 관리자
1. 메인 페이지에서 '관리자 페이지' 버튼 클릭
2. 관리자 ID 및 비밀번호 입력
3. 대시보드에서 채팅방 관리, 사용자 관리, 시스템 상태 확인

## 개발자 가이드
- `dbService.js`: Supabase 연동 및 데이터베이스 작업
- `realtimeService.js`: 실시간 메시지 처리
- `translationService.js`: Google Cloud Translation API 연동
- `userService.js`: 사용자 정보 관리
- `chatService.js`: 채팅 메시지 관리
- `offlineService.js`: 오프라인 모드 지원

## 기여 방법
1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이선스
MIT License

## 작성자
Your Name

## 감사의 글
- [Supabase](https://supabase.io/)
- [Google Cloud Translation API](https://cloud.google.com/translate)
