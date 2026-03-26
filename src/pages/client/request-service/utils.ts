import type { LocationMapMarker } from '../../../components/common/LocationMap';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../../utils/mapMarkers';
import type { NearbyProvider, RequestServiceCategory, RequestServiceCoords, ServiceDetails } from './types';

export function getCategoryPath(
  categoryMap: Map<string, RequestServiceCategory>,
  categoryId: string | null | undefined,
  fallbackLabel: string
): string {
  if (!categoryId) return fallbackLabel;

  const path: string[] = [];
  const visited = new Set<string>();
  let current = categoryMap.get(categoryId);

  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    path.unshift(current.name);
    current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
  }

  return path.length > 0 ? path.join(' > ') : fallbackLabel;
}

type BuildProviderMarkersParams = {
  providers: NearbyProvider[];
  coords: RequestServiceCoords | null;
  service: ServiceDetails | null;
  t: (key: string) => string;
  addressValue: string;
};

export function buildProviderMarkers({
  providers,
  coords,
  service,
  t,
  addressValue,
}: BuildProviderMarkersParams): LocationMapMarker[] {
  const markers: LocationMapMarker[] = providers
    .filter((provider) => provider.location)
    .map((provider) => ({
      id: provider.id,
      latitude: provider.location!.latitude,
      longitude: provider.location!.longitude,
      label: provider.full_name || provider.email,
      description: provider.location?.address || t('clientRequestService.providerLocationFallback'),
      color: getCategoryMarkerColor(service?.category_id),
      glyph: getCategoryMarkerGlyph(service?.category?.icon, service?.category?.name),
    }));

  if (coords) {
    markers.unshift({
      id: 'client-location',
      latitude: coords.latitude,
      longitude: coords.longitude,
      label: t('clientRequestService.currentLocation'),
      description: addressValue.trim() || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
      color: '#2563eb',
      radius: 10,
      glyph: '📍',
    });
  }

  return markers;
}
