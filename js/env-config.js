/**
 * env-config.js
 * 환경 변수에서 API 키를 로드하는 스크립트
 * 중요: 실제 배포 환경에서는 API 키를 환경 변수로 관리해야 합니다.
 */

// 환경 설정 로드 함수
function loadEnvConfig() {
  try {
    console.log('환경 설정 로드 시작...');
    
    // 기본값 정의
    const defaultConfig = {
      SUPABASE_URL: 'https://dolywnpcrutdxuxkozae.supabase.co',
      SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
      TRANSLATION_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs'
    };
    
    // 프로세스 환경 변수가 존재하는 경우 (Node.js 환경)
    if (typeof process !== 'undefined' && process.env) {
      console.log('Node.js 환경에서 환경 변수 로드 시도...');
      return {
        SUPABASE_URL: process.env.SUPABASE_URL || defaultConfig.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY || defaultConfig.SUPABASE_KEY,
        TRANSLATION_API_KEY: process.env.TRANSLATION_API_KEY || defaultConfig.TRANSLATION_API_KEY
      };
    }
    
    // 다른 방법으로 환경 변수를 참조할 수 있는지 확인
    // 예: Netlify 환경 변수
    if (typeof window !== 'undefined' && window.ENV) {
      console.log('브라우저 환경에서 window.ENV 사용 시도...');
      return {
        SUPABASE_URL: window.ENV.SUPABASE_URL || defaultConfig.SUPABASE_URL,
        SUPABASE_KEY: window.ENV.SUPABASE_KEY || defaultConfig.SUPABASE_KEY,
        TRANSLATION_API_KEY: window.ENV.TRANSLATION_API_KEY || defaultConfig.TRANSLATION_API_KEY
      };
    }
    
    // localStorage에서 값 확인 시도 (개발 환경용)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedConfig = window.localStorage.getItem('env_config');
        if (storedConfig) {
          console.log('localStorage에서 환경 설정 로드 시도...');
          const parsedConfig = JSON.parse(storedConfig);
          return {
            SUPABASE_URL: parsedConfig.SUPABASE_URL || defaultConfig.SUPABASE_URL,
            SUPABASE_KEY: parsedConfig.SUPABASE_KEY || defaultConfig.SUPABASE_KEY,
            TRANSLATION_API_KEY: parsedConfig.TRANSLATION_API_KEY || defaultConfig.TRANSLATION_API_KEY
          };
        }
      } catch (storageError) {
        console.warn('localStorage에서 환경 설정 로드 실패:', storageError);
      }
    }
    
    // 기본값 사용
    console.log('기본 환경 설정 사용');
    return defaultConfig;
  } catch (error) {
    console.error('환경 설정 로드 오류:', error);
    // 안전하게 기본값 반환
    return {
      SUPABASE_URL: 'https://dolywnpcrutdxuxkozae.supabase.co',
      SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8',
      TRANSLATION_API_KEY: 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs'
    };
  } finally {
    console.log('환경 설정 로드 완료');
  }
}

// 전역 env_config 객체 설정
window.ENV_CONFIG = loadEnvConfig();

// 환경 설정이 로드되었음을 알리는 이벤트 발생
if (typeof window !== 'undefined' && window.document) {
  window.dispatchEvent(new CustomEvent('env-config-loaded', { detail: window.ENV_CONFIG }));
}

// 보안 알림: 실제 운영 환경에서는 API 키를 이 파일에 하드코딩하지 마세요.
// GitHub Secrets 또는 환경 변수 등을 사용하여 관리하는 것이 좋습니다.
