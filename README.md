# 컨퍼런스 다국어 채팅 애플리케이션

프리미엄급 UX/UI를 갖춘 모바일 최적화 컨퍼런스용 다국어 실시간 채팅 애플리케이션입니다. 진행자와 참가자 역할을 구분하고, 실시간 언어 번역을 지원하여 다양한 언어를 사용하는 참가자들 간의 원활한 소통을 가능하게 합니다.

![컨퍼런스 채팅 애플리케이션](./assets/images/app-preview.png)

## 주요 기능

### 역할 기반 시스템
- **참가자/진행자 역할 구분**: 사용자는 참가자 또는 진행자 역할을 선택할 수 있습니다.
- **진행자 인증**: 진행자는 비밀번호(9881)를 통해 인증됩니다.
- **역할별 차별화된 UI**: 진행자의 메시지는 특별한 스타일로 표시됩니다.
- **진행자 권한**: 공지사항 등록, 참가자 강퇴 등 진행자 전용 기능 제공.

### 다국어 실시간 번역
- **다양한 언어 지원**: 한국어, 영어, 일본어, 중국어, 힌디어, 텔루구어 지원.
- **자동 언어 감지**: 메시지 작성 시 언어를 자동으로 감지합니다.
- **실시간 번역**: 사용자의 선호 언어로 자동 번역되어 표시됩니다.
- **번역 캐싱**: 동일한 내용의 중복 번역을 방지하여 성능을 최적화합니다.

### 프리미엄급 UX/UI
- **세련된 디자인 시스템**: 고급스러운 색상 팔레트, 타이포그래피, 여백 시스템 적용.
- **부드러운 애니메이션**: 화면 전환 및 요소 등장 시 자연스러운 애니메이션 적용.
- **마이크로 인터랙션**: 버튼 클릭, 메시지 전송 등에 섬세한 피드백 제공.
- **다크 모드 지원**: 사용자 환경에 맞는 라이트/다크 테마 전환 가능.

### 기타 기능
- **메시지 알림**: 새 메시지 및 공지사항 알림 기능.
- **자동 스크롤**: 새 메시지가 오면 스크롤이 자동으로 이동합니다.
- **날짜 구분선**: 날짜 별로 메시지를 구분하여 표시합니다.
- **접근성 지원**: 키보드 네비게이션 및 모션 축소 환경 설정 지원.

## 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript(ES6+)
- **백엔드**: Supabase (실시간 데이터베이스)
- **번역 API**: Google Cloud Translation API
- **디자인 시스템**: 커스텀 디자인 시스템

## 프로젝트 구조

```
conference-chat/
├── index.html                      # 메인 HTML 파일
├── css/
│   ├── styles.css                  # 메인 스타일시트 (임포트)
│   ├── design-system.css           # 디자인 시스템
│   ├── animations.css              # 애니메이션 스타일
│   ├── components.css              # 컴포넌트 스타일
│   ├── layout.css                  # 레이아웃 구조
│   ├── chat-screens.css            # 화면별 스타일
│   ├── messages.css                # 메시지 관련 스타일
│   └── utilities.css               # 유틸리티 클래스
├── js/
│   ├── app.js                      # 애플리케이션 메인 로직
│   ├── auth.js                     # 인증 관련 기능
│   ├── database.js                 # Supabase 연동
│   ├── translation.js              # 번역 기능
│   ├── ui-controller.js            # UI 제어 기능
│   └── animations.js               # 애니메이션 제어
├── assets/
│   └── images/                     # 이미지 리소스
└── project_plan.md                 # 프로젝트 계획 문서
```

## 설치 및 설정

### 필수 요구사항
- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge 등)
- Supabase 계정
- Google Cloud Translation API 키

### 설정 방법

1. 프로젝트를 클론합니다.
```bash
git clone https://github.com/yourusername/conference-chat.git
cd conference-chat
```

2. Supabase 프로젝트를 생성하고 다음 테이블을 설정합니다.
```sql
-- 메시지 테이블
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL,
    is_moderator BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 강퇴된 사용자 테이블
CREATE TABLE kicked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    kicked_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (room_id, user_id)
);
```

3. `js/database.js` 파일에 Supabase URL과 API 키를 설정합니다.
```javascript
this.supabaseUrl = 'YOUR_SUPABASE_URL';
this.supabaseKey = 'YOUR_SUPABASE_API_KEY';
```

4. `js/translation.js` 파일에 Google Cloud Translation API 키를 설정합니다.
```javascript
this.apiKey = 'YOUR_GOOGLE_TRANSLATION_API_KEY';
```

5. 웹 서버를 사용하여 프로젝트를 호스팅하세요. 간단한 로컬 서버를 시작하려면:
```bash
# Python을 사용하는 경우
python -m http.server 8000

# Node.js를 사용하는 경우
npx serve
```

6. 브라우저에서 `http://localhost:8000`으로 접속하여 애플리케이션을 사용하세요.

## 사용 방법

### 참가자로 참여하기
1. 시작 화면에서 '참가자' 역할을 선택합니다.
2. 이름, 이메일, 선호 언어를 입력하고 '채팅 참여' 버튼을 클릭합니다.
3. 채팅 화면에서 메시지를 작성하고 전송 버튼을 누릅니다.

### 진행자로 참여하기
1. 시작 화면에서 '진행자' 역할을 선택합니다.
2. 비밀번호 '9881'을 입력하여 인증합니다.
3. 이름, 이메일, 선호 언어를 입력하고 '채팅 참여' 버튼을 클릭합니다.
4. 채팅 화면 상단의 설정 버튼을 클릭하여 진행자 도구에 접근할 수 있습니다.

## 프로젝트 참여 및 기여

버그 신고, 기능 요청, 개선 제안 등은 이슈 트래커를 통해 제출해 주세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 제작자

- ChatKorea Team (contact@chatkorea.com)
