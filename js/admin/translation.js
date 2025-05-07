/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 관리자 번역 관리 기능
 * 작성일: 2025-05-07
 */

const adminTranslation = {
    /**
     * 번역 관리 페이지 초기화
     */
    async initialize() {
        console.log('번역 관리 페이지 초기화 중...');
        
        try {
            // 번역 통계 로드
            await this.loadTranslationStats();
            
            // 번역 언어 차트 초기화
            this.initializeLanguageChart();
            
            // 캐시 비우기 버튼 이벤트 초기화
            document.getElementById('clear-translation-cache-btn').addEventListener('click', () => {
                this.confirmClearCache();
            });
            
            console.log('번역 관리 페이지 초기화 완료');
        } catch (error) {
            console.error('번역 관리 페이지 초기화 오류:', error);
            window.uiService.addNotification('번역 관리 페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 번역 통계 로드
     */
    async loadTranslationStats() {
        try {
            // 총 번역 수 조회
            const { count: totalTranslations, error: countError } = await supabase
                .from('translation_cache')
                .select('id', { count: 'exact', head: true });
            
            if (countError) throw countError;
            
            document.getElementById('translation-count').textContent = totalTranslations;
            document.getElementById('cached-translation-count').textContent = totalTranslations;
            
            // 추정 API 비용 계산 (문자당 0.001 USD 가정)
            const { data: translations, error: translationsError } = await supabase
                .from('translation_cache')
                .select('original_text');
            
            if (translationsError) throw translationsError;
            
            // 총 문자 수 계산
            const totalCharacters = translations.reduce((total, t) => total + t.original_text.length, 0);
            
            // 추정 비용 계산 (문자당 0.00002 USD 가정)
            const estimatedCost = (totalCharacters * 0.00002).toFixed(2);
            
            document.getElementById('saved-api-cost').textContent = `$${estimatedCost} USD`;
            
            // 언어별 데이터 수집
            const { data: languageData, error: languageError } = await supabase
                .from('translation_cache')
                .select('target_language, id');
            
            if (languageError) throw languageError;
            
            // 언어별 카운트
            this.languageCounts = {
                'ko': 0,
                'en': 0,
                'hi': 0,
                'zh': 0,
                'other': 0
            };
            
            languageData.forEach(t => {
                const lang = t.target_language;
                
                if (this.languageCounts[lang] !== undefined) {
                    this.languageCounts[lang]++;
                } else {
                    this.languageCounts['other']++;
                }
            });
            
        } catch (error) {
            console.error('번역 통계 로드 오류:', error);
            throw error;
        }
    },
    
    /**
     * 언어 차트 초기화
     */
    initializeLanguageChart() {
        // 차트가 이미 존재하면 파괴
        if (this.languageChart) {
            this.languageChart.destroy();
        }
        
        // 차트 데이터 준비
        const labels = {
            'ko': '한국어',
            'en': '영어',
            'hi': '힌디어',
            'zh': '중국어',
            'other': '기타'
        };
        
        const chartData = {
            labels: Object.keys(this.languageCounts).map(key => labels[key]),
            datasets: [{
                label: '번역 수',
                data: Object.values(this.languageCounts),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',    // 파랑 - 한국어
                    'rgba(16, 185, 129, 0.7)',    // 녹색 - 영어
                    'rgba(245, 158, 11, 0.7)',    // 주황 - 힌디어
                    'rgba(239, 68, 68, 0.7)',     // 빨강 - 중국어
                    'rgba(107, 114, 128, 0.7)'    // 회색 - 기타
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
        };
        
        // 차트 생성
        const ctx = document.getElementById('translation-language-chart').getContext('2d');
        this.languageChart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
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
     * 번역 캐시 비우기 확인
     */
    confirmClearCache() {
        const { count } = document.getElementById('cached-translation-count').textContent;
        
        if (confirm(`번역 캐시를 모두 비우시겠습니까? 총 ${count}개의 번역이 삭제됩니다.\n\n이 작업은 되돌릴 수 없으며, 번역이 필요한 경우 API를 다시 호출해야 합니다.`)) {
            this.clearTranslationCache();
        }
    },
    
    /**
     * 번역 캐시 비우기
     */
    async clearTranslationCache() {
        try {
            // 번역 캐시 테이블 비우기
            const { error } = await supabase
                .from('translation_cache')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');  // 모든 행 삭제
            
            if (error) throw error;
            
            // 번역 통계 다시 로드
            await this.loadTranslationStats();
            
            // 차트 업데이트
            this.initializeLanguageChart();
            
            // 알림 표시
            window.uiService.addNotification('번역 캐시가 성공적으로 비워졌습니다.', 'success');
        } catch (error) {
            console.error('번역 캐시 비우기 오류:', error);
            alert('번역 캐시 비우기 중 오류가 발생했습니다.');
        }
    }
};

// 전역 객체로 내보내기
window.adminTranslation = adminTranslation;

// 스크립트 로드 완료 이벤트 발생
document.dispatchEvent(new Event('adminTranslationLoaded'));
