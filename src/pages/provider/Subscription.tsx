import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { formatCurrency, formatDate, formatPlanFeature } from '../../utils/helpers';
import type { Plan, Subscription } from '../../types';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

type SubscriptionRecord = Subscription & { plan?: Plan };

export default function ProviderSubscription() {
  const { user } = useAuth();
  const { language } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function fetchData() {
      setLoading(true);
      const [planRes, subscriptionRes] = await Promise.all([
        supabase.from('plans').select('*').order('price'),
        supabase
          .from('subscriptions')
          .select('*, plan:plans(*)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
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
      endDate.setDate(endDate.getDate() + 15);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const payload = {
      user_id: user.id,
      plan_id: plan.id,
      status: plan.name === 'FREE' ? 'trial' : 'active',
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
  }

  const es = language === 'es';

  return (
    <Layout navItems={PROVIDER_NAV} title="Subscription">
      <div className="page-header">
        <h1 className="page-title">{es ? 'Suscripción' : 'Subscription'}</h1>
        <p className="page-subtitle">{es ? 'Trial de 15 días con 10 solicitudes al mes y plan PRO desde USD 7.99/mes.' : '15-day trial with 10 requests per month and PRO plan from USD 7.99/mo.'}</p>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {subscription && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-slate-900">{es ? 'Plan actual' : 'Current Plan'}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="surface-muted">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{es ? 'Plan' : 'Plan'}</p>
                  <p className="mt-2 font-medium text-slate-900">{subscription.plan?.name || (es ? 'Desconocido' : 'Unknown')}</p>
                </div>
                <div className="surface-muted">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{es ? 'Estado' : 'Status'}</p>
                  <p className="mt-2 font-medium capitalize text-slate-900">{subscription.status}</p>
                </div>
                <div className="surface-muted">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{es ? 'Finaliza' : 'Ends'}</p>
                  <p className="mt-2 font-medium text-slate-900">{subscription.end_date ? formatDate(subscription.end_date, language) : (es ? 'Sin fecha de fin' : 'No end date')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
            {plans.map((plan) => {
              const active = subscription ? subscription.plan_id === plan.id : plan.price === 0;
              const features = Object.entries(plan.features || {}).filter(([, value]) => value !== false);
              return (
                <div key={plan.id} className={`relative ${active ? 'card border-emerald-400 ring-2 ring-emerald-100' : 'card'}`}>
                  {active && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {es ? 'Actual' : 'Current'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
                      <p className="mt-2 text-3xl font-bold text-blue-600">
                          {plan.price === 0 ? (es ? 'Trial' : 'Trial') : `${formatCurrency(plan.price, language)}/${es ? 'mes' : 'mo'}`}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    {features.map(([key, value]) => (
                      <li key={key} className="capitalize">
                        {formatPlanFeature(key, value, language)}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => choosePlan(plan)}
                    className={active ? 'btn-secondary mt-6 w-full justify-center' : 'btn-primary mt-6 w-full justify-center'}
                    disabled={savingPlan === plan.id}
                  >
                    {savingPlan === plan.id ? <LoadingSpinner size="sm" /> : active ? (es ? 'Seleccionado' : 'Selected') : (es ? `Elegir ${plan.name}` : `Choose ${plan.name}`)}
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
