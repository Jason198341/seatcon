/**
 * Supabase 클라이언트 구현
 * 
 * Supabase 연결 및 데이터베이스 작업, 실시간 구독을 관리합니다.
 * 메시지 관리, 좋아요 기능, 사용자 정보 관리 기능을 제공합니다.
 */

import CONFIG from './config.js';
import translationService from './translation.js';

class SupabaseClient {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.preferredLanguage = 'ko';
        this.messageSubscription = null;
        this.likesSubscription = null;
        
        // 초기화 진행
        this.init();
    }

    /**
     * Supabase 클라이언트 초기화
     */
    async init() {
        // Supabase 클라이언트 생성
        this.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        
        // 저장된 선호 언어 불러오기
        this.preferredLanguage = localStorage.getItem('preferredLanguage') || 'ko';
        
        // 저장된 사용자 정보 불러오기
        this.loadUserInfo();
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('SupabaseClient initialized', {
                url: CONFIG.SUPABASE_URL,
                preferredLanguage: this.preferredLanguage,
                userLoaded: !!this.currentUser
            });
        }
    }

    /**
     * 사용자 정보 불러오기
     */
    loadUserInfo() {
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log('User loaded from localStorage:', this.currentUser.name);
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            this.currentUser = null;
        }
    }

    /**
     * 사용자 정보 저장
     * @param {Object} user - 저장할 사용자 정보
     */
    saveUserInfo(user) {
        if (!user || !user.name || !user.email) {
            console.error('Invalid user data for saving');
            return false;
        }
        
        try {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('User saved to localStorage:', user.name);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving user info:', error);
            return false;
        }
    }

    /**
     * 저장된 사용자 정보 가져오기
     * @returns {Object|null} - 저장된 사용자 정보
     */
    getSavedUserInfo() {
        return this.currentUser;
    }

    /**
     * 사용자 정보 삭제 (로그아웃)
     */
    clearUserInfo() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('User info cleared');
        }
    }

    /**
     * 선호 언어 설정
     * @param {string} languageCode - 언어 코드
     */
    setPreferredLanguage(languageCode) {
        if (!translationService.isSupportedLanguage(languageCode)) {
            console.error(`Unsupported language: ${languageCode}`);
            return false;
        }
        
        this.preferredLanguage = languageCode;
        localStorage.setItem('preferredLanguage', languageCode);
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log(`Preferred language set to: ${languageCode}`);
        }
        
        return true;
    }

    /**
     * 선호 언어 가져오기
     * @returns {string} - 언어 코드
     */
    getPreferredLanguage() {
        return this.preferredLanguage;
    }

    /**
     * 메시지 전송
     * @param {string} content - 메시지 내용
     * @param {string} speakerId - 발표자 ID (기본값: 'global-chat')
     * @returns {Promise<Object|null>} - 전송된 메시지 객체
     */
    async sendMessage(content, speakerId = 'global-chat') {
        if (!this.currentUser || !content.trim()) {
            console.error('Cannot send message: No user or empty content');
            return null;
        }
        
        // 메시지 길이 제한 확인
        if (content.length > CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
            console.error(`Message too long: ${content.length} characters (max: ${CONFIG.CHAT.MAX_MESSAGE_LENGTH})`);
            return null;
        }
        
        // 클라이언트 측 ID 생성 (중복 전송 방지용)
        const clientGeneratedId = Date.now().toString();
        
        try {
            // 메시지 언어 감지
            const detectedLanguage = await translationService.detectLanguage(content);
            
            // 메시지 삽입
            const { data, error } = await this.supabase
                .from('comments')
                .insert([
                    {
                        speaker_id: speakerId,
                        author_name: this.currentUser.name,
                        author_email: this.currentUser.email,
                        content: content,
                        client_generated_id: clientGeneratedId,
                        user_role: this.currentUser.role,
                        language: detectedLanguage || this.preferredLanguage
                    }
                ])
                .select();
                
            if (error) {
                throw error;
            }
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log('Message sent:', {
                    id: data[0].id,
                    content: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                    language: detectedLanguage || this.preferredLanguage
                });
            }
            
            return data[0];
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }

    /**
     * 메시지 가져오기
     * @param {string} speakerId - 발표자 ID (기본값: 'global-chat')
     * @param {number} limit - 가져올 메시지 수 (기본값: 설정의 HISTORY_LOAD_COUNT)
     * @returns {Promise<Array>} - 메시지 배열
     */
    async getMessages(speakerId = 'global-chat', limit = CONFIG.CHAT.HISTORY_LOAD_COUNT) {
        try {
            const { data, error } = await this.supabase
                .from('comments')
                .select('*')
                .eq('speaker_id', speakerId)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                throw error;
            }
            
            // 시간 순으로 정렬
            const messages = data.reverse();
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log(`Loaded ${messages.length} messages for speaker: ${speakerId}`);
            }
            
            // 사용자 선호 언어로 메시지 번역
            const translatedMessages = await translationService.translateMessages(
                messages,
                this.preferredLanguage
            );
            
            return translatedMessages;
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }

    /**
     * 메시지 구독
     * @param {Function} callback - 이벤트 콜백 함수
     */
    subscribeToMessages(callback) {
        console.log('Subscribing to messages...');
        
        // 기존 구독 해제
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
            console.log('Unsubscribed from previous channel');
        }
        
        // 새 메시지 이벤트 구독
        this.messageSubscription = this.supabase
            .channel('public:comments')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'comments' }, 
                async payload => {
                    console.log('Received raw message:', payload);
                    
                    const message = payload.new;
                    
                    // 이미 표시된 메시지인지 확인 (중복 방지)
                    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
                    if (messageElement) {
                        console.log(`Message ${message.id} already displayed, skipping...`);
                        return;
                    }
                    
                    // 메시지 번역 처리
                    const translatedMessage = await this.translateMessageIfNeeded(message);
                    console.log('Translated message ready:', translatedMessage);
                    
                    // 콜백 호출 전 약간의 지연 추가 (렌더링 안정화)
                    setTimeout(() => {
                        callback('new_message', translatedMessage);
                    }, 50);
                }
            )
            .subscribe((status) => {
                console.log(`Supabase realtime subscription status: ${status}`);
            });
            
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Subscribed to new messages');
        }
    }

    /**
     * 메시지 번역 (필요한 경우)
     * @param {Object} message - 번역할 메시지
     * @returns {Promise<Object>} - 번역된 메시지
     */
    async translateMessageIfNeeded(message) {
        // 사용자 언어와 다른 경우에만 번역
        if (message.language !== this.preferredLanguage) {
            return await translationService.translateMessage(message, this.preferredLanguage);
        }
        
        return {
            ...message,
            translatedContent: null,
            isTranslated: false
        };
    }

    /**
     * 좋아요 구독
     * @param {Function} callback - 이벤트 콜백 함수
     */
    subscribeToLikes(callback) {
        // 기존 구독 해제
        if (this.likesSubscription) {
            this.likesSubscription.unsubscribe();
        }
        
        // 좋아요 이벤트 구독
        this.likesSubscription = this.supabase
            .channel('public:message_likes')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'message_likes' }, 
                payload => {
                    const like = payload.new;
                    
                    if (CONFIG.APP.DEBUG_MODE) {
                        console.log('New like received:', {
                            messageId: like.message_id,
                            userName: like.user_name
                        });
                    }
                    
                    callback('new_like', like);
                }
            )
            .on('postgres_changes', 
                { event: 'DELETE', schema: 'public', table: 'message_likes' }, 
                payload => {
                    const oldLike = payload.old;
                    
                    if (CONFIG.APP.DEBUG_MODE) {
                        console.log('Like removed:', {
                            messageId: oldLike.message_id,
                            userName: oldLike.user_name
                        });
                    }
                    
                    callback('remove_like', oldLike);
                }
            )
            .subscribe();
            
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('Subscribed to likes');
        }
    }

    /**
     * 메시지에 좋아요 추가
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<boolean>} - 성공 여부
     */
    async addLike(messageId) {
        if (!this.currentUser) {
            console.error('Cannot add like: No user');
            return false;
        }
        
        try {
            // 이미 좋아요 했는지 확인
            const { data: existingLike, error: checkError } = await this.supabase
                .from('message_likes')
                .select('*')
                .eq('message_id', messageId)
                .eq('user_email', this.currentUser.email)
                .maybeSingle();
                
            if (checkError) {
                throw checkError;
            }
            
            // 이미 좋아요한 경우
            if (existingLike) {
                if (CONFIG.APP.DEBUG_MODE) {
                    console.log(`User already liked message: ${messageId}`);
                }
                return true;
            }
            
            // 좋아요 추가
            const { error } = await this.supabase
                .from('message_likes')
                .insert([
                    {
                        message_id: messageId,
                        user_email: this.currentUser.email,
                        user_name: this.currentUser.name
                    }
                ]);
                
            if (error) {
                throw error;
            }
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log(`Like added to message: ${messageId}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error adding like:', error);
            return false;
        }
    }

    /**
     * 메시지 좋아요 제거
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<boolean>} - 성공 여부
     */
    async removeLike(messageId) {
        if (!this.currentUser) {
            console.error('Cannot remove like: No user');
            return false;
        }
        
        try {
            const { error } = await this.supabase
                .from('message_likes')
                .delete()
                .eq('message_id', messageId)
                .eq('user_email', this.currentUser.email);
                
            if (error) {
                throw error;
            }
            
            if (CONFIG.APP.DEBUG_MODE) {
                console.log(`Like removed from message: ${messageId}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error removing like:', error);
            return false;
        }
    }

    /**
     * 메시지의 좋아요 목록 가져오기
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<Array>} - 좋아요 배열
     */
    async getLikes(messageId) {
        try {
            const { data, error } = await this.supabase
                .from('message_likes')
                .select('*')
                .eq('message_id', messageId);
                
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('Error getting likes:', error);
            return [];
        }
    }

    /**
     * 현재 사용자가 메시지에 좋아요 했는지 확인
     * @param {string} messageId - 메시지 ID
     * @returns {Promise<boolean>} - 좋아요 여부
     */
    async hasLiked(messageId) {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            const { data, error } = await this.supabase
                .from('message_likes')
                .select('id')
                .eq('message_id', messageId)
                .eq('user_email', this.currentUser.email)
                .maybeSingle();
                
            if (error) {
                throw error;
            }
            
            return !!data;
        } catch (error) {
            console.error('Error checking like status:', error);
            return false;
        }
    }

    /**
     * 여러 메시지의 좋아요 정보 가져오기
     * @param {Array} messageIds - 메시지 ID 배열
     * @returns {Promise<Object>} - 메시지 ID를 키로 하는 좋아요 정보 객체
     */
    async getLikesForMessages(messageIds) {
        if (!messageIds || messageIds.length === 0) {
            return {};
        }
        
        try {
            const { data, error } = await this.supabase
                .from('message_likes')
                .select('*')
                .in('message_id', messageIds);
                
            if (error) {
                throw error;
            }
            
            // 메시지 ID별로 좋아요 그룹화
            const likesMap = {};
            
            messageIds.forEach(id => {
                likesMap[id] = [];
            });
            
            data.forEach(like => {
                if (likesMap[like.message_id]) {
                    likesMap[like.message_id].push(like);
                }
            });
            
            return likesMap;
        } catch (error) {
            console.error('Error getting likes for messages:', error);
            return {};
        }
    }

    /**
     * 구독 정리
     */
    cleanup() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
            this.messageSubscription = null;
        }
        
        if (this.likesSubscription) {
            this.likesSubscription.unsubscribe();
            this.likesSubscription = null;
        }
        
        if (CONFIG.APP.DEBUG_MODE) {
            console.log('SupabaseClient cleanup completed');
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const supabaseClient = new SupabaseClient();
export default supabaseClient;
