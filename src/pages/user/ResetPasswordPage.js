import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../utils/auth';
import { supabase } from '../../services/supabase';

/**
 * 비밀번호 재설정 페이지 컴포넌트
 */
const ResetPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL 해시 파라미터 확인 (비밀번호 재설정 링크로부터 온 경우)
  const hash = location.hash;
  const isConfirmationMode = hash.includes('type=recovery');
  
  // 이메일 요청 제출 처리
  const onSubmitEmail = async (data) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await resetPassword(data.email);
      
      if (error) {
        throw error;
      }
      
      // 성공 메시지 표시
      setMessage(
        '비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인하고 재설정 링크를 클릭해주세요.'
      );
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      setError('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  // 새 비밀번호 제출 처리
  const onSubmitNewPassword = async (data) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        throw error;
      }
      
      // 성공 메시지 표시 후 로그인 페이지로 리디렉션
      setMessage('비밀번호가 성공적으로 재설정되었습니다.');
      setTimeout(() => {
        navigate('/login', {
          state: { message: '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.' }
        });
      }, 2000);
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      setError('비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isConfirmationMode ? '새 비밀번호 설정' : '비밀번호 재설정'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            로그인 페이지로 돌아가기
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
          
          {isConfirmationMode ? (
            // 새 비밀번호 설정 폼
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitNewPassword)}>
              {/* 새 비밀번호 입력 필드 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  새 비밀번호
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('password', {
                      required: '새 비밀번호를 입력해주세요.',
                      minLength: {
                        value: 6,
                        message: '비밀번호는 6자 이상이어야 합니다.'
                      }
                    })}
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* 비밀번호 확인 필드 */}
              <div>
                <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인
                </label>
                <div className="mt-1">
                  <input
                    id="password_confirm"
                    type="password"
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.password_confirm ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('password_confirm', {
                      required: '비밀번호 확인을 입력해주세요.',
                      validate: (value) => {
                        const password = watch('password');
                        return value === password || '비밀번호가 일치하지 않습니다.';
                      }
                    })}
                  />
                  {errors.password_confirm && (
                    <p className="mt-2 text-sm text-red-600">{errors.password_confirm.message}</p>
                  )}
                </div>
              </div>

              {/* 제출 버튼 */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  {loading ? '처리 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          ) : (
            // 이메일 재설정 요청 폼
            <form className="space-y-6" onSubmit={handleSubmit(onSubmitEmail)}>
              {/* 이메일 입력 필드 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일 주소
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('email', {
                      required: '이메일을 입력해주세요.',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: '유효한 이메일 주소를 입력해주세요.'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* 설명 텍스트 */}
              <div className="text-sm text-gray-500">
                <p>
                  가입 시 사용한 이메일 주소를 입력하시면, 비밀번호 재설정 링크가 포함된 이메일을 발송해 드립니다.
                </p>
              </div>

              {/* 제출 버튼 */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  {loading ? '처리 중...' : '재설정 링크 받기'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
