/**
 * 인증 컴포넌트
 * 사용자 로그인 및 등록 기능 처리
 */
class AuthComponent {
    /**
     * 인증 컴포넌트 생성자
     * @param {Object} userService - 사용자 서비스
     * @param {Object} dataManager - 데이터 관리자
     * @param {Object} logger - 로거 서비스
     */
    constructor(userService, dataManager, logger) {
        this.userService = userService;
        this.dataManager = dataManager;
        this.logger = logger || console;
        this.elements = {
            authContainer: null,
            form: null,
            nameInput: null,
            emailInput: null,
            roleSelect: null,
            languageSelect: null,
            passwordContainer: null,
            passwordInput: null,
            submitButton: null,
        };
        
        this.init();
    }

    /**
     * 인증 컴포넌트 초기화
     */
    init() {
        try {
            this.logger.info('인증 컴포넌트 초기화 중...');
            
            // DOM 요소 참조 가져오기
            this.elements.authContainer = document.getElementById('auth-container');
            this.elements.form = document.getElementById('user-info-form');
            this.elements.nameInput = document.getElementById('name');
            this.elements.emailInput = document.getElementById('email');
            this.elements.roleSelect = document.getElementById('role');
            this.elements.languageSelect = document.getElementById('language');
            this.elements.passwordContainer = document.getElementById('password-container');
            this.elements.passwordInput = document.getElementById('password');
            this.elements.submitButton = this.elements.form?.querySelector('button[type="submit"]');
            
            // 스토리지에서 언어 설정 가져와서 언어 선택기에 적용
            const savedLanguage = localStorage.getItem('premium-chat-language');
            if (savedLanguage && this.elements.languageSelect) {
                // 지원되는 언어인지 확인
                const isSupported = Array.from(this.elements.languageSelect.options)
                    .some(option => option.value === savedLanguage);
                
                if (isSupported) {
                    this.elements.languageSelect.value = savedLanguage;
                    // 언어에 따른 UI 텍스트 업데이트
                    this.updateInterfaceTexts(savedLanguage);
                }
            }
            
            // 폼 제출 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 저장된 사용자 정보 확인
            const savedUser = this.userService.getSavedUserInfo();
            
            if (savedUser) {
                // 폼에 미리 채우기
                this.populateForm(savedUser);
            }
            
            // 언어 선택기 변경시 즉시 LocalStorage에 저장하고 UI 업데이트
            this.elements.languageSelect?.addEventListener('change', (e) => {
                const selectedLanguage = e.target.value;
                if (selectedLanguage) {
                    localStorage.setItem('premium-chat-language', selectedLanguage);
                    this.updateInterfaceTexts(selectedLanguage);
                }
            });
            
            this.logger.info('인증 컴포넌트 초기화 완료');
        } catch (error) {
            this.logger.error('인증 컴포넌트 초기화 중 오류 발생:', error);
        }
    }

