import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatusBadge from '../../components/common/StatusBadge';
import ChatWindow from '../../components/common/ChatWindow';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { formatDateTime } from '../../utils/helpers';
import type { RequestStatus, ServiceRequest } from '../../types';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

const NEXT_STATUS: Record<'accepted' | 'in_progress', RequestStatus> = {
  accepted: 'in_progress',
  in_progress: 'completed',
};

export default function ProviderMyJobs() {
  const { user } = useAuth();
  const { language } = useI18n();
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');
  const [actingId, setActingId] = useState<string | null>(null);
  const [chatJobId, setChatJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function fetchJobs() {
      setLoading(true);
      const { data, error: jobsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          client:users!service_requests_client_id_fkey(id, full_name, email),
          service:services(id, name)
        `)
        .eq('provider_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (jobsError) {
        setError(jobsError.message);
      } else {
        setJobs((data as ServiceRequest[]) ?? []);
      }
      setLoading(false);
    }

    fetchJobs();
  }, [user]);

  const filteredJobs = useMemo(
    () => jobs.filter((job) => filter === 'all' || job.status === filter),
    [filter, jobs]
  );

  async function updateStatus(job: ServiceRequest) {
    if (!(job.status === 'accepted' || job.status === 'in_progress')) return;
    const status = NEXT_STATUS[job.status];
    setActingId(job.id);
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', job.id);
    setActingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setJobs((current) => current.map((item) => (item.id === job.id ? { ...item, status } : item)));
  }

  const es = language === 'es';

  return (
    <Layout navItems={PROVIDER_NAV} title="My Jobs">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{es ? 'Mis trabajos' : 'My Jobs'}</h1>
          <p className="page-subtitle">{es ? 'Gestiona trabajos aceptados y actualiza su progreso.' : 'Manage accepted work and update progress.'}</p>
        </div>
        <select className="input w-full sm:w-56" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | RequestStatus)}>
          <option value="all">{es ? 'Todos los estados' : 'All statuses'}</option>
          <option value="accepted">{es ? 'Aceptado' : 'Accepted'}</option>
          <option value="in_progress">{es ? 'En progreso' : 'In progress'}</option>
          <option value="completed">{es ? 'Completado' : 'Completed'}</option>
          <option value="cancelled">{es ? 'Cancelado' : 'Cancelled'}</option>
        </select>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.length === 0 && (
            <div className="card">
              <p className="text-center text-slate-400">{es ? 'No hay trabajos para el filtro actual.' : 'No jobs match the current filter.'}</p>
            </div>
          )}
          {filteredJobs.map((job) => (
            <div key={job.id} className="card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{job.service?.name || (es ? 'Solicitud de servicio' : 'Service Request')}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{job.client?.full_name || (es ? 'Cliente' : 'Client')}</h2>
                  <p className="mt-2 text-sm text-slate-500">{job.description || (es ? 'Sin descripcion adicional.' : 'No additional description.')}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="surface-muted text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{es ? 'Direccion' : 'Address'}</p>
                  <p className="mt-1">{job.address || (es ? 'Detalles pendientes' : 'Pending details')}</p>
                </div>
                <div className="surface-muted text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{es ? 'Creado' : 'Created'}</p>
                  <p className="mt-1">{formatDateTime(job.created_at, language)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {(job.status === 'accepted' || job.status === 'in_progress') && (
                  <button onClick={() => updateStatus(job)} className="btn-primary" disabled={actingId === job.id}>
                    {actingId === job.id ? <LoadingSpinner size="sm" /> : job.status === 'accepted' ? (es ? 'Iniciar trabajo' : 'Start job') : (es ? 'Marcar completado' : 'Mark completed')}
                  </button>
                )}
                {(job.status === 'accepted' || job.status === 'in_progress') && job.client && (
                  <button
                    onClick={() => setChatJobId(job.id)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {es ? 'Chat con cliente' : 'Chat with client'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {chatJobId && (() => {
        const chatJob = jobs.find((j) => j.id === chatJobId);
        if (!chatJob) return null;
        return (
          <ChatWindow
            requestId={chatJob.id}
            currentUserId={user?.id ?? ''}
            otherUserName={chatJob.client?.full_name ?? null}
            otherUserAvatar={null}
            isOpen={true}
            onClose={() => setChatJobId(null)}
          />
        );
      })()}
    </Layout>
  );
}
