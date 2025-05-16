/**
 * app-rooms.js
 * Global SeatCon 2025 Conference Chat
 * 채팅방 관련 기능
 */

// APP 객체는 이미 window.APP으로 초기화되어 있음

// 채팅방 모듈
APP.rooms = (() => {
    // 채팅방 목록 로드
    const loadChatRooms = async function() {
        try {
            // 서비스가 준비되지 않았을 경우 에러 표시
            if (!APP.state.servicesReady) {
                APP.ui.showLoginError(APP.i18n.translate('error.servicesNotReady') || 'Services are being prepared. Please try again in a moment.');
                return;
            }
            
            // 활성화된 채팅방만 조회
            const rooms = await dbService.getChatRooms(true);
            
            // 채팅방 선택 옵션 생성
            let options = `<option value="" disabled selected>${APP.i18n.translate('login.chatroom.select') || 'Select a chat room'}</option>`;
            
            rooms.forEach(room => {
                options += `<option value="${room.id}">${room.name}${room.is_private ? ' 🔒' : ''}</option>`;
            });
            
            // 채팅방 선택 목록 업데이트
            if (APP.elements.roomSelect) {
                APP.elements.roomSelect.innerHTML = options;
            }
        } catch (error) {
            console.error('채팅방 목록 로드 실패:', error);
            APP.ui.showLoginError(APP.i18n.translate('error.loadRooms') || 'Failed to load the list of chat rooms.');
        }
    };
    
    // 채팅방 선택 변경 처리
    const handleRoomSelectChange = async function() {
        if (!APP.elements.roomSelect) return;
        
        const roomId = APP.elements.roomSelect.value;
        
        if (!roomId) return;
        
        try {
            // 선택한 채팅방 정보 가져오기
            const room = await dbService.getChatRoomById(roomId);
            
            // 비공개 채팅방이면 접근 코드 필드 표시
            if (room.is_private) {
                if (APP.elements.privateRoomCode) {
                    APP.elements.privateRoomCode.classList.remove('hidden');
                }
            } else {
                if (APP.elements.privateRoomCode) {
                    APP.elements.privateRoomCode.classList.add('hidden');
                }
                if (APP.elements.accessCode) {
                    APP.elements.accessCode.value = '';
                }
            }
        } catch (error) {
            console.error('채팅방 정보 조회 실패:', error);
        }
    };
    
    // 채팅방 입장
    const enterChat = async function(roomId) {
        try {
            // 로딩 표시
            APP.ui.showLoading(true);
            
            // 채팅방 정보 가져오기
            const room = await dbService.getChatRoomById(roomId);
            APP.state.currentRoom = room;
            APP.state.currentRoomId = roomId;
            
            // 채팅방 이름 표시
            if (APP.elements.roomName) {
                APP.elements.roomName.textContent = room.name;
            }
            
            // 채팅방 입장 및 메시지 로드
            await chatService.joinRoom(roomId);
            
            // 사용자 언어 표시
            APP.i18n.updateLanguageDisplay();
            
            // 사용자 목록 로드 및 정기 업데이트 설정
            await APP.users.loadUserList();
            
            // 사용자 목록 정기 업데이트 타이머
            if (APP.performance.userListUpdateTimer) {
                clearInterval(APP.performance.userListUpdateTimer);
            }
            
            APP.performance.userListUpdateTimer = setInterval(
                APP.users.loadUserList, 
                APP.performance.userListUpdateInterval
            );
            
            // 채팅 화면으로 전환
            APP.ui.showChatScreen();
            
            // 메시지 컨테이너 스크롤 최하단으로 이동
            APP.ui.scrollToBottom();
            
            // 로딩 종료
            APP.ui.showLoading(false);
            
            // 입력 필드에 포커스
            setTimeout(() => {
                if (APP.elements.messageInput) {
                    APP.elements.messageInput.focus();
                }
            }, 300);
        } catch (error) {
            console.error('채팅방 입장 실패:', error);
            APP.ui.showError(APP.i18n.translate('error.enterRoom') || 'Failed to enter the chat room.');
            APP.ui.showLoading(false);
        }
    };
    
    // 공개 API
    return {
        loadChatRooms,
        handleRoomSelectChange,
        enterChat
    };
})();
