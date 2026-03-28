import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, ClipboardList, ArrowRight,
  Clock, AlertCircle, ShieldCheck, Sparkles,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { formatTimeAgo, formatCurrency } from '../../utils/helpers';
import type { ServiceRequest } from '../../types';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse',    to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { coords, loading: locLoading, error: locError, refresh: refreshLoc } = useLocation();
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const { data } = await supabase
        .from('service_requests')
        .select('*, service:services(name)')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const all = data ?? [];
      setRecentRequests(all as ServiceRequest[]);
      setStats({
        total:     all.length,
        pending:   all.filter((r) => r.status === 'pending').length,
        completed: all.filter((r) => r.status === 'completed').length,
      });
      setLoading(false);
    }

    // Get total stats separately without limit
    supabase
      .from('service_requests')
      .select('status')
      .eq('client_id', user.id)
      .then(({ data }) => {
        if (data) {
          setStats({
            total:     data.length,
            pending:   data.filter((r) => r.status === 'pending').length,
            completed: data.filter((r) => r.status === 'completed').length,
          });
        }
      });

    fetchData();
  }, [user]);

  return (
    <Layout navItems={CLIENT_NAV} title="Dashboard">
      <div className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:mb-6 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          {t('clientDashboard.welcome')} {user?.full_name?.split(' ')[0] || t('clientDashboard.there')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 md:text-base">{t('clientDashboard.subtitle')}</p>
      </div>

      {!coords && !locLoading && (
        <div className="mb-5 flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center md:mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">{t('clientDashboard.locationMissingTitle')}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {locError || t('clientDashboard.locationMissingDesc')}
            </p>
          </div>
          <button onClick={refreshLoc} className="btn-secondary text-sm">
            <MapPin className="h-4 w-4" />
            {t('clientDashboard.detectLocation')}
          </button>
        </div>
      )}

      {coords && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 md:mb-6">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          {t('clientDashboard.locationDetected')}
        </div>
      )}

      <div className="mb-5 md:mb-6">
        <Link
          to="/client/browse"
          className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 p-5 text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center"
        >
          <div>
            <h2 className="text-xl font-semibold md:text-2xl">{t('clientDashboard.findServiceTitle')}</h2>
            <p className="mt-1 text-sm text-blue-100 md:text-base">{t('clientDashboard.findServiceDesc')}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 text-sm font-semibold md:text-base">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
            {t('clientDashboard.browseNow')}
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 md:mb-6 md:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">{t('clientDashboard.stats.total')}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-2xl font-semibold text-amber-700">{stats.pending}</p>
          <p className="text-xs text-slate-500 mt-1">{t('clientDashboard.stats.pending')}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-2xl font-semibold text-emerald-700">{stats.completed}</p>
          <p className="text-xs text-slate-500 mt-1">{t('clientDashboard.stats.completed')}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900 md:text-lg">{t('clientDashboard.recentRequests')}</h2>
          <Link to="/client/requests" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            {t('clientDashboard.viewAll')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="card py-10 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">{t('clientDashboard.noRequests')}</p>
            <Link to="/client/browse" className="btn-primary mt-4 inline-flex">
              {t('clientDashboard.bookService')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <Link
                key={req.id}
                to={`/client/requests/${req.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {(req.service as { name?: string })?.name ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(req.created_at, language)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {req.price && (
                    <span className="text-sm font-semibold text-slate-700">
                      {formatCurrency(req.price, language)}
                    </span>
                  )}
                  <StatusBadge status={req.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
