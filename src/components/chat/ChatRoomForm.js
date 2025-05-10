import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  getChatRoomById, 
  createChatRoom, 
  updateChatRoom
} from '../../services/chatService';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 채팅방 생성/수정 폼 컴포넌트
 */
const ChatRoomForm = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(!!id);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });
  
  // 채팅방 데이터 로딩 (수정 모드)
  useEffect(() => {
    if (id) {
      const loadChatRoom = async () => {
        setLoading(true);
        try {
          const { data, error } = await getChatRoomById(id);
          if (error) throw error;
          
          // 폼 데이터 설정
          setValue('name', data.name);
          setValue('description', data.description || '');
        } catch (err) {
          console.error('채팅방 정보 로드 오류:', err);
          setError('채팅방 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
          setLoading(false);
        }
      };
      
      loadChatRoom();
    }
  }, [id, setValue]);
  
  // 폼 제출 처리
  const onSubmit = async (data) => {
    setSubmitting(true);
    setError(null);
    
    try {
      let result;
      
      if (editMode) {
        // 채팅방 수정
        result = await updateChatRoom(id, data);
      } else {
        // 새 채팅방 생성
        result = await createChatRoom(data);
      }
      
      if (result.error) throw result.error;
      
      // 성공시 채팅방 페이지로 이동
      const newId = editMode ? id : result.data[0].id;
      navigate(`/chat/rooms/${newId}`);
    } catch (err) {
      console.error('채팅방 저장 오류:', err);
      setError(`채팅방을 ${editMode ? '수정' : '생성'}하는 중 오류가 발생했습니다.`);
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
        navigate(`/chat/rooms/${id}`);
      } else {
        navigate('/chat');
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
          <p className="mt-2 text-sm text-gray-500">{t('채팅방 정보를 불러오는 중...')}</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* 채팅방 이름 */}
            <div className="sm:col-span-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('채팅방 이름')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.name ? 'border-red-300' : ''}`}
                  {...register('name', { 
                    required: t('채팅방 이름은 필수입니다.'),
                    minLength: {
                      value: 2,
                      message: t('채팅방 이름은 최소 2자 이상이어야 합니다.')
                    },
                    maxLength: {
                      value: 100,
                      message: t('채팅방 이름은 최대 100자까지 입력할 수 있습니다.')
                    }
                  })}
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
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
                  {...register('description', {
                    maxLength: {
                      value: 500,
                      message: t('설명은 최대 500자까지 입력할 수 있습니다.')
                    }
                  })}
                />
              </div>
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
              )}
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

export default ChatRoomForm;