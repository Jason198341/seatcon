# 공지사항 기능 가이드

이 문서는 프리미엄 컨퍼런스 채팅 시스템의 공지사항 기능 사용법을 설명합니다.

## 개요

공지사항 기능은 컨퍼런스 관리자가 모든 참가자에게 중요한 정보를 효과적으로 전달할 수 있는 도구입니다. 공지사항은 특별한 스타일로 표시되어 일반 메시지와 구분되며, 모든 사용자의 채팅 화면 중앙에 강조되어 나타납니다.

## 기능 특징

- **관리자 전용 기능**: 관리자 권한이 있는 사용자만 공지사항을 전송할 수 있습니다.
- **시각적 강조**: 공지사항은 특별한 아이콘과 스타일로 표시되어 쉽게 구분할 수 있습니다.
- **자동 번역**: 공지사항도 일반 메시지와 마찬가지로 사용자의 선호 언어로 자동 번역됩니다.
- **중앙 정렬**: 일반 메시지와 달리 화면 중앙에 표시되어 쉽게 확인할 수 있습니다.
- **전용 데이터베이스 필드**: 공지사항은 데이터베이스에 특별한 플래그로 저장되어 관리가 용이합니다.

## 사용 방법

### 1. 관리자로 로그인하기

공지사항을 전송하려면 먼저 관리자 권한으로 로그인해야 합니다:

1. 로그인 화면에서 이름, 이메일을 입력합니다.
2. 역할 드롭다운에서 '관리자'를 선택합니다.
3. 관리자 비밀번호를 입력합니다 (기본값: '9881', `config.js`에서 변경 가능).
4. '입장하기' 버튼을 클릭합니다.

### 2. 공지사항 전송하기

관리자로 로그인한 후에는 다음과 같이 공지사항을 전송할 수 있습니다:

1. 일반 메시지와 동일하게 메시지 입력창에 내용을 입력합니다.
2. '전송' 버튼을 클릭합니다.
3. 시스템이 자동으로 내용을 공지사항 형식으로 변환하여 전송합니다.

### 3. 공지사항 표시 확인하기

전송된 공지사항은 다음과 같은 형태로 표시됩니다:

- 특별한 배경색 (연한 주황색)
- 왼쪽 테두리 강조 (주황색)
- 확성기 아이콘
- 화면 중앙 정렬
- "관리자" 역할 배지
- "(공지사항)" 표시

## 기술적 구현

### 공지사항 데이터 구조

공지사항은 데이터베이스에서 다음과 같은 구조로 저장됩니다:

```sql
-- comments 테이블 내 필드
is_announcement BOOLEAN DEFAULT FALSE
```

이 필드는 일반 메시지와 공지사항을 구분하는 데 사용됩니다.

### 공지사항 전송 로직

공지사항 전송은 다음과 같은 단계로 처리됩니다:

1. 관리자 권한 확인
2. 메시지 내용 유효성 검사
3. 공지사항 접두사 추가 (`📢 [공지]`)
4. Supabase에 메시지 전송 (is_announcement = true)
5. 실시간 구독을 통해 모든 사용자에게 전달

### 프론트엔드 표시 로직

공지사항 메시지 표시는 다음과 같이 처리됩니다:

1. 메시지 객체의 `is_announcement` 속성 또는 내용에 접두사 확인
2. 공지사항 템플릿 적용
3. 특별한 스타일 클래스 추가
4. 메시지 컨테이너에 중앙 정렬되도록 삽입

## 코드 예시

### 공지사항 전송 메서드

```javascript
/**
 * 관리자 공지사항 메시지 전송
 * @param {string} content - 메시지 내용
 * @returns {Promise<Object|null>} - 전송된 메시지 또는 null
 */
async function sendAnnouncement(content) {
    try {
        if (!this.userService.isAdmin()) {
            this.logger.warn('관리자만 공지사항을 보낼 수 있습니다.');
            throw new Error('관리자 권한이 필요합니다.');
        }
        
        if (!content.trim()) {
            this.logger.warn('빈 공지사항은 전송할 수 없습니다.');
            return null;
        }
        
        // 공지사항 접두사 추가
        const announcementContent = `${this.config.ADMIN.ANNOUNCEMENT_PREFIX} ${content}`;
        
        // Supabase 클라이언트를 통해 공지사항 전송
        const message = await this.supabaseClient.sendAnnouncement(announcementContent);
        
        // ... 메시지 처리 로직 ...
        
        return message;
    } catch (error) {
        this.logger.error('공지사항 전송 중 오류 발생:', error);
        throw error;
    }
}
```

