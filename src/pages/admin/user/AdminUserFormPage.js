import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '../../../components/layout';
import { supabase } from '../../../services/supabase';
import { languageOptions } from '../../../services/translation';

const AdminUserFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('사용자를 찾을 수 없습니다.');
        
        // 폼 초기값 설정
        setValue('name', data.name);
        setValue('email', data.email);
        setValue('role', data.role);
        setValue('preferred_language', data.preferred_language || 'ko');
      } catch (err) {
        console.error('사용자 정보 로딩 오류:', err);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, setValue]);
  
  const onSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          role: data.role,
          preferred_language: data.preferred_language,
        })
        .eq('id', id);
      
      if (error) throw error;
      
      navigate('/admin/users');
    } catch (err) {
      console.error('사용자 정보 업데이트 오류:', err);
      setError('사용자 정보를 업데이트하는 중 오류가 발생했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">사용자 정보 수정</h1>
          <button
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            목록으로 돌아가기
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="text-xl">로딩 중...</div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: '이름을 입력해주세요.' })}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  역할
                </label>
                <select
                  id="role"
                  {...register('role', { required: '역할을 선택해주세요.' })}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.role ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700">
                  선호 언어
                </label>
                <select
                  id="preferred_language"
                  {...register('preferred_language', { required: '선호 언어를 선택해주세요.' })}
                  className={`mt-1 block w-full rounded-md border ${
                    errors.preferred_language ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                {errors.preferred_language && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferred_language.message}</p>
                )}
              </div>
              
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    submitLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submitLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserFormPage;
