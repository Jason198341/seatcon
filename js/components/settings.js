/**
 * 설정 컴포넌트
 * 애플리케이션 설정 관리 및 설정 UI
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
        this.elements = {
            settingsModal: null,
            settingsForm: null,
            closeSettingsBtn: null,
            languageSelect: null,
            themeSelect: null,
            notificationAll: null,
            notificationMention: null,
            notificationSound: null,
            fontSizeRange: null,
            saveSettingsBtn: null,
        };
        
        this.init();
    }

    /**
     * 설정 컴포넌트 초기화
     */
    init() {
        try {
            this.logger.info('설정 컴포넌트 초기화 중...');
            
            // DOM 요소 참조 가져오기
            this.elements.settingsModal = document.getElementById('settings-modal');
            this.elements.settingsForm = document.getElementById('settings-form');
            this.elements.closeSettingsBtn = document.getElementById('close-settings');
            this.elements.languageSelect = document.getElementById('settings-language');
            this.elements.themeSelect = document.getElementById('settings-theme');
            this.elements.notificationAll = document.getElementById('settings-notification-all');
            this.elements.notificationMention = document.getElementById('settings-notification-mention');
            this.elements.notificationSound = document.getElementById('settings-notification-sound');
            this.elements.fontSizeRange = document.getElementById('settings-fontsize');
            this.elements.saveSettingsBtn = this.elements.settingsForm?.querySelector('button[type="submit"]');
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 현재 설정 불러오기
            this.loadSettings();
            
            this.logger.info('설정 컴포넌트 초기화 완료');
        } catch (error) {
            this.logger.error('설정 컴포넌트 초기화 중 오류 발생:', error);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        try {
            // 모달 닫기 버튼 이벤트
            this.elements.closeSettingsBtn?.addEventListener('click', this.closeModal.bind(this));
            
            // 설정 폼 제출 이벤트
            this.elements.settingsForm?.addEventListener('submit', this.handleFormSubmit.bind(this));
            
            // 폰트 크기 변경 시 즉시 적용
            this.elements.fontSizeRange?.addEventListener('input', this.handleFontSizeChange.bind(this));
            
            // ESC 키로 모달 닫기
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.isModalOpen()) {
                    this.closeModal();
                }
            });
            
            // 모달 외부 클릭 시 닫기
            this.elements.settingsModal?.addEventListener('click', (event) => {
                if (event.target === this.elements.settingsModal) {
                    this.closeModal();
                }
            });
        } catch (error) {
            this.logger.error('이벤트 리스너 설정 중 오류 발생:', error);
        }
    }

    /**
     * 현재 설정 불러오기
     */
    loadSettings() {
        try {
            // 언어 설정 불러오기
            const currentUser = this.userService.getCurrentUser();
            if (currentUser && currentUser.language && this.elements.languageSelect) {
                this.elements.languageSelect.value = currentUser.language;
            }
            
            // 테마 설정 불러오기
            const theme = this.userService.getThemeSetting();
            if (theme && this.elements.themeSelect) {
                this.elements.themeSelect.value = theme;
            }
            
            // 알림 설정 불러오기
            const notifications = this.userService.getNotificationSettings();
            if (notifications) {
                if (this.elements.notificationAll) {
                    this.elements.notificationAll.checked = notifications.all;
                }
                
                if (this.elements.notificationMention) {
                    this.elements.notificationMention.checked = notifications.mention;
                }
                
                if (this.elements.notificationSound) {
                    this.elements.notificationSound.checked = notifications.sound;
                }
            }
            
            // 폰트 크기 설정 불러오기
            const fontSize = this.userService.getFontSize();
            if (this.elements.fontSizeRange) {
                this.elements.fontSizeRange.value = fontSize;
            }
            
            this.logger.debug('설정 불러오기 완료');
        } catch (error) {
            this.logger.error('설정 불러오기 중 오류 발생:', error);
        }
    }

    /**
     * 폼 제출 처리
     * @param {Event} event - 이벤트 객체
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            // 로딩 표시
            this.setLoading(true);
            
            // 폼 데이터 가져오기
            const language = this.elements.languageSelect.value;
            const theme = this.elements.themeSelect.value;
            const notificationAll = this.elements.notificationAll.checked;
            const notificationMention = this.elements.notificationMention.checked;
            const notificationSound = this.elements.notificationSound.checked;
            const fontSize = this.elements.fontSizeRange.value;
            
            // 설정 적용
            
            // 1. 언어 설정 변경
            if (language) {
                await this.chatManager.changeLanguage(language);
            }
            
            // 2. 테마 설정 변경
            if (theme) {
                this.userService.changeTheme(theme);
                this.applyTheme(theme);
            }
            
            // 3. 알림 설정 변경
            this.userService.changeNotificationSettings({
                all: notificationAll,
                mention: notificationMention,
                sound: notificationSound,
            });
            
            // 4. 폰트 크기 설정 변경
            this.userService.changeFontSize(fontSize);
            this.applyFontSize(fontSize);
            
            // 설정 변경 이벤트 발생
            const event = new CustomEvent('settings:updated', {
                detail: {
                    language,
                    theme,
                    notifications: {
                        all: notificationAll,
                        mention: notificationMention,
                        sound: notificationSound,
                    },
                    fontSize,
                },
            });
            document.dispatchEvent(event);
            
            this.logger.info('설정 저장 완료');
            
            // 모달 닫기
            this.closeModal();
            
            // 성공 메시지 표시
            const successEvent = new CustomEvent('settings:success', {
                detail: { message: '설정이 저장되었습니다.' },
            });
            document.dispatchEvent(successEvent);
        } catch (error) {
            this.logger.error('설정 저장 중 오류 발생:', error);
            
            // 오류 메시지 표시
            const errorEvent = new CustomEvent('settings:error', {
                detail: { message: '설정 저장 중 오류가 발생했습니다. 다시 시도해주세요.' },
            });
            document.dispatchEvent(errorEvent);
        } finally {
            // 로딩 해제
            this.setLoading(false);
        }
    }

    /**
     * 폰트 크기 변경 이벤트 처리
     * @param {Event} event - 이벤트 객체
     */
    handleFontSizeChange(event) {
        try {
            const fontSize = event.target.value;
            
            // 폰트 크기 미리보기 적용
            this.applyFontSize(fontSize);
            
            this.logger.debug(`폰트 크기 변경: ${fontSize}`);
        } catch (error) {
            this.logger.error('폰트 크기 변경 이벤트 처리 중 오류 발생:', error);
        }
    }

    /**
     * 테마 적용
     * @param {string} theme - 테마 (light, dark, system)
     */
    applyTheme(theme) {
        try {
            const html = document.documentElement;
            
            // 기존 테마 클래스 제거
            html.classList.remove('theme-light', 'theme-dark');
            
            if (theme === 'system') {
                // 시스템 설정 사용
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                html.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
                document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
                // 사용자 설정 사용
                html.classList.add(`theme-${theme}`);
                document.body.setAttribute('data-theme', theme);
            }
            
            this.logger.debug(`테마 적용: ${theme}`);
        } catch (error) {
            this.logger.error('테마 적용 중 오류 발생:', error);
        }
    }

    /**
     * 폰트 크기 적용
     * @param {number|string} size - 폰트 크기 (1-5)
     */
    applyFontSize(size) {
        try {
            const sizeNum = parseInt(size, 10);
            
            if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 5) {
                this.logger.warn(`유효하지 않은 폰트 크기: ${size}`);
                return;
            }
            
            const body = document.body;
            
            // 기존 폰트 크기 클래스 제거
            body.classList.remove('font-size-1', 'font-size-2', 'font-size-3', 'font-size-4', 'font-size-5');
            
            // 새 폰트 크기 클래스 추가
            body.classList.add(`font-size-${sizeNum}`);
            
            this.logger.debug(`폰트 크기 적용: ${sizeNum}`);
        } catch (error) {
            this.logger.error('폰트 크기 적용 중 오류 발생:', error);
        }
    }

    /**
     * 설정 모달 열기
     */
    openModal() {
        try {
            if (!this.elements.settingsModal) return;
            
            // 현재 설정 다시 불러오기
            this.loadSettings();
            
            // 모달 표시
            this.elements.settingsModal.classList.remove('hidden');
            
            this.logger.debug('설정 모달 열기');
        } catch (error) {
            this.logger.error('설정 모달 열기 중 오류 발생:', error);
        }
    }

    /**
     * 설정 모달 닫기
     */
    closeModal() {
        try {
            if (!this.elements.settingsModal) return;
            
            // 모달 숨기기
            this.elements.settingsModal.classList.add('hidden');
            
            this.logger.debug('설정 모달 닫기');
        } catch (error) {
            this.logger.error('설정 모달 닫기 중 오류 발생:', error);
        }
    }

    /**
     * 모달 열림 여부 확인
     * @returns {boolean} - 모달 열림 여부
     */
    isModalOpen() {
        if (!this.elements.settingsModal) return false;
        
        return !this.elements.settingsModal.classList.contains('hidden');
    }

    /**
     * 로딩 상태 설정
     * @param {boolean} isLoading - 로딩 중 여부
     */
    setLoading(isLoading) {
        if (!this.elements.saveSettingsBtn) return;
        
        if (isLoading) {
            this.elements.saveSettingsBtn.disabled = true;
            this.elements.saveSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리 중...';
        } else {
            this.elements.saveSettingsBtn.disabled = false;
            this.elements.saveSettingsBtn.innerHTML = '저장';
        }
    }
}
