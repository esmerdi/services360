import type { LocationMapMarker } from '../../../components/common/LocationMap';
import { supabase } from '../../../lib/supabase';
import type { Category, Service } from '../../../types';
import { formatDistance } from '../../../utils/distance';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../../utils/mapMarkers';
import type { NearbyProviderMap, ProviderOption } from './types';

type BrowseCoords = {
  latitude: number;
  longitude: number;
};

export function createChildrenByParent(categories: Category[]) {
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
}

export function getDescendantCategoryIds(rootId: string, childrenByParent: Map<string | null, Category[]>) {
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
}

type MarkerBuilderParams = {
  providers: NearbyProviderMap[];
  selectedRootCategoryId: string | null;
  selectedServiceId: string | null;
  categoryMap: Map<string, Category>;
  coords: BrowseCoords | null;
  t: (key: string) => string;
  resolveAvatarUrl: (value: string | null | undefined) => string | undefined;
};

export function buildNearbyProviderMarkers({
  providers,
  selectedRootCategoryId,
  selectedServiceId,
  categoryMap,
  coords,
  t,
  resolveAvatarUrl,
}: MarkerBuilderParams): LocationMapMarker[] {
  const markers: LocationMapMarker[] = providers.map((provider) => {
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
    const preferredService = selectedServiceId
      ? servicesByCategory.find((item) => item.id === selectedServiceId) ?? null
      : null;
    const markerService = preferredService ?? servicesByCategory[0] ?? provider.offered_services[0] ?? null;
    const primaryServiceName = markerService?.name?.trim().toLowerCase();
    const allRelatedServiceNames = (servicesByCategory.length > 0 ? servicesByCategory : provider.offered_services)
      .map((service) => service.name)
      .filter((serviceName, index, list) => {
        if (!serviceName) return false;
        const normalizedName = serviceName.trim().toLowerCase();
        if (primaryServiceName && normalizedName === primaryServiceName) return false;
        return list.findIndex((item) => item.trim().toLowerCase() === normalizedName) === index;
      });

    const visibleRelatedServiceNames = allRelatedServiceNames.slice(0, 4);
    const extraServicesCount = Math.max(0, allRelatedServiceNames.length - visibleRelatedServiceNames.length);
    const relatedServiceTags = extraServicesCount > 0
      ? [...visibleRelatedServiceNames, `+${extraServicesCount}`]
      : visibleRelatedServiceNames;

    return {
      id: provider.id,
      latitude: provider.location.latitude,
      longitude: provider.location.longitude,
      label: provider.full_name || provider.email,
      ratingText: ratingLabel,
      hasRating,
      categoryText: rootCategory?.name || t('clientBrowse.generalCategory'),
      serviceText: markerService?.name || t('clientBrowse.popupNoServiceAvailable'),
      serviceTags: relatedServiceTags.length > 1 ? relatedServiceTags : undefined,
      description: distanceLabel,
      actionUrl: markerService ? `/client/request/${markerService.id}` : undefined,
      actionLabel: t('clientBrowse.popupRequestShortcut'),
      actionServiceId: markerService?.id,
      actionProviderId: provider.id,
      color: getCategoryMarkerColor(markerRootCategoryId),
      glyph: getCategoryMarkerGlyph(rootCategory?.icon, rootCategory?.name),
      imageUrl: resolveAvatarUrl(provider.avatar_url),
    } satisfies LocationMapMarker;
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
}

type ProviderOptionParams = {
  providers: NearbyProviderMap[];
  selectedServiceId: string | null;
  t: (key: string) => string;
  resolveAvatarUrl: (value: string | null | undefined) => string | undefined;
};

export function buildProviderOptions({
  providers,
  selectedServiceId,
  t,
  resolveAvatarUrl,
}: ProviderOptionParams): ProviderOption[] {
  const candidates = selectedServiceId
    ? providers.filter((provider) => provider.offered_services.some((service) => service.id === selectedServiceId))
    : providers;

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
}

type ServiceRequestPayload = {
  clientId: string;
  providerId: string | null;
  serviceId: string;
  coords: BrowseCoords;
};

export async function createServiceRequest({ clientId, providerId, serviceId, coords }: ServiceRequestPayload) {
  return supabase.from('service_requests').insert({
    client_id: clientId,
    provider_id: providerId,
    service_id: serviceId,
    description: null,
    latitude: coords.latitude,
    longitude: coords.longitude,
    address: null,
  });
}

export function getTopLevelCategories(categories: Category[]) {
  return categories.filter((category) => !category.parent_id);
}

export function createCategoryMap(categories: Category[]) {
  return new Map(categories.map((category) => [category.id, category] as const));
}

export function getServicesForRootCategory(
  services: Service[],
  selectedRootCategoryId: string | null,
  childrenByParent: Map<string | null, Category[]>
) {
  if (!selectedRootCategoryId) return [];

  const descendantCategoryIds = getDescendantCategoryIds(selectedRootCategoryId, childrenByParent);
  return services
    .filter((service) => service.category_id && descendantCategoryIds.has(service.category_id))
    .sort((left, right) => left.name.localeCompare(right.name));
}