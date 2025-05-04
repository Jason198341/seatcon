/**
 * 메인 애플리케이션 모듈
 * 
 * 애플리케이션의 진입점으로, 전체 기능을 초기화하고 연결합니다.
 * 모듈 간 상호작용 및 이벤트 처리를 관리합니다.
 */

import CONFIG from './config.js';
import supabaseClient from './supabase-client.js';
import translationService from './translation.js';
import userManager from './user.js';
import chatManager from './chat.js';
import mobileUI from './mobile-ui.js';
import i18nService from './i18n.js';
import * as utils from './utils.js';

/**
 * 애플리케이션 클래스
 */
class ConferenceChatApp {
    constructor() {
        // 앱 상태
        this.isInitialized = false;
        this.isLoggedIn = false;
        this.isFormValidated = false;
        this.currentTheme = 'light';
        
        // 컨퍼런스 정보
        this.conferenceData = null;
        
        // DOM 요소 참조
        this.themeToggle = null;
        this.currentSpeakerId = 'global-chat';
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            // 환경 호환성 검사
            this.checkEnvironment();
            
            // Supabase 연결 확인
            if (!supabaseClient.supabase) {
                console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
                await supabaseClient.init();
            }
            
            // Supabase 실시간 구독 활성화 확인
            console.log('Checking Supabase realtime capability...');
            try {
                const channel = supabaseClient.supabase.channel('test');
                channel.subscribe(status => {
                    console.log(`Supabase realtime test status: ${status}`);
                    if (status === 'SUBSCRIBED') {
                        console.log('Supabase realtime is working.');
                        // 테스트 후 구독 해제
                        setTimeout(() => {
                            channel.unsubscribe();
                        }, 1000);
                    }
                });
            } catch (realtimeError) {
                console.warn('실시간 구독 테스트 오류:', realtimeError);
            }
            
            // 다국어 지원 초기화
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const savedLanguage = localStorage.getItem('preferredLanguage');
            
            if (!savedLanguage && isMobile) {
                // 모바일에서 처음 접속 시
                i18nService.setLanguage('en', false);
                supabaseClient.setPreferredLanguage('en');
            } else {
                const currentLanguage = savedLanguage || 'ko';
                i18nService.setLanguage(currentLanguage, false); // 이벤트 발생 없이 초기화
            }
            i18nService.updateAllTexts();
            
            // DOM 요소 참조 설정
            this.setupDOMReferences();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 컨퍼런스 데이터 로드
            await this.loadConferenceData();
            
            // 사용자 관리자 초기화
            this.initUserManager();
            
            // 테마 설정
            this.initTheme();
            
            // 모바일 UI 초기화
            this.initMobileUI();
            
            // 초기화 완료
            this.isInitialized = true;
            
            utils.log('Application initialized successfully');
            
        } catch (error) {
            utils.logError('Application initialization failed', error);
            this.showErrorDialog('애플리케이션 초기화 실패', '애플리케이션을 초기화하는 중 오류가 발생했습니다. 페이지를 새로고침하거나 나중에 다시 시도해주세요.');
        }
    }

    /**
     * 환경 호환성 검사
     */
    checkEnvironment() {
        // 브라우저 호환성 확인
        const compatibility = utils.checkBrowserCompatibility();
        
        // 필수 기능 확인
        if (!compatibility.localStorage || !compatibility.webSockets || !compatibility.fetch) {
            throw new Error('현재 브라우저가 필요한 기능을 지원하지 않습니다. 최신 브라우저로 업데이트해주세요.');
        }
        
        utils.log('Environment check passed', compatibility);
    }

    /**
     * DOM 요소 참조 설정
     */
    setupDOMReferences() {
        this.themeToggle = document.getElementById('themeToggle');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 테마 토글 이벤트
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 화면 크기 변경 감지
        window.addEventListener('resize', utils.throttle(() => {
            this.handleResize();
        }, 200));
    }

    /**
     * 컨퍼런스 데이터 로드
     */
    async loadConferenceData() {
        try {
            // 실제 구현에서는 서버나 Supabase에서 데이터를 가져옵니다.
            // 현재는 예시 데이터를 사용합니다.
            this.conferenceData = {
                title: '2025 글로벌 시트 컨퍼런스',
                date: '2025년 6월 16일~19일',
                location: '인도 하이데라바드 인도기술연구소',
                speakers: [
                    { id: 'global-chat', name: '전체 채팅', role: 'global' },
                    { id: 'speaker-1', name: '나선채 책임 - 시트 TRM 기술 트랜드 분석', role: 'speaker' },
                    { id: 'speaker-2', name: '이상학 책임 - Feature 기반 시트 개발 전략', role: 'speaker' },
                    { id: 'speaker-3', name: '백설 책임 - 바디 아키텍처 운영 전략', role: 'speaker' },
                    { id: 'speaker-4', name: '이상현 책임 - SDV 개발전략과 바디부문 대응방안', role: 'speaker' },
                    { id: 'speaker-5', name: '하성동 님 - 현대내장디자인 미래 운영전략', role: 'speaker' },
                    { id: 'speaker-6', name: '노태형 책임 - 기아 시트 미래 운영전략', role: 'speaker' },
                    { id: 'speaker-7', name: '서원진 책임 - 시트관련 미래 재료 운영전략', role: 'speaker' },
                    { id: 'speaker-8', name: '진우재 팀장 - 차세대 코어 메커니즘 개발', role: 'exhibitor' },
                    { id: 'speaker-9', name: '김상현 매니저 - LCD 터치 디스플레이 백 시트 공기 청정기', role: 'exhibitor' },
                    { id: 'speaker-10', name: '문지환 매니저 - 후석 공압식 시트', role: 'exhibitor' }
                ],
                topics: [
                    '시트 TRM 기술 트랜드 분석',
                    'Feature 기반 시트 중장기 개발 전략',
                    '바디 아키텍처 운영 전략',
                    'SDV 개발전략과 바디부문 대응방안',
                    '현대내장디자인 미래 운영전략',
                    '기아 시트 미래 운영전략',
                    '시트관련 미래 재료 운영전략'
                ]
            };
            
            // 페이지 타이틀 업데이트
            document.title = this.conferenceData.title;
            
            // 컨퍼런스 정보 표시
            this.updateConferenceInfo();
            
            utils.log('Conference data loaded', this.conferenceData);
            
        } catch (error) {
            utils.logError('Error loading conference data', error);
            throw new Error('컨퍼런스 정보를 로드할 수 없습니다.');
        }
    }

    /**
     * 컨퍼런스 정보 업데이트
     */
    updateConferenceInfo() {
        if (!this.conferenceData) return;
        
        // 모든 i18n 태그가 있는 요소는 i18nService에서 자동으로 업데이트
        i18nService.updateAllTexts();
    }

    /**
     * 사용자 관리자 초기화
     */
    initUserManager() {
        userManager.init({
            formId: 'userInfoForm',
            languageSelectorId: 'languageSelector',
            roleSelectorId: 'roleSelector',
            loginButtonId: 'loginButton',
            logoutButtonId: 'logoutButton',
            userInfoId: 'userInfo',
            
            // 사용자 로그인 콜백
            onUserLogin: (user) => {
                this.handleUserLogin(user);
            },
            
            // 사용자 로그아웃 콜백
            onUserLogout: (user) => {
                this.handleUserLogout(user);
            },
            
            // 언어 변경 콜백
            onLanguageChange: (language) => {
                this.handleLanguageChange(language);
            }
        });
        
        // 현재 사용자 상태 확인
        const currentUser = userManager.getCurrentUser();
        this.isLoggedIn = !!currentUser;
        
        if (this.isLoggedIn) {
            this.initChatManager();
        }
    }

    /**
     * 채팅 관리자 초기화
     */
    initChatManager() {
        chatManager.init({
            containerid: 'chatContainer',
            messageListId: 'messageList',
            messageFormId: 'messageForm',
            messageInputId: 'messageInput',
            sendButtonId: 'sendButton',
            loadMoreButtonId: 'loadMoreButton',
            speakerId: this.currentSpeakerId
        });
    }

    /**
     * 모바일 UI 초기화
     */
    initMobileUI() {
        mobileUI.init({
            conferenceData: this.conferenceData,
            onLanguageChange: (language) => {
                this.handleLanguageChange(language);
            },
            onLogout: () => {
                userManager.handleLogout();
            }
        });
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Mobile UI initialized');
        }
    }

    /**
     * 테마 초기화
     */
    initTheme() {
        // 저장된 테마 설정 확인
        const savedTheme = localStorage.getItem('theme');
        
        // 시스템 다크 모드 감지
        const systemDarkMode = utils.isDarkModeEnabled();
        
        // 테마 설정
        this.currentTheme = savedTheme || (systemDarkMode ? 'dark' : 'light');
        this.applyTheme(this.currentTheme);
        
        utils.log('Theme initialized', this.currentTheme);
    }

    /**
     * 테마 전환
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        utils.log('Theme toggled', newTheme);
    }

    /**
     * 테마 적용
     * @param {string} theme - 테마 ('light' 또는 'dark')
     */
    applyTheme(theme) {
        // 테마 클래스 설정
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        
        // 테마 변수 업데이트
        this.currentTheme = theme;
        
        // 테마 설정 저장
        localStorage.setItem('theme', theme);
        
        // 테마 토글 버튼 업데이트
        if (this.themeToggle) {
            this.themeToggle.innerHTML = theme === 'light' ? 
                '<i class="fas fa-moon"></i>' : 
                '<i class="fas fa-sun"></i>';
            
            this.themeToggle.title = theme === 'light' ? 
                '다크 모드로 전환' : 
                '라이트 모드로 전환';
        }
        
        // 테마 변경 이벤트 발생
        window.dispatchEvent(new CustomEvent('theme-changed', { 
            detail: { theme } 
        }));
    }

    /**
     * 사용자 로그인 처리
     * @param {Object} user - 사용자 정보
     */
    handleUserLogin(user) {
        this.isLoggedIn = true;
        
        // 사용자 정보 폼 숨기고 채팅 컨테이너 표시
        const userInfoFormContainer = document.getElementById('userInfoFormContainer');
        const chatContainer = document.getElementById('chatContainer');
        
        if (userInfoFormContainer && chatContainer) {
            userInfoFormContainer.style.display = 'none';
            chatContainer.style.display = 'flex';
        }
        
        // 채팅 관리자 초기화
        this.initChatManager();
        
        utils.log('User logged in', user);
    }

    /**
     * 사용자 로그아웃 처리
     * @param {Object} user - 사용자 정보
     */
    handleUserLogout(user) {
        this.isLoggedIn = false;
        
        // 채팅 컨테이너 숨기고 사용자 정보 폼 표시
        const userInfoFormContainer = document.getElementById('userInfoFormContainer');
        const chatContainer = document.getElementById('chatContainer');
        
        if (userInfoFormContainer && chatContainer) {
            userInfoFormContainer.style.display = 'block';
            chatContainer.style.display = 'none';
        }
        
        // 채팅 관리자 정리
        if (chatManager) {
            chatManager.cleanup();
        }
        
        utils.log('User logged out', user);
    }

    /**
     * 언어 변경 처리
     * @param {string} language - 언어 코드
     */
    handleLanguageChange(language) {
        if (!translationService.isSupportedLanguage(language)) {
            utils.logWarning('Unsupported language', language);
            return;
        }
        
        // i18n 언어 변경 - 이벤트 발생 없이 바로 변경
        i18nService.currentLanguage = language;
        localStorage.setItem('preferredLanguage', language);
        i18nService.updateAllTexts();
        
        // 컬퍼런스 정보 다국어 처리
        this.updateConferenceInfo();
        
        // 채팅 관리자에 언어 변경 알림
        if (chatManager) {
            chatManager.handleLanguageChange(language);
        }
        
        utils.log('Language changed', language);
    }

    /**
     * 화면 크기 변경 처리
     */
    handleResize() {
        // 모바일 여부 확인
        const deviceType = utils.detectDeviceType();
        document.body.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
        document.body.classList.add(`device-${deviceType}`);
        
        utils.log('Window resized', { deviceType });
    }

    /**
     * 오류 다이얼로그 표시
     * @param {string} title - 오류 제목
     * @param {string} message - 오류 메시지
     */
    showErrorDialog(title, message) {
        // 기존 오류 다이얼로그 제거
        const existingDialog = document.querySelector('.error-dialog');
        if (existingDialog) {
            document.body.removeChild(existingDialog);
        }
        
        // 오류 다이얼로그 생성
        const dialog = document.createElement('div');
        dialog.className = 'error-dialog';
        dialog.innerHTML = `
            <div class="error-dialog-content">
                <div class="error-dialog-header">
                    <h3>${utils.escapeHtml(title)}</h3>
                    <button class="error-dialog-close">&times;</button>
                </div>
                <div class="error-dialog-body">
                    <p>${utils.escapeHtml(message)}</p>
                </div>
                <div class="error-dialog-footer">
                    <button class="error-dialog-button">확인</button>
                </div>
            </div>
        `;
        
        // 닫기 이벤트 설정
        const closeDialog = () => {
            dialog.classList.add('closing');
            setTimeout(() => {
                if (dialog.parentNode) {
                    document.body.removeChild(dialog);
                }
            }, 300);
        };
        
        dialog.querySelector('.error-dialog-close').addEventListener('click', closeDialog);
        dialog.querySelector('.error-dialog-button').addEventListener('click', closeDialog);
        
        // 다이얼로그 표시
        document.body.appendChild(dialog);
        
        // 애니메이션 효과
        setTimeout(() => {
            dialog.classList.add('show');
        }, 10);
    }

    /**
     * 정리
     */
    cleanup() {
        // 이벤트 리스너 정리
        window.removeEventListener('resize', this.handleResize);
        
        // 구독 해제
        if (chatManager) {
            chatManager.cleanup();
        }
        
        utils.log('Application cleanup complete');
    }
}

// 애플리케이션 인스턴스 생성
const app = new ConferenceChatApp();

// DOM 로드 후 애플리케이션 초기화
utils.onDOMReady(() => {
    app.init();
});

// 앱 객체 내보내기
export default app;
