/**
 * 검색 모듈
 * 
 * 채팅 메시지 검색 기능을 제공합니다.
 * 실시간 검색, 검색 결과 하이라이트, 검색 내역 관리 등의 기능을 포함합니다.
 */

import CONFIG from './config.js';

class SearchManager {
    constructor() {
        // 상태 변수
        this.isSearchVisible = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.currentResultIndex = -1;
        this.searchHistory = [];
        this.searchTimeout = null;
        
        // DOM 요소 참조
        this.searchBar = null;
        this.searchInput = null;
        this.clearSearchButton = null;
        this.closeSearchButton = null;
        this.searchToggle = null;
        this.messageList = null;
    }

    /**
     * 검색 관리자 초기화
     */
    init() {
        // DOM 요소 참조 설정
        this.searchBar = document.getElementById('searchBar');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchButton = document.getElementById('clearSearchButton');
        this.closeSearchButton = document.getElementById('closeSearchButton');
        this.searchToggle = document.getElementById('searchToggle');
        this.messageList = document.getElementById('messageList');
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 검색 기록 로드
        this.loadSearchHistory();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('SearchManager initialized');
        }
        
        return this;
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 검색 토글 버튼 이벤트
        if (this.searchToggle) {
            this.searchToggle.addEventListener('click', () => this.toggleSearch());
        }
        
        // 검색 닫기 버튼 이벤트
        if (this.closeSearchButton) {
            this.closeSearchButton.addEventListener('click', () => this.hideSearch());
        }
        
        // 검색 지우기 버튼 이벤트
        if (this.clearSearchButton) {
            this.clearSearchButton.addEventListener('click', () => this.clearSearch());
        }
        
