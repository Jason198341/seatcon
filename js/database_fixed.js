/**
 * 데이터베이스 서비스
 * 
 * Supabase를 사용하여 실시간 데이터 동기화 및 사용자 관리 기능을 제공합니다.
 */
class DatabaseService {
    constructor() {
        this.supabaseUrl = 'https://veudhigojdukbqfgjeyh.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao';
        this.roomId = 'conference-chat-room';
        this.currentUser = null;
        this.messageSubscription = null;
        this.presenceSubscription = null;
        this.broadcastChannel = null;
        this.messageQueue = [];
        this.onlineUsers = new Map();
        this.connectionStatus = 'connected';
        
        this.init();
    }
    
    /**
     * Supabase 클라이언트를 초기화합니다.
     */
    init() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase 라이브러리를 로드하지 못했습니다.');
            alert('Supabase 라이브러리를 로드할 수 없습니다. 페이지를 새로고침하세요.');
            return;
        }
        
        try {
            this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase 클라이언트 초기화 완료');
            
            // 초기화 후 테이블 생성 시도
            this.createTables().then(() => {
                console.log('데이터베이스 테이블 설정 완료');
            }).catch(error => {
                console.error('데이터베이스 테이블 설정 실패:', error);
            });
            
            // 저장된 사용자 확인
            const savedUser = this.getSavedUserInfo();
            if (savedUser) {
                this.currentUser = savedUser;
            }
            
            // 저장된 메시지 큐 불러오기
            this.loadMessageQueue();
            
            // 인터넷 연결 상태 모니터링
            this.setupConnectionMonitoring();
        } catch (error) {
            console.error('Supabase 클라이언트 초기화 실패:', error);
            alert('채팅 서비스 연결에 실패했습니다. 페이지를 새로고침하세요.');
        }
    }
    
    /**
     * 인터넷 연결 상태를 모니터링합니다.
     */
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            console.log('인터넷 연결 복원됨');
            this.connectionStatus = 'connected';
            
            // 연결 상태 업데이트
            if (window.connectionStatusIndicator) {
                connectionStatusIndicator.updateStatus('connected');
            }
            
            // 연결이 복원되면 메시지 큐 처리
            this.processMessageQueue();
            
            // 메시지 구독 재설정
            if (this.currentUser && window.app) {
                this.subscribeToMessages(window.app.handleNewMessage.bind(window.app));
                this.setupBroadcastChannel();
            }
        });
        
        window.addEventListener('offline', () => {
            console.log('인터넷 연결 끊김');
            this.connectionStatus = 'disconnected';
            
            // 연결 상태 업데이트
            if (window.connectionStatusIndicator) {
                connectionStatusIndicator.updateStatus('disconnected');
            }
            
            // 구독 해제 (재연결 시 재구독)
            this.unsubscribeAll();
        });
    }
    
    /**
     * 데이터베이스 테이블을 생성합니다.
     */
    async createTables() {
        // 먼저 테이블을 수동으로 생성해봅니다
        try {
            // 실행할 SQL 쿼리 (테이블 생성)
            const createTablesSQL = `
                -- uuid 확장 활성화
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

                -- 메시지 테이블 생성
                CREATE TABLE IF NOT EXISTS messages (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    room_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    content TEXT NOT NULL,
                    language TEXT NOT NULL,
                    is_moderator BOOLEAN DEFAULT FALSE,
                    is_announcement BOOLEAN DEFAULT FALSE,
                    client_id TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- 강퇴된 사용자 테이블 생성
                CREATE TABLE IF NOT EXISTS kicked_users (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    room_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    kicked_by TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE (room_id, user_id)
                );

                -- 인덱스 생성
                CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
                CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
                CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
            `;
            
            // SQL 직접 실행 시도
            const { error } = await this.client.rpc('exec_sql', { sql: createTablesSQL });
            
            if (error) {
                console.warn('SQL 직접 실행 실패(정상적인 상황일 수 있음):', error);
                // 테이블이 이미 존재하는지 확인
                return this.checkTables();
            }
            
            console.log('테이블 생성 SQL 실행 성공');
            return true;
            
        } catch (error) {
            console.error('테이블 생성 시도 실패:', error);
            // 테이블이 이미 존재하는지 확인
            return this.checkTables();
        }
    }
    
    /**
     * 테이블이 존재하는지 확인합니다.
     */
    async checkTables() {
        try {
            // messages 테이블 확인
            const { data: messagesData, error: messagesError } = await this.client
                .from('messages')
                .select('id')
                .limit(1);
            
            if (messagesError) {
                console.error('메시지 테이블 확인 실패:', messagesError);
                // 테이블이 없으면 직접 insert 시도 (Supabase가 자동으로 테이블 생성)
                await this.tryCreateTableWithInsert();
                return false;
            }
            
            // kicked_users 테이블 확인
            const { data: kickedData, error: kickedError } = await this.client
                .from('kicked_users')
                .select('id')
                .limit(1);
            
            if (kickedError) {
                console.error('강퇴 테이블 확인 실패:', kickedError);
                // 테이블이 없으면 직접 insert 시도
                await this.tryCreateKickedTableWithInsert();
                return false;
            }
            
            console.log('테이블이 모두 존재합니다');
            return true;
        } catch (error) {
            console.error('테이블 확인 중 오류:', error);
            return false;
        }
    }
    
    /**
     * Insert 명령으로 테이블 생성을 시도합니다.
     */
    async tryCreateTableWithInsert() {
        try {
            const { error } = await this.client
                .from('messages')
                .insert({
                    room_id: 'setup',
                    user_id: 'system',
                    user_name: 'System',
                    content: '테이블 설정 메시지',
                    language: 'ko',
                    is_moderator: true,
                    is_announcement: true,
                    client_id: 'setup'
                });
            
            if (error) {
                console.error('Insert로 메시지 테이블 생성 실패:', error);
                return false;
            }
            
            console.log('Insert로 메시지 테이블 생성 성공');
            return true;
        } catch (error) {
            console.error('Insert로 테이블 생성 시도 중 오류:', error);
            return false;
        }
    }
    
    /**
     * Insert 명령으로 강퇴 테이블 생성을 시도합니다.
     */
    async tryCreateKickedTableWithInsert() {
        try {
            const { error } = await this.client
                .from('kicked_users')
                .insert({
                    room_id: 'setup',
                    user_id: 'system',
                    kicked_by: 'system'
                });
            
            if (error) {
                console.error('Insert로 강퇴 테이블 생성 실패:', error);
                return false;
            }
            
            console.log('Insert로 강퇴 테이블 생성 성공');
            return true;
        } catch (error) {
            console.error('Insert로 강퇴 테이블 생성 시도 중 오류:', error);
            return false;
        }
    }
    
    /**
     * 로컬 스토리지에서 사용자 정보를 가져옵니다.
     */
    getSavedUserInfo() {
        try {
            const userInfo = localStorage.getItem('conferenceUserInfo');
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            console.error('사용자 정보 로드 실패:', error);
            return null;
        }
    }
    
    /**
     * 사용자 정보를 로컬 스토리지에 저장합니다.
     */
    saveUserInfo(userInfo) {
        try {
            this.currentUser = userInfo;
            localStorage.setItem('conferenceUserInfo', JSON.stringify(userInfo));
        } catch (error) {
            console.error('사용자 정보 저장 실패:', error);
        }
    }
    
    /**
     * 사용자 정보를 제거합니다.
     */
    clearUserInfo() {
        this.currentUser = null;
        localStorage.removeItem('conferenceUserInfo');
    }
    
    /**
     * 메시지 큐를 로컬 스토리지에서 불러옵니다.
     */
    loadMessageQueue() {
        try {
            const queueData = localStorage.getItem('messageQueue');
            this.messageQueue = queueData ? JSON.parse(queueData) : [];
            
            if (this.messageQueue.length > 0) {
                console.log(`메시지 큐에서 ${this.messageQueue.length}개의 메시지를 불러왔습니다.`);
                
                // 인터넷 연결이 있으면 큐 처리
                if (navigator.onLine) {
                    this.processMessageQueue();
                }
            }
        } catch (error) {
            console.error('메시지 큐 로드 실패:', error);
            this.messageQueue = [];
        }
    }
    
    /**
     * 메시지 큐를 로컬 스토리지에 저장합니다.
     */
    saveMessageQueue() {
        try {
            localStorage.setItem('messageQueue', JSON.stringify(this.messageQueue));
        } catch (error) {
            console.error('메시지 큐 저장 실패:', error);
        }
    }
    
    /**
     * 메시지 큐에 메시지를 추가합니다.
     */
    addToMessageQueue(message) {
        this.messageQueue.push(message);
        this.saveMessageQueue();
    }
    
    /**
     * 메시지 큐에서 메시지를 제거합니다.
     */
    removeFromMessageQueue(clientId) {
        this.messageQueue = this.messageQueue.filter(msg => msg.client_id !== clientId);
        this.saveMessageQueue();
    }
    
    /**
     * 메시지 큐를 처리합니다.
     */
    async processMessageQueue() {
        if (this.messageQueue.length === 0 || !navigator.onLine) return;
        
        console.log(`메시지 큐에서 ${this.messageQueue.length}개의 메시지를 처리합니다.`);
        
        // 큐에서 메시지를 복사 (처리 중 큐가 변경될 수 있음)
        const messages = [...this.messageQueue];
        
        for (const message of messages) {
            try {
                // 메시지 전송 시도
                const { data, error } = await this.client
                    .from('messages')
                    .insert([
                        {
                            room_id: message.room_id,
                            user_id: message.user_id,
                            user_name: message.user_name,
                            content: message.content,
                            language: message.language,
                            is_moderator: message.is_moderator,
                            is_announcement: message.is_announcement,
                            client_id: message.client_id
                        }
                    ])
                    .select();
                    
                if (error) throw error;
                
                // 성공적으로 전송되면 큐에서 제거
                this.removeFromMessageQueue(message.client_id);
                
                // 상태 업데이트 (메시지 상태 관리자가 있는 경우)
                if (window.messageStatusManager) {
                    messageStatusManager.updateMessageStatus(message.client_id, 'delivered');
                    if (data && data[0]) {
                        messageStatusManager.mapMessageIds(message.client_id, data[0].id);
                    }
                }
            } catch (error) {
                console.error('큐에서 메시지 전송 실패:', error);
                
                // 상태 업데이트 (메시지 상태 관리자가 있는 경우)
                if (window.messageStatusManager) {
                    messageStatusManager.updateMessageStatus(message.client_id, 'failed');
                }
            }
        }
    }
    
    /**
     * 메시지를 전송합니다.
     * @param {string} content - 메시지 내용
     * @param {boolean} isAnnouncement - 공지사항 여부
     * @returns {Promise<Object>} - 전송된 메시지 객체
     */
    async sendMessage(content, isAnnouncement = false) {
        if (!this.currentUser || !content.trim()) {
            return null;
        }
        
        try {
            // 언어 감지
            const detectedLanguage = await translationService.detectLanguage(content) || this.currentUser.language;
            
            // 임시 메시지 ID 생성
            const clientId = `temp-${Date.now()}`;
            
            // 임시 메시지 객체 생성 (UI 즉시 표시용)
            const tempMessage = {
                id: clientId,
                room_id: this.roomId,
                user_id: this.currentUser.email,
                user_name: this.currentUser.name,
                content: content,
                language: detectedLanguage,
                is_moderator: this.currentUser.isModerator,
                is_announcement: isAnnouncement,
                created_at: new Date().toISOString(),
                client_id: clientId,
                isTemp: true // 임시 메시지 플래그
            };
            
            // 메시지 전송 시도 전에 UI에 임시 메시지 표시
            // app.js의 handleNewMessage 함수가 이를 처리하도록 호출
            window.app.handleNewMessage(tempMessage);
            
            // 상태 업데이트 (메시지 상태 관리자가 있는 경우)
            if (window.messageStatusManager) {
                messageStatusManager.updateMessageStatus(clientId, 'sending');
            }
            
            // 인터넷 연결이 없는 경우
            if (!navigator.onLine || this.connectionStatus === 'disconnected') {
                console.log('오프라인 상태: 메시지를 큐에 추가합니다.');
                
                // 메시지 큐에 추가
                this.addToMessageQueue(tempMessage);
                
                // 상태 업데이트 (메시지 상태 관리자가 있는 경우)
                if (window.messageStatusManager) {
                    messageStatusManager.updateMessageStatus(clientId, 'queued');
                }
                
                return tempMessage;
            }
            
            // 메시지 전송 시도
            const { data, error } = await this.client
                .from('messages')
                .insert([
                    {
                        room_id: this.roomId,
                        user_id: this.currentUser.email,
                        user_name: this.currentUser.name,
                        content: content,
                        language: detectedLanguage,
                        is_moderator: this.currentUser.isModerator,
                        is_announcement: isAnnouncement,
                        client_id: clientId
                    }
                ])
                .select();
                
            if (error) {
                // 테이블이 없는 경우 생성 후 재시도
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    await this.createTables();
                    return this.sendMessage(content, isAnnouncement);
                }
                
                console.error('메시지 삽입 오류:', error);
                
                // 메시지 큐에 추가
                this.addToMessageQueue(tempMessage);
                
                // 상태 업데이트 (메시지 상태 관리자가 있는 경우)
                if (window.messageStatusManager) {
                    messageStatusManager.updateMessageStatus(clientId, 'queued');
                }
                
                throw error;
            }
            
            console.log('메시지 전송 성공:', data[0]);
            
            // 상태 업데이트 (메시지 상태 관리자가 있는 경우)
            if (window.messageStatusManager) {
                messageStatusManager.updateMessageStatus(clientId, 'delivered');
                messageStatusManager.mapMessageIds(clientId, data[0].id);
            }
            
            return data[0];
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            
            // 상태 업데이트 (메시지 상태 관리자가 있는 경우)
            if (window.messageStatusManager && error.clientId) {
                messageStatusManager.updateMessageStatus(error.clientId, 'failed');
            }
            
            throw new Error(`메시지 전송 실패: ${error.message || '알 수 없는 오류'}`);
        }
    }
    
    /**
     * 최근 메시지를 가져옵니다.
     * @param {number} limit - 가져올 메시지 수
     * @returns {Promise<Array>} - 메시지 배열
     */
    async getRecentMessages(limit = 50) {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .eq('room_id', this.roomId)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                // 테이블이 없는 경우 빈 배열 반환
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    await this.createTables();
                    return [];
                }
                throw error;
            }
            
            // 시간 순으로 정렬
            const messages = data.reverse();
            console.log(`최근 메시지 ${messages.length}개 로드 완료`);
            return messages;
        } catch (error) {
            console.error('메시지 로드 실패:', error);
            return [];
        }
    }
    
    /**
     * 실시간 메시지 업데이트를 구독합니다.
     * @param {Function} callback - 새 메시지 발생 시 호출될 콜백 함수
     */
    subscribeToMessages(callback) {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
        
        console.log('메시지 구독 시작 시도...');
        
        try {
            // 채널 이름을 'public:messages'로 변경하고 필터 추가
            this.messageSubscription = this.client
                .channel('public:messages')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${this.roomId}` }, 
                    async payload => {
                        const message = payload.new;
                        console.log('새 메시지 수신:', message);
                        
                        // 중요: 자신의 메시지도 포함하여 모든 메시지 처리
                        // 이전 코드에서는 자신의 메시지를 필터링했을 수 있음
                        
                        // 번역 처리
                        if (this.currentUser && this.currentUser.language !== message.language) {
                            try {
                                const translatedContent = await translationService.translateText(
                                    message.content,
                                    message.language,
                                    this.currentUser.language
                                );
                                
                                message.translatedContent = translatedContent;
                                message.targetLanguage = this.currentUser.language;
                            } catch (error) {
                                console.error('메시지 번역 실패:', error);
                            }
                        }
                        
                        // 임시 메시지와 실제 메시지 매핑 (자신의 메시지인 경우)
                        if (message.client_id && message.user_id === this.currentUser.email) {
                            // 이미 임시 메시지가 표시되어 있으면 대체
                            if (window.messageStatusManager) {
                                messageStatusManager.updateMessageStatus(message.client_id, 'delivered');
                                messageStatusManager.mapMessageIds(message.client_id, message.id);
                            }
                        }
                        
                        // 콜백 호출 - 모든 메시지 전달
                        callback(message);
                    }
                )
                .subscribe((status) => {
                    console.log('메시지 구독 상태:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('메시지 구독이 성공적으로 활성화되었습니다');
                        
                        // 연결 상태 업데이트
                        this.connectionStatus = 'connected';
                        if (window.connectionStatusIndicator) {
                            connectionStatusIndicator.updateStatus('connected');
                        }
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('메시지 구독 중 채널 오류가 발생했습니다');
                        
                        // 연결 상태 업데이트
                        this.connectionStatus = 'error';
                        if (window.connectionStatusIndicator) {
                            connectionStatusIndicator.updateStatus('error');
                        }
                        
                        // 재구독 시도
                        setTimeout(() => this.subscribeToMessages(callback), 3000);
                    }
                });
                
            console.log('메시지 구독 시작 완료');
        } catch (error) {
            console.error('메시지 구독 시작 실패:', error);
            
            // 연결 상태 업데이트
            this.connectionStatus = 'error';
            if (window.connectionStatusIndicator) {
                connectionStatusIndicator.updateStatus('error');
            }
            
            alert('실시간 메시지 수신에 문제가 발생했습니다. 페이지를 새로고침하세요.');
        }
    }
    
    /**
     * 브로드캐스트 채널 설정
     * 입력 중 상태 등의 실시간 정보 공유용
     */
    setupBroadcastChannel() {
        // 기존 채널 정리
        if (this.broadcastChannel) {
            this.broadcastChannel.unsubscribe();
        }
        
        // 브로드캐스트 채널 설정 (타이핑 표시 등 실시간 상태 공유용)
        this.broadcastChannel = this.client
            .channel('room:' + this.roomId)
            .on('broadcast', { event: 'typing' }, payload => {
                // 입력 중 이벤트 수신
                if (window.typingIndicatorManager && 
                    payload.user_id !== this.currentUser.email) {
                    typingIndicatorManager.showUserTyping(payload.user_name, true);
                }
            })
            .on('broadcast', { event: 'stop_typing' }, payload => {
                // 입력 중단 이벤트 수신
                if (window.typingIndicatorManager && 
                    payload.user_id !== this.currentUser.email) {
                    typingIndicatorManager.showUserTyping(payload.user_name, false);
                }
            })
            .subscribe();
            
        console.log('브로드캐스트 채널 설정 완료');
    }
    
    /**
     * 입력 중 상태 브로드캐스트
     * @param {boolean} isTyping - 입력 중 여부
     */
    broadcastTypingStatus(isTyping) {
        if (!this.broadcastChannel || !this.currentUser) return;
        
        const eventName = isTyping ? 'typing' : 'stop_typing';
        
        this.broadcastChannel.send({
            type: 'broadcast',
            event: eventName,
            payload: {
                user_id: this.currentUser.email,
                user_name: this.currentUser.name,
                timestamp: Date.now()
            }
        });
    }
    
    /**
     * 실시간 사용자 상태 업데이트를 구독합니다.
     * @param {Function} callback - 사용자 상태 변경 시 호출될 콜백 함수
     */
    subscribeToPresence(callback) {
        if (this.presenceSubscription) {
            this.presenceSubscription.unsubscribe();
        }
        
        try {
            this.presenceSubscription = this.client
                .channel('presence-channel')
                .on('presence', { event: 'sync' }, () => {
                    const presence = this.presenceSubscription.presenceState();
                    const users = new Map();
                    
                    for (const [key, value] of Object.entries(presence)) {
                        if (value && value.length > 0) {
                            const user = value[0];
                            users.set(user.user_id, user);
                        }
                    }
                    
                    this.onlineUsers = users;
                    if (callback) callback(Array.from(users.values()));
                })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                    for (const presence of newPresences) {
                        this.onlineUsers.set(presence.user_id, presence);
                    }
                    
                    if (callback) callback(Array.from(this.onlineUsers.values()));
                })
                .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                    for (const presence of leftPresences) {
                        this.onlineUsers.delete(presence.user_id);
                    }
                    
                    if (callback) callback(Array.from(this.onlineUsers.values()));
                })
                .subscribe(async status => {
                    console.log('상태 구독 상태:', status);
                    if (status !== 'SUBSCRIBED' || !this.currentUser) return;
                    
                    // 자신의 상태 공유
                    await this.presenceSubscription.track({
                        user_id: this.currentUser.email,
                        user_name: this.currentUser.name,
                        is_moderator: this.currentUser.isModerator,
                        language: this.currentUser.language,
                        online_at: new Date().toISOString()
                    });
                });
                
            console.log('상태 구독 시작');
        } catch (error) {
            console.error('상태 구독 시작 실패:', error);
        }
    }
    
    /**
     * 구독을 모두 해제합니다.
     */
    unsubscribeAll() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
            this.messageSubscription = null;
        }
        
        if (this.presenceSubscription) {
            this.presenceSubscription.unsubscribe();
            this.presenceSubscription = null;
        }
        
        if (this.broadcastChannel) {
            this.broadcastChannel.unsubscribe();
            this.broadcastChannel = null;
        }
        
        console.log('모든 구독 해제');
    }
    
    /**
     * 사용자 강퇴 기능
     * @param {string} userEmail - 강퇴할 사용자 이메일
     * @returns {Promise<boolean>} - 성공 여부
     */
    async kickUser(userEmail) {
        if (!this.currentUser || !this.currentUser.isModerator) {
            console.error('진행자만 사용자를 강퇴할 수 있습니다.');
            return false;
        }
        
        try {
            const { data, error } = await this.client
                .from('kicked_users')
                .insert([
                    {
                        room_id: this.roomId,
                        user_id: userEmail,
                        kicked_by: this.currentUser.email
                    }
                ]);
                
            if (error) {
                // 테이블이 없는 경우 생성 후 재시도
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    await this.createTables();
                    return this.kickUser(userEmail);
                }
                throw error;
            }
            
            // 강퇴 알림 메시지 전송
            await this.sendMessage(`${userEmail} 사용자가 강퇴되었습니다.`, true);
            
            console.log('사용자 강퇴 성공:', userEmail);
            return true;
        } catch (error) {
            console.error('사용자 강퇴 실패:', error);
            return false;
        }
    }
    
    /**
     * 사용자가 강퇴되었는지 확인합니다.
     * @returns {Promise<boolean>} - 강퇴 여부
     */
    async checkIfKicked() {
        if (!this.currentUser) return false;
        
        try {
            const { data, error } = await this.client
                .from('kicked_users')
                .select('*')
                .eq('room_id', this.roomId)
                .eq('user_id', this.currentUser.email)
                .limit(1);
                
            if (error) {
                // 테이블이 없는 경우는 강퇴 아님
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    return false;
                }
                throw error;
            }
            
            if (data && data.length > 0) {
                console.log('현재 사용자가 강퇴되었습니다.');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('강퇴 확인 실패:', error);
            return false;
        }
    }
    
    /**
     * API 연결 테스트를 수행합니다.
     */
    async testConnection() {
        try {
            const { data, error } = await this.client.from('messages').select('count(*)', { count: 'exact', head: true });
            
            if (error) {
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.log('테이블이 존재하지 않습니다. 생성을 시도합니다.');
                    await this.createTables();
                    return true;
                }
                throw error;
            }
            
            console.log('Supabase 연결 테스트 성공');
            return true;
        } catch (error) {
            console.error('Supabase 연결 테스트 실패:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
const databaseService = new DatabaseService();
