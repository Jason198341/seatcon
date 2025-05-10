import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSchedules, scheduleTypes } from '../../services/scheduleService';
import { useAuth } from '../../utils/auth';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 일정 목록 컴포넌트
 */
const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortAscending, setSortAscending] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // 데이터 로딩
  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);
      try {
        const { data, error } = await getSchedules({
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
          type: filterType || undefined,
          sortBy,
          ascending: sortAscending,
        });
        
        if (error) throw error;
        setSchedules(data);
      } catch (err) {
        console.error('일정 목록 로드 오류:', err);
        setError('일정 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSchedules();
  }, [filterStartDate, filterEndDate, filterType, sortBy, sortAscending]);
  
  // 일정 날짜별로 그룹화
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    // 시작 날짜부터 종료 날짜까지의 모든 날짜에 일정 추가
    const startDate = parseISO(schedule.start_date);
    const endDate = parseISO(schedule.end_date);
    
    // 각 날짜를 키로 사용하여 해당 날짜에 일정 추가
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      // 해당 날짜가 시작 또는 종료 날짜인지 표시
      const isStartDate = format(startDate, 'yyyy-MM-dd') === dateKey;
      const isEndDate = format(endDate, 'yyyy-MM-dd') === dateKey;
      
      acc[dateKey].push({
        ...schedule,
        isStartDate,
        isEndDate,
        dateStatus: isStartDate && isEndDate ? 'single' : isStartDate ? 'start' : isEndDate ? 'end' : 'middle'
      });
      
      // 다음 날짜로 이동
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return acc;
  }, {});
  
  // 정렬 변경 핸들러
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortBy(field);
      setSortAscending(true);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 필터 및 정렬 */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('시작 날짜')}
            </label>
            <input
              id="start-date-filter"
              type="date"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('종료 날짜')}
            </label>
            <input
              id="end-date-filter"
              type="date"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              min={filterStartDate}
            />
          </div>
          
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('유형별 필터링')}
            </label>
            <select
              id="type-filter"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">{t('모든 유형')}</option>
              {scheduleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(type.label)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              {t('정렬 기준')}
            </label>
            <div className="flex space-x-2">
              <select
                id="sort-by"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="start_date">{t('시작 날짜')}</option>
                <option value="end_date">{t('종료 날짜')}</option>
                <option value="title">{t('제목')}</option>
                <option value="type">{t('유형')}</option>
                <option value="location">{t('위치')}</option>
              </select>
              
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setSortAscending(!sortAscending)}
              >
                {sortAscending ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 관리자 버튼 */}
      {user?.profile?.role === 'admin' && (
        <div className="flex justify-end">
          <Link
            to="/admin/schedules/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t('새 일정 추가')}
          </Link>
        </div>
      )}
      
      {/* 로딩 및 에러 */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">{t('일정 목록을 불러오는 중...')}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{t(error)}</span>
        </div>
      )}
      
      {/* 일정 목록 */}
      {!loading && !error && Object.keys(schedulesByDate).length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">{t('표시할 일정이 없습니다.')}</p>
          {(filterStartDate || filterEndDate || filterType) && (
            <p className="text-sm text-gray-400 mt-1">{t('필터를 조정해 보세요.')}</p>
          )}
        </div>
      )}
      
      {!loading && !error && Object.keys(schedulesByDate).length > 0 && (
        <div className="space-y-8">
          {Object.keys(schedulesByDate)
            .sort((a, b) => sortAscending ? a.localeCompare(b) : b.localeCompare(a))
            .map((date) => (
              <div key={date} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-indigo-600 px-4 py-3">
                  <h3 className="text-lg font-medium text-white">
                    {format(new Date(date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                  </h3>
                </div>
                
                <ul className="divide-y divide-gray-200">
                  {schedulesByDate[date].map((schedule) => (
                    <li key={`${date}-${schedule.id}`} className="hover:bg-gray-50">
                      <Link to={`/schedules/${schedule.id}`} className="block">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {schedule.start_time && schedule.end_time && (
                                <div className="min-w-20 mr-4 text-sm text-gray-600">
                                  {schedule.start_time} - {schedule.end_time}
                                </div>
                              )}
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                {schedule.title}
                                {schedule.dateStatus !== 'single' && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    {schedule.dateStatus === 'start' && '(시작)'}
                                    {schedule.dateStatus === 'end' && '(종료)'}
                                    {schedule.dateStatus === 'middle' && '(진행 중)'}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${schedule.type === '컨퍼런스' ? 'bg-blue-100 text-blue-800' : ''}
                                ${schedule.type === '워크샵' ? 'bg-green-100 text-green-800' : ''}
                                ${schedule.type === '네트워킹' ? 'bg-purple-100 text-purple-800' : ''}
                                ${schedule.type === '전시' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${schedule.type === '기타' ? 'bg-gray-100 text-gray-800' : ''}
                              `}>
                                {t(schedule.type)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              {schedule.start_date !== schedule.end_date && (
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  {format(new Date(schedule.start_date), 'yyyy-MM-dd')} ~ {format(new Date(schedule.end_date), 'yyyy-MM-dd')}
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {schedule.location || t('위치 미정')}
                            </div>
                          </div>
                          
                          {schedule.description && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 line-clamp-2">{schedule.description}</p>
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleList;