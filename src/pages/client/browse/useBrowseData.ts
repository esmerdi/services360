import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Category } from '../../../types';
import { haversineDistance } from '../../../utils/distance';
import type { NearbyProviderMap, ServiceWithCategory } from './types';

type BrowseCoords = {
  latitude: number;
  longitude: number;
};

type ProviderLink = {
  service_id: string;
  provider_id: string;
};

type ProviderRatingRow = {
  to_user_id: string;
  rating: number;
};

type ProviderUserRow = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
};

type ProviderLocationRow = {
  user_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
};

function createProviderRatingMap(ratings: ProviderRatingRow[]) {
  const providerRatingMap = new Map<string, { total: number; count: number }>();

  for (const rating of ratings) {
    const current = providerRatingMap.get(rating.to_user_id) ?? { total: 0, count: 0 };
    current.total += rating.rating;
    current.count += 1;
    providerRatingMap.set(rating.to_user_id, current);
  }

  return providerRatingMap;
}

function getRootCategoryId(categoryId: string | null | undefined, categoryById: Map<string, Category>) {
  if (!categoryId) return null;

  const visited = new Set<string>();
  let current = categoryById.get(categoryId);

  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);

    if (!current.parent_id) return current.id;
    current = current.parent_id ? categoryById.get(current.parent_id) : undefined;
  }

  return categoryId;
}

function createProviderCatalog(
  categoryRows: Category[],
  serviceRows: ServiceWithCategory[],
  providerLinks: ProviderLink[]
) {
  const categoryById = new Map(categoryRows.map((category) => [category.id, category] as const));
  const serviceCategoryMap = new Map(serviceRows.map((service) => [service.id, service.category_id] as const));
  const serviceById = new Map(serviceRows.map((service) => [service.id, service] as const));
  const rootCategoriesByProvider = new Map<string, Set<string>>();
  const offeredServicesByProvider = new Map<string, NearbyProviderMap['offered_services']>();

  for (const link of providerLinks) {
    const serviceCategoryId = serviceCategoryMap.get(link.service_id);
    const rootCategoryId = getRootCategoryId(serviceCategoryId, categoryById);
    if (!rootCategoryId) continue;

    const linkedService = serviceById.get(link.service_id);
    if (linkedService) {
      const currentServices = offeredServicesByProvider.get(link.provider_id) ?? [];
      currentServices.push({
        id: linkedService.id,
        name: linkedService.name,
        root_category_id: rootCategoryId,
      });
      offeredServicesByProvider.set(link.provider_id, currentServices);
    }

    const currentRootCategories = rootCategoriesByProvider.get(link.provider_id) ?? new Set<string>();
    currentRootCategories.add(rootCategoryId);
    rootCategoriesByProvider.set(link.provider_id, currentRootCategories);
  }

  return { rootCategoriesByProvider, offeredServicesByProvider };
}

function buildNearbyProviders(params: {
  providerUsers: ProviderUserRow[];
  locations: ProviderLocationRow[];
  rootCategoriesByProvider: Map<string, Set<string>>;
  offeredServicesByProvider: Map<string, NearbyProviderMap['offered_services']>;
  providerRatingMap: Map<string, { total: number; count: number }>;
  coords: BrowseCoords | null;
}) {
  const { providerUsers, locations, rootCategoriesByProvider, offeredServicesByProvider, providerRatingMap, coords } = params;
  const locationMap = new Map(locations.map((location) => [location.user_id, location] as const));

  return providerUsers
    .reduce<NearbyProviderMap[]>((accumulator, provider) => {
      const location = locationMap.get(provider.id);
      if (!location) return accumulator;

      const rootCategoryIds = Array.from(rootCategoriesByProvider.get(provider.id) ?? []);
      if (rootCategoryIds.length === 0) return accumulator;

      const providerStats = providerRatingMap.get(provider.id);
      const offeredServices = offeredServicesByProvider.get(provider.id) ?? [];

      accumulator.push({
        id: provider.id,
        full_name: provider.full_name,
        email: provider.email,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        },
        root_category_ids: rootCategoryIds,
        avatar_url: provider.avatar_url || null,
        avg_rating: providerStats && providerStats.count > 0 ? providerStats.total / providerStats.count : 0,
        ratings_count: providerStats?.count ?? 0,
        offered_services: offeredServices,
        distance_km: coords
          ? haversineDistance(coords.latitude, coords.longitude, location.latitude, location.longitude)
          : undefined,
      });

      return accumulator;
    }, [])
    .sort((left, right) => (left.distance_km ?? Infinity) - (right.distance_km ?? Infinity));
}

