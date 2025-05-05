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
import exhibitionManager from './exhibition.js';
import speakersManager from './speakers.js';
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
        
        // 전시물 및 발표자 데이터
        this.exhibitionData = [];
        this.speakersData = [];
        
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
            
            // 설정 로드 대기
            console.log('환경 변수 설정을 로드하는 중...');
            try {
                await CONFIG.waitForConfig();
                console.log('환경 변수 설정 로드 완료');
            } catch (configError) {
                console.error('환경 변수 설정 로드 실패:', configError);
                this.showErrorDialog('설정 로드 실패', '환경 변수를 로드할 수 없습니다. 서버가 실행 중인지 확인하세요.');
            }
            
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
            // 전시물 데이터 파싱
            const exhibitionItems = [
                { no: 1, title: "차세대 코어 메커니즘 개발 (트랙, 리클라이너, 기어박스, 펌핑디바이스, 랫치)", company: "대원정밀공업", name: "진우재 팀장", phone: "010 8761 5269", email: "woojae_jin@dwjm.co.kr" },
                { no: 2, title: "LCD 터치 디스플레이 백 시트 공기 청정기", company: "대유에이텍", name: "김상현 매니저", phone: "010 9463 3658", email: "shkim@dayou.co.kr" },
                { no: 3, title: "후석 공압식 시트", company: "대유에이텍", name: "문지환 매니저", phone: "010 3123 6929", email: "mason@dayou.co.kr" },
                { no: 4, title: "후석 공압식 시트_발판", company: "대유에이텍", name: "문지환 매니저", phone: "010 3123 6929", email: "mason@dayou.co.kr" },
                { no: 5, title: "롤러식 마사지 모듈적용 라운지 릴렉스 시트", company: "대원산업", name: "신재광 책임", phone: "010 8720 4434", email: "jkshin@dwsu.co.kr" },
                { no: 6, title: "롤러식 마사지 모듈적용 라운지 릴렉스 시트", company: "대원산업", name: "신재광 책임", phone: "010 8720 4434", email: "jkshin@dwsu.co.kr" },
                { no: 7, title: "Seat Components: Cushion Extension (Manual)", company: "Brose India", name: "Pradnyesh Patil, Jeong, Gwang-Ho", phone: "+91 9552537275, +91 7720095473", email: "Pradnyesh.patil@brose.com, Gwang-Ho.Jeong@brose.com" },
                { no: 8, title: "Seat Components: Calf Rest (Legrest)", company: "Brose India", name: "", phone: "", email: "" },
                { no: 9, title: "Seat Components: Rear Power Striker", company: "Brose India", name: "", phone: "", email: "" },
                { no: 10, title: "Seat Components: Lumbar Support (Power mechanical)", company: "Brose India", name: "", phone: "", email: "" },
                { no: 11, title: "Seat structure: 8 way Power seat with BLDC", company: "Brose India", name: "", phone: "", email: "" },
                { no: 12, title: "Seat Structure: Reference seat (Light weight & cost efficient)", company: "Brose India", name: "", phone: "", email: "" },
                { no: 13, title: "Seat Structure: Relax seat (combined with all comfrot features)", company: "Brose India", name: "", phone: "", email: "" },
                { no: 14, title: "Complete seat: Slim seat with belt integration", company: "Brose India", name: "", phone: "", email: "" },
                { no: 15, title: "Seat Components: Power Cushion Extension", company: "Brose India", name: "", phone: "", email: "" },
                { no: 16, title: "롤러 마사지 시트", company: "디에스시동탄", name: "최민식 책임", phone: "010-4582-4830", email: "mschoi2@godsc.co.kr" },
                { no: 17, title: "파워스트라이크 적용시트", company: "디에스시동탄", name: "황인창 책임", phone: "010-2547-7249", email: "ichwang@godsc.co.kr" },
                { no: 18, title: "개인특화 엔터테인먼트 시트", company: "디에스시동탄", name: "박문수 매니저", phone: "010-7232-8140", email: "mspark@godsc.co.kr" },
                { no: 19, title: "파워롱레일+파워스위블 적용 시트 (스위블 브레이크 모듈 별도 전시)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 20, title: "매뉴얼 릴렉션 시트#1 - 레버타입(틸팅 & 릴렉션)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 21, title: "매뉴얼 릴렉션 시트#2 - 버튼타입", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 22, title: "파워 릴렉션 시트#1 - 4절 링크타입", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 23, title: "파워 릴렉션 시트#2 - 5절 링크타입", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 24, title: "백 연동 다단 암레스트 시트", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 25, title: "CORE (DTP10h/DRM10h/DRP10h)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 26, title: "고강도 래치 (2단 / 1단 - 2종 전시)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 27, title: "무빙 블레이드 매뉴얼 롱레일", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 28, title: "고성능 스마트 릴리즈 액츄에이터", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 29, title: "경형 표준프레임 1열 (MQ4i 현지화 대응)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 30, title: "신흥국 2열 프레임 - 6측 프레임 (MQ4i 현지화 대응)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 31, title: "신흥국 2열 프레임 - 4측 프레임 (MQ4i 현지화 대응)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 32, title: "신흥국 2열 프레임 - 릴렉션 (MQ4i 현지화 대응)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 33, title: "신흥국 3열 프레임 (MQ4i 현지화 대응)", company: "다스", name: "이재갑 책임", phone: "010 9681 4567", email: "LJG4444@i-das.com" },
                { no: 34, title: "Air-tube형 통풍시트 원단", company: "케이엠모터스㈜", name: "안윤희 전무 (연구소장)", phone: "010 3000 5686", email: "hiyhahn@naver.com" },
                { no: 35, title: "통풍 시트", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 36, title: "Rubbing Massage 시트", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 37, title: "Adaptive 시트", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 38, title: "통풍+맛사지 시트", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 39, title: "Multi function seat", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 40, title: "CDS 부품", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 41, title: "CHS 부품", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 42, title: "OCS 부품", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 43, title: "통풍 부품", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 44, title: "공압 제품", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 45, title: "SBR", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 46, title: "Seat Heater", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 47, title: "공압", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 48, title: "통풍", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 49, title: "공압", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 50, title: "히터 및 기타", company: "AEW", name: "이진성 총감", phone: "010 5588 8981", email: "james.lee@aew-group.com" },
                { no: 51, title: "Lear ComfortMaxR & Core Mechanism", company: "리어코리아", name: "김용환 책임", phone: "010 3778 6934", email: "jkim@lear.com" },
                { no: 52, title: "경형프레임 매뉴얼 레그레스트", company: "현대트랜시스", name: "황성준 연구", phone: "010-2773-3723", email: "sungjunh@hyundai-transys.com" },
                { no: 53, title: "2세대 경형 슬림 백 프레임", company: "현대트랜시스", name: "황성준 연구", phone: "010-2773-3723", email: "sungjunh@hyundai-transys.com" },
                { no: 54, title: "경형 프레임(MNL/PWR)", company: "현대트랜시스", name: "황성준 연구", phone: "010-2773-3723", email: "sungjunh@hyundai-transys.com" },
                { no: 55, title: "콘솔 레일", company: "현대트랜시스", name: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
                { no: 56, title: "매뉴얼 리클라이너", company: "현대트랜시스", name: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
                { no: 57, title: "파워 리클라이너", company: "현대트랜시스", name: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
                { no: 58, title: "대칭 매뉴얼/파워 레일", company: "현대트랜시스", name: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
                { no: 59, title: "비대칭 매뉴얼/파워 레일", company: "현대트랜시스", name: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
                { no: 60, title: "펌핑", company: "현대트랜시스", name: "손동현 책임", phone: "010-5241-7542", email: "dhyeon.son@hyundai-transys.com" },
                { no: 61, title: "제어기 일체형 블로워 모듈", company: "현대트랜시스", name: "이화준 연구", phone: "031-5177-9246", email: "82104532@hyundai-transys.com" },
                { no: 62, title: "후석 센터 암레스트 직구동 파워사양 선행 연구", company: "현대트랜시스", name: "송혁 책임", phone: "010-2640-8509", email: "good4jay@hyundai-transys.com" },
                { no: 63, title: "SUV차종 2열 워크쓰루 공간 확보를 위한 독립시트 암레스트 백 수납 구조 개발", company: "현대트랜시스", name: "조용진 연구", phone: "010-2656-5415", email: "dragonj0@hyundai-transys.com" }
            ];
            
            // 발표자 데이터 파싱
            const speakerItems = [
                { no: 1, topic: "24~25년 시트 TRM 기술 트랜드 분석", group: "남양", department: "MLV내장설계1팀", presenter: "나선채 책임" },
                { no: 2, topic: "Feature 기반 시트 중장기 개발 전략", group: "남양", department: "바디선행개발팀", presenter: "이상학 책임" },
                { no: 3, topic: "바디 아키텍처 운영 전략", group: "남양", department: "아키텍처시스템기획팀", presenter: "백설 책임" },
                { no: 4, topic: "SDV 개발전략과 바디부문 대응방안", group: "남양", department: "바디융합선행개발팀", presenter: "이상현 책임" },
                { no: 5, topic: "현대내장디자인 미래 운영전략", group: "남양", department: "현대내장디자인실", presenter: "하성동 님" },
                { no: 6, topic: "기아 시트 미래 운영전략", group: "남양", department: "기아넥스트내장DeX팀", presenter: "노태형 책임" },
                { no: 7, topic: "시트관련 미래 재료운영전략", group: "남양", department: "내외장재료개발팀", presenter: "서원진 책임" },
                { no: 8, topic: "유럽지역 경쟁사 트랜드 및 고객 기술니즈", group: "해외연구소", department: "유럽 디자인센터", presenter: "김민호 책임" },
                { no: 9, topic: "중국지역 경쟁사 트랜드 및 고객 기술니즈", group: "해외연구소", department: "중국기술연구소", presenter: "장우영 책임" },
                { no: 10, topic: "인도네시아 경쟁사 트랜드 및 고객 기술니즈", group: "해외연구소", department: "인도네시아연구소", presenter: "김태완 책임" }
            ];
            
            // 데이터 저장
            this.exhibitionData = exhibitionItems;
            this.speakersData = speakerItems;
            
            // 컨퍼런스 정보 생성
            this.conferenceData = {
                title: '2025 글로벌 시트 컨퍼런스',
                date: '2025년 6월 16일~19일',
                location: '인도 하이데라바드 인도기술연구소',
                topics: speakerItems.map(item => item.topic),
                speakers: [
                    { id: 'global-chat', name: '전체 채팅', role: 'global' },
                    ...speakerItems.map((item, index) => ({
                        id: `speaker-${index + 1}`,
                        name: `${item.presenter} - ${item.topic}`, 
                        role: 'speaker'
                    })),
                    ...exhibitionItems.slice(0, 10).map((item, index) => ({
                        id: `exhibitor-${index + 1}`,
                        name: `${item.name} - ${item.title}`,
                        role: 'exhibitor'
                    }))
                ]
            };
            
            // 전시물 관리자 초기화
            exhibitionManager.init({
                buttonId: 'exhibitionButton',
                exhibitionItems: this.exhibitionData, 
                onExhibitionSelect: (exhibition) => {
                    console.log('전시물 선택:', exhibition);
                }
            });
            
            // 발표자 관리자 초기화
            speakersManager.init({
                buttonId: 'speakersButton',
                speakerItems: this.speakersData,
                onSpeakerSelect: (speaker) => {
                    console.log('발표자 선택:', speaker);
                }
            });
            
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
        
        // 컨퍼런스 정보 표시
        const conferenceTitle = document.getElementById('conferenceTitle');
        const conferenceDate = document.getElementById('conferenceDate');
        const conferenceLocation = document.getElementById('conferenceLocation');
        
        if (conferenceTitle) {
            conferenceTitle.textContent = i18nService.get('conferenceTitle');
        }
        
        if (conferenceDate) {
            conferenceDate.textContent = i18nService.get('conferenceDate');
        }
        
        if (conferenceLocation) {
            conferenceLocation.textContent = i18nService.get('conferenceLocation');
        }
        
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