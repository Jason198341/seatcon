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
        this.connectionStatus = 'disconnected';
        this.lastConnectionAttempt = 0;
        this.connectionRetryInterval = 5000; // 5초
    }

    /**
     * Supabase 클라이언트 초기화
     * @returns {Promise<boolean>} - 초기화 성공 여부
     */
    async init() {
        try {
            this.logger.info('Supabase 클라이언트 초기화 중...');
            
            // 이미 연결 시도 중인 경우
            if (this.connectionStatus === 'connecting') {
                this.logger.info('이미 Supabase 연결을 시도 중입니다.');
                return false;
            }
            
            // 연결 시도 간격 제한
            const now = Date.now();
            if (now - this.lastConnectionAttempt < this.connectionRetryInterval) {
                this.logger.info(`연결 재시도 간격(${this.connectionRetryInterval}ms)이 지나지 않았습니다.`);
                return false;
            }
            
            this.lastConnectionAttempt = now;
            this.connectionStatus = 'connecting';
            
            // Supabase 클라이언트 로드 확인
            if (typeof supabase === 'undefined') {
                this.logger.info('Supabase 스크립트 로드 시도 중...');
                await this.loadSupabaseScript();
                this.logger.info('Supabase 스크립트 로드 완료');
            }
            
            // Supabase 클라이언트 생성
            try {
                this.logger.info('Supabase 클라이언트 생성 중...');
                this.supabase = supabase.createClient(
                    this.config.SUPABASE.URL,
                    this.config.SUPABASE.KEY,
                    {
                        realtime: {
                            params: {
                                eventsPerSecond: 10
                            }
                        }
                    }
                );
                this.logger.info('Supabase 클라이언트 생성 완료');
            } catch (clientError) {
                this.logger.error('Supabase 클라이언트 생성 중 오류:', clientError);
                throw clientError;
            }
            
            // 연결 테스트
            try {
                this.logger.info('Supabase 연결 테스트 중...');
                await this.testConnection();
                this.logger.info('Supabase 연결 테스트 성공');
            } catch (testError) {
                this.logger.error('Supabase 연결 테스트 실패:', testError);
                throw testError;
            }
            
            this.connectionStatus = 'connected';
            this.logger.info('Supabase 클라이언트 초기화 완료');
            return true;
        } catch (error) {
            this.connectionStatus = 'disconnected';
            this.logger.error('Supabase 클라이언트 초기화 중 오류 발생:', error);
            
            // 개발 환경에서는 오류 무시 옵션
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 Supabase 연결 오류를 무시하고 계속합니다.');
                return true;
            }
            
            // 5초 후 재연결 시도
            setTimeout(() => this.reconnect(), 5000);
            
            throw new Error('Supabase 연결에 실패했습니다.');
        }
    }

    /**
     * Supabase 연결 테스트
     * @returns {Promise<boolean>} - 연결 성공 여부
     */
    async testConnection() {
        try {
            // 간단한 쿼리로 연결 테스트
            const { error } = await this.supabase.from('comments').select('count', { count: 'exact', head: true });
            
            if (error) throw error;
            
            return true;
        } catch (error) {
            this.logger.error('Supabase 연결 테스트 중 오류 발생:', error);
            throw new Error('Supabase 연결 테스트에 실패했습니다.');
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
     * 공지사항 메시지 전송
     * @param {string} content - 공지사항 내용
     * @returns {Promise<Object|null>} - 생성된 공지사항 메시지 데이터 또는 null
     */
    async sendAnnouncement(content) {
        if (!this.currentUser || !content.trim()) {
            this.logger.warn('공지사항을 보낼 수 없음: 사용자 정보 없음 또는 빈 메시지');
            return null;
        }
        
        // 관리자 권한 확인
        if (this.currentUser.role !== 'admin') {
            this.logger.warn('권한 없음: 관리자만 공지사항을 전송할 수 있습니다.');
            return null;
        }
        
        const clientGeneratedId = Date.now().toString();
        
        try {
            // Supabase 연결 상태 확인
            if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
                throw new Error('Supabase 연결이 끊어졌습니다.');
            }
            
            // 디버그 로그 추가
            this.logger.debug('전송 시도 중인 공지사항:', content);
            this.logger.debug('현재 사용자 정보:', this.currentUser);
            
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
                        language: this.currentUser.language,
                        is_announcement: true
                    }
                ])
                .select();
                
            if (error) {
                this.logger.error('Supabase 오류:', error);
                throw error;
            }
            
            this.logger.info('공지사항 전송 완료:', data[0]);
            return data[0];
        } catch (error) {
            this.logger.error('공지사항 전송 중 오류 발생:', error);
            
            // 연결 상태 업데이트
            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network Error') ||
                error.message.includes('Connection error') ||
                error.message.includes('Supabase 연결이 끊어졌습니다')
            ) {
                this.connectionStatus = 'disconnected';
            }
            
            // 개발 환경에서는 임시 응답 생성
            if (this.config && this.config.DEBUG && this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 임시 공지사항을 생성합니다.');
                return {
                    id: 'local-' + clientGeneratedId,
                    speaker_id: 'global-chat',
                    author_name: this.currentUser.name,
                    author_email: this.currentUser.email,
                    content: content,
                    client_generated_id: clientGeneratedId,
                    user_role: this.currentUser.role,
                    language: this.currentUser.language,
                    created_at: new Date().toISOString(),
                    is_announcement: true,
                    status: 'local'
                };
            }
            
            throw new Error('공지사항 전송에 실패했습니다.');
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
            // Supabase 연결 상태 확인
            if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
                throw new Error('Supabase 연결이 끊어졌습니다.');
            }
            
            // 디버그 로그 추가
            this.logger.debug('전송 시도 중인 메시지:', content);
            this.logger.debug('현재 사용자 정보:', this.currentUser);
            
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
                
            if (error) {
                this.logger.error('Supabase 오류:', error);
                throw error;
            }
            
            this.logger.info('메시지 전송 완료:', data[0]);
            return data[0];
        } catch (error) {
            this.logger.error('메시지 전송 중 오류 발생:', error);
            
            // 연결 상태 업데이트
            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network Error') ||
                error.message.includes('Connection error') ||
                error.message.includes('Supabase 연결이 끊어졌습니다')
            ) {
                this.connectionStatus = 'disconnected';
            }
            
            // 개발 환경에서는 임시 응답 생성
            if (this.config && this.config.DEBUG && this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 임시 메시지를 생성합니다.');
                return {
                    id: 'local-' + clientGeneratedId,
                    speaker_id: 'global-chat',
                    author_name: this.currentUser.name,
                    author_email: this.currentUser.email,
                    content: content,
                    client_generated_id: clientGeneratedId,
                    user_role: this.currentUser.role,
                    language: this.currentUser.language,
                    created_at: new Date().toISOString(),
                    status: 'local'
                };
            }
            
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
            // Supabase 연결 상태 확인
            if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
                throw new Error('Supabase 연결이 끊어졌습니다.');
            }
            
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
            
            // 연결 상태 업데이트
            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network Error') ||
                error.message.includes('Connection error') ||
                error.message.includes('Supabase 연결이 끊어졌습니다')
            ) {
                this.connectionStatus = 'disconnected';
            }
            
            // 개발 환경에서는 빈 배열 반환
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 메시지 로드 오류를 무시하고 빈 배열을 반환합니다.');
                return [];
            }
            
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
            // Supabase 연결 상태 확인
            if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
                throw new Error('Supabase 연결이 끊어졌습니다.');
            }
            
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
            
            // 연결 상태 업데이트
            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network Error') ||
                error.message.includes('Connection error') ||
                error.message.includes('Supabase 연결이 끊어졌습니다')
            ) {
                this.connectionStatus = 'disconnected';
            }
            
            // 개발 환경에서는 임시 응답 생성
            if (this.config && this.config.DEBUG && this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 임시 좋아요를 생성합니다.');
                return {
                    id: 'local-like-' + Date.now(),
                    message_id: messageId,
                    user_name: this.currentUser.name,
                    user_email: this.currentUser.email,
                    created_at: new Date().toISOString(),
                    status: 'local'
                };
            }
            
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
            // Supabase 연결 상태 확인
            if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
                throw new Error('Supabase 연결이 끊어졌습니다.');
            }
            
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
            
            // 연결 상태 업데이트
            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network Error') ||
                error.message.includes('Connection error') ||
                error.message.includes('Supabase 연결이 끊어졌습니다')
            ) {
                this.connectionStatus = 'disconnected';
            }
            
            // 개발 환경에서는 성공 반환
            if (this.config && this.config.DEBUG && this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 좋아요 취소 성공으로 처리합니다.');
                return true;
            }
            
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
            // Supabase 연결 상태 확인
            if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
                throw new Error('Supabase 연결이 끊어졌습니다.');
            }
            
            const { data, error } = await this.supabase
                .from('message_likes')
                .select('*')
                .eq('message_id', messageId);
                
            if (error) throw error;
            
            this.logger.info(`메시지 ${messageId}의 좋아요 ${data.length}개를 가져왔습니다.`);
            return data;
        } catch (error) {
            this.logger.error('좋아요 가져오기 중 오류 발생:', error);
            
            // 연결 상태 업데이트
            if (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network Error') ||
                error.message.includes('Connection error') ||
                error.message.includes('Supabase 연결이 끊어졌습니다')
            ) {
                this.connectionStatus = 'disconnected';
            }
            
            // 개발 환경에서는 빈 배열 반환
            if (this.config && this.config.DEBUG && this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 빈 좋아요 목록을 반환합니다.');
                return [];
            }
            
            throw new Error('좋아요 목록을 불러오는데 실패했습니다.');
        }
    }

    /**
     * 메시지 실시간 구독
     * @param {Function} callback - 콜백 함수 (event, payload)
     */
    subscribeToMessages(callback) {
        // 기존 구독이 있으면 해제
        if (this.messageSubscription) {
            try {
                this.messageSubscription.unsubscribe();
                this.logger.info('기존 메시지 구독 해제');
            } catch (unsubError) {
                this.logger.warn('기존 메시지 구독 해제 중 오류:', unsubError);
            }
            this.messageSubscription = null;
        }
        
        // Supabase 클라이언트 확인
        if (!this.supabase) {
            this.logger.error('Supabase 클라이언트가 초기화되지 않았습니다.');
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 메시지 구독 없이 계속합니다.');
                return true;
            }
            return false;
        }
        
        try {
            this.logger.info('메시지 구독 시작 중...');
            
            // 채널 ID 생성 (타임스탬프로 유니크하게)
            const channelId = `comments_channel_${Date.now()}`;
            
            // 새 채널 생성 및 구독
            this.messageSubscription = this.supabase
                .channel(channelId)
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'comments' }, 
                    payload => {
                        this.logger.info('새 메시지 수신:', payload.new);
                        try {
                            callback('new_message', payload.new);
                        } catch (callbackError) {
                            this.logger.error('메시지 콜백 처리 중 오류:', callbackError);
                        }
                    }
                )
                .subscribe(status => {
                    this.logger.info('메시지 구독 상태:', status);
                    if (status === 'SUBSCRIBED') {
                        this.connectionStatus = 'connected';
                        this.logger.info('메시지 구독 성공!');
                    } else if (status === 'CHANNEL_ERROR') {
                        this.connectionStatus = 'disconnected';
                        this.logger.error('메시지 채널 오류 발생!');
                        
                        // 재연결 시도
                        setTimeout(() => {
                            this.logger.info('메시지 구독 재시도 중...');
                            this.subscribeToMessages(callback);
                        }, this.connectionRetryInterval);
                    }
                });
                
            return true;
        } catch (error) {
            this.logger.error('메시지 구독 중 오류 발생:', error);
            this.connectionStatus = 'disconnected';
            
            // 개발 환경에서는 오류 무시
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 메시지 구독 오류를 무시하고 계속합니다.');
                return true;
            }
            
            // 재연결 시도
            setTimeout(() => {
                this.logger.info('메시지 구독 재시도 중...');
                this.subscribeToMessages(callback);
            }, this.connectionRetryInterval);
            
            return false;
        }
    }

    /**
     * 좋아요 실시간 구독
     * @param {Function} callback - 콜백 함수 (event, payload)
     */
    subscribeToLikes(callback) {
        // 기존 구독이 있으면 해제
        if (this.likesSubscription) {
            try {
                this.likesSubscription.unsubscribe();
                this.logger.info('기존 좋아요 구독 해제');
            } catch (unsubError) {
                this.logger.warn('기존 좋아요 구독 해제 중 오류:', unsubError);
            }
            this.likesSubscription = null;
        }
        
        // Supabase 클라이언트 확인
        if (!this.supabase) {
            this.logger.error('Supabase 클라이언트가 초기화되지 않았습니다.');
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 좋아요 구독 없이 계속합니다.');
                return true;
            }
            return false;
        }
        
        try {
            this.logger.info('좋아요 구독 시작 중...');
            
            // 채널 ID 생성 (타임스탬프로 유니크하게)
            const channelId = `likes_channel_${Date.now()}`;
            
            // 새 채널 생성 및 구독
            this.likesSubscription = this.supabase
                .channel(channelId)
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'message_likes' }, 
                    payload => {
                        this.logger.info('새 좋아요 수신:', payload.new);
                        try {
                            callback('new_like', payload.new);
                        } catch (callbackError) {
                            this.logger.error('좋아요 콜백 처리 중 오류:', callbackError);
                        }
                    }
                )
                .on('postgres_changes', 
                    { event: 'DELETE', schema: 'public', table: 'message_likes' }, 
                    payload => {
                        this.logger.info('좋아요 삭제 수신:', payload.old);
                        try {
                            callback('remove_like', payload.old);
                        } catch (callbackError) {
                            this.logger.error('좋아요 삭제 콜백 처리 중 오류:', callbackError);
                        }
                    }
                )
                .subscribe(status => {
                    this.logger.info('좋아요 구독 상태:', status);
                    if (status === 'SUBSCRIBED') {
                        this.connectionStatus = 'connected';
                        this.logger.info('좋아요 구독 성공!');
                    } else if (status === 'CHANNEL_ERROR') {
                        this.connectionStatus = 'disconnected';
                        this.logger.error('좋아요 채널 오류 발생!');
                        
                        // 재연결 시도
                        setTimeout(() => {
                            this.logger.info('좋아요 구독 재시도 중...');
                            this.subscribeToLikes(callback);
                        }, this.connectionRetryInterval);
                    }
                });
                
            return true;
        } catch (error) {
            this.logger.error('좋아요 구독 중 오류 발생:', error);
            this.connectionStatus = 'disconnected';
            
            // 개발 환경에서는 오류 무시
            if (this.config.DEBUG.ENABLED) {
                this.logger.warn('개발 환경에서는 좋아요 구독 오류를 무시하고 계속합니다.');
                return true;
            }
            
            // 재연결 시도
            setTimeout(() => {
                this.logger.info('좋아요 구독 재시도 중...');
                this.subscribeToLikes(callback);
            }, this.connectionRetryInterval);
            
            return false;
        }
    }

    /**
     * 사용자 타이핑 알림
     * @param {string} roomId - 방 ID (기본값: 'global-chat')
     */
    async notifyTyping(roomId = 'global-chat') {
        if (!this.currentUser) return;
        
        try {
            // 연결 상태 확인
            if (this.connectionStatus !== 'connected' && !this.config.DEBUG.ENABLED) {
                this.logger.warn('타이핑 알림을 보낼 수 없음: 연결 끊김');
                return;
            }
            
            // Presence 채널을 통해 타이핑 상태 전송
            // 실제 구현에서는 Supabase Presence 기능을 사용할 수 있음
            this.logger.debug(`사용자 ${this.currentUser.name}이(가) 타이핑 중...`);
        } catch (error) {
            this.logger.error('타이핑 알림 중 오류 발생:', error);
        }
    }

    /**
     * 연결 상태 가져오기
     * @returns {string} - 연결 상태 ('connected', 'connecting', 'disconnected')
     */
    getConnectionStatus() {
        return this.connectionStatus;
    }

    /**
     * 재연결 시도
     * @returns {Promise<boolean>} - 재연결 성공 여부
     */
    async reconnect() {
        try {
            this.logger.info('Supabase 재연결 시도 중...');
            return await this.init();
        } catch (error) {
            this.logger.error('Supabase 재연결 시도 중 오류 발생:', error);
            return false;
        }
    }
}