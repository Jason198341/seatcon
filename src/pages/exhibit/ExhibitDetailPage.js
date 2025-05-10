import React from 'react';
import ExhibitDetail from '../../components/exhibit/ExhibitDetail';
import MainLayout from '../../components/layout/MainLayout';

/**
 * 전시물 상세 정보 페이지
 */
const ExhibitDetailPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <ExhibitDetail />
      </div>
    </MainLayout>
  );
};

export default ExhibitDetailPage;
