import LoadingSpinner from '../../../components/common/LoadingSpinner';
import StatusBadge from '../../../components/common/StatusBadge';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDistance } from '../../../utils/distance';
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
  const clientLabel = request.client?.full_name || request.client?.email || (es ? 'Cliente' : 'Client');

  return (
    <div className="card p-4 sm:p-5">
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
            <p className="text-xs font-medium text-slate-500">{request.service?.name || (es ? 'Solicitud de servicio' : 'Service Request')}</p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-slate-900">{request.client?.full_name || (es ? 'Solicitud de cliente' : 'Client request')}</h2>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-2 text-sm leading-5 text-slate-500">{request.description || (es ? 'No hay detalles adicionales.' : 'No extra details provided.')}</p>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <div className="surface-muted p-3 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{es ? 'Distancia' : 'Distance'}</p>
          <p className="mt-0.5 font-medium text-slate-800">{request.distance_km !== undefined ? formatDistance(request.distance_km) : (es ? 'No disponible' : 'Unavailable')}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{request.address || (es ? 'Sin referencia de direccion.' : 'No address reference supplied.')}</p>

      <button
        onClick={() => onAccept(request.id)}
        className="btn-primary mt-3 w-full justify-center py-2"
        disabled={actingId === request.id}
      >
        {actingId === request.id ? <LoadingSpinner size="sm" /> : (
          request.provider_id === userId
            ? (es ? 'Confirmar solicitud' : 'Confirm request')
            : (es ? 'Aceptar solicitud' : 'Accept request')
        )}
      </button>
    </div>
  );
}
