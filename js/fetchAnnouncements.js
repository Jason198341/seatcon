// 공지사항 가져오기 - 임시 수정 버전
async function fetchAnnouncements(roomId) {
  try {
    // 먼저 테이블 구조를 확인합니다
    const { data: tableInfo, error: tableError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    // 테이블에 isAnnouncement 필드가 없다면 조용히 무시합니다
    if (tableError || !tableInfo || tableInfo.length === 0) {
      debug('메시지 테이블 구조 확인 필요');
      return;
    }
    
    // isAnnouncement 필드가 있는지 확인
    const hasAnnouncementField = tableInfo[0].hasOwnProperty('isAnnouncement');
    
    if (!hasAnnouncementField) {
      debug('isAnnouncement 필드 없음, 공지사항 기능 비활성화');
      return;
    }
    
    // 정상적으로 공지사항 조회
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', ADMIN_ID)
      .eq('isAnnouncement', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    if (data && data.length > 0) {
      addAnnouncement(data[0]);
    }
  } catch (error) {
    console.error('공지사항 가져오기 오류:', error);
    // 조용히 실패 처리
  }
}