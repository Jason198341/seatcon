import React from 'react';
import { ScheduleList } from '../../components/schedule';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 일정 목록 페이지
 */
const ScheduleListPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('컨퍼런스 일정')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('컨퍼런스 일정을 확인하세요.')}
          </p>
        </div>
      </div>
      
      <ScheduleList />
    </div>
  );
};

export default ScheduleListPage;