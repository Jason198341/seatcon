/**
 * 2025 글로벌 시트 컨퍼런스 채팅
 * Supabase 초기화 및 설정
 * 작성일: 2025-05-07
 */

// Supabase 클라이언트 초기화
const SUPABASE_URL = 'https://veudhigojdukbqfgjeyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldWRoaWdvamR1a2JxZmdqZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODgwNjIsImV4cCI6MjA2MDk2NDA2Mn0.Vh0TUArZacAuRiLeoxml26u9GJxSOrziUhC3vURJVao';

// supabase 객체가 전역으로 사용 가능하도록 설정
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 데이터베이스 스키마
 * 
 * 'users' 테이블:
 * - id: uuid (PK)
 * - username: text (not null)
 * - preferred_language: text (not null, default: 'ko')
 * - role: text (not null, default: 'participant')
 * - avatar_url: text
 * - created_at: timestamp with time zone (default: now())
 * 
 * 'categories' 테이블:
 * - id: uuid (PK)
 * - name: text (not null)
 * - description: text
 * - created_at: timestamp with time zone (default: now())
 * 
 * 'rooms' 테이블:
 * - id: uuid (PK)
 * - name: text (not null)
 * - description: text
 * - category_id: uuid (FK -> categories.id)
 * - created_at: timestamp with time zone (default: now())
 * - created_by: uuid (FK -> users.id)
 * - is_active: boolean (default: true)
 * 
 * 'messages' 테이블:
 * - id: uuid (PK)
 * - room_id: uuid (FK -> rooms.id)
 * - user_id: uuid (FK -> users.id)
 * - content: text (not null)
 * - original_language: text (not null)
 * - created_at: timestamp with time zone (default: now())
 * - reply_to_id: uuid (FK -> messages.id, nullable)
 * - is_pinned: boolean (default: false)
 * - is_deleted: boolean (default: false)
 * 
 * 'translation_cache' 테이블:
 * - id: uuid (PK)
 * - original_text: text (not null)
 * - target_language: text (not null)
 * - translated_text: text (not null)
 * - created_at: timestamp with time zone (default: now())
 * 
 * 'likes' 테이블:
 * - id: uuid (PK)
 * - message_id: uuid (FK -> messages.id)
 * - user_id: uuid (FK -> users.id)
 * - created_at: timestamp with time zone (default: now())
 */

/**
 * 사용자 생성 함수
 * @param {string} username - 사용자 이름
 * @param {string} preferredLanguage - 선호 언어 (기본값: 'ko')
 * @param {string} role - 역할 (기본값: 'participant')
 * @param {string} avatarUrl - 아바타 URL
 * @returns {Promise} - Supabase 응답 Promise
 */
async function createUser(username, preferredLanguage = 'ko', role = 'participant', avatarUrl = null) {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    preferred_language: preferredLanguage,
                    role,
                    avatar_url: avatarUrl
                }
            ])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('사용자 생성 오류:', error.message);
        throw error;
    }
}

/**
 * 채팅방 생성 함수
 * @param {string} name - 채팅방 이름
 * @param {string} description - 채팅방 설명
 * @param {string} categoryId - 카테고리 ID
 * @param {string} createdBy - 생성자 ID
 * @returns {Promise} - Supabase 응답 Promise
 */
async function createRoom(name, description, categoryId, createdBy) {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .insert([
                {
                    name,
                    description,
                    category_id: categoryId,
                    created_by: createdBy
                }
            ])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('채팅방 생성 오류:', error.message);
        throw error;
    }
}

/**
 * 카테고리 생성 함수
 * @param {string} name - 카테고리 이름
 * @param {string} description - 카테고리 설명
 * @returns {Promise} - Supabase 응답 Promise
 */
async function createCategory(name, description) {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([
                {
                    name,
                    description
                }
            ])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('카테고리 생성 오류:', error.message);
        throw error;
    }
}

/**
 * 메시지 생성 함수
 * @param {string} roomId - 채팅방 ID
 * @param {string} userId - 사용자 ID
 * @param {string} content - 메시지 내용
 * @param {string} originalLanguage - 원본 언어
 * @param {string} replyToId - 답장 대상 메시지 ID (옵션)
 * @returns {Promise} - Supabase 응답 Promise
 */
async function createMessage(roomId, userId, content, originalLanguage, replyToId = null) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([
                {
                    room_id: roomId,
                    user_id: userId,
                    content,
                    original_language: originalLanguage,
                    reply_to_id: replyToId
                }
            ])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('메시지 생성 오류:', error.message);
        throw error;
    }
}

/**
 * 번역 캐시 저장 함수
 * @param {string} originalText - 원본 텍스트
 * @param {string} targetLanguage - 대상 언어
 * @param {string} translatedText - 번역된 텍스트
 * @returns {Promise} - Supabase 응답 Promise
 */
async function cacheTranslation(originalText, targetLanguage, translatedText) {
    try {
        const { data, error } = await supabase
            .from('translation_cache')
            .insert([
                {
                    original_text: originalText,
                    target_language: targetLanguage,
                    translated_text: translatedText
                }
            ]);
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('번역 캐시 저장 오류:', error.message);
        // 번역 캐시 저장 실패는 치명적인 오류가 아니므로 오류를 발생시키지 않음
        return false;
    }
}

/**
 * 번역 캐시 검색 함수
 * @param {string} originalText - 원본 텍스트
 * @param {string} targetLanguage - 대상 언어
 * @returns {Promise<string|null>} - 번역된 텍스트 또는 null
 */
