/**
 * 유틸리티 헬퍼 함수 모음
 * 애플리케이션 전체에서 사용되는 공통 유틸리티 함수들
 */

/**
 * 날짜를 포맷팅하여 문자열로 반환
 * @param {Date|string|number} date - 날짜 객체, 문자열 또는 타임스탬프
 * @param {string} format - 포맷 형식 (기본값: 'yyyy-MM-dd HH:mm')
 * @returns {string} - 포맷된 날짜 문자열
 */
function formatDate(date, format = 'yyyy-MM-dd HH:mm') {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return '유효하지 않은 날짜';
    }
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    const replacements = {
        'yyyy': d.getFullYear(),
        'MM': pad(d.getMonth() + 1),
        'dd': pad(d.getDate()),
        'HH': pad(d.getHours()),
        'mm': pad(d.getMinutes()),
        'ss': pad(d.getSeconds()),
    };
    
    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, match => replacements[match]);
}

/**
 * 날짜를 상대적인 시간 표현으로 변환 (예: "3분 전", "방금 전")
 * @param {Date|string|number} date - 날짜 객체, 문자열 또는 타임스탬프
 * @returns {string} - 상대적 시간 문자열
 */
function timeAgo(date) {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return '유효하지 않은 날짜';
    }
    
    const now = new Date();
    const diff = Math.floor((now - d) / 1000); // 초 단위 차이
    
    if (diff < 60) return '방금 전';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    if (diff < 2592000) return Math.floor(diff / 86400) + '일 전';
    if (diff < 31536000) return Math.floor(diff / 2592000) + '개월 전';
    return Math.floor(diff / 31536000) + '년 전';
}

/**
 * 사용자의 이름에서 이니셜을 추출
 * @param {string} name - 사용자 이름
 * @returns {string} - 이니셜 (최대 2글자)
 */
function getInitials(name) {
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

/**
 * 문자열 텍스트에서 이메일을 추출
 * @param {string} text - 텍스트
 * @returns {string|null} - 추출된 이메일 또는 null
 */
function extractEmail(text) {
    const matches = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return matches ? matches[0] : null;
}

/**
 * 문자열 내에서 키워드를 하이라이트 처리
 * @param {string} text - 원본 텍스트
 * @param {string} keyword - 하이라이트할 키워드
 * @returns {string} - 하이라이트된 HTML 문자열
 */
function highlightKeyword(text, keyword) {
    if (!keyword || !text) return text;
    
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight-keyword">$1</span>');
}

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} key - 스토리지 키
 * @param {any} value - 저장할 값
 */
function saveToStorage(key, value) {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
    } catch (error) {
        console.error('로컬 스토리지 저장 중 오류 발생:', error);
    }
}

/**
 * 로컬 스토리지에서 데이터 불러오기
 * @param {string} key - 스토리지 키
 * @param {any} defaultValue - 기본값 (데이터가 없는 경우)
 * @returns {any} - 불러온 데이터 또는 기본값
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const serialized = localStorage.getItem(key);
        if (serialized === null) return defaultValue;
        return JSON.parse(serialized);
    } catch (error) {
        console.error('로컬 스토리지 불러오기 중 오류 발생:', error);
        return defaultValue;
    }
}

/**
 * 로컬 스토리지에서 데이터 삭제
 * @param {string} key - 스토리지 키
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('로컬 스토리지 삭제 중 오류 발생:', error);
    }
}

/**
 * 텍스트를 클립보드에 복사
 * @param {string} text - 복사할 텍스트
 * @returns {Promise<boolean>} - 성공 여부
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('클립보드 복사 중 오류 발생:', error);
        return false;
    }
}

/**
 * 폼 데이터를 객체로 변환
 * @param {HTMLFormElement} form - 폼 엘리먼트
 * @returns {Object} - 폼 데이터 객체
 */
function formToObject(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

/**
 * 문자열 처음 문자를 대문자로 변환
 * @param {string} str - 문자열
 * @returns {string} - 변환된 문자열
 */
function capitalizeFirstLetter(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 두 날짜 사이의 일 수 계산
 * @param {Date|string|number} date1 - 첫 번째 날짜
 * @param {Date|string|number} date2 - 두 번째 날짜
 * @returns {number} - 일 수 차이
 */
function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        return NaN;
    }
    
    // 일 단위로 변환 (밀리초 -> 일)
    const diffTime = Math.abs(d2 - d1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 문자열 바이트 크기 계산 (UTF-8 기준)
 * @param {string} str - 문자열
 * @returns {number} - 바이트 크기
 */
function getByteSize(str) {
    // UTF-8 기준 바이트 크기 계산
    return new Blob([str]).size;
}

/**
 * 임의의 ID 생성
 * @param {number} length - ID 길이 (기본값: 10)
 * @returns {string} - 생성된 ID
 */
function generateId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * 객체에서 빈 값(null, undefined, 빈 문자열) 제거
 * @param {Object} obj - 원본 객체
 * @returns {Object} - 빈 값이 제거된 객체
 */
function removeEmptyValues(obj) {
    const result = {};
    
    for (const key in obj) {
        if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
            result[key] = obj[key];
        }
    }
    
    return result;
}

/**
 * 디바운스 함수 (함수 호출 빈도 제한)
 * @param {Function} fn - 실행할 함수
 * @param {number} delay - 지연 시간 (ms)
 * @returns {Function} - 디바운스된 함수
 */
function debounce(fn, delay) {
    let timeout;
    
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * 쓰로틀 함수 (함수 호출 빈도 제한)
 * @param {Function} fn - 실행할 함수
 * @param {number} limit - 제한 시간 (ms)
 * @returns {Function} - 쓰로틀된 함수
 */
function throttle(fn, limit) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
