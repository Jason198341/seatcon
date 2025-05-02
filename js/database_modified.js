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
            
            // 클라이언트 생성 ID (중복 방지)
            const clientGeneratedId = Date.now().toString();
            
            // 기존 테이블 구조에 맞게 메시지 객체 생성
            const messageObj = {
                speaker_id: this.roomId,
                author_name: this.currentUser.name,
                author_email: this.currentUser.email,
                content: content,
                client_generated_id: clientGeneratedId,
                user_role: this.currentUser.isModerator ? 'moderator' : 'participant',
                language: detectedLanguage
            };
            
            console.log('메시지 전송 시도:', messageObj);
            
            // 메시지 삽입 (comments 테이블 사용)
            const { data, error } = await this.client
                .from('comments')
                .insert([messageObj])
                .select();
                
            if (error) {
                console.error('메시지 삽입 오류:', error);
                throw error;
            }
            
            // 반환된 데이터를 원래 형식에 맞게 변환
            const formattedMessage = {
                id: data[0].id,
                room_id: this.roomId,
                user_id: this.currentUser.email,
                user_name: this.currentUser.name,
                content: content,
                language: detectedLanguage,
                is_moderator: this.currentUser.isModerator,
                is_announcement: isAnnouncement,
                created_at: data[0].created_at
            };
            
            console.log('메시지 전송 성공:', formattedMessage);
            return formattedMessage;
        } catch (error) {
            console.error('메시지 전송 실패:', error);
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
                .from('comments')
                .select('*')
                .eq('speaker_id', this.roomId)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) throw error;
            
            // 시간 순으로 정렬하고 포맷 변환
            const messages = data.reverse().map(item => ({
                id: item.id,
                room_id: this.roomId,
                user_id: item.author_email,
                user_name: item.author_name,
                content: item.content,
                language: item.language || 'en',
                is_moderator: item.user_role === 'moderator',
                is_announcement: false, // 실제 공지사항 필드가 없으므로 false로 설정
                created_at: item.created_at
            }));
            
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
            .channel('comments-channel')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `speaker_id=eq.${this.roomId}` },
                async payload => {
                    // 포맷 변환
                    const rawMessage = payload.new;
                    const message = {
                        id: rawMessage.id,
                        room_id: this.roomId,
                        user_id: rawMessage.author_email,
                        user_name: rawMessage.author_name,
                        content: rawMessage.content,
                        language: rawMessage.language || 'en',
                        is_moderator: rawMessage.user_role === 'moderator',
                        is_announcement: false,
                        created_at: rawMessage.created_at
                    };
                    
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
                if