// presentationService 테스트 파일
import { 
  getPresentations, 
  getPresentationsByDate, 
  getPresentationById, 
  createPresentation, 
  updatePresentation,
  deletePresentation,
  getPresentationsByType,
  getPresentationsByCompany,
  getPresentationsByPresenter,
  getPresentationsByLocation,
  checkTimeConflicts,
  getPresentationStats,
  searchPresentations
} from '../../services/presentationService';

/**
 * 모든 발표 일정 가져오기 테스트
 */
const testGetPresentations = async () => {
  console.log('==== 모든 발표 일정 가져오기 테스트 ====');
  try {
    const { data, error } = await getPresentations();
    if (error) throw error;
    console.log(`총 ${data.length}개의 발표 일정이 조회되었습니다.`);
    console.log(data.slice(0, 2)); // 처음 2개 항목만 출력
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 날짜별 발표 일정 가져오기 테스트
 */
const testGetPresentationsByDate = async (date) => {
  console.log(`==== ${date} 날짜의 발표 일정 가져오기 테스트 ====`);
  try {
    const { data, error } = await getPresentationsByDate(date);
    if (error) throw error;
    console.log(`${date} 날짜에 ${data.length}개의 발표 일정이 있습니다.`);
    console.log(data.map(p => `${p.start_time}-${p.end_time} ${p.title} (${p.presenter_name}, ${p.company})`));
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * ID로 발표 일정 가져오기 테스트
 */
const testGetPresentationById = async (id) => {
  console.log(`==== ID ${id}의 발표 일정 가져오기 테스트 ====`);
  try {
    const { data, error } = await getPresentationById(id);
    if (error) throw error;
    console.log('발표 일정 상세:');
    console.log(data);
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 발표 일정 생성 테스트
 */
const testCreatePresentation = async () => {
  console.log('==== 새 발표 일정 생성 테스트 ====');
  const newPresentation = {
    title: '테스트 발표',
    presenter_name: '테스트 발표자',
    company: '테스트 회사',
    type: '협력사',
    start_time: '14:00',
    end_time: '14:30',
    date: '2025-05-13',
    location: '테스트 홀'
  };
  
  try {
    const { data, error } = await createPresentation(newPresentation);
    if (error) throw error;
    console.log('새 발표 일정이 생성되었습니다:');
    console.log(data);
    return data[0].id; // 생성된 ID 반환
  } catch (error) {
    console.error('테스트 실패:', error);
    return null;
  }
};

/**
 * 발표 일정 업데이트 테스트
 */
const testUpdatePresentation = async (id) => {
  console.log(`==== ID ${id}의 발표 일정 업데이트 테스트 ====`);
  const updates = {
    title: '수정된 테스트 발표',
    start_time: '14:30',
    end_time: '15:00'
  };
  
  try {
    const { data, error } = await updatePresentation(id, updates);
    if (error) throw error;
    console.log('발표 일정이 업데이트되었습니다:');
    console.log(data);
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 발표 일정 삭제 테스트
 */
const testDeletePresentation = async (id) => {
  console.log(`==== ID ${id}의 발표 일정 삭제 테스트 ====`);
  try {
    const { error } = await deletePresentation(id);
    if (error) throw error;
    console.log(`ID ${id}의 발표 일정이 삭제되었습니다.`);
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 유형별 발표 일정 가져오기 테스트
 */
const testGetPresentationsByType = async (type) => {
  console.log(`==== '${type}' 유형의 발표 일정 가져오기 테스트 ====`);
  try {
    const { data, error } = await getPresentationsByType(type);
    if (error) throw error;
    console.log(`'${type}' 유형에 ${data.length}개의 발표 일정이 있습니다.`);
    console.log(data.slice(0, 3).map(p => `${p.date} ${p.start_time}-${p.end_time} ${p.title}`));
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 회사별 발표 일정 가져오기 테스트
 */
const testGetPresentationsByCompany = async (company) => {
  console.log(`==== '${company}' 회사의 발표 일정 가져오기 테스트 ====`);
  try {
    const { data, error } = await getPresentationsByCompany(company);
    if (error) throw error;
    console.log(`'${company}' 회사에 ${data.length}개의 발표 일정이 있습니다.`);
    console.log(data.map(p => `${p.date} ${p.start_time}-${p.end_time} ${p.title} (${p.presenter_name})`));
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 발표자별 발표 일정 가져오기 테스트
 */
const testGetPresentationsByPresenter = async (presenterName) => {
  console.log(`==== '${presenterName}' 발표자의 발표 일정 가져오기 테스트 ====`);
  try {
    const { data, error } = await getPresentationsByPresenter(presenterName);
    if (error) throw error;
    console.log(`'${presenterName}' 발표자에 ${data.length}개의 발표 일정이 있습니다.`);
    console.log(data.map(p => `${p.date} ${p.start_time}-${p.end_time} ${p.title} (${p.company})`));
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 장소별 발표 일정 가져오기 테스트
 */
const testGetPresentationsByLocation = async (location) => {
  console.log(`==== '${location}' 장소의 발표 일정 가져오기 테스트 ====`);
  try {
    const { data, error } = await getPresentationsByLocation(location);
    if (error) throw error;
    console.log(`'${location}' 장소에 ${data.length}개의 발표 일정이 있습니다.`);
    console.log(data.slice(0, 5).map(p => `${p.date} ${p.start_time}-${p.end_time} ${p.title}`));
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 시간 충돌 확인 테스트
 */
const testCheckTimeConflicts = async () => {
  console.log('==== 시간 충돌 확인 테스트 ====');
  const testCase = {
    date: '2025-05-10',
    start_time: '09:15',
    end_time: '09:45',
    location: '메인 컨퍼런스홀'
  };
  
  try {
    const { hasConflict, conflictingPresentations, error } = await checkTimeConflicts(testCase);
    if (error) throw error;
    
    if (hasConflict) {
      console.log('시간 충돌이 발견되었습니다:');
      console.log(conflictingPresentations.map(p => `${p.date} ${p.start_time}-${p.end_time} ${p.title}`));
    } else {
      console.log('시간 충돌이 없습니다.');
    }
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 발표 일정 통계 가져오기 테스트
 */
const testGetPresentationStats = async () => {
  console.log('==== 발표 일정 통계 가져오기 테스트 ====');
  try {
    const { data, error } = await getPresentationStats();
    if (error) throw error;
    
    console.log('발표 일정 통계:');
    console.log(`총 발표 수: ${data.total}`);
    console.log('유형별 발표 수:');
    console.log(data.byType);
    console.log('회사별 발표 수 (상위 3개):');
    const companySortedEntries = Object.entries(data.byCompany)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    console.log(Object.fromEntries(companySortedEntries));
    console.log('날짜별 발표 수:');
    console.log(data.byDate);
    console.log('장소별 발표 수:');
    console.log(data.byLocation);
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 발표 일정 검색 테스트
 */
const testSearchPresentations = async () => {
  console.log('==== 발표 일정 검색 테스트 ====');
  const searchParams = {
    title: '시트', // '시트'가 제목에 포함된 발표 검색
    type: '협력사' // '협력사' 유형의 발표만 검색
  };
  
  try {
    const { data, error } = await searchPresentations(searchParams);
    if (error) throw error;
    
    console.log(`검색 결과: ${data.length}개의 발표 일정이 있습니다.`);
    console.log(data.map(p => `${p.date} ${p.start_time}-${p.end_time} ${p.title} (${p.type})`));
  } catch (error) {
    console.error('테스트 실패:', error);
  }
};

/**
 * 모든 테스트 실행
 */
const runAllTests = async () => {
  console.log('======== presentationService 테스트 시작 ========');
  
  // 기본 CRUD 테스트
  await testGetPresentations();
  const idToTest = await testCreatePresentation();
  if (idToTest) {
    await testGetPresentationById(idToTest);
    await testUpdatePresentation(idToTest);
    await testDeletePresentation(idToTest);
  }
  
  // 필터링 테스트
  await testGetPresentationsByDate('2025-05-10');
  await testGetPresentationsByType('협력사');
  await testGetPresentationsByCompany('현대트랜시스');
  await testGetPresentationsByPresenter('이진성');
  await testGetPresentationsByLocation('메인 컨퍼런스홀');
  
  // 고급 기능 테스트
  await testCheckTimeConflicts();
  await testGetPresentationStats();
  await testSearchPresentations();
  
  console.log('======== presentationService 테스트 완료 ========');
};

// 테스트 실행
// runAllTests();

// 개별 테스트 실행
// testGetPresentations();

// 모듈 내보내기
export {
  runAllTests,
  testGetPresentations,
  testGetPresentationsByDate,
  testGetPresentationById,
  testCreatePresentation,
  testUpdatePresentation,
  testDeletePresentation,
  testGetPresentationsByType,
  testGetPresentationsByCompany,
  testGetPresentationsByPresenter,
  testGetPresentationsByLocation,
  testCheckTimeConflicts,
  testGetPresentationStats,
  testSearchPresentations
};
