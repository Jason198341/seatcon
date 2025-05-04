/**
 * 사용자 관리 모듈
 * 
 * 사용자 정보 관리, 유효성 검사, 인터페이스 관련 기능을 제공합니다.
 * 사용자 로그인/로그아웃, 프로필 설정 등을 처리합니다.
 */

import CONFIG from './config.js';
import supabaseClient from './supabase-client.js';
import translationService from './translation.js';

class UserManager {
    constructor() {
        this.userInfoForm = null;
        this.languageSelector = null;
        this.roleSelector = null;
        this.loginButton = null;
        this.logoutButton = null;
        this.userInfo = null;
        
        // 현재 사용자
        this.currentUser = null;
        
        // 이벤트 핸들러
        this.onUserLogin = null;
        this.onUserLogout = null;
        this.onLanguageChange = null;
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
        
        // 폼 이벤트 리스너 등록
        this.setupEventListeners();
        
        // 현재 상태에 따라 UI 업데이트
        this.updateUI();
    }

    /**
     * 언어 옵션 설정
     */
    setupLanguageOptions() {
        if (!this.languageSelector) return;
        
        // 기존 옵션 제거
        this.languageSelector.innerHTML = '';
        
        // 언어 옵션 추가
        CONFIG.LANGUAGES.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = `${lang.flag} ${lang.name}`;
            this.languageSelector.appendChild(option);
        });
        
        // 현재 선호 언어 선택
        this.languageSelector.value = supabaseClient.getPreferredLanguage();
    }

    /**
     * 역할 옵션 설정
     */
    setupRoleOptions() {
        if (!this.roleSelector) return;
        
        // 기존 옵션 제거
        this.roleSelector.innerHTML = '';
        
        // 역할 옵션 추가
        CONFIG.USER_ROLES.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            this.roleSelector.appendChild(option);
        });
        
        // 기본 역할 선택 (첫 번째 역할)
        if (CONFIG.USER_ROLES.length > 0) {
            this.roleSelector.value = CONFIG.USER_ROLES[0].id;
        }
        
        // 현재 사용자가 있으면 해당 역할 선택
        if (this.currentUser && this.currentUser.role) {
            this.roleSelector.value = this.currentUser.role;
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
            this.languageSelector.addEventListener('change', () => {
                this.handleLanguageChange();
            });
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
        const confirmLogout = confirm('정말 로그아웃하시겠습니까?');
        
        if (!confirmLogout) {
            return;
        }
        
        // 로그아웃 전 사용자 정보 저장
        const prevUser = this.currentUser;
        
        // 사용자 정보 삭제
        supabaseClient.clearUserInfo();
        this.currentUser = null;
        
        // UI 업데이트
        this.updateUI();
        
        // 채팅 화면에서 로그인 화면으로 전환
        const userInfoFormContainer = document.getElementById('userInfoFormContainer');
        const chatContainer = document.getElementById('chatContainer');
        
        if (userInfoFormContainer && chatContainer) {
            userInfoFormContainer.style.display = 'block';
            chatContainer.style.display = 'none';
            
            // 입력 필드 초기화
            const nameInput = userInfoFormContainer.querySelector('#userName');
            const emailInput = userInfoFormContainer.querySelector('#userEmail');
            
            if (prevUser && nameInput && emailInput) {
                nameInput.value = prevUser.name || '';
                emailInput.value = prevUser.email || '';
            }
        }
        
        // Supabase 연결 정리
        supabaseClient.cleanup();
        
        // 로그아웃 이벤트 콜백 호출
        if (typeof this.onUserLogout === 'function' && prevUser) {
            this.onUserLogout(prevUser);
        }
        
        // 페이지 스크롤을 맨 위로 이동
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('User logged out');
        }
        
        // 로그아웃 성공 메시지 표시 (선택 사항)
        this.showLogoutSuccessMessage();
    }
    
    /**
     * 로그아웃 성공 메시지 표시
     */
    showLogoutSuccessMessage() {
        // 토스트 메시지 생성
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = '로그아웃이 완료되었습니다.';
        
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
     * 언어 변경 처리
     */
    handleLanguageChange() {
        if (!this.languageSelector) return;
        
        const newLanguage = this.languageSelector.value;
        
        // 유효한 언어 코드인지 확인
        if (!translationService.isSupportedLanguage(newLanguage)) {
            console.error(`Unsupported language: ${newLanguage}`);
            return;
        }
        
        // 선호 언어 변경
        supabaseClient.setPreferredLanguage(newLanguage);
        
        // 언어 변경 이벤트 콜백 호출
        if (typeof this.onLanguageChange === 'function') {
            this.onLanguageChange(newLanguage);
        }
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log(`Language changed to: ${newLanguage}`);
        }
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
        if (!role || !CONFIG.USER_ROLES.some(r => r.id === role)) {
            alert('유효한 역할을 선택해주세요.');
            return false;
        }
        
        return true;
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
