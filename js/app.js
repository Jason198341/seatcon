/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * 메인 애플리케이션 로직
 * 작성일: 2025-05-07
 */

// 애플리케이션 초기화 상태
let isAppInitialized = false;

/**
 * 애플리케이션 초기화 함수
 */
async function initializeApp() {
    // 이미 초기화된 경우 중복 실행 방지
    if (isAppInitialized) return;
    
    try {
        console.log('애플리케이션 초기화 중...');
        
        // 로그인 상태 확인
        const isLoggedIn = window.authService.authState.load();
        
        // 채팅방 목록 로드
        const roomsWithCategories = await window.supabaseService.getRoomsWithCategories();
        
        // 쿼리 파라미터에서 채팅방 ID 확인
        const params = window.utils.getQueryParams();
        const roomId = params.room;
        
        // 채팅방 목록 UI 업데이트
        window.uiService.updateRoomListUI(roomsWithCategories, roomId);
        
        // 지정된 채팅방이 있으면 해당 채팅방 초기화
        if (roomId) {
            // 채팅방 정보 찾기
            let selectedRoom;
            for (const category of roomsWithCategories) {
                const room = category.rooms.find(r => r.id === roomId);
                if (room) {
                    selectedRoom = room;
                    break;
                }
            }
            
            if (selectedRoom) {
                // 채팅방 초기화
                const success = await window.chatService.initializeChat(roomId);
                
                if (success) {
                    // 채팅방 헤더 업데이트
                    document.getElementById('current-room-name').textContent = selectedRoom.name;
                    document.getElementById('current-room-description').textContent = selectedRoom.description || '';
                }
            } else {
                console.warn(`지정된 채팅방(${roomId})을 찾을 수 없습니다.`);
                window.uiService.addNotification('지정된 채팅방을 찾을 수 없습니다.', 'warning');
            }
        } else if (roomsWithCategories.length > 0 && roomsWithCategories[0].rooms.length > 0) {
            // 기본 채팅방으로 첫 번째 채팅방 사용
            const defaultRoom = roomsWithCategories[0].rooms[0];
            
            // 채팅방 초기화
            const success = await window.chatService.initializeChat(defaultRoom.id);
            
            if (success) {
                // 채팅방 헤더 업데이트
                document.getElementById('current-room-name').textContent = defaultRoom.name;
                document.getElementById('current-room-description').textContent = defaultRoom.description || '';
                
                // URL 업데이트
                const url = new URL(window.location);
                url.searchParams.set('room', defaultRoom.id);
                window.history.pushState({}, '', url);
                
                // 채팅방 목록 UI 업데이트
                window.uiService.updateRoomListUI(roomsWithCategories, defaultRoom.id);
            }
        }
        
        // 로그인 UI 업데이트
        if (isLoggedIn) {
            window.uiService.updateLoginUI(true, window.authService.authState.user);
            
            // 선호 언어 설정
            if (window.authService.authState.user.preferred_language) {
                window.chatService.changeLanguage(window.authService.authState.user.preferred_language);
            }
        }
        
        // 초기화 완료
        isAppInitialized = true;
        console.log('애플리케이션 초기화 완료');
        
    } catch (error) {
        console.error('애플리케이션 초기화 오류:', error);
        window.uiService.addNotification('애플리케이션 초기화 중 오류가 발생했습니다.', 'error');
    }
}

// 페이지 로드 시 모든 서비스가 로드된 후 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 필요한 서비스들이 모두 로드되었는지 확인
    const requiredServices = [
        'utilsLoaded',
        'supabaseServiceLoaded',
        'translationServiceLoaded',
        'authServiceLoaded',
        'chatServiceLoaded',
        'uiServiceLoaded'
    ];
    
    const loadedServices = new Set();
    
    // 각 서비스 로드 이벤트 리스너
    requiredServices.forEach(service => {
        // 이미 로드된 서비스 확인
        if (document.readyState !== 'loading' && document.dispatchEvent(new Event(service, { cancelable: true }))) {
            loadedServices.add(service);
        }
        
        // 향후 로드될 서비스 이벤트 리스너
        document.addEventListener(service, () => {
            loadedServices.add(service);
            
            // 모든 서비스가 로드되었는지 확인
            if (requiredServices.every(s => loadedServices.has(s))) {
                initializeApp();
            }
        });
    });
    
    // 이미 모든 서비스가 로드된 경우 바로 초기화
    if (requiredServices.every(s => loadedServices.has(s))) {
        initializeApp();
    }
});

