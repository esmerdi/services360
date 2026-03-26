import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Category, Rating, RequestStatusHistory, ServiceRequest } from '../../../types';

type UseRequestDetailDataParams = {
  requestId: string | undefined;
};

export function useRequestDetailData({ requestId }: UseRequestDetailDataParams) {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [categories, setCategories] = useState<Array<Pick<Category, 'id' | 'name' | 'parent_id'>>>([]);
  const [history, setHistory] = useState<RequestStatusHistory[]>([]);
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;

    async function fetchDetails() {
      setLoading(true);
      const [requestRes, historyRes, ratingRes, categoriesRes] = await Promise.all([
        supabase
          .from('service_requests')
          .select(`
            *,
            service:services(id, name, category_id, category:categories(id, name, icon)),
            client:users!service_requests_client_id_fkey(id, full_name, email),
            provider:users!service_requests_provider_id_fkey(id, full_name, email, avatar_url)
          `)
          .eq('id', requestId)
          .single(),
        supabase.from('request_status_history').select('*').eq('request_id', requestId).order('created_at'),
        supabase.from('ratings').select('*').eq('request_id', requestId).maybeSingle(),
        supabase.from('categories').select('id, name, parent_id'),
      ]);

      if (requestRes.error) {
        setError(requestRes.error.message);
      } else if (categoriesRes.error) {
        setError(categoriesRes.error.message);
      } else {
        const requestData = requestRes.data as ServiceRequest;

        if (requestData.provider_id) {
          const { data: providerRatings, error: providerRatingsError } = await supabase
            .from('ratings')
            .select('rating')
            .eq('to_user_id', requestData.provider_id);

          if (providerRatingsError) {
            setError(providerRatingsError.message);
            setLoading(false);
            return;
          }

          const ratings = (providerRatings as Array<{ rating: number }>) ?? [];
          const ratingsCount = ratings.length;
          const avgRating = ratingsCount > 0
            ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratingsCount
            : 0;

          if (requestData.provider) {
            requestData.provider = {
              ...requestData.provider,
              avg_rating: avgRating,
              ratings_count: ratingsCount,
            };
          }
        }

        setRequest(requestData);
        setCategories((categoriesRes.data as Array<Pick<Category, 'id' | 'name' | 'parent_id'>>) ?? []);
      }

      setHistory((historyRes.data as RequestStatusHistory[]) ?? []);
      setRating((ratingRes.data as Rating | null) ?? null);
      setLoading(false);
    }

    void fetchDetails();

    const channel = supabase
      .channel(`request-detail-${requestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests', filter: `id=eq.${requestId}` },
        () => {
          void fetchDetails();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'request_status_history', filter: `request_id=eq.${requestId}` },
        () => {
          void fetchDetails();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId]);

  return {
    request,
    categories,
    history,
    rating,
    loading,
    error,
    setRequest,
    setRating,
    setError,
  };
}
