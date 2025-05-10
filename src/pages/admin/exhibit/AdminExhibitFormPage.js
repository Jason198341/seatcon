import React from 'react';
import { useParams } from 'react-router-dom';
import ExhibitForm from '../../../components/exhibit/ExhibitForm';
import AdminLayout from '../../../components/layout/AdminLayout';

/**
 * 관리자 전시물 추가/수정 페이지
 */
const AdminExhibitFormPage = () => {
  const { id } = useParams();

  return (
    <AdminLayout>
      <ExhibitForm exhibitId={id} />
    </AdminLayout>
  );
};

export default AdminExhibitFormPage;
