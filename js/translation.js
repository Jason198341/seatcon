/**
 * 번역 서비스
 * 
 * Google Cloud Translation API를 사용한 번역 기능을 제공합니다.
 * 번역 결과를 캐싱하여 성능을 최적화합니다.
 */
class TranslationService {
    constructor() {
        this.apiKey = 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs';
        this.translationCache = {};
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24시간
        this.loadCache();
        
        this.languageNames = {
            'ko': '한국어',
            'en': 'English',
            'ja': '日本語',
            'zh': '中文',
            'hi': 'हिन्दी',
            'te': 'తెలుగు'
        };
    }
    
    /**
     * 언어 코드에 해당하는 언어 이름을 반환합니다.
     */
    getLanguageName(langCode) {
        return this.languageNames[langCode] || langCode;
    }
    
    /**
     * 로컬 스토리지에서 캐시를 로드합니다.
     */
    loadCache() {
        try {
            const cache = localStorage.getItem('translationCache');
            if (cache) {
                this.translationCache = JSON.parse(cache);
                this.cleanExpiredCache();
            }
        } catch (error) {
            console.error('캐시 로드 실패:', error);
            this.translationCache = {};
        }
    }
    
    /**
     * 캐시를 로컬 스토리지에 저장합니다.
     */
    saveCache() {
        try {
            localStorage.setItem('translationCache', JSON.stringify(this.translationCache));
        } catch (error) {
            console.error('캐시 저장 실패:', error);
            // 스토리지가 꽉 찬 경우 오래된 항목 제거
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                this.cleanExpiredCache(true);
                localStorage.setItem('translationCache', JSON.stringify(this.translationCache));
            }
        }
    }
    
    /**
     * 만료된 캐시 항목을 제거합니다.
     * @param {boolean} force - 강제로 캐시의 절반을 비울지 여부
     */
    cleanExpiredCache(force = false) {
        const now = Date.now();
        let count = 0;
        let total = 0;
        
        for (const key in this.translationCache) {
            total++;
            if (force || now - this.translationCache[key].timestamp > this.cacheExpiry) {
                delete this.translationCache[key];
                count++;
            }
            
            // 강제 모드에서는 캐시의 절반을 비움
            if (force && count > total / 2) {
                break;
            }
        }
        
        console.log(`캐시 정리: ${count}개 항목 제거됨`);
    }
    
    /**
     * 캐시 키를 생성합니다.
     */
    getCacheKey(text, sourceLanguage, targetLanguage) {
        return `${sourceLanguage}:${targetLanguage}:${text}`;
    }
    
    /**
     * 텍스트 언어를 감지합니다.
     * @param {string} text - 감지할 텍스트
     * @returns {Promise<string>} - 감지된 언어 코드
     */
    async detectLanguage(text) {
        if (!text || text.trim().length === 0) {
            return null;
        }
        
        try {
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
                return data.data.detections[0][0].language;
            }
            
            return null;
        } catch (error) {
            console.error('언어 감지 오류:', error);
            return null;
        }
    }
    
    /**
     * 텍스트를 번역합니다.
     * @param {string} text - 번역할 텍스트
     * @param {string} sourceLanguage - 원본 언어 코드
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<string>} - 번역된 텍스트
     */
    async translateText(text, sourceLanguage, targetLanguage) {
        if (!text || sourceLanguage === targetLanguage) {
            return text;
        }
        
        const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
        
        // 캐시에서 확인
        if (this.translationCache[cacheKey] && 
            (Date.now() - this.translationCache[cacheKey].timestamp < this.cacheExpiry)) {
            console.log('캐시에서 번역 결과 사용');
            return this.translationCache[cacheKey].translation;
        }
        
        try {
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
                
                return translation;
            }
            
            return text;
        } catch (error) {
            console.error('번역 오류:', error);
            return text;
        }
    }
    
    /**
     * 메시지 객체를 번역합니다.
     * @param {Object} message - 번역할 메시지 객체
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Object>} - 번역된 메시지 객체
     */
    async translateMessage(message, targetLanguage) {
        if (!message || !targetLanguage || message.language === targetLanguage) {
            return message;
        }
        
        try {
            const translatedContent = await this.translateText(
                message.content,
                message.language,
                targetLanguage
            );
            
            return {
                ...message,
                translatedContent,
                targetLanguage
            };
        } catch (error) {
            console.error('메시지 번역 오류:', error);
            return message;
        }
    }
}

// 전역 인스턴스 생성
const translationService = new TranslationService();
