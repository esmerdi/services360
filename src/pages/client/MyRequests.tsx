import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatusBadge from '../../components/common/StatusBadge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { formatDateTime } from '../../utils/helpers';
import type { Category, RequestStatus, ServiceRequest } from '../../types';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

export default function ClientMyRequests() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<Array<Pick<Category, 'id' | 'name' | 'parent_id'>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | RequestStatus>('all');

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

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function fetchRequests() {
      setLoading(true);
      const [requestsRes, categoriesRes] = await Promise.all([
        supabase
          .from('service_requests')
          .select(`
            *,
            provider:users!service_requests_provider_id_fkey(id, full_name, email),
            service:services(id, name, category_id)
          `)
          .eq('client_id', currentUser.id)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name, parent_id'),
      ]);

      if (requestsRes.error) {
        setError(requestsRes.error.message);
      } else if (categoriesRes.error) {
        setError(categoriesRes.error.message);
      } else {
        setRequests((requestsRes.data as ServiceRequest[]) ?? []);
        setCategories((categoriesRes.data as Array<Pick<Category, 'id' | 'name' | 'parent_id'>>) ?? []);
      }
      setLoading(false);
    }

    fetchRequests();
  }, [user]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

  const getCategoryPath = useCallback((categoryId: string | null | undefined) => {
    if (!categoryId) return t('clientBrowse.generalCategory');

    const path: string[] = [];
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);

    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      path.unshift(current.name);
      current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
    }

    return path.length > 0 ? path.join(' > ') : t('clientBrowse.generalCategory');
  }, [categoryMap, t]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const categoryPath = getCategoryPath(request.service?.category_id).toLowerCase();
      const matchesStatus = status === 'all' || request.status === status;
      const matchesSearch =
        !query ||
        request.service?.name?.toLowerCase().includes(query) ||
        request.provider?.full_name?.toLowerCase().includes(query) ||
        request.address?.toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query) ||
        categoryPath.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [getCategoryPath, requests, search, status]);

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
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{t('myRequests.table.service')}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{t('myRequests.table.provider')}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{t('myRequests.table.status')}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">{t('myRequests.table.created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                      {t('myRequests.table.noRequests')}
                    </td>
                  </tr>
                )}
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/client/requests/${request.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                        {request.service?.name || t('myRequests.table.serviceRequest')}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          <span className="truncate">{getCategoryPath(request.service?.category_id)}</span>
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">{request.address || t('myRequests.table.addressPending')}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {request.provider?.full_name || t('myRequests.table.awaitingAcceptance')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                      {formatDateTime(request.created_at, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
