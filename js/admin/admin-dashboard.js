/**
 * 관리자 대시보드 모듈
 * 활성 사용자, 메시지 통계, 활동 차트 등을 표시합니다.
 */

class AdminDashboard {
    constructor() {
        this.activityChart = null;
        this.languageChart = null;
        this.updateInterval = null;
    }

    /**
     * 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            console.log('Initializing admin dashboard...');
            
            // 통계 데이터 로드
            await this.loadStats();
            
            // 차트 초기화
            this.initCharts();
            
            // 자동 업데이트 설정
            this.startAutoUpdate();
            
            console.log('Admin dashboard initialized');
            return true;
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
            return false;
        }
    }

    /**
     * 통계 데이터 로드
     * @returns {Promise<boolean>} 로드 성공 여부
     * @private
     */
    async loadStats() {
        try {
            // 활성 사용자 수 로드
            const activeUsers = await this.getActiveUsers();
            document.getElementById('active-users-count').textContent = activeUsers;
            
            // 총 메시지 수 로드
            const totalMessages = await this.getTotalMessages();
            document.getElementById('total-messages-count').textContent = totalMessages;
            
            // 번역 요청 수 로드
            const translationCount = await this.getTranslationCount();
            document.getElementById('translation-count').textContent = translationCount;
            
            // 활성 채팅방 수 로드
            const activeRooms = await this.getActiveRooms();
            document.getElementById('active-rooms-count').textContent = activeRooms;
            
            return true;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            return false;
        }
    }

    /**
     * 차트 초기화
     * @private
     */
    initCharts() {
        // 시간별 활동 차트
        this.initActivityChart();
        
        // 언어별 사용량 차트
        this.initLanguageChart();
    }

    /**
     * 시간별 활동 차트 초기화
     * @private
     */
    initActivityChart() {
        const ctx = document.getElementById('activity-chart').getContext('2d');
        
        // 초기 데이터
        const data = {
            labels: this.getLast24Hours(),
            datasets: [{
                label: '메시지',
                backgroundColor: 'rgba(63, 81, 181, 0.2)',
                borderColor: 'rgba(63, 81, 181, 1)',
                borderWidth: 2,
                data: Array(24).fill(0),
                tension: 0.3
            }, {
                label: '사용자',
                backgroundColor: 'rgba(255, 64, 129, 0.2)',
                borderColor: 'rgba(255, 64, 129, 1)',
                borderWidth: 2,
                data: Array(24).fill(0),
                tension: 0.3
            }]
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
                        beginAtZero: true
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
                }
            }
        };
        
        // 차트 생성
        this.activityChart = new Chart(ctx, config);
        
        // 데이터 로드
        this.loadActivityData();
    }

    /**
     * 언어별 사용량 차트 초기화
     * @private
     */
    initLanguageChart() {
        const ctx = document.getElementById('language-chart').getContext('2d');
        
        // 초기 데이터
        const data = {
            labels: ['한국어', '영어', '일본어', '중국어'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(63, 81, 181, 0.7)',
                    'rgba(255, 64, 129, 0.7)',
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(255, 152, 0, 0.7)'
                ],
                borderWidth: 1
            }]
        };
        
        // 차트 설정
        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
        
        // 차트 생성
        this.languageChart = new Chart(ctx, config);
        
        // 데이터 로드
        this.loadLanguageData();
    }

    /**
     * 시간별 활동 데이터 로드
     * @private
     */
    async loadActivityData() {
        try {
            // 시간별 메시지 데이터
            const messageData = await this.getHourlyMessageData();
            
            // 시간별 사용자 데이터
            const userData = await this.getHourlyUserData();
            
            // 차트 업데이트
            this.activityChart.data.datasets[0].data = messageData;
            this.activityChart.data.datasets[1].data = userData;
            this.activityChart.update();
        } catch (error) {
            console.error('Error loading activity data:', error);
        }
    }

    /**
     * 언어별 사용량 데이터 로드
     * @private
     */
    async loadLanguageData() {
        try {
            // 언어별 사용량 데이터
            const languageData = await this.getLanguageUsageData();
            
            // 차트 업데이트
            this.languageChart.data.datasets[0].data = [
                languageData.ko || 0,
                languageData.en || 0,
                languageData.ja || 0,
                languageData.zh || 0
            ];
            this.languageChart.update();
        } catch (error) {
            console.error('Error loading language data:', error);
        }
    }

    /**
     * 자동 업데이트 시작
     * @param {number} interval 업데이트 간격 (밀리초)
     * @private
     */
    startAutoUpdate(interval = 30000) {
        // 이전 타이머가 있으면 정지
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // 주기적으로 데이터 업데이트
        this.updateInterval = setInterval(() => {
            this.loadStats();
            this.loadActivityData();
            this.loadLanguageData();
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

    /**
     * 활성 사용자 수 가져오기
     * @returns {Promise<number>} 활성 사용자 수
     * @private
     */
    async getActiveUsers() {
        // TODO: API 호출로 실제 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return Math.floor(Math.random() * 100) + 50;
    }

    /**
     * 총 메시지 수 가져오기
     * @returns {Promise<number>} 총 메시지 수
     * @private
     */
    async getTotalMessages() {
        // TODO: API 호출로 실제 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return Math.floor(Math.random() * 1000) + 500;
    }

    /**
     * 번역 요청 수 가져오기
     * @returns {Promise<number>} 번역 요청 수
     * @private
     */
    async getTranslationCount() {
        // TODO: API 호출로 실제 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return Math.floor(Math.random() * 800) + 200;
    }

    /**
     * 활성 채팅방 수 가져오기
     * @returns {Promise<number>} 활성 채팅방 수
     * @private
     */
    async getActiveRooms() {
        // TODO: API 호출로 실제 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return Math.floor(Math.random() * 20) + 5;
    }

    /**
     * 시간별 메시지 데이터 가져오기
     * @returns {Promise<Array>} 시간별 메시지 데이터
     * @private
     */
    async getHourlyMessageData() {
        // TODO: API 호출로 실제 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return Array(24).fill(0).map(() => Math.floor(Math.random() * 50));
    }

    /**
     * 시간별 사용자 데이터 가져오기
     * @returns {Promise<Array>} 시간별 사용자 데이터
     * @private
     */
    async getHourlyUserData() {
        // TODO: API 호출로 실제 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return Array(24).fill(0).map(() => Math.floor(Math.random() * 30));
    }

    /**
     * 언어별 사용량 데이터 가져오기
     * @returns {Promise<Object>} 언어별 사용량 데이터
     * @private
     */
    async getLanguageUsageData() {
        // TODO: API 호출로 실제 데이터 가져오기
        // 현재 데모에서는 임의의 값 반환
        return {
            ko: Math.floor(Math.random() * 100) + 50,
            en: Math.floor(Math.random() * 100) + 30,
            ja: Math.floor(Math.random() * 50) + 20,
            zh: Math.floor(Math.random() * 30) + 10
        };
    }

    /**
     * 최근 24시간 레이블 생성
     * @returns {Array} 시간 레이블 배열
     * @private
     */
    getLast24Hours() {
        const hours = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
            const d = new Date();
            d.setHours(now.getHours() - i);
            hours.push(d.getHours() + ':00');
        }
        
        return hours;
    }
}

// 싱글톤 인스턴스 생성
const adminDashboard = new AdminDashboard();
