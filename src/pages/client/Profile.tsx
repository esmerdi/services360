import React from 'react';
import { UserCircle } from 'lucide-react';
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
      <div className="mb-5 space-y-1.5 md:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{es ? 'Mi perfil' : 'My profile'}</h1>
        <p className="text-sm text-slate-600 md:text-base">
          {es
            ? 'Gestiona tu información personal y foto de perfil.'
            : 'Manage your personal information and profile photo.'}
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-sky-600" aria-hidden="true" />
            <p className="font-medium text-slate-800">{es ? 'Datos de la cuenta' : 'Account details'}</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">{es ? 'Mantén tu perfil actualizado para una mejor experiencia.' : 'Keep your profile updated for a better experience.'}</p>
        </div>

        <div className="card p-4 md:p-5">
          <ProfileEditor />
        </div>
      </div>
    </Layout>
  );
}
