# 공지사항 기능 구현 문서

## 개요
프리미엄 컨퍼런스 채팅 시스템에 관리자용 공지사항 기능을 구현했습니다. 이 기능을 통해 관리자는 채팅방에 중요한 공지사항을 전송하여 모든 참가자에게 중요 정보를 효과적으로 전달할 수 있습니다.

## 구현 내용

### 1. Supabase 클라이언트 확장
- `supabase-client.js` 파일에 `sendAnnouncement` 메서드 추가
- 공지사항 전송 시 권한 검증 및 오류 처리 강화
- 개발 환경에서의 공지사항 테스트 지원

### 2. 채팅 관리자 로직 업데이트
- `chat-manager.js` 파일의 `sendAnnouncement` 메서드 업데이트
- `chat-manager-admin.js` 파일의 `sendAnnouncement` 메서드 업데이트
- Supabase 클라이언트의 공지사항 전송 메서드 활용

### 3. 데이터베이스 스키마 변경
- `comments` 테이블에 `is_announcement` 필드 추가 (Boolean, 기본값: FALSE)
- 관리자가 전송한 공지사항 여부를 데이터베이스에 저장
- 공지사항 조회 성능 향상을 위한 인덱스 추가

### 4. 마이그레이션 스크립트 작성
- 기존 데이터베이스 테이블에 새 필드 추가를 위한 마이그레이션 스크립트 작성
- 기존 공지사항 콘텐츠 처리를 위한 데이터 업데이트 쿼리 추가
- 공지사항 조회를 위한 뷰 생성

### 5. 문서화
- 프로젝트 계획 업데이트
- 공지사항 기능 사용 가이드 추가
- 업데이트 로그 업데이트

## 기능 상세 설명

### 공지사항 전송 방식
공지사항 메시지는 일반 메시지와 다음과 같은 차이점이 있습니다:

1. **권한 제한**: 관리자 역할(role: 'admin')을 가진 사용자만 전송 가능
2. **특별 마킹**: 데이터베이스에 `is_announcement: true`로 저장
3. **시각적 구분**: 공지사항 메시지는 일반 메시지와 다른 스타일로 표시
4. **접두사 추가**: 자동으로 "📢 [공지]" 접두사 추가

### 데이터베이스 변경 사항
```sql
-- comments 테이블에 is_announcement 컬럼 추가
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE;

-- 인덱스 추가로 공지사항 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_comments_is_announcement ON comments (is_announcement) WHERE is_announcement = TRUE;
```

### Supabase 클라이언트 확장
```javascript
/**
 * 공지사항 메시지 전송
 * @param {string} content - 공지사항 내용
 * @returns {Promise<Object|null>} - 생성된 공지사항 메시지 데이터 또는 null
 */
async sendAnnouncement(content) {
    if (!this.currentUser || !content.trim()) {
        this.logger.warn('공지사항을 보낼 수 없음: 사용자 정보 없음 또는 빈 메시지');
        return null;
    }
    
    // 관리자 권한 확인
    if (this.currentUser.role !== 'admin') {
        this.logger.warn('권한 없음: 관리자만 공지사항을 전송할 수 있습니다.');
        return null;
    }
    
    const clientGeneratedId = Date.now().toString();
    
    try {
        // Supabase 연결 상태 확인
        if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
            throw new Error('Supabase 연결이 끊어졌습니다.');
        }
        
        // 디버그 로그 추가
        this.logger.debug('전송 시도 중인 공지사항:', content);
        this.logger.debug('현재 사용자 정보:', this.currentUser);
        
        const { data, error } = await this.supabase
            .from('comments')
            .insert([
                {
                    speaker_id: 'global-chat',
                    author_name: this.currentUser.name,
                    author_email: this.currentUser.email,
                    content: content,
                    client_generated_id: clientGeneratedId,
                    user_role: this.currentUser.role,
                    language: this.currentUser.language,
                    is_announcement: true
                }
            ])
            .select();
            
        if (error) {
            this.logger.error('Supabase 오류:', error);
            throw error;
        }
        
        this.logger.info('공지사항 전송 완료:', data[0]);
        return data[0];
    } catch (error) {
        // 오류 처리 로직...
    }
}
```

## 사용 방법

### 관리자 공지사항 전송 방법
1. 관리자 계정으로 로그인 (비밀번호: 9881)
2. 채팅 인터페이스에서 공지사항 전송 버튼 클릭
3. 공지사항 내용 작성 후 전송
4. 공지사항이 모든 참가자에게 전송됨

### 공지사항 표시 방식
- 공지사항은 일반 메시지와 구분되는 스타일로 표시
- "📢 [공지]" 접두사로 공지사항임을 명확히 표시
- 공지사항은 해당 언어 설정에 맞게 자동 번역됨

## 추가 개선 사항
향후 공지사항 기능에 대한 다음과 같은 개선을 고려할 수 있습니다:

1. **공지사항 고정**: 중요 공지사항을 채팅방 상단에 고정하는 기능
2. **공지사항 알림**: 새 공지사항 발행 시 사용자에게 알림 전송
3. **공지사항 중요도**: 여러 수준의 중요도를 설정할 수 있는 옵션 추가
4. **공지사항 예약**: 특정 시간에 자동으로 공지사항이 발송되는 기능
5. **공지사항 관리**: 관리자 패널에서 공지사항을 관리할 수 있는 인터페이스
