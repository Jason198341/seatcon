import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../utils/auth';
import { languageOptions } from '../../services/translation';

/**
 * 회원가입 페이지 컴포넌트
 */
const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  
  // 비밀번호 확인을 위한 watch
  const password = watch('password');
  
  // 이미 로그인한 경우 리디렉션
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  
  // 폼 제출 처리
  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    
    try {
      const { error } = await signUp(
        data.email,
        data.password,
        {
          name: data.name,
          preferred_language: data.preferred_language
        }
      );
      
      if (error) {
        throw error;
      }
      
      // 회원가입 성공 메시지와 함께 로그인 페이지로 리디렉션
      navigate('/login', {
        state: {
          message: '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화한 후 로그인해주세요.'
        }
      });
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      // 에러 메시지 설정
      if (error.message.includes('already registered')) {
        setApiError('이미 가입된 이메일 주소입니다.');
      } else {
        setApiError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          새 계정 만들기
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          또는{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            로그인하기
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 에러 메시지 */}
          {apiError && (
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
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

            {/* 비밀번호 입력 필드 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
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
                    required: '비밀번호를 입력해주세요.',
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
                    validate: value => value === password || '비밀번호가 일치하지 않습니다.'
                  })}
                />
                {errors.password_confirm && (
                  <p className="mt-2 text-sm text-red-600">{errors.password_confirm.message}</p>
                )}
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
                  defaultValue="ko"
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

            {/* 약관 동의 */}
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                  errors.terms ? 'border-red-300' : ''
                }`}
                {...register('terms', {
                  required: '약관에 동의해주세요.'
                })}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                <span>
                  <Link to="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                    서비스 이용약관
                  </Link>
                  {' '}및{' '}
                  <Link to="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
                    개인정보 처리방침
                  </Link>
                  에 동의합니다.
                </span>
              </label>
            </div>
            {errors.terms && (
              <p className="mt-2 text-sm text-red-600">{errors.terms.message}</p>
            )}

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
                {loading ? '처리 중...' : '가입하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