function enrichServicesWithProviderStats(serviceRows: ServiceWithCategory[], providerLinks: ProviderLink[], providerRatingMap: Map<string, { total: number; count: number }>) {
  const providersByService = new Map<string, string[]>();

  for (const link of providerLinks) {
    const currentProviders = providersByService.get(link.service_id) ?? [];
    currentProviders.push(link.provider_id);
    providersByService.set(link.service_id, currentProviders);
  }

  return serviceRows.map((service) => {
    const providerIdsForService = providersByService.get(service.id) ?? [];
    const aggregate = providerIdsForService.reduce(
      (accumulator, providerId) => {
        const providerStats = providerRatingMap.get(providerId);
        if (!providerStats) return accumulator;

        accumulator.total += providerStats.total;
        accumulator.count += providerStats.count;
        return accumulator;
      },
      { total: 0, count: 0 }
    );

    return {
      ...service,
      providers_count: providerIdsForService.length,
      ratings_count: aggregate.count,
      avg_rating: aggregate.count > 0 ? aggregate.total / aggregate.count : 0,
    };
  });
}

export function useBrowseData(coords: BrowseCoords | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProviderMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [categoryResponse, serviceResponse, providerServiceResponse] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('services').select('*, category:categories(id, name)').order('name'),
        supabase.from('provider_services').select('service_id, provider_id'),
      ]);

      if (categoryResponse.error) {
        setError(categoryResponse.error.message);
        setLoading(false);
        return;
      }

      if (serviceResponse.error) {
        setError(serviceResponse.error.message);
        setLoading(false);
        return;
      }

      if (providerServiceResponse.error) {
        setError(providerServiceResponse.error.message);
        setLoading(false);
        return;
      }

      const categoryRows = (categoryResponse.data as Category[]) ?? [];
      const serviceRows = (serviceResponse.data as ServiceWithCategory[]) ?? [];
      const providerLinks = (providerServiceResponse.data as ProviderLink[]) ?? [];
      const providerIds = Array.from(new Set(providerLinks.map((item) => item.provider_id)));
      let providerRatingMap = new Map<string, { total: number; count: number }>();

      if (providerIds.length > 0) {
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('ratings')
          .select('to_user_id, rating')
          .in('to_user_id', providerIds);

        if (ratingsError) {
          setError(ratingsError.message);
          setLoading(false);
          return;
        }

        providerRatingMap = createProviderRatingMap((ratingsData as ProviderRatingRow[]) ?? []);
      }

      const { rootCategoriesByProvider, offeredServicesByProvider } = createProviderCatalog(
        categoryRows,
        serviceRows,
        providerLinks
      );

      const { data: providerUsers, error: providerUsersError } = await supabase
        .from('users')
        .select('id, full_name, email, role, is_available, avatar_url')
        .in('id', providerIds)
        .eq('role', 'provider')
        .eq('is_available', true);

      if (providerUsersError) {
        setError(providerUsersError.message);
        setLoading(false);
        return;
      }

      const availableProviderIds = ((providerUsers as Array<{ id: string }>) ?? []).map((provider) => provider.id);
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('user_id, latitude, longitude, address')
        .in('user_id', availableProviderIds);

      if (locationError) {
        setError(locationError.message);
        setLoading(false);
        return;
      }

      setCategories(categoryRows);
      setServices(enrichServicesWithProviderStats(serviceRows, providerLinks, providerRatingMap));
      setNearbyProviders(
        buildNearbyProviders({
          providerUsers: (providerUsers as ProviderUserRow[]) ?? [],
          locations: (locationData as ProviderLocationRow[]) ?? [],
          rootCategoriesByProvider,
          offeredServicesByProvider,
          providerRatingMap,
          coords,
        })
      );
      setError(null);
      setLoading(false);
    }

    void fetchData();
  }, [coords]);

  return {
    categories,
    services,
    nearbyProviders,
    loading,
    error,
    setError,
  };
}