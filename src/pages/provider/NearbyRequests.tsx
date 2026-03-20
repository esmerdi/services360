import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LocationMap from '../../components/common/LocationMap';
import type { LocationMapMarker } from '../../components/common/LocationMap';
import StatusBadge from '../../components/common/StatusBadge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { formatDistance } from '../../utils/distance';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../utils/mapMarkers';
import type { ServiceRequest } from '../../types';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

type NearbyRequest = ServiceRequest & { client?: { full_name?: string | null; email?: string | null } };
type NearbyRequestRpcRow = { id: string; distance_km: number };

export default function ProviderNearbyRequests() {
  const { user } = useAuth();
  const { language } = useI18n();
  const { coords, refresh } = useLocation();
  const [requests, setRequests] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !coords) {
      setLoading(false);
      return;
    }
    const currentUser = user;
    const currentCoords = coords;

    async function fetchRequests() {
      setLoading(true);
      const { data, error: requestError } = await supabase.rpc('get_nearby_requests', {
        provider_lat: currentCoords.latitude,
        provider_lon: currentCoords.longitude,
        p_provider_id: currentUser.id,
        radius_km: 20,
      });

      if (requestError) {
        setError(requestError.message);
        setLoading(false);
        return;
      }

      const rpcRows = (data as NearbyRequestRpcRow[] | null) ?? [];
      const requestIds = rpcRows.map((request: NearbyRequestRpcRow) => request.id);
      if (requestIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const { data: details, error: detailsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          service:services(id, name, category_id, category:categories(id, name, icon)),
          client:users!service_requests_client_id_fkey(id, full_name, email)
        `)
        .in('id', requestIds);

      if (detailsError) {
        setError(detailsError.message);
      } else {
        const distanceMap = new Map<string, number>(
          rpcRows.map((request: NearbyRequestRpcRow) => [request.id, request.distance_km])
        );
        const merged = ((details as NearbyRequest[]) ?? []).map((request) => ({
          ...request,
          distance_km: distanceMap.get(request.id),
        }));
        merged.sort((left, right) => (left.distance_km ?? Infinity) - (right.distance_km ?? Infinity));
        setRequests(merged);
      }
      setLoading(false);
    }

    fetchRequests();
  }, [coords, user]);

  async function acceptRequest(requestId: string) {
    if (!user) return;
    setActingId(requestId);
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ provider_id: user.id, status: 'accepted' })
      .eq('id', requestId)
      .is('provider_id', null);
    setActingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setRequests((current) => current.filter((request) => request.id !== requestId));
  }

  const es = language === 'es';
  const requestMarkers = React.useMemo(() => {
    const markers: LocationMapMarker[] = requests
      .filter((request) => request.latitude !== null && request.latitude !== undefined && request.longitude !== null && request.longitude !== undefined)
      .map((request) => ({
        id: request.id,
        latitude: request.latitude as number,
        longitude: request.longitude as number,
        label: request.service?.name || (es ? 'Solicitud de servicio' : 'Service request'),
        description: request.address || request.client?.full_name || (es ? 'Ubicacion del cliente' : 'Client location'),
        color: getCategoryMarkerColor(request.service?.category_id),
        glyph: getCategoryMarkerGlyph(request.service?.category?.icon, request.service?.category?.name),
      }));

    if (coords) {
      markers.unshift({
        id: 'provider-location',
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: es ? 'Tu ubicacion' : 'Your location',
        description: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        color: '#2563eb',
        radius: 10,
        glyph: '📍',
      });
    }

    return markers;
  }, [coords, es, requests]);

  return (
    <Layout navItems={PROVIDER_NAV} title="Nearby Requests">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{es ? 'Solicitudes cercanas' : 'Nearby Requests'}</h1>
          <p className="page-subtitle">{es ? 'Las solicitudes se ordenan por distancia a tu ubicacion actual.' : 'Requests are ordered by distance from your current position.'}</p>
        </div>
        <button onClick={refresh} className="btn-secondary">
          <MapPin className="h-4 w-4" />
          {es ? 'Actualizar GPS' : 'Refresh GPS'}
        </button>
      </div>

      {!coords && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          {es ? 'Activa el GPS y marca tu perfil como en linea para recibir solicitudes cercanas.' : 'Enable GPS and mark yourself online from your profile to receive nearby requests.'}
        </div>
      )}

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{es ? 'Mapa de solicitudes' : 'Requests map'}</h2>
              <p className="mt-1 text-sm text-slate-500">{es ? 'Visualiza tu posicion y las solicitudes cercanas sobre OpenStreetMap.' : 'See your position and nearby requests on OpenStreetMap.'}</p>
            </div>
            <LocationMap markers={requestMarkers} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {requests.length === 0 && (
              <div className="card xl:col-span-2">
                <p className="text-center text-slate-400">{es ? 'No hay solicitudes cercanas disponibles ahora.' : 'No matching nearby requests right now.'}</p>
              </div>
            )}
            {requests.map((request) => (
              <div key={request.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{request.service?.name || (es ? 'Solicitud de servicio' : 'Service Request')}</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{request.client?.full_name || (es ? 'Solicitud de cliente' : 'Client request')}</h2>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <p className="mt-3 text-sm text-slate-500">{request.description || (es ? 'No hay detalles adicionales.' : 'No extra details provided.')}</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="surface-muted text-sm text-slate-600">
                    <p className="font-medium text-slate-800">{es ? 'Distancia' : 'Distance'}</p>
                    <p className="mt-1">{request.distance_km !== undefined ? formatDistance(request.distance_km) : (es ? 'No disponible' : 'Unavailable')}</p>
                  </div>
                  <div className="surface-muted text-sm text-slate-600">
                    <p className="font-medium text-slate-800">{es ? 'Ubicacion' : 'Location'}</p>
                    <p className="mt-1">{request.latitude !== null && request.latitude !== undefined && request.longitude !== null && request.longitude !== undefined ? `${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}` : (es ? 'No disponible' : 'Unavailable')}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-500">{request.address || (es ? 'Sin referencia de direccion.' : 'No address reference supplied.')}</p>

                <button
                  onClick={() => acceptRequest(request.id)}
                  className="btn-primary mt-5 w-full justify-center"
                  disabled={actingId === request.id}
                >
                  {actingId === request.id ? <LoadingSpinner size="sm" /> : (es ? 'Aceptar solicitud' : 'Accept request')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
