// js/services/userService.js
(function() {
  'use strict';
  
  /**
   * 사용자 서비스 모듈 - 사용자 관리 및 인증
   * 
   * 설명: 이 모듈은 사용자 관리 기능을 제공합니다.
   * 사용자 생성, 정보 관리, 설정 저장 등의 기능을 포함합니다.
   */
  
  // 설정 불러오기
  const config = window.appConfig;
  
  // 디버그 로깅
  function debug(...args) {
    if (config.isDebugMode()) {
      console.log('[User Service]', ...args);
    }
  }
  
  // 현재 사용자 정보
  let currentUser = null;
  
  /**
   * 사용자 ID 생성
   * @param {string} username - 사용자 이름
   * @returns {string} 생성된 ID
   */
  function generateUserId(username) {
    // 관리자 확인
    if (username === config.getAppConfig().adminId) {
      return config.getAppConfig().adminId;
    }
    
    // 일반 사용자 ID 생성
    return 'user_' + Date.now().toString(16) + Math.random().toString(16).substr(2, 8);
  }
  
  /**
   * 사용자 생성 또는 로그인
   * @param {string} username - 사용자 이름
   * @param {string} language - 선호 언어
   * @param {string} roomId - 채팅방 ID
   * @returns {Promise<Object>} 사용자 정보
   */
  async function createUser(username, language, roomId) {
    if (!username) {
      throw new Error('사용자 이름은 필수입니다.');
    }
    
    const userId = generateUserId(username);
    
    // 사용자 데이터 생성
    const userData = {
      id: userId,
      username: username,
      preferred_language: language,
      created_at: new Date().toISOString()
    };
    
    try {
      // Supabase에 사용자 저장 시도
      const result = await window.dbService.createUser(userData);
      
      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('chat_current_user', JSON.stringify(userData));
      localStorage.setItem('preferred_language', language);
      
      // 현재 사용자 설정
      currentUser = {
        ...userData,
        roomId
      };
      
      debug('사용자 생성 완료:', currentUser);
      
      return {
        ...result,
        user: currentUser
      };
    } catch (error) {
      debug('사용자 생성 오류:', error);
      
      // 오류 발생 시 로컬에만 저장
      localStorage.setItem('chat_current_user', JSON.stringify(userData));
      localStorage.setItem('preferred_language', language);
      
      // 현재 사용자 설정
      currentUser = {
        ...userData,
        roomId
      };
      
      return {
        data: userData,
        error,
        local: true,
        user: currentUser
      };
    }
  }
  
  /**
   * 세션 복원 (로그인 상태 유지)
   * @returns {Object|null} 복원된 사용자 정보 또는 null
   */
  function restoreSession() {
    if (currentUser) {
      return currentUser;
    }
    
    try {
      const savedUser = localStorage.getItem('chat_current_user');
      const savedLanguage = localStorage.getItem('preferred_language');
      
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        // 언어 정보 업데이트
        if (savedLanguage && savedLanguage !== currentUser.preferred_language) {
          currentUser.preferred_language = savedLanguage;
        }
        
        debug('세션 복원 완료:', currentUser);
        return currentUser;
      }
    } catch (error) {
      debug('세션 복원 오류:', error);
      localStorage.removeItem('chat_current_user');
    }
    
    return null;
  }
  
  /**
   * 선호 언어 업데이트
   * @param {string} language - 새 언어 설정
   * @returns {Object} 업데이트된 사용자 정보
   */
  function updateLanguage(language) {
    if (!currentUser) {
      throw new Error('로그인된 사용자가 없습니다.');
    }
    
    // 현재 사용자 정보 업데이트
    currentUser.preferred_language = language;
    
    // 로컬 스토리지 업데이트
    localStorage.setItem('preferred_language', language);
    localStorage.setItem('chat_current_user', JSON.stringify(currentUser));
    
    debug('언어 업데이트 완료:', language);
    
    return currentUser;
  }
  
  /**
   * 로그아웃
   */
  function logout() {
    // 현재 사용자 정보 삭제
    currentUser = null;
    
    // 세션 스토리지 정리
    localStorage.removeItem('chat_current_user');
    
    debug('로그아웃 완료');
  }
  
  /**
   * 현재 사용자 확인
   * @returns {Object|null} 현재 사용자 정보
   */
  function getCurrentUser() {
    return currentUser;
  }
  
  /**
   * 관리자 여부 확인
   * @returns {boolean} 관리자 여부
   */
  function isAdmin() {
    if (!currentUser) {
      return false;
    }
    
    return config.isAdmin(currentUser.id);
  }
  
  // 공개 API
  window.userService = {
    createUser,
    restoreSession,
    updateLanguage,
    logout,
    getCurrentUser,
    isAdmin
  };
})();