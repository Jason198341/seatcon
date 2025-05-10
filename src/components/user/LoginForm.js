import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../../services/userService';
import { useForm } from 'react-hook-form';

/**
 * 로그인 폼 컴포넌트
 */
const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    const checkLoggedIn = async () => {
      const { data } = await getCurrentUser();
      if (data) {
        const { from } = location.state || { from: '/' };
        navigate(from);
      }
    };
    
    checkLoggedIn();
  }, [navigate, location]);
  
  // 로그인 처리
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: userData, error: loginError } = await loginUser(data.email, data.password);
      
      if (loginError) throw loginError;
      
      if (userData) {
        // 로그인 성공
        const { from } = location.state || { from: '/' };
        navigate(from);
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-form-container max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        
        {/* 로그인 버튼 */}
        <div>
          <button
            type="submit"
            className={`w-full py-2 px-4 bg-blue-500 text-white rounded-md ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
            } transition`}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
        
        {/* 회원가입 및 비밀번호 찾기 링크 */}
        <div className="flex justify-between mt-4 text-sm">
          <button
            type="button"
            className="text-blue-500 hover:underline"
            onClick={() => navigate('/register')}
          >
            회원가입
          </button>
          <button
            type="button"
            className="text-blue-500 hover:underline"
            onClick={() => navigate('/reset-password')}
          >
            비밀번호 찾기
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
