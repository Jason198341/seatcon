import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout';
import { getSchedules } from '../../services/scheduleService';
import { getExhibits } from '../../services/exhibitService';
import { getChatRooms, getChatStats } from '../../services/chatService';
import { getPresentations } from '../../services/presentationService';
import { supabase } from '../../services/supabase';
import { format } from 'date-fns';

/**
 * 관리자 대시보드 페이지
 */
const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    exhibitsCount: 0,
    presentationsCount: 0,
    schedulesCount: 0,
    chatRoomsCount: 0,
    usersCount: 0,
    messagesCount: 0
  });
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentChatActivity, setRecentChatActivity] = useState([]);
  
  // 데이터 로딩
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 전시물 카운트
        const { data: exhibitsData, error: exhibitsError } = await getExhibits();
        if (exhibitsError) throw exhibitsError;
        
        // 발표 카운트
        const { data: presentationsData, error: presentationsError } = await getPresentations();
        if (presentationsError) throw presentationsError;
        
        // 일정 카운트 및 최근 일정
        const { data: schedulesData, error: schedulesError } = await getSchedules();
        if (schedulesError) throw schedulesError;
        
        // 최근 일정 (시작일 기준 정렬)
        const sortedSchedules = [...schedulesData].sort((a, b) => 
          new Date(a.start_date) - new Date(b.start_date)
        );
        
        // 현재 및 미래 일정만 필터링
        const now = new Date();
        const upcomingSchedules = sortedSchedules.filter(
          schedule => new Date(schedule.end_date) >= now
        );
        
        setRecentSchedules(upcomingSchedules.slice(0, 5));
        
        // 채팅방 카운트 및 통계
        const { data: chatRoomsData, error: chatRoomsError } = await getChatRooms();
        if (chatRoomsError) throw chatRoomsError;
        
        // 채팅 통계 (메시지 수 등)
        const { data: chatStatsData, error: chatStatsError } = await getChatStats();
        if (chatStatsError) throw chatStatsError;
        
        // 사용자 카운트 및 최근 사용자
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;
        
        // 최근 채팅 활동
        const { data: recentMessages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            message,
            created_at,
            users:user_id (name),
            chat_rooms:chat_room_id (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (messagesError) throw messagesError;
        
        // 통계 데이터 설정
        setStats({
          exhibitsCount: exhibitsData.length,
          presentationsCount: presentationsData.length,
          schedulesCount: schedulesData.length,
          chatRoomsCount: chatRoomsData.length,
          usersCount: usersData.length,
          messagesCount: chatStatsData?.totalMessages || 0
        });
        
        setRecentUsers(usersData.slice(0, 5));
        setRecentChatActivity(recentMessages);
        
      } catch (err) {
        console.error('대시보드 데이터 로딩 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // 날짜 포맷팅
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">대시보드 정보를 불러오고 있습니다...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 대시보드</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 mb-6">
            {error}
          </div>
        )}
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 전시물</p>
                <h3 className="text-3xl font-bold mt-1">{stats.exhibitsCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/exhibits" className="text-blue-600 text-sm hover:text-blue-800">
                전시물 관리 &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 발표</p>
                <h3 className="text-3xl font-bold mt-1">{stats.presentationsCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/presentations" className="text-blue-600 text-sm hover:text-blue-800">
                발표 관리 &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 일정</p>
                <h3 className="text-3xl font-bold mt-1">{stats.schedulesCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/schedules" className="text-blue-600 text-sm hover:text-blue-800">
                일정 관리 &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 채팅방</p>
                <h3 className="text-3xl font-bold mt-1">{stats.chatRoomsCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/chat" className="text-blue-600 text-sm hover:text-blue-800">
                채팅방 관리 &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 사용자</p>
                <h3 className="text-3xl font-bold mt-1">{stats.usersCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/users" className="text-blue-600 text-sm hover:text-blue-800">
                사용자 관리 &rarr;
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 메시지</p>
                <h3 className="text-3xl font-bold mt-1">{stats.messagesCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/chat" className="text-blue-600 text-sm hover:text-blue-800">
                채팅 활동 보기 &rarr;
              </Link>
            </div>
          </div>
        </div>
        
        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 일정/발표 관리 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-50 border-b">
              <h2 className="text-lg font-semibold text-blue-900">일정 관리</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <Link
                  to="/admin/schedules/new"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    새 일정 추가
                  </div>
                </Link>
                
                <Link
                  to="/admin/presentations/new"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    새 발표 추가
                  </div>
                </Link>
                
                <Link
                  to="/admin/schedules"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    모든 일정 관리
                  </div>
                </Link>
                
                <Link
                  to="/admin/presentations"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    모든 발표 관리
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          {/* 전시물/채팅 관리 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-green-50 border-b">
              <h2 className="text-lg font-semibold text-green-900">콘텐츠 관리</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <Link
                  to="/admin/exhibits/new"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    새 전시물 추가
                  </div>
                </Link>
                
                <Link
                  to="/admin/chat/new"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    새 채팅방 추가
                  </div>
                </Link>
                
                <Link
                  to="/admin/exhibits"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    전시물 관리
                  </div>
                </Link>
                
                <Link
                  to="/admin/chat"
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-gray-800">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    채팅방 관리
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 다가오는 일정 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">다가오는 일정</h2>
              <Link
                to="/admin/schedules"
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                모두 보기
              </Link>
            </div>
            
            <div className="divide-y divide-gray-200">
              {recentSchedules.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">다가오는 일정이 없습니다.</div>
              ) : (
                recentSchedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link 
                          to={`/admin/schedules/edit/${schedule.id}`}
                          className="text-gray-900 hover:text-blue-600 font-medium"
                        >
                          {schedule.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">
                          {schedule.start_date === schedule.end_date ? (
                            <span>{formatDateTime(schedule.start_date)}</span>
                          ) : (
                            <span>{formatDateTime(schedule.start_date)} ~ {formatDateTime(schedule.end_date)}</span>
                          )}
                        </div>
                        {schedule.location && (
                          <div className="text-sm text-gray-500 mt-1">
                            장소: {schedule.location}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        schedule.type === '컨퍼런스' ? 'bg-blue-100 text-blue-800' : 
                        schedule.type === '워크샵' ? 'bg-green-100 text-green-800' : 
                        schedule.type === '네트워킹' ? 'bg-purple-100 text-purple-800' : 
                        schedule.type === '전시' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* 최근 채팅 활동 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">최근 채팅 활동</h2>
              <Link
                to="/admin/chat"
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                모두 보기
              </Link>
            </div>
            
            <div className="divide-y divide-gray-200">
              {recentChatActivity.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">최근 채팅 활동이 없습니다.</div>
              ) : (
                recentChatActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {activity.users?.name || '알 수 없는 사용자'} 
                          <span className="text-gray-500 font-normal">
                            님이 {activity.chat_rooms?.name || '알 수 없는 채팅방'}에 메시지를 보냈습니다.
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          "{activity.message}"
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(activity.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* 최근 가입 사용자 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">최근 가입 사용자</h2>
              <Link
                to="/admin/users"
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                모두 보기
              </Link>
            </div>
            
            <div className="divide-y divide-gray-200">
              {recentUsers.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">최근 가입한 사용자가 없습니다.</div>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
