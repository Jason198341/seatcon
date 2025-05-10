import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScheduleForm } from '../../../components/schedule';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * 관리자용 일정 생성/수정 페이지
 */
const AdminScheduleFormPage = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const isEditMode = !!id;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {isEditMode ? t('일정 수정') : t('새 일정 추가')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? t('기존 일정 정보를 수정합니다.')
              : t('새로운 일정을 등록합니다.')}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/admin/schedules"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {t('일정 목록으로 돌아가기')}
          </Link>
        </div>
      </div>
      
      <ScheduleForm id={id} />
    </div>
  );
};

export default AdminScheduleFormPage;