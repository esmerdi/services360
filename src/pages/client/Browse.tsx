import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LocationMap from '../../components/common/LocationMap';
import StarRating from '../../components/common/StarRating';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';
import type { LocationMapMarker } from '../../components/common/LocationMap';
import { formatDistance, haversineDistance } from '../../utils/distance';
import { extractManagedAvatarPath } from '../../utils/helpers';
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
  avatar_url?: string | null;
  avg_rating?: number;
  ratings_count?: number;
  offered_services: Array<{ id: string; name: string; root_category_id: string | null }>;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { coords, refresh } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProviderMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickRequestingMarkerId, setQuickRequestingMarkerId] = useState<string | null>(null);
  const [selectedRootCategory, setSelectedRootCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [visibleMarkerIds, setVisibleMarkerIds] = useState<string[]>([]);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  const resolveAvatarUrl = useCallback((value: string | null | undefined): string | undefined => {
    if (!value) return undefined;

    const objectPath = extractManagedAvatarPath(value);
    if (!objectPath) {
      return value;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(objectPath);
    return data.publicUrl || value;
  }, []);

  useEffect(() => {
    // Reset service when root category changes
    setSelectedService(null);
    setSelectedProviderId(null);
  }, [selectedRootCategory]);

  useEffect(() => {
    setSelectedProviderId(null);
  }, [selectedService]);

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
        const serviceById = new Map(serviceRows.map((service) => [service.id, service] as const));

        const rootCategoriesByProvider = new Map<string, Set<string>>();
        const offeredServicesByProvider = new Map<string, Array<{ id: string; name: string; root_category_id: string | null }>>();
        for (const link of providerLinks) {
          const serviceCategoryId = serviceCategoryMap.get(link.service_id);
          const rootCategoryId = getRootCategoryId(serviceCategoryId);
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

          const current = rootCategoriesByProvider.get(link.provider_id) ?? new Set<string>();
          current.add(rootCategoryId);
          rootCategoriesByProvider.set(link.provider_id, current);
        }

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

        const locationMap = new Map(
          ((locationData as Array<{ user_id: string; latitude: number; longitude: number; address: string | null }>) ?? []).map((location) => [
            location.user_id,
            location,
          ])
        );

        const providerMapRows = ((providerUsers as Array<{ id: string; full_name: string | null; email: string; avatar_url?: string | null }>) ?? []).reduce<NearbyProviderMap[]>(
          (acc, provider) => {
            const location = locationMap.get(provider.id);
            if (!location) return acc;
            const rootCategoryIds = Array.from(rootCategoriesByProvider.get(provider.id) ?? []);
            if (rootCategoryIds.length === 0) return acc;
            const providerStats = providerRatingMap.get(provider.id);
            const offeredServices = offeredServicesByProvider.get(provider.id) ?? [];

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
              avatar_url: provider.avatar_url || null,
              avg_rating: providerStats && providerStats.count > 0 ? providerStats.total / providerStats.count : 0,
              ratings_count: providerStats?.count ?? 0,
              offered_services: offeredServices,
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
      const hasRating = Boolean(provider.ratings_count && provider.ratings_count > 0);
      const ratingLabel = hasRating
        ? `⭐ ${(provider.avg_rating ?? 0).toFixed(1)} (${provider.ratings_count})`
        : `☆ ${t('clientBrowse.noRatingsYet')}`;

      const servicesByCategory = provider.offered_services.filter(
        (item) => !selectedRootCategoryId || item.root_category_id === selectedRootCategoryId
      );

      const preferredService = selectedService
        ? servicesByCategory.find((item) => item.id === selectedService) ?? null
        : null;

      const markerService = preferredService ?? servicesByCategory[0] ?? provider.offered_services[0] ?? null;

      return {
        id: provider.id,
        latitude: provider.location.latitude,
        longitude: provider.location.longitude,
        label: provider.full_name || provider.email,
        ratingText: ratingLabel,
        hasRating,
        categoryText: rootCategory?.name || t('clientBrowse.generalCategory'),
        serviceText: markerService?.name || t('clientBrowse.popupNoServiceAvailable'),
        description: distanceLabel,
        actionUrl: markerService ? `/client/request/${markerService.id}` : undefined,
        actionLabel: t('clientBrowse.popupRequestShortcut'),
        actionServiceId: markerService?.id,
        actionProviderId: provider.id,
        color: getCategoryMarkerColor(markerRootCategoryId),
        glyph: getCategoryMarkerGlyph(rootCategory?.icon, rootCategory?.name),
        imageUrl: resolveAvatarUrl(provider.avatar_url),
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
  }, [categoryMap, coords, filteredNearbyProviders, resolveAvatarUrl, selectedRootCategoryId, selectedService, t]);

  const visibleProviderCount = useMemo(() => {
    const providerIds = new Set(filteredNearbyProviders.map((provider) => provider.id));
    return visibleMarkerIds.filter((markerId) => providerIds.has(markerId)).length;
  }, [filteredNearbyProviders, visibleMarkerIds]);

  const providerOptions = useMemo(() => {
    const candidates = selectedService
      ? filteredNearbyProviders.filter((provider) =>
          provider.offered_services.some((service) => service.id === selectedService)
        )
      : filteredNearbyProviders;

    return candidates.map((provider) => {
      const hasRatings = Boolean(provider.ratings_count && provider.ratings_count > 0);
      const ratingLabel = hasRatings
        ? `⭐ ${(provider.avg_rating ?? 0).toFixed(1)} (${provider.ratings_count})`
        : `☆ ${t('clientBrowse.noRatingsYet')}`;

      return {
        ...provider,
        ratingLabel,
        distanceLabel: provider.distance_km !== undefined
          ? formatDistance(provider.distance_km)
          : t('clientRequestService.distanceUnavailable'),
        displayName: provider.full_name || provider.email,
        avatar: resolveAvatarUrl(provider.avatar_url),
      };
    });
  }, [filteredNearbyProviders, resolveAvatarUrl, selectedService, t]);

  const selectedProviderOption = useMemo(
    () => providerOptions.find((provider) => provider.id === selectedProviderId) ?? null,
    [providerOptions, selectedProviderId]
  );

  const handleQuickRequest = useCallback(async (marker: LocationMapMarker) => {
    if (!user || !marker.actionServiceId || !marker.actionProviderId || !coords) {
      setError(t('clientRequestService.locationRequiredError'));
      return;
    }

    setQuickRequestingMarkerId(marker.id);
    setError(null);

    const { error: requestError } = await supabase.from('service_requests').insert({
      client_id: user.id,
      provider_id: marker.actionProviderId,
      service_id: marker.actionServiceId,
      description: null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: null,
    });

    if (requestError) {
      setError(requestError.message);
      setQuickRequestingMarkerId(null);
      return;
    }

    setQuickRequestingMarkerId(null);
    navigate('/client/requests');
  }, [coords, navigate, t, user]);

  const handleProviderRequest = useCallback(async () => {
    if (!user || !selectedService || !selectedProviderId || !coords) {
      setError(t('clientRequestService.locationRequiredError'));
      return;
    }

    setQuickRequestingMarkerId(selectedProviderId);
    setError(null);

    const { error: requestError } = await supabase.from('service_requests').insert({
      client_id: user.id,
      provider_id: selectedProviderId,
      service_id: selectedService,
      description: null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: null,
    });

    if (requestError) {
      setError(requestError.message);
      setQuickRequestingMarkerId(null);
      return;
    }

    setQuickRequestingMarkerId(null);
    navigate('/client/requests');
  }, [coords, navigate, selectedProviderId, selectedService, t, user]);

  return (
    <Layout navItems={CLIENT_NAV} title="Browse Services">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('clientBrowse.title')}</h1>
          <p className="page-subtitle">{t('clientBrowse.subtitle')}</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="card grid gap-6 lg:grid-cols-[1fr_384px]">
          {/* Map Container */}
          <div className="overflow-hidden rounded-lg bg-slate-50 min-h-96 lg:min-h-[600px]">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('clientBrowse.nearbyProvidersMapTitle')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('clientBrowse.nearbyProvidersMapDesc')}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:min-w-[220px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t('clientBrowse.availableNow')}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {filteredNearbyProviders.length === 1
                    ? t('clientBrowse.oneNearbyProvider')
                    : t('clientBrowse.nearbyProvidersCount').replace('{{count}}', String(filteredNearbyProviders.length))}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('clientBrowse.visibleProvidersCount').replace('{{count}}', String(visibleProviderCount))}
                </p>
                {coords && filteredNearbyProviders.length > 0 && visibleProviderCount < filteredNearbyProviders.length ? (
                  <button
                    type="button"
                    onClick={() => setFitBoundsTrigger((current) => current + 1)}
                    className="mt-2 text-xs font-semibold text-sky-700 transition hover:text-sky-800"
                  >
                    {t('clientBrowse.viewAllOnMap')}
                  </button>
                ) : null}
              </div>
            </div>

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
              <LocationMap 
                markers={nearbyProviderMarkers} 
                heightClassName="h-96 lg:h-[600px]"
                enableClustering={nearbyProviderMarkers.length > 8}
                onMarkerActionClick={handleQuickRequest}
                actionLoadingMarkerId={quickRequestingMarkerId}
                onVisibleMarkerIdsChange={setVisibleMarkerIds}
                fitBoundsTrigger={fitBoundsTrigger}
              />
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

                <div className="mb-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">{t('clientBrowse.selectNearbyProvider')}</p>
                  {providerOptions.length === 0 ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      {t('clientBrowse.noProvidersForService')}
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {providerOptions.map((provider) => {
                        const isSelected = selectedProviderId === provider.id;
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => setSelectedProviderId(provider.id)}
                            className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                              isSelected
                                ? 'border-sky-400 bg-sky-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {provider.avatar ? (
                                <img
                                  src={provider.avatar}
                                  alt={provider.displayName}
                                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500">
                                  {provider.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{provider.displayName}</p>
                                <p className="text-xs text-slate-500">{provider.ratingLabel}</p>
                                <p className="text-xs text-slate-500">{provider.distanceLabel}</p>
                              </div>
                              {isSelected ? (
                                <CheckCircle2 className="ml-auto h-4 w-4 flex-shrink-0 text-sky-600" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {t('clientBrowse.selectedProviderLabel')}
                  </p>
                  {selectedProviderOption ? (
                    <div className="mt-2 flex items-center gap-3">
                      {selectedProviderOption.avatar ? (
                        <img
                          src={selectedProviderOption.avatar}
                          alt={selectedProviderOption.displayName}
                          className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500">
                          {selectedProviderOption.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{selectedProviderOption.displayName}</p>
                        <p className="text-xs text-slate-500">{selectedProviderOption.distanceLabel}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">{t('clientBrowse.selectProviderFirst')}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  onClick={handleProviderRequest}
                  disabled={!selectedProviderId || quickRequestingMarkerId === selectedProviderId}
                >
                  {quickRequestingMarkerId === selectedProviderId
                    ? t('clientBrowse.requestingProvider')
                    : selectedProviderId
                      ? t('clientBrowse.requestSelectedProvider')
                      : t('clientBrowse.selectProviderFirstButton')}
                  <ArrowRight className="h-4 w-4" />
                </button>

              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
