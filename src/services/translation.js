import axios from 'axios';

// Google Cloud Translation API Key
const TRANSLATION_API_KEY = process.env.REACT_APP_GOOGLE_TRANSLATION_API_KEY;

/**
 * 구글 번역 API를 이용하여 텍스트를 번역합니다.
 * @param {string} text - 번역할 텍스트
 * @param {string} sourceLanguage - 원본 언어 코드 (auto는 자동 감지)
 * @param {string} targetLanguage - 대상 언어 코드
 * @returns {Promise<{ translatedText, detectedSourceLanguage, error }>} 번역 결과 및 오류
 */
export const translateText = async (text, sourceLanguage = 'auto', targetLanguage) => {
  try {
    if (!text || text.trim() === '') {
      return { translatedText: '', error: null };
    }

    // 같은 언어로 번역 요청 시 원본 텍스트 반환
    if (sourceLanguage === targetLanguage && sourceLanguage !== 'auto') {
      return { translatedText: text, error: null };
    }

    // Google Cloud Translation API 호출
    const url = `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATION_API_KEY}`;
    
    const response = await axios.post(url, {
      q: text,
      source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
      target: targetLanguage,
      format: 'text'
    });

    if (!response.data || !response.data.data || !response.data.data.translations || response.data.data.translations.length === 0) {
      throw new Error('번역 결과가 없습니다.');
    }

    const { translatedText, detectedSourceLanguage } = response.data.data.translations[0];
    
    return { 
      translatedText, 
      detectedSourceLanguage: sourceLanguage === 'auto' ? detectedSourceLanguage : sourceLanguage, 
      error: null 
    };
  } catch (error) {
    console.error('번역 오류:', error);
    return { 
      translatedText: null, 
      detectedSourceLanguage: null, 
      error: error.response?.data?.error || error 
    };
  }
};

/**
 * 지원 언어 목록
 */
export const supportedLanguages = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'zh-TW', name: '中文 (繁體)' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'pt', name: 'Português' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' }
];

/**
 * 언어 코드로 언어 이름 가져오기
 * @param {string} code - 언어 코드
 * @returns {string} 언어 이름
 */
export const getLanguageName = (code) => {
  const language = supportedLanguages.find(lang => lang.code === code);
  return language ? language.name : code;
};
