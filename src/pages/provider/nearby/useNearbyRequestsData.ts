import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ServiceRequest } from '../../../types';
import type { NearbyCoords, NearbyRequest, NearbyRequestRpcRow } from './types';

type UseNearbyRequestsDataParams = {
  userId: string | undefined;
  coords: NearbyCoords | null;
  es: boolean;
};

export function useNearbyRequestsData({ userId, coords, es }: UseNearbyRequestsDataParams) {
  const [requests, setRequests] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !coords) {
      setLoading(false);
      return;
    }

    const currentUserId = userId;
    const currentCoords = coords;

    async function fetchRequests() {
      setLoading(true);
      const { data, error: requestError } = await supabase.rpc('get_nearby_requests', {
        provider_lat: currentCoords.latitude,
        provider_lon: currentCoords.longitude,
        p_provider_id: currentUserId,
        radius_km: 20,
      });

      if (requestError) {
        setError(requestError.message);
        setLoading(false);
        return;
      }

      const rpcRows = (data as NearbyRequestRpcRow[] | null) ?? [];
      const requestIds = rpcRows.map((request) => request.id);
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
        setLoading(false);
        return;
      }

      const distanceMap = new Map<string, number>(
        rpcRows.map((request) => [request.id, request.distance_km])
      );

      const merged = ((details as NearbyRequest[]) ?? [])
        .filter((request) => request.provider_id === null || request.provider_id === currentUserId)
        .map((request) => ({
          ...request,
          distance_km: distanceMap.get(request.id),
        }));

      merged.sort((left, right) => (left.distance_km ?? Infinity) - (right.distance_km ?? Infinity));
      setRequests(merged);
      setLoading(false);
    }

    void fetchRequests();
  }, [coords, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`provider-nearby-requests-${userId}`)
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
                updated.provider_id && updated.provider_id !== userId
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
  }, [actingId, es, userId]);

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

  return {
    requests,
    loading,
    error,
    successMessage,
    infoMessage,
    actingId,
    setRequests,
    setLoading,
    setError,
    setSuccessMessage,
    setInfoMessage,
    setActingId,
  };
}
