import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import type { Category, RequestStatus } from '../../types';
import MyRequestsTable from './my-requests/MyRequestsTable';
import { filterRequests, getCategoryPath } from './my-requests/utils';
import { useMyRequestsData } from './my-requests/useMyRequestsData';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

export default function ClientMyRequests() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | RequestStatus>('all');
  const { requests, categories, loading, error, ratedRequestIds } = useMyRequestsData({ userId: user?.id });

  const statusOptions: Array<{ value: 'all' | RequestStatus; label: string }> = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'pending', label: t('myRequests.status.pending') },
      { value: 'accepted', label: t('myRequests.status.accepted') },
      { value: 'in_progress', label: t('myRequests.status.in_progress') },
      { value: 'completed', label: t('myRequests.status.completed') },
      { value: 'cancelled', label: t('myRequests.status.cancelled') },
    ],
    [t]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

  const filteredRequests = useMemo(() => {
    return filterRequests({
      requests,
      status,
      query: search,
      fallbackCategoryLabel: t('clientBrowse.generalCategory'),
      categoryMap,
    });
  }, [categoryMap, requests, search, status, t]);

  const pendingReviewCount = useMemo(
    () => requests.filter((request) => request.status === 'completed' && !ratedRequestIds.has(request.id)).length,
    [ratedRequestIds, requests]
  );

  return (
    <Layout navItems={CLIENT_NAV} title="My Requests">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{t('myRequests.title')}</h1>
          <p className="page-subtitle">{t('myRequests.subtitle')}</p>
        </div>
        <Link to="/client/browse" className="btn-primary">
          {t('common.newRequest')}
        </Link>
      </div>

      {pendingReviewCount > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <Star className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">{t('myRequests.pendingReviewTitle')}</p>
              <p className="mt-1 text-amber-700">
                {pendingReviewCount} {t('myRequests.pendingReviewDescription')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder={t('myRequests.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value as 'all' | RequestStatus)}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <MyRequestsTable
          t={t}
          language={language}
          requests={filteredRequests}
          ratedRequestIds={ratedRequestIds}
          categoryMap={categoryMap}
        />
      )}
    </Layout>
  );
}
