/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 번역 서비스 통합
 * 작성일: 2025-05-07
 */

// Google Cloud Translation API 키
const GOOGLE_TRANSLATION_API_KEY = 'AIzaSyC8ugZVxiEk26iwvUnIQCzNcTUiYpxkigs';

// 지원되는 언어 코드
const SUPPORTED_LANGUAGES = {
    'ko': '한국어',
    'en': 'English',
    'hi': 'हिन्दी',
    'zh': '中文'
};

// 언어 코드 매핑 (Google API와 일치)
const LANGUAGE_CODE_MAP = {
    'ko': 'ko',
    'en': 'en',
    'hi': 'hi',
    'zh': 'zh-CN'
};

// 번역 요청 및 캐시 처리를 위한 클래스
class TranslationService {
    constructor() {
        // 로컬 캐시 (세션 간 유지)
        this.localCache = this._loadLocalCache();
        
        // 요청 제한 관리
        this.requestQueue = [];
        this.isProcessing = false;
        this.requestLimit = 10; // 초당 최대 요청 수
        this.requestCount = 0;
        this.resetTime = Date.now();
        
        // 타임아웃 설정
        this.requestTimeout = 10000; // 10초
    }
    
    /**
     * 로컬 캐시 로드 함수
     * @private
     * @returns {Object} - 로컬 캐시 객체
     */
    _loadLocalCache() {
        try {
            const cache = localStorage.getItem('translationCache');
            return cache ? JSON.parse(cache) : {};
        } catch (error) {
            console.error('로컬 캐시 로드 오류:', error);
            return {};
        }
    }
    
    /**
     * 로컬 캐시 저장 함수
     * @private
     */
    _saveLocalCache() {
        try {
            localStorage.setItem('translationCache', JSON.stringify(this.localCache));
        } catch (error) {
            console.error('로컬 캐시 저장 오류:', error);
            // 저장소 공간 부족 등의 이유로 실패할 수 있으므로 오류 무시
        }
    }
    
    /**
     * 캐시 키 생성 함수
     * @private
     * @param {string} text - 원본 텍스트
     * @param {string} targetLanguage - 대상 언어
     * @returns {string} - 캐시 키
     */
    _getCacheKey(text, targetLanguage) {
        return `${text}|${targetLanguage}`;
    }
    
    /**
     * 언어 감지 함수
     * @param {string} text - 언어를 감지할 텍스트
     * @returns {Promise<string>} - 감지된 언어 코드
     */
    async detectLanguage(text) {
        // API 요청 제한 확인
        await this._checkRequestLimit();
        
        try {
            const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_TRANSLATION_API_KEY}`;
            
            const response = await Promise.race([
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        q: text
                    })
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Language detection request timed out')), this.requestTimeout)
                )
            ]);
            
            if (!response.ok) {
                throw new Error(`API 오류: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.data || !data.data.detections || data.data.detections.length === 0) {
                throw new Error('언어 감지 데이터 없음');
            }
            
            // API 응답 처리
            const detections = data.data.detections[0];
            
            if (!detections || detections.length === 0) {
                throw new Error('언어 감지 실패');
            }
            
            // 가장 신뢰도 높은 감지 결과
            const mostConfident = detections.reduce((prev, current) => 
                (current.confidence > prev.confidence) ? current : prev
            );
            
            // 지원되는 언어 코드인지 확인
            const languageCode = mostConfident.language;
            const supportedCode = Object.keys(LANGUAGE_CODE_MAP).find(code => 
                LANGUAGE_CODE_MAP[code].startsWith(languageCode)
            );
            
