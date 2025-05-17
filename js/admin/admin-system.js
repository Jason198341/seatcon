/**
 * 관리자 시스템 상태 모듈
 * 시스템 상태 모니터링, 오류 로그, 성능 차트 등을 표시합니다.
 */

class AdminSystem {
    constructor() {
        this.performanceChart = null;
        this.updateInterval = null;
        this.logs = [];
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing admin system...');
            
            // 시스템 상태 로드
            await this.loadServiceStatus();
            
            // 성능 차트 초기화
            this.initPerformanceChart();
            
            // 오류 로그 로드
            await this.loadErrorLogs();
            
            // 자동 업데이트 설정
            this.startAutoUpdate();
            
            console.log('Admin system initialized');
            return true;
        } catch (error) {
            console.error('Error initializing admin system:', error);
            return false;
        }
    }

    /**
     * 서비스 상태 로드
     * @returns {Promise<boolean>} 로드 성공 여부
     * @private
     */
    async loadServiceStatus() {
        try {
            // Supabase 연결 상태
            const supabaseStatus = await this.checkSupabaseStatus();
            document.getElementById('supabase-status').textContent = supabaseStatus ? '온라인' : '오프라인';
            document.getElementById('supabase-status').className = `status-indicator ${supabaseStatus ? 'online' : 'offline'}`;
            
            // Translation API 상태
            const translationStatus = await this.checkTranslationApiStatus();
            document.getElementById('translation-api-status').textContent = translationStatus ? '온라인' : '오프라인';
            document.getElementById('translation-api-status').className = `status-indicator ${translationStatus ? 'online' : 'offline'}`;
            
            // Realtime 서비스 상태
            const realtimeStatus = await this.checkRealtimeStatus();
            document.getElementById('realtime-status').textContent = realtimeStatus ? '온라인' : '오프라인';
            document.getElementById('realtime-status').className = `status-indicator ${realtimeStatus ? 'online' : 'offline'}`;
            
            return true;
        } catch (error) {
            console.error('Error loading service status:', error);
            return false;
        }
    }

    /**
     * Supabase 연결 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     * @private
     */
    async checkSupabaseStatus() {
        try {
            // 간단한 쿼리 실행으로 연결 상태 확인
            const { data, error } = await dbService.supabase.from('chatrooms').select('count', { count: 'exact', head: true });
            
            return !error;
        } catch (error) {
            console.error('Error checking Supabase status:', error);
            return false;
        }
    }

    /**
     * Translation API 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     * @private
     */
    async checkTranslationApiStatus() {
        try {
            // 간단한 번역 요청으로 API 상태 확인
            const result = await translationService.translateText('테스트', 'en');
            
            return result.success;
        } catch (error) {
            console.error('Error checking Translation API status:', error);
            return false;
        }
    }

    /**
     * Realtime 서비스 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     * @private
     */
    async checkRealtimeStatus() {
        try {
            // realtimeService 초기화 상태 확인
            return realtimeService.initialized;
        } catch (error) {
            console.error('Error checking Realtime status:', error);
            return false;
        }
    }

    /**
     * 성능 차트 초기화
     * @private
     */
    initPerformanceChart() {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        // 차트 데이터
        const data = {
            labels: Array(60).fill('').map((_, i) => `-${59 - i}초`),
            datasets: [
                {
                    label: 'CPU 사용량 (%)',
                    backgroundColor: 'rgba(63, 81, 181, 0.2)',
                    borderColor: 'rgba(63, 81, 181, 1)',
                    data: Array(60).fill(null),
                    tension: 0.3
                },
                {
                    label: '메모리 사용량 (MB)',
                    backgroundColor: 'rgba(255, 64, 129, 0.2)',
                    borderColor: 'rgba(255, 64, 129, 1)',
                    data: Array(60).fill(null),
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        };
        
        // 차트 설정
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'CPU (%)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: '메모리 (MB)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top'
                    }
                },
                animation: {
                    duration: 0
                }
            }
        };
        
        // 차트 생성
        this.performanceChart = new Chart(ctx, config);
        
        // 초기 데이터 로드
        this.updatePerformanceChart();
    }

    /**
     * 성능 차트 업데이트
     * @private
     */
    async updatePerformanceChart() {
        try {
            // 성능 데이터 가져오기
            const performanceData = await this.getPerformanceData();
            
            // CPU 데이터 업데이트
            this.performanceChart.data.datasets[0].data.push(performanceData.cpu);
            this.performanceChart.data.datasets[0].data.shift();
            
            // 메모리 데이터 업데이트
            this.performanceChart.data.datasets[1].data.push(performanceData.memory);
            this.performanceChart.data.datasets[1].data.shift();
            
            // 차트 업데이트
            this.performanceChart.update();
        } catch (error) {
            console.error('Error updating performance chart:', error);
        }
    }

    /**
     * 성능 데이터 가져오기
     * @returns {Promise<Object>} 성능 데이터
     * @private
     */
    async getPerformanceData() {
        // TODO: 실제 성능 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return {
            cpu: Math.floor(Math.random() * 30) + 10,  // 10-40% CPU 사용량
            memory: Math.floor(Math.random() * 200) + 300  // 300-500MB 메모리 사용량
        };
    }

    /**
     * 오류 로그 로드
     * @returns {Promise<boolean>} 로드 성공 여부
     * @private
     */
    async loadErrorLogs() {
        try {
            // TODO: 실제 오류 로그 가져오기
            // 현재 데모에서는 임의의 로그 생성
            this.logs = this.generateSampleLogs();
            
            // 로그 표시
            this.displayLogs();
            
            return true;
        } catch (error) {
            console.error('Error loading error logs:', error);
            return false;
        }
    }

    /**
     * 오류 로그 표시
     * @private
     */
    displayLogs() {
        const logsContainer = document.getElementById('error-logs');
        
        if (this.logs.length === 0) {
            logsContainer.textContent = '오류 로그가 없습니다.';
            return;
        }
        
        // 로그 포맷
        const formattedLogs = this.logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString();
            return `[${timestamp}] [${log.level}] ${log.source}: ${log.message}`;
        }).join('\n');
        
        logsContainer.textContent = formattedLogs;
    }

    /**
     * 샘플 로그 생성
     * @returns {Array} 샘플 로그 배열
     * @private
     */
    generateSampleLogs() {
        const sources = ['Database', 'Realtime', 'Translation', 'WebSocket', 'Authentication'];
        const levels = ['INFO', 'WARN', 'ERROR'];
        const messages = [
            '서비스 시작',
            '연결 시도 중',
            '연결 완료',
            '연결 실패: 타임아웃',
            '인증 오류',
            '메시지 처리 중 예외 발생',
            '요청 처리 중 오류 발생',
            '메모리 부족 경고',
            '서비스 재시작',
            '구성 파일 로드 실패'
        ];
        
        // 현재 날짜에서 7일 이내의 타임스탬프 생성
        const getRandomTimestamp = () => {
            const now = new Date();
            const daysAgo = Math.floor(Math.random() * 7);
            const hoursAgo = Math.floor(Math.random() * 24);
            const minutesAgo = Math.floor(Math.random() * 60);
            
            now.setDate(now.getDate() - daysAgo);
            now.setHours(now.getHours() - hoursAgo);
            now.setMinutes(now.getMinutes() - minutesAgo);
            
            return now.toISOString();
        };
        
        // 10-20개의 로그 생성
        const logCount = Math.floor(Math.random() * 11) + 10;
        const logs = [];
        
        for (let i = 0; i < logCount; i++) {
            const level = levels[Math.floor(Math.random() * levels.length)];
            
            logs.push({
                timestamp: getRandomTimestamp(),
                level: level,
                source: sources[Math.floor(Math.random() * sources.length)],
                message: messages[Math.floor(Math.random() * messages.length)]
            });
        }
        
        // 타임스탬프 기준으로 정렬
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return logs;
    }

    /**
     * 자동 업데이트 시작
     * @param {number} interval 업데이트 간격 (밀리초)
     * @private
     */
    startAutoUpdate(interval = 5000) {
        // 이전 타이머가 있으면 정지
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // 주기적으로 데이터 업데이트
        this.updateInterval = setInterval(() => {
            this.loadServiceStatus();
            this.updatePerformanceChart();
        }, interval);
    }

    /**
     * 자동 업데이트 정지
     * @private
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// 싱글톤 인스턴스 생성
const adminSystem = new AdminSystem();
