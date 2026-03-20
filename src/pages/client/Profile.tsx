import React from 'react';
import Layout from '../../components/layout/Layout';
import ProfileEditor from '../../components/common/ProfileEditor';
import { useI18n } from '../../context/I18nContext';

const CLIENT_NAV = [
  { label: 'Dashboard',   to: '/client' },
  { label: 'Browse',      to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

export default function ClientProfile() {
  const { language } = useI18n();
  const es = language === 'es';

  return (
    <Layout navItems={CLIENT_NAV} title="Profile">
      <div className="page-header">
        <h1 className="page-title">{es ? 'Mi perfil' : 'My Profile'}</h1>
        <p className="page-subtitle">
          {es
            ? 'Gestiona tu información personal y foto de perfil.'
            : 'Manage your personal information and profile photo.'}
        </p>
      </div>

      <div className="max-w-2xl">
        <ProfileEditor />
      </div>
    </Layout>
  );
}
