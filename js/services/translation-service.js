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
                        const errMsg = `HTTP 오류! 상태: ${response.status}`;
                        this.logger.error('[번역 API HTTP 오류]', errMsg, request);
                        request.reject(new Error(errMsg));
                        continue;
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
                        const errMsg = '번역 데이터를 찾을 수 없습니다.';
                        this.logger.error('[번역 API 데이터 없음]', errMsg, request);
                        request.reject(new Error(errMsg));
                    }
                } catch (error) {
                    this.logger.error('[번역 API 호출 중 오류 발생]', error, request);
                    request.reject(error);
                }
                
                // 다음 요청 처리를 위한 지연
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    // === [실전 QA] 짧은 메시지 사전 번역 테이블 ===
    const SHORT_MESSAGE_DICTIONARY = {
        'ko': {
            '반가워': { 'zh': '很高兴见到你', 'en': 'Nice to meet you', 'hi': 'आपसे मिलकर खुशी हुई', 'te': 'మీను కలవడం ఆనందంగా ఉంది' },
            '안녕': { 'zh': '你好', 'en': 'Hello', 'hi': 'नमस्ते', 'te': 'హలో' },
            '감사합니다': { 'zh': '谢谢', 'en': 'Thank you', 'hi': 'धन्यवाद', 'te': 'ధన్యవాదాలు' },
            '좋아요': { 'zh': '喜欢', 'en': 'Like', 'hi': 'पसंद', 'te': 'ఇష్టం' },
            '축하해': { 'zh': '祝贺你', 'en': 'Congrats', 'hi': 'बधाई हो', 'te': 'అభినందనలు' },
            '미안해': { 'zh': '对不起', 'en': 'Sorry', 'hi': 'माफ़ कीजिए', 'te': 'క్షమించండి' },
            '고마워': { 'zh': '谢谢', 'en': 'Thanks', 'hi': 'धन्यवाद', 'te': 'ధన్యవాదాలు' },
            '잘자': { 'zh': '晚安', 'en': 'Good night', 'hi': 'शुभ रात्रि', 'te': 'శుభ రాత్రి' },
            '화이팅': { 'zh': '加油', 'en': 'Go for it', 'hi': 'शुभकामनाएँ', 'te': 'ఆల్ ది బెస్ట్' },
            '사랑해': { 'zh': '我爱你', 'en': 'I love you', 'hi': 'मैं तुमसे प्यार करता हूँ', 'te': 'నేను నిన్ను ప్రేమిస్తున్నాను' },
            '오케이': { 'zh': '好的', 'en': 'Okay', 'hi': 'ठीक है', 'te': 'సరే' },
            '네': { 'zh': '是', 'en': 'Yes', 'hi': 'हाँ', 'te': 'అవును' },
            '아니': { 'zh': '不是', 'en': 'No', 'hi': 'नहीं', 'te': 'కాదు' },
            '대박': { 'zh': '厉害', 'en': 'Awesome', 'hi': 'कमाल है', 'te': 'అద్భుతం' },
            '헐': { 'zh': '哎呀', 'en': 'OMG', 'hi': 'ओह', 'te': 'అయ్యో' },
            'ㅋㅋ': { 'zh': '哈哈', 'en': 'LOL', 'hi': 'हाहा', 'te': 'హా హా' },
            'ㅠㅠ': { 'zh': '呜呜', 'en': 'T_T', 'hi': 'हाय', 'te': 'ఐయో' },
            'ㅎㅎ': { 'zh': '呵呵', 'en': 'Hehe', 'hi': 'हीही', 'te': 'హీహీ' }
        },
        'en': {
            'hi': { 'ko': '안녕', 'zh': '你好', 'hi': 'नमस्ते', 'te': 'హలో' },
            'thanks': { 'ko': '고마워', 'zh': '谢谢', 'hi': 'धन्यवाद', 'te': 'ధన్యవాదాలు' },
            'ok': { 'ko': '오케이', 'zh': '好的', 'hi': 'ठीक है', 'te': 'సరే' },
            'bye': { 'ko': '잘가', 'zh': '再见', 'hi': 'अलविदा', 'te': 'వీడ్కోలు' },
            'congrats': { 'ko': '축하해', 'zh': '祝贺你', 'hi': 'बधाई हो', 'te': 'అభినందనలు' },
            'sorry': { 'ko': '미안해', 'zh': '对不起', 'hi': 'माफ़ कीजिए', 'te': 'క్షమించండి' },
            'love you': { 'ko': '사랑해', 'zh': '我爱你', 'hi': 'मैं तुमसे प्यार करता हूँ', 'te': 'నేను నిన్ను ప్రేమిస్తున్నాను' }
        },
        'zh': {
            '你好': { 'ko': '안녕', 'en': 'Hello', 'hi': 'नमस्ते', 'te': 'హలో' },
            '谢谢': { 'ko': '고마워', 'en': 'Thanks', 'hi': 'धन्यवाद', 'te': 'ధన్యవాదాలు' },
            '再见': { 'ko': '잘가', 'en': 'Bye', 'hi': 'अलविदा', 'te': 'వీడ్కోలు' },
            '对不起': { 'ko': '미안해', 'en': 'Sorry', 'hi': 'माफ़ कीजिए', 'te': 'క్షమించండి' }
        },
        'hi': {
            'नमस्ते': { 'ko': '안녕', 'en': 'Hello', 'zh': '你好', 'te': 'హలో' },
            'धन्यवाद': { 'ko': '고마워', 'en': 'Thanks', 'zh': '谢谢', 'te': 'ధన్యవాదాలు' }
        },
        'te': {
            'హలో': { 'ko': '안녕', 'en': 'Hello', 'zh': '你好', 'hi': 'नमस्ते' },
            'ధన్యవాదాలు': { 'ko': '고마워', 'en': 'Thanks', 'zh': '谢谢', 'hi': 'धन्यवाद' }
        }
    };

    /**
     * 텍스트 번역
     * @param {string} text - 번역할 텍스트
     * @param {string} sourceLanguage - 원본 언어 코드
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<string>} - 번역된 텍스트
     */
    async translateText(text, sourceLanguage, targetLanguage) {
        if (typeof text !== 'string') text = String(text);
        // === [실전 QA] 짧은 메시지(5자 이하) 사전 번역 우선 적용 ===
        if (text.length <= 5 && SHORT_MESSAGE_DICTIONARY[sourceLanguage]?.[text]?.[targetLanguage]) {
            console.log('[translateText] 사전 번역 적용:', text, '→', SHORT_MESSAGE_DICTIONARY[sourceLanguage][text][targetLanguage]);
            return SHORT_MESSAGE_DICTIONARY[sourceLanguage][text][targetLanguage];
        }
        console.log('[translateText] 번역 요청:', { text, sourceLanguage, targetLanguage });
        // 입력 확인 - 텍스트가 없거나 소스/타겟 언어가 같으면 원본 그대로 반환
        if (!text || !text.trim()) {
            return text;
        }
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
                const errMsg = 'Translation API 키가 설정되지 않았습니다.';
                this.logger.error('[번역 API 키 없음]', errMsg);
                throw new Error(errMsg);
            }
            
            // 번역 요청 대기열에 추가
            return new Promise((resolve, reject) => {
                this.requestQueue.push({
                    text,
                    sourceLanguage,
                    targetLanguage,
                    resolve: (translation) => {
                        // === [실전 QA] 번역 결과 타입 방어 및 추적 ===
                        if (typeof translation !== 'string') {
                            console.warn('[translateText] 번역 결과가 string이 아님:', translation, typeof translation);
                            translation = JSON.stringify(translation);
                        }
                        console.log('[translateText] 번역 결과:', translation);
                        resolve(translation);
                    },
                    reject
                });
                this.processQueue();
            });
        } catch (error) {
            this.logger.error('[번역 중 오류 발생]', error, { text, sourceLanguage, targetLanguage });
            return text + ' [번역 실패]';
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
                
                // detectLanguage 함수도 짧은 메시지는 입력자 언어로 강제
                if (text.length <= 5 && !isSupported) return this.defaultLanguage;
                
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
