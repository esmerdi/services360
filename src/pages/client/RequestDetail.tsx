import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CalendarClock, FileText, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LazyLocationMap from '../../components/common/LazyLocationMap';
import UserAvatar from '../../components/common/UserAvatar';
import ChatWindow from '../../components/common/ChatWindow';
import type { LocationMapMarker } from '../../components/common/LazyLocationMap';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { supabase } from '../../lib/supabase';
import { formatDateTime } from '../../utils/helpers';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../utils/mapMarkers';
import type { Category, Rating, RequestStatusHistory, ServiceRequest } from '../../types';
import MandatoryRatingModal from './request-detail/MandatoryRatingModal';
import { useRequestDetailActions } from './request-detail/useRequestDetailActions';
import { useRequestDetailData } from './request-detail/useRequestDetailData';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

const openRequestFallbackMinutesEnv = Number(import.meta.env.VITE_OPEN_REQUEST_FALLBACK_MINUTES);
const OPEN_REQUEST_FALLBACK_MINUTES = Number.isFinite(openRequestFallbackMinutesEnv)
  ? Math.min(Math.max(Math.trunc(openRequestFallbackMinutesEnv), 1), 120)
  : 5;

type DetailTab = 'overview' | 'timeline' | 'location';
type LiveCoords = { latitude: number; longitude: number };

function isDetailTab(value: string | null): value is DetailTab {
  return value === 'overview' || value === 'timeline' || value === 'location';
}

