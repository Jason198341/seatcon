import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AdminLayout } from '../../../components/layout';
import { supabase } from '../../../services/supabase';

const AdminUserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // 사용자 데이터 로드
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        console.error('사용자 목록 로딩 오류:', err);
        setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // 검색어 및 역할 필터링 처리
  useEffect(() => {
    // 검색어와 역할에 따라 사용자 필터링
    const filtered = users.filter(user => {
      // 검색어 필터
      const searchMatch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 역할 필터
      const roleMatch = selectedRole === 'all' || user.role === selectedRole;
      
      return searchMatch && roleMatch;
    });
    
    setFilteredUsers(filtered);
  }, [searchQuery, selectedRole, users]);
  
  // 검색어 변경 이벤트 핸들러
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // 역할 선택 이벤트 핸들러
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };
  
  // 역할 변경 처리
  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // 사용자 목록 업데이트
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, role: newRole };
        }
        return user;
      }));
    } catch (err) {
      console.error('사용자 역할 변경 오류:', err);
      alert('사용자 역할 변경 중 오류가 발생했습니다.');
    }
  };
  
  // 날짜 포맷팅
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <div className="flex items-center space-x-2">
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 역할</option>
              <option value="admin">관리자</option>
              <option value="user">일반 사용자</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="사용자 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="text-xl">로딩 중...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-gray-50 p-8 text-center rounded-md">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    선호 언어
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최근 로그인
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.preferred_language || 'ko'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(user.last_sign_in_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRoleToggle(user.id, user.role)}
                        className={`${
                          user.role === 'admin' 
                            ? 'text-yellow-600 hover:text-yellow-900' 
                            : 'text-blue-600 hover:text-blue-900'
                        } mr-4`}
                      >
                        {user.role === 'admin' ? '일반 사용자로 변경' : '관리자로 변경'}
                      </button>
                      <Link
                        to={`/admin/users/edit/${user.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        상세 정보
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserListPage;
