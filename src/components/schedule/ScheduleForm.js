import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  getScheduleById, 
  createSchedule, 
  updateSchedule,
  scheduleTypes
} from '../../services/scheduleService';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 일정 생성/수정 폼 컴포넌트
 */
const ScheduleForm = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(!!id);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      location: '',
      type: '컨퍼런스',
    }
  });
  
  // 시작일과 종료일 감시
  const startDate = watch('start_date');
  
  // 일정 데이터 로딩 (수정 모드)
  useEffect(() => {
    if (id) {
      const loadSchedule = async () => {
        setLoading(true);
        try {
          const { data, error } = await getScheduleById(id);
          if (error) throw error;
          
          // 폼 데이터 설정
          setValue('title', data.title);
          setValue('description', data.description || '');
          setValue('start_date', data.start_date);
          setValue('end_date', data.end_date);
          setValue('start_time', data.start_time || '');
          setValue('end_time', data.end_time || '');
          setValue('location', data.location || '');
          setValue('type', data.type);
        } catch (err) {
          console.error('일정 정보 로드 오류:', err);
          setError('일정 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      loadSchedule();
    }
  }, [id, setValue]);
  
  // 폼 제출 처리
  const onSubmit = async (data) => {
    setSubmitting(true);
    setError(null);
    
    try {
      let result;
      
      if (editMode) {
        // 일정 수정
        result = await updateSchedule(id, data);
      } else {
        // 새 일정 생성
        result = await createSchedule(data);
      }
      
      if (result.error) throw result.error;
      
      // 성공시 상세 페이지로 이동
      const newId = editMode ? id : result.data[0].id;
      navigate(`/schedules/${newId}`, { replace: true });
    } catch (err) {
      console.error('일정 저장 오류:', err);
      setError(`일정을 ${editMode ? '수정' : '생성'}하는 중 오류가 발생했습니다.`);
    } finally {
      setSubmitting(false);
    }
  };
  
  // 폼 리셋
  const handleReset = () => {
    if (window.confirm(t('모든 입력을 초기화하시겠습니까?'))) {
      reset();
    }
  };
  
  // 취소
  const handleCancel = () => {
    if (window.confirm(t('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?'))) {
      if (editMode) {
        navigate(`/schedules/${id}`);
      } else {
        navigate('/schedules');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{t(error)}</span>
        </div>
      )}
      
      {/* 로딩 표시 */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          <p className="mt-2 text-sm text-gray-500">{t('일정 정보를 불러오는 중...')}</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* 제목 */}
            <div className="sm:col-span-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                {t('일정 제목')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.title ? 'border-red-300' : ''}`}
                  {...register('title', { required: t('일정 제목은 필수입니다.') })}
                />
              </div>
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            {/* 시작 날짜 */}
            <div className="sm:col-span-3">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                {t('시작 날짜')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="start_date"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.start_date ? 'border-red-300' : ''}`}
                  {...register('start_date', { required: t('시작 날짜는 필수입니다.') })}
                />
              </div>
              {errors.start_date && (
                <p className="mt-2 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>
            
            {/* 종료 날짜 */}
            <div className="sm:col-span-3">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                {t('종료 날짜')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="end_date"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.end_date ? 'border-red-300' : ''}`}
                  {...register('end_date', { 
                    required: t('종료 날짜는 필수입니다.'),
                    validate: {
                      isAfterStart: (value) => 
                        !startDate || value >= startDate || t('종료 날짜는 시작 날짜보다 이전일 수 없습니다.')
                    }
                  })}
                  min={startDate}
                />
              </div>
              {errors.end_date && (
                <p className="mt-2 text-sm text-red-600">{errors.end_date.message}</p>
              )}
            </div>
            
            {/* 시작 시간 */}
            <div className="sm:col-span-3">
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                {t('시작 시간')}
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  id="start_time"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('start_time')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('선택 사항')}</p>
            </div>
            
            {/* 종료 시간 */}
            <div className="sm:col-span-3">
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                {t('종료 시간')}
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  id="end_time"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('end_time')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('선택 사항')}</p>
            </div>
            
            {/* 유형 */}
            <div className="sm:col-span-3">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                {t('일정 유형')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="type"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('type', { required: t('일정 유형은 필수입니다.') })}
                >
                  {scheduleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {t(type.label)}
                    </option>
                  ))}
                </select>
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
            
            {/* 위치 */}
            <div className="sm:col-span-3">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                {t('위치')}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="location"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('location')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('선택 사항')}</p>
            </div>
            
            {/* 설명 */}
            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {t('설명')}
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={4}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  {...register('description')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('선택 사항')}</p>
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
            {t('초기화')}
          </button>
          
          <button
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleCancel}
            disabled={submitting}
          >
            {t('취소')}
          </button>
          
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={submitting}
          >
            {submitting ? t('저장 중...') : (editMode ? t('수정') : t('생성'))}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ScheduleForm;