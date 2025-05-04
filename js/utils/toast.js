/**
 * 토스트 메시지 유틸리티
 * 애플리케이션에서 사용자에게 알림을 표시하는 기능
 */

/**
 * 토스트 메시지 생성 및 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 유형 (info, success, error, warning)
 * @param {number} duration - 표시 지속 시간 (ms, 기본값: CONFIG.UI.TOAST.DURATION)
 */
function createToast(message, type = 'info', duration = CONFIG?.UI?.TOAST?.DURATION || 3000) {
    // 토스트 컨테이너 요소 가져오기
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    
    // 토스트를 컨테이너에 추가
    container.appendChild(toast);
    
    // 토스트가 자동으로 사라지도록 설정
    setTimeout(() => {
        // 페이드아웃 효과 추가
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // 애니메이션 완료 후 요소 제거
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * 정보 토스트 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} duration - 표시 지속 시간 (ms)
 */
function infoToast(message, duration) {
    createToast(message, 'info', duration);
}

/**
 * 성공 토스트 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} duration - 표시 지속 시간 (ms)
 */
function successToast(message, duration) {
    createToast(message, 'success', duration);
}

/**
 * 오류 토스트 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} duration - 표시 지속 시간 (ms)
 */
function errorToast(message, duration) {
    createToast(message, 'error', duration);
}

/**
 * 경고 토스트 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {number} duration - 표시 지속 시간 (ms)
 */
function warningToast(message, duration) {
    createToast(message, 'warning', duration);
}
