import React, { useEffect, useState } from 'react';
import { Check, CircleDollarSign, Pencil, ShieldCheck, Sparkles } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import { formatCurrency, formatPlanFeature } from '../../utils/helpers';
import type { Plan } from '../../types';

const ADMIN_NAV = [
  { label: 'Dashboard',  to: '/admin' },
  { label: 'Users',      to: '/admin/users' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Services',   to: '/admin/services' },
  { label: 'Requests',   to: '/admin/requests' },
  { label: 'Plans',      to: '/admin/plans' },
];

export default function AdminPlans() {
  const { language } = useI18n();
  const [plans, setPlans]         = useState<Plan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [editing, setEditing]     = useState<Plan | null>(null);
  const [price, setPrice]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function fetchPlans() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('plans')
      .select('*')
      .order('price');
    if (err) setError(err.message);
    else setPlans((data as Plan[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchPlans(); }, []);

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setPrice(String(plan.price));
    setFormError(null);
  };

  const handleSave = async () => {
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) {
      setFormError(language === 'es' ? 'Ingresa un precio valido.' : 'Please enter a valid price.');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from('plans')
      .update({ price: parsed })
      .eq('id', editing!.id);
    setSaving(false);
    if (err) { setFormError(err.message); return; }
    setEditing(null);
    fetchPlans();
  };

  const getFeatures = (plan: Plan): string[] => {
    if (!plan.features) return [];
    return Object.entries(plan.features)
      .map(([key, value]) => formatPlanFeature(key, value, language))
      .filter(Boolean) as string[];
  };

  const es = language === 'es';
  const freePlans = plans.filter((plan) => plan.price === 0).length;
  const maxPrice = plans.reduce((max, plan) => Math.max(max, plan.price), 0);

  return (
    <Layout navItems={ADMIN_NAV} title="Plans">
      <div className="page-header rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {es ? 'Estrategia comercial' : 'Pricing strategy'}
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{es ? 'Planes y precios' : 'Plans & Pricing'}</h1>
        <p className="mt-1 text-sm text-slate-600 md:text-base">{es ? 'Gestiona los planes de suscripcion para proveedores' : 'Manage subscription plans for providers'}</p>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{es ? 'Planes totales' : 'Total plans'}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{plans.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.08em] text-emerald-700">{es ? 'Plan gratuito' : 'Free plans'}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-800">{freePlans}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.08em] text-sky-700">{es ? 'Precio máximo' : 'Highest price'}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-sky-800">{maxPrice > 0 ? formatCurrency(maxPrice, language) : (es ? 'Sin costo' : 'No cost')}</p>
            </div>
          </div>

          <div className="grid max-w-4xl gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const isFree = plan.name === 'FREE' || plan.price === 0;
              const isPro = plan.name === 'PRO';

              const palette = isFree
                ? {
                    card: 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white',
                    ring: 'ring-emerald-200',
                    title: 'text-emerald-800',
                    icon: 'text-emerald-600',
                    price: 'text-emerald-700',
                  }
                : isPro
                  ? {
                      card: 'border-sky-200 bg-gradient-to-b from-cyan-50 to-white',
                      ring: 'ring-sky-200',
                      title: 'text-sky-900',
                      icon: 'text-sky-600',
                      price: 'text-sky-700',
                    }
                  : {
                      card: 'border-slate-200 bg-white',
                      ring: 'ring-slate-200',
                      title: 'text-slate-900',
                      icon: 'text-slate-600',
                      price: 'text-blue-600',
                    };

              return (
                <article
                  key={plan.id}
                  className={`relative rounded-2xl border p-5 shadow-sm ${palette.card} ${isPro ? `ring-2 ${palette.ring}` : ''}`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
                        {es ? 'Recomendado' : 'Recommended'}
                      </span>
                    </div>
                  )}

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className={`text-xl font-semibold tracking-tight ${palette.title}`}>{plan.name}</h2>
                      <p className={`mt-1 text-3xl font-bold ${palette.price}`}>
                        {plan.price === 0 ? (
                          <span>{es ? 'Gratis' : 'Free'}</span>
                        ) : (
                          <>
                            {formatCurrency(plan.price, language)}
                            <span className="text-base font-normal text-slate-500">/{es ? 'mes' : 'mo'}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white/85">
                      <CircleDollarSign className={`h-5 w-5 ${palette.icon}`} aria-hidden="true" />
                    </div>
                  </div>

                  <div className="mb-5 rounded-xl border border-slate-200 bg-white/80 p-3">
                    <ul className="space-y-2">
                      {getFeatures(plan).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                          <span className="capitalize">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => openEdit(plan)}
                    className="btn-secondary w-full focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Pencil className="h-4 w-4" />
                    {es ? 'Editar precio' : 'Edit Price'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={es ? `Editar precio del plan ${editing?.name}` : `Edit ${editing?.name} Plan Price`}
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>{es ? 'Actualiza solo el valor monetario. Las features del plan se mantienen.' : 'Update only the monetary value. Plan features stay unchanged.'}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="label">{es ? 'Precio mensual (USD)' : 'Monthly Price (USD)'}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditing(null)} className="btn-secondary">
              {es ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <LoadingSpinner size="sm" /> : (es ? 'Guardar precio' : 'Save Price')}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
