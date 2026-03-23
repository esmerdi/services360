import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Info, MapPin } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LocationMap from '../../components/common/LocationMap';
import UserAvatar from '../../components/common/UserAvatar';
import type { LocationMapMarker } from '../../components/common/LocationMap';
import StatusBadge from '../../components/common/StatusBadge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { formatDistance } from '../../utils/distance';
import { extractManagedAvatarPath } from '../../utils/helpers';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../utils/mapMarkers';
import type { ServiceRequest } from '../../types';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

type NearbyRequest = ServiceRequest & { client?: { full_name?: string | null; email?: string | null; avatar_url?: string | null } };
type NearbyRequestRpcRow = { id: string; distance_km: number };

export default function ProviderNearbyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useI18n();
  const es = language === 'es';
  const { coords, refresh } = useLocation();
  const [requests, setRequests] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [visibleMarkerIds, setVisibleMarkerIds] = useState<string[]>([]);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  const resolveAvatarUrl = React.useCallback((value: string | null | undefined): string | undefined => {
    if (!value) return undefined;

    const objectPath = extractManagedAvatarPath(value);
    if (!objectPath) {
      return value;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(objectPath);
    return data.publicUrl || value;
  }, []);

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
          client:users!service_requests_client_id_fkey(id, full_name, email, avatar_url)
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

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`provider-nearby-requests-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests' },
        (payload) => {
          const updated = payload.new as Partial<ServiceRequest>;
          if (!updated?.id) return;

          let removedRequest: NearbyRequest | undefined;
          if (updated.status !== 'pending' || updated.provider_id) {
            setRequests((current) => {
              removedRequest = current.find((request) => request.id === updated.id);
              return current.filter((request) => request.id !== updated.id);
            });

            if (removedRequest && actingId !== updated.id) {
              setInfoMessage(
                updated.provider_id && updated.provider_id !== user.id
                  ? (es ? 'Una solicitud cercana fue tomada por otro proveedor.' : 'A nearby request was taken by another provider.')
                  : (es ? 'Una solicitud cercana dejó de estar disponible.' : 'A nearby request is no longer available.')
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'service_requests' },
        (payload) => {
          const removed = payload.old as Partial<ServiceRequest>;
          if (!removed?.id) return;

          let removedRequest: NearbyRequest | undefined;
          setRequests((current) => {
            removedRequest = current.find((request) => request.id === removed.id);
            return current.filter((request) => request.id !== removed.id);
          });

          if (removedRequest && actingId !== removed.id) {
            setInfoMessage(es ? 'Una solicitud cercana dejó de estar disponible.' : 'A nearby request is no longer available.');
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [actingId, es, user]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!infoMessage) return;
    const timer = window.setTimeout(() => setInfoMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [infoMessage]);

  async function acceptRequest(requestId: string, redirectToJobs = false) {
    if (!user) return;
    setError(null);
    setSuccessMessage(null);
    setInfoMessage(null);
    setActingId(requestId);
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ provider_id: user.id, status: 'accepted' })
      .eq('id', requestId)
      .is('provider_id', null);

    if (updateError) {
      setActingId(null);
      setError(updateError.message);
      return;
    }

    const { data: acceptedRequest, error: acceptedRequestError } = await supabase
      .from('service_requests')
      .select('id')
      .eq('id', requestId)
      .eq('provider_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle();

    setActingId(null);

    if (acceptedRequestError) {
      setError(acceptedRequestError.message);
      return;
    }

    if (!acceptedRequest) {
      const { data: currentRequest, error: currentRequestError } = await supabase
        .from('service_requests')
        .select('id, status, provider_id')
        .eq('id', requestId)
        .maybeSingle();

      if (currentRequestError) {
        setError(currentRequestError.message);
        return;
      }

      if (!currentRequest || currentRequest.status !== 'pending' || currentRequest.provider_id) {
        setRequests((current) => current.filter((request) => request.id !== requestId));
        setError(es ? 'La solicitud ya fue tomada o dejó de estar disponible.' : 'This request was already taken or is no longer available.');
        return;
      }

      setError(es ? 'No tienes permiso para aceptar esta solicitud.' : 'You do not have permission to accept this request.');
      return;
    }

    setRequests((current) => current.filter((request) => request.id !== requestId));
    setSuccessMessage(es ? 'Solicitud aceptada correctamente.' : 'Request accepted successfully.');

    if (redirectToJobs) {
      window.setTimeout(() => navigate('/provider/jobs'), 900);
    }
  }

  const requestMarkers = React.useMemo(() => {
    const markers: LocationMapMarker[] = requests
      .filter((request) => request.latitude !== null && request.latitude !== undefined && request.longitude !== null && request.longitude !== undefined)
      .map((request) => ({
        id: request.id,
        latitude: request.latitude as number,
        longitude: request.longitude as number,
        label: request.client?.full_name || request.client?.email || (es ? 'Cliente' : 'Client'),
        serviceText: request.service?.name || (es ? 'Solicitud de servicio' : 'Service request'),
        description: request.address || (es ? 'Ubicacion del cliente' : 'Client location'),
        imageUrl: resolveAvatarUrl(request.client?.avatar_url),
        actionLabel: es ? 'Aceptar solicitud' : 'Accept request',
        actionRequestId: request.id,
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
  }, [coords, es, requests, resolveAvatarUrl]);

  const visibleNearbyCount = React.useMemo(() => {
    const requestIds = new Set(requests.map((request) => request.id));
    return visibleMarkerIds.filter((markerId) => requestIds.has(markerId)).length;
  }, [requests, visibleMarkerIds]);

  return (
    <Layout navItems={PROVIDER_NAV} title="Nearby Requests">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{es ? 'Solicitudes cercanas' : 'Nearby Requests'}</h1>
          <p className="page-subtitle">{es ? 'Las solicitudes se ordenan por distancia a tu ubicacion actual.' : 'Requests are ordered by distance from your current position.'}</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {es ? 'Disponibles ahora' : 'Available now'}
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {requests.length === 1
                  ? (es ? '1 solicitud cercana' : '1 nearby request')
                  : es
                    ? `${requests.length} solicitudes cercanas`
                    : `${requests.length} nearby requests`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {es
                  ? `${visibleNearbyCount} visibles en el mapa`
                  : `${visibleNearbyCount} currently visible on the map`}
              </p>
              {requests.length > 0 && visibleNearbyCount < requests.length ? (
                <button
                  type="button"
                  onClick={() => setFitBoundsTrigger((current) => current + 1)}
                  className="mt-2 text-xs font-semibold text-sky-700 transition hover:text-sky-800"
                >
                  {es ? 'Ver todas' : 'See all'}
                </button>
              ) : null}
            </div>
          </div>

          <button onClick={refresh} className="btn-secondary">
            <MapPin className="h-4 w-4" />
            {es ? 'Actualizar GPS' : 'Refresh GPS'}
          </button>
        </div>
      </div>

      {!coords && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          {es ? 'Activa el GPS y marca tu perfil como en linea para recibir solicitudes cercanas.' : 'Enable GPS and mark yourself online from your profile to receive nearby requests.'}
        </div>
      )}

      {error && <ErrorMessage message={error} className="mb-4" />}

      {successMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {infoMessage && (
        <div className="fixed right-4 top-36 z-50 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 shadow-lg">
          <Info className="h-4 w-4 flex-shrink-0" />
          {infoMessage}
        </div>
      )}

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
            <LocationMap
              markers={requestMarkers}
              enableClustering={requestMarkers.length > 8}
              onMarkerActionClick={(marker: LocationMapMarker) => acceptRequest(marker.actionRequestId ?? marker.id, true)}
              actionLoadingMarkerId={actingId}
              onVisibleMarkerIdsChange={setVisibleMarkerIds}
              fitBoundsTrigger={fitBoundsTrigger}
            />
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
                  <div className="flex min-w-0 items-start gap-3">
                    <UserAvatar
                      avatarUrl={request.client?.avatar_url}
                      name={request.client?.full_name || request.client?.email || (es ? 'Cliente' : 'Client')}
                      alt={request.client?.full_name || request.client?.email || (es ? 'Cliente' : 'Client')}
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
