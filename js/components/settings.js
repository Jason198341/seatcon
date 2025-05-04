/**
 * 설정 컴포넌트
 * 사용자 설정 관리 기능
 */
class SettingsComponent {
    /**
     * 설정 컴포넌트 생성자
     * @param {Object} userService - 사용자 서비스
     * @param {Object} chatManager - 채팅 관리자
     * @param {Object} logger - 로거 서비스
     */
    constructor(userService, chatManager, logger) {
        this.userService = userService;
        this.chatManager = chatManager;
        this.logger = logger || console;
        this.modal = document.getElementById('settings-modal');
        this.form = document.getElementById('settings-form');
        this.closeBtn = document.getElementById('close-settings');
        this.themeSelector = document.getElementById('settings-theme');
        this.languageSelector = document.getElementById('settings-language');
        this.fontSizeSlider = document.getElementById('settings-fontsize');
        this.notificationAll = document.getElementById('settings-notification-all');
        this.notificationMention = document.getElementById('settings-notification-mention');
        this.notificationSound = document.getElementById('settings-notification-sound');
        this.currentTheme = localStorage.getItem('premium-chat-theme') || 'system';
        this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.init();
    }
    
    /**
     * 설정 컴포넌트 초기화
     */
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.applyTheme();
        
        // 시스템 테마 변경 감지
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            this.systemPrefersDark = e.matches;
            if (this.currentTheme === 'system') {
                this.applyTheme();
            }
        });
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모달 닫기 버튼
        this.closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        // 설정 저장
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.saveSettings();
        });
        
        // 테마 설정 변경
        this.themeSelector.addEventListener('change', () => {
            this.currentTheme = this.themeSelector.value;
            this.applyTheme();
        });
        
        // 폰트 크기 변경
        this.fontSizeSlider.addEventListener('input', () => {
            this.applyFontSize();
        });
        
        // 모달 외부 클릭 시 닫기
        this.modal.addEventListener('click', e => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // ESC 키 입력 시 모달 닫기
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }
    
    /**
     * 설정 불러오기
     */
    loadSettings() {
        try {
            // 테마 설정 불러오기
            const savedTheme = localStorage.getItem('premium-chat-theme');
            this.themeSelector.value = savedTheme || 'system';
            this.currentTheme = savedTheme || 'system';
            
            // 언어 설정 불러오기
            const currentUser = this.userService.getCurrentUser();
            if (currentUser && currentUser.language) {
                this.languageSelector.value = currentUser.language;
            }
            
            // 폰트 크기 불러오기
            const fontSize = localStorage.getItem('premium-chat-font-size') || '3';
            this.fontSizeSlider.value = fontSize;
            
            // 알림 설정 불러오기
            const notificationSettings = JSON.parse(localStorage.getItem('premium-chat-notifications') || '{}');
            this.notificationAll.checked = notificationSettings.all || false;
            this.notificationMention.checked = notificationSettings.mention || false;
            this.notificationSound.checked = notificationSettings.sound || false;
            
            this.logger.info('설정 로드 완료');
        } catch (error) {
            this.logger.error('설정 로드 중 오류 발생:', error);
        }
    }
    
    /**
     * 설정 저장
     */
    saveSettings() {
        try {
            // 테마 설정 저장
            localStorage.setItem('premium-chat-theme', this.currentTheme);
            
            // 언어 설정 저장
            const language = this.languageSelector.value;
            this.chatManager.changeLanguage(language);
            
            // 폰트 크기 저장
            localStorage.setItem('premium-chat-font-size', this.fontSizeSlider.value);
            
            // 알림 설정 저장
            const notificationSettings = {
                all: this.notificationAll.checked,
                mention: this.notificationMention.checked,
                sound: this.notificationSound.checked,
            };
            localStorage.setItem('premium-chat-notifications', JSON.stringify(notificationSettings));
            
            // 설정 적용
            this.applyTheme();
            this.applyFontSize();
            
            // 성공 이벤트 발생
            const settingsUpdatedEvent = new CustomEvent('settings:success', {
                detail: {
                    message: '설정이 저장되었습니다.'
                }
            });
            document.dispatchEvent(settingsUpdatedEvent);
            
            // 모달 닫기
            this.closeModal();
            
            this.logger.info('설정 저장 완료');
        } catch (error) {
            this.logger.error('설정 저장 중 오류 발생:', error);
            
            // 오류 이벤트 발생
            const settingsErrorEvent = new CustomEvent('settings:error', {
                detail: {
                    message: '설정 저장 중 오류가 발생했습니다.'
                }
            });
            document.dispatchEvent(settingsErrorEvent);
        }
    }
    
    /**
     * 테마 적용
     */
    applyTheme() {
        try {
            let theme = this.currentTheme;
            
            // 시스템 설정 사용
            if (theme === 'system') {
                theme = this.systemPrefersDark ? 'dark' : 'light';
            }
            
            // 애니메이션 효과를 위한 클래스 추가
            document.body.classList.add('theme-transition');
            
            // 테마 적용
            document.documentElement.setAttribute('data-theme', theme);
            
            // 애니메이션 효과 제거 (0.5초 후)
            setTimeout(() => {
                document.body.classList.remove('theme-transition');
            }, 500);
            
            this.logger.info(`테마 적용: ${theme}`);
        } catch (error) {
            this.logger.error('테마 적용 중 오류 발생:', error);
        }
    }
    
    /**
     * 폰트 크기 적용
     */
    applyFontSize() {
        try {
            const fontSize = this.fontSizeSlider.value;
            const fontSizeValues = {
                '1': '14px',
                '2': '15px',
                '3': '16px',
                '4': '17px',
                '5': '18px'
            };
            
            document.documentElement.style.fontSize = fontSizeValues[fontSize] || '16px';
            
            this.logger.info(`폰트 크기 적용: ${fontSizeValues[fontSize]}`);
        } catch (error) {
            this.logger.error('폰트 크기 적용 중 오류 발생:', error);
        }
    }
    
    /**
     * 모달 열기
     */
    openModal() {
        this.loadSettings();
        this.modal.classList.remove('hidden');
        this.modal.classList.add('animate-fade-in');
    }
    
    /**
     * 모달 닫기
     */
    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('animate-fade-in');
    }
    
    /**
     * 시스템 테마 가져오기
     * @returns {string} - 테마 ('light' 또는 'dark')
     */
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    /**
     * 현재 테마 가져오기
     * @returns {string} - 테마 ('light' 또는 'dark')
     */
    getCurrentTheme() {
        let theme = this.currentTheme;
        
        if (theme === 'system') {
            theme = this.getSystemTheme();
        }
        
        return theme;
    }
}