/**
 * 번역 서비스 구현
 * 
 * Google Cloud Translation API를 활용한 번역 기능을 제공합니다.
 * 번역 결과 캐싱으로 API 호출을 최적화하고, 자동 언어 감지 기능을 지원합니다.
 */

import CONFIG from './config.js';

class TranslationService {
    constructor() {
        this.apiKey = CONFIG.TRANSLATION_API_KEY;
        this.translationCache = {};
        this.loadCache();
        
        // 디버그 모드에서 초기화 로그 출력
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('TranslationService initialized');
        }
    }

    /**
     * 로컬 스토리지에서 번역 캐시 불러오기
     */
    loadCache() {
        try {
            const cachedTranslations = localStorage.getItem('translationCache');
            if (cachedTranslations) {
                this.translationCache = JSON.parse(cachedTranslations);
                
                // 만료된 캐시 항목 정리
                this.cleanupExpiredCache();
                
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log(`Loaded ${Object.keys(this.translationCache).length} cached translations`);
                }
            }
        } catch (error) {
            console.error('Error loading translation cache:', error);
            this.translationCache = {};
        }
    }

    /**
     * 번역 캐시를 로컬 스토리지에 저장
     */
    saveCache() {
        try {
            localStorage.setItem('translationCache', JSON.stringify(this.translationCache));
        } catch (error) {
            console.error('Error saving translation cache:', error);
            
            // 스토리지 용량 초과 시 캐시 정리 후 재시도
            if (error.name === 'QuotaExceededError') {
                this.cleanupExpiredCache();
                try {
                    localStorage.setItem('translationCache', JSON.stringify(this.translationCache));
                } catch (retryError) {
                    console.error('Failed to save cache even after cleanup:', retryError);
                }
            }
        }
    }

    /**
     * 만료된 캐시 항목 정리
     */
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanupCount = 0;
        
        Object.keys(this.translationCache).forEach(key => {
            if (now - this.translationCache[key].timestamp > CONFIG.CHAT.TRANSLATION_CACHE_EXPIRY) {
                delete this.translationCache[key];
                cleanupCount++;
            }
        });
        
        if (CONFIG.APP.DEBUG_MODE && cleanupCount > 0) {
            console.log(`Cleaned up ${cleanupCount} expired cache items`);
        }
    }

    /**
     * 캐시 키 생성
     * @param {string} text - 번역할 텍스트
     * @param {string} sourceLanguage - 원본 언어 코드
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {string} - 캐시 키
     */
    getCacheKey(text, sourceLanguage, targetLanguage) {
        return `${sourceLanguage}:${targetLanguage}:${text}`;
    }

    /**
     * 텍스트의 언어 감지
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.data && data.data.detections && data.data.detections[0] && data.data.detections[0][0]) {
                const detectedLanguage = data.data.detections[0][0].language;
                
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log(`Detected language: ${detectedLanguage} for text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
                }
                
                return detectedLanguage;
            }
            
            return null;
        } catch (error) {
            console.error('Language detection error:', error);
            return null;
        }
    }

    /**
     * 텍스트 번역
     * @param {string} text - 번역할 텍스트
     * @param {string} sourceLanguage - 원본 언어 코드 (자동 감지 시 null)
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<string>} - 번역된 텍스트
     */
    async translateText(text, sourceLanguage, targetLanguage) {
        // 번역 불필요 시 원본 반환
        if (!text || sourceLanguage === targetLanguage) {
            return text;
        }
        
        // 같은 언어로 번역 요청 시 원본 반환
        if (sourceLanguage === targetLanguage) {
            return text;
        }
        
        const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
        
        // 캐시에서 번역 결과 확인
        if (this.translationCache[cacheKey] && 
            Date.now() - this.translationCache[cacheKey].timestamp < CONFIG.CHAT.TRANSLATION_CACHE_EXPIRY) {
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log(`Using cached translation for: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
            }
            
            return this.translationCache[cacheKey].translation;
        }
        
        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
            
            const requestBody = {
                q: text,
                target: targetLanguage,
                format: 'text'
            };
            
            // 원본 언어가 지정된 경우에만 포함
            if (sourceLanguage) {
                requestBody.source = sourceLanguage;
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.data && data.data.translations && data.data.translations[0]) {
                const translation = data.data.translations[0].translatedText;
                
                // 캐시에 번역 결과 저장
                this.translationCache[cacheKey] = {
                    translation,
                    timestamp: Date.now()
                };
                this.saveCache();
                
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log(`Translated from ${sourceLanguage || 'auto'} to ${targetLanguage}: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}" => "${translation.substring(0, 20)}${translation.length > 20 ? '...' : ''}"`);
                }
                
                return translation;
            }
            
            return text; // 번역 실패 시 원본 반환
        } catch (error) {
            console.error('Translation error:', error);
            return text; // 에러 시 원본 반환
        }
    }

    /**
     * 메시지 객체 번역
     * @param {Object} message - 번역할 메시지 객체
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Object>} - 번역된 메시지 객체
     */
    async translateMessage(message, targetLanguage) {
        if (!message || !message.content || !targetLanguage) {
            return message;
        }
        
        // 원본 언어와 대상 언어가 같으면 번역 불필요
        if (message.language === targetLanguage) {
            return {
                ...message,
                translatedContent: null,
                isTranslated: false
            };
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
                isTranslated: true,
                targetLanguage
            };
        } catch (error) {
            console.error('Error translating message:', error);
            return {
                ...message,
                translatedContent: null,
                isTranslated: false
            };
        }
    }

    /**
     * 여러 메시지 번역
     * @param {Array} messages - 번역할 메시지 배열
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Array>} - 번역된 메시지 배열
     */
    async translateMessages(messages, targetLanguage) {
        if (!messages || messages.length === 0 || !targetLanguage) {
            return messages;
        }
        
        try {
            const translatedMessages = await Promise.all(
                messages.map(message => this.translateMessage(message, targetLanguage))
            );
            
            return translatedMessages;
        } catch (error) {
            console.error('Error translating messages:', error);
            return messages;
        }
    }

    /**
     * 지정된 언어가 지원되는지 확인
     * @param {string} languageCode - 확인할 언어 코드
     * @returns {boolean} - 지원 여부
     */
    isSupportedLanguage(languageCode) {
        return CONFIG.LANGUAGES.some(lang => lang.code === languageCode);
    }

    /**
     * 언어 코드로 언어 정보 가져오기
     * @param {string} languageCode - 언어 코드
     * @returns {Object|null} - 언어 정보 객체
     */
    getLanguageInfo(languageCode) {
        return CONFIG.LANGUAGES.find(lang => lang.code === languageCode) || null;
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const translationService = new TranslationService();
export default translationService;
