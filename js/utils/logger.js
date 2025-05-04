/**
 * 로깅 유틸리티 클래스
 * 애플리케이션 전체에서 일관된 로깅을 위한 서비스
 */
class LoggerService {
    /**
     * 로거 서비스 생성자
     * @param {boolean} enabled - 로깅 활성화 여부
     * @param {string} level - 로그 레벨 (debug, info, warn, error)
     */
    constructor(enabled = true, level = 'info') {
        this.enabled = enabled;
        this.level = level;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };
    }

    /**
     * 현재 로그 레벨이 지정된 레벨 이상인지 확인
     * @param {string} level - 확인할 로그 레벨
     * @returns {boolean} - 현재 로그 레벨이 지정된 레벨 이상이면 true
     */
    shouldLog(level) {
        return this.enabled && this.levels[level] >= this.levels[this.level];
    }

    /**
     * 디버그 로그 출력
     * @param {string} message - 로그 메시지
     * @param {...any} args - 추가 인자
     */
    debug(message, ...args) {
        if (this.shouldLog('debug')) {
            console.debug(`%c[DEBUG] ${message}`, 'color: #7c3aed', ...args);
        }
    }

    /**
     * 정보 로그 출력
     * @param {string} message - 로그 메시지
     * @param {...any} args - 추가 인자
     */
    info(message, ...args) {
        if (this.shouldLog('info')) {
            console.info(`%c[INFO] ${message}`, 'color: #0ea5e9', ...args);
        }
    }

    /**
     * 경고 로그 출력
     * @param {string} message - 로그 메시지
     * @param {...any} args - 추가 인자
     */
    warn(message, ...args) {
        if (this.shouldLog('warn')) {
            console.warn(`%c[WARN] ${message}`, 'color: #f59e0b', ...args);
        }
    }

    /**
     * 오류 로그 출력
     * @param {string} message - 로그 메시지
     * @param {...any} args - 추가 인자
     */
    error(message, ...args) {
        if (this.shouldLog('error')) {
            console.error(`%c[ERROR] ${message}`, 'color: #ef4444', ...args);
        }
    }

    /**
     * 그룹 로그 시작
     * @param {string} label - 그룹 레이블
     */
    group(label) {
        if (this.enabled) {
            console.group(`%c[GROUP] ${label}`, 'color: #8b5cf6; font-weight: bold');
        }
    }

    /**
     * 그룹 로그 종료
     */
    groupEnd() {
        if (this.enabled) {
            console.groupEnd();
        }
    }

    /**
     * 시간 측정 시작
     * @param {string} label - 타이머 레이블
     */
    time(label) {
        if (this.enabled) {
            console.time(`[TIMER] ${label}`);
        }
    }

    /**
     * 시간 측정 종료 및 출력
     * @param {string} label - 타이머 레이블
     */
    timeEnd(label) {
        if (this.enabled) {
            console.timeEnd(`[TIMER] ${label}`);
        }
    }
}

// 로거 인스턴스 생성 및 export
const logger = new LoggerService(CONFIG.DEBUG?.ENABLED, CONFIG.DEBUG?.LOG_LEVEL);
