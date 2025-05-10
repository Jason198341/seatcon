# 시트 컨퍼런스 앱 서비스 레이어

이 폴더에는 Supabase 데이터베이스와 통신하는 서비스 함수들이 포함되어 있습니다.

## 서비스 파일 목록

1. **supabase.js**: Supabase 클라이언트 설정
2. **exhibitService.js**: 전시물 관련 CRUD 기능
3. **scheduleService.js**: 컨퍼런스 일정 관련 CRUD 기능
4. **presentationService.js**: 발표 일정 관련 CRUD 기능
5. **translation.js**: Google Translation API를 활용한 번역 기능

## presentationService.js

발표 일정(presentations) 테이블에 대한 CRUD 및 검색, 통계 기능을 제공합니다.

### 주요 함수

#### 기본 CRUD 기능
- `getPresentations()`: 모든 발표 일정 가져오기
- `getPresentationById(id)`: ID로 특정 발표 일정 가져오기
- `createPresentation(presentationData)`: 새 발표 일정 생성
- `updatePresentation(id, updates)`: 발표 일정 정보 업데이트
- `deletePresentation(id)`: 발표 일정 삭제

#### 필터링 기능
- `getPresentationsByDate(date)`: 특정 날짜의 발표 일정 가져오기
- `getPresentationsByType(type)`: 특정 유형의 발표 일정 가져오기
- `getPresentationsByCompany(company)`: 특정 회사의 발표 일정 가져오기
- `getPresentationsByPresenter(presenterName)`: 특정 발표자의 발표 일정 가져오기
- `getPresentationsByLocation(location)`: 특정 장소의 발표 일정 가져오기

#### 고급 기능
- `checkTimeConflicts(presentationData, excludeId)`: 발표 일정 시간 충돌 확인
- `getPresentationStats()`: 발표 일정 통계 정보 가져오기
- `searchPresentations(searchParams)`: 검색 조건에 따른 발표 일정 검색

### 사용 예시

```javascript
import { 
  getPresentations, 
  createPresentation, 
  getPresentationsByDate 
} from '../services/presentationService';

// 모든 발표 일정 가져오기
const fetchAllPresentations = async () => {
  const { data, error } = await getPresentations();
  if (error) {
    console.error('발표 일정 로딩 오류:', error);
    return;
  }
  console.log('발표 일정:', data);
};

// 새 발표 일정 생성
const addNewPresentation = async () => {
  const newPresentation = {
    title: '신규 발표',
    presenter_name: '홍길동',
    company: '예시 회사',
    type: '협력사',
    start_time: '10:00',
    end_time: '10:30',
    date: '2025-05-15',
    location: '메인 홀'
  };
  
  const { data, error } = await createPresentation(newPresentation);
  if (error) {
    console.error('발표 일정 생성 오류:', error);
    return;
  }
  console.log('생성된 발표 일정:', data);
};

// 특정 날짜의 발표 일정 가져오기
const fetchPresentationsByDate = async (date) => {
  const { data, error } = await getPresentationsByDate(date);
  if (error) {
    console.error('날짜별 발표 일정 로딩 오류:', error);
    return;
  }
  console.log(`${date} 발표 일정:`, data);
};
```

## 테스트

`src/utils/tests/testPresentationService.js` 파일을 통해 presentationService.js의 모든 기능을 테스트할 수 있습니다.
