/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 관리자 대시보드 기능
 * 작성일: 2025-05-07
 */

const adminDashboard = {
    charts: {
        hourlyActivity: null,
        languageDistribution: null
    },
    
    /**
     * 대시보드 초기화
     */
    async initialize() {
        console.log('관리자 대시보드 초기화 중...');
        
        try {
            // 통계 데이터 로드
            await this.loadStatistics();
            
            // 차트 초기화
            this.initializeCharts();
            
            console.log('관리자 대시보드 초기화 완료');
        } catch (error) {
            console.error('대시보드 초기화 오류:', error);
            window.uiService.addNotification('대시보드 초기화 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 통계 데이터 로드
     */
    async loadStatistics() {
        try {
            // 사용자 통계
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id');
            
            if (usersError) throw usersError;
            
            document.getElementById('total-users').textContent = users.length;
            
            // 채팅방 통계
            const { data: rooms, error: roomsError } = await supabase
                .from('rooms')
                .select('id');
            
            if (roomsError) throw roomsError;
            
            document.getElementById('total-rooms').textContent = rooms.length;
            
            // 메시지 통계
            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('id');
            
            if (messagesError) throw messagesError;
            
            document.getElementById('total-messages').textContent = messages.length;
            
            // 번역 통계
            const { data: translations, error: translationsError } = await supabase
                .from('translation_cache')
                .select('id');
            
            if (translationsError) throw translationsError;
            
            document.getElementById('total-translations').textContent = translations.length;
            
            // 시간별 활동 데이터
            const { data: hourlyData, error: hourlyError } = await supabase
                .from('messages')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(500);  // 최근 500개 메시지
            
            if (hourlyError) throw hourlyError;
            
            // 언어별 분포 데이터
            const { data: languageData, error: languageError } = await supabase
                .from('messages')
                .select('original_language, id')
                .order('created_at', { ascending: false })
                .limit(1000);  // 최근 1000개 메시지
            
            if (languageError) throw languageError;
            
            // 차트 데이터 설정
            this.prepareChartData(hourlyData, languageData);
            
        } catch (error) {
            console.error('통계 데이터 로드 오류:', error);
            throw error;
        }
    },
    
    /**
     * 차트 데이터 준비
     * @param {Array} hourlyData - 시간별 활동 데이터
     * @param {Array} languageData - 언어별 분포 데이터
     */
    prepareChartData(hourlyData, languageData) {
        // 시간별 활동 데이터 처리
        const hourCounts = {};
        
        // 최근 24시간의 각 시간대별 버킷 초기화
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now);
            hour.setHours(now.getHours() - i);
            const hourKey = hour.getHours().toString().padStart(2, '0');
            hourCounts[hourKey] = 0;
        }
        
        // 메시지 시간별 카운트
        hourlyData.forEach(message => {
            const date = new Date(message.created_at);
            const hour = date.getHours().toString().padStart(2, '0');
            
            // 최근 24시간 내의 메시지만 카운트
            const hoursDiff = (now - date) / (1000 * 60 * 60);
            if (hoursDiff <= 24) {
                hourCounts[hour]++;
            }
        });
        
        // 차트 데이터 포맷
        this.hourlyActivityData = Object.keys(hourCounts).map(hour => {
            return {
                hour: `${hour}시`,
                count: hourCounts[hour]
            };
        });
        
        // 언어별 분포 데이터 처리
        const languageCounts = {
            'ko': 0,
            'en': 0,
            'hi': 0,
            'zh': 0,
            'other': 0
        };
        
        // 언어별 카운트
        languageData.forEach(message => {
            const language = message.original_language;
            
            if (languageCounts[language] !== undefined) {
                languageCounts[language]++;
            } else {
                languageCounts['other']++;
            }
        });
        
        // 차트 데이터 포맷
        this.languageDistributionData = [
            { language: '한국어', count: languageCounts['ko'] },
            { language: '영어', count: languageCounts['en'] },
            { language: '힌디어', count: languageCounts['hi'] },
            { language: '중국어', count: languageCounts['zh'] },
            { language: '기타', count: languageCounts['other'] }
        ];
    },
    
    /**
     * 차트 초기화
     */
    initializeCharts() {
        // 차트가 이미 존재하면 파괴
        if (this.charts.hourlyActivity) {
            this.charts.hourlyActivity.destroy();
        }
        
        if (this.charts.languageDistribution) {
            this.charts.languageDistribution.destroy();
        }
        
        // 시간별 활동 차트
        const hourlyCtx = document.getElementById('hourly-activity-chart').getContext('2d');
        this.charts.hourlyActivity = new Chart(hourlyCtx, {
            type: 'bar',
            data: {
                labels: this.hourlyActivityData.map(d => d.hour),
                datasets: [{
                    label: '메시지 수',
                    data: this.hourlyActivityData.map(d => d.count),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `메시지 수: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
        
        // 언어별 분포 차트
        const languageCtx = document.getElementById('language-distribution-chart').getContext('2d');
        this.charts.languageDistribution = new Chart(languageCtx, {
            type: 'doughnut',
            data: {
                labels: this.languageDistributionData.map(d => d.language),
                datasets: [{
                    label: '메시지 수',
                    data: this.languageDistributionData.map(d => d.count),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',   // 파랑 - 한국어
                        'rgba(16, 185, 129, 0.7)',   // 녹색 - 영어
                        'rgba(245, 158, 11, 0.7)',   // 주황 - 힌디어
                        'rgba(239, 68, 68, 0.7)',    // 빨강 - 중국어
                        'rgba(107, 114, 128, 0.7)'   // 회색 - 기타
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(107, 114, 128, 1)'
                    ],
                    borderWidth: 1
                }]
            },
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
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percentage = total ? Math.round((value / total) * 100) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * 통계 데이터 새로고침
     */
    async refreshStatistics() {
        try {
            // 로딩 표시
            document.getElementById('total-users').textContent = '로딩 중...';
            document.getElementById('total-rooms').textContent = '로딩 중...';
            document.getElementById('total-messages').textContent = '로딩 중...';
            document.getElementById('total-translations').textContent = '로딩 중...';
            
            // 통계 데이터 다시 로드
            await this.loadStatistics();
            
            // 차트 업데이트
            this.updateCharts();
            
            // 새로고침 알림
            window.uiService.addNotification('통계 데이터가 새로고침되었습니다.', 'success');
        } catch (error) {
            console.error('통계 데이터 새로고침 오류:', error);
            window.uiService.addNotification('통계 데이터 새로고침 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 차트 업데이트
     */
    updateCharts() {
        // 시간별 활동 차트 업데이트
        this.charts.hourlyActivity.data.labels = this.hourlyActivityData.map(d => d.hour);
        this.charts.hourlyActivity.data.datasets[0].data = this.hourlyActivityData.map(d => d.count);
        this.charts.hourlyActivity.update();
        
        // 언어별 분포 차트 업데이트
        this.charts.languageDistribution.data.labels = this.languageDistributionData.map(d => d.language);
        this.charts.languageDistribution.data.datasets[0].data = this.languageDistributionData.map(d => d.count);
        this.charts.languageDistribution.update();
    }
};

// 전역 객체로 내보내기
window.adminDashboard = adminDashboard;

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('adminDashboardLoaded'));
