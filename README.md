# 컨퍼런스 채팅 애플리케이션

간단한 웹 기반 실시간 채팅 애플리케이션으로, 실시간 번역 기능이 포함되어 있습니다.

## 기능

- 실시간 채팅
- 메시지 실시간 번역
- 다양한 언어 지원
- 간단한 사용자 인증
- 모바일 대응 반응형 디자인

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드**: Node.js, Express
- **실시간 통신**: Socket.io
- **데이터베이스**: Supabase
- **번역 서비스**: Google Cloud Translation API

## 시작하기

### 전제 조건

- Node.js 14.x 이상
- Supabase 계정
- Google Cloud Translation API 키

### 설치

1. 저장소를 클론합니다:
```bash
git clone https://github.com/your-username/conference-chat.git
cd conference-chat
```

2. 필요한 패키지를 설치합니다:
```bash
npm install
```

3. `.env` 파일을 프로젝트 루트에 생성하고 다음과 같이 구성합니다:
```
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
```

4. Supabase 데이터베이스 설정:
   - Supabase 프로젝트에서 SQL 에디터를 열고 `supabase/setup.sql` 파일의 내용을 실행합니다.

### 실행

개발 모드로 애플리케이션을 실행합니다:
```bash
npm run dev
```

프로덕션 모드로 애플리케이션을 실행합니다:
```bash
npm start
```

## 사용 방법

1. 웹 브라우저에서 `http://localhost:3000`에 접속합니다.
2. 사용자 이름, 선호 언어, 채팅방 ID를 입력하고 '채팅 참가' 버튼을 클릭합니다.
3. 채팅 인터페이스에서 메시지를 입력하고 '전송' 버튼을 클릭하거나 엔터 키를 누릅니다.
4. 다른 사용자의 메시지는 자동으로 선택한 언어로 번역됩니다.
5. 상단 드롭다운 메뉴에서 언어를 변경하여 다른 언어로 메시지를 볼 수 있습니다.

## 참고 사항

- 이 애플리케이션은 데모 용도로 제작되었으며, 보안 강화가 필요할 수 있습니다.
- 사용자 인증은 간단한 임시 사용자 방식으로 구현되어 있습니다.
- Google 번역 API의 사용량 제한에 주의하세요.
