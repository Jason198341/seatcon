// src/services/translationService.js
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const API_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * 텍스트를 대상 언어로 번역합니다.
 * @param {string} text - 번역할 텍스트
 * @param {string} targetLanguage - 번역 대상 언어 코드 (예: 'ko', 'en', 'ja')
 * @returns {Promise<string>} 번역된 텍스트
 */
async function translateText(text, targetLanguage) {
  try {
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        q: text,
        target: targetLanguage,
      }
    );

    if (response.data && 
        response.data.data && 
        response.data.data.translations && 
        response.data.data.translations.length > 0) {
      return response.data.data.translations[0].translatedText;
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Translation error:', error.message);
    return text; // 오류 발생 시 원본 텍스트 반환
  }
}

/**
 * 지원되는 언어 목록을 가져옵니다.
 * @returns {Promise<Array>} 지원 언어 목록
 */
async function getSupportedLanguages() {
  try {
    const response = await axios.get(
      `${API_URL}/languages?key=${API_KEY}&target=ko`
    );

    if (response.data && 
        response.data.data && 
        response.data.data.languages) {
      return response.data.data.languages;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching supported languages:', error.message);
    return [];
  }
}

module.exports = {
  translateText,
  getSupportedLanguages,
};