### 공지사항 템플릿

```html
<!-- 공지사항 메시지 템플릿 -->
<div class="message-header">
    <span class="announcement-icon"><i class="fas fa-bullhorn"></i></span>
    <span class="sender"></span>
    <span class="role-badge admin">관리자</span>
    <span class="time"></span>
</div>
<div class="message-content"></div>
<div class="message-footer">
    <div class="translation-info hidden">
        <span class="translation-toggle">원문 보기</span>
        <span class="translation-language"></span>
    </div>
    <div class="message-actions">
        <div class="like-button">
            <i class="far fa-heart"></i>
            <span class="like-count"></span>
        </div>
    </div>
</div>
```

### 공지사항 CSS 스타일

```css
/* 공지사항 메시지 스타일 */
.message.announcement {
    background-color: rgba(255, 152, 0, 0.1);
    border-left: 4px solid #ff9800;
    align-self: center;
    max-width: 90%;
    width: 90%;
    box-shadow: var(--shadow-md);
    margin: var(--spacing-6) 0;
}

.message.announcement::after {
    display: none; /* 말풍선 화살표 제거 */
}

.message.announcement .message-header {
    color: var(--neutral-800);
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 152, 0, 0.3);
    padding-bottom: var(--spacing-2);
    margin-bottom: var(--spacing-3);
}

.message.announcement .announcement-icon {
    color: #ff9800;
    margin-right: var(--spacing-2);
    font-size: 1.1rem;
}

.message.announcement .message-content {
    font-weight: 500;
    color: var(--neutral-900);
    padding: var(--spacing-1) 0;
}
```

## 데이터베이스 마이그레이션

공지사항 기능을 위한 데이터베이스 마이그레이션 스크립트:

```sql
-- 2025-05-04: 공지사항 기능 추가를 위한 마이그레이션 스크립트

-- comments 테이블에 is_announcement 컬럼 추가
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE;

-- 기존 데이터에서 공지사항으로 처리할 메시지 업데이트 (관리자 메시지 중 "[공지]"가 포함된 메시지)
UPDATE comments 
SET is_announcement = TRUE 
WHERE 
  user_role = 'admin' AND 
  content LIKE '%📢 [공지]%';

-- 인덱스 추가로 공지사항 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_comments_is_announcement ON comments (is_announcement) WHERE is_announcement = TRUE;

-- 공지사항 조회를 위한 뷰 생성
CREATE OR REPLACE VIEW announcements AS
SELECT 
  id, 
  speaker_id, 
  author_name, 
  author_email, 
  content, 
  created_at, 
  client_generated_id, 
  user_role, 
  language
FROM 
  comments
WHERE 
  is_announcement = TRUE
ORDER BY 
  created_at DESC;
```

## 주의사항 및 제한사항

- 공지사항은 일반 사용자가 전송할 수 없습니다. 관리자 권한이 필요합니다.
- 공지사항이 너무 자주 전송되면 채팅의 흐름을 방해할 수 있으므로 중요한 내용만 전송하는 것이 좋습니다.
- 공지사항 접두사 (`📢 [공지]`)는 `config.js` 파일에서 변경할 수 있지만, 변경 시 마이그레이션 스크립트도 함께 업데이트해야 합니다.
- 관리자 비밀번호는 `config.js` 파일의 `ADMIN.PASSWORD` 속성에서 설정할 수 있습니다.

## 향후 계획

- **공지사항 고정 기능**: 중요 공지사항을 화면 상단에 고정하는 기능
- **공지사항 관리 인터페이스**: 관리자가 공지사항을 관리할 수 있는 전용 인터페이스
- **읽음 확인 기능**: 각 사용자의 공지사항 확인 여부를 추적하는 기능
- **예약 전송 기능**: 공지사항을 특정 시간에 전송하는 예약 기능
