import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';

// 페이지 컴포넌트 import
import HomePage from '../pages/HomePage';

// 전시물 페이지
import ExhibitListPage from '../pages/exhibit/ExhibitListPage';
import ExhibitDetailPage from '../pages/exhibit/ExhibitDetailPage';

// 발표 페이지
import PresentationListPage from '../pages/presentation/PresentationListPage';
import PresentationDetailPage from '../pages/presentation/PresentationDetailPage';

// 일정 페이지
import ScheduleListPage from '../pages/schedule/ScheduleListPage';
import ScheduleDetailPage from '../pages/schedule/ScheduleDetailPage';

// 채팅 페이지
import ChatRoomListPage from '../pages/chat/ChatRoomListPage';
import ChatRoomPage from '../pages/chat/ChatRoomPage';
import ChatRoomFormPage from '../pages/chat/ChatRoomFormPage';

// 사용자 페이지
import LoginPage from '../pages/user/LoginPage';
import RegisterPage from '../pages/user/RegisterPage';
import ResetPasswordPage from '../pages/user/ResetPasswordPage';
import ProfilePage from '../pages/user/ProfilePage';

// 관리자 페이지
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
// 관리자 전시물 페이지
import AdminExhibitListPage from '../pages/admin/exhibit/AdminExhibitListPage';
import AdminExhibitFormPage from '../pages/admin/exhibit/AdminExhibitFormPage';
// 관리자 발표 페이지
import AdminPresentationListPage from '../pages/admin/presentation/AdminPresentationListPage';
import AdminPresentationFormPage from '../pages/admin/presentation/AdminPresentationFormPage';
// 관리자 일정 페이지
import AdminScheduleListPage from '../pages/admin/schedule/AdminScheduleListPage';
import AdminScheduleFormPage from '../pages/admin/schedule/AdminScheduleFormPage';
// 관리자 채팅방 페이지
import AdminChatRoomListPage from '../pages/admin/chat/AdminChatRoomListPage';
import AdminChatRoomFormPage from '../pages/admin/chat/AdminChatRoomFormPage';
// 관리자 사용자 페이지
import AdminUserListPage from '../pages/admin/user/AdminUserListPage';
import AdminUserFormPage from '../pages/admin/user/AdminUserFormPage';

/**
 * 접근 제한된 라우트 컴포넌트
 * - 로그인한 사용자만 접근 가능
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

/**
 * 관리자 전용 라우트 컴포넌트
 * - 관리자 권한을 가진 사용자만 접근 가능
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }
  
  return user && user.profile?.role === 'admin' ? children : <Navigate to="/" />;
};

/**
 * 공개 라우트 컴포넌트
 * - 로그인하지 않은 사용자만 접근 가능 (로그인 페이지 등)
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }
  
  return !user ? children : <Navigate to="/" />;
};

/**
 * 앱 라우터
 */
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 홈 */}
        <Route path="/" element={<HomePage />} />
        
        {/* 전시물 */}
        <Route path="/exhibits" element={<ExhibitListPage />} />
        <Route path="/exhibits/:id" element={<ExhibitDetailPage />} />
        
        {/* 발표 */}
        <Route path="/presentations" element={<PresentationListPage />} />
        <Route path="/presentations/:id" element={<PresentationDetailPage />} />
        
        {/* 일정 */}
        <Route path="/schedules" element={<ScheduleListPage />} />
        <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
        
        {/* 채팅 */}
        <Route path="/chat" element={<PrivateRoute><ChatRoomListPage /></PrivateRoute>} />
        <Route path="/chat/rooms/:id" element={<PrivateRoute><ChatRoomPage /></PrivateRoute>} />
        <Route path="/chat/rooms/new" element={<PrivateRoute><ChatRoomFormPage /></PrivateRoute>} />
        
        {/* 사용자 */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        
        {/* 관리자 */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        
        {/* 관리자 - 전시물 */}
        <Route path="/admin/exhibits" element={<AdminRoute><AdminExhibitListPage /></AdminRoute>} />
        <Route path="/admin/exhibits/new" element={<AdminRoute><AdminExhibitFormPage /></AdminRoute>} />
        <Route path="/admin/exhibits/:id/edit" element={<AdminRoute><AdminExhibitFormPage /></AdminRoute>} />
        
        {/* 관리자 - 발표 */}
        <Route path="/admin/presentations" element={<AdminRoute><AdminPresentationListPage /></AdminRoute>} />
        <Route path="/admin/presentations/new" element={<AdminRoute><AdminPresentationFormPage /></AdminRoute>} />
        <Route path="/admin/presentations/:id/edit" element={<AdminRoute><AdminPresentationFormPage /></AdminRoute>} />
        
        {/* 관리자 - 일정 */}
        <Route path="/admin/schedules" element={<AdminRoute><AdminScheduleListPage /></AdminRoute>} />
        <Route path="/admin/schedules/new" element={<AdminRoute><AdminScheduleFormPage /></AdminRoute>} />
        <Route path="/admin/schedules/:id/edit" element={<AdminRoute><AdminScheduleFormPage /></AdminRoute>} />
        
        {/* 관리자 - 채팅방 */}
        <Route path="/admin/chat-rooms" element={<AdminRoute><AdminChatRoomListPage /></AdminRoute>} />
        <Route path="/admin/chat-rooms/new" element={<AdminRoute><AdminChatRoomFormPage /></AdminRoute>} />
        <Route path="/admin/chat-rooms/:id/edit" element={<AdminRoute><AdminChatRoomFormPage /></AdminRoute>} />
        
        {/* 관리자 - 사용자 */}
        <Route path="/admin/users" element={<AdminRoute><AdminUserListPage /></AdminRoute>} />
        <Route path="/admin/users/new" element={<AdminRoute><AdminUserFormPage /></AdminRoute>} />
        <Route path="/admin/users/:id/edit" element={<AdminRoute><AdminUserFormPage /></AdminRoute>} />
        
        {/* 404 페이지 */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
