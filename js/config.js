/**
 * config.js
 * 애플리케이션 설정 및 API 키 관리
 */

// 즉시 실행 함수를 사용하여 설정 객체 생성
window.CONFIG = (function() {
    // 기본 URL 및 키 정의
    const DEFAULT_CONFIG = {
        // Supabase 설정
        SUPABASE_URL: 'https://dolywnpcrutdxuxkozae.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
        
        // Google Cloud Translation API 설정
        TRANSLATION_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs',
        TRANSLATION_API_URL: 'https://translation.googleapis.com/language/translate/v2',
        
        // 관리자 계정 정보
        ADMIN_ID: 'kcmmer',
        ADMIN_PASSWORD: 'rnrud9881@@HH',
        
        // 지원 언어
        SUPPORTED_LANGUAGES: [
            { code: 'ko', name: '한국어' },
            { code: 'en', name: '영어' },
            { code: 'ja', name: '일본어' },
            { code: 'zh', name: '중국어' }
        ],
        
        // 기본 채팅방 정보
        DEFAULT_CHATROOM: {
            id: 'default-room',
            name: 'General Chat',
            description: 'Default chat room',
            is_private: false,
            is_active: true,
            max_users: 100,
            sort_order: 0
        },
        
        // 시스템 설정
        DEBUG_MODE: false,  // 기본적으로 디버그 모드 해제
        OFFLINE_SUPPORT: true, // 오프라인 모드 지원 활성화
        RECONNECT_ATTEMPTS: 5,  // 재연결 시도 횟수
    };
    
    try {
        console.log('애플리케이션 설정 로드 시작...');
        
        // ENV_CONFIG가 존재하는지 확인 (env-config.js에서 로드)
        const ENV = window.ENV_CONFIG || {};
        console.log('ENV_CONFIG 확인:', ENV);
        
        // 기본 설정과 환경 설정 병합
        const config = Object.assign({}, DEFAULT_CONFIG, {
            SUPABASE_URL: ENV.SUPABASE_URL || DEFAULT_CONFIG.SUPABASE_URL,
            SUPABASE_KEY: ENV.SUPABASE_KEY || DEFAULT_CONFIG.SUPABASE_KEY,
            TRANSLATION_API_KEY: ENV.TRANSLATION_API_KEY || DEFAULT_CONFIG.TRANSLATION_API_KEY
        });
        
        // 현재 환경에서 디버그 모드 활성화 확인
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            config.DEBUG_MODE = true;
            console.log('개발 환경에서 디버그 모드 활성화됨');
        }
        
        console.log('애플리케이션 설정 로드 완료');
        return config;
    } catch (error) {
        console.error('애플리케이션 설정 로드 오류:', error);
        
        // 오류 발생 시 기본 설정 반환
        return DEFAULT_CONFIG;
    }
})();

// 디버그 모드인 경우에만 콘솔에 설정 로깅
if (window.CONFIG.DEBUG_MODE) {
    console.log('애플리케이션 설정:', {
        SUPABASE_URL: window.CONFIG.SUPABASE_URL,
        DEBUG_MODE: window.CONFIG.DEBUG_MODE,
        OFFLINE_SUPPORT: window.CONFIG.OFFLINE_SUPPORT,
        SUPPORTED_LANGUAGES: window.CONFIG.SUPPORTED_LANGUAGES.map(lang => lang.code)
    });
}

// 환경 설정 로드 이벤트 발생
window.dispatchEvent(new CustomEvent('config-loaded', { detail: window.CONFIG }));