        // 검색 입력 이벤트
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.handleSearchInput());
            
            // 엔터 키로 검색
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch();
                }
                
                // 위/아래 키로 검색 결과 이동
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.moveToNextResult();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.moveToPrevResult();
                }
            });
        }
        
        // ESC 키로 검색 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSearchVisible) {
                this.hideSearch();
            }
        });
    }

    /**
     * 검색 바 토글
     */
    toggleSearch() {
        if (this.isSearchVisible) {
            this.hideSearch();
        } else {
            this.showSearch();
        }
    }

    /**
     * 검색 바 표시
     */
    showSearch() {
        if (!this.searchBar) return;
        
        this.searchBar.classList.add('show');
        this.isSearchVisible = true;
        
        // 포커스 설정
        setTimeout(() => {
            if (this.searchInput) {
                this.searchInput.focus();
            }
        }, 300);
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Search bar shown');
        }
    }

    /**
     * 검색 바 숨기기
     */
    hideSearch() {
        if (!this.searchBar) return;
        
        this.searchBar.classList.remove('show');
        this.isSearchVisible = false;
        
        // 검색 결과 하이라이트 제거
        this.clearSearchResults();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Search bar hidden');
        }
    }

    /**
     * 검색 입력 처리
     */
    handleSearchInput() {
        if (!this.searchInput) return;
        
        const query = this.searchInput.value.trim();
        
        // 검색어가 없으면 검색 버튼 숨기기
        if (this.clearSearchButton) {
            this.clearSearchButton.style.display = query.length > 0 ? 'block' : 'none';
        }
        
        // 타이핑 중 디바운스
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                this.search(query);
            } else {
                this.clearSearchResults();
            }
        }, 300);
    }

    /**
     * 검색 처리
     */
    handleSearch() {
        if (!this.searchInput) return;
        
        const query = this.searchInput.value.trim();
        
        if (query.length >= 2) {
            this.search(query);
            
            // 검색 기록에 추가
            this.addToSearchHistory(query);
        }
    }

    /**
     * 검색 실행
     * @param {string} query - 검색어
     */
    search(query) {
        this.searchQuery = query;
        
        if (!this.messageList || !query) {
            this.searchResults = [];
            return;
        }
        
        // 현재 표시된 메시지에서 검색
        const messages = this.messageList.querySelectorAll('.message');
        this.searchResults = [];
        
        messages.forEach((message) => {
            const messageId = message.getAttribute('data-message-id');
            const content = message.querySelector('.message-content');
            
            if (!content) return;
            
            // 원본 내용과 번역된 내용 모두 검색
            const originalContent = content.querySelector('.original-content');
            const translatedContent = content.querySelector('.translated-content');
            
            let originalText = '';
            let translatedText = '';
            
            if (originalContent) {
                originalText = originalContent.textContent.toLowerCase();
            }
            
            if (translatedContent) {
                translatedText = translatedContent.textContent.toLowerCase();
            }
            
            const lowerQuery = query.toLowerCase();
            
            // 검색어 포함 여부 확인
            if (originalText.includes(lowerQuery) || translatedText.includes(lowerQuery)) {
                this.searchResults.push({
                    messageId,
                    element: message
                });
            }
        });
        
        // 검색 결과 하이라이트
        this.highlightSearchResults();
        
        // 첫 번째 결과로 이동
        if (this.searchResults.length > 0) {
            this.currentResultIndex = 0;
            this.scrollToCurrentResult();
        }
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log(`Found ${this.searchResults.length} results for "${query}"`);
        }
    }

    /**
     * 검색 결과 하이라이트
     */
    highlightSearchResults() {
        // 기존 하이라이트 제거
        const existingHighlights = this.messageList.querySelectorAll('.highlight');
        existingHighlights.forEach((highlight) => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            // 부모 텍스트 노드 병합
            parent.normalize();
        });
        
        if (!this.searchQuery || this.searchResults.length === 0) {
            return;
        }
        
        // 검색 결과 하이라이트
        this.searchResults.forEach((result) => {
            const message = result.element;
            const originalContent = message.querySelector('.original-content');
            const translatedContent = message.querySelector('.translated-content');
            
            if (originalContent) {
                this.highlightText(originalContent, this.searchQuery);
            }
            
            if (translatedContent) {
                this.highlightText(translatedContent, this.searchQuery);
            }
        });
        
        // 결과 메시지에 강조 클래스 추가
        this.searchResults.forEach((result, index) => {
            result.element.classList.toggle('search-current', index === this.currentResultIndex);
        });
    }

    /**
     * 텍스트 하이라이트
     * @param {HTMLElement} element - 하이라이트할 요소
     * @param {string} query - 검색어
     */
    highlightText(element, query) {
        if (!element || !query) return;
        
        // 텍스트 노드만 처리
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const nodesToReplace = [];
        let textNode;
        
        while ((textNode = walker.nextNode())) {
            // 빈 텍스트 노드는 건너뛰기
            if (!textNode.textContent.trim()) continue;
            
            const parent = textNode.parentNode;
            
            // 이미 하이라이트된 노드의 자식은 건너뛰기
            if (parent.classList && parent.classList.contains('highlight')) continue;
            
            const text = textNode.textContent;
            const lowerText = text.toLowerCase();
            const lowerQuery = query.toLowerCase();
            
            if (lowerText.includes(lowerQuery)) {
                nodesToReplace.push({
                    node: textNode,
                    text,
                    lowerText,
                });
            }
        }
        
        // 텍스트 노드 교체
        nodesToReplace.forEach(({ node, text, lowerText }) => {
            const lowerQuery = query.toLowerCase();
            let currentIndex = 0;
            const fragment = document.createDocumentFragment();
            
            while (true) {
                const matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
                if (matchIndex === -1) break;
                
                // 매치 전 텍스트 추가
                if (matchIndex > currentIndex) {
                    fragment.appendChild(
                        document.createTextNode(text.substring(currentIndex, matchIndex))
                    );
                }
                
                // 하이라이트된 텍스트 추가
                const highlightNode = document.createElement('span');
                highlightNode.className = 'highlight';
                highlightNode.textContent = text.substring(matchIndex, matchIndex + query.length);
                fragment.appendChild(highlightNode);
                
                currentIndex = matchIndex + query.length;
            }
            
            // 남은 텍스트 추가
            if (currentIndex < text.length) {
                fragment.appendChild(
                    document.createTextNode(text.substring(currentIndex))
                );
            }
            
            // 원본 노드를 새 프래그먼트로 교체
            node.parentNode.replaceChild(fragment, node);
        });
    }

    /**
     * 다음 검색 결과로 이동
     */
    moveToNextResult() {
        if (this.searchResults.length === 0) return;
        
        this.currentResultIndex = (this.currentResultIndex + 1) % this.searchResults.length;
        this.scrollToCurrentResult();
    }

    /**
     * 이전 검색 결과로 이동
     */
    moveToPrevResult() {
        if (this.searchResults.length === 0) return;
        
        this.currentResultIndex = (this.currentResultIndex - 1 + this.searchResults.length) % this.searchResults.length;
        this.scrollToCurrentResult();
    }

    /**
     * 현재 검색 결과로 스크롤
     */
    scrollToCurrentResult() {
        if (this.searchResults.length === 0 || this.currentResultIndex === -1) return;
        
        // 이전 현재 결과에서 클래스 제거
        const prevCurrentElements = this.messageList.querySelectorAll('.search-current');
        prevCurrentElements.forEach((el) => {
            el.classList.remove('search-current');
        });
        
        // 현재 결과에 클래스 추가
        const currentResult = this.searchResults[this.currentResultIndex];
        currentResult.element.classList.add('search-current');
        
        // 요소로 스크롤
        currentResult.element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    /**
     * 검색 지우기
     */
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchQuery = '';
            
            // 하이라이트 제거
            this.clearSearchResults();
            
            // 버튼 숨기기
            if (this.clearSearchButton) {
                this.clearSearchButton.style.display = 'none';
            }
            
            // 포커스 설정
            this.searchInput.focus();
        }
    }

    /**
     * 검색 결과 지우기
     */
    clearSearchResults() {
        this.searchResults = [];
        this.currentResultIndex = -1;
        
        // 하이라이트 제거
        if (this.messageList) {
            const highlights = this.messageList.querySelectorAll('.highlight');
            highlights.forEach((highlight) => {
                const parent = highlight.parentNode;
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                // 부모 텍스트 노드 병합
                parent.normalize();
            });
            
            // 현재 결과 클래스 제거
            const currentElements = this.messageList.querySelectorAll('.search-current');
            currentElements.forEach((el) => {
                el.classList.remove('search-current');
            });
        }
    }

    /**
     * 검색 기록에 추가
     * @param {string} query - 검색어
     */
    addToSearchHistory(query) {
        // 중복 제거
        const index = this.searchHistory.indexOf(query);
        if (index !== -1) {
            this.searchHistory.splice(index, 1);
        }
        
        // 최신 검색어를 맨 앞에 추가
        this.searchHistory.unshift(query);
        
        // 최대 10개까지만 저장
        if (this.searchHistory.length > 10) {
            this.searchHistory.pop();
        }
        
        // 로컬 스토리지에 저장
        this.saveSearchHistory();
    }

    /**
     * 검색 기록 저장
     */
    saveSearchHistory() {
        localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
    }

    /**
     * 검색 기록 로드
     */
    loadSearchHistory() {
        const history = localStorage.getItem('search-history');
        
        if (history) {
            try {
                this.searchHistory = JSON.parse(history);
            } catch (error) {
                console.error('Error parsing search history:', error);
                this.searchHistory = [];
            }
        }
    }
}

// 검색 관리자 인스턴스 생성 및 초기화
const searchManager = new SearchManager().init();

// 전역 스코프로 내보내기
export default searchManager;
