/**
 * Supabase 데이터베이스 서비스
 * Supabase 클라이언트를 초기화하고 데이터베이스 관련 작업을 처리합니다.
 */

// 현재 사용 중인 Supabase URL과 Key
const SUPABASE_URL = 'https://dolywnpcrutdxuxkozae.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbHl3bnBjcnV0ZHh1eGtvemFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDEyMDYsImV4cCI6MjA2MjIxNzIwNn0.--UVh_FtCPp23EHzJEejyl9GUX6-6Fao81PlPQDR5G8';

// 예비용 Supabase URL과 Key
const BACKUP_SUPABASE_URL = 'https://veudhigojdukbqfgjeyh.supabase.co';
const BACKUP_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao';

class DBService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.onConnectionStatusChange = null;
    }

    /**
     * Supabase 클라이언트를 초기화합니다.
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            // Supabase 클라이언트 초기화
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            // 연결 테스트
            const { data, error } = await this.supabase.from('chatrooms').select('count', { count: 'exact', head: true });
            
            if (error) {
                console.error('Primary Supabase connection failed, trying backup:', error);
                // 백업 연결 시도
                this.supabase = supabase.createClient(BACKUP_SUPABASE_URL, BACKUP_SUPABASE_KEY);
                const backupTest = await this.supabase.from('chatrooms').select('count', { count: 'exact', head: true });
                
                if (backupTest.error) {
                    console.error('Backup Supabase connection also failed:', backupTest.error);
                    this.initialized = false;
                    if (this.onConnectionStatusChange) {
                        this.onConnectionStatusChange(false);
                    }
                    return false;
                }
            }
            
            this.initialized = true;
            if (this.onConnectionStatusChange) {
                this.onConnectionStatusChange(true);
            }
            return true;
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            this.initialized = false;
            if (this.onConnectionStatusChange) {
                this.onConnectionStatusChange(false);
            }
            return false;
        }
    }

    /**
     * 초기화 상태 확인 및 필요시 초기화 실행
     * @returns {Promise<boolean>} 초기화 상태
     */
    async ensureInitialized() {
        if (!this.initialized) {
            return await this.initialize();
        }
        return true;
    }

    /**
     * 모든 채팅방 목록을 가져옵니다.
     * @param {boolean} activeOnly 활성화된 채팅방만 가져올지 여부
     * @returns {Promise<Array>} 채팅방 목록
     */
    async getChatRooms(activeOnly = false) {
        await this.ensureInitialized();
        
        try {
            let query = this.supabase.from('chatrooms').select('*');
            
            if (activeOnly) {
                query = query.eq('status', 'active');
            }
            
            const { data, error } = await query.order('created_at');
            
            if (error) {
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
            return [];
        }
    }

    /**
     * 특정 채팅방 정보를 가져옵니다.
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Object|null>} 채팅방 정보
     */
    async getChatRoom(roomId) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('chatrooms')
                .select('*')
                .eq('id', roomId)
                .single();
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error(`Error fetching chat room ${roomId}:`, error);
            return null;
        }
    }

    /**
     * 채팅방 접근 가능 여부와 접근 코드 검증
     * @param {string} roomId 채팅방 ID
     * @param {string} accessCode 접근 코드 (비공개 채팅방인 경우)
     * @returns {Promise<{success: boolean, message: string}>} 접근 결과
     */
    async validateRoomAccess(roomId, accessCode = null) {
        await this.ensureInitialized();
        
        try {
            const room = await this.getChatRoom(roomId);
            
            if (!room) {
                return { success: false, message: 'room-not-found' };
            }
            
            if (room.status !== 'active') {
                return { success: false, message: 'room-closed' };
            }
            
            // 현재 접속자 수 확인
            const { count, error: countError } = await this.supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', roomId);
            
            if (countError) {
                throw countError;
            }
            
            if (count >= room.max_users) {
                return { success: false, message: 'room-full' };
            }
            
            // 비공개 채팅방 접근 코드 검증
            if (room.type === 'private') {
                if (!accessCode || accessCode !== room.access_code) {
                    return { success: false, message: 'incorrect-code' };
                }
            }
            
            return { success: true, message: 'access-granted' };
        } catch (error) {
            console.error(`Error validating room access for ${roomId}:`, error);
            return { success: false, message: 'validation-error' };
        }
    }

    /**
     * 채팅방에 새 사용자 추가
     * @param {string} roomId 채팅방 ID
     * @param {string} username 사용자 이름
     * @param {string} preferredLanguage 선호 언어
     * @returns {Promise<{success: boolean, userId: string|null}>} 추가 결과
     */
    async addUserToRoom(roomId, username, preferredLanguage) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('users')
                .insert({
                    room_id: roomId,
                    username: username,
                    preferred_language: preferredLanguage,
                    last_active: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            return { success: true, userId: data.id };
        } catch (error) {
            console.error('Error adding user to room:', error);
            return { success: false, userId: null };
        }
    }

    /**
     * 사용자 정보 업데이트
     * @param {string} userId 사용자 ID
     * @param {Object} updates 업데이트할 정보
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    async updateUser(userId, updates) {
        await this.ensureInitialized();
        
        try {
            const { error } = await this.supabase
                .from('users')
                .update({
                    ...updates,
                    last_active: new Date().toISOString()
                })
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            return false;
        }
    }

    /**
     * 채팅방에서 사용자 삭제 (퇴장)
     * @param {string} userId 사용자 ID
     * @returns {Promise<boolean>} 삭제 성공 여부
     */
    async removeUser(userId) {
        await this.ensureInitialized();
        
        try {
            const { error } = await this.supabase
                .from('users')
                .delete()
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`Error removing user ${userId}:`, error);
            return false;
        }
    }

    /**
     * 사용자 활동 시간 업데이트
     * @param {string} userId 사용자 ID
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    async updateUserActivity(userId) {
        await this.ensureInitialized();
        
        try {
            const { error } = await this.supabase
                .from('users')
                .update({
                    last_active: new Date().toISOString()
                })
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`Error updating user activity for ${userId}:`, error);
            return false;
        }
    }

    /**
     * 채팅방 내 사용자 목록 가져오기
     * @param {string} roomId 채팅방 ID
     * @returns {Promise<Array>} 사용자 목록
     */
    async getRoomUsers(roomId) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('room_id', roomId);
            
            if (error) {
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error(`Error fetching users for room ${roomId}:`, error);
            return [];
        }
    }

    /**
     * 메시지 전송
     * @param {string} roomId 채팅방 ID
     * @param {string} userId 사용자 ID
     * @param {string} username 사용자 이름
     * @param {string} content 메시지 내용
     * @param {string} language 메시지 언어
     * @param {string|null} replyToId 답장 대상 메시지 ID
     * @param {boolean} isAnnouncement 공지사항 여부
     * @returns {Promise<{success: boolean, messageId: string|null}>} 전송 결과
     */
    async sendMessage(roomId, userId, username, content, language, replyToId = null, isAnnouncement = false) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .insert({
                    room_id: roomId,
                    user_id: userId,
                    username: username,
                    content: content,
                    language: language,
                    reply_to: replyToId,
                    is_announcement: isAnnouncement
                })
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, messageId: null };
        }
    }

    /**
     * 메시지 번역 결과 저장
     * @param {string} messageId 메시지 ID
     * @param {string} language 번역 언어
     * @param {string} translation 번역 내용
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async saveTranslation(messageId, language, translation) {
        await this.ensureInitialized();
        
        try {
            const { error } = await this.supabase
                .from('translations')
                .insert({
                    message_id: messageId,
                    language: language,
                    translation: translation
                });
            
            if (error) {
                throw error;
            }
            
            return true;
        } catch (error) {
            console.error(`Error saving translation for message ${messageId}:`, error);
            return false;
        }
    }

    /**
     * 메시지 번역 가져오기
     * @param {string} messageId 메시지 ID
     * @param {string} language 번역 언어
     * @returns {Promise<string|null>} 번역 내용
     */
    async getTranslation(messageId, language) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('translations')
                .select('translation')
                .eq('message_id', messageId)
                .eq('language', language)
                .single();
            
            if (error) {
                return null;
            }
            
            return data.translation;
        } catch (error) {
            console.error(`Error fetching translation for message ${messageId}:`, error);
            return null;
        }
    }

    /**
     * 최근 메시지 가져오기
     * @param {string} roomId 채팅방 ID
     * @param {number} limit 최대 메시지 수
     * @returns {Promise<Array>} 메시지 목록
     */
    async getRecentMessages(roomId, limit = 50) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) {
                throw error;
            }
            
            return (data || []).reverse();
        } catch (error) {
            console.error(`Error fetching recent messages for room ${roomId}:`, error);
            return [];
        }
    }

    /**
     * 특정 메시지 가져오기
     * @param {string} messageId 메시지 ID
     * @returns {Promise<Object|null>} 메시지 정보
     */
    async getMessage(messageId) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .select('*')
                .eq('id', messageId)
                .single();
            
            if (error) {
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error(`Error fetching message ${messageId}:`, error);
            return null;
        }
    }

    /**
     * 관리자 인증
     * @param {string} adminId 관리자 ID
     * @param {string} password 비밀번호
     * @returns {Promise<{success: boolean, adminId: string|null}>} 인증 결과
     */
    async authenticateAdmin(adminId, password) {
        await this.ensureInitialized();
        
        try {
            // 실제 애플리케이션에서는 보안을 위한 인증 방식을 구현해야 합니다
            // 여기서는 간단한 예시로만 구현
            const { data, error } = await this.supabase
                .from('admins')
                .select('*')
                .eq('admin_id', adminId)
                .eq('password', password)  // 실제로는 해시된 비밀번호 비교가 필요
                .single();
            
            if (error) {
                return { success: false, adminId: null };
            }
            
            return { success: true, adminId: data.id };
        } catch (error) {
            console.error('Error authenticating admin:', error);
            return { success: false, adminId: null };
        }
    }
}

// 싱글톤 인스턴스 생성
const dbService = new DBService();
