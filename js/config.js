/**
 * config.js
 * 애플리케이션 설정 및 API 키 관리
 */

// 환경 변수 설정이 있으면 사용 (env-config.js에서 로드)
const ENV = window.ENV_CONFIG || {};

// 기본 URL 및 키 정의
const DEFAULT_SUPABASE_URL = 'https://dolywnpcrutdxuxkozae.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8';
const DEFAULT_TRANSLATION_API_KEY = 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs';

const CONFIG = {
    // Supabase 설정
    SUPABASE_URL: ENV.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    SUPABASE_KEY: ENV.SUPABASE_KEY || DEFAULT_SUPABASE_KEY,
    
    // Google Cloud Translation API 설정
    TRANSLATION_API_KEY: ENV.TRANSLATION_API_KEY || DEFAULT_TRANSLATION_API_KEY,
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

// 현재 환경에서 디버그 모드 활성화 확인
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.DEBUG_MODE = true;
}

// 위 설정을 기본으로 사용하고, 하드코딩된 값이 눈에 띄면 예외 처리 공간 이용