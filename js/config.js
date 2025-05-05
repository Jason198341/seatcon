/**
 * 컨퍼런스 실시간 번역 채팅 시스템 설정 파일
 * 
 * 이 파일은 Supabase 및 Google Cloud Translation API 연결을 위한
 * 설정 정보와 애플리케이션 전반의 설정 값을 정의합니다.
 * 
 * 환경 변수를 통해 API 키를 안전하게 관리합니다.
 */

// 환경 변수에서 설정 가져오기
let SUPABASE_URL = '';
let SUPABASE_KEY = '';
let TRANSLATION_API_KEY = '';

// 설정 로드 시도
async function loadConfig() {
    try {
        // 서버에서 제공하는 API로부터 설정 로드
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('서버 설정을 로드할 수 없습니다.');
        }
        
        const configData = await response.json();
        
        // 설정 값 저장
        SUPABASE_URL = configData.SUPABASE_URL;
        SUPABASE_KEY = configData.SUPABASE_KEY;
        TRANSLATION_API_KEY = configData.TRANSLATION_API_KEY;
        
        console.log('서버에서 환경 변수 로드 성공');
        
        // 이벤트 발생 - 설정 로드 완료 알림
        window.dispatchEvent(new CustomEvent('config-loaded'));
        
    } catch (error) {
        console.error('설정 로드 중 오류 발생:', error);
        console.warn('로컬 개발용 백업 설정을 사용합니다.');
        
        // 로컬 개발 환경을 위한 백업 설정
        // 주의: 실제 배포 시 이 값들은 사용되지 않아야 합니다!
        SUPABASE_URL = 'https://veudhigojdukbqfgjeyh.supabase.co';
        SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao';
        TRANSLATION_API_KEY = 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs';
        
        // 이벤트 발생 - 설정 로드 실패 알림
        window.dispatchEvent(new CustomEvent('config-load-failed'));
    }
}

// 설정 로드 시작
loadConfig();

const CONFIG = {
    // Supabase 설정 - 함수로 제공
    get SUPABASE_URL() {
        return SUPABASE_URL;
    },
    get SUPABASE_KEY() {
        return SUPABASE_KEY;
    },
    
    // Google Cloud Translation API 설정 - 함수로 제공
    get TRANSLATION_API_KEY() {
        return TRANSLATION_API_KEY;
    },
    
    // 애플리케이션 설정
    APP: {
        NAME: '컨퍼런스 실시간 번역 채팅',
        VERSION: '1.0.0',
        COPYRIGHT: '© 2025 Conference Chat System',
        DEBUG_MODE: true, // 개발용, 배포 시 false로 변경
    },
    
    // 설정 로드 상태 확인
    isConfigLoaded: () => {
        return !!SUPABASE_URL && !!SUPABASE_KEY && !!TRANSLATION_API_KEY;
    },
    
    // 설정 로드 완료 대기
    waitForConfig: () => {
        return new Promise((resolve, reject) => {
            if (CONFIG.isConfigLoaded()) {
                resolve();
                return;
            }
            
            // 설정 로드 완료 이벤트 리스너
            window.addEventListener('config-loaded', () => {
                resolve();
            }, { once: true });
            
            // 설정 로드 실패 이벤트 리스너
            window.addEventListener('config-load-failed', () => {
                // 백업 설정이 존재하면 일단 계속 진행
                if (CONFIG.isConfigLoaded()) {
                    console.warn('백업 설정을 사용하여 진행합니다.');
                    resolve();
                } else {
                    reject(new Error('설정을 로드할 수 없습니다.'));
                }
            }, { once: true });
            
            // 타임아웃 - 10초 후에도 로드되지 않으면 실패
            setTimeout(() => {
                if (!CONFIG.isConfigLoaded()) {
                    const error = new Error('설정 로드 시간 초과');
                    console.error(error);
                    reject(error);
                }
            }, 10000);
        });
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
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ko', name: '한국어', flag: '🇰🇷' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
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
        configLoaded: CONFIG.isConfigLoaded(),
        languages: CONFIG.LANGUAGES.map(lang => lang.code),
        roles: CONFIG.USER_ROLES.map(role => role.id)
    });
}

// 글로벌 스코프로 설정 객체 내보내기
export default CONFIG;
