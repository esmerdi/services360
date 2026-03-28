import { MapPin, Navigation, ShieldCheck, Sparkles } from 'lucide-react';
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
    <div className="card p-4 md:p-5">
      <div className="mb-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 md:text-lg">
          <ShieldCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
          {t('clientRequestService.nearbyProviders')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t('clientRequestService.nearbyProvidersDesc')}</p>
      </div>
      <LazyLocationMap markers={providerMarkers} />
      <div className="mt-3 space-y-2.5">
        {estimatedProviders.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            {t('clientRequestService.noProviders')}
          </div>
        )}
        {estimatedProviders.map((provider) => (
          <div key={provider.id} className="rounded-xl border border-slate-200 bg-white p-3">
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
                  <p className="truncate text-sm font-semibold text-slate-900">{provider.full_name || provider.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{provider.location?.address || t('clientRequestService.providerLocationFallback')}</p>
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
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t('clientRequestService.online')}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
              <Navigation className="h-3.5 w-3.5 text-indigo-600" />
              {provider.distance_km !== undefined ? formatDistance(provider.distance_km) : t('clientRequestService.distanceUnavailable')}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-sky-600" />
              {provider.location?.address || t('clientRequestService.providerLocationFallback')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
