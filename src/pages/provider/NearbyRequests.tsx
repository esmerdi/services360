import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Compass, Filter, Info, MapPin, ShieldCheck } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LazyLocationMap from '../../components/common/LazyLocationMap';
import type { LocationMapMarker } from '../../components/common/LazyLocationMap';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { extractManagedAvatarPath } from '../../utils/helpers';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../utils/mapMarkers';
import NearbyRequestCard from './nearby/NearbyRequestCard';
import { useNearbyRequestActions } from './nearby/useNearbyRequestActions';
import { useNearbyRequestsData } from './nearby/useNearbyRequestsData';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

export default function ProviderNearbyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useI18n();
  const es = language === 'es';
  const { coords, refresh } = useLocation();
  const [visibleMarkerIds, setVisibleMarkerIds] = useState<string[]>([]);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  const {
    requests,
    loading,
    error,
    successMessage,
    infoMessage,
    actingId,
    setRequests,
    setError,
    setSuccessMessage,
    setInfoMessage,
    setActingId,
  } = useNearbyRequestsData({
    userId: user?.id,
    coords,
    es,
  });

  const resolveAvatarUrl = useCallback((value: string | null | undefined): string | undefined => {
    if (!value) return undefined;

    const objectPath = extractManagedAvatarPath(value);
    if (!objectPath) {
      return value;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(objectPath);
    return data.publicUrl || value;
  }, []);

  const { acceptRequest } = useNearbyRequestActions({
    userId: user?.id,
    es,
    requests,
    setRequests,
    setError,
    setSuccessMessage,
    setInfoMessage,
    setActingId,
    onAcceptedRedirect: () => navigate('/provider/jobs'),
  });

  const requestMarkers = useMemo(() => {
    const markers: LocationMapMarker[] = requests
      .filter((request) => request.latitude !== null && request.latitude !== undefined && request.longitude !== null && request.longitude !== undefined)
      .map((request) => ({
        id: request.id,
        latitude: request.latitude as number,
        longitude: request.longitude as number,
        label: request.client?.full_name || request.client?.email || (es ? 'Cliente' : 'Client'),
        serviceText: request.service?.name || (es ? 'Solicitud de servicio' : 'Service request'),
        description: request.address || (es ? 'Ubicación del cliente' : 'Client location'),
        imageUrl: resolveAvatarUrl(request.client?.avatar_url),
        actionLabel: request.provider_id === user?.id
          ? (es ? 'Confirmar solicitud' : 'Confirm request')
          : (es ? 'Aceptar solicitud' : 'Accept request'),
        actionRequestId: request.id,
        color: getCategoryMarkerColor(request.service?.category_id),
        glyph: getCategoryMarkerGlyph(request.service?.category?.icon, request.service?.category?.name),
      }));

    if (coords) {
      markers.unshift({
        id: 'provider-location',
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: es ? 'Tu ubicación' : 'Your location',
        description: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        color: '#2563eb',
        radius: 10,
        glyph: '📍',
      });
    }

    return markers;
  }, [coords, es, requests, resolveAvatarUrl, user?.id]);

  const visibleNearbyCount = useMemo(() => {
    const requestIds = new Set(requests.map((request) => request.id));
    return visibleMarkerIds.filter((markerId) => requestIds.has(markerId)).length;
  }, [requests, visibleMarkerIds]);

  const handleAcceptCardRequest = useCallback((requestId: string) => {
    void acceptRequest(requestId);
  }, [acceptRequest]);

  return (
    <Layout navItems={PROVIDER_NAV} title="Nearby Requests">
      <div className="mb-5 flex flex-col gap-4 md:mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{es ? 'Solicitudes cercanas' : 'Nearby requests'}</h1>
          <p className="mt-1 text-sm text-slate-600 md:text-base">{es ? 'Se ordenan por distancia respecto a tu ubicación actual.' : 'Sorted by distance from your current location.'}</p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <div className="flex items-center gap-2 text-sky-700">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <p className="text-[11px] uppercase tracking-wide">{es ? 'Disponibles' : 'Available'}</p>
              </div>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {requests.length}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Compass className="h-4 w-4" aria-hidden="true" />
                <p className="text-[11px] uppercase tracking-wide">{es ? 'Visibles en mapa' : 'Visible on map'}</p>
              </div>
              <p className="mt-1 text-xl font-semibold text-slate-900">{visibleNearbyCount}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter className="h-4 w-4" aria-hidden="true" />
                <p className="text-[11px] uppercase tracking-wide">{es ? 'Criterio' : 'Criteria'}</p>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-700">{es ? 'Prioridad por cercanía' : 'Closest first'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
            {requests.length > 0 && visibleNearbyCount < requests.length ? (
              <button
                type="button"
                onClick={() => setFitBoundsTrigger((current) => current + 1)}
                className="btn-secondary"
              >
                <Compass className="h-4 w-4" />
                {es ? 'Ver todas en mapa' : 'See all on map'}
              </button>
            ) : null}

            <button onClick={refresh} className="btn-secondary">
              <MapPin className="h-4 w-4" />
              {es ? 'Actualizar GPS' : 'Refresh GPS'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          {es
            ? 'Acepta solicitudes que coincidan con tus servicios y zona.'
            : 'Accept requests that match your services and area.'}
        </div>
      </div>

      {!coords && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          {es ? 'Activa el GPS y marca tu perfil como en línea para recibir solicitudes cercanas.' : 'Enable GPS and mark yourself online from your profile to receive nearby requests.'}
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
          <div className="card p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <MapPin className="h-4 w-4 text-sky-600" aria-hidden="true" />
              <h2 className="text-base font-semibold md:text-lg">{es ? 'Mapa de solicitudes' : 'Requests map'}</h2>
            </div>
            <p className="mb-3 text-sm text-slate-500">
              {es ? 'Visualiza tu posición y solicitudes cercanas sobre OpenStreetMap.' : 'See your position and nearby requests on OpenStreetMap.'}
            </p>
            <LazyLocationMap
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
              <div className="card p-5 xl:col-span-2">
                <p className="text-center text-slate-500">{es ? 'No hay solicitudes cercanas disponibles ahora.' : 'No nearby requests available right now.'}</p>
              </div>
            )}
            {requests.map((request) => (
              <NearbyRequestCard
                key={request.id}
                request={request}
                es={es}
                userId={user?.id}
                actingId={actingId}
                onAccept={handleAcceptCardRequest}
              />
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
