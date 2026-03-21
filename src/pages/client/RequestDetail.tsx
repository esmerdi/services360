import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LocationMap from '../../components/common/LocationMap';
import type { LocationMapMarker } from '../../components/common/LocationMap';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { formatDateTime, getInitials, isManagedAvatarUrl } from '../../utils/helpers';
import { getCategoryMarkerColor, getCategoryMarkerGlyph } from '../../utils/mapMarkers';
import type { Category, Rating, RequestStatusHistory, ServiceRequest } from '../../types';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

export default function ClientRequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [categories, setCategories] = useState<Array<Pick<Category, 'id' | 'name' | 'parent_id'>>>([]);
  const [history, setHistory] = useState<RequestStatusHistory[]>([]);
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRating, setSavingRating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [providerAvatarFailed, setProviderAvatarFailed] = useState(false);

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

  useEffect(() => {
    if (!id) return;

    async function fetchDetails() {
      setLoading(true);
      const [requestRes, historyRes, ratingRes, categoriesRes] = await Promise.all([
        supabase
          .from('service_requests')
          .select(`
            *,
            service:services(id, name, category_id, category:categories(id, name, icon)),
            client:users!service_requests_client_id_fkey(id, full_name, email),
            provider:users!service_requests_provider_id_fkey(id, full_name, email, avatar_url)
          `)
          .eq('id', id)
          .single(),
        supabase.from('request_status_history').select('*').eq('request_id', id).order('created_at'),
        supabase.from('ratings').select('*').eq('request_id', id).maybeSingle(),
        supabase.from('categories').select('id, name, parent_id'),
      ]);

      if (requestRes.error) {
        setError(requestRes.error.message);
      } else if (categoriesRes.error) {
        setError(categoriesRes.error.message);
      } else {
        setRequest(requestRes.data as ServiceRequest);
        setCategories((categoriesRes.data as Array<Pick<Category, 'id' | 'name' | 'parent_id'>>) ?? []);
      }

      setHistory((historyRes.data as RequestStatusHistory[]) ?? []);
      setRating((ratingRes.data as Rating | null) ?? null);
      setLoading(false);
    }

    fetchDetails();

    const channel = supabase
      .channel(`request-detail-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests', filter: `id=eq.${id}` },
        () => {
          fetchDetails();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'request_status_history', filter: `request_id=eq.${id}` },
        () => {
          fetchDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    setProviderAvatarFailed(false);
  }, [request?.provider?.avatar_url]);

  const canRate = useMemo(
    () => !!request && request.status === 'completed' && !!request.provider_id && !rating && !!user,
    [request, rating, user]
  );

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
        description: `${getCategoryPath(request.service?.category_id)} | ${request.address || t('clientRequestDetail.notProvided')}`,
        color: getCategoryMarkerColor(request.service?.category_id),
        radius: 10,
        glyph: getCategoryMarkerGlyph(request.service?.category?.icon, request.service?.category?.name),
      },
    ];

    return markers;
  }, [getCategoryPath, request, t]);

  async function submitRating(event: React.FormEvent) {
    event.preventDefault();
    if (!request || !request.provider_id || !user) return;

    setSavingRating(true);
    const { data, error: ratingError } = await supabase
      .from('ratings')
      .insert({
        request_id: request.id,
        from_user_id: user.id,
        to_user_id: request.provider_id,
        rating: score,
        comment: comment.trim() || null,
      })
      .select('*')
      .single();
    setSavingRating(false);

    if (ratingError) {
      setError(ratingError.message);
      return;
    }

    setRating(data as Rating);
  }

  return (
    <Layout navItems={CLIENT_NAV} title="Request Details">
      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : request ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{request.service?.name || t('clientRequestDetail.serviceRequest')}</p>
                  <div className="mt-2">
                    <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      <span className="truncate">{getCategoryPath(request.service?.category_id)}</span>
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">{t('clientRequestDetail.requestPrefix')} #{request.id.slice(0, 8)}</h1>
                  <p className="mt-3 text-sm text-slate-500">{request.description || t('clientRequestDetail.noDescription')}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('clientRequestDetail.provider')}</p>
                  {request.provider ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                        {isManagedAvatarUrl(request.provider.avatar_url) && !providerAvatarFailed ? (
                          <img
                            src={request.provider.avatar_url ?? ''}
                            alt={request.provider.full_name || request.provider.email}
                            className="h-full w-full object-cover"
                            onError={() => setProviderAvatarFailed(true)}
                          />
                        ) : (
                          <span className="text-xs font-semibold text-white">
                            {getInitials(request.provider.full_name || request.provider.email)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{request.provider.full_name || t('clientRequestDetail.awaitingProvider')}</p>
                        <p className="mt-1 text-sm text-slate-500">{request.provider.email || t('clientRequestDetail.providerFallback')}</p>
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
                  <p className="mt-1 text-sm text-slate-500">{request.address || t('clientRequestDetail.notProvided')}</p>
                </div>
              </div>
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

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900">{t('clientRequestDetail.requestInfo')}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t('clientRequestDetail.address')}</dt>
                  <dd className="text-right text-slate-800">{request.address || t('clientRequestDetail.notProvided')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t('clientRequestDetail.coordinates')}</dt>
                  <dd className="text-right text-slate-800">
                    {request.latitude !== null && request.latitude !== undefined && request.longitude !== null && request.longitude !== undefined
                      ? `${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}`
                      : t('clientRequestDetail.unavailable')}
                  </dd>
                </div>
              </dl>

              {requestMarkers.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-slate-800">Mapa</p>
                  <LocationMap markers={requestMarkers} heightClassName="h-72" />
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900">{t('clientRequestDetail.rateProvider')}</h2>
              {rating ? (
                <div className="mt-4 space-y-3">
                  <StarRating value={rating.rating} readonly />
                  <p className="text-sm text-slate-500">{rating.comment || t('clientRequestDetail.noComment')}</p>
                </div>
              ) : canRate ? (
                <form onSubmit={submitRating} className="mt-4 space-y-4">
                  <StarRating value={score} onChange={setScore} />
                  <textarea
                    className="input resize-none"
                    rows={4}
                    placeholder={t('clientRequestDetail.shareExperience')}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <button type="submit" className="btn-primary w-full justify-center" disabled={savingRating}>
                    {savingRating ? <LoadingSpinner size="sm" /> : t('clientRequestDetail.submitRating')}
                  </button>
                </form>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  {t('clientRequestDetail.ratingAvailableLater')}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
