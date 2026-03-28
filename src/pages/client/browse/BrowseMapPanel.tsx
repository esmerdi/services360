import { Compass, MapPin, ShieldCheck } from 'lucide-react';
import LazyLocationMap from '../../../components/common/LazyLocationMap';
import type { LocationMapMarker } from '../../../components/common/LazyLocationMap';

type BrowseCoords = {
  latitude: number;
  longitude: number;
};

type BrowseMapPanelProps = {
  t: (key: string) => string;
  coords: BrowseCoords | null;
  refresh: () => void;
  filteredNearbyProvidersCount: number;
  visibleProviderCount: number;
  nearbyProviderMarkers: LocationMapMarker[];
  quickRequestingMarkerId: string | null;
  fitBoundsTrigger: number;
  onQuickRequest: (marker: LocationMapMarker) => void | Promise<void>;
  onVisibleMarkerIdsChange: (markerIds: string[]) => void;
  onViewAll: () => void;
};

export default function BrowseMapPanel({
  t,
  coords,
  refresh,
  filteredNearbyProvidersCount,
  visibleProviderCount,
  nearbyProviderMarkers,
  quickRequestingMarkerId,
  fitBoundsTrigger,
  onQuickRequest,
  onVisibleMarkerIdsChange,
  onViewAll,
}: BrowseMapPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 min-h-96 lg:min-h-[600px]">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
            <MapPin className="h-4 w-4 text-sky-600" aria-hidden="true" />
            {t('clientBrowse.nearbyProvidersMapTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t('clientBrowse.nearbyProvidersMapDesc')}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:min-w-[220px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t('clientBrowse.availableNow')}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {filteredNearbyProvidersCount === 1
              ? t('clientBrowse.oneNearbyProvider')
              : t('clientBrowse.nearbyProvidersCount').replace('{{count}}', String(filteredNearbyProvidersCount))}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {t('clientBrowse.visibleProvidersCount').replace('{{count}}', String(visibleProviderCount))}
          </p>
          {coords && filteredNearbyProvidersCount > 0 && visibleProviderCount < filteredNearbyProvidersCount ? (
            <button
              type="button"
              onClick={onViewAll}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 transition hover:text-sky-800"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              {t('clientBrowse.viewAllOnMap')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          {t('clientBrowse.nearbyProvidersMapDesc')}
        </span>
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
        <LazyLocationMap
          markers={nearbyProviderMarkers}
          heightClassName="h-96 lg:h-[600px]"
          enableClustering={nearbyProviderMarkers.length > 8}
          onMarkerActionClick={onQuickRequest}
          actionLoadingMarkerId={quickRequestingMarkerId}
          onVisibleMarkerIdsChange={onVisibleMarkerIdsChange}
          fitBoundsTrigger={fitBoundsTrigger}
        />
      )}
    </div>
  );
}