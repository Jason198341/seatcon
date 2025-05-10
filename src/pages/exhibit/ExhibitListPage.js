import React from 'react';
import ExhibitList from '../../components/exhibit/ExhibitList';
import MainLayout from '../../components/layout/MainLayout';

/**
 * 전시물 목록 페이지
 */
const ExhibitListPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <ExhibitList />
      </div>
    </MainLayout>
  );
};

export default ExhibitListPage;
