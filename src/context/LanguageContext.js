import React, { createContext, useState, useContext, useEffect } from 'react';
import { languageOptions } from '../services/translation';
import { useAuth } from '../utils/auth';

// 기본 언어 설정
const DEFAULT_LANGUAGE = 'ko';

// 언어 컨텍스트 생성
const LanguageContext = createContext(null);

/**
 * 언어 설정 컨텍스트 제공자 컴포넌트
 */
export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  
  // 사용자 프로필에서 언어 설정 로드
  useEffect(() => {
    if (user && user.profile?.preferred_language) {
      setCurrentLanguage(user.profile.preferred_language);
    } else {
      // 브라우저 언어 설정 확인
      const browserLang = navigator.language.split('-')[0];
      const isSupported = languageOptions.some(lang => lang.code === browserLang);
      
      if (isSupported) {
        setCurrentLanguage(browserLang);
      } else {
        setCurrentLanguage(DEFAULT_LANGUAGE);
      }
    }
  }, [user]);
  
  /**
   * 언어 변경 함수
   * @param {string} langCode - 언어 코드
   */
  const changeLanguage = (langCode) => {
    if (languageOptions.some(lang => lang.code === langCode)) {
      setCurrentLanguage(langCode);
      
      // 로컬 스토리지에 저장
      localStorage.setItem('preferred_language', langCode);
    }
  };
  
  // 현재 선택된 언어 정보 가져오기
  const getCurrentLanguageInfo = () => {
    return languageOptions.find(lang => lang.code === currentLanguage) || languageOptions[0];
  };
  
  // 컨텍스트 값
  const value = {
    currentLanguage,
    changeLanguage,
    getCurrentLanguageInfo,
    languageOptions
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * 언어 컨텍스트 훅
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage는 LanguageProvider 내에서 사용해야 합니다.');
  }
  
  return context;
};
