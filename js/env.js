/**
 * 환경 변수 로드 모듈
 * 
 * .env 파일의 환경 변수를 로드하고 전역 변수로 설정합니다.
 * 프로덕션 환경과 개발 환경에서 모두 사용할 수 있도록 합니다.
 */

// 환경 변수 객체
const ENV = {};

/**
 * 개발/로컬 환경에서 환경 변수 가져오기
 * 프로덕션 환경에서는 서버 측에서 환경 변수 제공
 */
function loadEnv() {
  // 환경 변수 기본값 설정 (개발용)
  const defaultEnv = {
    SUPABASE_URL: '',
    SUPABASE_KEY: '',
    TRANSLATION_API_KEY: ''
  };

  try {
    // 브라우저 로컬스토리지에서 개발용 환경 변수 확인 (개발 편의성)
    const devEnvVars = localStorage.getItem('dev_env_vars');
    
    if (devEnvVars) {
      const parsedVars = JSON.parse(devEnvVars);
      
      // 환경 변수 설정
      Object.assign(ENV, parsedVars);
      
      console.log('환경 변수가 로컬스토리지에서 로드되었습니다.');
      return;
    }
  } catch (error) {
    console.error('로컬스토리지에서 환경 변수 로드 중 오류:', error);
  }

  // 서버에서 제공하는 환경 변수 확인 (프로덕션)
  if (window.ENV_VARS) {
    Object.assign(ENV, window.ENV_VARS);
    console.log('환경 변수가 서버에서 로드되었습니다.');
    return;
  }

  // 개발 환경에서는 기본값 사용
  console.warn('환경 변수를 찾을 수 없습니다. 기본값 또는 개발 모드로 실행됩니다.');
  Object.assign(ENV, defaultEnv);
}

// 환경 변수 로드
loadEnv();

// 모듈 내보내기
export default ENV;
