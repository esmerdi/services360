import React, { useEffect, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
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

  return (
    <Layout navItems={ADMIN_NAV} title="Plans">
      <div className="page-header">
        <h1 className="page-title">{es ? 'Planes y precios' : 'Plans & Pricing'}</h1>
        <p className="page-subtitle">{es ? 'Gestiona los planes de suscripcion para proveedores' : 'Manage subscription plans for providers'}</p>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card relative ${plan.name === 'PRO' ? 'border-blue-400 ring-2 ring-blue-100' : ''}`}
            >
              {plan.name === 'PRO' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge bg-blue-600 text-white px-4 py-1 text-xs font-semibold shadow">
                    {es ? 'RECOMENDADO' : 'RECOMMENDED'}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                <p className="text-3xl font-extrabold text-blue-600 mt-1">
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

              <ul className="space-y-2 mb-6">
                {getFeatures(plan).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="capitalize">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => openEdit(plan)}
                className="btn-secondary w-full"
              >
                <Pencil className="h-4 w-4" />
                {es ? 'Editar precio' : 'Edit Price'}
              </button>
            </div>
          ))}
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
