import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Briefcase, CheckCircle2, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import type { ServiceRequest, Subscription } from '../../types';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { language } = useI18n();
  const { coords, loading: locationLoading } = useLocation();
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function fetchData() {
      setLoading(true);
      const [jobsRes, subscriptionRes] = await Promise.all([
        supabase
          .from('service_requests')
          .select('*, service:services(id, name)')
          .eq('provider_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('subscriptions')
          .select('*, plan:plans(id, name, price, features, created_at)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .maybeSingle(),
      ]);

      if (jobsRes.error) {
        setError(jobsRes.error.message);
      } else {
        setJobs((jobsRes.data as ServiceRequest[]) ?? []);
      }

      if (!subscriptionRes.error) {
        setSubscription((subscriptionRes.data as Subscription | null) ?? null);
      }
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const inProgress = jobs.filter((job) => job.status === 'in_progress').length;
  const completed = jobs.filter((job) => job.status === 'completed').length;
  const es = language === 'es';

  const statusLabel = (status: string) => {
    if (es) {
      if (status === 'accepted') return 'Aceptado';
      if (status === 'in_progress') return 'En progreso';
      if (status === 'completed') return 'Completado';
      if (status === 'cancelled') return 'Cancelado';
      return 'Pendiente';
    }

    if (status === 'in_progress') return 'In progress';
    return status.replace('_', ' ');
  };

  return (
    <Layout navItems={PROVIDER_NAV} title="Provider Dashboard">
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:mb-6 md:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{es ? 'Panel de proveedor' : 'Provider dashboard'}</h1>
          <p className="mt-1 text-sm text-slate-600 md:text-base">{es ? 'Monitorea demanda cercana y gestiona tus trabajos activos.' : 'Track nearby demand and manage active jobs.'}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-sky-700">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>{es ? 'Plan' : 'Plan'}: <span className="font-semibold">{subscription?.plan?.name || 'FREE'}</span></span>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      <div className="mb-5 card p-4 md:mb-6 md:p-5">
        <div className="mb-3 flex items-center gap-2 text-slate-900">
          <ShieldCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
          <h2 className="text-base font-semibold md:text-lg">{es ? 'Estado de cobertura' : 'Coverage status'}</h2>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-slate-900">{es ? 'Tu ubicación' : 'Your location'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {locationLoading
                  ? (es ? 'Obteniendo ubicación actual...' : 'Getting current position...')
                  : coords
                    ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                    : (es ? 'Activa el GPS para recibir solicitudes cercanas.' : 'Enable GPS to receive nearby requests.')}
              </p>
            </div>
          </div>
        </div>
          <Link to="/provider/nearby" className="btn-primary mt-3 w-full justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
          {es ? 'Ver solicitudes cercanas' : 'See nearby requests'}
        </Link>
      </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:mb-6 md:gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <Activity className="mb-2 h-5 w-5 text-emerald-700" />
            <p className="text-xl font-semibold text-slate-900">{user?.is_available ? (es ? 'En línea' : 'Online') : (es ? 'Desconectado' : 'Offline')}</p>
          <p className="text-sm text-slate-500">{es ? 'Estado de disponibilidad' : 'Availability status'}</p>
        </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Briefcase className="mb-2 h-5 w-5 text-sky-700" />
            <p className="text-2xl font-semibold text-slate-900">{jobs.length}</p>
          <p className="text-sm text-slate-500">{es ? 'Trabajos recientes' : 'Recent jobs'}</p>
        </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <Clock className="mb-2 h-5 w-5 text-amber-700" />
            <p className="text-2xl font-semibold text-slate-900">{inProgress}</p>
          <p className="text-sm text-slate-500">{es ? 'En progreso' : 'In progress'}</p>
        </div>
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
            <CheckCircle2 className="mb-2 h-5 w-5 text-cyan-700" />
            <p className="text-2xl font-semibold text-slate-900">{completed}</p>
          <p className="text-sm text-slate-500">{es ? 'Completados' : 'Completed'}</p>
        </div>
      </div>

      <div className="grid gap-6">
          <div className="card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 md:text-lg">{es ? 'Trabajos recientes' : 'Recent jobs'}</h2>
            <Link to="/provider/jobs" className="text-sm text-blue-600 hover:underline">{es ? 'Ver todos' : 'View all'}</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                {es ? 'Aún no tienes trabajos asignados.' : 'No jobs assigned yet.'}
              </div>
          ) : (
              <div className="space-y-2.5">
              {jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-900">{job.service?.name || (es ? 'Solicitud de servicio' : 'Service request')}</p>
                        <p className="mt-1 text-sm text-slate-500">{job.address || (es ? 'Dirección pendiente' : 'Address pending')}</p>
                    </div>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{statusLabel(job.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
}
