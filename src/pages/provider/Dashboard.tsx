import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Briefcase, CheckCircle2, Clock, MapPin } from 'lucide-react';
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

  return (
    <Layout navItems={PROVIDER_NAV} title="Provider Dashboard">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl text-slate-900">{es ? 'Panel de proveedor' : 'Provider Dashboard'}</h1>
          <p className="mt-2 text-slate-600">{es ? 'Monitorea la demanda cercana y gestiona trabajos activos.' : 'Track demand nearby and manage active jobs.'}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-700">
          {es ? 'Plan' : 'Plan'}: <span className="font-semibold">{subscription?.plan?.name || 'FREE'}</span>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      <div className="mb-8 card">
        <h2 className="font-display text-xl text-slate-900">{es ? 'Estado de cobertura' : 'Coverage Status'}</h2>
        <div className="mt-4 surface-muted">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-slate-900">{es ? 'Tu ubicacion' : 'Your location'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {locationLoading
                  ? (es ? 'Obteniendo ubicacion actual...' : 'Getting current position...')
                  : coords
                    ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                    : (es ? 'Activa el GPS para recibir solicitudes cercanas.' : 'Enable GPS to receive nearby requests.')}
              </p>
            </div>
          </div>
        </div>
        <Link to="/provider/nearby" className="btn-primary mt-4 w-full justify-center">
          {es ? 'Ver solicitudes cercanas' : 'See nearby requests'}
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <Activity className="mb-2 h-6 w-6 text-emerald-700" />
          <p className="font-display text-xl text-slate-900">{user?.is_available ? (es ? 'En linea' : 'Online') : (es ? 'Desconectado' : 'Offline')}</p>
          <p className="text-sm text-slate-500">{es ? 'Estado de disponibilidad' : 'Availability status'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Briefcase className="mb-2 h-6 w-6 text-sky-700" />
          <p className="font-display text-3xl text-slate-900">{jobs.length}</p>
          <p className="text-sm text-slate-500">{es ? 'Trabajos recientes' : 'Recent jobs'}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <Clock className="mb-2 h-6 w-6 text-amber-700" />
          <p className="font-display text-3xl text-slate-900">{inProgress}</p>
          <p className="text-sm text-slate-500">{es ? 'En progreso' : 'In progress'}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
          <CheckCircle2 className="mb-2 h-6 w-6 text-cyan-700" />
          <p className="font-display text-3xl text-slate-900">{completed}</p>
          <p className="text-sm text-slate-500">{es ? 'Completados' : 'Completed'}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-slate-900">{es ? 'Trabajos recientes' : 'Recent Jobs'}</h2>
            <Link to="/provider/jobs" className="text-sm text-blue-600 hover:underline">{es ? 'Ver todos' : 'View all'}</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-slate-400">{es ? 'Aun no tienes trabajos asignados.' : 'No jobs assigned yet.'}</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="surface-stroke">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{job.service?.name || (es ? 'Solicitud de servicio' : 'Service Request')}</p>
                      <p className="mt-1 text-sm text-slate-500">{job.address || (es ? 'Direccion pendiente' : 'Address pending')}</p>
                    </div>
                    <span className="badge bg-slate-100 text-slate-700">{job.status.replace('_', ' ')}</span>
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
