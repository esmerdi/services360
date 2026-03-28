import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Leaf,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { formatCurrency, formatDate, formatPlanFeature } from '../../utils/helpers';
import type { Plan, Subscription, SubscriptionStatus } from '../../types';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

type SubscriptionRecord = Subscription & { plan?: Plan };
type ProviderQuota = {
  plan_name: string;
  max_requests: number;
  request_window_days: number;
  window_start: string | null;
  window_end: string | null;
  used_requests: number;
  remaining_requests: number;
  is_limited: boolean;
};

export default function ProviderSubscription() {
  const { user } = useAuth();
  const { language } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [quota, setQuota] = useState<ProviderQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function fetchData() {
      setLoading(true);
      const [planRes, subscriptionRes, quotaRes] = await Promise.all([
        supabase.from('plans').select('*').order('price'),
        supabase
          .from('subscriptions')
          .select('*, plan:plans(*)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .maybeSingle(),
        supabase
          .rpc('get_provider_request_quota', { p_provider_id: currentUser.id })
          .maybeSingle(),
      ]);

      if (planRes.error) {
        setError(planRes.error.message);
      } else {
        setPlans((planRes.data as Plan[]) ?? []);
      }

      if (!subscriptionRes.error) {
        setSubscription((subscriptionRes.data as SubscriptionRecord | null) ?? null);
      }

      if (!quotaRes.error) {
        setQuota((quotaRes.data as ProviderQuota | null) ?? null);
      } else {
        setQuota(null);
      }
      setLoading(false);
    }

    fetchData();
  }, [user]);

  async function choosePlan(plan: Plan) {
    if (!user) return;
    setSavingPlan(plan.id);

    const now = new Date();
    const endDate = new Date(now);
    if (plan.name === 'FREE') {
      endDate.setDate(endDate.getDate() + 30);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const payload = {
      user_id: user.id,
      plan_id: plan.id,
      status: 'active',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
    };

    const response = subscription
      ? await supabase
          .from('subscriptions')
          .update(payload)
          .eq('id', subscription.id)
          .select('*, plan:plans(*)')
          .single()
      : await supabase
          .from('subscriptions')
          .insert(payload)
          .select('*, plan:plans(*)')
          .single();

    setSavingPlan(null);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    setSubscription(response.data as SubscriptionRecord);

    const { data: quotaData } = await supabase
      .rpc('get_provider_request_quota', { p_provider_id: user.id })
      .maybeSingle();
    setQuota((quotaData as ProviderQuota | null) ?? null);
  }

  const es = language === 'es';

  const quotaResetDate = useMemo(() => {
    if (!subscription) return null;

    if (subscription.plan?.name !== 'FREE') {
      return subscription.end_date;
    }

    const features = (subscription.plan?.features ?? {}) as Record<string, unknown>;
    const rawWindowDays = features.request_window_days;
    const parsedWindowDays =
      typeof rawWindowDays === 'number'
        ? rawWindowDays
        : typeof rawWindowDays === 'string'
          ? Number(rawWindowDays)
          : 30;

    const requestWindowDays = Number.isFinite(parsedWindowDays) && parsedWindowDays > 0 ? parsedWindowDays : 30;

    if (!subscription.start_date) return subscription.end_date;

    const startDate = new Date(subscription.start_date);
    if (Number.isNaN(startDate.getTime())) return subscription.end_date;

    const cycleMs = requestWindowDays * 24 * 60 * 60 * 1000;
    const elapsedMs = Date.now() - startDate.getTime();
    const cycleIndex = elapsedMs > 0 ? Math.floor(elapsedMs / cycleMs) : 0;
    const nextCycleDate = new Date(startDate.getTime() + (cycleIndex + 1) * cycleMs);

    return nextCycleDate.toISOString();
  }, [subscription]);

  const statusLabelMap: Record<SubscriptionStatus, string> = es
    ? {
        active: 'Activo',
        cancelled: 'Cancelado',
        trial: 'Prueba',
      }
    : {
        active: 'Active',
        cancelled: 'Cancelled',
        trial: 'Trial',
      };

  const quotaUsagePercent = useMemo(() => {
    if (!quota || quota.max_requests <= 0 || quota.max_requests === -1) return 0;
    return Math.min(100, Math.round((quota.used_requests / quota.max_requests) * 100));
  }, [quota]);

  return (
    <Layout navItems={PROVIDER_NAV} title="Subscription">
      <div className="mb-5 space-y-1.5 md:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{es ? 'Suscripción' : 'Subscription'}</h1>
        <p className="text-sm text-slate-600 md:text-base">{es ? 'Elige el plan ideal para tus solicitudes mensuales.' : 'Pick the plan that fits your monthly requests.'}</p>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {subscription && (
            <div className="card mb-4 p-4 md:mb-5 md:p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <h2 className="text-base font-semibold md:text-lg">{es ? 'Plan actual' : 'Current plan'}</h2>
              </div>
              <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{es ? 'Plan' : 'Plan'}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-900">{subscription.plan?.name || (es ? 'Desconocido' : 'Unknown')}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{es ? 'Estado' : 'Status'}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-900">
                      {statusLabelMap[subscription.status] ?? subscription.status}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{subscription.plan?.name === 'FREE' ? (es ? 'Renovación del cupo' : 'Quota reset') : (es ? 'Finaliza' : 'Ends')}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-sky-600" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-900">{quotaResetDate ? formatDate(quotaResetDate, language) : (es ? 'Sin fecha de fin' : 'No end date')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {quota && (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:mb-6 md:p-5">
              <div className="mb-3 flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-sky-600" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-900 md:text-base">{es ? 'Consumo del período' : 'Current period usage'}</h3>
              </div>

              {quota.max_requests === -1 ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
                  {es ? 'Tu plan actual tiene solicitudes ilimitadas.' : 'Your current plan has unlimited requests.'}
                </div>
              ) : (
                <>
                  <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">{es ? 'Usadas' : 'Used'}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{quota.used_requests}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">{es ? 'Restantes' : 'Remaining'}</p>
                      <p className="mt-1 text-base font-semibold text-emerald-700">{quota.remaining_requests}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">{es ? 'Próximo reinicio' : 'Next reset'}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {quota.window_end ? formatDate(quota.window_end, language) : (es ? 'Sin fecha' : 'No date')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{es ? `Límite ${quota.max_requests} por ${quota.request_window_days} días` : `Limit ${quota.max_requests} per ${quota.request_window_days} days`}</span>
                      <span>{quotaUsagePercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${quotaUsagePercent}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid max-w-4xl gap-4 md:grid-cols-2 md:gap-5">
            {plans.map((plan) => {
              const active = subscription ? subscription.plan_id === plan.id : plan.price === 0;
              const features = Object.entries(plan.features || {}).filter(([, value]) => value !== false);
              const isFree = plan.name === 'FREE';
              const isPro = plan.name === 'PRO';

              const palette = isFree
                ? {
                    card: 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white',
                    badge: 'border-emerald-200 bg-emerald-100 text-emerald-700',
                    accent: 'text-emerald-700',
                    icon: 'text-emerald-600',
                    button: active ? 'btn-secondary' : 'btn-primary',
                  }
                : isPro
                  ? {
                      card: 'border-sky-200 bg-gradient-to-b from-cyan-50 to-white',
                      badge: 'border-sky-200 bg-sky-100 text-sky-700',
                      accent: 'text-sky-700',
                      icon: 'text-sky-600',
                      button: active ? 'btn-secondary' : 'btn-primary',
                    }
                  : {
                      card: 'border-slate-200 bg-white',
                      badge: 'border-slate-200 bg-slate-100 text-slate-700',
                      accent: 'text-slate-700',
                      icon: 'text-slate-600',
                      button: active ? 'btn-secondary' : 'btn-primary',
                    };

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-4 shadow-sm transition-colors md:p-5 ${palette.card} ${
                    active ? 'ring-2 ring-offset-0 ' + (isFree ? 'ring-emerald-200' : isPro ? 'ring-sky-200' : 'ring-slate-200') : ''
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${palette.badge}`}>
                      {isFree ? <Leaf className="h-3.5 w-3.5" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                      {plan.name}
                    </span>
                    {active && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                        {es ? 'Actual' : 'Current'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                    <div className="flex items-end gap-1.5">
                      <p className={`text-2xl font-bold leading-none md:text-[2rem] ${palette.accent}`}>
                        {plan.price === 0 ? (es ? 'Gratis' : 'Free') : formatCurrency(plan.price, language)}
                      </p>
                      <span className="pb-0.5 text-sm text-slate-500">
                        {plan.price === 0 ? (es ? 'sin caducidad' : 'no expiration') : `/${es ? 'mes' : 'mo'}`}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                    {features.map(([key, value]) => (
                      <li key={key} className="flex items-start gap-2">
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${palette.icon}`} aria-hidden="true" />
                        <span className="leading-5 text-slate-600">{formatPlanFeature(key, value, language)}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => choosePlan(plan)}
                    className={`${palette.button} mt-4 w-full justify-center py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2`}
                    disabled={savingPlan === plan.id}
                  >
                    {savingPlan === plan.id
                      ? <LoadingSpinner size="sm" />
                      : active
                        ? es
                          ? 'Seleccionado'
                          : 'Selected'
                        : isFree
                          ? es
                            ? 'Elegir plan gratis'
                            : 'Choose free plan'
                          : es
                            ? 'Elegir plan pro'
                            : 'Choose pro plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
