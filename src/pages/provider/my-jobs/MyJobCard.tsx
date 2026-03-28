import { CalendarClock, FileText, MapPin, MessageCircle } from 'lucide-react';
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
    <div className="card p-4 md:p-5">
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
            <p className="text-xs uppercase tracking-wide text-slate-500">{job.service?.name || t('providerMyJobs.serviceRequest')}</p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-slate-900">{job.client?.full_name || t('roles.client')}</h2>
            <p className="mt-1 inline-flex items-start gap-1.5 text-sm text-slate-500 line-clamp-2">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span>{job.description || t('providerMyJobs.noAdditionalDescription')}</span>
            </p>
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
          <p className="font-medium text-slate-800">{t('providerMyJobs.address')}</p>
          <p className="mt-1 inline-flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden="true" />
            <span>{job.address || t('providerMyJobs.pendingDetails')}</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
          <p className="font-medium text-slate-800">{t('providerMyJobs.created')}</p>
          <p className="mt-1 inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>{formatDateTime(job.created_at, language)}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {(job.status === 'accepted' || job.status === 'in_progress') && (
          <button
            onClick={() => onUpdateStatus(job)}
            className="btn-primary !px-3.5 !py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            disabled={actingId === job.id}
          >
            {actingId === job.id ? <LoadingSpinner size="sm" /> : job.status === 'accepted' ? t('providerMyJobs.startJob') : t('providerMyJobs.markCompleted')}
          </button>
        )}
        {job.status === 'accepted' && (
          <button
            onClick={() => onRequestCancelReopen(job)}
            className="btn-secondary !px-3.5 !py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            disabled={actingId === job.id}
          >
            {actingId === job.id ? <LoadingSpinner size="sm" /> : t('providerMyJobs.cancelAndReopen')}
          </button>
        )}
        {(job.status === 'accepted' || job.status === 'in_progress') && job.client && (
          <button
            onClick={() => onOpenChat(job.id)}
            className="btn-secondary !px-3.5 !py-2 text-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-4 w-4" />
            {t('providerMyJobs.chatWithClient')}
          </button>
        )}
      </div>
    </div>
  );
}
