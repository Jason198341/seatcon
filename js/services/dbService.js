/**
 * dbService.js
 * Supabase 데이터베이스 연결 및 데이터 처리를 담당하는 서비스
 */

// Supabase 클라이언트 인스턴스 생성
const dbService = (() => {
    let supabase;
    
    /**
     * Supabase 클라이언트 초기화
     * @returns {Object} Supabase 클라이언트 인스턴스
     */
    const initializeClient = () => {
        if (!supabase) {
            try {
                // config.js에서 API 키 가져오기
                const SUPABASE_URL = CONFIG.SUPABASE_URL;
                const SUPABASE_KEY = CONFIG.SUPABASE_KEY;
                
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                console.log('Supabase 클라이언트 초기화 완료');
            } catch (error) {
                console.error('Supabase 클라이언트 초기화 실패:', error);
                throw new Error('데이터베이스 연결에 실패했습니다');
            }
        }
        return supabase;
    };

    /**
     * 연결 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     */
    const testConnection = async () => {
        try {
            const client = initializeClient();
            const { data, error } = await client.from('chatrooms').select('id').limit(1);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error('데이터베이스 연결 테스트 실패:', error);
            return false;
        }
    };

    /**
     * 채팅방 목록 가져오기
     * @param {boolean} activeOnly - 활성화된 채팅방만 가져올지 여부
     * @returns {Promise<Array>} 채팅방 목록
     */
    const getChatRooms = async (activeOnly = false) => {
        try {
            const client = initializeClient();
            let query = client.from('chatrooms').select('*').order('sort_order', { ascending: true });
            
            if (activeOnly) {
                query = query.eq('is_active', true);
            }
            
            const { data, error } = await query;
            
            if (error) {
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error('채팅방 목록 조회 실패:', error);
            throw new Error('채팅방 목록을 불러오는데 실패했습니다');
        }
    };

    /**
     * 채팅방 상세 정보 가져오기
     * @param {string} roomId - 채팅방 ID
     * @returns {Promise<Object>} 채팅방 정보
     */
    const getChatRoomById = async (roomId) => {
        try {
            const client = initializeClient();
            const { data, error } = await client
                .from('chatrooms')
                .select('*')
                .eq('id', roomId)
                .single();
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error(`채팅방 상세 정보 조회 실패 (ID: ${roomId}):`, error);
            throw new Error('채팅방 정보를 불러오는데 실패했습니다');
        }
    };

    /**
     * 채팅방 생성
     * @param {Object} roomData - 채팅방 데이터
     * @returns {Promise<Object>} 생성된 채팅방 정보
     */
    const createChatRoom = async (roomData) => {
        try {
            const client = initializeClient();
            const { data, error } = await client
                .from('chatrooms')
                .insert([roomData])
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
            throw new Error('채팅방 생성에 실패했습니다');
        }
    };

    /**
     * 채팅방 수정
     * @param {string} roomId - 채팅방 ID
     * @param {Object} roomData - 업데이트할 채팅방 데이터
     * @returns {Promise<Object>} 수정된 채팅방 정보
     */
    const updateChatRoom = async (roomId, roomData) => {
        try {
            const client = initializeClient();
            const { data, error } = await client
                .from('chatrooms')
                .update(roomData)
                .eq('id', roomId)
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error(`채팅방 수정 실패 (ID: ${roomId}):`, error);
            throw new Error('채팅방 수정에 실패했습니다');
        }
    };

    /**
     * 채팅방 삭제
     * @param {string} roomId - 채팅방 ID
     * @returns {Promise<boolean>} 삭제 성공 여부
     */
    const deleteChatRoom = async (roomId) => {
        try {
            const client = initializeClient();
            const { error } = await client
                .from('chatrooms')
                .delete()
                .eq('id', roomId);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`채팅방 삭제 실패 (ID: ${roomId}):`, error);
            throw new Error('채팅방 삭제에 실패했습니다');
        }
    };

    /**
     * 채팅방 메시지 가져오기
     * @param {string} roomId - 채팅방 ID
     * @param {number} limit - 가져올 메시지 수 (기본값 50)
     * @param {number} offset - 오프셋 (기본값 0)
     * @returns {Promise<Array>} 메시지 목록
     */
    const getMessages = async (roomId, limit = 50, offset = 0) => {
        try {
            const client = initializeClient();
            const { data, error } = await client
                .from('messages')
                .select('*')
                .eq('chatroom_id', roomId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (error) {
                throw error;
            }
            
            // 시간 순서대로 정렬하여 반환
            return (data || []).reverse();
        } catch (error) {
            console.error(`메시지 목록 조회 실패 (채팅방 ID: ${roomId}):`, error);
            throw new Error('메시지 목록을 불러오는데 실패했습니다');
        }
    };

    /**
     * 메시지 작성 (전송)
     * @param {Object} messageData - 메시지 데이터
     * @returns {Promise<Object>} 저장된 메시지 정보
     */
    const sendMessage = async (messageData) => {
        try {
            const client = initializeClient();
            const { data, error } = await client
                .from('messages')
                .insert([messageData])
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            throw new Error('메시지 전송에 실패했습니다');
        }
    };

    /**
     * 마지막 메시지 ID 이후의 새 메시지 가져오기
     * @param {string} roomId - 채팅방 ID
     * @param {string} lastMessageId - 마지막 메시지 ID
     * @returns {Promise<Array>} 새 메시지 목록
     */
    const getNewMessages = async (roomId, lastMessageId) => {
        try {
            const client = initializeClient();
            
            // 마지막 메시지의 생성 시간 조회
            const { data: lastMessage, error: lastMessageError } = await client
                .from('messages')
                .select('created_at')
                .eq('id', lastMessageId)
                .single();
            
            if (lastMessageError) {
                throw lastMessageError;
            }
            
            // 마지막 메시지 이후의 메시지 조회
            const { data, error } = await client
                .from('messages')
                .select('*')
                .eq('chatroom_id', roomId)
                .gt('created_at', lastMessage.created_at)
                .order('created_at', { ascending: true });
            
            if (error) {
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error(`새 메시지 조회 실패 (채팅방 ID: ${roomId}, 마지막 메시지 ID: ${lastMessageId}):`, error);
            throw new Error('새 메시지를 불러오는데 실패했습니다');
        }
    };

    /**
     * 사용자 정보 저장/업데이트
     * @param {Object} userData - 사용자 데이터
     * @returns {Promise<Object>} 사용자 정보
     */
    const saveUser = async (userData) => {
        try {
            const client = initializeClient();
            
            // 사용자 존재 여부 확인
            const { data: existingUser, error: checkError } = await client
                .from('users')
                .select('*')
                .eq('id', userData.id)
                .maybeSingle();
            
            let result;
            
            if (existingUser) {
                // 기존 사용자 업데이트
                const { data, error } = await client
                    .from('users')
                    .update({
                        username: userData.username,
                        preferred_language: userData.preferred_language,
                        room_id: userData.room_id,
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', userData.id)
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            } else {
                // 새 사용자 생성
                const { data, error } = await client
                    .from('users')
                    .insert([{
                        ...userData,
                        role: userData.role || 'user',
                        last_activity: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }
            
            return result;
        } catch (error) {
            console.error(`사용자 정보 저장 실패 (ID: ${userData.id}):`, error);
            throw new Error('사용자 정보 저장에 실패했습니다');
        }
    };

    /**
     * 사용자 목록 가져오기
     * @param {Object} options - 검색 옵션
     * @returns {Promise<Array>} 사용자 목록
     */
    const getUsers = async (options = {}) => {
        try {
            const client = initializeClient();
            let query = client.from('users').select('*');
            
            // 특정 채팅방 사용자만 조회
            if (options.roomId) {
                query = query.eq('room_id', options.roomId);
            }
            
            // 활성 사용자만 조회 (최근 5분 이내 활동)
            if (options.activeOnly) {
                const fiveMinutesAgo = new Date();
                fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                query = query.gt('last_activity', fiveMinutesAgo.toISOString());
            }
            
            // 사용자명으로 검색
            if (options.searchTerm) {
                query = query.ilike('username', `%${options.searchTerm}%`);
            }
            
            // 정렬 및 페이징
            query = query.order('last_activity', { ascending: false });
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            
            if (error) {
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error('사용자 목록 조회 실패:', error);
            throw new Error('사용자 목록을 불러오는데 실패했습니다');
        }
    };

    /**
     * 사용자 활동 시간 업데이트
     * @param {string} userId - 사용자 ID
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    const updateUserActivity = async (userId) => {
        try {
            const client = initializeClient();
            const { error } = await client
                .from('users')
                .update({ last_activity: new Date().toISOString() })
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`사용자 활동 시간 업데이트 실패 (ID: ${userId}):`, error);
            return false;
        }
    };

    /**
     * 관리자 인증
     * @param {string} adminId - 관리자 ID
     * @param {string} password - 비밀번호
     * @returns {Promise<boolean>} 인증 성공 여부
     */
    const authenticateAdmin = async (adminId, password) => {
        // config.js에서 관리자 계정 정보 가져오기
        return adminId === CONFIG.ADMIN_ID && password === CONFIG.ADMIN_PASSWORD;
    };

    /**
     * 통계 정보 가져오기
     * @returns {Promise<Object>} 통계 정보
     */
    const getStatistics = async () => {
        try {
            const client = initializeClient();
            
            // 총 사용자 수
            const { data: users, error: usersError } = await client
                .from('users')
                .select('id');
            
            if (usersError) throw usersError;
            
            // 활성 사용자 수 (최근 5분 이내 활동)
            const fiveMinutesAgo = new Date();
            fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
            const { data: activeUsers, error: activeUsersError } = await client
                .from('users')
                .select('id')
                .gt('last_activity', fiveMinutesAgo.toISOString());
            
            if (activeUsersError) throw activeUsersError;
            
            // 총 채팅방 수
            const { data: rooms, error: roomsError } = await client
                .from('chatrooms')
                .select('id');
            
            if (roomsError) throw roomsError;
            
            // 활성 채팅방 수
            const { data: activeRooms, error: activeRoomsError } = await client
                .from('chatrooms')
                .select('id')
                .eq('is_active', true);
            
            if (activeRoomsError) throw activeRoomsError;
            
            // 총 메시지 수
            const { data: messages, error: messagesError } = await client
                .from('messages')
                .select('id');
            
            if (messagesError) throw messagesError;
            
            // 오늘 메시지 수
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: todayMessages, error: todayMessagesError } = await client
                .from('messages')
                .select('id')
                .gt('created_at', today.toISOString());
            
            if (todayMessagesError) throw todayMessagesError;
            
            return {
                users: {
                    total: users.length,
                    active: activeUsers.length
                },
                rooms: {
                    total: rooms.length,
                    active: activeRooms.length
                },
                messages: {
                    total: messages.length,
                    today: todayMessages.length
                }
            };
        } catch (error) {
            console.error('통계 정보 조회 실패:', error);
            throw new Error('통계 정보를 불러오는데 실패했습니다');
        }
    };

    // 공개 API
    return {
        initializeClient,
        testConnection,
        getChatRooms,
        getChatRoomById,
        createChatRoom,
        updateChatRoom,
        deleteChatRoom,
        getMessages,
        sendMessage,
        getNewMessages,
        saveUser,
        getUsers,
        updateUserActivity,
        authenticateAdmin,
        getStatistics
    };
})();