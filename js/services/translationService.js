/**
 * translationService.js
 * Google Cloud Translation API를 활용한 번역 기능을 담당하는 서비스 (개선 버전)
 */

const translationService = (() => {
    // config.js에서 API 키 및 설정 가져오기
    const API_KEY = CONFIG.TRANSLATION_API_KEY;
    const API_URL = CONFIG.TRANSLATION_API_URL;
    
    // 지원 언어 목록
    const supportedLanguages = CONFIG.SUPPORTED_LANGUAGES;
    
    // 번역 캐시 (동일한 텍스트에 대한 반복 요청 방지)
    const translationCache = new Map();
    
    // 기본 언어
    const defaultLanguage = 'en';
    
    // 번역 요청 큐 및 배치 처리 설정
    let translationQueue = [];
    let isProcessingQueue = false;
    const BATCH_SIZE = 10;  // 한 번에 처리할 최대 요청 수
    const QUEUE_PROCESS_INTERVAL = 500;  // 큐 처리 간격 (ms)
    
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
     * 언어 자동 감지 (간단한 방식)
     * @param {string} text - 감지할 텍스트
     * @returns {string} 감지된 언어 코드
     */
    const detectLanguage = (text) => {
        // 간단한 언어 감지 로직 (실제 환경에서는 Google Cloud Translation API의 감지 기능 사용)
        // 한글, 일본어, 중국어 문자 감지
        const koreanChars = /[\uAC00-\uD7AF]/;
        const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF]/;
        const chineseChars = /[\u4E00-\u9FFF]/;
        
        if (koreanChars.test(text)) return 'ko';
        if (japaneseChars.test(text)) return 'ja';
        if (chineseChars.test(text)) return 'zh';
        
        // 기본값은 영어
        return 'en';
    };
    
    /**
     * 번역 큐 처리 함수
     */
    const processTranslationQueue = async () => {
        if (isProcessingQueue || translationQueue.length === 0) return;
        
        isProcessingQueue = true;
        
        try {
            // 현재 큐에서 처리할 항목 가져오기 (최대 BATCH_SIZE 개)
            const batchItems = translationQueue.splice(0, BATCH_SIZE);
            
            console.log(`번역 큐 처리 시작: ${batchItems.length}개 항목`);
            
            // 각 항목 처리
            const results = await Promise.allSettled(
                batchItems.map(async (item) => {
                    try {
                        const { text, targetLanguage, sourceLanguage, resolve, reject } = item;
                        
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
                            throw new Error(`번역 API 오류: ${errorData.error?.message || response.statusText}`);
                        }
                        
                        const data = await response.json();
                        
                        if (!data || !data.data || !data.data.translations || data.data.translations.length === 0) {
                            throw new Error('번역 결과가 없습니다');
                        }
                        
                        // 응답에서 번역 결과 추출
                        const result = {
                            translatedText: data.data.translations[0].translatedText,
                            detectedLanguage: data.data.translations[0].detectedSourceLanguage || sourceLanguage
                        };
                        
                        // 결과를 캐시에 저장
                        const cacheKey = `${text}_${targetLanguage}_${sourceLanguage || 'auto'}`;
                        translationCache.set(cacheKey, result);
                        
                        // Promise 해결
                        resolve(result);
                        
                        return result;
                    } catch (error) {
                        reject(error);
                        throw error;
                    }
                })
            );
            
            // 처리 결과 로깅 (디버깅 용도)
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failCount = results.filter(r => r.status === 'rejected').length;
            
            console.log(`번역 배치 처리 결과: ${successCount}개 성공, ${failCount}개 실패`);
            
            if (failCount > 0) {
                const errors = results
                    .filter(r => r.status === 'rejected')
                    .map(r => r.reason?.message || '알 수 없는 오류');
                
                console.warn('번역 실패 오류:', errors);
            }
        } catch (error) {
            console.error('번역 큐 처리 중 오류:', error);
        } finally {
            isProcessingQueue = false;
            
            // 큐에 남은 항목이 있으면 계속 처리
            if (translationQueue.length > 0) {
                setTimeout(processTranslationQueue, QUEUE_PROCESS_INTERVAL);
            } else {
                console.log('번역 큐 처리 완료');
            }
        }
    };
    
    /**
     * 텍스트 번역
     * @param {string} text - 번역할 텍스트
     * @param {string} targetLanguage - 대상 언어 코드
     * @param {string} sourceLanguage - 원본 언어 코드 (자동 감지면 null)
     * @returns {Promise<Object>} 번역 결과
     */
    const translateText = async (text, targetLanguage, sourceLanguage = null) => {
        // 빈 텍스트 처리
        if (!text || text.trim() === '') {
            return { translatedText: '', detectedLanguage: sourceLanguage || defaultLanguage };
        }
        
        // 텍스트가 너무 긴 경우 처리 (API 제한 준수)
        const trimmedText = text.length > 5000 ? text.substring(0, 5000) + '...' : text;
        
        // 대상 언어가 없는 경우 기본값 사용
        targetLanguage = targetLanguage || defaultLanguage;
        
        // 원본 언어가 없는 경우 자동 감지 시도
        if (!sourceLanguage) {
            sourceLanguage = detectLanguage(trimmedText);
        }
        
        console.log(`번역 요청: ${sourceLanguage || '자동감지'} -> ${targetLanguage}`);
        
        // 대상 언어가 원본 언어와 같으면 번역하지 않음
        if (sourceLanguage === targetLanguage) {
            return { 
                translatedText: text, 
                detectedLanguage: sourceLanguage,
                isSameLanguage: true
            };
        }
        
        // 캐시 키 생성 (텍스트+대상언어+원본언어)
        const cacheKey = `${trimmedText}_${targetLanguage}_${sourceLanguage || 'auto'}`;
        
        // 캐시에 있으면 캐시된 결과 반환
        if (translationCache.has(cacheKey)) {
            console.log('캐시된 번역 결과 사용');
            return translationCache.get(cacheKey);
        }
        
        try {
            // 번역 큐에 추가하여 비동기 처리
            return new Promise((resolve, reject) => {
                translationQueue.push({
                    text: trimmedText,
                    targetLanguage,
                    sourceLanguage,
                    resolve,
                    reject
                });
                
                // 큐가 처리 중이 아니면 처리 시작
                if (!isProcessingQueue) {
                    setTimeout(processTranslationQueue, 0);
                }
            });
        } catch (error) {
            console.error('번역 요청 실패:', error);
            // 오류 발생 시 원본 텍스트 반환
            return { 
                translatedText: text, 
                detectedLanguage: sourceLanguage || defaultLanguage, 
                error: error.message,
                isError: true
            };
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
        
        // 대상 언어가 없는 경우 기본값 사용
        targetLanguage = targetLanguage || defaultLanguage;
        
        try {
            // 원본 언어와 대상 언어가 같으면 번역하지 않음
            if (message.language === targetLanguage) {
                return { 
                    ...message, 
                    translated: false,
                    isSameLanguage: true
                };
            }
            
            console.log(`메시지 번역: ${message.language || '자동감지'} -> ${targetLanguage}`);
            
            // 메시지 캐시 키 (별도 캐싱을 위한 키)
            const msgCacheKey = `msg_${message.id}_${targetLanguage}`;
            
            // 메시지 번역 캐시 확인
            if (translationCache.has(msgCacheKey)) {
                console.log('캐시된 메시지 번역 결과 사용');
                return translationCache.get(msgCacheKey);
            }
            
            // 메시지 텍스트 번역
            const { translatedText, detectedLanguage, isError, isSameLanguage } = await translateText(
                message.message, 
                targetLanguage, 
                message.language
            );
            
            // 번역 결과 구성
            const translatedMessage = {
                ...message,
                original_message: message.message,
                message: translatedText,
                translated: !isError && !isSameLanguage,
                target_language: targetLanguage,
                language: message.language || detectedLanguage
            };
            
            // 결과 캐싱 (메시지 ID별 캐싱)
            translationCache.set(msgCacheKey, translatedMessage);
            
            return translatedMessage;
        } catch (error) {
            console.error('메시지 번역 실패:', error);
            // 오류 발생 시 원본 메시지 반환
            return { ...message, translated: false, translation_error: true };
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
        
        // 대상 언어가 없는 경우 기본값 사용
        targetLanguage = targetLanguage || defaultLanguage;
        
        try {
            // 메시지별 번역 요청을 나누어 처리 (성능 최적화)
            const translatedMessages = [];
            const batchSize = 5; // 동시에 처리할 메시지 수
            
            for (let i = 0; i < messages.length; i += batchSize) {
                const batch = messages.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                    batch.map(message => translateMessage(message, targetLanguage))
                );
                translatedMessages.push(...batchResults);
            }
            
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
            // 번역 결과가 예상된 형태인지 확인 (대략적인 검증)
            const validResults = ['안녕하세요', '안녕', '안녕하십니까', 'Hello'];
            return validResults.some(r => translatedText.includes(r));
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
    
    /**
     * 번역 서비스 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    const initialize = async () => {
        try {
            // API 연결 테스트
            const connected = await testConnection();
            
            if (!connected) {
                console.warn('번역 API 연결 실패. 오프라인 모드로 작동합니다.');
                return false;
            }
            
            console.log('번역 서비스 초기화 완료');
            return true;
        } catch (error) {
            console.error('번역 서비스 초기화 실패:', error);
            return false;
        }
    };
    
    // 서비스 초기화
    initialize();
    
    // 공개 API
    return {
        getSupportedLanguages,
        getLanguageName,
        translateText,
        translateMessage,
        translateMessages,
        testConnection,
        clearCache,
        detectLanguage
    };
})();
