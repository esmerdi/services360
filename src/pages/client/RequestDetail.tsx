import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
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
    if (
      !request ||
      request.latitude === null ||
      request.latitude === undefined ||
      request.longitude === null ||
      request.longitude === undefined
    ) {
      return [];
    }

    const markers: LocationMapMarker[] = [
      {
        id: request.id,
        latitude: request.latitude,
        longitude: request.longitude,
        label: request.service?.name || t('clientRequestDetail.serviceRequest'),
        description: `${getCategoryPath(request.service?.category_id)} • ${request.address || t('clientRequestDetail.notProvided')}`,
        color: getCategoryMarkerColor(request.service?.category_id),
        radius: 10,
        glyph: getCategoryMarkerGlyph(request.service?.category?.icon, request.service?.category?.name),
      },
    ];

    return markers;
  }, [getCategoryPath, request, t]);

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
        <div className="grid w-full gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="min-w-0 space-y-6">
            <div className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">{request.service?.name || t('clientRequestDetail.serviceRequest')}</p>
                  <div className="mt-2">
                    <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      <span className="truncate">{getCategoryPath(request.service?.category_id)}</span>
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">{t('clientRequestDetail.requestPrefix')} #{request.id.slice(0, 8)}</h1>
                  <p className="mt-3 break-words text-sm text-slate-500">{request.description || t('clientRequestDetail.noDescription')}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('clientRequestDetail.provider')}</p>
                  {request.provider ? (
                    <div className="mt-2 flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={request.provider.avatar_url}
                        name={request.provider.full_name || request.provider.email}
                        alt={request.provider.full_name || request.provider.email}
                        className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0"
                        fallbackClassName="text-xs font-semibold text-white"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{request.provider.full_name || t('clientRequestDetail.awaitingProvider')}</p>
                        <p className="mt-1 break-all text-sm text-slate-500">{request.provider.email || t('clientRequestDetail.providerFallback')}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 font-medium text-slate-900">{t('clientRequestDetail.awaitingProvider')}</p>
                      <p className="mt-1 text-sm text-slate-500">{t('clientRequestDetail.providerFallback')}</p>
                    </>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('clientRequestDetail.created')}</p>
                  <p className="mt-2 font-medium text-slate-900">{formatDateTime(request.created_at, language)}</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{t('clientRequestDetail.address')}</p>
                  <p className="mt-1 break-words text-sm text-slate-500">{request.address || t('clientRequestDetail.notProvided')}</p>
                </div>
              </div>

              {request.provider && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
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
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  {t('clientRequestDetail.switchOpenWaitHint').replace('{{minutes}}', String(OPEN_REQUEST_FALLBACK_MINUTES))}
                </div>
              )}

              {canSwitchToOpenRequest && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">{t('clientRequestDetail.switchOpenTitle')}</p>
                  <p className="mt-1 text-sm text-amber-800">{t('clientRequestDetail.switchOpenDescription')}</p>
                  <button
                    type="button"
                    className="btn-secondary mt-3"
                    onClick={switchToOpenRequest}
                    disabled={openingRequest}
                  >
                    {openingRequest ? t('clientRequestDetail.switchOpening') : t('clientRequestDetail.switchOpenButton')}
                  </button>
                </div>
              )}

              {rating && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">{rating.comment || t('clientRequestDetail.noComment')}</p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900">{t('clientRequestDetail.statusTimeline')}</h2>
              <div className="mt-4 space-y-4">
                {history.length === 0 && (
                  <p className="text-sm text-slate-400">{t('clientRequestDetail.noStatusChanges')}</p>
                )}
                {history.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
                    <div>
                      <p className="font-medium capitalize text-slate-900">{item.status.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-500">{formatDateTime(item.created_at, language)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900">{t('clientRequestDetail.requestInfo')}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-slate-500">{t('clientRequestDetail.address')}</dt>
                  <dd className="break-words text-slate-800 sm:text-right">{request.address || t('clientRequestDetail.notProvided')}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-slate-500">{t('clientRequestDetail.coordinates')}</dt>
                  <dd className="break-all text-slate-800 sm:text-right">
                    {request.latitude !== null && request.latitude !== undefined && request.longitude !== null && request.longitude !== undefined
                      ? `${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}`
                      : t('clientRequestDetail.unavailable')}
                  </dd>
                </div>
              </dl>

              {requestMarkers.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-slate-800">{t('clientRequestDetail.locationMap')}</p>
                  <LazyLocationMap markers={requestMarkers} heightClassName="h-72" />
                </div>
              )}
            </div>
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
