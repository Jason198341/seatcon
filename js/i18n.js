/**
 * 다국어 처리 모듈
 * 
 * 애플리케이션의 다국어 지원 기능을 제공합니다.
 * 현재 지원 언어: 영어(기본), 한국어, 힌디어, 중국어
 */

import CONFIG from './config.js';

// 번역 데이터
const translations = {
    // 영어 (기본 언어)
    en: {
        // 헤더
        'conferenceTitle': '2025 Global Seat Conference',
        'conferenceDate': 'June 16-19, 2025',
        'conferenceLocation': 'Indian Institute of Technology, Hyderabad',
        
        // 버튼 및 링크
        'logoutButton': 'Logout',
        'startChatButton': 'Start Chat',
        'loadMoreButton': 'Load More Messages',
        'sendButton': 'Send',
        
        // 사용자 정보 폼
        'startChatHeading': 'Start Chatting',
        'startChatSubtext': 'Please enter your information to join the chat.',
        'nameLabel': 'Name',
        'namePlaceholder': 'Enter your name',
        'emailLabel': 'Email',
        'emailPlaceholder': 'Enter your email',
        'roleLabel': 'Role',
        'rolePlaceholder': 'Select your role',
        'languageLabel': 'Preferred Language',
        'languagePlaceholder': 'Select language',
        'staffPasswordLabel': 'Staff Password',
        'staffPasswordPlaceholder': 'Enter staff password',
        'staffPasswordHelp': 'Password is required to login as staff.',
        'staffPasswordError': 'Staff password is incorrect.',
        
        // 채팅
        'chatTitle': 'Live Chat',
        'messagePlaceholder': 'Type your message...',
        'emptyStateTitle': 'No messages yet',
        'emptyStateText': 'Be the first to send a message!',
        'newMessageNotification': 'New message',
        
        // 역할
        'role_attendee': 'Attendee',
        'role_staff': 'Staff',
        
        // 에러 메시지
        'errorNameRequired': 'Name is required (minimum 2 characters).',
        'errorEmailRequired': 'Valid email address is required.',
        'errorEmailInvalid': 'Please enter a valid email address.',
        'errorRoleRequired': 'Please select a role.',
        'errorMessageTooLong': 'Message can be up to {maxLength} characters.',
        'errorMessageEmpty': 'Message cannot be empty.',
        'errorLoginRequired': 'You need to be logged in to send messages.',
        
        // 하단 네비게이션
        'navChat': 'Chat',
        'navProfile': 'Profile',
        'navLanguage': 'Language',
        'navInfo': 'Info'
    },
    
    // 한국어
    ko: {
        // 헤더
        'conferenceTitle': '2025 글로벌 시트 컨퍼런스',
        'conferenceDate': '2025년 6월 16일~19일',
        'conferenceLocation': '인도 하이데라바드 인도기술연구소',
        
        // 버튼 및 링크
        'logoutButton': '로그아웃',
        'startChatButton': '채팅 시작하기',
        'loadMoreButton': '이전 메시지 더 보기',
        'sendButton': '전송',
        
        // 사용자 정보 폼
        'startChatHeading': '채팅 시작하기',
        'startChatSubtext': '채팅에 참여하기 위해 아래 정보를 입력해주세요.',
        'nameLabel': '이름',
        'namePlaceholder': '이름을 입력하세요',
        'emailLabel': '이메일',
        'emailPlaceholder': '이메일을 입력하세요',
        'roleLabel': '역할',
        'rolePlaceholder': '역할을 선택하세요',
        'languageLabel': '선호 언어',
        'languagePlaceholder': '언어를 선택하세요',
        'staffPasswordLabel': '스태프 비밀번호',
        'staffPasswordPlaceholder': '스태프 비밀번호를 입력하세요',
        'staffPasswordHelp': '스태프로 로그인하려면 비밀번호가 필요합니다.',
        'staffPasswordError': '스태프 비밀번호가 올바르지 않습니다.',
        
        // 채팅
        'chatTitle': '실시간 채팅',
        'messagePlaceholder': '메시지를 입력하세요...',
        'emptyStateTitle': '아직 메시지가 없습니다',
        'emptyStateText': '첫 메시지를 작성해보세요!',
        'newMessageNotification': '새 메시지',
        
        // 역할
        'role_attendee': '참가자',
        'role_staff': '스태프',
        
        // 에러 메시지
        'errorNameRequired': '이름은 2자 이상 입력해주세요.',
        'errorEmailRequired': '이메일 주소를 입력해주세요.',
        'errorEmailInvalid': '유효한 이메일 주소를 입력해주세요.',
        'errorRoleRequired': '역할을 선택해주세요.',
        'errorMessageTooLong': '메시지는 최대 {maxLength}자까지 입력 가능합니다.',
        'errorMessageEmpty': '메시지를 입력해주세요.',
        'errorLoginRequired': '메시지를 보내려면 로그인이 필요합니다.',
        
        // 하단 네비게이션
        'navChat': '채팅',
        'navProfile': '내 정보',
        'navLanguage': '언어',
        'navInfo': '정보'
    },
    
    // 힌디어
    hi: {
        // 헤더
        'conferenceTitle': '2025 वैश्विक सीट सम्मेलन',
        'conferenceDate': '16-19 जून, 2025',
        'conferenceLocation': 'भारतीय प्रौद्योगिकी संस्थान, हैदराबाद',
        
        // 버튼 및 링크
        'logoutButton': 'लॉगआउट',
        'startChatButton': 'चैट शुरू करें',
        'loadMoreButton': 'अधिक संदेश लोड करें',
        'sendButton': 'भेजें',
        
        // 사용자 정보 폼
        'startChatHeading': 'चैटिंग शुरू करें',
        'startChatSubtext': 'चैट में शामिल होने के लिए कृपया नीचे दी गई जानकारी दर्ज करें।',
        'nameLabel': 'नाम',
        'namePlaceholder': 'अपना नाम दर्ज करें',
        'emailLabel': 'ईमेल',
        'emailPlaceholder': 'अपना ईमेल दर्ज करें',
        'roleLabel': 'भूमिका',
        'rolePlaceholder': 'अपनी भूमिका चुनें',
        'languageLabel': 'पसंदीदा भाषा',
        'languagePlaceholder': 'भाषा चुनें',
        'staffPasswordLabel': 'स्टाफ पासवर्ड',
        'staffPasswordPlaceholder': 'स्टाफ पासवर्ड दर्ज करें',
        'staffPasswordHelp': 'स्टाफ के रूप में लॉगिन करने के लिए पासवर्ड आवश्यक है।',
        'staffPasswordError': 'स्टाफ पासवर्ड गलत है।',
        
        // 채팅
        'chatTitle': 'लाइव चैट',
        'messagePlaceholder': 'अपना संदेश लिखें...',
        'emptyStateTitle': 'अभी तक कोई संदेश नहीं',
        'emptyStateText': 'पहला संदेश भेजने वाले बनें!',
        'newMessageNotification': 'नया संदेश',
        
        // 역할
        'role_attendee': 'प्रतिभागी',
        'role_staff': 'स्टाफ',
        
        // 에러 메시지
        'errorNameRequired': 'नाम आवश्यक है (कम से कम 2 अक्षर)।',
        'errorEmailRequired': 'वैध ईमेल पता आवश्यक है।',
        'errorEmailInvalid': 'कृपया एक वैध ईमेल पता दर्ज करें।',
        'errorRoleRequired': 'कृपया एक भूमिका चुनें।',
        'errorMessageTooLong': 'संदेश अधिकतम {maxLength} अक्षरों का हो सकता है।',
        'errorMessageEmpty': 'संदेश खाली नहीं हो सकता।',
        'errorLoginRequired': 'संदेश भेजने के लिए आपको लॉगिन करना होगा।',
        
        // 하단 네비게이션
        'navChat': 'चैट',
        'navProfile': 'प्रोफ़ाइल',
        'navLanguage': 'भाषा',
        'navInfo': 'जानकारी'
    },
    
    // 중국어
    zh: {
        // 헤더
        'conferenceTitle': '2025 全球座椅会议',
        'conferenceDate': '2025年6月16日-19日',
        'conferenceLocation': '印度海得拉巴印度理工学院',
        
        // 버튼 및 링크
        'logoutButton': '登出',
        'startChatButton': '开始聊天',
        'loadMoreButton': '加载更多消息',
        'sendButton': '发送',
        
        // 사용자 정보 폼
        'startChatHeading': '开始聊天',
        'startChatSubtext': '请输入您的信息以加入聊天。',
        'nameLabel': '姓名',
        'namePlaceholder': '输入您的姓名',
        'emailLabel': '电子邮件',
        'emailPlaceholder': '输入您的电子邮件',
        'roleLabel': '角色',
        'rolePlaceholder': '选择您的角色',
        'languageLabel': '首选语言',
        'languagePlaceholder': '选择语言',
        'staffPasswordLabel': '工作人员密码',
        'staffPasswordPlaceholder': '输入工作人员密码',
        'staffPasswordHelp': '需要密码才能以工作人员身份登录。',
        'staffPasswordError': '工作人员密码不正确。',
        
        // 채팅
        'chatTitle': '实时聊天',
        'messagePlaceholder': '输入您的消息...',
        'emptyStateTitle': '暂无消息',
        'emptyStateText': '成为第一个发送消息的人！',
        'newMessageNotification': '新消息',
        
        // 역할
        'role_attendee': '参与者',
        'role_staff': '工作人员',
        
        // 에러 메시지
        'errorNameRequired': '需要姓名（至少2个字符）。',
        'errorEmailRequired': '需要有效的电子邮件地址。',
        'errorEmailInvalid': '请输入有效的电子邮件地址。',
        'errorRoleRequired': '请选择一个角色。',
        'errorMessageTooLong': '消息最多可包含{maxLength}个字符。',
        'errorMessageEmpty': '消息不能为空。',
        'errorLoginRequired': '您需要登录才能发送消息。',
        
        // 하단 네비게이션
        'navChat': '聊天',
        'navProfile': '个人资料',
        'navLanguage': '语言',
        'navInfo': '信息'
    }
};

