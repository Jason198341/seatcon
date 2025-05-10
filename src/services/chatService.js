import { supabase } from './supabase';
import { translateText } from './translation';

/**
 * 모든 채팅방 목록을 가져옵니다.
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getChatRooms = async () => {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('채팅방 목록 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 ID의 채팅방 정보를 가져옵니다.
 * @param {number} id - 채팅방 ID
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getChatRoomById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('채팅방 상세 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 새 채팅방을 생성합니다.
 * @param {Object} chatRoomData - 생성할 채팅방 데이터
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const createChatRoom = async (chatRoomData) => {
  try {
    // 필수 필드 검증
    if (!chatRoomData.name) {
      throw new Error('채팅방 이름은 필수입니다.');
    }

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([chatRoomData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    return { data: null, error };
  }
};

/**
 * 채팅방 정보를 업데이트합니다.
 * @param {number} id - 업데이트할 채팅방 ID
 * @param {Object} updates - 업데이트할 내용
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const updateChatRoom = async (id, updates) => {
  try {
    // 업데이트 일시 추가
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('chat_rooms')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('채팅방 업데이트 오류:', error);
    return { data: null, error };
  }
};

/**
 * 채팅방을 삭제합니다.
 * @param {number} id - 삭제할 채팅방 ID
 * @returns {Promise<{ error }>} 오류
 */
export const deleteChatRoom = async (id) => {
  try {
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('채팅방 삭제 오류:', error);
    return { error };
  }
};

/**
 * 채팅방 메시지 목록을 가져옵니다.
 * @param {number} chatRoomId - 채팅방 ID
 * @param {Object} options - 옵션
 * @param {number} options.limit - 가져올 메시지 수
 * @param {number} options.offset - 시작 오프셋
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getChatMessages = async (chatRoomId, options = { limit: 50, offset: 0 }) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users:user_id (
          id,
          name,
          preferred_language
        ),
        reply_message:reply_to (
          id,
          message,
          user_id,
          users:user_id (
            name
          )
        )
      `)
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) throw error;
    return { data: data.reverse(), error: null };
  } catch (error) {
    console.error('채팅 메시지 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 채팅 통계 정보를 가져옵니다.
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getChatStats = async () => {
  try {
    // 전체 메시지 수 조회
    const { count: totalMessages, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // 채팅방별 메시지 수 조회
    const { data: roomStats, error: roomStatsError } = await supabase
      .from('messages')
      .select('chat_room_id, count')
      .select(`
        chat_rooms:chat_room_id (
          id,
          name
        )
      `)
      .group('chat_room_id')
      .order('count', { ascending: false });
    
    if (roomStatsError) throw roomStatsError;
    
    // 사용자별 메시지 수 조회
    const { data: userStats, error: userStatsError } = await supabase
      .from('messages')
      .select('user_id, count')
      .select(`
        users:user_id (
          id,
          name,
          email
        )
      `)
      .group('user_id')
      .order('count', { ascending: false });
    
    if (userStatsError) throw userStatsError;
    
    // 언어별 메시지 수 조회
    const { data: languageStats, error: languageStatsError } = await supabase
      .from('messages')
      .select('original_language, count')
      .group('original_language')
      .order('count', { ascending: false });
    
    if (languageStatsError) throw languageStatsError;
    
    // 최근 활동 통계
    const { data: recentActivity, error: recentActivityError } = await supabase
      .from('messages')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (recentActivityError) throw recentActivityError;
    
    // 일별 메시지 통계
    const { data: dailyStats, error: dailyStatsError } = await supabase
      .from('messages')
      .select('created_at')
      .order('created_at', { ascending: false });
    
    if (dailyStatsError) throw dailyStatsError;
    
    // 일별 통계 계산
    const dailyCount = {};
    if (dailyStats) {
      dailyStats.forEach(msg => {
        const date = new Date(msg.created_at).toISOString().split('T')[0];
        dailyCount[date] = (dailyCount[date] || 0) + 1;
      });
    }
    
    const dailyActivity = Object.entries(dailyCount)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      data: {
        totalMessages,
        roomStats,
        userStats,
        languageStats,
        recentActivity,
        dailyActivity
      },
      error: null
    };
  } catch (error) {
    console.error('채팅 통계 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 채팅 메시지를 전송합니다.
 * @param {Object} messageData - 메시지 데이터
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const sendMessage = async (messageData) => {
  try {
    // 필수 필드 검증
    if (!messageData.chat_room_id || !messageData.user_id || !messageData.message) {
      throw new Error('필수 필드가 누락되었습니다.');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    return { data: null, error };
  }
};

/**
 * 메시지를 수정합니다.
 * @param {number} id - 메시지 ID
 * @param {Object} updates - 업데이트할 내용
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const updateMessage = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('메시지 수정 오류:', error);
    return { data: null, error };
  }
};

/**
 * 메시지를 삭제합니다.
 * @param {number} id - 메시지 ID
 * @returns {Promise<{ error }>} 오류
 */
export const deleteMessage = async (id) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('메시지 삭제 오류:', error);
    return { error };
  }
};

/**
 * 메시지를 특정 언어로 번역합니다.
 * @param {string} message - 원본 메시지
 * @param {string} sourceLanguage - 원본 언어 코드
 * @param {string} targetLanguage - 대상 언어 코드
 * @returns {Promise<{ translatedText, error }>} 번역 결과 및 오류
 */
export const translateMessage = async (message, sourceLanguage, targetLanguage) => {
  try {
    // 같은 언어면 번역하지 않음
    if (sourceLanguage === targetLanguage) {
      return { translatedText: message, error: null };
    }

    const { translatedText, error } = await translateText(message, sourceLanguage, targetLanguage);
    
    if (error) throw error;
    return { translatedText, error: null };
  } catch (error) {
    console.error('메시지 번역 오류:', error);
    return { translatedText: null, error };
  }
};

/**
 * 채팅방 실시간 구독 설정
 * @param {number} chatRoomId - 채팅방 ID
 * @param {Function} callback - 메시지 수신 시 호출할 콜백 함수
 * @returns {Object} 구독 객체
 */
export const subscribeToChatRoom = (chatRoomId, callback) => {
  return supabase
    .channel(`chat_room_${chatRoomId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_room_id=eq.${chatRoomId}`
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
};
