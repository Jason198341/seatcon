/**
 * 사용자 관리 서비스
 * 사용자 인증 및 정보 관리 기능 제공
 */
class UserService {
    /**
     * 사용자 서비스 생성자
     * @param {Object} config - 애플리케이션 설정
     * @param {Object} logger - 로거 서비스
     */
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || console;
        this.currentUser = null;
    }

    /**
     * 사용자 서비스 초기화
     * @returns {Promise<boolean>} - 초기화 성공 여부
     */
    async init() {
        try {
            this.logger.info('사용자 서비스 초기화 중...');
            
            // 저장된 사용자 정보 확인
            const savedUser = this.getSavedUserInfo();
            
            if (savedUser) {
                this.currentUser = savedUser;
                this.logger.info('저장된 사용자 정보를 불러왔습니다:', savedUser);
            }
            
            this.logger.info('사용자 서비스 초기화 완료');
            return true;
        } catch (error) {
            this.logger.error('사용자 서비스 초기화 중 오류 발생:', error);
            throw new Error('사용자 서비스 초기화에 실패했습니다.');
        }
    }

    /**
     * 사용자 인증 처리
     * @param {Object} userInfo - 사용자 정보
     * @returns {Promise<boolean>} - 인증 성공 여부
     */
    async authenticate(userInfo) {
        try {
            if (!userInfo || !userInfo.name || !userInfo.email) {
                this.logger.warn('유효하지 않은 사용자 정보');
                return false;
            }
            
            // 관리자 확인 (관리자 비밀번호: 9881)
            if (userInfo.role === 'admin' && userInfo.password !== this.config.ADMIN.PASSWORD) {
                this.logger.warn('관리자 비밀번호 오류');
                return false;
            }
            
            // 현재 사용자 정보 설정
            this.currentUser = {
                ...userInfo,
                loginTime: new Date().toISOString()
            };
            
            // 로컬 스토리지에 사용자 정보 저장
            this.saveUserInfo(this.currentUser);
            
            // 참가자 온라인 상태 upsert (supabaseClient 필요)
            if (window.supabaseClient) {
                window.supabaseClient.upsertParticipantStatus({
                    email: userInfo.email,
                    name: userInfo.name,
                    role: userInfo.role,
                    language: userInfo.language,
                    isOnline: true
                });
            }
            
            // 성공 이벤트 발생
            const loginEvent = new CustomEvent('auth:login-success', {
                detail: { userInfo: this.currentUser }
            });
            document.dispatchEvent(loginEvent);
            
            this.logger.info('사용자 인증 성공:', this.currentUser);
            return true;
        } catch (error) {
            this.logger.error('사용자 인증 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 현재 사용자 정보 설정
     * @param {Object} userInfo - 사용자 정보
     * @returns {boolean} - 성공 여부
     */
    setCurrentUser(userInfo) {
        try {
            this.currentUser = userInfo;
            this.saveUserInfo(userInfo);
            this.logger.info('현재 사용자 정보 설정:', userInfo);
            return true;
        } catch (error) {
            this.logger.error('현재 사용자 정보 설정 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 현재 사용자 정보 가져오기
     * @returns {Object|null} - 사용자 정보 또는 null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 사용자가 관리자인지 확인
     * @returns {boolean} - 관리자 여부
     */
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    /**
     * 사용자가 통역사(interpreter)인지 확인
     * @returns {boolean} - 통역사 여부
     */
    isInterpreter() {
        return this.currentUser && this.currentUser.role === 'interpreter';
    }

    /**
     * 사용자 정보 검증
     * @param {Object} userInfo - 사용자 정보
     * @returns {Object} - 검증 결과 (isValid, errors)
     */
    validateUserInfo(userInfo) {
        const errors = {};
        
        // 이름 검증
        if (!userInfo.name || userInfo.name.trim().length === 0) {
            errors.name = '이름을 입력해주세요.';
        }
        
        // 이메일 검증
        if (!userInfo.email || userInfo.email.trim().length === 0) {
            errors.email = '이메일을 입력해주세요.';
        } else if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(userInfo.email)) {
            errors.email = '올바른 이메일 형식이 아닙니다.';
        }
        
        // 역할 검증
        const validRoles = ['attendee', 'exhibitor', 'presenter', 'staff', 'admin', 'interpreter'];
        if (!userInfo.role || !validRoles.includes(userInfo.role)) {
            errors.role = '올바른 역할을 선택해주세요.';
        }
        
        // 관리자인 경우 비밀번호 확인
        if (userInfo.role === 'admin' && 
            (!userInfo.password || userInfo.password !== this.config.ADMIN.PASSWORD)) {
            errors.password = '관리자 비밀번호가 올바르지 않습니다.';
        }
        if (userInfo.role === 'interpreter' && 
            (!userInfo.password || userInfo.password !== this.config.INTERPRETER.PASSWORD)) {
            errors.password = '통역사 비밀번호가 올바르지 않습니다.';
        }
        
        // 언어 검증
        if (!userInfo.language || !this.config.TRANSLATION.SUPPORTED_LANGUAGES.some(lang => lang.code === userInfo.language)) {
            errors.language = '지원되는 언어를 선택해주세요.';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * 사용자 정보 저장 (로컬 스토리지)
     * @param {Object} userInfo - 사용자 정보
     */
    saveUserInfo(userInfo) {
        try {
            localStorage.setItem(this.config.STORAGE.USER_INFO, JSON.stringify(userInfo));
            this.logger.info('사용자 정보 저장 완료');
        } catch (error) {
            this.logger.error('사용자 정보 저장 중 오류 발생:', error);
            throw new Error('사용자 정보 저장에 실패했습니다.');
        }
    }

    /**
     * 저장된 사용자 정보 가져오기
     * @returns {Object|null} - 사용자 정보 또는 null
     */
    getSavedUserInfo() {
        try {
            const userInfo = localStorage.getItem(this.config.STORAGE.USER_INFO);
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            this.logger.error('저장된 사용자 정보 가져오기 중 오류 발생:', error);
            return null;
        }
    }

    /**
     * 사용자 언어 설정 변경
     * @param {string} language - 언어 코드
     * @returns {boolean} - 성공 여부
     */
    changeLanguage(language) {
        try {
            if (!this.currentUser) {
                this.logger.warn('현재 사용자 정보가 없어 언어 설정을 변경할 수 없습니다.');
                return false;
            }
            
            if (!this.config.TRANSLATION.SUPPORTED_LANGUAGES.some(lang => lang.code === language)) {
                this.logger.warn(`지원되지 않는 언어 코드: ${language}`);
                return false;
            }
            
            this.currentUser.language = language;
            this.saveUserInfo(this.currentUser);
            
            // 선호 언어 설정 저장
            localStorage.setItem(this.config.STORAGE.LANG_PREFERENCE, language);
            
            this.logger.info(`사용자 언어 설정을 ${language}로 변경했습니다.`);
            return true;
        } catch (error) {
            this.logger.error('언어 설정 변경 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 테마 설정 변경
     * @param {string} theme - 테마 (light, dark, system)
     * @returns {boolean} - 성공 여부
     */
    changeTheme(theme) {
        try {
            if (!['light', 'dark', 'system'].includes(theme)) {
                this.logger.warn(`지원되지 않는 테마: ${theme}`);
                return false;
            }
            
            localStorage.setItem(this.config.STORAGE.THEME_SETTING, theme);
            this.logger.info(`테마 설정을 ${theme}로 변경했습니다.`);
            return true;
        } catch (error) {
            this.logger.error('테마 설정 변경 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 현재 테마 설정 가져오기
     * @returns {string} - 테마 설정
     */
    getThemeSetting() {
        try {
            return localStorage.getItem(this.config.STORAGE.THEME_SETTING) || this.config.UI.THEME.DEFAULT;
        } catch (error) {
            this.logger.error('테마 설정 가져오기 중 오류 발생:', error);
            return this.config.UI.THEME.DEFAULT;
        }
    }

    /**
     * 알림 설정 변경
     * @param {Object} settings - 알림 설정
     * @returns {boolean} - 성공 여부
     */
    changeNotificationSettings(settings) {
        try {
            localStorage.setItem(this.config.STORAGE.NOTIFICATION_SETTINGS, JSON.stringify(settings));
            this.logger.info('알림 설정 변경 완료:', settings);
            return true;
        } catch (error) {
            this.logger.error('알림 설정 변경 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 알림 설정 가져오기
     * @returns {Object} - 알림 설정
     */
    getNotificationSettings() {
        try {
            const settings = localStorage.getItem(this.config.STORAGE.NOTIFICATION_SETTINGS);
            return settings ? JSON.parse(settings) : {
                all: false,
                mention: true,
                sound: true
            };
        } catch (error) {
            this.logger.error('알림 설정 가져오기 중 오류 발생:', error);
            return {
                all: false,
                mention: true,
                sound: true
            };
        }
    }

    /**
     * 폰트 크기 설정 변경
     * @param {number} size - 폰트 크기 (1-5)
     * @returns {boolean} - 성공 여부
     */
    changeFontSize(size) {
        try {
            const sizeNum = parseInt(size, 10);
            
            if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 5) {
                this.logger.warn(`유효하지 않은 폰트 크기: ${size}`);
                return false;
            }
            
            localStorage.setItem(this.config.STORAGE.FONT_SIZE, sizeNum.toString());
            this.logger.info(`폰트 크기 설정을 ${sizeNum}로 변경했습니다.`);
            return true;
        } catch (error) {
            this.logger.error('폰트 크기 설정 변경 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 폰트 크기 설정 가져오기
     * @returns {number} - 폰트 크기 (1-5)
     */
    getFontSize() {
        try {
            const size = localStorage.getItem(this.config.STORAGE.FONT_SIZE);
            return size ? parseInt(size, 10) : 3; // 기본값: 3
        } catch (error) {
            this.logger.error('폰트 크기 설정 가져오기 중 오류 발생:', error);
            return 3; // 기본값: 3
        }
    }

    /**
     * 사용자 로그아웃
     * @returns {boolean} - 성공 여부
     */
    logout() {
        try {
            // 참가자 오프라인 처리 (supabaseClient 필요)
            if (this.currentUser && window.supabaseClient) {
                window.supabaseClient.setParticipantOffline(this.currentUser.email);
            }
            this.currentUser = null;
            localStorage.removeItem(this.config.STORAGE.USER_INFO);
            this.logger.info('사용자 로그아웃 완료');
            return true;
        } catch (error) {
            this.logger.error('사용자 로그아웃 중 오류 발생:', error);
            return false;
        }
    }

    /**
     * 사용자 이니셜 가져오기
     * @param {string} name - 사용자 이름
     * @returns {string} - 이니셜
     */
    getInitials(name) {
        if (!name) return '';
        
        // 한글 이름 처리 (예: "홍길동" -> "홍")
        if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3]/.test(name)) {
            return name.charAt(0);
        }
        
        // 영문 이름 처리 (예: "John Doe" -> "JD")
        const parts = name.split(' ').filter(part => part.length > 0);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}

// 브라우저 종료/새로고침 시 참가자 오프라인 처리
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        const userService = window.userService;
        if (userService && userService.currentUser && window.supabaseClient) {
            window.supabaseClient.setParticipantOffline(userService.currentUser.email);
        }
    });
}
