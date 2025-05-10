import React from 'react';
import { Link } from 'react-router-dom';
import { ScheduleList } from '../../../components/schedule';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * 관리자용 일정 목록 페이지
 */
const AdminScheduleListPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('일정 관리')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('컨퍼런스 일정을 관리합니다. 새 일정을 추가하거나 기존 일정을 수정/삭제할 수 있습니다.')}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/admin/schedules/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t('새 일정 추가')}
          </Link>
        </div>
      </div>
      
      <ScheduleList />
    </div>
  );
};

export default AdminScheduleListPage;