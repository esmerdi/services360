import { MapPin } from 'lucide-react';
import LazyLocationMap from '../../../components/common/LazyLocationMap';
import StarRating from '../../../components/common/StarRating';
import UserAvatar from '../../../components/common/UserAvatar';
import { formatDistance } from '../../../utils/distance';
import type { LocationMapMarker } from '../../../components/common/LazyLocationMap';
import type { NearbyProvider } from './types';

type RequestServiceProvidersPanelProps = {
  t: (key: string) => string;
  providerMarkers: LocationMapMarker[];
  estimatedProviders: NearbyProvider[];
};

export default function RequestServiceProvidersPanel({
  t,
  providerMarkers,
  estimatedProviders,
}: RequestServiceProvidersPanelProps) {
  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{t('clientRequestService.nearbyProviders')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('clientRequestService.nearbyProvidersDesc')}</p>
      </div>
      <LazyLocationMap markers={providerMarkers} />
      <div className="space-y-3">
        {estimatedProviders.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            {t('clientRequestService.noProviders')}
          </div>
        )}
        {estimatedProviders.map((provider) => (
          <div key={provider.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <UserAvatar
                  avatarUrl={provider.avatar_url}
                  name={provider.full_name || provider.email}
                  alt={provider.full_name || provider.email}
                  className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0"
                  fallbackClassName="text-xs font-semibold text-white"
                />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{provider.full_name || provider.email}</p>
                  <p className="mt-1 text-sm text-slate-500">{provider.location?.address || t('clientRequestService.providerLocationFallback')}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <StarRating value={provider.avg_rating ?? 0} readonly size="sm" />
                    <span>
                      {provider.ratings_count && provider.ratings_count > 0
                        ? `${(provider.avg_rating ?? 0).toFixed(1)} (${provider.ratings_count})`
                        : t('clientRequestService.noRatingsYet')}
                    </span>
                  </div>
                </div>
              </div>
              <span className="badge bg-green-50 text-green-700">{t('clientRequestService.online')}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-blue-600" />
              {provider.distance_km !== undefined ? formatDistance(provider.distance_km) : t('clientRequestService.distanceUnavailable')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
