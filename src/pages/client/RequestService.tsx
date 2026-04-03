import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, ShieldCheck } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { formatClientQuotaError } from '../../utils/quota';
import RequestServiceProvidersPanel from './request-service/RequestServiceProvidersPanel';
import { buildProviderMarkers, getCategoryPath } from './request-service/utils';
import { useRequestServiceData } from './request-service/useRequestServiceData';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

export default function ClientRequestService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { coords, refresh, loading: locationLoading } = useLocation();
  const {
    service,
    categories,
    providers,
    loading,
    error,
    setError,
  } = useRequestServiceData({
    serviceId,
    coords,
    t,
  });
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [address, setAddress] = useState('');
  const [clientQuota, setClientQuota] = useState<{
    plan_name: string;
    max_requests: number;
    request_window_days: number;
    used_requests: number;
    remaining_requests: number;
    window_end: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user?.address) return;
    setAddress((current) => (current.trim().length > 0 ? current : user.address ?? ''));
  }, [user?.address]);

  useEffect(() => {
    if (!user) return;
    const currentUserId = user.id;

    let mounted = true;
    async function fetchClientQuota() {
      const { data, error: quotaError } = await supabase
        .rpc('get_client_request_quota', { p_client_id: currentUserId })
        .maybeSingle();

      if (quotaError || !mounted) return;
      setClientQuota((data as {
        plan_name: string;
        max_requests: number;
        request_window_days: number;
        used_requests: number;
        remaining_requests: number;
        window_end: string | null;
      }) ?? null);
    }

    void fetchClientQuota();
    return () => {
      mounted = false;
    };
  }, [user]);

  const addressPlaceholder = useMemo(() => {
    if (user?.address?.trim()) {
      return user.address;
    }
    if (coords) {
      return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
    }
    return t('clientRequestService.addressPlaceholder');
  }, [coords, t, user?.address]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

  const estimatedProviders = useMemo(() => providers.slice(0, 5), [providers]);
  const providerMarkers = useMemo(() => {
    return buildProviderMarkers({
      providers: estimatedProviders,
      coords,
      service,
      t,
      addressValue: address,
    });
  }, [address, coords, estimatedProviders, service, t]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !serviceId || !coords) {
      setError(t('clientRequestService.locationRequiredError'));
      return;
    }

    const normalizedBudget = budget.trim().replace(',', '.');
    const parsedBudget = normalizedBudget === '' ? null : Number(normalizedBudget);
    if (parsedBudget !== null && (!Number.isFinite(parsedBudget) || parsedBudget < 0)) {
      setError(t('clientRequestService.invalidBudget', 'Enter a valid budget value.'));
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data, error: requestError } = await supabase
      .from('service_requests')
      .insert({
        client_id: user.id,
        service_id: serviceId,
        description: description.trim() || null,
        price: parsedBudget,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address.trim() || null,
      })
      .select('id')
      .single();

    setSubmitting(false);

    if (requestError) {
      setError(formatClientQuotaError(requestError.message, language));
      return;
    }

    if (user) {
      const { data: quotaData } = await supabase
        .rpc('get_client_request_quota', { p_client_id: user.id })
        .maybeSingle();
      setClientQuota((quotaData as {
        plan_name: string;
        max_requests: number;
        request_window_days: number;
        used_requests: number;
        remaining_requests: number;
        window_end: string | null;
      }) ?? null);
    }

    navigate(`/client/requests/${data.id}`);
  }

  const es = language === 'es';

  return (
    <Layout navItems={CLIENT_NAV} title="Request Service">
      <div className="mb-5 space-y-1.5 md:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{t('clientRequestService.title')}</h1>
        <p className="text-sm text-slate-600 md:text-base">{t('clientRequestService.subtitle')}</p>
      </div>

      {!coords && !locationLoading && (
        <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 md:mb-6">
          <p className="text-sm font-medium text-yellow-800">{t('clientRequestService.locationRequiredTitle')}</p>
          <p className="mt-1 text-sm text-yellow-700">{t('clientRequestService.locationRequiredDesc')}</p>
          <button onClick={refresh} className="btn-secondary mt-3">
            <MapPin className="h-4 w-4" />
            {t('clientRequestService.detectLocation')}
          </button>
        </div>
      )}

      {clientQuota && clientQuota.max_requests !== -1 && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            {es ? 'Cupo actual de solicitudes (plan FREE)' : 'Current request quota (FREE plan)'}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            {es
              ? `Usadas: ${clientQuota.used_requests} de ${clientQuota.max_requests} en ${clientQuota.request_window_days} día(s). Restantes: ${clientQuota.remaining_requests}.`
              : `Used: ${clientQuota.used_requests} of ${clientQuota.max_requests} in ${clientQuota.request_window_days} day(s). Remaining: ${clientQuota.remaining_requests}.`}
          </p>
          {clientQuota.window_end && (
            <p className="mt-1 text-xs text-emerald-700">
              {es ? `Próximo reinicio: ${clientQuota.window_end}` : `Next reset: ${clientQuota.window_end}`}
            </p>
          )}
        </div>
      )}

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <form onSubmit={handleSubmit} className="card space-y-4 p-4 md:p-5">
            <div>
              <span className="badge bg-blue-50 text-blue-700">{getCategoryPath(categoryMap, service?.category_id, t('clientRequestService.serviceBadge'))}</span>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 md:text-xl">{service?.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{service?.description || t('clientRequestService.serviceFallback')}</p>
            </div>

            <div className="form-group">
              <label className="label">{t('clientRequestService.describeLabel')}</label>
              <textarea
                className="input resize-none"
                rows={5}
                placeholder={t('clientRequestService.describePlaceholder')}
                value={description}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="form-group">
                <label className="label">{t('clientRequestService.budgetLabel')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="input"
                  placeholder={t('clientRequestService.budgetPlaceholder')}
                  value={budget}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setBudget(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">{t('clientRequestService.addressLabel')}</label>
                <input
                  className="input"
                  placeholder={addressPlaceholder}
                  value={address}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddress(event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="inline-flex items-center gap-2 font-medium text-slate-800">
                <ShieldCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
                {t('clientRequestService.currentLocation')}
              </p>
              <p className="mt-1.5">
                {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : t('clientRequestService.waitingGps')}
              </p>
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={submitting || !coords}>
              {submitting ? <LoadingSpinner size="sm" /> : t('clientRequestService.sendRequest')}
            </button>
          </form>

          <RequestServiceProvidersPanel
            t={t}
            providerMarkers={providerMarkers}
            estimatedProviders={estimatedProviders}
          />
        </div>
      )}
    </Layout>
  );
}
