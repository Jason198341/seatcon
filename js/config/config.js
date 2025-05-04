/**
 * 애플리케이션 전체 구성 설정
 */
const CONFIG = {
    // Supabase 연결 설정
    SUPABASE: {
        URL: 'https://veudhigojdukbqfgjeyh.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao',
    },
    
    // Google Cloud Translation API 설정
    TRANSLATION: {
        API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs',
        CACHE_EXPIRY: 3600000, // 캐시 만료 시간(ms): 1시간
        SUPPORTED_LANGUAGES: [
            { code: 'ko', name: '한국어' },
            { code: 'en', name: '영어' },
            { code: 'ja', name: '일본어' },
            { code: 'zh', name: '중국어' },
            { code: 'es', name: '스페인어' },
            { code: 'fr', name: '프랑스어' },
            { code: 'de', name: '독일어' },
        ],
        DEFAULT_LANGUAGE: 'ko',
    },
    
    // 채팅 관련 설정
    CHAT: {
        MAX_MESSAGE_LENGTH: 2000,
        MESSAGE_LOAD_LIMIT: 50,
        TYPING_INDICATOR_TIMEOUT: 3000,
        AUTO_TRANSLATION: true,
    },
    
    // UI 관련 설정
    UI: {
        THEME: {
            DEFAULT: 'light',
        },
        TOAST: {
            DURATION: 3000,
            POSITION: 'bottom',
        },
        EMOJI_CATEGORIES: [
            { name: '최근 사용', icon: 'history' },
            { name: '표정', icon: 'smile' },
            { name: '사람', icon: 'user' },
            { name: '자연', icon: 'tree' },
            { name: '음식', icon: 'utensils' },
            { name: '활동', icon: 'running' },
            { name: '여행', icon: 'plane' },
            { name: '사물', icon: 'lightbulb' },
            { name: '기호', icon: 'music' },
            { name: '깃발', icon: 'flag' },
        ],
    },
    
    // 로컬 스토리지 키
    STORAGE: {
        USER_INFO: 'premium-chat-user-info',
        THEME_SETTING: 'premium-chat-theme',
        LANG_PREFERENCE: 'premium-chat-language',
        NOTIFICATION_SETTINGS: 'premium-chat-notifications',
        TRANSLATION_CACHE: 'premium-chat-translation-cache',
        RECENT_EMOJIS: 'premium-chat-recent-emojis',
        FONT_SIZE: 'premium-chat-font-size',
    },
    
    // 개발 모드 설정
    DEBUG: {
        ENABLED: true,
        LOG_LEVEL: 'info', // debug, info, warn, error
    },
    
    // 관리자 설정
    ADMIN: {
        PASSWORD: '9881',
        ANNOUNCEMENT_PREFIX: '📢 [공지]', // 확성기 이모지와 공지 접두사
    },
    
    // 통역사(Interpreter) 설정
    INTERPRETER: {
        PASSWORD: '9882',
    },
};