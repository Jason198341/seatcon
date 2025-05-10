import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import { languageOptions } from '../../services/translation';
import MainLayout from '../../components/layout/MainLayout';

/**
 * 사용자 프로필 관리 페이지 컴포넌트
 */
const ProfilePage = () => {
  const { user, updateProfile, signOut } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/profile' } });
    } else {
      // 폼 초기값 설정
      reset({
        name: user.profile?.name || '',
        email: user.email || '',
        preferred_language: user.profile?.preferred_language || 'ko'
      });
    }
  }, [user, reset, navigate]);
  
  // 프로필 업데이트 제출 처리
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const updates = {
        name: data.name,
        preferred_language: data.preferred_language,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await updateProfile(updates);
      
      if (error) {
        throw error;
      }
      
      // 성공 메시지 표시
      setMessage('프로필이 성공적으로 업데이트되었습니다.');
      
      // 폼 업데이트
      reset({
        ...data
      });
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setError('프로필 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setError('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };
  
  if (!user) {
    return null; // 로그인 페이지로 리디렉션 중...
  }
  
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">프로필 관리</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              개인 정보 및 계정 설정을 관리합니다.
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {/* 성공 메시지 */}
            {message && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{message}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 이름 입력 필드 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('name', {
                      required: '이름을 입력해주세요.',
                      maxLength: {
                        value: 100,
                        message: '이름은 100자 이내로 입력해주세요.'
                      }
                    })}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>
              
              {/* 이메일 입력 필드 (읽기 전용) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일 주소
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                    {...register('email')}
                    disabled
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    이메일 주소는 변경할 수 없습니다.
                  </p>
                </div>
              </div>

              {/* 선호 언어 선택 */}
              <div>
                <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700">
                  선호 언어
                </label>
                <div className="mt-1">
                  <select
                    id="preferred_language"
                    className={`block w-full px-3 py-2 border ${
                      errors.preferred_language ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('preferred_language', {
                      required: '선호 언어를 선택해주세요.'
                    })}
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  {errors.preferred_language && (
                    <p className="mt-2 text-sm text-red-600">{errors.preferred_language.message}</p>
                  )}
                </div>
              </div>

              {/* 가입일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  가입일
                </label>
                <div className="mt-1">
                  <p className="text-sm text-gray-500">
                    {new Date(user.profile?.created_at || user.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-between pt-5 border-t border-gray-200">
                {/* 로그아웃 버튼 */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  로그아웃
                </button>
                
                {/* 저장 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm ${
                    loading
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block align-middle"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  <span className="align-middle">
                    {loading ? '저장 중...' : '변경사항 저장'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
