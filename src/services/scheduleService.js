import { supabase } from './supabase';

/**
 * 모든 일정 목록을 가져옵니다.
 * @param {Object} options - 정렬 및 필터링 옵션
 * @param {string} options.sortBy - 정렬 기준 필드
 * @param {boolean} options.ascending - 오름차순 정렬 여부
 * @param {string} options.startDate - 시작 날짜로 필터링 (YYYY-MM-DD)
 * @param {string} options.endDate - 종료 날짜로 필터링 (YYYY-MM-DD)
 * @param {string} options.type - 일정 타입으로 필터링
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getSchedules = async (options = {}) => {
  try {
    let query = supabase.from('schedules').select('*');

    // 시작 날짜 필터링
    if (options.startDate) {
      query = query.gte('start_date', options.startDate);
    }

    // 종료 날짜 필터링
    if (options.endDate) {
      query = query.lte('end_date', options.endDate);
    }

    // 타입 필터링
    if (options.type) {
      query = query.eq('type', options.type);
    }

    // 정렬
    const sortField = options.sortBy || 'start_date';
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
    console.error('일정 목록 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 ID의 일정 정보를 가져옵니다.
 * @param {number} id - 일정 ID
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getScheduleById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('일정 상세 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 날짜 범위의 일정 목록을 가져옵니다.
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getSchedulesByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .or(`start_date.gte.${startDate},end_date.gte.${startDate}`)
      .or(`start_date.lte.${endDate},end_date.lte.${endDate}`)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('날짜별 일정 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 타입의 일정 목록을 가져옵니다.
 * @param {string} type - 일정 타입
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getSchedulesByType = async (type) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('type', type)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('타입별 일정 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 새 일정을 추가합니다.
 * @param {Object} scheduleData - 추가할 일정 데이터
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const createSchedule = async (scheduleData) => {
  try {
    // 필수 필드 검증
    if (!scheduleData.title || !scheduleData.start_date || !scheduleData.end_date) {
      throw new Error('필수 필드가 누락되었습니다.');
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert([scheduleData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('일정 추가 오류:', error);
    return { data: null, error };
  }
};

/**
 * 일정 정보를 업데이트합니다.
 * @param {number} id - 업데이트할 일정 ID
 * @param {Object} updates - 업데이트할 내용
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const updateSchedule = async (id, updates) => {
  try {
    // 업데이트 일시 추가
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('일정 업데이트 오류:', error);
    return { data: null, error };
  }
};

/**
 * 일정을 삭제합니다.
 * @param {number} id - 삭제할 일정 ID
 * @returns {Promise<{ error }>} 오류
 */
export const deleteSchedule = async (id) => {
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    return { error };
  }
};

/**
 * 특정 위치의 일정 목록을 가져옵니다.
 * @param {string} location - 위치
 * @returns {Promise<{ data, error }>} 결과 및 오류
 */
export const getSchedulesByLocation = async (location) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .ilike('location', `%${location}%`)
      .order('start_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('위치별 일정 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 일정 타입 목록
 */
export const scheduleTypes = [
  { value: '컨퍼런스', label: '컨퍼런스' },
  { value: '워크샵', label: '워크샵' },
  { value: '네트워킹', label: '네트워킹' },
  { value: '전시', label: '전시' },
  { value: '기타', label: '기타' }
];
