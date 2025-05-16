// js/services/translationService.js
(function() {
  'use strict';
  
  /**
   * 번역 서비스 모듈 - Google Translate API 연동
   * 
   * 설명: 이 모듈은 Google Translate API를 사용한 번역 기능을 제공합니다.
   * API 호출 로직과 오류 처리, 캐싱 메커니즘을 포함합니다.
   */
  
  // 설정 불러오기
  const config = window.appConfig;
  
  // 디버그 로깅
  function debug(...args) {
    if (config.isDebugMode()) {
      console.log('[Translation Service]', ...args);
    }
  }
  
  // 번역 캐시
  const translationCache = {};
  
  /**
   * 캐시 키 생성
   * @param {string} text - 번역할 텍스트
   * @param {string} targetLanguage - 대상 언어
   * @returns {string} 캐시 키
   */
  function createCacheKey(text, targetLanguage) {
    return `${text}_${targetLanguage}`;
  }
  
  /**
   * 번역 캐시 확인
   * @param {string} text - 번역할 텍스트
   * @param {string} targetLanguage - 대상 언어
   * @returns {string|null} 캐시된 번역 또는 null
   */
  function getFromCache(text, targetLanguage) {
    const key = createCacheKey(text, targetLanguage);
    return translationCache[key] || null;
  }
  
  /**
   * 번역 결과 캐시에 저장
   * @param {string} text - 원본 텍스트
   * @param {string} targetLanguage - 대상 언어
   * @param {string} translatedText - 번역된 텍스트
   */
  function saveToCache(text, targetLanguage, translatedText) {
    const key = createCacheKey(text, targetLanguage);
    translationCache[key] = translatedText;
  }
  
  /**
   * 텍스트 번역
   * @param {string} text - 번역할 텍스트
   * @param {string} targetLanguage - 대상 언어
   * @returns {Promise<string>} 번역된 텍스트
   */
  async function translateText(text, targetLanguage) {
    if (!text || text.trim() === '') {
      return text;
    }
    
    // 캐시 확인
    const cachedTranslation = getFromCache(text, targetLanguage);
    if (cachedTranslation) {
      debug('캐시에서 번역 사용:', text.substring(0, 20) + '...');
      return cachedTranslation;
    }
    
    try {
      debug('번역 요청 중...', text.substring(0, 20) + '...', targetLanguage);
      
      const response = await fetch(`${config.getTranslateEndpoint()}?key=${config.getTranslateApiKey()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage
        })
      });
      
      const data = await response.json();
      
      if (data.data && data.data.translations && data.data.translations.length > 0) {
        const translatedText = data.data.translations[0].translatedText;
        
        // 캐시에 저장
        saveToCache(text, targetLanguage, translatedText);
        
        return translatedText;
      }
      
      throw new Error('번역 실패: 응답에 번역 결과가 없습니다.');
    } catch (error) {
      debug('번역 오류:', error);
      return text; // 오류 발생 시 원본 텍스트 반환
    }
  }
  
  /**
   * 메시지 객체 번역
   * @param {Object} message - 번역할 메시지 객체
   * @param {string} targetLanguage - 대상 언어
   * @returns {Promise<Object>} 번역이 추가된 메시지 객체
   */
  async function translateMessage(message, targetLanguage) {
    // 메시지 언어가 대상 언어와 같으면 번역 불필요
    if (message.language === targetLanguage) {
      return {
        ...message,
        translatedMessage: message.message
      };
    }
    
    try {
      // 메시지 내용 번역
      const translatedText = await translateText(message.message, targetLanguage);
      
      return {
        ...message,
        translatedMessage: translatedText
      };
    } catch (error) {
      debug('메시지 번역 오류:', error);
      return {
        ...message,
        translatedMessage: '번역 실패'
      };
    }
  }
  
  /**
   * 언어 감지
   * @param {string} text - 언어를 감지할 텍스트
   * @returns {Promise<string>} 감지된 언어 코드
   */
  async function detectLanguage(text) {
    if (!text || text.trim() === '') {
      return 'en'; // 기본값
    }
    
    try {
      debug('언어 감지 요청 중...', text.substring(0, 20) + '...');
      
      const response = await fetch(`${config.getTranslateEndpoint()}/detect?key=${config.getTranslateApiKey()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });
      
      const data = await response.json();
      
      if (data.data && data.data.detections && data.data.detections.length > 0 && data.data.detections[0].length > 0) {
        const detectedLanguage = data.data.detections[0][0].language;
        debug('감지된 언어:', detectedLanguage);
        return detectedLanguage;
      }
      
      debug('언어 감지 실패, 기본값 사용');
      return 'en'; // 기본값
    } catch (error) {
      debug('언어 감지 오류:', error);
      return 'en'; // 오류 발생 시 기본값
    }
  }
  
  /**
   * 번역 캐시 정리 (메모리 관리)
   */
  function clearCache() {
    debug('번역 캐시 정리');
    Object.keys(translationCache).length = 0;
  }
  
  // 공개 API
  window.translationService = {
    translateText,
    translateMessage,
    detectLanguage,
    clearCache
  };
})();