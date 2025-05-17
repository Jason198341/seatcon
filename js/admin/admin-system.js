/**
 * 관리자 시스템 상태 모듈
 * 관리자 페이지의 시스템 상태 모니터링 기능을 처리합니다.
 */

class AdminSystem {
    constructor() {
        this.supabaseStatus = document.getElementById('supabase-status');
        this.translationApiStatus = document.getElementById('translation-api-status');
        this.realtimeStatus = document.getElementById('realtime-status');
        this.errorLogs = document.getElementById('error-logs');
        this.performanceChart = null;
        
        this.statusUpdateInterval = null;
    }

    /**
     * 시스템 모니터링 초기화
     */
    initialize() {
        // 차트 초기화
        this.initPerformanceChart();
        
        // 시스템 상태 확인
        this.checkSystemStatus();
        
        // 오류 로그 로드
        this.loadErrorLogs();
        
        // 주기적인 상태 업데이트 설정
        this.statusUpdateInterval = setInterval(() => {
            this.checkSystemStatus();
            this.updatePerformanceChart();
        }, 30000); // 30초마다 업데이트
    }

    /**
     * 시스템 모니터링 정리
     */
    cleanup() {
        // 주기적인 업데이트 중단
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
        
        // 차트 정리
        if (this.performanceChart) {
            this.performanceChart.destroy();
            this.performanceChart = null;
        }
    }

