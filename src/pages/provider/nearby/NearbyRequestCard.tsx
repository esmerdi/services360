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
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar
            avatarUrl={request.client?.avatar_url}
            name={clientLabel}
            alt={clientLabel}
            className="h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
            fallbackClassName="text-xs font-semibold text-slate-600"
          />
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{request.service?.name || (es ? 'Solicitud de servicio' : 'Service Request')}</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">{request.client?.full_name || (es ? 'Solicitud de cliente' : 'Client request')}</h2>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-3 text-sm text-slate-500">{request.description || (es ? 'No hay detalles adicionales.' : 'No extra details provided.')}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="surface-muted text-sm text-slate-600">
          <p className="font-medium text-slate-800">{es ? 'Distancia' : 'Distance'}</p>
          <p className="mt-1">{request.distance_km !== undefined ? formatDistance(request.distance_km) : (es ? 'No disponible' : 'Unavailable')}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">{request.address || (es ? 'Sin referencia de direccion.' : 'No address reference supplied.')}</p>

      <button
        onClick={() => onAccept(request.id)}
        className="btn-primary mt-5 w-full justify-center"
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
