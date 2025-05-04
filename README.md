# 컨퍼런스 실시간 번역 채팅 시스템

## 프로젝트 소개
현대자동차그룹 시트기술 컨퍼런스 2025를 위한 실시간 다국어 번역 채팅 시스템입니다. 참가자들이 자신의 선호 언어로 소통할 수 있는 웹/모바일 최적화 채팅 솔루션을 제공합니다.

## 주요 기능
- **실시간 채팅**: Supabase Realtime을 활용한 실시간 메시지 송수신
- **자동 번역**: Google Cloud Translation API를 통한 메시지 자동 번역
- **화자별 채팅룸**: 발표자별 채팅 채널 분리
- **다국어 지원**: 한국어, 영어, 일본어, 중국어 등 다양한 언어 지원
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 최적화된 UI/UX
- **다크 모드**: 시스템 설정 기반 자동 다크 모드 및 수동 전환 지원

## 기술 스택
- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **백엔드**: Supabase (데이터베이스, 인증, 실시간 구독)
- **번역 서비스**: Google Cloud Translation API
- **호스팅**: Supabase Hosting

## 설치 및 실행 방법

### 사전 요구사항
- Node.js (v14 이상)
- npm 또는 yarn

### 설치
1. 저장소 클론
   ```bash
   git clone [저장소 URL]
   cd conference-chat
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 로컬 서버 실행
   ```bash
   npm start
   ```

4. 브라우저에서 접속
   ```
   http://localhost:8080
   ```

## 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
TRANSLATION_API_KEY=your_google_translation_api_key
```

## 데이터베이스 설정
Supabase에서 다음 테이블을 생성하세요:

### comments 테이블
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    speaker_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_generated_id TEXT,
    user_role TEXT,
    language TEXT
);
```

### message_likes 테이블
```sql
CREATE TABLE message_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (message_id, user_email)
);
```

## 배포
Supabase 호스팅을 이용한 배포 방법:

1. Supabase 프로젝트 설정
2. 정적 사이트 호스팅 활성화
3. 빌드 파일 업로드

## 기여 방법
1. 이슈 등록
2. 브랜치 생성
3. 변경사항 커밋
4. 풀 리퀘스트 제출

## 라이센스
이 프로젝트는 비공개 라이센스로 제공됩니다.

## 연락처
- 담당자: [이름]
- 이메일: [이메일]

---

© 2025 현대자동차그룹 시트기술 컨퍼런스. All rights reserved.
