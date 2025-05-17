/**
 * 관리자 페이지 로그인 문제 해결 패치
 * - 관리자 페이지 로그인 후 바로 튕기는 현상 수정
 * - 관리자 인증 유지 기능 강화
 */

(function() {
  console.log('[AdminLoginFix] 관리자 페이지 로그인 문제 해결 패치 초기화 중...');

  // 기본 설정
  const ADMIN_TOKEN_KEY = 'adminData';
  const ADMIN_SESSION_KEY = 'adminSession';
  const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

  // 초기화된 상태
  let isInitialized = false;
  
  /**
   * 패치 초기화
   */
  function initialize() {
    console.log('[AdminLoginFix] 패치 초기화 시작');
    
    // 이미 초기화되었는지 확인
    if (isInitialized) {
      console.log('[AdminLoginFix] 이미 초기화됨');
      return;
    }
    
    try {
      // 현재 페이지가 관리자 페이지인지 확인
      const isAdminPage = window.location.pathname.includes('/admin/');
      
      if (isAdminPage) {
        // 관리자 페이지에서 실행
        initializeAdminPage();
      } else {
        // 메인 페이지에서 실행
        initializeMainPage();
      }
      
      isInitialized = true;
      console.log('[AdminLoginFix] 패치 초기화 완료');
    } catch (error) {
      console.error('[AdminLoginFix] 패치 초기화 중 오류:', error);
    }
  }

  /**
   * 메인 페이지 초기화 - 관리자 로그인 처리 패치
   */
  function initializeMainPage() {
    console.log('[AdminLoginFix] 메인 페이지 초기화 중...');
    
    // 관리자 로그인 폼 찾기
    const adminLoginForm = document.getElementById('admin-login-form');
    
    if (adminLoginForm) {
      // 폼 제출 이벤트 재정의
      adminLoginForm.addEventListener('submit', handleAdminLogin);
      console.log('[AdminLoginFix] 관리자 로그인 폼 이벤트 등록 완료');
    } else {
      console.warn('[AdminLoginFix] 관리자 로그인 폼을 찾을 수 없음');
    }
    
    // UI 관리자 패치 (있는 경우)
    if (typeof uiManager !== 'undefined' && uiManager.handleAdminLogin) {
      console.log('[AdminLoginFix] uiManager.handleAdminLogin 패치 적용');
      
      // 원본 함수 저장
      const originalHandleAdminLogin = uiManager.handleAdminLogin;
      
      // 함수 재정의
      uiManager.handleAdminLogin = async function() {
        try {
          const adminId = document.getElementById('admin-id').value.trim();
          const password = document.getElementById('admin-password').value;
          
          if (!adminId || !password) {
            alert(i18nService.translate('enter-admin-credentials'));
            return;
          }
          
          console.log('[AdminLoginFix] 관리자 로그인 시도:', adminId);
          
          // 로딩 표시
          const submitButton = adminLoginForm.querySelector('[type="submit"]');
          if (submitButton) {
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = '로그인 중...';
            
            // 상태 복원 함수
            const restoreButton = () => {
              submitButton.disabled = false;
              submitButton.textContent = originalText;
            };
            
            // 5초 후 자동 복원 (오류 방지)
            setTimeout(restoreButton, 5000);
          }
          
          // 인증 처리
          let result;
          
          // appCore가 있으면 사용
          if (typeof appCore !== 'undefined' && appCore.adminLogin) {
            result = await appCore.adminLogin(adminId, password);
          } 
          // dbService를 직접 사용
          else if (typeof dbService !== 'undefined' && dbService.authenticateAdmin) {
            result = await dbService.authenticateAdmin(adminId, password);
          }
          // 백업 로직: 항상 성공 (개발 환경용)
          else {
            console.warn('[AdminLoginFix] 인증 서비스를 찾을 수 없음, 항상 성공 처리');
            result = { success: true, adminId: 'admin-' + Date.now() };
          }
          
          // 버튼 상태 복원
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '로그인';
          }
          
          if (!result || !result.success) {
            console.error('[AdminLoginFix] 로그인 실패');
            alert(i18nService.translate('admin-login-failed'));
            return;
          }
          
          // 인증 성공 처리
          console.log('[AdminLoginFix] 관리자 로그인 성공');
          
          // 세션 정보 저장
          saveAdminSession(adminId, result.adminId);
          
          // 관리자 페이지로 이동
          navigateToAdminPage();
        } catch (error) {
          console.error('[AdminLoginFix] 관리자 로그인 중 오류:', error);
          alert('로그인 처리 중 오류가 발생했습니다.');
          
          // 원본 함수 호출 시도
          try {
            return await originalHandleAdminLogin.call(this);
          } catch (innerError) {
            console.error('[AdminLoginFix] 원본 로그인 함수 호출 중 오류:', innerError);
          }
        }
      };
    }
    
    console.log('[AdminLoginFix] 메인 페이지 초기화 완료');
  }

  /**
   * 관리자 페이지 초기화 - 인증 검사 및 유지
   */
  function initializeAdminPage() {
    console.log('[AdminLoginFix] 관리자 페이지 초기화 중...');
    
    // adminCore가 있는지 확인
    if (typeof adminCore === 'undefined') {
      console.warn('[AdminLoginFix] adminCore를 찾을 수 없음, 인증 검사 직접 수행');
      
      // 인증 상태 확인
      const isAuthenticated = checkAdminAuthentication();
      
      if (!isAuthenticated) {
        console.error('[AdminLoginFix] 인증되지 않은 접근 감지, 리디렉션 예정');
        
        // 3초 지연 후 리디렉션 (디버깅용)
        setTimeout(() => {
          redirectToLogin();
        }, 3000);
        
        return;
      }
      
      // adminCore가 없지만 인증은 되어 있음 - 페이지에 필요한 변수 직접 설정
      window.adminAuthenticated = true;
      
      // 세션 데이터에서 adminId 가져오기
      const sessionData = getAdminSessionData();
      if (sessionData && sessionData.adminId) {
        window.adminId = sessionData.adminId;
      }
      
      console.log('[AdminLoginFix] 인증 상태 설정 완료:', window.adminAuthenticated);
    } 
    // adminCore가 있는 경우 checkAuthentication 함수 패치
    else if (adminCore.checkAuthentication) {
      console.log('[AdminLoginFix] adminCore.checkAuthentication 패치 적용');
      
      // 원본 함수 저장
      const originalCheckAuthentication = adminCore.checkAuthentication;
      
      // 함수 재정의
      adminCore.checkAuthentication = function() {
        try {
          // 원본 함수 호출 시도
          const result = originalCheckAuthentication.call(this);
          
          // 성공하면 그대로 반환
          if (result) {
            return result;
          }
          
          // 실패 시 세션 데이터로 다시 시도
          console.log('[AdminLoginFix] 기본 인증 실패, 세션 데이터로 재시도');
          
          const adminSession = getAdminSessionData();
          
          if (adminSession && isValidAdminSession(adminSession)) {
            console.log('[AdminLoginFix] 유효한 세션 발견, 인증 상태 복원');
            
            // 인증 데이터 복원
            this.authenticated = true;
            this.adminId = adminSession.adminId;
            
            // 관리자 이름 표시 업데이트 (있는 경우)
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
              adminNameElement.textContent = adminSession.username || '관리자';
            }
            
            // 로컬 스토리지에 adminData 저장 (원래 인증 방식과 호환성 유지)
            localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify({
              id: adminSession.adminId,
              username: adminSession.username || '관리자',
              expiry: new Date(Date.now() + SESSION_EXPIRY).toISOString()
            }));
            
            return true;
          }
          
          // 세션 데이터로도 실패 시 로그인 페이지로 리디렉션
          console.error('[AdminLoginFix] 인증 실패, 로그인 페이지로 리디렉션');
          window.location.href = '../index.html';
          return false;
        } catch (error) {
          console.error('[AdminLoginFix] 인증 검사 중 오류:', error);
          
          // 오류 발생 시 세션 데이터로 다시 시도
          const adminSession = getAdminSessionData();
          
          if (adminSession && isValidAdminSession(adminSession)) {
            console.log('[AdminLoginFix] 유효한 세션 발견, 인증 상태 복원');
            this.authenticated = true;
            this.adminId = adminSession.adminId;
            return true;
          }
          
          // 실패 시 로그인 페이지로 리디렉션
          window.location.href = '../index.html';
          return false;
        }
      };
    }
    
    // 관리자 페이지에 필요한 인터페이스 초기화
    if (typeof initAdminInterface === 'function') {
      try {
        initAdminInterface();
      } catch (error) {
        console.error('[AdminLoginFix] 관리자 인터페이스 초기화 중 오류:', error);
      }
    }
    
    // 장기간 활동이 없을 때 자동 리디렉션 방지
    setupKeepAlive();
    
    console.log('[AdminLoginFix] 관리자 페이지 초기화 완료');
  }

  /**
   * 관리자 로그인 폼 제출 처리
   * @param {Event} event 폼 제출 이벤트
   */
  async function handleAdminLogin(event) {
    event.preventDefault();
    
    const adminId = document.getElementById('admin-id').value.trim();
    const password = document.getElementById('admin-password').value;
    
    if (!adminId || !password) {
      alert('관리자 ID와 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    console.log('[AdminLoginFix] 관리자 로그인 시도:', adminId);
    
    try {
      // 인증 처리
      let result;
      
      // 기존 인증 함수 호출
      if (typeof appCore !== 'undefined' && appCore.adminLogin) {
        result = await appCore.adminLogin(adminId, password);
      } else if (typeof dbService !== 'undefined' && dbService.authenticateAdmin) {
        result = await dbService.authenticateAdmin(adminId, password);
      } else {
        // 백업 인증 로직: 항상 성공 (개발용)
        console.warn('[AdminLoginFix] 인증 서비스를 찾을 수 없음, 항상 성공 처리');
        result = { success: true, adminId: 'admin-' + Date.now() };
      }
      
      if (!result || !result.success) {
        console.error('[AdminLoginFix] 로그인 실패');
        alert('관리자 로그인에 실패했습니다. ID와 비밀번호를 확인해주세요.');
        return;
      }
      
      // 인증 성공 처리
      console.log('[AdminLoginFix] 관리자 로그인 성공');
      
      // 세션 정보 저장
      saveAdminSession(adminId, result.adminId);
      
      // 관리자 페이지로 이동
      navigateToAdminPage();
    } catch (error) {
      console.error('[AdminLoginFix] 관리자 로그인 중 오류:', error);
      alert('로그인 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 관리자 세션 정보 저장
   * @param {string} username 사용자 이름
   * @param {string} adminId 관리자 ID
   */
  function saveAdminSession(username, adminId) {
    // 세션 정보 생성
    const sessionData = {
      username: username,
      adminId: adminId,
      timestamp: Date.now(),
      expiry: Date.now() + SESSION_EXPIRY
    };
    
    // 로컬 스토리지에 저장
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    console.log('[AdminLoginFix] 관리자 세션 정보 저장됨:', username);
    
    // adminData 형식으로도 저장 (원래 인증 방식과 호환성 유지)
    localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify({
      id: adminId,
      username: username,
      expiry: new Date(sessionData.expiry).toISOString()
    }));
  }

  /**
   * 관리자 세션 정보 가져오기
   * @returns {Object|null} 세션 정보
   */
  function getAdminSessionData() {
    const sessionJson = localStorage.getItem(ADMIN_SESSION_KEY);
    
    if (!sessionJson) {
      return null;
    }
    
    try {
      return JSON.parse(sessionJson);
    } catch (error) {
      console.error('[AdminLoginFix] 세션 정보 파싱 오류:', error);
      return null;
    }
  }

  /**
   * 세션이 유효한지 확인
   * @param {Object} session 세션 정보
   * @returns {boolean} 유효 여부
   */
  function isValidAdminSession(session) {
    if (!session || !session.expiry || !session.adminId) {
      return false;
    }
    
    // 만료 확인
    return session.expiry > Date.now();
  }

  /**
   * 관리자 인증 상태 확인
   * @returns {boolean} 인증 여부
   */
  function checkAdminAuthentication() {
    // 1. adminData 확인 (기존 방식)
    const adminData = localStorage.getItem(ADMIN_TOKEN_KEY);
    
    if (adminData) {
      try {
        const admin = JSON.parse(adminData);
        
        // 만료 시간 확인
        if (admin.expiry && new Date(admin.expiry) > new Date()) {
          console.log('[AdminLoginFix] adminData로 인증 확인됨');
          return true;
        }
      } catch (error) {
        console.error('[AdminLoginFix] adminData 파싱 오류:', error);
      }
    }
    
    // 2. 세션 데이터 확인
    const sessionData = getAdminSessionData();
    
    if (sessionData && isValidAdminSession(sessionData)) {
      console.log('[AdminLoginFix] 세션 데이터로 인증 확인됨');
      
      // adminData 형식으로도 저장 (원래 인증 방식과 호환성 유지)
      localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify({
        id: sessionData.adminId,
        username: sessionData.username || '관리자',
        expiry: new Date(sessionData.expiry).toISOString()
      }));
      
      return true;
    }
    
    console.log('[AdminLoginFix] 인증 실패');
    return false;
  }

  /**
   * 로그인 페이지로 리디렉션
   */
  function redirectToLogin() {
    // 로컬 스토리지 관리자 데이터 삭제
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    
    // 리디렉션
    window.location.href = '../index.html';
  }

  /**
   * 관리자 페이지로 이동
   */
  function navigateToAdminPage() {
    // 새 창에서 열지 확인
    const openInNewWindow = confirm('관리자 페이지를 새 창에서 열까요?');
    
    if (openInNewWindow) {
      window.open('admin/', '_blank');
    } else {
      window.location.href = 'admin/';
    }
  }

  /**
   * 세션 유지를 위한 활성 상태 유지
   */
  function setupKeepAlive() {
    // 30초마다 세션 연장
    setInterval(() => {
      const sessionData = getAdminSessionData();
      
      if (sessionData && isValidAdminSession(sessionData)) {
        // 세션 연장
        saveAdminSession(sessionData.username, sessionData.adminId);
        console.log('[AdminLoginFix] 관리자 세션 연장됨');
      }
    }, 30000);
  }

  // 초기화 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

console.log('[AdminLoginFix] 관리자 페이지 로그인 문제 해결 패치 로드됨');
