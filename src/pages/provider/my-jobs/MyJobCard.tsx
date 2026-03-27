import { MessageCircle } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import UserAvatar from '../../../components/common/UserAvatar';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { formatDateTime } from '../../../utils/helpers';
import type { AppLanguage } from '../../../utils/helpers';
import type { ServiceRequest } from '../../../types';
import type { TranslateFn } from './types';

type MyJobCardProps = {
  job: ServiceRequest;
  language: AppLanguage;
  t: TranslateFn;
  actingId: string | null;
  onUpdateStatus: (job: ServiceRequest) => void;
  onRequestCancelReopen: (job: ServiceRequest) => void;
  onOpenChat: (jobId: string) => void;
};

export default function MyJobCard({
  job,
  language,
  t,
  actingId,
  onUpdateStatus,
  onRequestCancelReopen,
  onOpenChat,
}: MyJobCardProps) {
  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <UserAvatar
            avatarUrl={job.client?.avatar_url}
            name={job.client?.full_name || job.client?.email || t('roles.client')}
            alt={job.client?.full_name || job.client?.email || t('roles.client')}
            className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
            fallbackClassName="text-xs font-semibold text-slate-600"
          />
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{job.service?.name || t('providerMyJobs.serviceRequest')}</p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-slate-900">{job.client?.full_name || t('roles.client')}</h2>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{job.description || t('providerMyJobs.noAdditionalDescription')}</p>
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="surface-muted text-sm text-slate-600">
          <p className="font-medium text-slate-800">{t('providerMyJobs.address')}</p>
          <p className="mt-1">{job.address || t('providerMyJobs.pendingDetails')}</p>
        </div>
        <div className="surface-muted text-sm text-slate-600">
          <p className="font-medium text-slate-800">{t('providerMyJobs.created')}</p>
          <p className="mt-1">{formatDateTime(job.created_at, language)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {(job.status === 'accepted' || job.status === 'in_progress') && (
          <button onClick={() => onUpdateStatus(job)} className="btn-primary !py-2 !px-3.5 text-sm" disabled={actingId === job.id}>
            {actingId === job.id ? <LoadingSpinner size="sm" /> : job.status === 'accepted' ? t('providerMyJobs.startJob') : t('providerMyJobs.markCompleted')}
          </button>
        )}
        {job.status === 'accepted' && (
          <button onClick={() => onRequestCancelReopen(job)} className="btn-secondary !py-2 !px-3.5 text-sm" disabled={actingId === job.id}>
            {actingId === job.id ? <LoadingSpinner size="sm" /> : t('providerMyJobs.cancelAndReopen')}
          </button>
        )}
        {(job.status === 'accepted' || job.status === 'in_progress') && job.client && (
          <button
            onClick={() => onOpenChat(job.id)}
            className="btn-secondary !py-2 !px-3.5 text-sm flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {t('providerMyJobs.chatWithClient')}
          </button>
        )}
      </div>
    </div>
  );
}
