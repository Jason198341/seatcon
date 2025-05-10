import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getExhibitById } from '../../services/exhibitService';
import { useAuth } from '../../utils/auth';
import { formatDate } from '../../utils/dateUtils';

/**
 * 전시물 상세 정보 컴포넌트
 */
const ExhibitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exhibit, setExhibit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 전시물 데이터 로딩
  useEffect(() => {
    const loadExhibit = async () => {
      setLoading(true);
      try {
        const { data, error } = await getExhibitById(id);
        if (error) throw error;
        
        setExhibit(data);
        setError(null);
      } catch (err) {
        console.error('전시물 정보 로딩 오류:', err);
        setError('전시물 정보를 불러오는 중 오류가 발생했습니다.');
        setExhibit(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadExhibit();
  }, [id]);
  
  // 뒤로 가기
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // 관리자 여부 확인
  const isAdmin = user && user.profile?.role === 'admin';
  
  // 전시 방법에 따른 아이콘 렌더링
  const renderDisplayMethod = (method) => {
    if (!method) return '정보 없음';
    
    const methods = method.split('/').map(m => m.trim());
    
    return (
      <div className="flex flex-wrap gap-2">
        {methods.map((m, index) => {
          const methodLower = m.toLowerCase();
          
          if (methodLower.includes('샘플')) {
            return (
              <span key={index} className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                샘플
              </span>
            );
          }
          
          if (methodLower.includes('판넬')) {
            return (
              <span key={index} className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                판넬
              </span>
            );
          }
          
          if (methodLower.includes('온라인')) {
            return (
              <span key={index} className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                온라인
              </span>
            );
          }
          
          return (
            <span key={index} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
              {m}
            </span>
          );
        })}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !exhibit) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
          <p>{error || '전시물 정보를 찾을 수 없습니다.'}</p>
        </div>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          onClick={handleGoBack}
        >
          뒤로 가기
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 헤더 및 작업 버튼 */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition mb-4 sm:mb-0 w-full sm:w-auto"
          onClick={handleGoBack}
        >
          &larr; 목록으로 돌아가기
        </button>
        
        {isAdmin && (
          <div className="flex space-x-3">
            <Link
              to={`/admin/exhibits/${id}/edit`}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full sm:w-auto text-center"
            >
              수정하기
            </Link>
          </div>
        )}
      </div>
      
      {/* 전시물 상세 정보 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* 제목 및 회사 정보 */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {exhibit.tech_name}
          </h1>
          <p className="text-lg text-blue-600 font-medium">
            {exhibit.company}
          </p>
        </div>
        
        {/* 상세 정보 */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 담당자 정보 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">담당자 정보</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">담당자</p>
                  <p className="font-medium">{exhibit.contact_name || '정보 없음'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">연락처</p>
                  <p className="font-medium">{exhibit.contact_phone || '정보 없음'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="font-medium">
                    {exhibit.contact_email ? (
                      <a
                        href={`mailto:${exhibit.contact_email}`}
                        className="text-blue-500 hover:underline"
                      >
                        {exhibit.contact_email}
                      </a>
                    ) : (
                      '정보 없음'
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 전시물 정보 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">전시물 정보</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">전시 방법</p>
                  <div className="font-medium">
                    {renderDisplayMethod(exhibit.display_method)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">사이즈</p>
                  <p className="font-medium">
                    {exhibit.size_l && `L: ${exhibit.size_l}mm`}
                    {exhibit.size_w && exhibit.size_l && ' × '}
                    {exhibit.size_w && `W: ${exhibit.size_w}mm`}
                    {exhibit.size_h && (exhibit.size_l || exhibit.size_w) && ' × '}
                    {exhibit.size_h && `H: ${exhibit.size_h}mm`}
                    {!exhibit.size_l && !exhibit.size_w && !exhibit.size_h && '정보 없음'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">기타 요청사항</p>
                  <p className="font-medium">{exhibit.notes || '없음'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 등록/수정일 */}
        <div className="bg-gray-50 p-4 text-sm text-gray-500 border-t">
          <p>등록일: {formatDate(exhibit.created_at)}</p>
          {exhibit.updated_at && exhibit.updated_at !== exhibit.created_at && (
            <p>마지막 수정일: {formatDate(exhibit.updated_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExhibitDetail;
