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
            // 로딩 표시 (선택 사항)
            if (APP.ui && APP.ui.showLoginError) {
                APP.ui.showLoginError(APP.i18n && APP.i18n.translate ? 
                    APP.i18n.translate('login.chatroom.loading') || 'Loading...' : 'Loading...');
            }
            
            // 서비스가 준비되었는지 확인
            // 준비되지 않았더라도 계속 진행 (모바일에서는 로컬 저장소 사용)
            if (!APP.state.servicesReady && typeof dbService === 'undefined') {
                console.warn('서비스가 준비되지 않았지만 채팅방 목록 로드 시도');
                
                // 로컬 저장소에서 채팅방 가져오기 시도
                try {
                    const savedRooms = localStorage.getItem('chatrooms');
                    if (savedRooms) {
                        const rooms = JSON.parse(savedRooms);
                        updateRoomSelectOptions(rooms);
                        return;
                    }
                } catch (e) {
                    console.warn('저장된 채팅방 가져오기 실패:', e);
                }
                
                // 기본 채팅방 생성
                const defaultRooms = [
                    {
                        id: 'general',
                        name: '일반 채팅',
                        description: '모든 참가자를 위한 공개 채팅방',
                        is_private: false,
                        is_active: true,
                        max_users: 100,
                        sort_order: 0,
                        created_at: new Date().toISOString(),
                        created_by: 'system'
                    },
                    {
                        id: 'korean',
                        name: '한국어 채팅',
                        description: '한국어 사용자를 위한 채팅방',
                        is_private: false,
                        is_active: true,
                        max_users: 50,
                        sort_order: 1,
                        created_at: new Date().toISOString(),
                        created_by: 'system'
                    },
                    {
                        id: 'english',
                        name: 'English Chat',
                        description: 'Chat room for English speaking users',
                        is_private: false,
                        is_active: true,
                        max_users: 50,
                        sort_order: 2,
                        created_at: new Date().toISOString(),
                        created_by: 'system'
                    },
                    {
                        id: 'vip',
                        name: 'VIP 라운지',
                        description: 'VIP 전용 비공개 채팅방',
                        is_private: true,
                        is_active: true,
                        max_users: 20,
                        sort_order: 3,
                        created_at: new Date().toISOString(),
                        created_by: 'system',
                        access_code: 'vip2025'
                    }
                ];
                
                // 로컬 저장소에 채팅방 저장
                try {
                    localStorage.setItem('chatrooms', JSON.stringify(defaultRooms));
                } catch (e) {
                    console.warn('채팅방 저장 실패:', e);
                }
                
                updateRoomSelectOptions(defaultRooms);
                return;
            }
            
            // 활성화된 채팅방만 조회
            let rooms;
            try {
                rooms = await dbService.getChatRooms(true);
                
                // 저장소에 채팅방 백업
                try {
                    localStorage.setItem('chatrooms', JSON.stringify(rooms));
                } catch (e) {
                    console.warn('채팅방 저장 실패:', e);
                }
            } catch (error) {
                console.error('채팅방 목록 로드 실패:', error);
                
                // 로컬 저장소에서 채팅방 가져오기 시도
                try {
                    const savedRooms = localStorage.getItem('chatrooms');
                    if (savedRooms) {
                        rooms = JSON.parse(savedRooms);
                    } else {
                        // 기본 채팅방 사용
                        rooms = [
                            {
                                id: 'general',
                                name: '일반 채팅',
                                description: '모든 참가자를 위한 공개 채팅방',
                                is_private: false,
                                is_active: true,
                                max_users: 100,
                                sort_order: 0,
                                created_at: new Date().toISOString(),
                                created_by: 'system'
                            },
                            {
                                id: 'korean',
                                name: '한국어 채팅',
                                description: '한국어 사용자를 위한 채팅방',
                                is_private: false,
                                is_active: true,
                                max_users: 50,
                                sort_order: 1,
                                created_at: new Date().toISOString(),
                                created_by: 'system'
                            },
                            {
                                id: 'english',
                                name: 'English Chat',
                                description: 'Chat room for English speaking users',
                                is_private: false,
                                is_active: true,
                                max_users: 50,
                                sort_order: 2,
                                created_at: new Date().toISOString(),
                                created_by: 'system'
                            },
                            {
                                id: 'vip',
                                name: 'VIP 라운지',
                                description: 'VIP 전용 비공개 채팅방',
                                is_private: true,
                                is_active: true,
                                max_users: 20,
                                sort_order: 3,
                                created_at: new Date().toISOString(),
                                created_by: 'system',
                                access_code: 'vip2025'
                            }
                        ];
                        
                        // 로컬 저장소에 채팅방 저장
                        try {
                            localStorage.setItem('chatrooms', JSON.stringify(rooms));
                        } catch (e) {
                            console.warn('채팅방 저장 실패:', e);
                        }
                    }
                } catch (e) {
                    console.error('로컬 저장소 채팅방 가져오기 실패:', e);
                    APP.ui.showLoginError(APP.i18n.translate('error.loadRooms') || 'Failed to load the list of chat rooms.');
                    return;
                }
            }
            
            // 채팅방 선택 옵션 업데이트
            updateRoomSelectOptions(rooms);
            
        } catch (error) {
            console.error('채팅방 목록 로드 완전 실패:', error);
            if (APP.ui && APP.ui.showLoginError) {
                APP.ui.showLoginError(APP.i18n && APP.i18n.translate ? 
                    APP.i18n.translate('error.loadRooms') || 'Failed to load the list of chat rooms.' : 
                    'Failed to load the list of chat rooms.');
            }
        }
    };
    
    // 채팅방 선택 옵션 업데이트 (내부 함수)
    const updateRoomSelectOptions = function(rooms) {
        if (!APP.elements.roomSelect) return;
        
        // 채팅방이 없으면 기본 채팅방 추가
        if (!rooms || rooms.length === 0) {
            rooms = [
                {
                    id: 'general',
                    name: '일반 채팅',
                    description: '모든 참가자를 위한 공개 채팅방',
                    is_private: false,
                    is_active: true
                }
            ];
        }
        
        // 채팅방 선택 옵션 생성
        let options = `<option value="" disabled selected>${APP.i18n && APP.i18n.translate ? 
            APP.i18n.translate('login.chatroom.select') || 'Select a chat room' : 
            'Select a chat room'}</option>`;
        
        // 채팅방 정렬 (sort_order 순)
        rooms.sort((a, b) => {
            const aOrder = a.sort_order || 0;
            const bOrder = b.sort_order || 0;
            return aOrder - bOrder;
        });
        
        rooms.forEach(room => {
            options += `<option value="${room.id}">${room.name}${room.is_private ? ' 🔒' : ''}</option>`;
        });
        
        // 채팅방 선택 목록 업데이트
        APP.elements.roomSelect.innerHTML = options;
        
        // 오류 메시지 지우기
        if (APP.ui && APP.ui.showLoginError) {
            APP.ui.showLoginError('');
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
            if (APP.ui && APP.ui.showLoading) {
                APP.ui.showLoading(true);
            }
            
            // roomId가 없을 경우 기본 채팅방 ID 사용
            if (!roomId && CONFIG && CONFIG.DEFAULT_CHATROOM) {
                console.warn('채팅방 ID가 없습니다. 기본 채팅방을 사용합니다.');
                roomId = CONFIG.DEFAULT_CHATROOM.id;
            }
            
            // 채팅방 정보 가져오기
            let room;
            try {
                room = await dbService.getChatRoomById(roomId);
            } catch (error) {
                // 채팅방 정보 조회 실패시 기본 채팅방 사용
                console.warn('채팅방 정보 조회 오류:', error);
                room = CONFIG.DEFAULT_CHATROOM;
                room.id = roomId;
            }
            
            APP.state.currentRoom = room;
            APP.state.currentRoomId = roomId;
            
            // 채팅방 이름 표시
            if (APP.elements.roomName) {
                APP.elements.roomName.textContent = room.name || 'Chat Room';
            }
            
            // 채팅방 입장 및 메시지 로드
            if (typeof chatService !== 'undefined' && chatService.joinRoom) {
                await chatService.joinRoom(roomId);
            } else {
                console.warn('chatService가 정의되지 않았거나 joinRoom 함수가 없습니다.');
            }
            
            // 사용자 언어 표시
            if (APP.i18n && APP.i18n.updateLanguageDisplay) {
                APP.i18n.updateLanguageDisplay();
            }
            
            // 사용자 목록 로드 및 정기 업데이트 설정
            if (APP.users && APP.users.loadUserList) {
                try {
                    await APP.users.loadUserList();
                } catch (e) {
                    console.warn('사용자 목록 로드 실패:', e);
                }
                
                // 사용자 목록 정기 업데이트 타이머
                if (APP.performance.userListUpdateTimer) {
                    clearInterval(APP.performance.userListUpdateTimer);
                }
                
                if (APP.performance && APP.performance.userListUpdateInterval) {
                    APP.performance.userListUpdateTimer = setInterval(
                        APP.users.loadUserList, 
                        APP.performance.userListUpdateInterval
                    );
                }
            }
            
            // 채팅 화면으로 전환
            if (APP.ui && APP.ui.showChatScreen) {
                APP.ui.showChatScreen();
            }
            
            // 메시지 컨테이너 스크롤 최하단으로 이동
            if (APP.ui && APP.ui.scrollToBottom) {
                APP.ui.scrollToBottom();
            }
            
            // 로딩 종료
            if (APP.ui && APP.ui.showLoading) {
                APP.ui.showLoading(false);
            }
            
            // 입력 필드에 포커스
            setTimeout(() => {
                if (APP.elements.messageInput) {
                    APP.elements.messageInput.focus();
                }
            }, 300);
        } catch (error) {
            console.error('채팅방 입장 실패:', error);
            if (APP.ui && APP.ui.showError) {
                APP.ui.showError(APP.i18n && APP.i18n.translate ? 
                    APP.i18n.translate('error.enterRoom') : 'Failed to enter the chat room.');
            } else {
                alert('채팅방 입장에 실패했습니다.');
            }
            
            if (APP.ui && APP.ui.showLoading) {
                APP.ui.showLoading(false);
            }
            
            // 오류 발생 시 로그인 화면으로 전환
            if (APP.ui && APP.ui.showLoginScreen) {
                APP.ui.showLoginScreen();
            }
        }
    };
    
    // 공개 API
    return {
        loadChatRooms,
        handleRoomSelectChange,
        enterChat
    };
})();
