import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createExhibit, updateExhibit, getExhibitById } from '../../services/exhibitService';

/**
 * 전시물 정보 입력/수정 폼 컴포넌트
 * @param {Object} props
 * @param {string} props.exhibitId - 수정할 전시물 ID (없으면 신규 추가로 간주)
 */
const ExhibitForm = ({ exhibitId }) => {
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const isEditMode = !!exhibitId;

  // 수정 모드인 경우 기존 데이터 로딩
  useEffect(() => {
    if (isEditMode) {
      const loadExhibit = async () => {
        setLoading(true);
        try {
          const { data, error } = await getExhibitById(exhibitId);
          if (error) throw error;
          
          // 폼 필드에 기존 값 설정
          Object.keys(data).forEach(key => {
            setValue(key, data[key]);
          });
          
          setError(null);
        } catch (err) {
          console.error('전시물 정보 로딩 오류:', err);
          setError('전시물 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      loadExhibit();
    }
  }, [exhibitId, isEditMode, setValue]);

  // 폼 제출 처리
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // 전시물 수정
        const { error } = await updateExhibit(exhibitId, {
          ...data,
          updated_at: new Date().toISOString()
        });
        
        if (error) throw error;
        
        navigate(`/admin/exhibits/${exhibitId}`);
      } else {
        // 전시물 추가
        const { data: newExhibit, error } = await createExhibit({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        if (error) throw error;
        
        navigate(`/admin/exhibits/${newExhibit.id}`);
      }
    } catch (err) {
      console.error('전시물 저장 오류:', err);
      setError(`전시물을 ${isEditMode ? '수정' : '추가'}하는 중 오류가 발생했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 초기화
  const handleReset = () => {
    reset();
    setError(null);
  };

  // 취소 처리
  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {isEditMode ? '전시물 정보 수정' : '새 전시물 추가'}
      </h2>
      
      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 전시물명 */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전시물명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('title', {
                    required: '전시물명을 입력해주세요.',
                    maxLength: {
                      value: 255,
                      message: '전시물명은 255자 이내로 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="전시물명을 입력하세요"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              
              {/* 회사명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('company', {
                    required: '회사명을 입력해주세요.',
                    maxLength: {
                      value: 100,
                      message: '회사명은 100자 이내로 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.company ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="회사명을 입력하세요"
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-500">{errors.company.message}</p>
                )}
              </div>
              
              {/* 전시 방법 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전시 방법 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('display_method', {
                    required: '전시 방법을 입력해주세요.',
                    maxLength: {
                      value: 100,
                      message: '전시 방법은 100자 이내로 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.display_method ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="예: 샘플 / 판넬 / 온라인"
                />
                {errors.display_method && (
                  <p className="mt-1 text-sm text-red-500">{errors.display_method.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 담당자 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">담당자 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 담당자명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('contact_name', {
                    required: '담당자명을 입력해주세요.',
                    maxLength: {
                      value: 100,
                      message: '담당자명은 100자 이내로 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.contact_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="담당자명을 입력하세요"
                />
                {errors.contact_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.contact_name.message}</p>
                )}
              </div>
              
              {/* 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="text"
                  {...register('contact_phone', {
                    maxLength: {
                      value: 20,
                      message: '연락처는 20자 이내로 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.contact_phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="연락처를 입력하세요"
                />
                {errors.contact_phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.contact_phone.message}</p>
                )}
              </div>
              
              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  {...register('contact_email', {
                    maxLength: {
                      value: 100,
                      message: '이메일은 100자 이내로 입력해주세요.'
                    },
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: '올바른 이메일 형식을 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.contact_email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="이메일을 입력하세요"
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-500">{errors.contact_email.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 전시물 상세 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">전시물 상세 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* 가로 사이즈 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가로 사이즈 (L, mm)
                </label>
                <input
                  type="number"
                  {...register('size_l', {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: '0 이상의 값을 입력해주세요.'
                    },
                    max: {
                      value: 10000,
                      message: '10000 이하의 값을 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.size_l ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="가로 사이즈(L)을 입력하세요"
                />
                {errors.size_l && (
                  <p className="mt-1 text-sm text-red-500">{errors.size_l.message}</p>
                )}
              </div>
              
              {/* 너비 사이즈 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  너비 사이즈 (W, mm)
                </label>
                <input
                  type="number"
                  {...register('size_w', {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: '0 이상의 값을 입력해주세요.'
                    },
                    max: {
                      value: 10000,
                      message: '10000 이하의 값을 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.size_w ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="너비 사이즈(W)를 입력하세요"
                />
                {errors.size_w && (
                  <p className="mt-1 text-sm text-red-500">{errors.size_w.message}</p>
                )}
              </div>
              
              {/* 높이 사이즈 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  높이 사이즈 (H, mm)
                </label>
                <input
                  type="number"
                  {...register('size_h', {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: '0 이상의 값을 입력해주세요.'
                    },
                    max: {
                      value: 10000,
                      message: '10000 이하의 값을 입력해주세요.'
                    }
                  })}
                  className={`w-full px-4 py-2 border ${errors.size_h ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="높이 사이즈(H)를 입력하세요"
                />
                {errors.size_h && (
                  <p className="mt-1 text-sm text-red-500">{errors.size_h.message}</p>
                )}
              </div>
            </div>
            
            {/* 기타 요청사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기타 요청사항
              </label>
              <textarea
                {...register('requirements', {
                  maxLength: {
                    value: 1000,
                    message: '기타 요청사항은 1000자 이내로 입력해주세요.'
                  }
                })}
                className={`w-full px-4 py-2 border ${errors.requirements ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32`}
                placeholder="전원 필요 여부, 전시 방법, 특이사항 등을 입력하세요"
              />
              {errors.requirements && (
                <p className="mt-1 text-sm text-red-500">{errors.requirements.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 버튼 영역 */}
        <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            초기화
          </button>
          <button
            type="submit"
            className={`px-4 py-2 ${isSubmitting ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md transition`}
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : isEditMode ? '수정하기' : '추가하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExhibitForm;
