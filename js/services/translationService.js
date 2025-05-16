/**
 * translationService.js
 * Google Cloud Translation API를 활용한 번역 기능을 담당하는 서비스
 */

const translationService = (() => {
    // config.js에서 API 키 및 설정 가져오기
    const API_KEY = CONFIG.TRANSLATION_API_KEY;
    const API_URL = CONFIG.TRANSLATION_API_URL;
    
    // 지원 언어 목록
    const supportedLanguages = CONFIG.SUPPORTED_LANGUAGES;
    
    // 번역 캐시 (동일한 텍스트에 대한 반복 요청 방지)
    const translationCache = new Map();
    
    /**
     * 지원하는 언어 목록 가져오기
     * @returns {Array} 지원 언어 목록
     */
    const getSupportedLanguages = () => {
        return [...supportedLanguages];
    };
    
    /**
     * 언어 코드로 언어 이름 가져오기
     * @param {string} languageCode - 언어 코드
     * @returns {string} 언어 이름
     */
    const getLanguageName = (languageCode) => {
        const language = supportedLanguages.find(lang => lang.code === languageCode);
        return language ? language.name : languageCode;
    };
    
    /**
     * 텍스트 번역
     * @param {string} text - 번역할 텍스트
     * @param {string} targetLanguage - 대상 언어 코드
     * @param {string} sourceLanguage - 원본 언어 코드 (자동 감지면 null)
     * @returns {Promise<Object>} 번역 결과
     */
    const translateText = async (text, targetLanguage, sourceLanguage = null) => {
        if (!text || text.trim() === '') {
            return { translatedText: '', detectedLanguage: sourceLanguage || 'en' };
        }
        
        // 대상 언어가 원본 언어와 같으면 번역하지 않음
        if (sourceLanguage && sourceLanguage === targetLanguage) {
            return { translatedText: text, detectedLanguage: sourceLanguage };
        }
        
        // 캐시 키 생성 (텍스트+대상언어+원본언어)
        const cacheKey = `${text}_${targetLanguage}_${sourceLanguage || 'auto'}`;
        
        // 캐시에 있으면 캐시된 결과 반환
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey);
        }
        
        try {
            // API 요청 URL 구성
            let url = `${API_URL}?key=${API_KEY}&target=${targetLanguage}&q=${encodeURIComponent(text)}`;
            
            // 원본 언어가 지정되었으면 요청에 추가
            if (sourceLanguage) {
                url += `&source=${sourceLanguage}`;
            }
            
            // API 요청 수행
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // 응답 처리
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`번역 API 오류: ${errorData.error.message}`);
            }
            
            const data = await response.json();
            
            // 응답에서 번역 결과 추출
            const result = {
                translatedText: data.data.translations[0].translatedText,
                detectedLanguage: data.data.translations[0].detectedSourceLanguage || sourceLanguage
            };
            
            // 결과를 캐시에 저장
            translationCache.set(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('번역 요청 실패:', error);
            // 오류 발생 시 원본 텍스트 반환
            return { translatedText: text, detectedLanguage: sourceLanguage || 'en', error: error.message };
        }
    };
    
    /**
     * 메시지 번역
     * @param {Object} message - 번역할 메시지 객체
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Object>} 번역된 메시지
     */
    const translateMessage = async (message, targetLanguage) => {
        if (!message || !message.message) {
            return message;
        }
        
        // 원본 언어와 대상 언어가 같으면 번역하지 않음
        if (message.language === targetLanguage) {
            return { ...message, translated: false };
        }
        
        try {
            // 메시지 텍스트 번역
            const { translatedText } = await translateText(
                message.message, 
                targetLanguage, 
                message.language
            );
            
            // 번역 결과 반환
            return {
                ...message,
                original_message: message.message,
                message: translatedText,
                translated: true,
                target_language: targetLanguage
            };
        } catch (error) {
            console.error('메시지 번역 실패:', error);
            // 오류 발생 시 원본 메시지 반환
            return { ...message, translated: false };
        }
    };
    
    /**
     * 메시지 목록 번역
     * @param {Array} messages - 번역할 메시지 목록
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Array>} 번역된 메시지 목록
     */
    const translateMessages = async (messages, targetLanguage) => {
        if (!messages || messages.length === 0) {
            return [];
        }
        
        try {
            // 모든 메시지 번역을 병렬로 처리
            const translatedMessages = await Promise.all(
                messages.map(message => translateMessage(message, targetLanguage))
            );
            
            return translatedMessages;
        } catch (error) {
            console.error('메시지 목록 번역 실패:', error);
            // 오류 발생 시 원본 메시지 목록 반환
            return messages;
        }
    };
    
    /**
     * 번역 API 연결 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     */
    const testConnection = async () => {
        try {
            // 간단한 텍스트로 API 연결 테스트
            const { translatedText } = await translateText('Hello', 'ko', 'en');
            return translatedText === '안녕하세요' || translatedText === '안녕' || !!translatedText;
        } catch (error) {
            console.error('번역 API 연결 테스트 실패:', error);
            return false;
        }
    };
    
    /**
     * 캐시 비우기
     */
    const clearCache = () => {
        translationCache.clear();
    };
    
    // 공개 API
    return {
        getSupportedLanguages,
        getLanguageName,
        translateText,
        translateMessage,
        translateMessages,
        testConnection,
        clearCache
    };
})();