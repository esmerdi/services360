import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { haversineDistance } from '../../../utils/distance';
import type { User } from '../../../types';
import type {
  NearbyProvider,
  RequestServiceCategory,
  RequestServiceCoords,
  ServiceDetails,
} from './types';

type UseRequestServiceDataParams = {
  serviceId: string | undefined;
  coords: RequestServiceCoords | null;
  t: (key: string) => string;
};

export function useRequestServiceData({ serviceId, coords, t }: UseRequestServiceDataParams) {
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [categories, setCategories] = useState<RequestServiceCategory[]>([]);
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setError(t('clientRequestService.serviceNotFound'));
      setLoading(false);
      return;
    }

    if (!coords) {
      setLoading(false);
      return;
    }

    const currentCoords = coords;

    async function fetchData() {
      setLoading(true);
      const [serviceRes, categoriesRes] = await Promise.all([
        supabase
          .from('services')
          .select('*, category:categories(id, name, icon)')
          .eq('id', serviceId)
          .single(),
        supabase.from('categories').select('id, name, parent_id'),
      ]);

      const serviceData = serviceRes.data;
      const serviceError = serviceRes.error;
      const categoriesData = categoriesRes.data;
      const categoriesError = categoriesRes.error;

      if (serviceError) {
        setError(serviceError.message);
        setLoading(false);
        return;
      }

      if (categoriesError) {
        setError(categoriesError.message);
        setLoading(false);
        return;
      }

      const { data: providerLinks, error: linkError } = await supabase
        .from('provider_services')
        .select('provider_id')
        .eq('service_id', serviceId);

      if (linkError) {
        setError(linkError.message);
        setLoading(false);
        return;
      }

      const providerIds = ((providerLinks as Array<{ provider_id: string }> | null) ?? []).map(
        (item) => item.provider_id
      );

      let providerRows: NearbyProvider[] = [];

      if (providerIds.length > 0) {
        const { data: providerData, error: providerError } = await supabase
          .from('users')
          .select('*')
          .in('id', providerIds)
          .eq('role', 'provider')
          .eq('is_available', true);

        if (providerError) {
          setError(providerError.message);
          setLoading(false);
          return;
        }

        const filteredProviderIds = ((providerData as User[]) ?? []).map((provider) => provider.id);
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('user_id, latitude, longitude, address')
          .in('user_id', filteredProviderIds);

        if (locationError) {
          setError(locationError.message);
          setLoading(false);
          return;
        }

        const { data: providerRatings, error: providerRatingsError } = await supabase
          .from('ratings')
          .select('to_user_id, rating')
          .in('to_user_id', filteredProviderIds);

        if (providerRatingsError) {
          setError(providerRatingsError.message);
          setLoading(false);
          return;
        }

        const providerRatingMap = new Map<string, { total: number; count: number }>();
        for (const rating of (providerRatings as Array<{ to_user_id: string; rating: number }>) ?? []) {
          const current = providerRatingMap.get(rating.to_user_id) ?? { total: 0, count: 0 };
          current.total += rating.rating;
          current.count += 1;
          providerRatingMap.set(rating.to_user_id, current);
        }

        const locationMap = new Map(
          ((locationData as Array<{ user_id: string; latitude: number; longitude: number; address: string | null }>) ?? []).map((location) => [
            location.user_id,
            location,
          ])
        );

        providerRows = ((providerData as User[]) ?? [])
          .map((provider) => ({
            ...provider,
            location: locationMap.get(provider.id),
            avg_rating: providerRatingMap.has(provider.id)
              ? providerRatingMap.get(provider.id)!.total / providerRatingMap.get(provider.id)!.count
              : 0,
            ratings_count: providerRatingMap.get(provider.id)?.count ?? 0,
            distance_km: locationMap.get(provider.id)
              ? haversineDistance(
                  currentCoords.latitude,
                  currentCoords.longitude,
                  locationMap.get(provider.id)!.latitude,
                  locationMap.get(provider.id)!.longitude
                )
              : undefined,
          }))
          .sort((left, right) => (left.distance_km ?? Infinity) - (right.distance_km ?? Infinity));
      }

      setService(serviceData as ServiceDetails);
      setCategories((categoriesData as RequestServiceCategory[]) ?? []);
      setProviders(providerRows);
      setLoading(false);
    }

    void fetchData();
  }, [coords, serviceId, t]);

  return {
    service,
    categories,
    providers,
    loading,
    error,
    setError,
  };
}