    /**
     * 성능 차트 초기화
     * @private
     */
    initPerformanceChart() {
        const performanceChartCtx = document.getElementById('performance-chart').getContext('2d');
        
        this.performanceChart = new Chart(performanceChartCtx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(10),
                datasets: [
                    {
                        label: 'CPU 사용량 (%)',
                        data: this.generateRandomData(10),
                        borderColor: '#3f51b5',
                        backgroundColor: 'rgba(63, 81, 181, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: '메모리 사용량 (MB)',
                        data: this.generateRandomData(10, 100, 500),
                        borderColor: '#ff4081',
                        backgroundColor: 'rgba(255, 64, 129, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: '응답 시간 (ms)',
                        data: this.generateRandomData(10, 50, 200),
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * 성능 차트 업데이트
     * @private
     */
    updatePerformanceChart() {
        // 새 데이터 포인트 추가
        const newTime = new Date().toLocaleTimeString();
        
        this.performanceChart.data.labels.shift();
        this.performanceChart.data.labels.push(newTime);
        
        this.performanceChart.data.datasets.forEach(dataset => {
            dataset.data.shift();
            
            if (dataset.label.includes('CPU')) {
                dataset.data.push(Math.floor(Math.random() * 100));
            } else if (dataset.label.includes('메모리')) {
                dataset.data.push(Math.floor(Math.random() * 400) + 100);
            } else {
                dataset.data.push(Math.floor(Math.random() * 150) + 50);
            }
        });
        
        this.performanceChart.update();
    }

    /**
     * 시스템 상태 확인
     * @private
     */
    async checkSystemStatus() {
        try {
            // Supabase 상태 확인
            const supabaseConnected = await this.checkSupabaseConnection();
            this.updateStatusIndicator(this.supabaseStatus, supabaseConnected);
            
            // Translation API 상태 확인
            const translationApiConnected = await this.checkTranslationApiConnection();
            this.updateStatusIndicator(this.translationApiStatus, translationApiConnected);
            
            // Realtime 서비스 상태 확인
            const realtimeConnected = await this.checkRealtimeConnection();
            this.updateStatusIndicator(this.realtimeStatus, realtimeConnected);
        } catch (error) {
            console.error('Error checking system status:', error);
        }
    }

    /**
     * Supabase 연결 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     * @private
     */
    async checkSupabaseConnection() {
        try {
            // Supabase 연결 테스트
            await dbService.ensureInitialized();
            return dbService.initialized;
        } catch (error) {
            console.error('Error checking Supabase connection:', error);
            return false;
        }
    }

    /**
     * Translation API 연결 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     * @private
     */
    async checkTranslationApiConnection() {
        try {
            // Translation API 연결 테스트
            // 간단한 메시지로 테스트
            const result = await translationService.translateText('Hello', 'ko', 'en');
            return result.success;
        } catch (error) {
            console.error('Error checking Translation API connection:', error);
            return false;
        }
    }

    /**
     * Realtime 서비스 연결 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     * @private
     */
    async checkRealtimeConnection() {
        try {
            // Realtime 서비스 연결 테스트
            // 실제 애플리케이션에서는 연결 상태 확인 방법 구현
            // 여기서는 데모를 위해 임의로 상태 반환
            return Math.random() > 0.1; // 90%의 확률로 연결됨
        } catch (error) {
            console.error('Error checking Realtime connection:', error);
            return false;
        }
    }

    /**
     * 상태 표시기 업데이트
     * @param {HTMLElement} element 상태 표시 요소
     * @param {boolean} isConnected 연결 상태
     * @private
     */
    updateStatusIndicator(element, isConnected) {
        element.classList.remove('online', 'offline');
        element.classList.add(isConnected ? 'online' : 'offline');
        element.textContent = isConnected ? '온라인' : '오프라인';
    }

    /**
     * 오류 로그 로드
     * @private
     */
    async loadErrorLogs() {
        try {
            // 실제 애플리케이션에서는 서버에서 로그 가져오기
            // 여기서는 데모를 위한 가상 로그 생성
            const logs = this.generateSampleErrorLogs();
            
            // 로그 표시
            this.displayErrorLogs(logs);
        } catch (error) {
            console.error('Error loading error logs:', error);
        }
    }

    /**
     * 샘플 오류 로그 생성
     * @returns {Array} 샘플 오류 로그
     * @private
     */
    generateSampleErrorLogs() {
        const logs = [];
        const types = ['error', 'warning', 'info'];
        const messages = [
            'Database connection failed',
            'Translation API rate limit exceeded',
            'Unable to fetch user data',
            'Message synchronization error',
            'System configuration warning',
            'Authentication service restarted',
            'Cache flush completed',
            'System maintenance scheduled'
        ];
        
        // 현재 시간에서 무작위 시간(최대 1일) 뺀 타임스탬프 생성
        const getRandomTimestamp = () => {
            const now = new Date();
            const randomMinutes = Math.floor(Math.random() * 1440); // 최대 24시간(1440분)
            now.setMinutes(now.getMinutes() - randomMinutes);
            return now.toISOString();
        };
        
        // 10개의 샘플 로그 생성
        for (let i = 0; i < 10; i++) {
            logs.push({
                timestamp: getRandomTimestamp(),
                level: types[Math.floor(Math.random() * types.length)],
                message: messages[Math.floor(Math.random() * messages.length)]
            });
        }
        
        // 타임스탬프 기준 내림차순 정렬
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return logs;
    }

    /**
     * 오류 로그 표시
     * @param {Array} logs 오류 로그
     * @private
     */
    displayErrorLogs(logs) {
        // 로그 컨테이너 초기화
        this.errorLogs.innerHTML = '';
        
        // 각 로그 항목 표시
        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.classList.add('log-entry');
            
            logEntry.innerHTML = `
                <span class="log-time">${this.formatTimestamp(log.timestamp)}</span>
                <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                <span class="log-message">${log.message}</span>
            `;
            
            this.errorLogs.appendChild(logEntry);
        });
    }

    /**
     * 타임스탬프 포맷
     * @param {string} timestamp ISO 형식 타임스탬프
     * @returns {string} 포맷된 시간
     * @private
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    }

    /**
     * 시간 라벨 생성
     * @param {number} count 라벨 개수
     * @returns {Array} 시간 라벨 배열
     * @private
     */
    generateTimeLabels(count) {
        const labels = [];
        const now = new Date();
        
        for (let i = count - 1; i >= 0; i--) {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() - i * 5); // 5분 간격
            labels.push(time.toLocaleTimeString());
        }
        
        return labels;
    }

    /**
     * 무작위 데이터 생성
     * @param {number} count 데이터 포인트 개수
     * @param {number} min 최소값
     * @param {number} max 최대값
     * @returns {Array} 무작위 데이터 배열
     * @private
     */
    generateRandomData(count, min = 0, max = 100) {
        const data = [];
        
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        
        return data;
    }
}

// 싱글톤 인스턴스 생성
const adminSystem = new AdminSystem();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminSystem.initialize();
});