async function getTranslationFromCache(originalText, targetLanguage) {
    try {
        const { data, error } = await supabase
            .from('translation_cache')
            .select('translated_text')
            .eq('original_text', originalText)
            .eq('target_language', targetLanguage)
            .limit(1);
        
        if (error) throw error;
        
        return data.length > 0 ? data[0].translated_text : null;
    } catch (error) {
        console.error('번역 캐시 검색 오류:', error.message);
        return null;
    }
}

/**
 * 메시지에 좋아요 추가 함수
 * @param {string} messageId - 메시지 ID
 * @param {string} userId - 사용자 ID
 * @returns {Promise} - Supabase 응답 Promise
 */
async function addLike(messageId, userId) {
    try {
        // 이미 좋아요를 눌렀는지 확인
        const { data: existingLike, error: checkError } = await supabase
            .from('likes')
            .select('id')
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .limit(1);
        
        if (checkError) throw checkError;
        
        // 이미 좋아요가 있으면 제거 (토글 기능)
        if (existingLike.length > 0) {
            const { error: deleteError } = await supabase
                .from('likes')
                .delete()
                .eq('id', existingLike[0].id);
            
            if (deleteError) throw deleteError;
            
            return { added: false, id: null };
        } else {
            // 새로운 좋아요 추가
            const { data, error } = await supabase
                .from('likes')
                .insert([
                    {
                        message_id: messageId,
                        user_id: userId
                    }
                ])
                .select();
            
            if (error) throw error;
            
            return { added: true, id: data[0].id };
        }
    } catch (error) {
        console.error('좋아요 추가/제거 오류:', error.message);
        throw error;
    }
}

/**
 * 메시지 고정/고정 해제 함수
 * @param {string} messageId - 메시지 ID
 * @param {boolean} isPinned - 고정 여부
 * @returns {Promise} - Supabase 응답 Promise
 */
async function togglePinMessage(messageId, isPinned) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .update({ is_pinned: isPinned })
            .eq('id', messageId)
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('메시지 고정/고정 해제 오류:', error.message);
        throw error;
    }
}

/**
 * 카테고리별 채팅방 목록 조회 함수
 * @returns {Promise} - 카테고리 및 채팅방 목록
 */
async function getRoomsWithCategories() {
    try {
        // 카테고리 목록 가져오기
        const { data: categories, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (categoryError) throw categoryError;
        
        // 활성화된 채팅방 목록 가져오기
        const { data: rooms, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('is_active', true)
            .order('name');
        
        if (roomError) throw roomError;
        
        // 카테고리별 채팅방 구성
        const result = categories.map(category => {
            const categoryRooms = rooms.filter(room => room.category_id === category.id);
            return {
                category,
                rooms: categoryRooms
            };
        });
        
        return result;
    } catch (error) {
        console.error('채팅방 목록 조회 오류:', error.message);
        throw error;
    }
}

/**
 * 채팅방 메시지 목록 조회 함수
 * @param {string} roomId - 채팅방 ID
 * @param {number} limit - 조회할 메시지 수 (기본값: 50)
 * @returns {Promise} - 메시지 목록
 */
async function getMessages(roomId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                user:user_id (id, username, role, avatar_url),
                reply_to:reply_to_id (
                    id, 
                    content, 
                    user_id (id, username)
                ),
                likes (
                    id,
                    user_id
                )
            `)
            .eq('room_id', roomId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(limit);
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('메시지 목록 조회 오류:', error.message);
        throw error;
    }
}

/**
 * 고정된 메시지 조회 함수
 * @param {string} roomId - 채팅방 ID
 * @returns {Promise} - 고정된 메시지 목록
 */
async function getPinnedMessages(roomId) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                user:user_id (id, username, role, avatar_url)
            `)
            .eq('room_id', roomId)
            .eq('is_pinned', true)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('고정된 메시지 조회 오류:', error.message);
        throw error;
    }
}

/**
 * 메시지 실시간 구독 함수
 * @param {string} roomId - 채팅방 ID
 * @param {Function} callback - 새 메시지 수신 시 호출할 콜백 함수
 * @returns {Object} - 구독 객체 (구독 취소에 사용)
 */
function subscribeToMessages(roomId, callback) {
    return supabase
        .channel(`messages:room=${roomId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`
        }, payload => {
            callback(payload.new);
        })
        .subscribe();
}

/**
 * 메시지 수정 실시간 구독 함수
 * @param {string} roomId - 채팅방 ID
 * @param {Function} callback - 메시지 수정 시 호출할 콜백 함수
 * @returns {Object} - 구독 객체 (구독 취소에 사용)
 */
function subscribeToMessageUpdates(roomId, callback) {
    return supabase
        .channel(`message-updates:room=${roomId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`
        }, payload => {
            callback(payload.new);
        })
        .subscribe();
}

/**
 * 좋아요 실시간 구독 함수
 * @param {Function} callback - 좋아요 추가/제거 시 호출할 콜백 함수
 * @returns {Object} - 구독 객체 (구독 취소에 사용)
 */
function subscribeToLikes(callback) {
    return supabase
        .channel('likes-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'likes'
        }, payload => {
            callback(payload);
        })
        .subscribe();
}

// Supabase 함수를 전역으로 내보내기
window.supabaseService = {
    createUser,
    createRoom,
    createCategory,
    createMessage,
    cacheTranslation,
    getTranslationFromCache,
    addLike,
    togglePinMessage,
    getRoomsWithCategories,
    getMessages,
    getPinnedMessages,
    subscribeToMessages,
    subscribeToMessageUpdates,
    subscribeToLikes
};
