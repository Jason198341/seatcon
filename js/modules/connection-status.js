/**
 * 연결 상태 표시 모듈
 * 
 * 네트워크 연결 상태를 시각적으로 표시하고 관리합니다.
 * 네트워크 모니터와 연동하여 실시간 상태 업데이트를 제공합니다.
 */
class ConnectionStatusIndicator {
    constructor() {
        // 상태 표시기 요소
        this.indicatorElement = null;
        
        // 연결 상태
        this.isOnline = navigator.onLine;
        this.reconnecting = false;
        
        // 애니메이션 타이머
        this.pulseTimer = null;
        
        // 자동 숨김 타이머
        this.hideTimer = null;
        
        // 설정
        this.settings = {
            autoHide: true,           // 일정 시간 후 자동 숨김
            autoHideDelay: 3000,      // 자동 숨김 지연 시간 (ms)
            showOnlineStatus: true,   // 온라인 상태도 표시
            position: 'top',          // 위치 (top, bottom)
            animation: true           // 애니메이션 사용 여부
        };
        
        // 초기화
        this.init();
    }
    
    /**
     * 연결 상태 표시기 초기화
     */
    init() {
        console.log('연결 상태 표시기 초기화');
        
        // 표시기 요소 생성
        this.createIndicatorElement();
        
        // 네트워크 이벤트 리스너 등록
        this.setupNetworkListeners();
        
        // 초기 상태 설정
        this.updateStatus(this.isOnline);
    }
    
    /**
     * 표시기 요소 생성
     */
    createIndicatorElement() {
        // 이미 존재하는 경우 제거
        if (this.indicatorElement) {
            this.indicatorElement.remove();
        }
        
        // 표시기 요소 생성
        this.indicatorElement = document.createElement('div');
        this.indicatorElement.className = 'connection-status-indicator';
        this.indicatorElement.classList.add(this.settings.position);
        
        // 내용 설정
        this.indicatorElement.innerHTML = `
            <div class="status-icon">
                <i class="fas fa-wifi"></i>
            </div>
            <div class="status-text"></div>
        `;
        
        // 클릭 시 이벤트
        this.indicatorElement.addEventListener('click', () => {
            this.hideIndicator();
        });
        
        // 페이지에 추가
        document.body.appendChild(this.indicatorElement);
    }
    
    /**
     * 네트워크 이벤트 리스너 설정
     */
    setupNetworkListeners() {
        // 브라우저 온라인/오프라인 이벤트
        window.addEventListener('online', () => {
            this.updateStatus(true);
        });
        
        window.addEventListener('offline', () => {
            this.updateStatus(false);
        });
        
        // 네트워크 모니터 이벤트 리스너 (있는 경우)
        if (window.networkMonitor) {
            networkMonitor.on('connectionChange', (data) => {
                this.updateStatus(data.isOnline);
            });
            
            networkMonitor.on('reconnecting', (data) => {
                this.showReconnecting(data);
            });
            
            networkMonitor.on('reconnected', () => {
                this.updateStatus(true, '연결 복원됨');
            });
            
            networkMonitor.on('reconnectFailed', () => {
                this.updateStatus(false, '연결 실패');
            });
        }
    }
    
    /**
     * 상태 업데이트
     * @param {boolean} isOnline - 온라인 상태 여부
     * @param {string} customText - 사용자 지정 텍스트 (선택적)
     */
    updateStatus(isOnline, customText = null) {
        // 상태 업데이트
        this.isOnline = isOnline;
        this.reconnecting = false;
        
        // 클래스 업데이트
        this.indicatorElement.classList.remove('online', 'offline', 'reconnecting');
        this.indicatorElement.classList.add(isOnline ? 'online' : 'offline');
        
        // 아이콘 업데이트
        const iconElement = this.indicatorElement.querySelector('.status-icon i');
        iconElement.className = isOnline ? 'fas fa-wifi' : 'fas fa-wifi-slash';
        
        // 텍스트 업데이트
        const textElement = this.indicatorElement.querySelector('.status-text');
        textElement.textContent = customText || (isOnline ? '온라인' : '오프라인');
        
        // 표시기 표시
        this.showIndicator();
        
        // 온라인 상태는 짧게 표시하고 자동 숨김
        if (isOnline && this.settings.autoHide) {
            this.startHideTimer();
        } else {
            // 오프라인 상태는 계속 표시
            this.stopHideTimer();
        }
        
        // 애니메이션 효과 (펄스)
        this.startPulseAnimation();
    }
    
