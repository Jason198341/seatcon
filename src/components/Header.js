import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';

/**
 * 앱 헤더 컴포넌트
 */
const Header = () => {
  const { user, signOut } = useAuth();
  const { currentLanguage, changeLanguage, languageOptions } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  // 로그아웃 처리
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // 언어 변경 처리
  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setLangMenuOpen(false);
  };

  // 현재 선택된 언어
  const currentLanguageInfo = languageOptions.find(lang => lang.code === currentLanguage) || languageOptions[0];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                시트 컨퍼런스
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                홈
              </Link>
              <Link
                to="/exhibits"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                전시물
              </Link>
              <Link
                to="/presentations"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                발표 일정
              </Link>
              <Link
                to="/schedules"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                컨퍼런스 일정
              </Link>
              <Link
                to="/chat"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                채팅
              </Link>
            </nav>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center">
            {/* 언어 선택 드롭다운 */}
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                >
                  <span className="sr-only">언어 선택</span>
                  <span className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    {currentLanguageInfo.name}
                    <svg
                      className="ml-1 -mr-0.5 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
              </div>
              {langMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="language-menu"
                >
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      className={`w-full text-left block px-4 py-2 text-sm ${
                        currentLanguage === lang.code
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      role="menuitem"
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 사용자 메뉴 */}
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <span className="sr-only">사용자 메뉴 열기</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                    {user?.profile?.name ? user.profile.name.charAt(0).toUpperCase() : '?'}
                  </div>
                </button>
              </div>
              {menuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  {user ? (
                    <>
                      <div className="block px-4 py-2 text-sm text-gray-900 border-b">
                        <div className="font-medium">{user.profile?.name || '사용자'}</div>
                        <div className="text-gray-500">{user.email}</div>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        프로필 관리
                      </Link>
                      {user.profile?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          관리자 페이지
                        </Link>
                      )}
                      <button
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        로그인
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        회원가입
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* 모바일 메뉴 버튼 */}
          <div className="-mr-2 flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="sr-only">메뉴 열기</span>
              <svg
                className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      <div className={`${menuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            onClick={() => setMenuOpen(false)}
          >
            홈
          </Link>
          <Link
            to="/exhibits"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            onClick={() => setMenuOpen(false)}
          >
            전시물
          </Link>
          <Link
            to="/presentations"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            onClick={() => setMenuOpen(false)}
          >
            발표 일정
          </Link>
          <Link
            to="/schedules"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            onClick={() => setMenuOpen(false)}
          >
            컨퍼런스 일정
          </Link>
          <Link
            to="/chat"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            onClick={() => setMenuOpen(false)}
          >
            채팅
          </Link>
        </div>
        
        {/* 언어 선택 */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="px-4 py-2">
            <p className="text-base font-medium text-gray-800">언어 선택</p>
          </div>
          <div className="mt-1 space-y-1">
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                className={`w-full text-left block pl-3 pr-4 py-2 ${
                  currentLanguage === lang.code
                    ? 'bg-gray-100 text-gray-900 border-l-4 border-indigo-500'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                }`}
                onClick={() => {
                  handleLanguageChange(lang.code);
                  setMenuOpen(false);
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-4 pb-3 border-t border-gray-200">
          {user ? (
            <>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                    {user.profile?.name ? user.profile.name.charAt(0).toUpperCase() : '?'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user.profile?.name || '사용자'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  프로필 관리
                </Link>
                {user.profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    관리자 페이지
                  </Link>
                )}
                <button
                  className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-1">
              <Link
                to="/login"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
