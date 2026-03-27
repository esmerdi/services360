import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ChatWindow from '../../components/common/ChatWindow';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import type { RequestStatus, ServiceRequest } from '../../types';
import MyJobCard from './my-jobs/MyJobCard';
import ReopenRequestModal from './my-jobs/ReopenRequestModal';
import type { JobFilter } from './my-jobs/types';

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
  const { t, language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<JobFilter>('all');
  const [actingId, setActingId] = useState<string | null>(null);
  const [chatJobId, setChatJobId] = useState<string | null>(null);
  const [pendingCancelJob, setPendingCancelJob] = useState<ServiceRequest | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function fetchJobs() {
      setLoading(true);
      const { data, error: jobsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          client:users!service_requests_client_id_fkey(id, full_name, email, avatar_url),
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

  const visibleJobs = useMemo(
    () => filteredJobs.slice(0, visibleCount),
    [filteredJobs, visibleCount]
  );

  const hasMoreJobs = filteredJobs.length > visibleCount;

  useEffect(() => {
    setVisibleCount(10);
  }, [filter, jobs]);

  useEffect(() => {
    if (loading) return;

    const shouldOpenChat = searchParams.get('openChat') === '1';
    const requestId = searchParams.get('requestId');
    if (!shouldOpenChat || !requestId) return;

    if (jobs.some((job) => job.id === requestId)) {
      setChatJobId(requestId);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('openChat');
    nextParams.delete('requestId');
    setSearchParams(nextParams, { replace: true });
  }, [jobs, loading, searchParams, setSearchParams]);

  async function updateStatus(job: ServiceRequest) {
    if (!(job.status === 'accepted' || job.status === 'in_progress')) return;
    const status = NEXT_STATUS[job.status];
    setError(null);
    setSuccessMessage(null);
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

  async function reopenRequest(job: ServiceRequest) {
    if (!user || job.status !== 'accepted') return;

    const serviceName = job.service?.name || t('providerMyJobs.reopenServiceFallback');
    const content = t('providerMyJobs.reopenClientMessage').replace('{{service}}', serviceName);

    setPendingCancelJob(null);
    setError(null);
    setSuccessMessage(null);
    setActingId(job.id);

    const { data, error: reopenError } = await supabase
      .rpc('provider_reopen_request', {
        p_request_id: job.id,
        p_message: content,
      });

    setActingId(null);

    if (reopenError) {
      setError(reopenError.message);
      return;
    }

    if (!data) {
      setError(t('providerMyJobs.reopenUnavailable'));
      return;
    }

    setJobs((current) => current.filter((item) => item.id !== job.id));
    setSuccessMessage(t('providerMyJobs.reopenSuccess'));
  }

  return (
    <Layout navItems={PROVIDER_NAV} title="My Jobs">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{t('providerMyJobs.title')}</h1>
          <p className="page-subtitle">{t('providerMyJobs.subtitle')}</p>
        </div>
        <select className="input w-full sm:w-56" value={filter} onChange={(event) => setFilter(event.target.value as JobFilter)}>
          <option value="all">{t('providerMyJobs.status.all')}</option>
          <option value="accepted">{t('providerMyJobs.status.accepted')}</option>
          <option value="in_progress">{t('providerMyJobs.status.in_progress')}</option>
          <option value="completed">{t('providerMyJobs.status.completed')}</option>
          <option value="cancelled">{t('providerMyJobs.status.cancelled')}</option>
        </select>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}
      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.length === 0 && (
            <div className="card">
              <p className="text-center text-slate-400">{t('providerMyJobs.noJobsForFilter')}</p>
            </div>
          )}
          {visibleJobs.map((job) => (
            <MyJobCard
              key={job.id}
              job={job}
              language={language}
              t={t}
              actingId={actingId}
              onUpdateStatus={(selectedJob) => {
                void updateStatus(selectedJob);
              }}
              onRequestCancelReopen={setPendingCancelJob}
              onOpenChat={setChatJobId}
            />
          ))}

          {hasMoreJobs && (
            <div className="flex justify-center">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setVisibleCount((current) => current + 10)}
              >
                {t('providerMyJobs.viewOlderJobs')}
              </button>
            </div>
          )}
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
            otherUserAvatar={chatJob.client?.avatar_url ?? null}
            isOpen={true}
            onOpen={() => setChatJobId(chatJob.id)}
            onClose={() => setChatJobId(null)}
          />
        );
      })()}

      <ReopenRequestModal
        isOpen={Boolean(pendingCancelJob)}
        actingId={actingId}
        pendingCancelJob={pendingCancelJob}
        t={t}
        onClose={() => {
          if (!actingId) setPendingCancelJob(null);
        }}
        onConfirm={() => {
          if (pendingCancelJob) {
            void reopenRequest(pendingCancelJob);
          }
        }}
      />
    </Layout>
  );
}
