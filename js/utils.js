/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 유틸리티 함수 모음
 * 작성일: 2025-05-07
 */

/**
 * 디바운스 함수 - 연속적인 호출에서 마지막 호출만 실행
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (밀리초)
 * @returns {Function} - 디바운스된 함수
 */
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 쓰로틀 함수 - 일정 시간 간격으로 호출 제한
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (밀리초)
 * @returns {Function} - 쓰로틀된 함수
 */
function throttle(func, limit) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * 텍스트 이스케이프 함수 - HTML 이스케이프
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} - 이스케이프된 텍스트
 */
function escapeHTML(text) {
    if (!text) return '';
    
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, match => escapeMap[match]);
}

/**
 * URL, 이메일, 전화번호 등을 링크로 변환하는 함수
 * @param {string} text - 변환할 텍스트
 * @returns {string} - 링크가 포함된 HTML
 */
function linkify(text) {
    if (!text) return '';
    
    // 텍스트를 이스케이프
    const escapedText = escapeHTML(text);
    
    // URL 변환
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlReplaced = escapedText.replace(urlRegex, url => 
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    
    // 이메일 주소 변환
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailReplaced = urlReplaced.replace(emailRegex, email => 
        `<a href="mailto:${email}">${email}</a>`);
    
    return emailReplaced;
}

/**
 * 텍스트에서 이모지를 추출하는 함수
 * @param {string} text - 텍스트
 * @returns {Array} - 추출된 이모지 배열
 */
function extractEmojis(text) {
    if (!text) return [];
    
    // 이모지 유니코드 범위 (근사값)
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    
    return text.match(emojiRegex) || [];
}

/**
 * 텍스트의 첫 글자를 대문자로 변환하는 함수
 * @param {string} text - 변환할 텍스트
 * @returns {string} - 변환된 텍스트
 */
function capitalizeFirstLetter(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * 랜덤 ID 생성 함수
 * @returns {string} - 생성된 ID
 */
function generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * 쿼리 파라미터 파싱 함수
 * @returns {Object} - 파싱된 쿼리 파라미터
 */
function getQueryParams() {
    const params = {};
    const queryString = window.location.search;
    
    if (!queryString) return params;
    
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

/**
 * 텍스트 자동 확장 textarea 초기화 함수
 * @param {HTMLElement} textarea - textarea 엘리먼트
 */
function initAutoExpandTextarea(textarea) {
    if (!textarea) return;
    
    // 스타일 계산을 위한 함수
    function adjustHeight() {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
    
    // 입력 이벤트 리스너
    textarea.addEventListener('input', adjustHeight);
    
    // 초기 높이 설정
    adjustHeight();
}

/**
 * 로컬 스토리지 래퍼 클래스 (에러 처리 포함)
 */
class Storage {
    /**
     * 아이템 저장
     * @param {string} key - 저장할 키
     * @param {any} value - 저장할 값
     * @returns {boolean} - 성공 여부
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('로컬 스토리지 저장 오류:', error);
            return false;
        }
    }
    
    /**
     * 아이템 조회
     * @param {string} key - 조회할 키
     * @param {any} defaultValue - 기본값
     * @returns {any} - 조회된 값 또는 기본값
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('로컬 스토리지 조회 오류:', error);
            return defaultValue;
        }
    }
    
    /**
     * 아이템 삭제
     * @param {string} key - 삭제할 키
     * @returns {boolean} - 성공 여부
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('로컬 스토리지 삭제 오류:', error);
            return false;
        }
    }
    
    /**
     * 모든 아이템 삭제
     * @returns {boolean} - 성공 여부
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('로컬 스토리지 초기화 오류:', error);
            return false;
        }
    }
}

/**
 * 포맷된 날짜 문자열 생성 함수
 * @param {Date} date - 날짜 객체
 * @param {string} format - 날짜 형식
 * @returns {string} - 포맷된 날짜 문자열
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return '';
    
    // 날짜 객체로 변환
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // 형식 맵핑
    const formatMap = {
        YYYY: d.getFullYear(),
        MM: String(d.getMonth() + 1).padStart(2, '0'),
        DD: String(d.getDate()).padStart(2, '0'),
        HH: String(d.getHours()).padStart(2, '0'),
        mm: String(d.getMinutes()).padStart(2, '0'),
        ss: String(d.getSeconds()).padStart(2, '0')
    };
    
    // 형식 치환
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
}

/**
 * 사용자 에이전트 정보 분석 함수
 * @returns {Object} - 분석된 에이전트 정보
 */
function getUserAgentInfo() {
    const ua = navigator.userAgent;
    
    // 운영 체제 탐지
    let os = 'Unknown';
    if (/Windows/.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'MacOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
    
    // 브라우저 탐지
    let browser = 'Unknown';
    if (/Edge|Edg/.test(ua)) browser = 'Edge';
    else if (/Chrome/.test(ua)) browser = 'Chrome';
    else if (/Firefox/.test(ua)) browser = 'Firefox';
    else if (/Safari/.test(ua)) browser = 'Safari';
    else if (/MSIE|Trident/.test(ua)) browser = 'Internet Explorer';
    
    // 모바일 여부
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    return {
        os,
        browser,
        isMobile,
        userAgent: ua
    };
}

/**
 * 모달 관리 함수
 * @param {string} modalId - 모달 ID
 * @param {string} action - 동작 ('open' | 'close' | 'toggle')
 */
function handleModal(modalId, action = 'toggle') {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    if (action === 'open') {
        modal.hidden = false;
    } else if (action === 'close') {
        modal.hidden = true;
    } else if (action === 'toggle') {
        modal.hidden = !modal.hidden;
    }
}

// 유틸리티 함수를 전역으로 내보내기
window.utils = {
    debounce,
    throttle,
    escapeHTML,
    linkify,
    extractEmojis,
    capitalizeFirstLetter,
    generateId,
    getQueryParams,
    initAutoExpandTextarea,
    Storage,
    formatDate,
    getUserAgentInfo,
    handleModal
};

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('utilsLoaded'));
