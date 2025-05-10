import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExhibits, deleteExhibit } from '../../../services/exhibitService';
import AdminLayout from '../../../components/layout/AdminLayout';

/**
 * 관리자 전시물 목록 페이지
 */
const AdminExhibitListPage = () => {
  const [exhibits, setExhibits] = useState([]);
  const [filteredExhibits, setFilteredExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        exhibit.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
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

  // 삭제 확인 모달 표시
  const handleDeleteClick = (id, title) => {
    setDeleteConfirm({ id, title });
  };

  // 삭제 취소
  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // 삭제 처리
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await deleteExhibit(deleteConfirm.id);
      if (error) throw error;
      
      // 삭제 성공 후 목록에서 제거
      setExhibits(prevExhibits => 
        prevExhibits.filter(exhibit => exhibit.id !== deleteConfirm.id)
      );
      
      // 삭제 확인 모달 닫기
      setDeleteConfirm(null);
    } catch (err) {
      console.error('전시물 삭제 오류:', err);
      alert('전시물 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-exhibit-list-container">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">전시물 관리</h2>
          <Link
            to="/admin/exhibits/new"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            새 전시물 추가
          </Link>
        </div>
        
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
            
            {/* 전시물 목록 테이블 */}
            {filteredExhibits.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-md text-center">
                <p className="text-gray-500">검색 조건에 맞는 전시물이 없습니다.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          전시물명
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          회사
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          담당자
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          전시 방법
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredExhibits.map(exhibit => (
                        <tr key={exhibit.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {exhibit.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/exhibits/${exhibit.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {exhibit.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {exhibit.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {exhibit.contact_name}
                            {exhibit.contact_phone && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({exhibit.contact_phone})
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {exhibit.display_method || '정보 없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Link
                                to={`/admin/exhibits/${exhibit.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                수정
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(exhibit.id, exhibit.title)}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* 삭제 확인 모달 */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">전시물 삭제 확인</h3>
              <p className="mb-6">
                정말 <span className="font-semibold">"{deleteConfirm.title}"</span> 전시물을 삭제하시겠습니까?
                <br />
                <span className="text-red-500 text-sm">이 작업은 되돌릴 수 없습니다.</span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  disabled={deleteLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className={`px-4 py-2 ${deleteLoading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'} text-white rounded-md transition`}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminExhibitListPage;
