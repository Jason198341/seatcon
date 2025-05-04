/**
 * 모바일 UI 관련 기능
 * 
 * 모바일 하단 네비게이션 및 모달 관련 기능을 제공합니다.
 */

import CONFIG from './config.js';
import supabaseClient from './supabase-client.js';
import translationService from './translation.js';
import * as utils from './utils.js';

class MobileUI {
    constructor() {
        // DOM 요소 참조
        this.chatNav = null;
        this.userInfoNav = null;
        this.languageNav = null;
        this.infoNav = null;
        this.bottomNavItems = null;
        
        // 콜백 함수
        this.onLanguageChange = null;
        this.onLogout = null;
    }

    /**
     * 모바일 UI 초기화
     * @param {Object} options - 초기화 옵션
     */
    init(options = {}) {
        // DOM 요소 참조 설정
        this.chatNav = document.getElementById('chatNav');
        this.userInfoNav = document.getElementById('userInfoNav');
        this.languageNav = document.getElementById('languageNav');
        this.infoNav = document.getElementById('infoNav');
        this.bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        
        // 콜백 설정
        this.onLanguageChange = options.onLanguageChange || null;
        this.onLogout = options.onLogout || null;
        this.conferenceData = options.conferenceData || null;
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('MobileUI initialized');
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 하단 네비게이션 이벤트 설정
        if (this.bottomNavItems) {
            this.bottomNavItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleBottomNavClick(item);
                });
            });
            
            // 다국어 업데이트 추가
            document.addEventListener('language-changed', () => {
                this.updateNavTexts();
            });
            
            // 초기 텍스트 설정
            this.updateNavTexts();
        }
        
        // 채팅 네비게이션 이벤트
        if (this.chatNav) {
            this.chatNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.showChatUI();
            });
        }
        
        // 사용자 정보 네비게이션 이벤트
        if (this.userInfoNav) {
            this.userInfoNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleUserInfoNavClick();
            });
        }
        
        // 언어 네비게이션 이벤트
        if (this.languageNav) {
            this.languageNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLanguageModal();
            });
        }
        
        // 정보 네비게이션 이벤트
        if (this.infoNav) {
            this.infoNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.showInfoModal();
            });
        }
    }

    /**
     * 하단 네비게이션 클릭 처리
     * @param {HTMLElement} clickedItem - 클릭된 네비게이션 아이템
     */
    handleBottomNavClick(clickedItem) {
        // 활성 상태 업데이트
        this.bottomNavItems.forEach(item => {
            item.classList.remove('active');
        });
        
        clickedItem.classList.add('active');
    }

    /**
     * 채팅 UI 표시
     */
    showChatUI() {
        const userInfoFormContainer = document.getElementById('userInfoFormContainer');
        const chatContainer = document.getElementById('chatContainer');
        
        // 로그인 상태가 아니면 로그인 폼 표시
        const currentUser = supabaseClient.getSavedUserInfo();
        
        if (!currentUser) {
            if (userInfoFormContainer) {
                userInfoFormContainer.style.display = 'block';
            }
            if (chatContainer) {
                chatContainer.style.display = 'none';
            }
            return;
        }
        
        // 로그인 상태면 채팅 UI 표시
        if (userInfoFormContainer) {
            userInfoFormContainer.style.display = 'none';
        }
        if (chatContainer) {
            chatContainer.style.display = 'flex';
        }
    }

    /**
     * 사용자 정보 네비게이션 클릭 처리
     */
    handleUserInfoNavClick() {
        const user = supabaseClient.getSavedUserInfo();
        
        if (user) {
            // 현재 사용자 정보 표시 (모달)
            this.showUserInfoModal(user);
        } else {
            // 로그인 폼 표시
            const userInfoFormContainer = document.getElementById('userInfoFormContainer');
            const chatContainer = document.getElementById('chatContainer');
            
            if (userInfoFormContainer && chatContainer) {
                userInfoFormContainer.style.display = 'block';
                chatContainer.style.display = 'none';
            }
        }
    }

    /**
     * 사용자 정보 모달 표시
     * @param {Object} user - 사용자 정보
     */
    showUserInfoModal(user) {
        // 모달 요소 생성
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const roleInfo = this.getRoleInfo(user.role);
        const roleName = roleInfo ? roleInfo.name : user.role;
        
        const languageInfo = this.getLanguageInfo(supabaseClient.getPreferredLanguage());
        const languageName = languageInfo ? `${languageInfo.flag} ${languageInfo.name}` : supabaseClient.getPreferredLanguage();
        
        const modalContent = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${i18nService.get('profileTabTitle')}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>${i18nService.get('profileName')}:</strong> ${utils.escapeHtml(user.name)}</p>
                    <p><strong>${i18nService.get('profileEmail')}:</strong> ${utils.escapeHtml(user.email)}</p>
                    <p><strong>${i18nService.get('profileRole')}:</strong> ${utils.escapeHtml(roleName)}</p>
                    <p><strong>${i18nService.get('profileLanguage')}:</strong> ${utils.escapeHtml(languageName)}</p>
                </div>
                <div class="modal-footer">
                    <button class="button secondary modal-close-btn">${i18nService.get('closeButton')}</button>
                    <button class="button logout-btn">${i18nService.get('logoutButton')}</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // 모달 표시 애니메이션
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // 닫기 버튼 이벤트
        const closeBtn = modal.querySelector('.modal-close');
        const closeBtnFooter = modal.querySelector('.modal-close-btn');
        const logoutBtn = modal.querySelector('.logout-btn');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeBtnFooter.addEventListener('click', closeModal);
        
        // 로그아웃 버튼 이벤트
        logoutBtn.addEventListener('click', () => {
            closeModal();
            
            // 로그아웃 콜백 호출
            if (typeof this.onLogout === 'function') {
                this.onLogout();
            }
        });
    }

    /**
     * 언어 선택 모달 표시
     */
    showLanguageModal() {
        const currentLanguage = supabaseClient.getPreferredLanguage();
        
        // 모달 요소 생성
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        let languageOptions = '';
        CONFIG.LANGUAGES.forEach(lang => {
            const selected = currentLanguage === lang.code ? 'checked' : '';
            languageOptions += `
                <div class="language-option">
                    <input type="radio" name="language" id="lang-${lang.code}" value="${lang.code}" ${selected}>
                    <label for="lang-${lang.code}">${lang.flag} ${utils.escapeHtml(lang.name)}</label>
                </div>
            `;
        });
        
        const modalContent = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${i18nService.get('languageSettingsTitle')}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="mb-3">${i18nService.get('languageSettingsDescription')}</p>
                    <form id="languageForm">
                        ${languageOptions}
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="button secondary modal-close-btn">${i18nService.get('cancelButton')}</button>
                    <button class="button save-language-btn">${i18nService.get('saveButton')}</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // 모달 표시 애니메이션
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // 닫기 버튼 이벤트
        const closeBtn = modal.querySelector('.modal-close');
        const closeBtnFooter = modal.querySelector('.modal-close-btn');
        const saveBtn = modal.querySelector('.save-language-btn');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeBtnFooter.addEventListener('click', closeModal);
        
        // 저장 버튼 이벤트
        saveBtn.addEventListener('click', () => {
            const selectedLanguage = modal.querySelector('input[name="language"]:checked');
            
            if (selectedLanguage) {
                const newLanguage = selectedLanguage.value;
                
                if (newLanguage !== currentLanguage) {
                    supabaseClient.setPreferredLanguage(newLanguage);
                    
                    // 언어 변경 콜백 호출
                    if (typeof this.onLanguageChange === 'function') {
                        this.onLanguageChange(newLanguage);
                    }
                }
            }
            
            closeModal();
        });
    }

    /**
     * 컨퍼런스 정보 모달 표시
     */
    showInfoModal() {
        if (!this.conferenceData) return;
        
        // 모달 요소 생성
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const modalContent = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${i18nService.get('conferenceInfoTitle')}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <h4 class="mb-2">${utils.escapeHtml(this.conferenceData.title)}</h4>
                    <p class="mb-3"><strong>${i18nService.get('conferenceDate')}:</strong> ${utils.escapeHtml(this.conferenceData.date)}</p>
                    <p class="mb-3"><strong>${i18nService.get('conferenceVenue')}:</strong> ${utils.escapeHtml(this.conferenceData.location)}</p>
                    
                    <h5 class="mb-2">${i18nService.get('conferenceSchedule')}</h5>
                    <ul class="mb-3">
                        ${this.conferenceData.topics.map(topic => `<li>${utils.escapeHtml(topic)}</li>`).join('')}
                    </ul>
                    
                    <p class="text-center mt-4">
                        <small>© 2025 ${i18nService.get('conferenceTitle')}. All rights reserved.</small>
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="button modal-close-btn">${i18nService.get('closeButton')}</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // 모달 표시 애니메이션
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // 닫기 버튼 이벤트
        const closeBtn = modal.querySelector('.modal-close');
        const closeBtnFooter = modal.querySelector('.modal-close-btn');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeBtnFooter.addEventListener('click', closeModal);
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
     * 언어 코드로 언어 정보 가져오기
     * @param {string} languageCode - 언어 코드
     * @returns {Object|null} - 언어 정보
     */
    getLanguageInfo(languageCode) {
        return CONFIG.LANGUAGES.find(l => l.code === languageCode) || null;
    }
    
    /**
     * 하단 네비게이션 텍스트 업데이트
     */
    updateNavTexts() {
        // 채팅 탭
        if (this.chatNav) {
            const chatNavText = this.chatNav.querySelector('[data-i18n="navChat"]');
            if (chatNavText) {
                chatNavText.textContent = i18nService.get('navChat');
            }
        }
        
        // 내 정보 탭
        if (this.userInfoNav) {
            const userInfoNavText = this.userInfoNav.querySelector('[data-i18n="navProfile"]');
            if (userInfoNavText) {
                userInfoNavText.textContent = i18nService.get('navProfile');
            }
        }
        
        // 언어 탭
        if (this.languageNav) {
            const languageNavText = this.languageNav.querySelector('[data-i18n="navLanguage"]');
            if (languageNavText) {
                languageNavText.textContent = i18nService.get('navLanguage');
            }
        }
        
        // 정보 탭
        if (this.infoNav) {
            const infoNavText = this.infoNav.querySelector('[data-i18n="navInfo"]');
            if (infoNavText) {
                infoNavText.textContent = i18nService.get('navInfo');
            }
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const mobileUI = new MobileUI();
export default mobileUI;
