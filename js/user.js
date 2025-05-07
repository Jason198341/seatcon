/**
 * 사용자 관리 모듈
 * 
 * 사용자 정보 관리, 유효성 검사, 인터페이스 관련 기능을 제공합니다.
 * 사용자 로그인/로그아웃, 프로필 설정 등을 처리합니다.
 */

import CONFIG from './config.js';
import supabaseClient from './supabase-client.js';
import translationService from './translation.js';
import i18nService from './i18n.js';

class UserManager {
    constructor() {
        this.userInfoForm = null;
        this.languageSelector = null;
        this.roleSelector = null;
        this.loginButton = null;
        this.logoutButton = null;
        this.userInfo = null;
        this.staffPasswordContainer = null;
        this.staffPassword = null;
        
        // 현재 사용자
        this.currentUser = null;
        
        // 이벤트 핸들러
        this.onUserLogin = null;
        this.onUserLogout = null;
        this.onLanguageChange = null;
        
        // 언어 변경 상태
        this.isChangingLanguage = false;
    }

    /**
     * 사용자 관리자 초기화
     * @param {Object} options - 초기화 옵션
     */
    init(options = {}) {
        // DOM 요소 참조 설정
        this.userInfoForm = document.getElementById(options.formId || 'userInfoForm');
        this.languageSelector = document.getElementById(options.languageSelectorId || 'languageSelector');
        this.roleSelector = document.getElementById(options.roleSelectorId || 'roleSelector');
        this.loginButton = document.getElementById(options.loginButtonId || 'loginButton');
        this.logoutButton = document.getElementById(options.logoutButtonId || 'logoutButton');
        this.userInfo = document.getElementById(options.userInfoId || 'userInfo');
        
        // 이벤트 콜백 설정
        this.onUserLogin = options.onUserLogin || null;
        this.onUserLogout = options.onUserLogout || null;
        this.onLanguageChange = options.onLanguageChange || null;
        
        // 저장된 사용자 정보 불러오기
        this.currentUser = supabaseClient.getSavedUserInfo();
        
        // UI 초기화
        this.initUI();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('UserManager initialized', {
                currentUser: this.currentUser ? this.currentUser.name : 'None'
            });
        }
    }

    /**
     * UI 초기화
     */
    initUI() {
        // 언어 선택 옵션 구성
        this.setupLanguageOptions();
        
        // 역할 선택 옵션 구성
        this.setupRoleOptions();
        
        // 스태프 비밀번호 필드 생성
        this.setupStaffPasswordField();
        
        // 폼 이벤트 리스너 등록
        this.setupEventListeners();
        
        // 현재 상태에 따라 UI 업데이트
        this.updateUI();
        
        // 현재 언어에 맞게 UI 업데이트
        i18nService.updateAllTexts();
    }

    /**
     * 언어 옵션 설정
     */
    setupLanguageOptions() {
        if (!this.languageSelector) return;
        
        // 기존 옵션 제거
        this.languageSelector.innerHTML = '';
        
        // 초기 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = i18nService.get('languagePlaceholder');
        this.languageSelector.appendChild(defaultOption);
        
        // 언어 옵션 추가
        CONFIG.LANGUAGES.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = `${lang.flag} ${lang.name}`;
            this.languageSelector.appendChild(option);
        });
        
        // 현재 선호 언어 설정
        const savedLanguage = supabaseClient.getPreferredLanguage();
        if (savedLanguage && this.languageSelector.querySelector(`option[value="${savedLanguage}"]`)) {
            this.languageSelector.value = savedLanguage;
        } else {
            // 기본값은 비어있음
            this.languageSelector.value = '';
        }
        
        // 언어 변경 이벤트 처리 (이벤트 리스너는 setupEventListeners에서 설정)
    }

    /**
     * 역할 옵션 설정
     */
    setupRoleOptions() {
        if (!this.roleSelector) return;
        
        // 기존 옵션 제거
        this.roleSelector.innerHTML = '';
        
        // 역할 옵션 간소화 (참가자/스태프만 표시)
        const simplifiedRoles = [
            { id: 'attendee', name: i18nService.get('role_attendee') },
            { id: 'staff', name: i18nService.get('role_staff') }
        ];
        
        // 초기 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = i18nService.get('rolePlaceholder');
        this.roleSelector.appendChild(defaultOption);
        
        // 역할 옵션 추가
        simplifiedRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            this.roleSelector.appendChild(option);
        });
        
        // 기본 역할 선택 (첫 번째 역할)
        if (simplifiedRoles.length > 0) {
            // 초기 옵션이 선택되게
            this.roleSelector.value = '';
        }
        
        // 현재 사용자가 있으면 해당 역할 선택
        if (this.currentUser && this.currentUser.role) {
            this.roleSelector.value = this.currentUser.role;
        }
        
        // 역할 변경 이벤트 리스너
        this.roleSelector.addEventListener('change', () => {
            this.handleRoleChange();
        });
    }
    
    /**
     * 스태프 비밀번호 필드 설정
     */
    setupStaffPasswordField() {
        // 기존 필드가 있으면 제거
        const existingContainer = document.getElementById('staffPasswordContainer');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // 스태프 비밀번호 컨테이너 생성
        this.staffPasswordContainer = document.createElement('div');
        this.staffPasswordContainer.id = 'staffPasswordContainer';
        this.staffPasswordContainer.className = 'form-group';
        this.staffPasswordContainer.style.display = 'none';
        
        // 레이블 생성
        const passwordLabel = document.createElement('label');
        passwordLabel.htmlFor = 'staffPassword';
        passwordLabel.textContent = i18nService.get('staffPasswordLabel');
        
        // 비밀번호 입력 필드 생성
        this.staffPassword = document.createElement('input');
        this.staffPassword.type = 'password';
        this.staffPassword.id = 'staffPassword';
        this.staffPassword.name = 'staffPassword';
        this.staffPassword.placeholder = i18nService.get('staffPasswordPlaceholder');
        this.staffPassword.required = false;
        
        // 추가 정보 텍스트 생성
        const helpText = document.createElement('small');
        helpText.className = 'help-text';
        helpText.style.color = '#666';
        helpText.style.fontSize = '12px';
        helpText.style.marginTop = '4px';
        helpText.style.display = 'block';
        helpText.textContent = i18nService.get('staffPasswordHelp');
        
        // 컨테이너에 요소 추가
        this.staffPasswordContainer.appendChild(passwordLabel);
        this.staffPasswordContainer.appendChild(this.staffPassword);
        this.staffPasswordContainer.appendChild(helpText);
        
        // 사용자 정보 폼에 추가
        if (this.userInfoForm) {
            const submitButton = this.userInfoForm.querySelector('button[type="submit"]');
            if (submitButton) {
                this.userInfoForm.insertBefore(this.staffPasswordContainer, submitButton);
            } else {
                this.userInfoForm.appendChild(this.staffPasswordContainer);
            }
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 로그인 폼 제출 이벤트
        if (this.userInfoForm) {
            this.userInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // 로그아웃 버튼 클릭 이벤트
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // 언어 변경 이벤트
        if (this.languageSelector) {
            // 기존 이벤트 리스너 제거
            const oldHandler = this.languageSelector._changeHandler;
            if (oldHandler) {
                this.languageSelector.removeEventListener('change', oldHandler);
            }
            
            // 새 이벤트 리스너 설정
            const newHandler = () => {
                this.handleLanguageChange();
            };
            this.languageSelector._changeHandler = newHandler;
            this.languageSelector.addEventListener('change', newHandler);
        }
    }
    
    /**
     * 역할 변경 처리
     */
    handleRoleChange() {
        if (!this.roleSelector || !this.staffPasswordContainer) return;
        
        const selectedRole = this.roleSelector.value;
        
        // 스태프 역할 선택 시 비밀번호 필드 표시
        if (selectedRole === 'staff') {
            this.staffPasswordContainer.style.display = 'block';
            this.staffPassword.required = true;
            
            // CSS 애니메이션을 위해 클래스 추가
            setTimeout(() => {
                this.staffPasswordContainer.classList.add('show');
            }, 10);
        } else {
            // CSS 애니메이션을 위해 클래스 제거
            this.staffPasswordContainer.classList.remove('show');
            this.staffPassword.required = false;
            
            // 애니메이션 후 숨김 처리
            setTimeout(() => {
                this.staffPasswordContainer.style.display = 'none';
            }, 300);
        }
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        // 사용자 로그인 상태에 따라 UI 업데이트
        if (this.currentUser) {
            // 로그인 상태 UI
            if (this.userInfoForm) {
                this.userInfoForm.style.display = 'none';
            }
            
            if (this.logoutButton) {
                this.logoutButton.style.display = 'inline-block';
            }
            
            if (this.userInfo) {
                // 사용자 정보 표시
                const userRole = CONFIG.USER_ROLES.find(r => r.id === this.currentUser.role);
                const roleName = userRole ? userRole.name : this.currentUser.role;
                
                this.userInfo.innerHTML = `
                    <div class="user-name">${this.escapeHtml(this.currentUser.name)}</div>
                    <div class="user-role">${this.escapeHtml(roleName)}</div>
                `;
                this.userInfo.style.display = 'block';
            }
        } else {
            // 로그아웃 상태 UI
            if (this.userInfoForm) {
                this.userInfoForm.style.display = 'block';
            }
            
            if (this.logoutButton) {
                this.logoutButton.style.display = 'none';
            }
            
            if (this.userInfo) {
                this.userInfo.style.display = 'none';
            }
        }
    }

    /**
     * 로그인 처리
     */
    handleLogin() {
        if (!this.userInfoForm) return;
        
        const nameInput = this.userInfoForm.querySelector('#userName');
        const emailInput = this.userInfoForm.querySelector('#userEmail');
        const roleSelect = this.userInfoForm.querySelector('#roleSelector');
        
        if (!nameInput || !emailInput || !roleSelect) {
            console.error('Login form elements not found');
            return;
        }
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const role = roleSelect.value;
        
        // 스태프 역할 선택 시 비밀번호 확인
        if (role === 'staff') {
            const staffPassword = this.staffPassword ? this.staffPassword.value : '';
            
            // 비밀번호 검증 강화
            if (staffPassword !== '9881') {
                // 비밀번호 입력 필드 하이라이트 및 오류 표시
                this.staffPassword.classList.add('error');
                this.staffPassword.style.borderColor = 'var(--error)';
                this.staffPassword.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.15)';
                
                // 오류 메시지 표시
                const errorMessage = document.createElement('div');
                errorMessage.className = 'password-error-message';
                errorMessage.textContent = i18nService.get('staffPasswordError');
                errorMessage.style.color = 'var(--error)';
                errorMessage.style.fontSize = '12px';
                errorMessage.style.marginTop = '5px';
                
                // 기존 오류 메시지 제거
                const existingError = this.staffPasswordContainer.querySelector('.password-error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // 오류 메시지 추가
                this.staffPasswordContainer.appendChild(errorMessage);
                
                // 비밀번호 필드에 포커스
                this.staffPassword.focus();
                
                return;
            } else {
                // 성공 시 오류 표시 제거
                this.staffPassword.classList.remove('error');
                this.staffPassword.style.borderColor = '';
                this.staffPassword.style.boxShadow = '';
                
                const existingError = this.staffPasswordContainer.querySelector('.password-error-message');
                if (existingError) {
                    existingError.remove();
                }
            }
        }
        
        // 유효성 검사
        if (!this.validateUserInput(name, email, role)) {
            return;
        }
        
        // 사용자 정보 객체 생성
        const user = {
            name,
            email,
            role,
            createdAt: new Date().toISOString()
        };
        
        // 사용자 정보 저장
        const saved = supabaseClient.saveUserInfo(user);
        
        if (saved) {
            this.currentUser = user;
            
            // 로그인 폼 숨기고 채팅 UI 표시
            const userInfoFormContainer = document.getElementById('userInfoFormContainer');
            const chatContainer = document.getElementById('chatContainer');
            
            if (userInfoFormContainer && chatContainer) {
                userInfoFormContainer.style.display = 'none';
                chatContainer.style.display = 'flex';
            }
            
            this.updateUI();
            
            // 로그인 이벤트 콜백 호출
            if (typeof this.onUserLogin === 'function') {
                this.onUserLogin(user);
            }
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('User logged in:', user.name);
            }
        } else {
            alert('사용자 정보를 저장하는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 로그아웃 처리
     */
    handleLogout() {
        const confirmLogout = confirm(i18nService.get('logoutConfirmation'));
        
        if (!confirmLogout) {
            return;
        }
        
        // 로그아웃 전 사용자 정보 저장
        const prevUser = this.currentUser;
        
        try {
            // 사용자 정보 삭제 및 모든 로컬 스토리지 데이터 초기화
            supabaseClient.clearUserInfo();
            this.currentUser = null;
            
            // 추가 로컬 스토리지 정리
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentSpeakerId');
            localStorage.removeItem('processedMessages');
            
            // UI 업데이트
            this.updateUI();
            
            // 채팅 화면에서 로그인 화면으로 전환
            const userInfoFormContainer = document.getElementById('userInfoFormContainer');
            const chatContainer = document.getElementById('chatContainer');
            
            if (userInfoFormContainer && chatContainer) {
                userInfoFormContainer.style.display = 'block';
                chatContainer.style.display = 'none';
                
                // 입력 폼 완전 초기화
                const loginForm = document.getElementById('userInfoForm');
                if (loginForm) {
                    loginForm.reset();
                    
                    // 역할 선택기 초기화
                    const roleSelector = loginForm.querySelector('#roleSelector');
                    if (roleSelector) {
                        roleSelector.value = '';
                    }
                    
                    // 스태프 비밀번호 필드 초기화 및 숨김
                    const staffPasswordField = document.getElementById('staffPassword');
                    const staffPasswordContainer = document.getElementById('staffPasswordContainer');
                    if (staffPasswordField) {
                        staffPasswordField.value = '';
                    }
                    if (staffPasswordContainer) {
                        staffPasswordContainer.classList.remove('show');
                        staffPasswordContainer.style.display = 'none';
                    }
                }
                
                // 모든 입력 요소 값 초기화
                const allInputs = userInfoFormContainer.querySelectorAll('input, select, textarea');
                allInputs.forEach(input => {
                    input.value = '';
                });
            }
            
            // Supabase 연결 정리
            supabaseClient.cleanup();
            
            // Supabase 재연결 - 새로운 세션으로 시작
            setTimeout(() => {
                supabaseClient.init();
            }, 500);
            
            // 채팅 영역 DOM 요소 완전 초기화
            const messageList = document.getElementById('messageList');
            if (messageList) {
                messageList.innerHTML = '';
            }
            
            // 로그아웃 이벤트 콜백 호출
            if (typeof this.onUserLogout === 'function' && prevUser) {
                this.onUserLogout(prevUser);
            }
            
            // 페이지 스크롤을 맨 위로 이동
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('User logged out completely, all storage cleared');
            }
            
            // 로그아웃 성공 메시지 표시
            this.showLogoutSuccessMessage();
        } catch (error) {
            console.error('Error during logout:', error);
            
            // 로그아웃 오류 처리 - 리로드 필요
            alert('로그아웃 처리 중 오류가 발생했습니다. 페이지를 새로고침하여 다시 시도하세요.');
        }
    }
    
    /**
     * 로그아웃 성공 메시지 표시
     */
    showLogoutSuccessMessage() {
        // 토스트 메시지 생성
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = i18nService.get('logoutSuccess');
        
        document.body.appendChild(toast);
        
        // 표시 후 자동 제거
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    /**
     * 언어 변경 처리 - 최적화된 버전
     */
    handleLanguageChange() {
        if (!this.languageSelector || this.isChangingLanguage) return;
        
        const newLanguage = this.languageSelector.value;
        
        // 현재 언어와 같으면 중복 처리 방지
        if (newLanguage === supabaseClient.getPreferredLanguage()) {
            return;
        }
        
        // 유효한 언어 코드인지 확인
        if (!translationService.isSupportedLanguage(newLanguage)) {
            console.error(`Unsupported language: ${newLanguage}`);
            return;
        }
        
        // 로딩 상태 표시 (UI 피드백)
        this.showLanguageChangeLoading(true);
        this.isChangingLanguage = true;
        
        // 언어 변경 비동기 처리로 전환 - UI 블로킹 방지
        setTimeout(() => {
            try {
                // 선호 언어 변경
                supabaseClient.setPreferredLanguage(newLanguage);
                
                // i18n 언어 변경 (이벤트 발생 방지)
                i18nService.setLanguage(newLanguage, false);
                
                // UI 업데이트 순서 제어
                i18nService.updateAllTexts();
                
                // 역할 선택지 업데이트 (마지막에 처리)
                this.setupRoleOptions();
                
                // 비밀번호 필드 업데이트
                this.setupStaffPasswordField();
                
                // 언어 변경 이벤트 콜백 호출 (한 번만)
                if (typeof this.onLanguageChange === 'function') {
                    this.onLanguageChange(newLanguage);
                }
                
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log(`Language changed to: ${newLanguage}`);
                }
            } catch (error) {
                console.error('Error during language change:', error);
                this.showError('언어 변경 중 오류가 발생했습니다.');
                
                // 언어 선택기를 이전 값으로 다시 설정
                const previousLanguage = supabaseClient.getPreferredLanguage();
                if (this.languageSelector && previousLanguage) {
                    this.languageSelector.value = previousLanguage;
                }
            } finally {
                // 로딩 상태 해제
                this.showLanguageChangeLoading(false);
                this.isChangingLanguage = false;
            }
        }, 100); // 약간의 지연을 두어 UI 스레드 블로킹 방지
    }

    /**
     * 언어 변경 로딩 표시 함수
     * @param {boolean} isLoading - 로딩 중 여부
     */
    showLanguageChangeLoading(isLoading) {
        // UI에 로딩 상태 표시
        const languageSelector = this.languageSelector;
        if (languageSelector) {
            languageSelector.disabled = isLoading;
        }
        
        // 바디에 언어 변경 중 클래스 추가
        if (isLoading) {
            document.body.classList.add('language-changing');
        } else {
            document.body.classList.remove('language-changing');
        }
    }

    /**
     * 오류 메시지 표시
     * @param {string} message - 오류 메시지
     */
    showError(message) {
        // 토스트 형태의 오류 메시지
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 2초 후 자동 제거
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    /**
     * 사용자 입력 유효성 검사
     * @param {string} name - 사용자 이름
     * @param {string} email - 이메일 주소
     * @param {string} role - 사용자 역할
     * @returns {boolean} - 유효성 검사 결과
     */
    validateUserInput(name, email, role) {
        // 이름 검사
        if (!name || name.length < 2) {
            alert('이름은 2자 이상 입력해주세요.');
            return false;
        }
        
        // 이메일 주소 검사
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            alert('유효한 이메일 주소를 입력해주세요.');
            return false;
        }
        
        // 역할 검사
        if (!role || !this.isValidRole(role)) {
            alert('유효한 역할을 선택해주세요.');
            return false;
        }
        
        return true;
    }
    
    /**
     * 유효한 역할인지 확인
     * @param {string} role - 역할 ID
     * @returns {boolean} - 유효성 여부
     */
    isValidRole(role) {
        // 간소화된 역할만 사용하므로 직접 확인
        return role === 'attendee' || role === 'staff';
    }

    /**
     * 현재 사용자 정보 가져오기
     * @returns {Object|null} - 현재 사용자 정보
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 현재 역할 색상 가져오기
     * @returns {string} - 역할 색상 코드
     */
    getCurrentRoleColor() {
        if (!this.currentUser || !this.currentUser.role) {
            return '#000000';
        }
        
        const userRole = CONFIG.USER_ROLES.find(r => r.id === this.currentUser.role);
        return userRole ? userRole.color : '#000000';
    }

    /**
     * 역할 ID로 역할 정보 가져오기
     * @param {string} roleId - 역할 ID
     * @returns {Object|null} - 역할 정보
     */
    getRoleInfo(roleId) {
        return CONFIG.USER_ROLES.find(r => r.id === roleId) || null;
    }

    /**
     * HTML 이스케이프 처리
     * @param {string} unsafe - 이스케이프 처리할 문자열
     * @returns {string} - 이스케이프 처리된 문자열
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const userManager = new UserManager();
export default userManager;
