import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExhibits } from '../../services/exhibitService';

/**
 * 전시물 목록 컴포넌트
 */
const ExhibitList = () => {
  const [exhibits, setExhibits] = useState([]);
  const [filteredExhibits, setFilteredExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [companies, setCompanies] = useState([]);

  // 초기 데이터 로딩
  useEffect(() => {
    loadExhibits();
  }, []);

  // 전시물 데이터 로딩
  const loadExhibits = async () => {
    setLoading(true);
    try {
      const { data, error } = await getExhibits();
      if (error) throw error;
      
      setExhibits(data);
      setFilteredExhibits(data);
      
      // 회사 목록 추출
      const uniqueCompanies = [...new Set(data.map(exhibit => exhibit.company))].filter(Boolean);
      setCompanies(uniqueCompanies.sort());
      
      setError(null);
    } catch (err) {
      console.error('전시물 목록 로딩 오류:', err);
      setError('전시물 목록을 불러오는 중 오류가 발생했습니다.');
      setExhibits([]);
      setFilteredExhibits([]);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링 처리
  useEffect(() => {
    let result = exhibits;
    
    // 검색어 필터링
    if (searchTerm) {
      result = result.filter(exhibit => 
        exhibit.tech_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        exhibit.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exhibit.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 회사 필터링
    if (filterCompany) {
      result = result.filter(exhibit => exhibit.company === filterCompany);
    }
    
    setFilteredExhibits(result);
  }, [exhibits, searchTerm, filterCompany]);

  // 검색어 변경 처리
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 회사 필터 변경 처리
  const handleCompanyFilterChange = (e) => {
    setFilterCompany(e.target.value);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCompany('');
  };

  // 디스플레이 방법에 따른 아이콘 렌더링
  const renderDisplayMethodIcon = (method) => {
    if (!method) return null;
    
    const methodLower = method.toLowerCase();
    
    if (methodLower.includes('샘플')) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          샘플
        </span>
      );
    }
    
    if (methodLower.includes('판넬')) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          판넬
        </span>
      );
    }
    
    if (methodLower.includes('온라인')) {
      return (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          온라인
        </span>
      );
    }
    
    return null;
  };

  return (
    <div className="exhibit-list-container">
      <h2 className="text-2xl font-bold mb-6">전시물 목록</h2>
      
      {/* 필터링 영역 */}
      <div className="filters bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          {/* 검색창 */}
          <div className="mb-4 md:mb-0 flex-grow">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="전시물명, 회사, 담당자 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          {/* 회사 필터 */}
          <div className="mb-4 md:mb-0 md:w-1/4">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterCompany}
              onChange={handleCompanyFilterChange}
            >
              <option value="">모든 회사</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
          
          {/* 필터 초기화 버튼 */}
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            onClick={handleResetFilters}
          >
            필터 초기화
          </button>
        </div>
      </div>
      
      {/* 로딩 상태 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* 필터링 결과 요약 */}
          <div className="mb-4 text-gray-500">
            총 {filteredExhibits.length}개의 전시물이 있습니다.
            {(searchTerm || filterCompany) && (
              <span className="ml-2">
                (검색 조건에 맞는 결과만 표시됨)
              </span>
            )}
          </div>
          
          {/* 전시물 목록 */}
          {filteredExhibits.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-md text-center">
              <p className="text-gray-500">검색 조건에 맞는 전시물이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExhibits.map(exhibit => (
                <Link
                  key={exhibit.id}
                  to={`/exhibits/${exhibit.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 pr-2">
                        {exhibit.tech_name}
                      </h3>
                      
                      {/* 전시 방법 아이콘 */}
                      <div className="flex flex-wrap">
                        {renderDisplayMethodIcon(exhibit.display_method)}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-blue-600 font-medium">{exhibit.company}</p>
                      <p className="text-gray-600 text-sm">담당자: {exhibit.contact_name}</p>
                    </div>
                    
                    {/* 사이즈 정보 */}
                    {(exhibit.size_l || exhibit.size_w || exhibit.size_h) && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <span>
                          {exhibit.size_l && `L: ${exhibit.size_l}mm`}
                          {exhibit.size_w && exhibit.size_l && ' × '}
                          {exhibit.size_w && `W: ${exhibit.size_w}mm`}
                          {exhibit.size_h && (exhibit.size_l || exhibit.size_w) && ' × '}
                          {exhibit.size_h && `H: ${exhibit.size_h}mm`}
                        </span>
                      </div>
                    )}
                    
                    {/* 기타 요청사항 */}
                    {exhibit.notes && (
                      <div className="text-sm text-gray-500 truncate">
                        <span className="font-medium">요청사항:</span> {exhibit.notes}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExhibitList;