// 오프라인 감지 및 재연결
window.addEventListener('online', () => {
    window.uiService.addNotification('인터넷 연결이 복원되었습니다.', 'success');
    
    // 연결 재시도
    if (isAppInitialized) {
        // 현재 채팅방이 있으면 재연결
        if (window.chatService.chatState.currentRoomId) {
            window.chatService.initializeChat(window.chatService.chatState.currentRoomId)
                .catch(error => {
                    console.error('채팅 재연결 오류:', error);
                    window.uiService.addNotification('채팅 재연결 중 오류가 발생했습니다.', 'error');
                });
        }
    }
});

window.addEventListener('offline', () => {
    window.uiService.addNotification('인터넷 연결이 끊어졌습니다. 재연결 중...', 'warning');
});

// 창 포커스 변경 감지
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // 페이지 포커스 시 새 메시지 확인
        if (isAppInitialized && window.chatService.chatState.currentRoomId) {
            // 메시지 업데이트 UI만 갱신
            window.chatService.updateMessagesUI();
        }
    }
});

// 페이지 새로고침 또는 종료 전 경고
window.addEventListener('beforeunload', (event) => {
    // 메시지 입력 중인 경우 경고
    const messageInput = document.getElementById('message-input');
    
    if (messageInput && messageInput.value.trim()) {
        event.preventDefault();
        event.returnValue = '작성 중인 메시지가 있습니다. 페이지를 떠나시겠습니까?';
        return event.returnValue;
    }
});

// 기타 유틸리티 함수 
// 도큐먼트 제목 업데이트 함수
function updateDocumentTitle(newTitle) {
    if (newTitle) {
        document.title = `${newTitle} - 2025 글로벌 시트 컨퍼런스 채팅`;
    } else {
        document.title = '2025 글로벌 시트 컨퍼런스 채팅';
    }
}

// 새 메시지 알림 함수
let notificationSound;
let notificationPermission = false;

// 알림 권한 요청 및 초기화
function initializeNotifications() {
    // 알림 소리 초기화
    notificationSound = new Audio('sound/notification.mp3');
    
    // 알림 권한 확인
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            notificationPermission = true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                notificationPermission = permission === 'granted';
            });
        }
    }
}

// 새 메시지 알림 표시 함수
function showMessageNotification(message) {
    // 현재 포커스가 없는 경우에만 알림
    if (document.visibilityState !== 'visible') {
        // 소리 알림
        if (notificationSound) {
            notificationSound.play().catch(e => console.warn('알림 소리 재생 오류:', e));
        }
        
        // 시스템 알림 (권한이 있는 경우)
        if (notificationPermission) {
            const senderName = message.user.username;
            const messageContent = message.translated_content || message.content;
            
            // 메시지 길이 제한
            const maxLength = 50;
            const shortenedContent = messageContent.length > maxLength
                ? messageContent.substring(0, maxLength) + '...'
                : messageContent;
            
            const notification = new Notification('새 메시지', {
                body: `${senderName}: ${shortenedContent}`,
                icon: 'img/logo.png'
            });
            
            // 알림 클릭 시 페이지 포커스
            notification.onclick = () => {
                window.focus();
                notification.close();
                
                // 해당 메시지로 스크롤
                const messageElement = document.querySelector(`.message[data-id="${message.id}"]`);
                if (messageElement) {
                    messageElement.scrollIntoView({ behavior: 'smooth' });
                    messageElement.classList.add('highlight');
                    
                    // 강조 효과 제거
                    setTimeout(() => {
                        messageElement.classList.remove('highlight');
                    }, 2000);
                }
            };
            
            // 알림 자동 닫기
            setTimeout(() => {
                notification.close();
            }, 5000);
        }
    }
}

// 새 메시지 이벤트에 알림 기능 연결
document.addEventListener('newMessage', (event) => {
    const message = event.detail;
    
    // 자신의 메시지가 아닌 경우에만 알림
    if (!window.authService.authState.isValid() || 
        window.authService.authState.user.id !== message.user_id) {
        
        // 채팅방 제목 업데이트
        const roomName = document.getElementById('current-room-name').textContent;
        updateDocumentTitle(`(새 메시지) ${roomName}`);
        
        // 알림 표시
        showMessageNotification(message);
    }
});

// 페이지 포커스 시 제목 복원
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const roomName = document.getElementById('current-room-name').textContent;
        updateDocumentTitle(roomName);
    }
});

// 알림 초기화
initializeNotifications();
