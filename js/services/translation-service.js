/**
 * 번역 서비스 클래스
 * Google Cloud Translation API를 사용한 다국어 번역 기능
 */
class TranslationService {
    /**
     * 번역 서비스 생성자
     * @param {Object} config - 애플리케이션 설정
     * @param {Object} logger - 로거 서비스
     */
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || console;
        this.apiKey = config.TRANSLATION.API_KEY;
        this.supportedLanguages = config.TRANSLATION.SUPPORTED_LANGUAGES;
        this.defaultLanguage = config.TRANSLATION.DEFAULT_LANGUAGE;
        this.translationCache = this.loadCache();
    }

    /**
     * 캐시에서 번역 정보 로드
     * @returns {Object} - 번역 캐시 객체
     */
    loadCache() {
        try {
            const cacheData = localStorage.getItem(this.config.STORAGE.TRANSLATION_CACHE);
            return cacheData ? JSON.parse(cacheData) : {};
        } catch (error) {
            this.logger.error('번역 캐시 로드 중 오류 발생:', error);
            return {};
        }
    }

    /**
     * 번역 캐시 저장
     */
    saveCache() {
        try {
            // 캐시 크기 제한 (100개 항목으로 제한)
            const cacheKeys = Object.keys(this.translationCache);
            if (cacheKeys.length > 100) {
                // 가장 오래된 항목 삭제
                const oldestKeys = cacheKeys
                    .sort((a, b) => this.translationCache[a].timestamp - this.translationCache[b].timestamp)
                    .slice(0, cacheKeys.length - 100);
                
                oldestKeys.forEach(key => delete this.translationCache[key]);
            }
            
            localStorage.setItem(
                this.config.STORAGE.TRANSLATION_CACHE,
                JSON.stringify(this.translationCache)
            );
        } catch (error) {
            this.logger.error('번역 캐시 저장 중 오류 발생:', error);
        }
    }

    /**
     * 캐시 키 생성
     * @param {string} text - 원본 텍스트
     * @param {string} sourceLanguage - 원본 언어 코드
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {string} - 캐시 키
     */
    getCacheKey(text, sourceLanguage, targetLanguage) {
        return `${sourceLanguage}:${targetLanguage}:${text}`;
    }

    /**
     * 텍스트 번역
     * @param {string} text - 번역할 텍스트
     * @param {string} sourceLanguage - 원본 언어 코드
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<string>} - 번역된 텍스트
     */
    async translateText(text, sourceLanguage, targetLanguage) {
        if (!text || sourceLanguage === targetLanguage) {
            return text;
        }
        
        // 캐시에서 확인
        const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
        
        if (
            this.translationCache[cacheKey] && 
            Date.now() - this.translationCache[cacheKey].timestamp < this.config.TRANSLATION.CACHE_EXPIRY
        ) {
            this.logger.debug('캐시에서 번역 결과를 찾았습니다.');
            return this.translationCache[cacheKey].translation;
        }
        
        try {
            this.logger.debug(`${sourceLanguage}에서 ${targetLanguage}로 번역 중:`, text);
            
            // Google Cloud Translation API 호출
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: sourceLanguage,
                    target: targetLanguage,
                    format: 'text'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP 오류! 상태: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.data && data.data.translations && data.data.translations[0]) {
                const translation = data.data.translations[0].translatedText;
                
                // 캐시에 저장
                this.translationCache[cacheKey] = {
                    translation,
                    timestamp: Date.now()
                };
                this.saveCache();
                
                this.logger.debug('번역 완료:', translation);
                return translation;
            }
            
            throw new Error('번역 데이터를 찾을 수 없습니다.');
        } catch (error) {
            this.logger.error('번역 중 오류 발생:', error);
            // 오류 발생 시 원본 텍스트 반환
            return text;
        }
    }

    /**
     * 언어 감지
     * @param {string} text - 감지할 텍스트
     * @returns {Promise<string>} - 감지된 언어 코드
     */
    async detectLanguage(text) {
        if (!text) return this.defaultLanguage;
        
        try {
            this.logger.debug('언어 감지 중:', text);
            
            // Google Cloud Translation API 호출
            const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP 오류! 상태: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.data && data.data.detections && data.data.detections[0] && data.data.detections[0][0]) {
                const detectedLanguage = data.data.detections[0][0].language;
                this.logger.debug('감지된 언어:', detectedLanguage);
                return detectedLanguage;
            }
            
            throw new Error('언어 감지 데이터를 찾을 수 없습니다.');
        } catch (error) {
            this.logger.error('언어 감지 중 오류 발생:', error);
            // 오류 발생 시 기본 언어 반환
            return this.defaultLanguage;
        }
    }

    /**
     * 지원되는 언어 목록 가져오기
     * @returns {Array} - 지원되는 언어 목록
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * 언어 코드로 언어 이름 가져오기
     * @param {string} code - 언어 코드
     * @returns {string} - 언어 이름
     */
    getLanguageName(code) {
        const language = this.supportedLanguages.find(lang => lang.code === code);
        return language ? language.name : code;
    }
}
