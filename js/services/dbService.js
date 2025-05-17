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
                if (!window.CONFIG || !window.CONFIG.SUPABASE_URL || !window.CONFIG.SUPABASE_KEY) {
                    console.error('CONFIG 객체 또는 Supabase 설정이 없습니다');
                    // 백업 설정 사용
                    const SUPABASE_URL = 'https://dolywnpcrutdxuxkozae.supabase.co';
                    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8';
                    
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                } else {
                    const SUPABASE_URL = window.CONFIG.SUPABASE_URL;
                    const SUPABASE_KEY = window.CONFIG.SUPABASE_KEY;
                    
                    // 헤더 옵션 추가
                    const options = {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: true
                        },
                        global: {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        },
                        realtime: {
                            params: {
                                eventsPerSecond: 10
                            }
                        }
                    };
                    
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, options);
                }
                
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

            // 가능한 추가 헤더
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'apikey': window.CONFIG ? window.CONFIG.SUPABASE_KEY : '',
                'Authorization': `Bearer ${window.CONFIG ? window.CONFIG.SUPABASE_KEY : ''}`
            };

            // 직접 API 호출을 통한 조회 시도 (supabase 클라이언트 문제 회피)
            const supabaseUrl = window.CONFIG ? window.CONFIG.SUPABASE_URL : 'https://dolywnpcrutdxuxkozae.supabase.co';
            const response = await fetch(`${supabaseUrl}/rest/v1/chatrooms?select=*&order=sort_order.asc${activeOnly ? '&is_active=eq.true' : ''}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`API 오류: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('채팅방 목록 조회 실패:', error);
            
            // 오류 내용 자세히 기록
            if (error.response) {
                console.error('Response:', error.response);
            }
            
            // 백업 방법: 로컬 저장소에서 이전에 저장한 채팅방 정보가 있는지 확인
            try {
                const savedRooms = localStorage.getItem('chatrooms');
                if (savedRooms) {
                    return JSON.parse(savedRooms);
                }
            } catch (e) {
                console.warn('저장된 채팅방 가져오기 실패:', e);
            }
            
            // 백업용 채팅방 데이터
            return [
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
        }
    };

    /**
     * 채팅방 상세 정보 가져오기
     * @param {string} roomId - 채팅방 ID
     * @returns {Promise<Object>} 채팅방 정보
     */
    const getChatRoomById = async (roomId) => {
        try {
            // 직접 REST API 사용
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'apikey': window.CONFIG ? window.CONFIG.SUPABASE_KEY : '',
                'Authorization': `Bearer ${window.CONFIG ? window.CONFIG.SUPABASE_KEY : ''}`
            };

            const supabaseUrl = window.CONFIG ? window.CONFIG.SUPABASE_URL : 'https://dolywnpcrutdxuxkozae.supabase.co';
            const response = await fetch(`${supabaseUrl}/rest/v1/chatrooms?id=eq.${roomId}&limit=1`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error(`채팅방 조회 API 오류: ${response.status} ${response.statusText}`);
                throw new Error(`채팅방 조회 API 오류: ${response.status}`);
            }

            // API에서 배열로 응답하므로 첫 번째 항목 처리
            const data = await response.json();
            if (data && data.length > 0) {
                // 성공적으로 채팅방을 가져왔을 때 로컬 저장소에 백업
                try {
                    // 기존 채팅방 목록 가져오기 및 추가/업데이트
                    const savedRooms = localStorage.getItem('chatrooms');
                    const rooms = savedRooms ? JSON.parse(savedRooms) : [];
                    
                    // 현재 채팅방이 목록에 있는지 확인
                    const exists = rooms.findIndex(room => room.id === data[0].id) >= 0;
                    
                    if (!exists) {
                        rooms.push(data[0]);
                        localStorage.setItem('chatrooms', JSON.stringify(rooms));
                    }
                } catch (e) {
                    console.warn('채팅방 백업 실패:', e);
                }
                
                return data[0];
            }
            
            // 응답은 성공했지만 채팅방이 없는 경우
            throw new Error('채팅방을 찾을 수 없습니다');
            
        } catch (error) {
            console.error(`채팅방 상세 정보 조회 실패 (ID: ${roomId}):`, error);
            
            // 로컬 저장소에서 해당 채팅방 찾기 시도
            try {
                const savedRooms = localStorage.getItem('chatrooms');
                if (savedRooms) {
                    const rooms = JSON.parse(savedRooms);
                    const room = rooms.find(r => r.id === roomId);
                    if (room) {
                        return room;
                    }
                }
            } catch (e) {
                console.warn('저장된 채팅방 정보 가져오기 실패:', e);
            }
            
            // roomId에 따라 기본 채팅방 반환
            if (roomId === 'general' || !roomId) {
                return {
                    id: 'general',
                    name: '일반 채팅',
                    description: '모든 참가자를 위한 공개 채팅방',
                    is_private: false,
                    is_active: true,
                    max_users: 100,
                    sort_order: 0,
                    created_at: new Date().toISOString(),
                    created_by: 'system'
                };
            } else if (roomId === 'korean') {
                return {
                    id: 'korean',
                    name: '한국어 채팅',
                    description: '한국어 사용자를 위한 채팅방',
                    is_private: false,
                    is_active: true,
                    max_users: 50,
                    sort_order: 1,
                    created_at: new Date().toISOString(),
                    created_by: 'system'
                };
            } else if (roomId === 'english') {
                return {
                    id: 'english',
                    name: 'English Chat',
                    description: 'Chat room for English speaking users',
                    is_private: false,
                    is_active: true,
                    max_users: 50,
                    sort_order: 2,
                    created_at: new Date().toISOString(),
                    created_by: 'system'
                };
            } else if (roomId === 'vip') {
                return {
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
                };
            } else {
                // 임의의 roomId에 대한 기본 채팅방
                return {
                    id: roomId,
                    name: 'Chat Room',
                    description: 'Conference chat room',
                    is_private: false,
                    is_active: true,
                    max_users: 100,
                    sort_order: 0,
                    created_at: new Date().toISOString(),
                    created_by: 'system'
                };
            }
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
            
            // 관리자 세션 설정 (임시 방편)
            // 실제 프로덕션 환경에서는 제대로 된 인증 시스템을 사용해야 함
            const adminId = window.CONFIG ? window.CONFIG.ADMIN_ID : 'kcmmer';
            
            // 임시 방편: RLS 정책 우회를 위한 특별 헤더 추가
            const { data, error } = await client
                .from('chatrooms')
                .insert([{
                    ...roomData,
                    // 생성자 ID가 없는 경우 기본값 설정
                    created_by: roomData.created_by || adminId
                }])
                .select()
                .single();
            
            if (error) {
                console.error('채팅방 생성 오류 상세:', error);
                
                // Bypass RLS 문제를 위한 직접 SQL 실행 (임시 방편)
                // 이 방식은 실제 프로덕션 환경에서는 권장되지 않음
                if (error.code === '42501') { // 권한 오류
                    try {
                        // 직접 SQL 실행 시도
                        // 주의: 이 방식은 보안 위험이 있으므로 실제 프로덕션에서 사용하지 말 것
                        const insertResult = await client.rpc('admin_create_chatroom', {
                            room_name: roomData.name,
                            room_description: roomData.description || '',
                            room_max_users: roomData.max_users || 100,
                            room_sort_order: roomData.sort_order || 0,
                            room_is_active: roomData.is_active !== undefined ? roomData.is_active : true,
                            room_is_private: roomData.is_private !== undefined ? roomData.is_private : false,
                            room_access_code: roomData.access_code || null,
                            room_created_by: roomData.created_by || adminId
                        });
                        
                        if (insertResult.error) {
                            throw insertResult.error;
                        }
                        
                        return insertResult.data;
                    } catch (rpcError) {
                        console.error('관리자 RPC 호출 실패:', rpcError);
                        throw new Error('채팅방 생성 권한이 없습니다. 관리자에게 문의하세요.');
                    }
                }
                
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
            
            // 일반적인 방식으로 업데이트 시도
            const { data, error } = await client
                .from('chatrooms')
                .update(roomData)
                .eq('id', roomId)
                .select()
                .single();
            
            if (error) {
                console.error(`채팅방 수정 오류 (ID: ${roomId}):`, error);
                
                // Bypass RLS 문제를 위한 직접 SQL 실행 (임시 방편)
                if (error.code === '42501') { // 권한 오류
                    try {
                        // 직접 SQL 실행 시도
                        const updateResult = await client.rpc('admin_update_chatroom', {
                            room_id: roomId,
                            room_name: roomData.name,
                            room_description: roomData.description || '',
                            room_max_users: roomData.max_users || 100,
                            room_sort_order: roomData.sort_order || 0,
                            room_is_active: roomData.is_active !== undefined ? roomData.is_active : true,
                            room_is_private: roomData.is_private !== undefined ? roomData.is_private : false,
                            room_access_code: roomData.access_code || null
                        });
                        
                        if (updateResult.error) {
                            throw updateResult.error;
                        }
                        
                        return updateResult.data;
                    } catch (rpcError) {
                        console.error('관리자 RPC 호출 실패:', rpcError);
                        throw new Error('채팅방 수정 권한이 없습니다. 관리자에게 문의하세요.');
                    }
                }
                
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
            
            // 일반적인 방식으로 삭제 시도
            const { error } = await client
                .from('chatrooms')
                .delete()
                .eq('id', roomId);
            
            if (error) {
                console.error(`채팅방 삭제 오류 (ID: ${roomId}):`, error);
                
                // Bypass RLS 문제를 위한 직접 SQL 실행 (임시 방편)
                if (error.code === '42501') { // 권한 오류
                    try {
                        // 직접 SQL 실행 시도
                        const deleteResult = await client.rpc('admin_delete_chatroom', {
                            room_id: roomId
                        });
                        
                        if (deleteResult.error) {
                            throw deleteResult.error;
                        }
                        
                        return true;
                    } catch (rpcError) {
                        console.error('관리자 RPC 호출 실패:', rpcError);
                        throw new Error('채팅방 삭제 권한이 없습니다. 관리자에게 문의하세요.');
                    }
                }
                
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`채팅방 삭제 실패 (ID: ${roomId}):`, error);
            throw new Error('채팅방 삭제에 실패했습니다');
        }
    };

    /**
     * 관리자 인증
     * @param {string} adminId - 관리자 ID
     * @param {string} password - 비밀번호
     * @returns {Promise<boolean>} 인증 성공 여부
     */
    const authenticateAdmin = async (adminId, password) => {
        console.log('관리자 인증 함수 호출:', adminId);
        
        // 간단하게 하드코딩한 값으로 직접 비교
        const isValid = (adminId === 'kcmmer' && password === 'rnrud9881@@HH');
        
        console.log('인증 결과:', isValid);
        
        if (isValid) {
            // 인증 성공 시 관리자 정보 저장
            localStorage.setItem('admin_session', JSON.stringify({
                id: adminId,
                role: 'admin',
                timestamp: new Date().getTime()
            }));
        }
        
        return isValid;
    };

    /**
     * 메시지 가져오기
     * @param {string} roomId - 채팅방 ID
     * @param {number} limit - 가져올 메시지 수 (기본값 30)
     * @param {number} offset - 오프셋 (기본값 0)
     * @returns {Promise<Array>} 메시지 목록
     */
    const getMessages = async (roomId, limit = 100, offset = 0) => {
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
     * 사용자 정보 저장/업데이트
     * @param {Object} userData - 사용자 데이터
     * @returns {Promise<Object>} 사용자 정보
     */
    const saveUser = async (userData) => {
        try {
            const client = initializeClient();
            
            // 사용자 ID 정제 (중요 - 406 오류 수정)
            let userId = userData.id;
            // 사용자 ID 길이 제한 (30자 이내로)
            if (userId.length > 30) {
                userId = userId.substring(0, 30);
            }
            
            // 영문자, 숫자, 하이픈만 허용하도록 정제
            userId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
            
            // 사용자 존재 여부 확인
            const { data: existingUser, error: checkError } = await client
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (checkError) {
                console.warn(`사용자 확인 중 오류 발생 (ID: ${userId}):`, checkError);
            }
            
            let result;
            
            if (existingUser) {
                // 기존 사용자 업데이트
                const updateData = {
                    username: userData.username,
                    preferred_language: userData.preferred_language,
                    last_activity: new Date().toISOString()
                };
                
                // room_id가 있는 경우에만 추가
                if (userData.room_id !== undefined) {
                    updateData.room_id = userData.room_id;
                }
                
                const { data, error } = await client
                    .from('users')
                    .update(updateData)
                    .eq('id', userId)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Update user error:', error);
                    throw error;
                }
                result = data;
            } else {
                // 새 사용자 생성
                const insertData = {
                    id: userId,
                    username: userData.username,
                    preferred_language: userData.preferred_language || 'en',
                    role: userData.role || 'user',
                    last_activity: new Date().toISOString()
                };
                
                // room_id가 있는 경우에만 추가
                if (userData.room_id) {
                    insertData.room_id = userData.room_id;
                }
                
                const { data, error } = await client
                    .from('users')
                    .insert([insertData])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Insert user error:', error);
                    throw error;
                }
                result = data;
            }
            
            return result;
        } catch (error) {
            console.error(`사용자 정보 저장 실패 (ID: ${userData.id}):`, error);
            // 오류 상세 정보 추가
            if (error.message) {
                throw new Error(`사용자 정보 저장 실패: ${error.message}`);
            } else {
                throw new Error('사용자 정보 저장에 실패했습니다');
            }
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
            let query = client.from('users').select('id,username,preferred_language,room_id,role,last_activity');
            
            // 특정 채팅방 사용자만 조회
            if (options.roomId) {
                query = query.eq('room_id', options.roomId);
            }
            
            // 특정 사용자 ID로 조회
            if (options.userId) {
                query = query.eq('id', options.userId);
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
            // 사용자 ID 정제 (중요)
            let cleanUserId = userId;
            if (cleanUserId.length > 30) {
                cleanUserId = cleanUserId.substring(0, 30);
            }
            cleanUserId = cleanUserId.replace(/[^a-zA-Z0-9-_]/g, '');
            
            const { error } = await client
                .from('users')
                .update({ last_activity: new Date().toISOString() })
                .eq('id', cleanUserId);
            
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
        saveUser,
        getUsers,
        updateUserActivity,
        authenticateAdmin,
        getStatistics
    };
})();