            return supportedCode || 'en'; // 미지원 언어는 영어로 기본 설정
        } catch (error) {
            console.error('언어 감지 오류:', error);
            // 오류 발생 시 기본값 반환
            return 'en';
        }
    }
    
    /**
     * 텍스트 번역 함수
     * @param {string} text - 번역할 텍스트
     * @param {string} targetLanguage - 대상 언어 코드
     * @param {string} sourceLanguage - 원본 언어 코드 (옵션)
     * @returns {Promise<string>} - 번역된 텍스트
     */
    async translateText(text, targetLanguage, sourceLanguage = null) {
        // 빈 텍스트 처리
        if (!text || text.trim() === '') {
            return '';
        }
        
        // 원본 언어와 대상 언어가 같으면 번역 불필요
        if (sourceLanguage && sourceLanguage === targetLanguage) {
            return text;
        }
        
        // 로컬 캐시 확인
        const cacheKey = this._getCacheKey(text, targetLanguage);
        if (this.localCache[cacheKey]) {
            console.log('로컬 캐시에서 번역 검색');
            return this.localCache[cacheKey];
        }
        
        // Supabase 캐시 확인
        try {
            const cachedTranslation = await window.supabaseService.getTranslationFromCache(text, targetLanguage);
            if (cachedTranslation) {
                console.log('Supabase 캐시에서 번역 검색');
                // 찾은 번역을 로컬 캐시에도 저장
                this.localCache[cacheKey] = cachedTranslation;
                this._saveLocalCache();
                return cachedTranslation;
            }
        } catch (error) {
            console.warn('Supabase 캐시 검색 오류:', error);
            // 캐시 검색 실패는 치명적 오류가 아니므로 계속 진행
        }
        
        // API 요청 제한 확인
        await this._checkRequestLimit();
        
        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATION_API_KEY}`;
            
            const requestBody = {
                q: text,
                target: LANGUAGE_CODE_MAP[targetLanguage]
            };
            
            // 원본 언어가 제공된 경우 추가
            if (sourceLanguage) {
                requestBody.source = LANGUAGE_CODE_MAP[sourceLanguage];
            }
            
            const response = await Promise.race([
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Translation request timed out')), this.requestTimeout)
                )
            ]);
            
            if (!response.ok) {
                throw new Error(`API 오류: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.data || !data.data.translations || data.data.translations.length === 0) {
                throw new Error('번역 데이터 없음');
            }
            
            const translatedText = data.data.translations[0].translatedText;
            
            // 로컬 캐시에 저장
            this.localCache[cacheKey] = translatedText;
            this._saveLocalCache();
            
            // Supabase 캐시에 비동기로 저장 (완료 대기하지 않음)
            window.supabaseService.cacheTranslation(text, targetLanguage, translatedText)
                .catch(error => console.warn('Supabase 캐시 저장 오류:', error));
            
            return translatedText;
        } catch (error) {
            console.error('번역 오류:', error);
            // 오류 발생 시 원본 텍스트 반환
            return text;
        }
    }
    
    /**
     * API 요청 제한 확인 함수
     * @private
     * @returns {Promise<void>}
     */
    async _checkRequestLimit() {
        // 현재 시간 확인
        const now = Date.now();
        
        // 1초마다 요청 카운터 초기화
        if (now - this.resetTime > 1000) {
            this.requestCount = 0;
            this.resetTime = now;
        }
        
        // 요청 제한 확인
        if (this.requestCount >= this.requestLimit) {
            // 다음 초까지 대기
            const waitTime = 1000 - (now - this.resetTime);
            await new Promise(resolve => setTimeout(resolve, waitTime > 0 ? waitTime : 0));
            // 카운터 초기화
            this.requestCount = 0;
            this.resetTime = Date.now();
        }
        
        // 요청 카운터 증가
        this.requestCount++;
    }
    
    /**
     * 메시지 번역 함수
     * @param {Object} message - 번역할 메시지 객체
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Object>} - 번역된 메시지 객체
     */
    async translateMessage(message, targetLanguage) {
        // 원본 메시지 복사
        const translatedMessage = { ...message };
        
        // 원본 언어와 대상 언어가 같으면 번역 불필요
        if (message.original_language === targetLanguage) {
            return translatedMessage;
        }
        
        try {
            // 메시지 내용 번역
            translatedMessage.translated_content = await this.translateText(
                message.content,
                targetLanguage,
                message.original_language
            );
            
            // 답장이 있는 경우 답장 내용도 번역
            if (message.reply_to && message.reply_to.content) {
                translatedMessage.reply_to = {
                    ...message.reply_to,
                    translated_content: await this.translateText(
                        message.reply_to.content,
                        targetLanguage
                    )
                };
            }
            
            return translatedMessage;
        } catch (error) {
            console.error('메시지 번역 오류:', error);
            // 오류 발생 시 원본 메시지 반환
            return translatedMessage;
        }
    }
    
    /**
     * 메시지 목록 번역 함수
     * @param {Array} messages - 번역할 메시지 목록
     * @param {string} targetLanguage - 대상 언어 코드
     * @returns {Promise<Array>} - 번역된 메시지 목록
     */
    async translateMessages(messages, targetLanguage) {
        try {
            // 병렬 처리로 모든 메시지 번역
            const translatedMessages = await Promise.all(
                messages.map(message => this.translateMessage(message, targetLanguage))
            );
            
            return translatedMessages;
        } catch (error) {
            console.error('메시지 목록 번역 오류:', error);
            // 오류 발생 시 원본 메시지 목록 반환
            return messages;
        }
    }
}

// 번역 서비스 인스턴스 생성 및 전역 노출
window.translationService = new TranslationService();

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('translationServiceLoaded'));
