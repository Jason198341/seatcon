import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScheduleDetail } from '../../components/schedule';
import { useLanguage } from '../../context/LanguageContext';

/**
 * 일정 상세 페이지
 */
const ScheduleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // id가 없는 경우 목록 페이지로 리디렉션
  if (!id) {
    navigate('/schedules');
    return null;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('일정 상세 정보')}
          </h1>
        </div>
      </div>
      
      <ScheduleDetail id={id} />
    </div>
  );
};

export default ScheduleDetailPage;