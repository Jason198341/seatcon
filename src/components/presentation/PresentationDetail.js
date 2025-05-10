import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getPresentationById, deletePresentation } from '../../services/presentationService';
import { useAuth } from '../../utils/auth';

/**
 * 발표 상세 컴포넌트
 */
const PresentationDetail = ({ id }) => {
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 발표 데이터 로딩
  useEffect(() => {
    const loadPresentation = async () => {
      setLoading(true);
      try {
        const { data, error } = await getPresentationById(id);
        if (error) throw error;
        setPresentation(data);
      } catch (err) {
        console.error('발표 상세 정보 로드 오류:', err);
        setError('발표 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPresentation();
  }, [id]);
  
  // 발표 삭제 처리
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await deletePresentation(id);
      if (error) throw error;
      navigate('/presentations', { replace: true });
    } catch (err) {
      console.error('발표 삭제 오류:', err);
      setError('발표를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // 로딩 중 표시
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner"></div>
        <p className="mt-2 text-sm text-gray-500">발표 정보를 불러오는 중...</p>
      </div>
    );
  }
  
  // 에러 표시
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-6" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }
  
  // 발표 정보가 없는 경우
  if (!presentation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">발표 정보를 찾을 수 없습니다.</p>
        <Link to="/presentations" className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500">
          <svg className="-ml-1 mr-1 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          발표 목록으로 돌아가기
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-indigo-600 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div>
            <h3 className="text-lg leading-6 font-medium text-white">
              {presentation.title}
            </h3>
            <p className="mt-1 text-sm text-indigo-100">
              {format(new Date(presentation.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
              {' · '}
              {presentation.start_time} - {presentation.end_time}
            </p>
          </div>
          
          {/* 관리자 버튼 */}
          {user?.profile?.role === 'admin' && (
            <div className="flex-shrink-0 flex space-x-2">
              <Link
                to={`/admin/presentations/${id}/edit`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                편집
              </Link>
              
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={deleting}
              >
                <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 발표 상세 정보 */}
      <div className="px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">발표자</dt>
            <dd className="mt-1 text-sm text-gray-900">{presentation.presenter_name}</dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">소속</dt>
            <dd className="mt-1 text-sm text-gray-900">{presentation.company || '-'}</dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">유형</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${presentation.type === '협력사' ? 'bg-green-100 text-green-800' : ''}
                ${presentation.type === '남양연구소' ? 'bg-blue-100 text-blue-800' : ''}
                ${presentation.type === '해외연구소' ? 'bg-purple-100 text-purple-800' : ''}
                ${presentation.type === '인도로컬' ? 'bg-yellow-100 text-yellow-800' : ''}
              `}>
                {presentation.type}
              </span>
            </dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">위치</dt>
            <dd className="mt-1 text-sm text-gray-900">{presentation.location || '위치 미정'}</dd>
          </div>
          
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">등록 정보</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <time dateTime={presentation.created_at}>
                {format(new Date(presentation.created_at), 'yyyy-MM-dd HH:mm')}
              </time>
              {presentation.updated_at && presentation.updated_at !== presentation.created_at && (
                <span className="ml-2 text-gray-500">
                  (최종 수정:{' '}
                  <time dateTime={presentation.updated_at}>
                    {format(new Date(presentation.updated_at), 'yyyy-MM-dd HH:mm')}
                  </time>
                  )
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
      
      {/* 하단 버튼 */}
      <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200 flex justify-between">
        <Link
          to="/presentations"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          발표 목록
        </Link>
      </div>
      
      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      발표 삭제
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        발표 "{presentation.title}"을(를) 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationDetail;