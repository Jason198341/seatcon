import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import Header from '../Header';

/**
 * 메인 레이아웃 컴포넌트
 */
const MainLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // 현재 활성 메뉴 확인
  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  // 관리자 여부 확인
  const isAdmin = user && user.profile?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex flex-1">
        {/* 사이드바 */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                  <Link
                    to="/"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive('/')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`mr-3 h-5 w-5 ${
                        isActive('/')
                          ? 'text-indigo-700'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    홈
                  </Link>
                  
                  <Link
                    to="/exhibits"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive('/exhibits')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`mr-3 h-5 w-5 ${
                        isActive('/exhibits')
                          ? 'text-indigo-700'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    전시물
                  </Link>
                  
                  <Link
                    to="/presentations"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive('/presentations')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`mr-3 h-5 w-5 ${
                        isActive('/presentations')
                          ? 'text-indigo-700'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                    발표 일정
                  </Link>
                  
                  <Link
                    to="/schedules"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive('/schedules')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`mr-3 h-5 w-5 ${
                        isActive('/schedules')
                          ? 'text-indigo-700'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    컨퍼런스 일정
                  </Link>
                  
                  <Link
                    to="/chat"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive('/chat')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`mr-3 h-5 w-5 ${
                        isActive('/chat')
                          ? 'text-indigo-700'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    채팅
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive('/admin')
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <svg
                        className={`mr-3 h-5 w-5 ${
                          isActive('/admin')
                            ? 'text-indigo-700'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      관리자 페이지
                    </Link>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
        
        {/* 컨텐츠 영역 */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