    /**
     * 언어에 따른 인터페이스 텍스트 업데이트
     * @param {string} language - 언어 코드
     */
    async updateInterfaceTexts(language) {
        try {
            // 언어 리소스 로드
            const res = await fetch(`js/locales/${language}.json`);
            if (!res.ok) {
                throw new Error(`언어 리소스를 로드할 수 없습니다: ${language}`);
            }
            
            const dict = await res.json();
            
            // 로그인/회원가입 폼 라벨/플레이스홀더/버튼/역할 옵션 등 적용
            const titleElement = document.querySelector('.auth-header h2');
            if (titleElement) titleElement.textContent = dict.title || '컨퍼런스 채팅 시스템';
            
            const subtitleElement = document.querySelector('.auth-header p');
            if (subtitleElement) subtitleElement.textContent = dict.subtitle || '계속하려면 정보를 입력해주세요';
            
            // 이름 라벨 및 플레이스홀더
            const nameLabel = document.querySelector('label[for="name"]');
            if (nameLabel) nameLabel.textContent = dict.name || '이름';
            
            if (this.elements.nameInput) {
                this.elements.nameInput.placeholder = dict.name_placeholder || '이름을 입력하세요';
            }
            
            // 이메일 라벨 및 플레이스홀더
            const emailLabel = document.querySelector('label[for="email"]');
            if (emailLabel) emailLabel.textContent = dict.email || '이메일';
            
            if (this.elements.emailInput) {
                this.elements.emailInput.placeholder = dict.email_placeholder || '이메일을 입력하세요';
            }
            
            // 역할 라벨 및 옵션
            const roleLabel = document.querySelector('label[for="role"]');
            if (roleLabel) roleLabel.textContent = dict.role || '역할';
            
            if (this.elements.roleSelect) {
                this.elements.roleSelect.options[0].textContent = dict.role_placeholder || '역할을 선택하세요';
                
                // 역할 옵션
                const roleMap = [null, 'attendee', 'exhibitor', 'presenter', 'staff', 'admin', 'interpreter'];
                for (let i = 1; i < roleMap.length; i++) {
                    if (this.elements.roleSelect.options[i] && dict[roleMap[i]]) {
                        this.elements.roleSelect.options[i].textContent = dict[roleMap[i]];
                    }
                }
            }
            
            // 비밀번호 라벨 및 플레이스홀더
            const passwordLabel = document.querySelector('label[for="password"]');
            if (passwordLabel) passwordLabel.textContent = dict.password || '비밀번호';
            
            if (this.elements.passwordInput) {
                this.elements.passwordInput.placeholder = dict.password_placeholder || '비밀번호를 입력하세요';
            }
            
            // 언어 라벨
            const languageLabel = document.querySelector('label[for="language"]');
            if (languageLabel) languageLabel.textContent = dict.language || '선호 언어';
            
            // 입장하기 버튼
            if (this.elements.submitButton) {
                this.elements.submitButton.textContent = dict.enter || '입장하기';
            }
            
        } catch (error) {
            this.logger.warn('인터페이스 텍스트 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        if (!this.elements.form) {
            this.logger.error('인증 폼을 찾을 수 없습니다.');
            return;
        }
        
        // 폼 제출 이벤트 리스너
        this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // 실시간 유효성 검사
        this.elements.nameInput?.addEventListener('input', this.validateField.bind(this, 'name'));
        this.elements.emailInput?.addEventListener('input', this.validateField.bind(this, 'email'));
        this.elements.roleSelect?.addEventListener('change', (e) => {
            console.log('[DEBUG] 역할 변경:', e.target.value);
            this.validateField('role', e);
        });
        this.elements.passwordInput?.addEventListener('input', this.validateField.bind(this, 'password'));
        
        // 역할 변경 시 비밀번호 필드 표시/숨김
        this.elements.roleSelect?.addEventListener('change', this.handleRoleChange.bind(this));
    }
    
    /**
     * 역할 변경 처리
     */
    handleRoleChange() {
        if (!this.elements.roleSelect || !this.elements.passwordContainer) return;
        
        const selectedRole = this.elements.roleSelect.value;
        
        // 관리자 또는 통역사 역할 선택 시 비밀번호 필드 표시
        if (selectedRole === 'admin' || selectedRole === 'interpreter') {
            this.elements.passwordContainer.classList.remove('hidden');
            this.elements.passwordInput.required = true;
        } else {
            this.elements.passwordContainer.classList.add('hidden');
            this.elements.passwordInput.required = false;
            this.elements.passwordInput.value = '';
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
            const supportedLanguages = ['en', 'ko', 'hi', 'te', 'zh'];
            
            // 선택된 언어 가져오기 - 폼의 선택 값을 우선으로 사용하고, 폼이 없거나 비어있으면 저장된 값 사용
            let language = this.elements.languageSelect?.value;
            
            // 언어 선택 요소 존재하는지 확인
            if (!language || language === "" || !supportedLanguages.includes(language)) {
                // localStorage에서 가져오기
                language = localStorage.getItem('premium-chat-language');
                
                // 그래도 없거나 유효하지 않으면, 기본 언어 사용
                if (!language || !supportedLanguages.includes(language)) {
                    language = 'en'; // 최후의 기본 언어
                }
                
                // 디버깅 로그
                console.log('[DEBUG] 언어 선택 없음, 저장된 언어 또는 기본값 사용:', language);
            }
            
            // 확정된 언어 값 저장 (로그인 시점에 언어 값 보존)
            localStorage.setItem('premium-chat-language', language);
            
            const userInfo = {
                name: this.elements.nameInput.value.trim(),
                email: this.elements.emailInput.value.trim(),
                role: this.elements.roleSelect.value,
                language,
            };
            
            // 관리자 또는 통역사 역할인 경우 비밀번호 추가
            if (userInfo.role === 'admin' || userInfo.role === 'interpreter') {
                userInfo.password = this.elements.passwordInput.value;
            }
            
            // 사용자 정보 유효성 검사
            const validation = this.userService.validateUserInfo(userInfo);
            if (!validation.isValid) {
                // 구체적 비밀번호 오류 메시지 우선 표시
                if (validation.errors.password) {
                    this.showError(validation.errors.password);
                } else {
                    this.showErrors(validation.errors);
                }
                this.setLoading(false);
                // 폼 제출 후 비밀번호 입력란 초기화
                if (this.elements.passwordInput) this.elements.passwordInput.value = '';
                return;
            }
            
            // 사용자 인증 처리
            const success = await this.userService.authenticate(userInfo);
            if (!success) {
                this.showError('로그인에 실패했습니다. 다시 시도해주세요.');
                this.setLoading(false);
                // 폼 제출 후 비밀번호 입력란 초기화
                if (this.elements.passwordInput) this.elements.passwordInput.value = '';
                return;
            }
            
            // 참가자 목록에 추가
            this.dataManager.addParticipant(userInfo);
            this.logger.info('로그인 성공:', userInfo);
            
            // 로그인 성공 이벤트 발생 (main.js에서 감지)
            const loginEvent = new CustomEvent('auth:login-success', {
                detail: { userInfo }
            });
            document.dispatchEvent(loginEvent);
            
            // UI 전환 이벤트가 제대로 동작하지 않을 경우를 대비한 백업 메커니즘
            // 0.5초 후에도 인증 컨테이너가 보이면 강제로 숨기기
            setTimeout(() => {
                if (this.elements.authContainer && !this.elements.authContainer.classList.contains('hidden')) {
                    console.log('[DEBUG] 로그인 후 UI 전환이 안됨, 강제 숨김 적용');
                    this.hide();
                    // 채팅 인터페이스 표시 시도
                    const chatInterface = document.getElementById('chat-interface');
                    if (chatInterface) {
                        chatInterface.classList.remove('hidden');
                    }
                }
            }, 500);
            
            // 인증 컨테이너 숨기기
            this.hide();
        } catch (error) {
            this.logger.error('로그인 중 오류 발생:', error);
            this.showError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 로딩 해제
            this.setLoading(false);
            // 폼 제출 후 비밀번호 입력란 초기화
            if (this.elements.passwordInput) this.elements.passwordInput.value = '';
        }
    }

    /**
     * 필드 유효성 검사
     * @param {string} fieldName - 필드 이름
     * @param {Event} event - 이벤트 객체
     */
    validateField(fieldName, event) {
        try {
            const input = event.target;
            const value = input.value.trim();
            let error = null;
            
            switch (fieldName) {
                case 'name':
                    if (value.length === 0) {
                        error = '이름을 입력해주세요.';
                    } else if (value.length < 2) {
                        error = '이름은 최소 2자 이상이어야 합니다.';
                    }
                    break;
                    
                case 'email':
                    if (value.length === 0) {
                        error = '이메일을 입력해주세요.';
                    } else if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) {
                        error = '올바른 이메일 형식이 아닙니다.';
                    }
                    break;
                    
                case 'role':
                    if (!value || value === '') {
                        error = '역할을 선택해주세요.';
                    }
                    
                    // 역할이 변경되면 비밀번호 필드 표시/숨김 처리
                    this.handleRoleChange();
                    break;
                    
                case 'password':
                    // 관리자 역할이고 비밀번호가 필요한 경우에만 검사
                    if (this.elements.roleSelect.value === 'admin') {
                        if (value.length === 0) {
                            error = '관리자 비밀번호를 입력해주세요.';
                        }
                    }
                    break;
            }
            
            // 오류 표시 설정
            this.setFieldError(input, error);
            
            // 제출 버튼 활성화/비활성화
            this.updateSubmitButtonState();
            
            return !error;
        } catch (error) {
            this.logger.error(`${fieldName} 필드 유효성 검사 중 오류 발생:`, error);
            return false;
        }
    }

