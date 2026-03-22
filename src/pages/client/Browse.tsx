import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LocationMap from '../../components/common/LocationMap';
import StarRating from '../../components/common/StarRating';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';
import type { LocationMapMarker } from '../../components/common/LocationMap';
import { formatDistance, haversineDistance } from '../../utils/distance';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../utils/mapMarkers';
import type { Category, Service } from '../../types';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

type ServiceWithCategory = Service & {
  category?: Pick<Category, 'id' | 'name'>;
  avg_rating?: number;
  ratings_count?: number;
  providers_count?: number;
};

type NearbyProviderMap = {
  id: string;
  full_name: string | null;
  email: string;
  location: { latitude: number; longitude: number; address: string | null };
  root_category_ids: string[];
  distance_km?: number;
};

const CATEGORY_PALETTE = [
  { badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500', ring: 'border-violet-300 hover:border-violet-400' },
  { badge: 'bg-sky-50 text-sky-700',       dot: 'bg-sky-500',    ring: 'border-sky-300 hover:border-sky-400' },
  { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', ring: 'border-emerald-300 hover:border-emerald-400' },
  { badge: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500',  ring: 'border-amber-300 hover:border-amber-400' },
  { badge: 'bg-rose-50 text-rose-700',     dot: 'bg-rose-500',   ring: 'border-rose-300 hover:border-rose-400' },
  { badge: 'bg-teal-50 text-teal-700',     dot: 'bg-teal-500',   ring: 'border-teal-300 hover:border-teal-400' },
  { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', ring: 'border-orange-300 hover:border-orange-400' },
  { badge: 'bg-pink-50 text-pink-700',     dot: 'bg-pink-500',   ring: 'border-pink-300 hover:border-pink-400' },
] as const;

export default function ClientBrowse() {
  const { t } = useI18n();
  const { coords, refresh } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProviderMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRootCategory, setSelectedRootCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    // Reset service when root category changes
    setSelectedService(null);
  }, [selectedRootCategory]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [catRes, serviceRes, providerServiceRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('services').select('*, category:categories(id, name)').order('name'),
        supabase.from('provider_services').select('service_id, provider_id'),
      ]);

      if (catRes.error) {
        setError(catRes.error.message);
      } else if (serviceRes.error) {
        setError(serviceRes.error.message);
      } else if (providerServiceRes.error) {
        setError(providerServiceRes.error.message);
      } else {
        const categoryRows = (catRes.data as Category[]) ?? [];
        const serviceRows = (serviceRes.data as ServiceWithCategory[]) ?? [];
        const providerLinks = (providerServiceRes.data as Array<{ service_id: string; provider_id: string }>) ?? [];
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

          for (const rating of (ratingsData as Array<{ to_user_id: string; rating: number }>) ?? []) {
            const current = providerRatingMap.get(rating.to_user_id) ?? { total: 0, count: 0 };
            current.total += rating.rating;
            current.count += 1;
            providerRatingMap.set(rating.to_user_id, current);
          }
        }

        const categoryById = new Map(categoryRows.map((category) => [category.id, category] as const));
        const getRootCategoryId = (categoryId: string | null | undefined): string | null => {
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
        };

        const serviceCategoryMap = new Map(serviceRows.map((service) => [service.id, service.category_id] as const));

        const rootCategoriesByProvider = new Map<string, Set<string>>();
        for (const link of providerLinks) {
          const serviceCategoryId = serviceCategoryMap.get(link.service_id);
          const rootCategoryId = getRootCategoryId(serviceCategoryId);
          if (!rootCategoryId) continue;
          const current = rootCategoriesByProvider.get(link.provider_id) ?? new Set<string>();
          current.add(rootCategoryId);
          rootCategoriesByProvider.set(link.provider_id, current);
        }

        const { data: providerUsers, error: providerUsersError } = await supabase
          .from('users')
          .select('id, full_name, email, role, is_available')
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

        const locationMap = new Map(
          ((locationData as Array<{ user_id: string; latitude: number; longitude: number; address: string | null }>) ?? []).map((location) => [
            location.user_id,
            location,
          ])
        );

        const providerMapRows = ((providerUsers as Array<{ id: string; full_name: string | null; email: string }>) ?? []).reduce<NearbyProviderMap[]>(
          (acc, provider) => {
            const location = locationMap.get(provider.id);
            if (!location) return acc;
            const rootCategoryIds = Array.from(rootCategoriesByProvider.get(provider.id) ?? []);
            if (rootCategoryIds.length === 0) return acc;

            acc.push({
              id: provider.id,
              full_name: provider.full_name,
              email: provider.email,
              location: {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
              },
              root_category_ids: rootCategoryIds,
              distance_km: coords
                ? haversineDistance(
                    coords.latitude,
                    coords.longitude,
                    location.latitude,
                    location.longitude
                  )
                : undefined,
            });

            return acc;
          },
          []
        ).sort((left, right) => (left.distance_km ?? Infinity) - (right.distance_km ?? Infinity));

        const providersByService = new Map<string, string[]>();
        for (const link of providerLinks) {
          const current = providersByService.get(link.service_id) ?? [];
          current.push(link.provider_id);
          providersByService.set(link.service_id, current);
        }

        const enrichedServices = serviceRows.map((service) => {
          const providerIdsForService = providersByService.get(service.id) ?? [];
          const aggregate = providerIdsForService.reduce(
            (acc, providerId) => {
              const providerStats = providerRatingMap.get(providerId);
              if (!providerStats) return acc;
              acc.total += providerStats.total;
              acc.count += providerStats.count;
              return acc;
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

        setCategories(categoryRows);
        setServices(enrichedServices);
        setNearbyProviders(providerMapRows);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const category of categories) {
      const key = category.parent_id ?? null;
      const existing = map.get(key);
      if (existing) {
        existing.push(category);
      } else {
        map.set(key, [category]);
      }
    }
    return map;
  }, [categories]);

  const getCategoryPath = useCallback((categoryId: string | null | undefined) => {
    if (!categoryId) return t('clientBrowse.generalCategory');

    const path: string[] = [];
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);

    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      path.unshift(current.name);
      current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
    }

    return path.length > 0 ? path.join(' > ') : t('clientBrowse.generalCategory');
  }, [categoryMap, t]);

  const getDescendantCategoryIds = useCallback((rootId: string) => {
    const descendants = new Set<string>();
    const stack = [rootId];

    while (stack.length > 0) {
      const currentId = stack.pop() as string;
      if (descendants.has(currentId)) continue;
      descendants.add(currentId);

      const children = childrenByParent.get(currentId) ?? [];
      for (const child of children) {
        stack.push(child.id);
      }
    }

    return descendants;
  }, [childrenByParent]);

  const countServicesForCategory = useCallback((categoryId: string) => {
    const validIds = getDescendantCategoryIds(categoryId);
    return services.filter((service) => service.category_id && validIds.has(service.category_id)).length;
  }, [getDescendantCategoryIds, services]);

  const topLevelCategories = useMemo(
    () => categories.filter((category: Category) => !category.parent_id),
    [categories]
  );

  const subcategoriesForSelectedRoot = useMemo(() => {
    if (!selectedRootCategory) return [];
    const children = childrenByParent.get(selectedRootCategory) ?? [];
    return children.sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedRootCategory, childrenByParent]);

  const servicesForSelectedRoot = useMemo(() => {
    if (!selectedRootCategory) return [];
    const descendantCategoryIds = getDescendantCategoryIds(selectedRootCategory);
    return services
      .filter((service) => service.category_id && descendantCategoryIds.has(service.category_id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedRootCategory, services, getDescendantCategoryIds]);

  const selectedServiceData = useMemo(() => {
    if (!selectedService) return null;
    return services.find((s) => s.id === selectedService);
  }, [selectedService, services]);

  const rootColorMap = useMemo(() => {
    const map = new Map<string, number>();
    topLevelCategories.forEach((cat, index) => {
      map.set(cat.id, index % CATEGORY_PALETTE.length);
    });
    return map;
  }, [topLevelCategories]);

  const getRootCategoryId = useCallback((categoryId: string | null | undefined): string | null => {
    if (!categoryId) return null;
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);
    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      if (!current.parent_id) return current.id;
      current = categoryMap.get(current.parent_id);
    }
    return categoryId;
  }, [categoryMap]);

  const getCategoryColor = useCallback((categoryId: string | null | undefined) => {
    const rootId = getRootCategoryId(categoryId);
    const index = rootId !== null ? (rootColorMap.get(rootId) ?? 0) : 0;
    return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
  }, [getRootCategoryId, rootColorMap]);

  const selectedRootCategoryId = useMemo(() => {
    return selectedRootCategory;
  }, [selectedRootCategory]);

  const filteredNearbyProviders = useMemo(() => {
    if (!selectedRootCategoryId) return nearbyProviders;
    return nearbyProviders.filter((provider) => provider.root_category_ids.includes(selectedRootCategoryId));
  }, [nearbyProviders, selectedRootCategoryId]);

  const nearbyProviderMarkers = useMemo(() => {
    const markers: LocationMapMarker[] = filteredNearbyProviders.map((provider) => {
      const markerRootCategoryId = selectedRootCategoryId ?? provider.root_category_ids[0] ?? null;
      const rootCategory = markerRootCategoryId ? categoryMap.get(markerRootCategoryId) : null;

      const distanceLabel = provider.distance_km !== undefined
        ? formatDistance(provider.distance_km)
        : t('clientRequestService.distanceUnavailable');

      return {
        id: provider.id,
        latitude: provider.location.latitude,
        longitude: provider.location.longitude,
        label: provider.full_name || provider.email,
        description: `${rootCategory?.name || t('clientBrowse.generalCategory')} • ${distanceLabel}`,
        color: getCategoryMarkerColor(markerRootCategoryId),
        glyph: getCategoryMarkerGlyph(rootCategory?.icon, rootCategory?.name),
      };
    });

    if (coords) {
      markers.unshift({
        id: 'client-location-browse',
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: t('clientRequestService.currentLocation'),
        description: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        color: '#2563eb',
        radius: 10,
        glyph: '📍',
      });
    }

    return markers;
  }, [categoryMap, coords, filteredNearbyProviders, selectedRootCategoryId, t]);

  return (
    <Layout navItems={CLIENT_NAV} title="Browse Services">
      <div className="page-header">
        <h1 className="page-title">{t('clientBrowse.title')}</h1>
        <p className="page-subtitle">{t('clientBrowse.subtitle')}</p>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="card grid gap-6 lg:grid-cols-[1fr_384px]">
          {/* Map Container */}
          <div className="rounded-lg overflow-hidden bg-slate-50 min-h-96 lg:min-h-[600px]">
            {!coords ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-100">
                <p className="text-slate-600">{t('clientBrowse.enableLocationForMap')}</p>
                <button type="button" className="btn-secondary" onClick={refresh}>
                  {t('clientRequestService.detectLocation')}
                </button>
              </div>
            ) : nearbyProviderMarkers.length <= 1 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-100">
                <p className="text-slate-500">{t('clientBrowse.noMapProviders')}</p>
              </div>
            ) : (
              <LocationMap markers={nearbyProviderMarkers} heightClassName="h-96 lg:h-[600px]" />
            )}
          </div>

          {/* Filter Card */}
          <div className="bg-white rounded-lg p-4 h-fit lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('clientBrowse.nearbyProvidersMapTitle')}</h2>
            
            {/* Root Category Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('clientBrowse.selectParentCategory')}
              </label>
              <select
                className="input w-full"
                value={selectedRootCategory || ''}
                onChange={(e) => setSelectedRootCategory(e.target.value || null)}
              >
                <option value="">{t('common.all')}</option>
                {topLevelCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('clientBrowse.selectService')}
              </label>
              <select
                className="input w-full"
                value={selectedService || ''}
                onChange={(e) => setSelectedService(e.target.value || null)}
                disabled={!selectedRootCategory}
              >
                <option value="">
                  {!selectedRootCategory 
                    ? t('clientBrowse.noServicesAvailable')
                    : servicesForSelectedRoot.length === 0 
                    ? t('clientBrowse.noServicesAvailable')
                    : t('clientBrowse.selectService')}
                </option>
                {servicesForSelectedRoot.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Details & Request Button */}
            {selectedServiceData && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900">{selectedServiceData.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedServiceData.description}</p>
                  
                  {selectedServiceData.avg_rating !== undefined && selectedServiceData.ratings_count !== undefined && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <StarRating value={selectedServiceData.avg_rating ?? 0} readonly size="sm" />
                      <span className="text-slate-600">
                        {selectedServiceData.ratings_count && selectedServiceData.ratings_count > 0
                          ? `${(selectedServiceData.avg_rating ?? 0).toFixed(1)} (${selectedServiceData.ratings_count})`
                          : t('clientBrowse.noRatingsYet')}
                      </span>
                    </div>
                  )}

                  {selectedServiceData.providers_count !== undefined && (
                    <p className="text-xs text-slate-500 mt-2">
                      {selectedServiceData.providers_count} {t('clientBrowse.providersAvailable')}
                    </p>
                  )}
                </div>

                <Link 
                  to={`/client/request/${selectedServiceData.id}`} 
                  className="btn-primary w-full justify-center"
                >
                  {t('clientBrowse.requestServiceButton')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
