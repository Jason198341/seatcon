/**
 * 번역 서비스
 * Google Cloud Translation API를 사용하여 메시지 번역을 처리합니다.
 */

// Google Cloud Translation API 키
const TRANSLATION_API_KEY = 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs';
const TRANSLATION_API_URL = 'https://translation.googleapis.com/language/translate/v2';

class TranslationService {
    constructor() {
        this.cache = {}; // 번역 결과 캐싱
        this.supportedLanguages = ['ko', 'en', 'ja', 'zh']; // 지원하는 언어 목록
    }

    /**
     * 메시지 텍스트를 지정한 언어로 번역합니다.
     * @param {string} text 번역할 텍스트
     * @param {string} targetLanguage 대상 언어 코드
     * @param {string} sourceLanguage 원본 언어 코드 (자동 감지하려면 null)
     * @returns {Promise<{success: boolean, translation: string, detectedLanguage: string|null}>} 번역 결과
     */
    async translateText(text, targetLanguage, sourceLanguage = null) {
        // 빈 텍스트는 번역하지 않음
        if (!text || text.trim() === '') {
            return { success: false, translation: '', detectedLanguage: null };
        }
        
        // 원본 언어와 대상 언어가 같으면 번역하지 않음
        if (sourceLanguage && sourceLanguage === targetLanguage) {
            return { success: true, translation: text, detectedLanguage: sourceLanguage };
        }
        
        // 캐시 키 생성
        const cacheKey = `${text}|${targetLanguage}|${sourceLanguage || 'auto'}`;
        
        // 캐시된 번역이 있으면 반환
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        try {
            // API 요청 URL 생성
            let url = `${TRANSLATION_API_URL}?key=${TRANSLATION_API_KEY}&q=${encodeURIComponent(text)}&target=${targetLanguage}`;
            
            // 원본 언어가 지정된 경우 추가
            if (sourceLanguage) {
                url += `&source=${sourceLanguage}`;
            }
            
            // API 요청
            const response = await fetch(url);
            const data = await response.json();
            
            // 오류 처리
            if (!response.ok || !data.data || !data.data.translations || data.data.translations.length === 0) {
                console.error('Translation API error:', data);
                return { success: false, translation: '', detectedLanguage: null };
            }
            
            // 번역 결과 추출
            const translation = data.data.translations[0].translatedText;
            const detectedLanguage = data.data.translations[0].detectedSourceLanguage || sourceLanguage;
            
            // 결과 캐싱
            const result = { success: true, translation, detectedLanguage };
            this.cache[cacheKey] = result;
            
            return result;
        } catch (error) {
            console.error('Error translating text:', error);
            return { success: false, translation: '', detectedLanguage: null };
        }
    }

    /**
     * 텍스트의 언어를 감지합니다.
     * @param {string} text 감지할 텍스트
     * @returns {Promise<{success: boolean, language: string|null}>} 감지 결과
     */
    async detectLanguage(text) {
        if (!text || text.trim() === '') {
            return { success: false, language: null };
        }
        
        try {
            // API 요청 URL 생성
            const url = `${TRANSLATION_API_URL}/detect?key=${TRANSLATION_API_KEY}&q=${encodeURIComponent(text)}`;
            
            // API 요청
            const response = await fetch(url);
            const data = await response.json();
            
            // 오류 처리
            if (!response.ok || !data.data || !data.data.detections || data.data.detections.length === 0) {
                console.error('Language detection API error:', data);
                return { success: false, language: null };
            }
            
            // 감지 결과 추출
            const language = data.data.detections[0][0].language;
            
            return { success: true, language };
        } catch (error) {
            console.error('Error detecting language:', error);
            return { success: false, language: null };
        }
    }

    /**
     * LocalStorage에 캐시된 번역 결과를 저장합니다.
     */
    saveCache() {
        try {
            localStorage.setItem('translationCache', JSON.stringify(this.cache));
        } catch (error) {
            console.error('Error saving translation cache:', error);
        }
    }

    /**
     * LocalStorage에서 캐시된 번역 결과를 불러옵니다.
     */
    loadCache() {
        try {
            const cachedData = localStorage.getItem('translationCache');
            if (cachedData) {
                this.cache = JSON.parse(cachedData);
            }
        } catch (error) {
            console.error('Error loading translation cache:', error);
            this.cache = {};
        }
    }

    /**
     * 캐시를 초기화합니다.
     */
    clearCache() {
        this.cache = {};
        try {
            localStorage.removeItem('translationCache');
        } catch (error) {
            console.error('Error clearing translation cache:', error);
        }
    }

    /**
     * 언어가 지원되는지 확인합니다.
     * @param {string} language 언어 코드
     * @returns {boolean} 지원 여부
     */
    isLanguageSupported(language) {
        return this.supportedLanguages.includes(language);
    }
}

// 싱글톤 인스턴스 생성
const translationService = new TranslationService();

// 초기화 시 캐시 로드
document.addEventListener('DOMContentLoaded', () => {
    translationService.loadCache();
});

// 브라우저 종료 시 캐시 저장
window.addEventListener('beforeunload', () => {
    translationService.saveCache();
});
