/**
 * 유틸리티 함수 모음
 * 
 * 애플리케이션 전반에서 사용되는 유틸리티 함수들을 제공합니다.
 * 디버깅, 로깅, 데이터 처리 등 다양한 유틸리티 기능을 포함합니다.
 */

import CONFIG from './config.js';

/**
 * DOM이 로드된 후 콜백 실행
 * @param {Function} callback - 실행할 콜백 함수
 */
export function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

/**
 * 쓰로틀 함수
 * @param {Function} fn - 쓰로틀링할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} - 쓰로틀링된 함수
 */
export function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return fn.apply(this, args);
    };
}

/**
 * 디바운스 함수
 * @param {Function} fn - 디바운싱할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} - 디바운싱된 함수
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
            timeoutId = null;
        }, delay);
    };
}

/**
 * 대기 함수 (Promise)
 * @param {number} ms - 대기 시간 (밀리초)
 * @returns {Promise} - 대기 Promise
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 랜덤 ID 생성
 * @param {number} length - ID 길이 (기본값: 10)
 * @returns {string} - 생성된 랜덤 ID
 */
export function generateRandomId(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
}

/**
 * 현재 기기 유형 감지
 * @returns {string} - 'mobile', 'tablet', 'desktop' 중 하나
 */
export function detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop|windows phone|mobile/i.test(userAgent);
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
    
    if (isTablet) return 'tablet';
    if (isMobile) return 'mobile';
    return 'desktop';
}

/**
 * 시스템 다크 모드 감지
 * @returns {boolean} - 다크 모드 사용 여부
 */
export function isDarkModeEnabled() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * 미디어 쿼리 변경 감지
 * @param {string} mediaQuery - 미디어 쿼리 문자열
 * @param {Function} callback - 변경 시 실행할 콜백 함수
 * @returns {MediaQueryList} - 미디어 쿼리 리스트 객체
 */
export function watchMediaQuery(mediaQuery, callback) {
    const mql = window.matchMedia(mediaQuery);
    mql.addEventListener('change', callback);
    return mql;
}

/**
 * 로컬 스토리지 래퍼
 */
export const storage = {
    /**
     * 항목 저장
     * @param {string} key - 키
     * @param {*} value - 저장할 값
     * @returns {boolean} - 저장 성공 여부
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('LocalStorage set error:', error);
            return false;
        }
    },
    
    /**
     * 항목 가져오기
     * @param {string} key - 키
     * @param {*} defaultValue - 기본값
     * @returns {*} - 저장된 값 또는 기본값
     */
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('LocalStorage get error:', error);
            return defaultValue;
        }
    },
    
    /**
     * 항목 삭제
     * @param {string} key - 키
     * @returns {boolean} - 삭제 성공 여부
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('LocalStorage remove error:', error);
            return false;
        }
    },
    
    /**
     * 모든 항목 삭제
     * @returns {boolean} - 삭제 성공 여부
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('LocalStorage clear error:', error);
            return false;
        }
    }
};

/**
 * 브라우저 호환성 확인
 * @returns {Object} - 호환성 상태
 */
export function checkBrowserCompatibility() {
    return {
        localStorage: !!window.localStorage,
        webSockets: !!window.WebSocket,
        fetch: !!window.fetch,
        serviceWorker: 'serviceWorker' in navigator,
        notification: 'Notification' in window
    };
}

/**
 * 색상 밝기에 따라 대비색 결정
 * @param {string} color - HEX 색상 코드
 * @returns {string} - 'light' 또는 'dark'
 */
export function getContrastColor(color) {
    // 색상 코드 정규화
    const hexColor = color.startsWith('#') ? color.slice(1) : color;
    
    // RGB 값으로 변환
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // 밝기 계산 (YIQ 공식)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // 밝기에 따라 대비색 반환
    return yiq >= 128 ? 'dark' : 'light';
}

/**
 * 텍스트 문자열을 HTML 이스케이프 처리
 * @param {string} unsafe - 이스케이프 처리할 문자열
 * @returns {string} - 이스케이프 처리된 문자열
 */
export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 언어 코드에서 국가 코드 추출
 * @param {string} languageCode - 언어 코드 (예: ko-KR)
 * @returns {string} - 국가 코드 (예: KR)
 */
export function getCountryCodeFromLanguage(languageCode) {
    if (!languageCode || typeof languageCode !== 'string') return '';
    
    const parts = languageCode.split('-');
    return parts.length > 1 ? parts[1].toUpperCase() : '';
}

/**
 * 날짜 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 날짜 문자열
 * @param {string} format - 포맷 문자열
 * @returns {string} - 포맷팅된 날짜 문자열
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 상대적 시간 표시
 * @param {Date|string} date - 날짜 객체 또는 날짜 문자열
 * @returns {string} - 상대적 시간 문자열
 */
export function timeAgo(date) {
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }
    
    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);
    
    // 시간 간격 계산
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return `${interval}년 전`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return `${interval}개월 전`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return `${interval}일 전`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return `${interval}시간 전`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return `${interval}분 전`;
    }
    
    if (seconds < 10) {
        return '방금 전';
    }
    
    return `${Math.floor(seconds)}초 전`;
}

/**
 * 디버그 로그 출력
 * @param {string} message - 로그 메시지
 * @param {*} data - 로그 데이터
 */
export function log(message, data = null) {
    if (!CONFIG.APP.DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString();
    const coloredMessage = `%c[${timestamp}] ${message}`;
    
    if (data !== null) {
        console.log(coloredMessage, 'color: #4361ee; font-weight: bold;', data);
    } else {
        console.log(coloredMessage, 'color: #4361ee; font-weight: bold;');
    }
}

/**
 * 디버그 오류 로그 출력
 * @param {string} message - 오류 메시지
 * @param {*} error - 오류 객체
 */
export function logError(message, error = null) {
    if (!CONFIG.APP.DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString();
    const coloredMessage = `%c[${timestamp}] ERROR: ${message}`;
    
    if (error !== null) {
        console.error(coloredMessage, 'color: #e74c3c; font-weight: bold;', error);
    } else {
        console.error(coloredMessage, 'color: #e74c3c; font-weight: bold;');
    }
}

/**
 * 디버그 경고 로그 출력
 * @param {string} message - 경고 메시지
 * @param {*} data - 경고 데이터
 */
export function logWarning(message, data = null) {
    if (!CONFIG.APP.DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString();
    const coloredMessage = `%c[${timestamp}] WARNING: ${message}`;
    
    if (data !== null) {
        console.warn(coloredMessage, 'color: #f39c12; font-weight: bold;', data);
    } else {
        console.warn(coloredMessage, 'color: #f39c12; font-weight: bold;');
    }
}

/**
 * 성능 측정
 * @param {string} label - 측정 레이블
 * @param {Function} fn - 측정할 함수
 * @returns {*} - 함수 실행 결과
 */
export function measure(label, fn) {
    if (!CONFIG.APP.DEBUG_MODE) {
        return fn();
    }
    
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
}

/**
 * 비동기 성능 측정
 * @param {string} label - 측정 레이블
 * @param {Function} asyncFn - 측정할 비동기 함수
 * @returns {Promise<*>} - 비동기 함수 실행 결과
 */
export async function measureAsync(label, asyncFn) {
    if (!CONFIG.APP.DEBUG_MODE) {
        return await asyncFn();
    }
    
    console.time(label);
    const result = await asyncFn();
    console.timeEnd(label);
    return result;
}