    /**
     * 필드 오류 표시 설정
     * @param {HTMLElement} input - 입력 요소
     * @param {string|null} error - 오류 메시지 또는 null
     */
    setFieldError(input, error) {
        // 입력 필드 스타일 설정
        if (error) {
            input.classList.add('error');
            
            // 오류 메시지 표시
            let errorElement = input.parentElement.querySelector('.error-message');
            
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                input.parentElement.appendChild(errorElement);
            }
            
            errorElement.textContent = error;
        } else {
            input.classList.remove('error');
            
            // 오류 메시지 제거
            const errorElement = input.parentElement.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    /**
     * 제출 버튼 상태 업데이트
     */
    updateSubmitButtonState() {
        if (!this.elements.submitButton) return;
        
        const isNameValid = this.elements.nameInput.value.trim().length >= 2;
        const isEmailValid = /^[\w.-]+@[\w.-]+\.\w+$/.test(this.elements.emailInput.value.trim());
        const isRoleValid = this.elements.roleSelect.value && this.elements.roleSelect.value !== '';
        
        // 관리자 역할인 경우 비밀번호도 검사
        let isPasswordValid = true;
        if (this.elements.roleSelect.value === 'admin') {
            isPasswordValid = this.elements.passwordInput.value.trim().length > 0;
        }
        
        const isFormValid = isNameValid && isEmailValid && isRoleValid && isPasswordValid;
        
        this.elements.submitButton.disabled = !isFormValid;
    }

    /**
     * 오류 메시지 표시
     * @param {string} message - 오류 메시지
     */
    showError(message) {
        // 오류 메시지 표시
        let errorElement = this.elements.form.querySelector('.form-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            this.elements.form.insertBefore(errorElement, this.elements.form.firstChild);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * 여러 오류 메시지 표시
     * @param {Object} errors - 오류 메시지 객체
     */
    showErrors(errors) {
        // 각 필드의 오류 표시
        for (const [field, error] of Object.entries(errors)) {
            const input = this.elements[`${field}Input`] || this.elements[`${field}Select`];
            if (input) {
                this.setFieldError(input, error);
            }
        }
        
        // 첫 번째 오류 메시지를 상단에 표시
        const firstError = Object.values(errors)[0];
        if (firstError) {
            this.showError(firstError);
        }
    }

    /**
     * 폼 초기화
     */
    resetForm() {
        if (!this.elements.form) return;
        
        this.elements.form.reset();
        
        // 오류 메시지 제거
        const errorElements = this.elements.form.querySelectorAll('.error-message, .form-error');
        errorElements.forEach(element => element.remove());
        
        // 오류 스타일 제거
        const inputs = this.elements.form.querySelectorAll('input, select');
        inputs.forEach(input => input.classList.remove('error'));
        
        // 비밀번호 필드 숨기기
        if (this.elements.passwordContainer) {
            this.elements.passwordContainer.classList.add('hidden');
        }
    }

    /**
     * 폼에 사용자 정보 채우기
     * @param {Object} userInfo - 사용자 정보
     */
    populateForm(userInfo) {
        if (!this.elements.form || !userInfo) return;
        
        // 각 필드에 값 설정
        if (userInfo.name) this.elements.nameInput.value = userInfo.name;
        if (userInfo.email) this.elements.emailInput.value = userInfo.email;
        if (userInfo.role) this.elements.roleSelect.value = userInfo.role;
        if (userInfo.language) this.elements.languageSelect.value = userInfo.language;
        
        // 관리자 역할인 경우 비밀번호 필드 표시
        if (userInfo.role === 'admin' && this.elements.passwordContainer) {
            this.elements.passwordContainer.classList.remove('hidden');
        }
        
        // 제출 버튼 상태 업데이트
        this.updateSubmitButtonState();
    }

    /**
     * 로딩 상태 설정
     * @param {boolean} isLoading - 로딩 중 여부
     */
    setLoading(isLoading) {
        if (!this.elements.submitButton) return;
        
        if (isLoading) {
            this.elements.submitButton.disabled = true;
            this.elements.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리 중...';
        } else {
            this.updateSubmitButtonState();
            this.elements.submitButton.innerHTML = '입장하기';
        }
    }

    /**
     * 인증 컴포넌트 표시
     */
    show() {
        if (!this.elements.authContainer) return;
        this.elements.authContainer.classList.remove('hidden');
        
        // 역할에 따라 비밀번호 필드 동기화 (강제)
        this.handleRoleChange();
        
        // 디버깅: 현재 역할/비밀번호 컨테이너 상태 출력
        if (this.elements.roleSelect && this.elements.passwordContainer) {
            console.log('[DEBUG] show() - 현재 역할:', this.elements.roleSelect.value);
            console.log('[DEBUG] show() - passwordContainer.hidden:', this.elements.passwordContainer.classList.contains('hidden'));
        }
        
        // 현재 언어 설정에 따라 UI 텍스트 업데이트
        try {
            const currentLanguage = this.elements.languageSelect?.value || localStorage.getItem('premium-chat-language') || 'en';
            this.updateInterfaceTexts(currentLanguage);
        } catch (error) {
            console.error('언어 업데이트 중 오류:', error);
        }
    }

    /**
     * 인증 컴포넌트 숨기기
     */
    hide() {
        if (!this.elements.authContainer) return;
        
        this.elements.authContainer.classList.add('hidden');
    }
}
