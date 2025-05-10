import { supabase } from './supabase';

/**
 * 모든 전시물 목록을 가져옵니다.
 */
export const getExhibits = async () => {
  try {
    const { data, error } = await supabase
      .from('exhibits')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('전시물 목록 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 특정 ID의 전시물 정보를 가져옵니다.
 */
export const getExhibitById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('exhibits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('전시물 상세 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 새 전시물을 추가합니다.
 */
export const createExhibit = async (exhibitData) => {
  try {
    const { data, error } = await supabase
      .from('exhibits')
      .insert([exhibitData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('전시물 추가 오류:', error);
    return { data: null, error };
  }
};

/**
 * 전시물 정보를 업데이트합니다.
 */
export const updateExhibit = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('exhibits')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('전시물 업데이트 오류:', error);
    return { data: null, error };
  }
};

/**
 * 전시물을 삭제합니다.
 */
export const deleteExhibit = async (id) => {
  try {
    const { error } = await supabase
      .from('exhibits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('전시물 삭제 오류:', error);
    return { error };
  }
};