export default function ClientRequestDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const {
    request,
    categories,
    history,
    rating,
    loading,
    error,
    setRequest,
    setRating,
    setError,
  } = useRequestDetailData({ requestId: id });
  const [savingRating, setSavingRating] = useState(false);
  const [openingRequest, setOpeningRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('overview');
  const [providerServiceTags, setProviderServiceTags] = useState<string[]>([]);
  const [providerServiceTagsReady, setProviderServiceTagsReady] = useState(true);
  const [providerServiceTagsCache, setProviderServiceTagsCache] = useState<Record<string, string[]>>({});
  const [providerLiveCoords, setProviderLiveCoords] = useState<LiveCoords | null>(null);
  const [providerLiveUpdatedAt, setProviderLiveUpdatedAt] = useState<number | null>(null);
  const [liveClock, setLiveClock] = useState(Date.now());

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

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

  const canRate = useMemo(
    () => !!request && request.status === 'completed' && !!request.provider_id && !rating && !!user,
    [request, rating, user]
  );

  const canSwitchToOpenRequest = useMemo(() => {
    if (!request || !user) return false;
    if (request.client_id !== user.id) return false;
    if (request.status !== 'pending' || !request.provider_id) return false;

    const createdAtMs = Date.parse(request.created_at);
    if (!Number.isFinite(createdAtMs)) return false;

    return Date.now() - createdAtMs >= OPEN_REQUEST_FALLBACK_MINUTES * 60 * 1000;
  }, [request, user]);

  const shouldShowOpenRequestHint = useMemo(() => {
    if (!request || !user) return false;
    if (request.client_id !== user.id) return false;
    return request.status === 'pending' && Boolean(request.provider_id) && !canSwitchToOpenRequest;
  }, [canSwitchToOpenRequest, request, user]);

  const requestMarkers = useMemo(() => {
    if (!request) return [];

    const markers: LocationMapMarker[] = [];

    if (
      request.latitude !== null
      && request.latitude !== undefined
      && request.longitude !== null
      && request.longitude !== undefined
    ) {
      markers.push({
        id: request.id,
        latitude: request.latitude,
        longitude: request.longitude,
        label: request.service?.name || t('clientRequestDetail.serviceRequest'),
        description: `${getCategoryPath(request.service?.category_id)} • ${request.address || t('clientRequestDetail.notProvided')}`,
        serviceTags: providerServiceTags.length > 0 ? providerServiceTags : undefined,
        color: getCategoryMarkerColor(request.service?.category_id),
        radius: 10,
        glyph: getCategoryMarkerGlyph(request.service?.category?.icon, request.service?.category?.name),
      });
    }

    if (providerLiveCoords && request.provider_id && ['accepted', 'in_progress'].includes(request.status)) {
      markers.push({
        id: `provider-live-${request.provider_id}`,
        latitude: providerLiveCoords.latitude,
        longitude: providerLiveCoords.longitude,
        label: request.provider?.full_name || request.provider?.email || t('clientRequestDetail.provider'),
        badgeText: !request.provider?.ratings_count || request.provider.ratings_count <= 0
          ? t('clientRequestDetail.newProviderBadge')
          : Number(request.provider.avg_rating ?? 0) >= 4.8
            ? t('clientRequestDetail.featuredProviderBadge')
            : undefined,
        badgeTone: !request.provider?.ratings_count || request.provider.ratings_count <= 0
          ? 'new'
          : Number(request.provider.avg_rating ?? 0) >= 4.8
            ? 'featured'
            : undefined,
        imageUrl: request.provider?.avatar_url || undefined,
        ratingText: request.provider?.ratings_count && request.provider.ratings_count > 0
          ? `${t('clientRequestDetail.providerRatingTitle')}: ${Number(request.provider.avg_rating ?? 0).toFixed(1)} (${request.provider.ratings_count})`
          : t('clientRequestDetail.noRatingsYet'),
        hasRating: Boolean(request.provider?.ratings_count && request.provider.ratings_count > 0),
        description: t('clientRequestDetail.provider'),
        color: '#0284c7',
        radius: 9,
        glyph: 'P',
      });
    }

    return markers;
  }, [getCategoryPath, providerLiveCoords, providerServiceTags, request, t]);

  const isProviderLiveTrackingEnabled = Boolean(
    request
    && request.provider_id
    && ['accepted', 'in_progress'].includes(request.status)
  );

  const providerLiveAgeSeconds = providerLiveUpdatedAt
    ? Math.max(0, Math.floor((liveClock - providerLiveUpdatedAt) / 1000))
    : null;

  useEffect(() => {
    if (!isProviderLiveTrackingEnabled || !providerLiveUpdatedAt) return;

    const timerId = window.setInterval(() => {
      setLiveClock(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isProviderLiveTrackingEnabled, providerLiveUpdatedAt]);

  useEffect(() => {
    const providerId = request?.provider_id;
    const trackingEnabled = Boolean(request && ['accepted', 'in_progress'].includes(request.status));

    if (!providerId || !trackingEnabled) {
      setProviderLiveCoords(null);
      setProviderLiveUpdatedAt(null);
      return;
    }

    let active = true;

    const applyProviderCoords = (latitude: number, longitude: number) => {
      setProviderLiveCoords({ latitude, longitude });
      setProviderLiveUpdatedAt(Date.now());
    };

    const loadProviderLocation = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('latitude, longitude')
        .eq('user_id', providerId)
        .maybeSingle();

      if (!active || error || !data) return;

      const latitude = Number((data as { latitude: number }).latitude);
      const longitude = Number((data as { longitude: number }).longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        applyProviderCoords(latitude, longitude);
      }
    };

    void loadProviderLocation();

    const channel = supabase
      .channel(`provider-location-${request.id}-${providerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations', filter: `user_id=eq.${providerId}` },
        (payload) => {
          const next = payload.new as { latitude?: number; longitude?: number } | null;
          if (next && typeof next.latitude === 'number' && typeof next.longitude === 'number') {
            applyProviderCoords(next.latitude, next.longitude);
            return;
          }

          void loadProviderLocation();
        }
      )
      .subscribe();

    const pollingId = window.setInterval(() => {
      void loadProviderLocation();
    }, 20000);

    return () => {
      active = false;
      window.clearInterval(pollingId);
      void supabase.removeChannel(channel);
    };
  }, [request]);

  useEffect(() => {
    const providerId = request?.provider_id;

    if (!providerId) {
      setProviderServiceTags([]);
      setProviderServiceTagsReady(true);
      return;
    }

    const resolvedProviderId: string = providerId;

    const cachedTags = providerServiceTagsCache[resolvedProviderId];
    if (cachedTags) {
      setProviderServiceTags(cachedTags);
      setProviderServiceTagsReady(true);
      return;
    }

    setProviderServiceTagsReady(false);

    async function loadProviderServiceTags() {
      const { data, error } = await supabase
        .from('provider_services')
        .select('service:services(name)')
        .eq('provider_id', resolvedProviderId)
        .limit(6);

      if (error || !data) {
        setProviderServiceTags([]);
        setProviderServiceTagsReady(true);
        return;
      }

      const uniqueNames = new Set<string>();
      for (const row of data as Array<{ service?: unknown }>) {
        const serviceRaw = row.service;
        const serviceData = (Array.isArray(serviceRaw) ? serviceRaw[0] : serviceRaw) as { name?: string | null } | undefined;
        const name = serviceData?.name?.trim();
        if (name) uniqueNames.add(name);
      }

      const allNames = Array.from(uniqueNames);
      const visibleNames = allNames.slice(0, 3);
      const remaining = allNames.length - visibleNames.length;
      const nextTags = remaining > 0 ? [...visibleNames, `+${remaining}`] : visibleNames;

      setProviderServiceTags(nextTags);
      setProviderServiceTagsCache((current) => ({
        ...current,
        [resolvedProviderId]: nextTags,
      }));
      setProviderServiceTagsReady(true);
    }

    void loadProviderServiceTags();
  }, [providerServiceTagsCache, request?.provider_id]);

  // Lock body scroll while the mandatory rating popup is visible
  useEffect(() => {
    if (canRate) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [canRate]);

  useEffect(() => {
    const shouldOpenChat = searchParams.get('openChat') === '1';
    const hasAssignedProvider = Boolean(request?.provider_id && request?.provider);
    const chatEligibleStatus = request ? ['accepted', 'in_progress', 'completed'].includes(request.status) : false;

    if (shouldOpenChat && hasAssignedProvider && chatEligibleStatus) {
      setChatOpen(true);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('openChat');
      setSearchParams(nextParams, { replace: true });
    }
  }, [request, searchParams, setSearchParams]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    setActiveDetailTab(isDetailTab(requestedTab) ? requestedTab : 'overview');
  }, [request?.id, searchParams]);

  useEffect(() => {
    if (!request) return;

    const currentTab = searchParams.get('tab');
    if (currentTab === activeDetailTab) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', activeDetailTab);
    setSearchParams(nextParams, { replace: true });
  }, [activeDetailTab, request, searchParams, setSearchParams]);

  const { submitRating, switchToOpenRequest } = useRequestDetailActions({
    request,
    userId: user?.id,
    score,
    comment,
    t,
    setSavingRating,
    setOpeningRequest,
    setError,
    setRating,
    setRequest,
    setSuccessMessage,
  });

  return (
    <Layout navItems={CLIENT_NAV} title="Request Details">
      {error && <ErrorMessage message={error} className="mb-4" />}
      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : request ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{request.service?.name || t('clientRequestDetail.serviceRequest')}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  <span className="truncate">{getCategoryPath(request.service?.category_id)}</span>
                </span>
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{t('clientRequestDetail.requestPrefix')} #{request.id.slice(0, 8)}</h1>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              className={activeDetailTab === 'overview' ? 'btn-primary !px-3 !py-1.5 !text-xs' : 'btn-secondary !px-3 !py-1.5 !text-xs'}
              onClick={() => setActiveDetailTab('overview')}
            >
              {t('clientRequestDetail.tabOverview')}
            </button>
            <button
              type="button"
              className={activeDetailTab === 'timeline' ? 'btn-primary !px-3 !py-1.5 !text-xs' : 'btn-secondary !px-3 !py-1.5 !text-xs'}
              onClick={() => setActiveDetailTab('timeline')}
            >
              {t('clientRequestDetail.tabTimeline')}
            </button>
            <button
              type="button"
              className={activeDetailTab === 'location' ? 'btn-primary !px-3 !py-1.5 !text-xs' : 'btn-secondary !px-3 !py-1.5 !text-xs'}
              onClick={() => setActiveDetailTab('location')}
            >
              {t('clientRequestDetail.tabLocation')}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {activeDetailTab === 'overview' && (
              <>
                <p className="inline-flex items-start gap-1.5 text-sm text-slate-600">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span>{request.description || t('clientRequestDetail.noDescription')}</span>
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t('clientRequestDetail.provider')}</p>
                    {request.provider ? (
                      <div className="mt-2 flex items-center gap-2.5">
                        <UserAvatar
                          avatarUrl={request.provider.avatar_url}
                          name={request.provider.full_name || request.provider.email}
                          alt={request.provider.full_name || request.provider.email}
                          className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0"
                          fallbackClassName="text-xs font-semibold text-white"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{request.provider.full_name || t('clientRequestDetail.awaitingProvider')}</p>
                          <p className="truncate text-xs text-slate-500">{request.provider.email || t('clientRequestDetail.providerFallback')}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-1.5 text-sm font-medium text-slate-900">{t('clientRequestDetail.awaitingProvider')}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{t('clientRequestDetail.providerFallback')}</p>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t('clientRequestDetail.created')}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      {formatDateTime(request.created_at, language)}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t('clientRequestDetail.address')}</p>
                    <p className="mt-0.5 inline-flex items-start gap-1.5 break-words text-xs text-slate-600">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                      <span>{request.address || t('clientRequestDetail.notProvided')}</span>
                    </p>
                  </div>
                </div>

                {request.provider && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{t('clientRequestDetail.providerRatingTitle')}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <StarRating value={request.provider.avg_rating ?? 0} readonly size="sm" />
                      <span>
                        {request.provider.ratings_count && request.provider.ratings_count > 0
                          ? `${(request.provider.avg_rating ?? 0).toFixed(1)} (${request.provider.ratings_count})`
                          : t('clientRequestDetail.noRatingsYet')}
                      </span>
                    </div>
                  </div>
                )}

                {shouldShowOpenRequestHint && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                    {t('clientRequestDetail.switchOpenWaitHint').replace('{{minutes}}', String(OPEN_REQUEST_FALLBACK_MINUTES))}
                  </div>
                )}

                {canSwitchToOpenRequest && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-900">{t('clientRequestDetail.switchOpenTitle')}</p>
                    <p className="mt-1 text-xs text-amber-800">{t('clientRequestDetail.switchOpenDescription')}</p>
                    <button
                      type="button"
                      className="btn-secondary mt-2"
                      onClick={switchToOpenRequest}
                      disabled={openingRequest}
                    >
                      {openingRequest ? t('clientRequestDetail.switchOpening') : t('clientRequestDetail.switchOpenButton')}
                    </button>
                  </div>
                )}

                {rating && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-600">{rating.comment || t('clientRequestDetail.noComment')}</p>
                  </div>
                )}
              </>
            )}

            {activeDetailTab === 'timeline' && (
              <div>
                <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  {t('clientRequestDetail.statusTimeline')}
                </h2>
                <div className="mt-3 space-y-3">
                  {history.length === 0 && (
                    <p className="text-sm text-slate-400">{t('clientRequestDetail.noStatusChanges')}</p>
                  )}
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize text-slate-900">{item.status.replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(item.created_at, language)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDetailTab === 'location' && (
              <div>
                <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  {t('clientRequestDetail.requestInfo')}
                </h2>

                {isProviderLiveTrackingEnabled && (
                  <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
                      {t('clientRequestDetail.providerLiveLocationTitle')}
                    </p>
                    <p className="mt-1 text-xs text-sky-800">
                      {providerLiveCoords
                        ? t('clientRequestDetail.providerLiveLocationActive')
                        : t('clientRequestDetail.providerLiveLocationWaiting')}
                    </p>
                    {providerLiveCoords && providerLiveAgeSeconds !== null && (
                      <p className="mt-1 text-[11px] text-sky-700/90">
                        {providerLiveAgeSeconds <= 0
                          ? t('clientRequestDetail.providerLiveLocationUpdatedNow')
                          : t('clientRequestDetail.providerLiveLocationUpdatedSeconds').replace('{{seconds}}', String(providerLiveAgeSeconds))}
                      </p>
                    )}
                  </div>
                )}

                <dl className="mt-3 space-y-2.5 text-sm">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
                    <dt className="text-slate-500">{t('clientRequestDetail.address')}</dt>
                    <dd className="break-words text-slate-800 sm:text-right">{request.address || t('clientRequestDetail.notProvided')}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
                    <dt className="text-slate-500">{t('clientRequestDetail.coordinates')}</dt>
                    <dd className="break-all text-slate-800 sm:text-right">
                      {request.latitude !== null && request.latitude !== undefined && request.longitude !== null && request.longitude !== undefined
                        ? `${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}`
                        : t('clientRequestDetail.unavailable')}
                    </dd>
                  </div>
                </dl>

                {requestMarkers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-slate-800">{t('clientRequestDetail.locationMap')}</p>
                    {request.provider_id && !providerServiceTagsReady ? (
                      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : (
                      <LazyLocationMap markers={requestMarkers} heightClassName="h-64" showPopups={false} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Floating chat button — visible once a provider is assigned */}
      {request && request.provider_id && request.provider && (
        ['accepted', 'in_progress', 'completed'].includes(request.status)
      ) && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-[1300] flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
          aria-label={t('chat.openChat')}
        >
          <MessageCircle className="h-5 w-5" />
          {t('chat.openChat')}
        </button>
      )}

      {request && request.provider_id && request.provider && (
        <ChatWindow
          requestId={request.id}
          currentUserId={user?.id ?? ''}
          otherUserName={request.provider.full_name}
          otherUserAvatar={request.provider.avatar_url}
          isOpen={chatOpen}
          onOpen={() => setChatOpen(true)}
          onClose={() => setChatOpen(false)}
        />
      )}

      {canRate && request && (
        <MandatoryRatingModal
          request={request}
          error={error}
          score={score}
          comment={comment}
          savingRating={savingRating}
          t={t}
          onScoreChange={setScore}
          onCommentChange={setComment}
          onSubmit={submitRating}
        />
      )}
    </Layout>
  );
}
