/**
 * 컨퍼런스 실시간 번역 채팅 시스템 설정 파일
 * 
 * 이 파일은 Supabase 및 Google Cloud Translation API 연결을 위한
 * 설정 정보와 애플리케이션 전반의 설정 값을 정의합니다.
 * 
 * 환경 변수를 통해 API 키를 안전하게 관리합니다.
 */

// 환경 변수에서 설정 가져오기 - 빈 값으로 초기화
let SUPABASE_URL = '';
let SUPABASE_KEY = '';
let TRANSLATION_API_KEY = '';

// 로컬 스토리지 키 상수
const ENV_STORAGE_KEY = 'dev_env_vars';

// 설정 로드 시도
async function loadConfig() {
    try {
        // 1. window.ENV_VARS에서 서버 제공 환경 변수 확인 (프로덕션 환경)
        if (window.ENV_VARS) {
            console.log('서버에서 제공된 환경 변수 사용');
            
            SUPABASE_URL = window.ENV_VARS.SUPABASE_URL || '';
            SUPABASE_KEY = window.ENV_VARS.SUPABASE_KEY || '';
            TRANSLATION_API_KEY = window.ENV_VARS.TRANSLATION_API_KEY || '';
            
            if (CONFIG.isConfigLoaded()) {
                window.dispatchEvent(new CustomEvent('config-loaded'));
                return;
            }
            
            throw new Error('서버 환경 변수가 불완전합니다.');
        }
        
        // 2. 서버 API에서 환경 변수 로드 시도
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
            
            const configData = await response.json();
            
            SUPABASE_URL = configData.SUPABASE_URL || '';
            SUPABASE_KEY = configData.SUPABASE_KEY || '';
            TRANSLATION_API_KEY = configData.TRANSLATION_API_KEY || '';
            
            console.log('서버 API에서 환경 변수 로드 성공');
            
            if (CONFIG.isConfigLoaded()) {
                window.dispatchEvent(new CustomEvent('config-loaded'));
                return;
            }
            
            throw new Error('서버 API 환경 변수가 불완전합니다.');
        } catch (apiError) {
            console.warn('서버 API에서 환경 변수를 로드할 수 없습니다:', apiError.message);
            throw apiError; // 다음 단계로 진행
        }
    } catch (error) {
        console.warn('서버 환경 변수 로드 실패, 로컬 개발 환경 확인 중');
        
        // 3. 로컬 스토리지에서 환경 변수 로드 (개발 환경)
        try {
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname.includes('192.168');
                               
            if (!isLocalhost) {
                throw new Error('로컬호스트 환경이 아닙니다. 서버 환경 변수가 필요합니다.');
            }
            
            const storedEnvVars = localStorage.getItem(ENV_STORAGE_KEY);
            if (!storedEnvVars) {
                throw new Error('로컬 스토리지에 저장된 환경 변수가 없습니다.');
            }
            
            try {
                const parsedVars = JSON.parse(storedEnvVars);
                
                SUPABASE_URL = parsedVars.SUPABASE_URL || '';
                SUPABASE_KEY = parsedVars.SUPABASE_KEY || '';
                TRANSLATION_API_KEY = parsedVars.TRANSLATION_API_KEY || '';
                
                console.log('로컬 스토리지에서 환경 변수 로드 성공');
                
                if (CONFIG.isConfigLoaded()) {
                    window.dispatchEvent(new CustomEvent('config-loaded'));
                    return;
                }
                
                throw new Error('로컬 스토리지 환경 변수가 불완전합니다.');
            } catch (parseError) {
                console.error('환경 변수 파싱 오류:', parseError);
                throw new Error('로컬 스토리지 환경 변수 파싱에 실패했습니다.');
            }
        } catch (localError) {
            console.error('환경 변수 로드 실패:', localError.message);
            
            // 4. 로컬 스토리지 및 서버 로드 모두 실패 - env-setup.html로 리디렉션 제안
            window.dispatchEvent(new CustomEvent('config-load-failed', { 
                detail: { error: localError.message } 
            }));
            
            // API 키 설정 안내 표시 (개발 환경에서만)
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname.includes('192.168');
                               
            if (isLocalhost) {
                console.warn('개발 환경: API 키 설정이 필요합니다.');
                
                // 현재 env-setup.html 페이지가 아닌 경우에만 경고 표시
                if (!window.location.pathname.includes('env-setup.html')) {
                    // API 키 경고 요소가 있으면 표시
                    const apiKeyWarning = document.getElementById('apiKeyWarning');
                    if (apiKeyWarning) {
                        apiKeyWarning.style.display = 'block';
                    }
                    
                    // 5초 후 자동으로 설정 페이지로 리디렉션 (선택적)
                    /*
                    setTimeout(() => {
                        if (confirm('API 키 설정이 필요합니다. 설정 페이지로 이동하시겠습니까?')) {
                            window.location.href = 'env-setup.html';
                        }
                    }, 5000);
                    */
                }
            } else {
                console.error('프로덕션 환경: 서버 측 환경 변수 설정이 필요합니다.');
            }
        }
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
            window.addEventListener('config-load-failed', (event) => {
                reject(new Error(event.detail?.error || '설정을 로드할 수 없습니다.'));
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