class I18nService {
    constructor() {
        this.currentLanguage = 'en'; // 기본 언어: 영어
        this.translations = translations;
        
        // 저장된 언어 설정 불러오기
        this.loadSavedLanguage();
    }
    
    /**
     * 저장된 언어 설정 불러오기
     */
    loadSavedLanguage() {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
            this.currentLanguage = savedLanguage;
        }
    }
    
    /**
     * 언어 설정
     * @param {string} languageCode - 언어 코드
     * @param {boolean} triggerEvent - 이벤트 발생 여부 (기본값: false)
     * @returns {boolean} - 성공 여부
     */
    setLanguage(languageCode, triggerEvent = false) {
        if (!this.isLanguageSupported(languageCode)) {
            console.error(`Unsupported language: ${languageCode}`);
            return false;
        }
        
        this.currentLanguage = languageCode;
        localStorage.setItem('preferredLanguage', languageCode);
        
        // 이벤트 발생 여부 확인
        if (triggerEvent) {
            // 언어 변경 이벤트 발생
            window.dispatchEvent(new CustomEvent('language-changed', {
                detail: { language: languageCode }
            }));
        }
        
        return true;
    }
    
    /**
     * 현재 언어 가져오기
     * @returns {string} - 현재 언어 코드
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * 지원되는 언어인지 확인
     * @param {string} languageCode - 언어 코드
     * @returns {boolean} - 지원 여부
     */
    isLanguageSupported(languageCode) {
        return CONFIG.LANGUAGES.some(lang => lang.code === languageCode);
    }
    
    /**
     * 번역 가져오기
     * @param {string} key - 번역 키
     * @param {Object} params - 치환 매개변수
     * @returns {string} - 번역된 문자열
     */
    get(key, params = {}) {
        const language = this.currentLanguage;
        
        // 번역 데이터에서 키 찾기
        let translation = '';
        if (this.translations[language] && this.translations[language][key]) {
            translation = this.translations[language][key];
        } else if (this.translations['en'] && this.translations['en'][key]) {
            // 번역이 없으면 영어 기본값 사용
            translation = this.translations['en'][key];
        } else {
            // 번역이 없으면 키 자체 반환
            return key;
        }
        
        // 매개변수 치환
        for (const param in params) {
            translation = translation.replace(`{${param}}`, params[param]);
        }
        
        return translation;
    }
    
    /**
     * 모든 텍스트 요소 번역 적용
     */
    updateAllTexts() {
        // 제목 요소 업데이트
        const titleElements = document.querySelectorAll('[data-i18n]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.textContent = this.get(key);
            }
        });
        
        // 입력 요소 업데이트
        const inputElements = document.querySelectorAll('[data-i18n-placeholder]');
        inputElements.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.placeholder = this.get(key);
            }
        });
        
        // 버튼 텍스트 업데이트
        const buttonElements = document.querySelectorAll('button[data-i18n]');
        buttonElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                // 버튼 내부의 아이콘은 유지
                const iconElement = el.querySelector('i');
                if (iconElement) {
                    el.innerHTML = '';
                    el.appendChild(iconElement);
                    el.appendChild(document.createTextNode(' ' + this.get(key)));
                } else {
                    el.textContent = this.get(key);
                }
            }
        });
        
        // 라벨 업데이트
        const labelElements = document.querySelectorAll('label[data-i18n]');
        labelElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.textContent = this.get(key);
            }
        });
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const i18nService = new I18nService();
export default i18nService;
