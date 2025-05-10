import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getPresentations, presentationTypes } from '../../services/presentationService';
import { useAuth } from '../../utils/auth';

/**
 * 발표 목록 컴포넌트
 */
const PresentationList = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortAscending, setSortAscending] = useState(true);
  const { user } = useAuth();
  
  // 데이터 로딩
  useEffect(() => {
    const loadPresentations = async () => {
      setLoading(true);
      try {
        const { data, error } = await getPresentations({
          date: filterDate || undefined,
          type: filterType || undefined,
          sortBy,
          ascending: sortAscending,
        });
        
        if (error) throw error;
        setPresentations(data);
      } catch (err) {
        console.error('발표 목록 로드 오류:', err);
        setError('발표 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPresentations();
  }, [filterDate, filterType, sortBy, sortAscending]);
  
  // 발표 날짜별로 그룹화
  const presentationsByDate = presentations.reduce((acc, presentation) => {
    const date = presentation.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(presentation);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              날짜별 필터링
            </label>
            <input
              id="date-filter"
              type="date"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              유형별 필터링
            </label>
            <select
              id="type-filter"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">모든 유형</option>
              {presentationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              정렬 기준
            </label>
            <div className="flex space-x-2">
              <select
                id="sort-by"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">날짜</option>
                <option value="start_time">시간</option>
                <option value="title">제목</option>
                <option value="presenter_name">발표자</option>
                <option value="company">회사</option>
                <option value="type">유형</option>
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
            to="/admin/presentations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            새 발표 추가
          </Link>
        </div>
      )}
      
      {/* 로딩 및 에러 */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">발표 목록을 불러오는 중...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* 발표 목록 */}
      {!loading && !error && Object.keys(presentationsByDate).length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">표시할 발표가 없습니다.</p>
          {(filterDate || filterType) && (
            <p className="text-sm text-gray-400 mt-1">필터를 조정해 보세요.</p>
          )}
        </div>
      )}
      
      {!loading && !error && Object.keys(presentationsByDate).length > 0 && (
        <div className="space-y-8">
          {Object.keys(presentationsByDate)
            .sort((a, b) => sortAscending ? a.localeCompare(b) : b.localeCompare(a))
            .map((date) => (
              <div key={date} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-indigo-600 px-4 py-3">
                  <h3 className="text-lg font-medium text-white">
                    {format(new Date(date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                  </h3>
                </div>
                
                <ul className="divide-y divide-gray-200">
                  {presentationsByDate[date].map((presentation) => (
                    <li key={presentation.id} className="hover:bg-gray-50">
                      <Link to={`/presentations/${presentation.id}`} className="block">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="min-w-20 mr-4 text-sm text-gray-600">
                                {presentation.start_time} - {presentation.end_time}
                              </div>
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                {presentation.title}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${presentation.type === '협력사' ? 'bg-green-100 text-green-800' : ''}
                                ${presentation.type === '남양연구소' ? 'bg-blue-100 text-blue-800' : ''}
                                ${presentation.type === '해외연구소' ? 'bg-purple-100 text-purple-800' : ''}
                                ${presentation.type === '인도로컬' ? 'bg-yellow-100 text-yellow-800' : ''}
                              `}>
                                {presentation.type}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                {presentation.presenter_name}
                              </p>
                              
                              {presentation.company && (
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                  </svg>
                                  {presentation.company}
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {presentation.location || '위치 미정'}
                            </div>
                          </div>
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

export default PresentationList;