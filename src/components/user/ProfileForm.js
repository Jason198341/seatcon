import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateUserProfile, updatePassword } from '../../services/userService';
import { languageOptions } from '../../services/translation';
import { useForm } from 'react-hook-form';

/**
 * 사용자 프로필 수정 폼 컴포넌트
 */
const ProfileForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [user, setUser] = useState(null);
  
  // 프로필 폼
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      preferred_language: 'ko'
    }
  });
  
  // 비밀번호 변경 폼
  const { 
    register: registerPassword, 
    handleSubmit: handleSubmitPassword, 
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors } 
  } = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  // 비밀번호 확인을 위한 비밀번호 값 감시
  const newPassword = watchPassword('newPassword');
  
  // 초기 데이터 로딩
  useEffect(() => {
    loadUserData();
  }, []);
  
  // 사용자 데이터 로딩
  const loadUserData = async () => {
    setLoading(true);
    try {
      const { data, error } = await getCurrentUser();
      
      if (error) throw error;
      
      if (!data) {
        // 로그인하지 않은 경우 로그인 페이지로 이동
        navigate('/login', { state: { from: '/profile' } });
        return;
      }
      
      setUser(data);
      
      // 폼 데이터 설정
      setValue('name', data.profile.name);
      setValue('preferred_language', data.profile.preferred_language || 'ko');
      
      setError(null);
    } catch (err) {
      console.error('사용자 정보 로딩 오류:', err);
      setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 프로필 업데이트
  const onSubmit = async (data) => {
    setUpdateLoading(true);
    setUpdateError(null);
    setSuccess(null);
    
    try {
      const { error } = await updateUserProfile(user.id, {
        name: data.name,
        preferred_language: data.preferred_language
      });
      
      if (error) throw error;
      
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      
      // 데이터 리로드
      loadUserData();
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      setUpdateError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // 비밀번호 변경
  const onSubmitPassword = async (data) => {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    
    try {
      const { error } = await updatePassword(data.newPassword);
      
      if (error) throw error;
      
      setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
      resetPassword();
    } catch (err) {
      console.error('비밀번호 변경 오류:', err);
      setPasswordError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="profile-form-container max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">내 프로필</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">프로필 정보</h3>
          
          {updateError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {updateError}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 이메일 (수정 불가) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                value={user.email}
                disabled
              />
            </div>
            
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                id="name"
                type="text"
                className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                {...register('name', { required: '이름을 입력하세요' })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
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
            </div>
            
            {/* 저장 버튼 */}
            <div>
              <button
                type="submit"
                className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
                  updateLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
                } transition`}
                disabled={updateLoading}
              >
                {updateLoading ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">비밀번호 변경</h3>
          
          {passwordError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {passwordSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            {/* 새 비밀번호 */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                type="password"
                className={`w-full px-3 py-2 border rounded-md ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                {...registerPassword('newPassword', { 
                  required: '새 비밀번호를 입력하세요',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 6자 이상이어야 합니다'
                  }
                })}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword.message}</p>
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
                className={`w-full px-3 py-2 border rounded-md ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                {...registerPassword('confirmPassword', { 
                  required: '비밀번호 확인을 입력하세요',
                  validate: value => value === newPassword || '비밀번호가 일치하지 않습니다'
                })}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
            
            {/* 변경 버튼 */}
            <div>
              <button
                type="submit"
                className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
                  passwordLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
                } transition`}
                disabled={passwordLoading}
              >
                {passwordLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
