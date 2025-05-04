/**
 * Supabase 클라이언트 서비스
 * Supabase를 통한 데이터베이스 및 인증 관련 기능 처리
 */
class SupabaseClient {
    /**
     * Supabase 클라이언트 생성자
     * @param {Object} config - 애플리케이션 설정
     * @param {Object} logger - 로거 서비스
     */
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || console;
        this.supabase = null;
        this.currentUser = null;
        this.messageSubscription = null;
        this.likesSubscription = null;
    }

    /**
     * Supabase 클라이언트 초기화
     * @returns {Promise<boolean>} - 초기화 성공 여부
     */
    async init() {
        try {
            this.logger.info('Supabase 클라이언트 초기화 중...');
            
            // Supabase 클라이언트 로드 확인
            if (typeof supabase === 'undefined') {
                await this.loadSupabaseScript();
            }
            
            // Supabase 클라이언트 생성
            this.supabase = supabase.createClient(
                this.config.SUPABASE.URL,
                this.config.SUPABASE.KEY
            );
            
            this.logger.info('Supabase 클라이언트 초기화 완료');
            return true;
        } catch (error) {
            this.logger.error('Supabase 클라이언트 초기화 중 오류 발생:', error);
            throw new Error('Supabase 연결에 실패했습니다.');
        }
    }

    /**
     * Supabase 스크립트 동적 로드
     * @returns {Promise<void>}
     */
    loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Supabase 스크립트 로드 실패'));
            document.head.appendChild(script);
        });
    }

    /**
     * 현재 사용자 정보 설정
     * @param {Object} userInfo - 사용자 정보
     */
    setCurrentUser(userInfo) {
        this.currentUser = userInfo;
        this.saveUserInfo(userInfo);
        this.logger.info('현재 사용자 정보 설정:', userInfo);
    }

    /**
     * 사용자 정보 로컬 스토리지에 저장
     * @param {Object} userInfo - 사용자 정보
     */
    saveUserInfo(userInfo) {
        try {
            localStorage.setItem(this.config.STORAGE.USER_INFO, JSON.stringify(userInfo));
        } catch (error) {
            this.logger.error('사용자 정보 저장 중 오류 발생:', error);
        }
    }

    /**
     * 저장된 사용자 정보 가져오기
     * @returns {Object|null} - 사용자 정보 또는 null
     */
    getSavedUserInfo() {
        try {
            const userInfo = localStorage.getItem(this.config.STORAGE.USER_INFO);
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            this.logger.error('저장된 사용자 정보 가져오기 중 오류 발생:', error);
            return null;
        }
    }

    /**
     * 사용자 로그아웃
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.config.STORAGE.USER_INFO);
        this.unsubscribeAll();
        this.logger.info('사용자 로그아웃');
    }

    /**
     * 모든 실시간 구독 해제
     */
    unsubscribeAll() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
            this.messageSubscription = null;
        }
        
        if (this.likesSubscription) {
            this.likesSubscription.unsubscribe();
            this.likesSubscription = null;
        }
    }

    /**
     * 메시지 전송
     * @param {string} content - 메시지 내용
     * @returns {Promise<Object|null>} - 생성된 메시지 데이터 또는 null
     */
    async sendMessage(content) {
        if (!this.currentUser || !content.trim()) {
            this.logger.warn('메시지를 보낼 수 없음: 사용자 정보 없음 또는 빈 메시지');
            return null;
        }
        
        const clientGeneratedId = Date.now().toString();
        
        try {
            const { data, error } = await this.supabase
                .from('comments')
                .insert([
                    {
                        speaker_id: 'global-chat',
                        author_name: this.currentUser.name,
                        author_email: this.currentUser.email,
                        content: content,
                        client_generated_id: clientGeneratedId,
                        user_role: this.currentUser.role,
                        language: this.currentUser.language
                    }
                ])
                .select();
                
            if (error) throw error;
            
            this.logger.info('메시지 전송 완료:', data[0]);
            return data[0];
        } catch (error) {
            this.logger.error('메시지 전송 중 오류 발생:', error);
            throw new Error('메시지 전송에 실패했습니다.');
        }
    }

    /**
     * 메시지 목록 가져오기
     * @param {number} limit - 가져올 메시지 수 제한
     * @returns {Promise<Array>} - 메시지 목록
     */
    async getMessages(limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('comments')
                .select('*')
                .eq('speaker_id', 'global-chat')
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) throw error;
            
            this.logger.info(`${data.length}개 메시지를 가져왔습니다.`);
            return data.reverse(); // 시간순으로 정렬
        } catch (error) {
            this.logger.error('메시지 가져오기 중 오류 발생:', error);
            throw new Error('메시지를 불러오는데 실패했습니다.');
        }
    }

    /**
     * 메시지 좋아요 추가
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<Object|null>} - 생성된 좋아요 데이터 또는 null
     */
    async addLike(messageId) {
        if (!this.currentUser) {
            this.logger.warn('좋아요를 추가할 수 없음: 사용자 정보 없음');
            return null;
        }
        
        try {
            // 이미 좋아요가 있는지 확인
            const { data: existingLike } = await this.supabase
                .from('message_likes')
                .select('*')
                .eq('message_id', messageId)
                .eq('user_email', this.currentUser.email)
                .maybeSingle();
                
            if (existingLike) {
                this.logger.info('이미 좋아요가 있습니다.', existingLike);
                return existingLike;
            }
            
            // 좋아요 추가
            const { data, error } = await this.supabase
                .from('message_likes')
                .insert([
                    {
                        message_id: messageId,
                        user_name: this.currentUser.name,
                        user_email: this.currentUser.email
                    }
                ])
                .select();
                
            if (error) throw error;
            
            this.logger.info('좋아요 추가 완료:', data[0]);
            return data[0];
        } catch (error) {
            this.logger.error('좋아요 추가 중 오류 발생:', error);
            throw new Error('좋아요 추가에 실패했습니다.');
        }
    }

    /**
     * 메시지 좋아요 취소
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<boolean>} - 성공 여부
     */
    async removeLike(messageId) {
        if (!this.currentUser) {
            this.logger.warn('좋아요를 취소할 수 없음: 사용자 정보 없음');
            return false;
        }
        
        try {
            const { error } = await this.supabase
                .from('message_likes')
                .delete()
                .eq('message_id', messageId)
                .eq('user_email', this.currentUser.email);
                
            if (error) throw error;
            
            this.logger.info(`메시지 ${messageId}의 좋아요 취소 완료`);
            return true;
        } catch (error) {
            this.logger.error('좋아요 취소 중 오류 발생:', error);
            throw new Error('좋아요 취소에 실패했습니다.');
        }
    }

    /**
     * 메시지의 좋아요 목록 가져오기
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<Array>} - 좋아요 목록
     */
    async getLikes(messageId) {
        try {
            const { data, error } = await this.supabase
                .from('message_likes')
                .select('*')
                .eq('message_id', messageId);
                
            if (error) throw error;
            
            this.logger.info(`메시지 ${messageId}의 좋아요 ${data.length}개를 가져왔습니다.`);
            return data;
        } catch (error) {
            this.logger.error('좋아요 가져오기 중 오류 발생:', error);
            throw new Error('좋아요 목록을 불러오는데 실패했습니다.');
        }
    }

    /**
     * 메시지 실시간 구독
     * @param {Function} callback - 콜백 함수 (event, payload)
     */
    subscribeToMessages(callback) {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
        
        this.messageSubscription = this.supabase
            .channel('public:comments')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'comments' }, 
                payload => {
                    this.logger.info('새 메시지 수신:', payload.new);
                    callback('new_message', payload.new);
                }
            )
            .subscribe(status => {
                this.logger.info('메시지 구독 상태:', status);
            });
    }

    /**
     * 좋아요 실시간 구독
     * @param {Function} callback - 콜백 함수 (event, payload)
     */
    subscribeToLikes(callback) {
        if (this.likesSubscription) {
            this.likesSubscription.unsubscribe();
        }
        
        this.likesSubscription = this.supabase
            .channel('public:message_likes')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'message_likes' }, 
                payload => {
                    this.logger.info('새 좋아요 수신:', payload.new);
                    callback('new_like', payload.new);
                }
            )
            .on('postgres_changes', 
                { event: 'DELETE', schema: 'public', table: 'message_likes' }, 
                payload => {
                    this.logger.info('좋아요 삭제 수신:', payload.old);
                    callback('remove_like', payload.old);
                }
            )
            .subscribe(status => {
                this.logger.info('좋아요 구독 상태:', status);
            });
    }

    /**
     * 사용자 타이핑 알림
     * @param {string} roomId - 방 ID (기본값: 'global-chat')
     */
    async notifyTyping(roomId = 'global-chat') {
        if (!this.currentUser) return;
        
        try {
            // Presence 채널을 통해 타이핑 상태 전송
            // 실제 구현에서는 Supabase Presence 기능을 사용할 수 있음
            this.logger.debug(`사용자 ${this.currentUser.name}이(가) 타이핑 중...`);
        } catch (error) {
            this.logger.error('타이핑 알림 중 오류 발생:', error);
        }
    }
}
