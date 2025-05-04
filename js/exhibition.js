/**
 * 전시물 정보 모듈
 * 
 * 컨퍼런스 전시물 정보를 표시하고 관리하는 기능을 제공합니다.
 * 검색, 필터링, 상세 정보 표시 등의 기능을 포함합니다.
 */

import CONFIG from './config.js';
import i18nService from './i18n.js';

class ExhibitionManager {
    constructor() {
        this.exhibitionData = [];
        this.filteredData = [];
        this.currentFilter = '';
        this.isInitialized = false;
        
        // DOM 요소 참조
        this.exhibitionContainer = null;
        this.exhibitionList = null;
        this.exhibitionSearchInput = null;
        this.clearExhibitionSearchButton = null;
        this.exhibitionButton = null;
        this.closeExhibitionButton = null;
        this.detailModal = null;
        this.detailTitle = null;
        this.detailContent = null;
        this.closeDetailButton = null;
        this.exhibitionTabButton = null;
        this.speakersTabButton = null;
        this.exhibitionTabContent = null;
        this.speakersTabContent = null;
        this.exhibitionNav = null; // 모바일 탭
    }

    /**
     * 전시물 관리자 초기화
     */
    init() {
        // DOM 요소 참조 설정
        this.exhibitionContainer = document.getElementById('exhibitionContainer');
        this.exhibitionList = document.getElementById('exhibitionList');
        this.exhibitionSearchInput = document.getElementById('exhibitionSearchInput');
        this.clearExhibitionSearchButton = document.getElementById('clearExhibitionSearchButton');
        this.exhibitionButton = document.getElementById('exhibitionButton');
        this.closeExhibitionButton = document.getElementById('closeExhibitionButton');
        this.detailModal = document.getElementById('detailModal');
        this.detailTitle = document.getElementById('detailTitle');
        this.detailContent = document.getElementById('detailContent');
        this.closeDetailButton = document.getElementById('closeDetailButton');
        this.exhibitionTabButton = document.getElementById('exhibitionTabButton');
        this.speakersTabButton = document.getElementById('speakersTabButton');
        this.exhibitionTabContent = document.getElementById('exhibitionTabContent');
        this.speakersTabContent = document.getElementById('speakersTabContent');
        this.exhibitionNav = document.getElementById('exhibitionNav'); // 모바일 탭
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 전시물 데이터 로드
        this.loadExhibitionData();
        
        this.isInitialized = true;
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('ExhibitionManager initialized');
        }
        
        return this;
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 전시물 버튼 클릭 이벤트
        if (this.exhibitionButton) {
            this.exhibitionButton.addEventListener('click', () => this.toggleExhibitionContainer());
        }
        
        // 모바일 네비게이션 이벤트
        if (this.exhibitionNav) {
            this.exhibitionNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.showExhibitionContainer();
                this.updateMobileNavigation('exhibitionNav');
            });
        }
        
        // 닫기 버튼 클릭 이벤트
        if (this.closeExhibitionButton) {
            this.closeExhibitionButton.addEventListener('click', () => this.hideExhibitionContainer());
        }
        
        // 탭 버튼 클릭 이벤트
        if (this.exhibitionTabButton) {
            this.exhibitionTabButton.addEventListener('click', () => this.switchTab('exhibition'));
        }
        
        if (this.speakersTabButton) {
            this.speakersTabButton.addEventListener('click', () => this.switchTab('speakers'));
        }
        
        // 검색 입력 이벤트
        if (this.exhibitionSearchInput) {
            this.exhibitionSearchInput.addEventListener('input', () => this.handleSearch());
        }
        
        // 검색 지우기 버튼 이벤트
        if (this.clearExhibitionSearchButton) {
            this.clearExhibitionSearchButton.addEventListener('click', () => this.clearSearch());
        }
        
        // 모달 닫기 버튼 이벤트
        if (this.closeDetailButton) {
            this.closeDetailButton.addEventListener('click', () => this.hideDetailModal());
        }
        
        // 모달 외부 클릭 시 닫기
        if (this.detailModal) {
            this.detailModal.addEventListener('click', (e) => {
                if (e.target === this.detailModal) {
                    this.hideDetailModal();
                }
            });
        }
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (