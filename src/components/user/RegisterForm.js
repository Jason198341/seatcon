import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, getCurrentUser } from '../../services/userService';
import { languageOptions } from '../../services/translation';
import { useForm } from 'react-hook-form';

/**
 * 회원가입 폼 컴포넌트
 */
const RegisterForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // React Hook Form
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferred_language: 'ko'
    }
  });
  
  // 비밀번호 확인을 위한 비밀번호 값 감시
  const password = watch('password');
  
  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    const checkLoggedIn = async () => {
      const { data } = await getCurrentUser();
      if (data) {
        navigate('/');
      }
    };
    
    checkLoggedIn();
  }, [navigate]);
  
  // 회원가입 처리
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = {
        name: data.name,
        preferred_language: data.preferred_language
      };
      
      const { data: registerData, error: registerError } = await registerUser(
        data.email,
        data.password,
        userData
      );
      
      if (registerError) throw registerError;
      
      // 회원가입 성공 시 로그인 페이지로 이동
      navigate('/login', { 
        state: { 
          message: '회원가입이 완료되었습니다. 로그인해주세요.' 
        } 
      });
    } catch (err) {
      console.error('회원가입 오류:', err);
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-form-container max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 이름 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            id="name"
            type="text"
            className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            {...register('name', { 
              required: '이름을 입력하세요',
              minLength: {
                value: 2,
                message: '이름은 2자 이상이어야 합니다'
              }
            })}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        
        {/* 이메일 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            id="email"
            type="email"
            className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            {...register('email', { 
              required: '이메일을 입력하세요',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: '유효한 이메일 주소를 입력하세요'
              }
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        
        {/* 비밀번호 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            {...register('password', { 
              required: '비밀번호를 입력하세요',
              minLength: {
                value: 6,
                message: '비밀번호는 6자 이상이어야 합니다'
              }
            })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        {/* 비밀번호 확인 */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`w-full px-3 py-2 border rounded-md ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            {...register('confirmPassword', { 
              required: '비밀번호 확인을 입력하세요',
              validate: value => value === password || '비밀번호가 일치하지 않습니다'
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        {/* 선호 언어 */}
        <div>
          <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-1">
            선호 언어
          </label>
          <select
            id="preferred_language"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            {...register('preferred_language')}
          >
            {languageOptions.map(option => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            선택한 언어로 다른 사용자의 메시지가 자동 번역됩니다.
          </p>
        </div>
        
        {/* 회원가입 버튼 */}
        <div>
          <button
            type="submit"
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
            } transition`}
            disabled={loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </div>
        
        {/* 로그인 링크 */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => navigate('/login')}
            >
              로그인하기
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
