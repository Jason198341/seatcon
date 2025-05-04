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
        this.apiKey = config?.TRANSLATION?.API_KEY;
        this.supportedLanguages = config?.TRANSLATION?.SUPPORTED_LANGUAGES || [];
        this.defaultLanguage = config?.TRANSLATION?.DEFAULT_LANGUAGE || 'en';
        this.translationCache = this.loadCache();
        this.lastAPICallTime = 0;
        this.minAPICallInterval = 100; // 최소 API 호출 간격 (ms)
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * 캐시에서 번역 정보 로드
     * @returns {Object} - 번역 캐시 객체
     */
    loadCache() {
        try {
            const cacheKey = this.config?.STORAGE?.TRANSLATION_CACHE || 'premium-chat-translation-cache';
            const cacheData = localStorage.getItem(cacheKey);
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
            const cacheKey = this.config?.STORAGE?.TRANSLATION_CACHE || 'premium-chat-translation-cache';
            
            // 캐시 크기 제한 (100개 항목으로 제한)
            const cacheKeys = Object.keys(this.translationCache);
            if (cacheKeys.length > 100) {
                // 가장 오래된 항목 삭제
                const oldestKeys = cacheKeys
                    .sort((a, b) => this.translationCache[a].timestamp - this.translationCache[b].timestamp)
                    .slice(0, cacheKeys.length - 100);
                
                oldestKeys.forEach(key => delete this.translationCache[key]);
            }
            
            localStorage.setItem(cacheKey, JSON.stringify(this.translationCache));
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
     * 요청 대기열 처리
     * @returns {Promise<void>}
     */
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        try {
            while (this.requestQueue.length > 0) {
                const request = this.requestQueue.shift();
                
                // API 호출 간격 조절
                const now = Date.now();
                const timeSinceLastCall = now - this.lastAPICallTime;
                
                if (timeSinceLastCall < this.minAPICallInterval) {
                    await new Promise(resolve => setTimeout(resolve, this.minAPICallInterval - timeSinceLastCall));
                }
                
                try {
                    // Google Cloud Translation API 호출
                    const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            q: request.text,
                            source: request.sourceLanguage,
                            target: request.targetLanguage,
                            format: 'text'
                        })
                    });
                    
                    this.lastAPICallTime = Date.now();
                    
                    if (!response.ok) {
                        throw new Error(`HTTP 오류! 상태: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data && data.data && data.data.translations && data.data.translations[0]) {
                        const translation = data.data.translations[0].translatedText;
                        
                        // 캐시에 저장
                        const cacheKey = this.getCacheKey(request.text, request.sourceLanguage, request.targetLanguage);
                        this.translationCache[cacheKey] = {
                            translation,
                            timestamp: Date.now()
                        };
                        this.saveCache();
                        
                        // 응답 처리
                        request.resolve(translation);
                    } else {
                        request.reject(new Error('번역 데이터를 찾을 수 없습니다.'));
                    }
                } catch (error) {
                    this.logger.error('번역 API 호출 중 오류 발생:', error);
                    request.reject(error);
                }
                
                // 다음 요청 처리를 위한 지연
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * 텍스트 번역
     * @param {string} text - 번역할 텍스트
     * @param {string} sourceLanguage - 원본 언어 코드
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<string>} - 번역된 텍스트
     */
    async translateText(text, sourceLanguage, targetLanguage) {
        // 입력 확인 - 텍스트가 없거나 소스/타겟 언어가 같으면 원본 그대로 반환
        if (!text || !text.trim()) {
            return text;
        }
        
        // 언어 코드가 없거나 같으면 원본 반환
        if (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage) {
            return text;
        }
        
        try {
            // 텍스트가 너무 길면 안전하게 자르기 (API 제한)
            const maxLength = 5000;
            if (text.length > maxLength) {
                const truncated = text.substring(0, maxLength);
                this.logger.warn(`텍스트가 너무 깁니다. ${text.length}자에서 ${maxLength}자로 자릅니다.`);
                text = truncated;
            }
            
            // 캐시에서 확인
            const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
            
            if (
                this.translationCache[cacheKey] && 
                Date.now() - this.translationCache[cacheKey].timestamp < (this.config?.TRANSLATION?.CACHE_EXPIRY || 3600000)
            ) {
                this.logger.debug('캐시에서 번역 결과를 찾았습니다.');
                return this.translationCache[cacheKey].translation;
            }
            
            this.logger.debug(`${sourceLanguage}에서 ${targetLanguage}로 번역 중:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            
            // API 키 확인
            if (!this.apiKey) {
                throw new Error('Translation API 키가 설정되지 않았습니다.');
            }
            
            // 번역 요청 대기열에 추가
            return new Promise((resolve, reject) => {
                this.requestQueue.push({
                    text,
                    sourceLanguage,
                    targetLanguage,
                    resolve,
                    reject
                });
                
                // 대기열 처리 시작
                this.processQueue();
            });
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
        if (!text || !text.trim()) {
            return this.defaultLanguage;
        }
        
        try {
            // 유효한 샘플 텍스트 확보 (최대 1000자)
            const sampleText = text.substring(0, 1000);
            
            this.logger.debug('언어 감지 중:', sampleText.substring(0, 50) + (sampleText.length > 50 ? '...' : ''));
            
            // API 키 확인
            if (!this.apiKey) {
                throw new Error('Translation API 키가 설정되지 않았습니다.');
            }
            
            // Google Cloud Translation API 호출
            const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`;
            
            // API 호출 간격 조절
            const now = Date.now();
            const timeSinceLastCall = now - this.lastAPICallTime;
            
            if (timeSinceLastCall < this.minAPICallInterval) {
                await new Promise(resolve => setTimeout(resolve, this.minAPICallInterval - timeSinceLastCall));
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: sampleText
                })
            });
            
            this.lastAPICallTime = Date.now();
            
            if (!response.ok) {
                throw new Error(`HTTP 오류! 상태: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.data && data.data.detections && data.data.detections[0] && data.data.detections[0][0]) {
                const detectedLanguage = data.data.detections[0][0].language;
                this.logger.debug('감지된 언어:', detectedLanguage);
                
                // 지원되는 언어인지 확인
                const isSupported = this.supportedLanguages.some(lang => lang.code === detectedLanguage);
                
                return isSupported ? detectedLanguage : this.defaultLanguage;
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
    
    /**
     * API 키가 설정되었는지 확인
     * @returns {boolean} - API 키 설정 여부
     */
    isApiKeyConfigured() {
        return !!this.apiKey && this.apiKey.length > 10;
    }
    
    /**
     * API가 사용 가능한지 테스트
     * @returns {Promise<boolean>} - API 사용 가능 여부
     */
    async testApi() {
        try {
            if (!this.isApiKeyConfigured()) {
                return false;
            }
            
            // 간단한 번역 테스트
            const translatedText = await this.translateText('Hello', 'en', 'ko');
            
            return translatedText && translatedText !== 'Hello';
        } catch (error) {
            this.logger.error('번역 API 테스트 중 오류 발생:', error);
            return false;
        }
    }
    
    /**
     * 서비스 재초기화
     * @param {Object} config - 새 설정
     */
    reinitialize(config) {
        if (config) {
            this.config = config;
            this.apiKey = config?.TRANSLATION?.API_KEY;
            this.supportedLanguages = config?.TRANSLATION?.SUPPORTED_LANGUAGES || [];
            this.defaultLanguage = config?.TRANSLATION?.DEFAULT_LANGUAGE || 'en';
            
            // 캐시 다시 로드
            this.translationCache = this.loadCache();
            
            this.logger.info('번역 서비스가 새 설정으로 재초기화되었습니다.');
        }
    }
}