    /**
     * 재연결 중 상태 표시
     * @param {Object} data - 재연결 데이터
     */
    showReconnecting(data) {
        // 상태 업데이트
        this.reconnecting = true;
        
        // 클래스 업데이트
        this.indicatorElement.classList.remove('online', 'offline');
        this.indicatorElement.classList.add('reconnecting');
        
        // 아이콘 업데이트
        const iconElement = this.indicatorElement.querySelector('.status-icon i');
        iconElement.className = 'fas fa-sync fa-spin';
        
        // 텍스트 업데이트
        const textElement = this.indicatorElement.querySelector('.status-text');
        textElement.textContent = `재연결 중... (${data.attempt}/${data.maxAttempts})`;
        
        // 표시기 표시
        this.showIndicator();
        
        // 자동 숨김 타이머 중지
        this.stopHideTimer();
    }
    
    /**
     * 표시기 표시
     */
    showIndicator() {
        // 숨겨져 있으면 표시
        if (this.indicatorElement.classList.contains('hidden')) {
            this.indicatorElement.classList.remove('hidden');
            
            // 애니메이션 효과 (슬라이드)
            if (this.settings.animation) {
                this.indicatorElement.style.transform = 
                    this.settings.position === 'top' ? 'translateY(-100%)' : 'translateY(100%)';
                
                setTimeout(() => {
                    this.indicatorElement.style.transition = 'transform 0.3s ease-out';
                    this.indicatorElement.style.transform = 'translateY(0)';
                }, 10);
            }
        }
    }
    
    /**
     * 표시기 숨김
     */
    hideIndicator() {
        // 이미 숨겨져 있으면 무시
        if (this.indicatorElement.classList.contains('hidden')) return;
        
        // 애니메이션 효과 (슬라이드)
        if (this.settings.animation) {
            this.indicatorElement.style.transition = 'transform 0.3s ease-in';
            this.indicatorElement.style.transform = 
                this.settings.position === 'top' ? 'translateY(-100%)' : 'translateY(100%)';
            
            setTimeout(() => {
                this.indicatorElement.classList.add('hidden');
                this.indicatorElement.style.transition = '';
            }, 300);
        } else {
            this.indicatorElement.classList.add('hidden');
        }
        
        // 자동 숨김 타이머 중지
        this.stopHideTimer();
    }
    
    /**
     * 자동 숨김 타이머 시작
     */
    startHideTimer() {
        // 기존 타이머 정리
        this.stopHideTimer();
        
        // 새 타이머 설정
        this.hideTimer = setTimeout(() => {
            this.hideIndicator();
        }, this.settings.autoHideDelay);
    }
    
    /**
     * 자동 숨김 타이머 중지
     */
    stopHideTimer() {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    }
    
    /**
     * 펄스 애니메이션 시작
     */
    startPulseAnimation() {
        // 기존 타이머 정리
        this.stopPulseAnimation();
        
        // 애니메이션이 비활성화되어 있으면 무시
        if (!this.settings.animation) return;
        
        // 애니메이션 적용
        this.indicatorElement.classList.add('pulse');
        
        // 애니메이션 종료 타이머
        this.pulseTimer = setTimeout(() => {
            this.indicatorElement.classList.remove('pulse');
        }, 1000);
    }
    
    /**
     * 펄스 애니메이션 중지
     */
    stopPulseAnimation() {
        if (this.pulseTimer) {
            clearTimeout(this.pulseTimer);
            this.pulseTimer = null;
        }
        
        this.indicatorElement.classList.remove('pulse');
    }
    
    /**
     * 설정 업데이트
     * @param {Object} newSettings - 새 설정
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // 위치 클래스 업데이트
        this.indicatorElement.classList.remove('top', 'bottom');
        this.indicatorElement.classList.add(this.settings.position);
        
        // 현재 상태에 따라 자동 숨김 설정 적용
        if (this.isOnline && this.settings.autoHide) {
            this.startHideTimer();
        } else {
            this.stopHideTimer();
        }
    }
    
    /**
     * 인스턴스 정리
     */
    dispose() {
        // 타이머 정리
        this.stopHideTimer();
        this.stopPulseAnimation();
        
        // 요소 제거
        if (this.indicatorElement) {
            this.indicatorElement.remove();
            this.indicatorElement = null;
        }
        
        // 이벤트 리스너 제거
        window.removeEventListener('online', this.updateStatus);
        window.removeEventListener('offline', this.updateStatus);
    }
}

// 전역 인스턴스 생성
const connectionStatusIndicator = new ConnectionStatusIndicator();