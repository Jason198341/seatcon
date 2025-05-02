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
        this.onlineUsers = new Map();
        
        this.init();
    }
    
    /**
     * Supabase 클라이언트를 초기화합니다.
     */
    init() {
        if (!supabase) {
            console.error('Supabase 라이브러리를 로드하지 못했습니다.');
            return;
        }
        
        this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        console.log('Supabase 클라이언트 초기화 완료');
        
        // 테이블 설정 확인 및 생성
        this.setupTables().then(() => {
            console.log('데이터베이스 테이블 설정 완료');
        }).catch(error => {
            console.error('데이터베이스 테이블 설정 실패:', error);
        });
        
        // 저장된 사용자 확인
        const savedUser = this.getSavedUserInfo();
        if (savedUser) {
            this.currentUser = savedUser;
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
     * 테이블이 존재하는지 확인하고, 없으면 생성합니다.
     */
    async setupTables() {
        try {
            // 메시지 테이블 존재 여부 확인
            const { error: messagesError } = await this.client
                .from('messages')
                .select('id')
                .limit(1);
                
            // 테이블이 없으면 직접 생성 시도
            if (messagesError && (messagesError.code === '42P01' || messagesError.message.includes('does not exist'))) {
                console.log('메시지 테이블이 존재하지 않습니다. 생성을 시도합니다.');
                
                // messages 테이블 생성
                const { error: createTableError } = await this.client
                    .from('messages')
                    .insert({
                        room_id: 'setup',
                        user_id: 'system',
                        user_name: 'System',
                        content: 'Table setup message',
                        language: 'en',
                        is_moderator: true,
                        is_announcement: true
                    })
                    .select();
                
                if (createTableError && !createTableError.message.includes('already exists')) {
                    // SQL을 통한 직접 테이블 생성 시도
                    const createMessagesTableSQL = `
                    CREATE TABLE IF NOT EXISTS messages (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        room_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        user_name TEXT NOT NULL,
                        content TEXT NOT NULL,
                        language TEXT NOT NULL,
                        is_moderator BOOLEAN DEFAULT FALSE,
                        is_announcement BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );`;
                    
                    // SQL을 실행할 방법이 없으므로 사용자에게 알림
                    console.error('테이블 자동 생성 실패. SQL 직접 실행이 필요합니다:', createMessagesTableSQL);
                } else {
                    console.log('메시지 테이블 생성 성공 또는 이미 존재합니다.');
                }
                
                // kicked_users 테이블 확인 및 생성
                const { error: kickedUsersError } = await this.client
                    .from('kicked_users')
                    .select('id')
                    .limit(1);
                    
                if (kickedUsersError && (kickedUsersError.code === '42P01' || kickedUsersError.message.includes('does not exist'))) {
                    console.log('강퇴 사용자 테이블이 존재하지 않습니다. 생성을 시도합니다.');
                    
                    // 직접 테이블 생성 시도
                    const { error: createKickedError } = await this.client.from('kicked_users').insert({
                        room_id: 'setup',
                        user_id: 'system',
                        kicked_by: 'system'
                    });
                    
                    if (createKickedError && !createKickedError.message.includes('already exists')) {
                        const createKickedTableSQL = `
                        CREATE TABLE IF NOT EXISTS kicked_users (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            room_id TEXT NOT NULL,
                            user_id TEXT NOT NULL,
                            kicked_by TEXT NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            UNIQUE (room_id, user_id)
                        );`;
                        
                        console.error('강퇴 테이블 자동 생성 실패. SQL 직접 실행이 필요합니다:', createKickedTableSQL);
                    } else {
                        console.log('강퇴 사용자 테이블 생성 성공 또는 이미 존재합니다.');
                    }
                }
            } else {
                console.log('데이터베이스 테이블이 이미 존재합니다.');
            }
        } catch (error) {
            console.error('테이블 설정 실패:', error);
            throw error;
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
            
            // 테이블이 없는 경우 생성 시도
            await this.setupTables().catch(error => {
                console.error('메시지 전송 전 테이블 설정 실패:', error);
            });
            
            // 메시지 객체 생성
            const messageObj = {
                room_id: this.roomId,
                user_id: this.currentUser.email,
                user_name: this.currentUser.name,
                content: content,
                language: detectedLanguage,
                is_moderator: this.currentUser.isModerator,
                is_announcement: isAnnouncement
            };
            
            console.log('메시지 전송 시도:', messageObj);
            
            // 메시지 삽입
            const { data, error } = await this.client
                .from('messages')
                .insert([messageObj])
                .select();
                
            if (error) {
                console.error('메시지 삽입 오류:', error);
                
                // 테이블이 없는 경우 오류 메시지 상세화
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.error('메시지 테이블이 존재하지 않습니다. 관리자에게 문의하세요.');
                    throw new Error('메시지 테이블이 존재하지 않습니다. 관리자에게 문의하세요.');
                }
                
                throw error;
            }
            
            console.log('메시지 전송 성공:', data[0]);
            return data[0];
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            // 오류 메시지를 사용자에게 표시할 수 있도록 전달
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
            // 테이블이 없는 경우 생성 시도
            await this.setupTables().catch(error => {
                console.error('메시지 로드 전 테이블 설정 실패:', error);
            });
            
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .eq('room_id', this.roomId)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                // 테이블이 없는 경우 빈 배열 반환
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.log('메시지 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
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
        
        this.messageSubscription = this.client
            .channel('messages-channel')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${this.roomId}` },
                async payload => {
                    const message = payload.new;
                    
                    // 자신의 메시지는 이미 UI에 표시되었으므로 무시
                    if (this.currentUser && message.user_id === this.currentUser.email) {
                        return;
                    }
                    
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
                    
                    callback(message);
                }
            )
            .subscribe();
            
        console.log('메시지 구독 시작');
    }
    
    /**
     * 실시간 사용자 상태 업데이트를 구독합니다.
     * @param {Function} callback - 사용자 상태 변경 시 호출될 콜백 함수
     */
    subscribeToPresence(callback) {
        if (this.presenceSubscription) {
            this.presenceSubscription.unsubscribe();
        }
        
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
            // 테이블이 없는 경우 생성 시도
            await this.setupTables().catch(error => {
                console.error('강퇴 전 테이블 설정 실패:', error);
            });
            
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
                // 테이블이 없는 경우 오류 메시지 상세화
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.error('강퇴 사용자 테이블이 존재하지 않습니다.');
                    throw new Error('강퇴 사용자 테이블이 존재하지 않습니다. 관리자에게 문의하세요.');
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
                // 테이블이 없는 경우 강퇴되지 않은 것으로 처리
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.log('강퇴 사용자 테이블이 존재하지 않습니다. 강퇴되지 않은 것으로 처리합니다.');
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
}

// 전역 인스턴스 생성
const databaseService = new DatabaseService();
