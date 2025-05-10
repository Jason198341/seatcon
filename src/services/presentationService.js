import { supabase } from './supabase';

/**
 * 모든 발표 목록을 가져옵니다.
 * @param {Object} options - 정렬 및 필터링 옵션
 * @param {string} options.sortBy - 정렬 기준 필드
 * @param {boolean} options.ascending - 오름차순 정렬 여부
 * @param {string} options.date - 특정 날짜로 필터링 (YYYY-MM-DD)
 * @param {string} options.type - 특정 타입으로 필터링
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getPresentations = async (options = {}) => {
  try {
    let query = supabase.from('presentations').select('*');

    // 날짜 필터링
    if (options.date) {
      query = query.eq('date', options.date);
    }

    // 타입 필터링
    if (options.type) {
      query = query.eq('type', options.type);
    }

    // 정렬
    const sortField = options.sortBy || 'date';
    const sortOrder = options.ascending ? 'asc' : 'desc';
    query = query.order(sortField, { ascending: options.ascending });

    // 시간순 2차 정렬
    if (sortField !== 'start_time') {
      query = query.order('start_time', { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('발표 목록 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 ID의 발표 정보를 가져옵니다.
 * @param {number} id - 발표 ID
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getPresentationById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('발표 상세 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 날짜의 발표 목록을 가져옵니다.
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getPresentationsByDate = async (date) => {
  try {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('날짜별 발표 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 타입의 발표 목록을 가져옵니다.
 * @param {string} type - 발표 타입
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getPresentationsByType = async (type) => {
  try {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('type', type)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('타입별 발표 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 발표자의 발표 목록을 가져옵니다.
 * @param {string} presenter - 발표자 이름
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getPresentationsByPresenter = async (presenter) => {
  try {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .ilike('presenter_name', `%${presenter}%`)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('발표자별 발표 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 새 발표를 추가합니다.
 * @param {Object} presentationData - 추가할 발표 데이터
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const createPresentation = async (presentationData) => {
  try {
    // 필수 필드 검증
    if (!presentationData.title || !presentationData.presenter_name || !presentationData.date || !presentationData.start_time || !presentationData.end_time) {
      throw new Error('필수 필드가 누락되었습니다.');
    }

    const { data, error } = await supabase
      .from('presentations')
      .insert([presentationData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('발표 추가 오류:', error);
    return { data: null, error };
  }
};

/**
 * 발표 정보를 업데이트합니다.
 * @param {number} id - 업데이트할 발표 ID
 * @param {Object} updates - 업데이트할 내용
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const updatePresentation = async (id, updates) => {
  try {
    // 업데이트 일시 추가
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('presentations')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('발표 업데이트 오류:', error);
    return { data: null, error };
  }
};

/**
 * 발표를 삭제합니다.
 * @param {number} id - 삭제할 발표 ID
 * @returns {Promise<{ error }>} 오류
 */
export const deletePresentation = async (id) => {
  try {
    const { error } = await supabase
      .from('presentations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('발표 삭제 오류:', error);
    return { error };
  }
};

/**
 * 발표 타입 목록을 가져옵니다.
 * @returns {Array} 발표 타입 목록
 */
export const presentationTypes = [
  { value: '협력사', label: '협력사' },
  { value: '남양연구소', label: '남양연구소' },
  { value: '해외연구소', label: '해외연구소' },
  { value: '인도로컬', label: '인도로컬' }
];
