/**
 * 관리자 대시보드 모듈
 * 관리자 페이지의 대시보드 기능을 처리합니다.
 */

class AdminDashboard {
    constructor() {
        this.statsElements = {
            activeUsers: document.getElementById('active-users-count'),
            totalMessages: document.getElementById('total-messages-count'),
            translationCount: document.getElementById('translation-count'),
            activeRooms: document.getElementById('active-rooms-count')
        };
        
        this.charts = {
            activity: null,
            language: null
        };
        
        this.statsUpdateInterval = null;
    }

    /**
     * 대시보드 초기화
     */
    initialize() {
        // 차트 초기화
        this.initCharts();
        
        // 통계 로드
        this.loadStats();
        
        // 주기적인 통계 업데이트 설정
        this.statsUpdateInterval = setInterval(() => {
            this.loadStats();
        }, 60000); // 1분마다 업데이트
    }

    /**
     * 대시보드 정리
     */
    cleanup() {
        // 주기적인 업데이트 중단
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
            this.statsUpdateInterval = null;
        }
        
        // 차트 정리
        if (this.charts.activity) {
            this.charts.activity.destroy();
            this.charts.activity = null;
        }
        
        if (this.charts.language) {
            this.charts.language.destroy();
            this.charts.language = null;
        }
    }

    /**
     * 차트 초기화
     * @private
     */
    initCharts() {
        // 시간별 활동 차트
        const activityChartCtx = document.getElementById('activity-chart').getContext('2d');
        this.charts.activity = new Chart(activityChartCtx, {
            type: 'line',
            data: {
                labels: this.generateHourLabels(),
                datasets: [{
                    label: '메시지 수',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#3f51b5',
                    backgroundColor: 'rgba(63, 81, 181, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
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
        
        // 언어별 사용량 차트
        const languageChartCtx = document.getElementById('language-chart').getContext('2d');
        this.charts.language = new Chart(languageChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['한국어', '영어', '일본어', '중국어'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#3f51b5',
                        '#ff4081',
                        '#4caf50',
                        '#ff9800'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    /**
     * 시간별 라벨 생성
     * @returns {Array} 시간 라벨 배열
     * @private
     */
    generateHourLabels() {
        const labels = [];
        for (let i = 0; i < 24; i++) {
            labels.push(`${i}:00`);
        }
        return labels;
    }

    /**
     * 통계 데이터 로드
     * @private
     */
    async loadStats() {
        try {
            // 실제 애플리케이션에서는 서버에서 통계 데이터를 가져옴
            // 여기서는 데모를 위해 가상 데이터 생성
            
            // 활성 사용자 수
            const activeUsers = await this.getActiveUserCount();
            
            // 총 메시지 수
            const totalMessages = await this.getTotalMessageCount();
            
            // 번역 요청 수
            const translationCount = await this.getTranslationCount();
            
            // 활성 채팅방 수
            const activeRooms = await this.getActiveRoomCount();
            
            // 통계 표시 업데이트
            this.updateStats(activeUsers, totalMessages, translationCount, activeRooms);
            
            // 차트 데이터 업데이트
            this.updateCharts();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    /**
     * 통계 표시 업데이트
     * @param {number} activeUsers 활성 사용자 수
     * @param {number} totalMessages 총 메시지 수
     * @param {number} translationCount 번역 요청 수
     * @param {number} activeRooms 활성 채팅방 수
     * @private
     */
    updateStats(activeUsers, totalMessages, translationCount, activeRooms) {
        this.statsElements.activeUsers.textContent = activeUsers;
        this.statsElements.totalMessages.textContent = totalMessages;
        this.statsElements.translationCount.textContent = translationCount;
        this.statsElements.activeRooms.textContent = activeRooms;
    }

    /**
     * 차트 데이터 업데이트
     * @private
     */
    async updateCharts() {
        // 시간별 활동 데이터
        const activityData = await this.getHourlyActivityData();
        
        // 언어별 사용량 데이터
        const languageData = await this.getLanguageUsageData();
        
        // 활동 차트 업데이트
        this.charts.activity.data.datasets[0].data = activityData;
        this.charts.activity.update();
        
        // 언어 차트 업데이트
        this.charts.language.data.datasets[0].data = languageData;
        this.charts.language.update();
    }

    /**
     * 활성 사용자 수 가져오기
     * @returns {Promise<number>} 활성 사용자 수
     * @private
     */
    async getActiveUserCount() {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 가져옴
            // 여기서는 데모를 위해 가상 데이터 생성
            return Math.floor(Math.random() * 50) + 10;
        } catch (error) {
            console.error('Error fetching active user count:', error);
            return 0;
        }
    }

    /**
     * 총 메시지 수 가져오기
     * @returns {Promise<number>} 총 메시지 수
     * @private
     */
    async getTotalMessageCount() {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 가져옴
            // 여기서는 데모를 위해 가상 데이터 생성
            return Math.floor(Math.random() * 1000) + 100;
        } catch (error) {
            console.error('Error fetching total message count:', error);
            return 0;
        }
    }

    /**
     * 번역 요청 수 가져오기
     * @returns {Promise<number>} 번역 요청 수
     * @private
     */
    async getTranslationCount() {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 가져옴
            // 여기서는 데모를 위해 가상 데이터 생성
            return Math.floor(Math.random() * 500) + 50;
        } catch (error) {
            console.error('Error fetching translation count:', error);
            return 0;
        }
    }

    /**
     * 활성 채팅방 수 가져오기
     * @returns {Promise<number>} 활성 채팅방 수
     * @private
     */
    async getActiveRoomCount() {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 가져옴
            // 여기서는 데모를 위해 가상 데이터 생성
            return Math.floor(Math.random() * 10) + 1;
        } catch (error) {
            console.error('Error fetching active room count:', error);
            return 0;
        }
    }

    /**
     * 시간별 활동 데이터 가져오기
     * @returns {Promise<Array>} 시간별 활동 데이터
     * @private
     */
    async getHourlyActivityData() {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 가져옴
            // 여기서는 데모를 위해 가상 데이터 생성
            const data = [];
            for (let i = 0; i < 24; i++) {
                data.push(Math.floor(Math.random() * 100));
            }
            return data;
        } catch (error) {
            console.error('Error fetching hourly activity data:', error);
            return Array(24).fill(0);
        }
    }

    /**
     * 언어별 사용량 데이터 가져오기
     * @returns {Promise<Array>} 언어별 사용량 데이터
     * @private
     */
    async getLanguageUsageData() {
        try {
            // 실제 애플리케이션에서는 데이터베이스에서 가져옴
            // 여기서는 데모를 위해 가상 데이터 생성
            return [
                Math.floor(Math.random() * 100) + 10, // 한국어
                Math.floor(Math.random() * 100) + 10, // 영어
                Math.floor(Math.random() * 100) + 10, // 일본어
                Math.floor(Math.random() * 100) + 10  // 중국어
            ];
        } catch (error) {
            console.error('Error fetching language usage data:', error);
            return [0, 0, 0, 0];
        }
    }
}

// 싱글톤 인스턴스 생성
const adminDashboard = new AdminDashboard();

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard.initialize();
});
