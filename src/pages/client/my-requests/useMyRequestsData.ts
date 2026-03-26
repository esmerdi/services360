import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Category, ServiceRequest } from '../../../types';

type UseMyRequestsDataParams = {
  userId: string | undefined;
};

export function useMyRequestsData({ userId }: UseMyRequestsDataParams) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<Array<Pick<Category, 'id' | 'name' | 'parent_id'>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratedRequestIds, setRatedRequestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const currentUserId = userId;

    async function fetchRequests() {
      setLoading(true);
      const [requestsRes, categoriesRes] = await Promise.all([
        supabase
          .from('service_requests')
          .select(`
            *,
            provider:users!service_requests_provider_id_fkey(id, full_name, email, avatar_url),
            service:services(id, name, category_id)
          `)
          .eq('client_id', currentUserId)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name, parent_id'),
      ]);

      if (requestsRes.error) {
        setError(requestsRes.error.message);
        setLoading(false);
        return;
      }

      if (categoriesRes.error) {
        setError(categoriesRes.error.message);
        setLoading(false);
        return;
      }

      const requestRows = (requestsRes.data as ServiceRequest[]) ?? [];
      const providerIds = Array.from(new Set(requestRows.map((request) => request.provider_id).filter(Boolean))) as string[];
      const requestIds = requestRows.map((request) => request.id);

      const [providerRatingsRes, requestRatingsRes] = await Promise.all([
        providerIds.length > 0
          ? supabase.from('ratings').select('to_user_id, rating').in('to_user_id', providerIds)
          : Promise.resolve({ data: [], error: null }),
        requestIds.length > 0
          ? supabase.from('ratings').select('request_id').in('request_id', requestIds).eq('from_user_id', currentUserId)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (providerRatingsRes.error) {
        setError(providerRatingsRes.error.message);
        setLoading(false);
        return;
      }

      if (requestRatingsRes.error) {
        setError(requestRatingsRes.error.message);
        setLoading(false);
        return;
      }

      const providerRatingMap = new Map<string, { total: number; count: number }>();
      for (const rating of (providerRatingsRes.data as Array<{ to_user_id: string; rating: number }>) ?? []) {
        const current = providerRatingMap.get(rating.to_user_id) ?? { total: 0, count: 0 };
        current.total += rating.rating;
        current.count += 1;
        providerRatingMap.set(rating.to_user_id, current);
      }

      const enhancedRequests = requestRows.map((request) => {
        if (!request.provider) return request;
        const providerStats = providerRatingMap.get(request.provider.id);
        return {
          ...request,
          provider: {
            ...request.provider,
            avg_rating: providerStats ? providerStats.total / providerStats.count : 0,
            ratings_count: providerStats?.count ?? 0,
          },
        };
      });

      setRequests(enhancedRequests);
      setRatedRequestIds(new Set(((requestRatingsRes.data as Array<{ request_id: string }>) ?? []).map((item) => item.request_id)));
      setCategories((categoriesRes.data as Array<Pick<Category, 'id' | 'name' | 'parent_id'>>) ?? []);
      setLoading(false);
    }

    void fetchRequests();

    const channel = supabase
      .channel(`client-my-requests-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests', filter: `client_id=eq.${currentUserId}` },
        () => {
          void fetchRequests();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings', filter: `from_user_id=eq.${currentUserId}` },
        () => {
          void fetchRequests();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  function markRequestAsRated(requestId: string) {
    setRatedRequestIds((current) => {
      const next = new Set(current);
      next.add(requestId);
      return next;
    });
  }

  return {
    requests,
    categories,
    loading,
    error,
    ratedRequestIds,
    markRequestAsRated,
  };
}
