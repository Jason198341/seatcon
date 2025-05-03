/**
 * 네트워크 모니터 모듈
 * 
 * 네트워크 연결 상태를 모니터링하고 관리합니다.
 * 연결 끊김, 재연결, 상태 변경에 대한 이벤트를 제공합니다.
 */
class NetworkMonitor {
    constructor() {
        // 네트워크 상태
        this.isOnline = navigator.onLine;
        this.lastPingTime = 0;
        this.pingInterval = 30000; // 30초마다 핑
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 3000; // 초기 재연결 간격 (ms)
        this.pingEndpoint = 'https://veudhigojdukbqfgjeyh.supabase.co/rest/v1/'; // Supabase 엔드포인트
        
        // 이벤트 콜백
        this.callbacks = {
            connectionChange: [],
            reconnecting: [],
            reconnected: [],
            reconnectFailed: []
        };
        
        // 핑 타이머
        this.pingTimer = null;
        
        // 초기화
        this.init();
    }
    
    /**
     * 네트워크 모니터 초기화
     */
    init() {
        console.log('네트워크 모니터 초기화');
        
        // 온라인/오프라인 이벤트 리스너
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // 가시성 변경 이벤트 리스너
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // 초기 연결 상태 확인
        this.checkConnection();
        
        // 정기적인 연결 확인 시작
        this.startPingTimer();
    }
    
    /**
     * 온라인 상태 처리
     */
    handleOnline() {
        console.log('온라인 상태 감지됨');
        
        // 상태가 변경된 경우에만 이벤트 발생
        if (!this.isOnline) {
            this.isOnline = true;
            
            // 실제 연결 상태 확인
            this.checkConnection();
        }
    }
    
    /**
     * 오프라인 상태 처리
     */
    handleOffline() {
        console.log('오프라인 상태 감지됨');
        
        // 상태 업데이트
        this.isOnline = false;
        
        // 이벤트 발생
        this.triggerEvent('connectionChange', { isOnline: false });
        
        // 재연결 시도 시작
        this.startReconnect();
    }
    
    /**
     * 가시성 변경 처리
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('페이지 가시성 변경: 보임');
            
            // 페이지가 보일 때 연결 상태 확인
            this.checkConnection();
        }
    }
    
    /**
     * 연결 상태 확인
     */
    async checkConnection() {
        try {
            // navigator.onLine이 false인 경우 Fetch API 사용 불가
            if (!navigator.onLine) {
                this.isOnline = false;
                this.triggerEvent('connectionChange', { isOnline: false });
                return;
            }
            
            console.log('연결 상태 확인 중...');
            
            // 타임스탬프 쿼리를 사용하여 캐싱 방지
            const url = `${this.pingEndpoint}?ts=${Date.now()}`;
            
            // 핑 요청 시작 시간
            const startTime = Date.now();
            
            // HEAD 요청으로 최소한의 데이터 전송
            const response = await fetch(url, {
                method: 'HEAD',
                cache: 'no-store',
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao'
                }
            });
            
            // 핑 요청 종료 시간
            this.lastPingTime = Date.now() - startTime;
            
            const wasOffline = !this.isOnline;
            this.isOnline = response.ok;
            
            console.log(`연결 상태: ${this.isOnline ? '온라인' : '오프라인'}, 핑: ${this.lastPingTime}ms`);
            
            // 이벤트 발생 (상태가 변경된 경우에만)
            if (wasOffline !== this.isOnline) {
                this.triggerEvent('connectionChange', { 
                    isOnline: this.isOnline,
                    pingTime: this.lastPingTime
                });
            }
            
            // 재연결에 성공한 경우
            if (wasOffline && this.isOnline) {
                this.reconnectAttempts = 0;
                this.triggerEvent('reconnected', { pingTime: this.lastPingTime });
            }
            
            return this.isOnline;
        } catch (error) {
            console.error('연결 확인 오류:', error);
            
            // 오류가 발생한 경우 오프라인으로 간주
            const wasOnline = this.isOnline;
            this.isOnline = false;
            
            // 이벤트 발생 (상태가 변경된 경우에만)
            if (wasOnline) {
                this.triggerEvent('connectionChange', { isOnline: false });
            }
            
            // 재연결 시도 시작
            this.startReconnect();
            
            return false;
        }
    }
    
    /**
     * 정기적인 핑 타이머 시작
     */
    startPingTimer() {
        // 기존 타이머 정리
        this.stopPingTimer();
        
        // 새 타이머 설정
        this.pingTimer = setInterval(() => {
            this.checkConnection();
        }, this.pingInterval);
    }
    
    /**
     * 핑 타이머 정지
     */
    stopPingTimer() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
    
    /**
     * 재연결 시도 시작
     */
    startReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('최대 재연결 시도 횟수 초과');
            this.triggerEvent('reconnectFailed', { attempts: this.reconnectAttempts });
            return;
        }
        
        this.reconnectAttempts++;
        
        // 지수 백오프 적용 (최대 1분)
        const delay = Math.min(
            this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
            60000
        );
        
        console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}, 대기 시간: ${delay}ms`);
        
        // 재연결 중 이벤트 발생
        this.triggerEvent('reconnecting', {
            attempt: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts,
            delay
        });
        
        // 재연결 시도
        setTimeout(() => {
            this.checkConnection().then(isOnline => {
                if (!isOnline) {
                    // 여전히 오프라인인 경우 다시 시도
                    this.startReconnect();
                }
            });
        }, delay);
    }
    
    /**
     * 이벤트 리스너 등록
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    /**
     * 이벤트 리스너 제거
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * 이벤트 발생
     * @param {string} event - 이벤트 이름
     * @param {Object} data - 이벤트 데이터
     */
    triggerEvent(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 핸들러 오류 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 현재 연결 상태 확인
     * @returns {boolean} - 온라인 여부
     */
    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            lastPingTime: this.lastPingTime,
            reconnectAttempts: this.reconnectAttempts
        };
    }
    
    /**
     * 인스턴스 정리
     */
    dispose() {
        // 타이머 정리
        this.stopPingTimer();
        
        // 이벤트 리스너 제거
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // 콜백 초기화
        this.callbacks = {
            connectionChange: [],
            reconnecting: [],
            reconnected: [],
            reconnectFailed: []
        };
    }
}

// 전역 인스턴스 생성
const networkMonitor = new NetworkMonitor();