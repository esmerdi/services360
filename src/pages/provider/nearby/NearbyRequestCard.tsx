import { FileText, MapPin, Navigation } from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import StatusBadge from '../../../components/common/StatusBadge';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDistance } from '../../../utils/distance';
import { getNearbyRequestCardText } from '../../../i18n/providerNearbyRequestsText';
import type { NearbyRequest } from './types';

type NearbyRequestCardProps = {
  request: NearbyRequest;
  es: boolean;
  userId: string | undefined;
  actingId: string | null;
  onAccept: (requestId: string) => void;
};

export default function NearbyRequestCard({
  request,
  es,
  userId,
  actingId,
  onAccept,
}: NearbyRequestCardProps) {
  const text = getNearbyRequestCardText(es);
  const clientLabel = request.client?.full_name || request.client?.email || text.client;

  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <UserAvatar
            avatarUrl={request.client?.avatar_url}
            name={clientLabel}
            alt={clientLabel}
            className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
            imageClassName="h-full w-full rounded-full object-cover"
            fallbackClassName="text-xs font-semibold text-slate-600"
          />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500">{request.service?.name || text.serviceRequest}</p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-slate-900">{request.client?.full_name || text.clientRequest}</h2>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-2 inline-flex items-start gap-1.5 text-sm leading-5 text-slate-500">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span>{request.description || text.noExtraDetails}</span>
      </p>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{text.distance}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-slate-800">
            <Navigation className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
            <span>{request.distance_km !== undefined ? formatDistance(request.distance_km) : text.unavailable}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{text.location}</p>
          <p className="mt-0.5 inline-flex items-start gap-1.5 text-slate-700">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden="true" />
            <span>{request.address || text.noAddressReference}</span>
          </p>
        </div>
      </div>

      <button
        onClick={() => onAccept(request.id)}
        className="btn-primary mt-3 w-full justify-center py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        disabled={actingId === request.id}
      >
        {actingId === request.id ? <LoadingSpinner size="sm" /> : (
          request.provider_id === userId
            ? text.confirmRequest
            : text.acceptRequest
        )}
      </button>
    </div>
  );
}
