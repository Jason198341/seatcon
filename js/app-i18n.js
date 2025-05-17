/**
 * 다국어 처리 모듈
 * 애플리케이션의 다국어 지원 및 인터페이스 번역을 담당합니다.
 */

class I18nService {
    constructor() {
        this.translations = {};
        this.currentLanguage = 'ko'; // 기본 언어: 한국어
        this.supportedLanguages = ['ko', 'en', 'ja', 'zh']; // 지원하는 언어 목록
        this.onLanguageChange = null;
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            // LocalStorage에서 언어 설정 불러오기
            this.loadLanguagePreference();
            
            // 번역 데이터 로드
            await this.loadTranslations();
            
            // 초기 인터페이스 번역 적용
            this.translateInterface();
            
            return true;
        } catch (error) {
            console.error('Error initializing i18n service:', error);
            return false;
        }
    }

    /**
     * 번역 데이터 로드
     * @returns {Promise<boolean>} 로드 성공 여부
     * @private
     */
    async loadTranslations() {
        try {
            // 번역 JSON 파일 로드
            const response = await fetch('locales/translations.json');
            const data = await response.json();
            
            this.translations = data;
            return true;
        } catch (error) {
            console.error('Error loading translations:', error);
            return false;
        }
    }

    /**
     * LocalStorage에서 언어 설정 불러오기
     * @private
     */
    loadLanguagePreference() {
        try {
            const savedLanguage = localStorage.getItem('language');
            if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
                this.currentLanguage = savedLanguage;
            }
        } catch (error) {
            console.error('Error loading language preference:', error);
        }
    }

    /**
     * 언어 설정을 LocalStorage에 저장
     * @private
     */
    saveLanguagePreference() {
        try {
            localStorage.setItem('language', this.currentLanguage);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    }

    /**
     * 현재 언어 설정 가져오기
     * @returns {string} 현재 언어 코드
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * 언어 변경
     * @param {string} language 언어 코드
     * @returns {boolean} 변경 성공 여부
     */
    setLanguage(language) {
        // 지원하지 않는 언어면 변경하지 않음
        if (!this.supportedLanguages.includes(language)) {
            return false;
        }
        
        this.currentLanguage = language;
        this.saveLanguagePreference();
        
        // 인터페이스 번역 적용
        this.translateInterface();
        
        // 콜백 호출
        if (this.onLanguageChange) {
            this.onLanguageChange(language);
        }
        
        return true;
    }

    /**
     * 지원하는 언어 목록 가져오기
     * @returns {Array} 언어 코드 목록
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * 언어가 지원되는지 확인
     * @param {string} language 언어 코드
     * @returns {boolean} 지원 여부
     */
    isLanguageSupported(language) {
        return this.supportedLanguages.includes(language);
    }

    /**
     * 번역 키에 해당하는 문자열 가져오기
     * @param {string} key 번역 키
     * @returns {string} 번역된 문자열
     */
    translate(key) {
        if (!this.translations[this.currentLanguage]) {
            return key;
        }
        
        return this.translations[this.currentLanguage][key] || key;
    }

    /**
     * 인터페이스 전체 번역 적용
     */
    translateInterface() {
        // data-i18n 속성이 있는 모든 요소 선택
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.translate(key);
        });
        
        // data-i18n-placeholder 속성이 있는 입력 요소 선택
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        
        placeholders.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.translate(key);
        });
        
        // 언어 선택 드롭다운 업데이트
        const languageSelectors = document.querySelectorAll('#language-select, #chat-language-select');
        
        languageSelectors.forEach(selector => {
            selector.value = this.currentLanguage;
        });
    }

    /**
     * 언어 변경 콜백 설정
     * @param {Function} callback 언어 변경 시 호출될 콜백 함수
     */
    setLanguageChangeCallback(callback) {
        this.onLanguageChange = callback;
    }

    /**
     * 언어 코드에 해당하는 언어 이름 가져오기
     * @param {string} code 언어 코드
     * @returns {string} 언어 이름
     */
    getLanguageName(code) {
        const names = {
            'ko': '한국어',
            'en': 'English',
            'ja': '日本語',
            'zh': '中文'
        };
        
        return names[code] || code;
    }
}

// 싱글톤 인스턴스 생성
const i18nService = new I18nService();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    i18nService.initialize();
});
