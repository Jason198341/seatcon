/**
 * 컨퍼런스 실시간 번역 채팅 시스템 설정 파일
 * 
 * 이 파일은 Supabase 및 Google Cloud Translation API 연결을 위한
 * 설정 정보와 애플리케이션 전반의 설정 값을 정의합니다.
 * 
 * 주의: 실제 배포 시에는 API 키를 환경 변수로 관리하는 것이 안전합니다.
 */

const CONFIG = {
    // Supabase 설정
    SUPABASE_URL: 'https://veudhigojdukbqfgjeyh.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao',
    
    // Google Cloud Translation API 설정
    TRANSLATION_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs',
    
    // 애플리케이션 설정
    APP: {
        NAME: '컨퍼런스 실시간 번역 채팅',
        VERSION: '1.0.0',
        COPYRIGHT: '© 2025 Conference Chat System',
        DEBUG_MODE: true, // 개발용, 배포 시 false로 변경
    },
    
    // 채팅 설정
    CHAT: {
        MAX_MESSAGE_LENGTH: 1000, // 최대 메시지 길이
        HISTORY_LOAD_COUNT: 50, // 초기 로드 메시지 수
        TRANSLATION_CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 번역 캐시 만료 시간 (24시간)
        MESSAGE_THROTTLE: 500, // 메시지 전송 제한 시간 (밀리초)
    },
    
    // 지원 언어 설정
    LANGUAGES: [
        { code: 'ko', name: '한국어', flag: '🇰🇷' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        // 필요에 따라 더 많은 언어 추가 가능
    ],
    
    // 사용자 역할 설정
    USER_ROLES: [
        { id: 'attendee', name: '참가자', color: '#3498db' },
        { id: 'speaker', name: '발표자', color: '#e74c3c' },
        { id: 'staff', name: '스태프', color: '#2ecc71' },
        { id: 'organizer', name: '진행자', color: '#f39c12' },
        { id: 'translator', name: '통역사', color: '#9b59b6' },
    ],
    
    // 테마 설정
    THEMES: {
        LIGHT: {
            primary: '#4361ee',
            secondary: '#3f37c9',
            background: '#f8f9fa',
            text: '#212529',
            border: '#dee2e6',
        },
        DARK: {
            primary: '#4cc9f0',
            secondary: '#4895ef',
            background: '#212529',
            text: '#f8f9fa',
            border: '#495057',
        }
    }
};

// Debug 모드일 때만 콘솔에 설정 정보 출력
if (CONFIG.APP.DEBUG_MODE) {
    console.log('Application config loaded:', {
        app: CONFIG.APP,
        supabaseUrl: CONFIG.SUPABASE_URL,
        languages: CONFIG.LANGUAGES.map(lang => lang.code),
        roles: CONFIG.USER_ROLES.map(role => role.id)
    });
}

// 글로벌 스코프로 설정 객체 내보내기
export default CONFIG;
