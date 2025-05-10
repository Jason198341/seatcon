import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  getPresentationById, 
  createPresentation, 
  updatePresentation,
  presentationTypes
} from '../../services/presentationService';

/**
 * 발표 생성/수정 폼 컴포넌트
 */
const PresentationForm = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(!!id);
  const navigate = useNavigate();
  
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: {
      title: '',
      presenter_name: '',
      company: '',
      type: '협력사',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
    }
  });
  
  // 발표 데이터 로딩 (수정 모드)
  useEffect(() => {
    if (id) {
      const loadPresentation = async () => {
        setLoading(true);
        try {
          const { data, error } = await getPresentationById(id);
          if (error) throw error;
          
          // 폼 데이터 설정
          setValue('title', data.title);
          setValue('presenter_name', data.presenter_name);
          setValue('company', data.company || '');
          setValue('type', data.type);
          setValue('date', data.date);
          setValue('start_time', data.start_time);
          setValue('end_time', data.end_time);
          setValue('location', data.location || '');
        } catch (err) {
          console.error('발표 정보 로드 오류:', err);
          setError('발표 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      loadPresentation();
    }
  }, [id, setValue]);
  
  // 폼 제출 처리
  const onSubmit = async (data) => {
    setSubmitting(true);
    setError(null);
    
    try {
      let result;
      
      if (editMode) {
        // 발표 수정
        result = await updatePresentation(id, data);
      } else {
        // 새 발표 생성
        result = await createPresentation(data);
      }
      
      if (result.error) throw result.error;
      
      // 성공시 상세 페이지로 이동
      const newId = editMode ? id : result.data[0].id;
      navigate(`/presentations/${newId}`, { replace: true });
    } catch (err) {
      console.error('발표 저장 오류:', err);
      setError(`발표를 ${editMode ? '수정' : '생성'}하는 중 오류가 발생했습니다.`);
    } finally {
      setSubmitting(false);
    }
  };
  
  // 폼 리셋
  const handleReset = () => {
    if (window.confirm('모든 입력을 초기화하시겠습니까?')) {
      reset();
    }
  };
  
  // 취소
  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      if (editMode) {
        navigate(`/presentations/${id}`);
      } else {
        navigate('/presentations');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* 로딩 표시 */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">발표 정보를 불러오는 중...</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* 제목 */}
            <div className="sm:col-span-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                발표 제목 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.title ? 'border-red-300' : ''}`}
                  {...register('title', { required: '발표 제목은 필수입니다.' })}
                />
              </div>
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            {/* 발표자 */}
            <div className="sm:col-span-3">
              <label htmlFor="presenter_name" className="block text-sm font-medium text-gray-700">
                발표자 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="presenter_name"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.presenter_name ? 'border-red-300' : ''}`}
                  {...register('presenter_name', { required: '발표자 이름은 필수입니다.' })}
                />
              </div>
              {errors.presenter_name && (
                <p className="mt-2 text-sm text-red-600">{errors.presenter_name.message}</p>
              )}
            </div>
            
            {/* 회사 */}
            <div className="sm:col-span-3">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                소속 회사/기관
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="company"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('company')}
                />
              </div>
            </div>
            
            {/* 유형 */}
            <div className="sm:col-span-3">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                발표 유형 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="type"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('type', { required: '발표 유형은 필수입니다.' })}
                >
                  {presentationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
            
            {/* 날짜 */}
            <div className="sm:col-span-3">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                발표 날짜 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="date"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.date ? 'border-red-300' : ''}`}
                  {...register('date', { required: '발표 날짜는 필수입니다.' })}
                />
              </div>
              {errors.date && (
                <p className="mt-2 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
            
            {/* 시작 시간 */}
            <div className="sm:col-span-2">
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                시작 시간 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  id="start_time"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.start_time ? 'border-red-300' : ''}`}
                  {...register('start_time', { required: '시작 시간은 필수입니다.' })}
                />
              </div>
              {errors.start_time && (
                <p className="mt-2 text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>
            
            {/* 종료 시간 */}
            <div className="sm:col-span-2">
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                종료 시간 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  id="end_time"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.end_time ? 'border-red-300' : ''}`}
                  {...register('end_time', { 
                    required: '종료 시간은 필수입니다.',
                    validate: {
                      isAfterStart: (value, { start_time }) => 
                        !start_time || value > start_time || '종료 시간은 시작 시간보다 이후여야 합니다.'
                    }
                  })}
                />
              </div>
              {errors.end_time && (
                <p className="mt-2 text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
            
            {/* 위치 */}
            <div className="sm:col-span-6">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                발표 위치
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="location"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('location')}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 폼 버튼 */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
          <button
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleReset}
            disabled={submitting}
          >
            초기화
          </button>
          
          <button
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleCancel}
            disabled={submitting}
          >
            취소
          </button>
          
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={submitting}
          >
            {submitting ? '저장 중...' : (editMode ? '수정' : '생성')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PresentationForm;