/**
 * 환경 변수 로드 모듈
 * 
 * 서버 및 로컬 스토리지에서 환경 변수를 로드하고 통합 관리합니다.
 * 프로덕션 환경과 개발 환경에서 모두 사용할 수 있도록 설계되었습니다.
 */

// 환경 변수 객체
const ENV = {};

// 로컬 스토리지 키 상수
const DEV_ENV_STORAGE_KEY = 'dev_env_vars';
const ENV_LEGACY_KEYS = {
  SUPABASE_URL: 'env_supabaseUrl',
  SUPABASE_KEY: 'env_supabaseKey',
  TRANSLATION_API_KEY: 'env_translationApiKey'
};

/**
 * 환경 변수 상태 확인
 * @returns {boolean} 모든 필수 환경 변수가 설정되었는지 여부
 */
function isEnvComplete() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'TRANSLATION_API_KEY'
  ];
  
  return requiredVars.every(key => !!ENV[key]);
}

/**
 * 서버에서 환경 변수 가져오기
 * @returns {Promise<boolean>} 성공 여부
 */
async function loadServerEnv() {
  // window.ENV_VARS 확인 (서버에서 주입)
  if (window.ENV_VARS) {
    Object.assign(ENV, window.ENV_VARS);
    console.log('서버에서 제공된 환경 변수를 로드했습니다.');
    return isEnvComplete();
  }
  
  // 서버 API에서 환경 변수 로드 시도
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }
    
    const configData = await response.json();
    Object.assign(ENV, configData);
    
    console.log('서버 API에서 환경 변수를 로드했습니다.');
    return isEnvComplete();
  } catch (error) {
    console.warn('서버 API에서 환경 변수를 로드할 수 없습니다:', error.message);
    return false;
  }
}

/**
 * 로컬 스토리지에서 환경 변수 가져오기 (개발 환경)
 * @returns {boolean} 성공 여부
 */
function loadLocalStorageEnv() {
  try {
    // 새 형식 확인 (dev_env_vars)
    const storedEnvVars = localStorage.getItem(DEV_ENV_STORAGE_KEY);
    if (storedEnvVars) {
      const parsedVars = JSON.parse(storedEnvVars);
      Object.assign(ENV, parsedVars);
      console.log('로컬 스토리지에서 환경 변수를 로드했습니다.');
      return isEnvComplete();
    }
    
    // 이전 형식 확인 (개별 키)
    const legacyVars = {};
    let hasLegacyVars = false;
    
    for (const [envKey, storageKey] of Object.entries(ENV_LEGACY_KEYS)) {
      const value = localStorage.getItem(storageKey);
      if (value) {
        legacyVars[envKey] = value;
        hasLegacyVars = true;
      }
    }
    
    if (hasLegacyVars) {
      Object.assign(ENV, legacyVars);
      console.log('레거시 형식의 로컬 스토리지 환경 변수를 로드했습니다.');
      
      // 레거시 형식을 새 형식으로 마이그레이션
      localStorage.setItem(DEV_ENV_STORAGE_KEY, JSON.stringify(legacyVars));
      
      // 레거시 키 삭제
      for (const storageKey of Object.values(ENV_LEGACY_KEYS)) {
        localStorage.removeItem(storageKey);
      }
      
      console.log('환경 변수를 새 형식으로 마이그레이션했습니다.');
      
      return isEnvComplete();
    }
    
    return false;
  } catch (error) {
    console.error('로컬 스토리지에서 환경 변수 로드 중 오류:', error);
    return false;
  }
}

/**
 * 환경 변수를 로컬 스토리지에 저장 (개발 환경용)
 * @param {Object} vars 저장할 환경 변수 객체
 */
function saveEnvToLocalStorage(vars) {
  try {
    localStorage.setItem(DEV_ENV_STORAGE_KEY, JSON.stringify(vars));
    console.log('환경 변수가 로컬 스토리지에 저장되었습니다.');
    return true;
  } catch (error) {
    console.error('환경 변수를 로컬 스토리지에 저장하는 중 오류:', error);
    return false;
  }
}

/**
 * 개발/로컬 환경인지 확인
 * @returns {boolean} 로컬 개발 환경 여부
 */
function isLocalDevelopment() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('192.168');
}

/**
 * 환경 변수 로드 (우선순위: 서버 > 로컬 스토리지)
 */
async function loadEnv() {
  // 1. 서버에서 환경 변수 로드 시도
  const serverEnvLoaded = await loadServerEnv();
  
  if (serverEnvLoaded) {
    // 서버에서 성공적으로 로드됨
    window.dispatchEvent(new CustomEvent('env-loaded', { detail: { source: 'server' } }));
    return;
  }
  
  // 2. 로컬 개발 환경에서만 로컬 스토리지 확인
  if (isLocalDevelopment()) {
    const localEnvLoaded = loadLocalStorageEnv();
    
    if (localEnvLoaded) {
      // 로컬 스토리지에서 성공적으로 로드됨
      window.dispatchEvent(new CustomEvent('env-loaded', { detail: { source: 'localStorage' } }));
      return;
    }
    
    console.warn('환경 변수가 설정되지 않았습니다. env-setup.html에서 API 키를 설정하세요.');
    
    // 현재 env-setup.html 페이지가 아닌 경우에만 경고 표시
    if (!window.location.pathname.includes('env-setup.html')) {
      // API 키 경고 요소가 있으면 표시
      const apiKeyWarning = document.getElementById('apiKeyWarning');
      if (apiKeyWarning) {
        apiKeyWarning.style.display = 'block';
      }
    }
  } else {
    console.error('프로덕션 환경: 서버에서 환경 변수를 로드할 수 없습니다.');
  }
  
  // 환경 변수 로드 실패 이벤트 발생
  window.dispatchEvent(new CustomEvent('env-load-failed'));
}

// API - 환경 변수 가져오기
const EnvService = {
  /**
   * 환경 변수 가져오기
   * @param {string} key 환경 변수 키
   * @param {*} defaultValue 기본값 (환경 변수가 없을 경우)
   * @returns {*} 환경 변수 값 또는 기본값
   */
  get: (key, defaultValue = '') => {
    return ENV[key] || defaultValue;
  },
  
  /**
   * 모든 환경 변수 가져오기
   * @returns {Object} 환경 변수 객체 (복사본)
   */
  getAll: () => {
    return { ...ENV };
  },
  
  /**
   * 환경 변수 설정 (개발 환경용)
   * @param {Object} vars 설정할 환경 변수 객체
   * @returns {boolean} 성공 여부
   */
  set: (vars) => {
    if (!isLocalDevelopment()) {
      console.warn('프로덕션 환경에서는 환경 변수를 설정할 수 없습니다.');
      return false;
    }
    
    Object.assign(ENV, vars);
    return saveEnvToLocalStorage(vars);
  },
  
  /**
   * 환경 변수가 모두 설정되었는지 확인
   * @returns {boolean} 완전한 환경 변수 구성 여부
   */
  isComplete: isEnvComplete,
  
  /**
   * 환경 변수 로드 완료 대기
   * @param {number} timeout 타임아웃 (밀리초)
   * @returns {Promise<Object>} 환경 변수 객체
   */
  waitForEnv: (timeout = 10000) => {
    return new Promise((resolve, reject) => {
      if (isEnvComplete()) {
        resolve(ENV);
        return;
      }
      
      // 환경 변수 로드 완료 이벤트 리스너
      window.addEventListener('env-loaded', () => {
        resolve(ENV);
      }, { once: true });
      
      // 환경 변수 로드 실패 이벤트 리스너
      window.addEventListener('env-load-failed', () => {
        reject(new Error('환경 변수를 로드할 수 없습니다.'));
      }, { once: true });
      
      // 타임아웃
      if (timeout > 0) {
        setTimeout(() => {
          if (!isEnvComplete()) {
            reject(new Error('환경 변수 로드 시간 초과'));
          }
        }, timeout);
      }
    });
  },
  
  /**
   * 개발 환경인지 확인
   * @returns {boolean} 개발 환경 여부
   */
  isDev: isLocalDevelopment
};

// 환경 변수 로드 시작
loadEnv();

// 모듈 내보내기
export default EnvService;
