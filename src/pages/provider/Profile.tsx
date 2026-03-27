import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StarRating from '../../components/common/StarRating';
import ProfileEditor from '../../components/common/ProfileEditor';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { formatDateTime } from '../../utils/helpers';
import type { Category, Rating, Service } from '../../types';

const PROVIDER_NAV = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Nearby Requests', to: '/provider/nearby' },
  { label: 'My Jobs', to: '/provider/jobs' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Subscription', to: '/provider/subscription' },
];

type ServiceOption = Pick<Service, 'id' | 'name' | 'category_id'>;

export default function ProviderProfile() {
  const { user, refreshUser } = useAuth();
  const { language } = useI18n();
  const { coords } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [visibleRatingsCount, setVisibleRatingsCount] = useState(10);
  const initializedRef = React.useRef(false);
  const es = language === 'es';

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function fetchData() {
      setLoading(true);
      const [catRes, serviceRes, providerServiceRes, ratingRes] = await Promise.all([
        supabase.from('categories').select('id, name, parent_id').order('name'),
        supabase.from('services').select('id, name, category_id').order('name'),
        supabase.from('provider_services').select('service_id').eq('provider_id', currentUser.id),
        supabase
          .from('ratings')
          .select('*, from_user:users!ratings_from_user_id_fkey(id, full_name, email)')
          .eq('to_user_id', currentUser.id)
          .order('created_at', { ascending: false }),
      ]);

      if (catRes.error) {
        setError(catRes.error.message);
      } else if (serviceRes.error) {
        setError(serviceRes.error.message);
      } else if (providerServiceRes.error) {
        setError(providerServiceRes.error.message);
      } else {
        setCategories((catRes.data as Category[]) ?? []);
        setServices((serviceRes.data as ServiceOption[]) ?? []);
        setSelectedServiceIds((providerServiceRes.data ?? []).map((item) => item.service_id));
        
        // Initialize expanded categories with first one
        const cats = catRes.data as Category[] ?? [];
        if (cats.length > 0) {
          setExpandedCategories(new Set());
        }
      }

      if (!ratingRes.error) {
        setRatings((ratingRes.data as Rating[]) ?? []);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const averageRating = useMemo(() => {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
  }, [ratings]);

  const visibleRatings = useMemo(
    () => ratings.slice(0, visibleRatingsCount),
    [ratings, visibleRatingsCount]
  );

  const hasMoreRatings = ratings.length > visibleRatingsCount;

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

  const servicesByRootCategory = useMemo(() => {
    const grouped = new Map<string, ServiceOption[]>();

    for (const service of services) {
      let rootName = es ? 'Sin categoria' : 'Uncategorized';
      const visited = new Set<string>();
      let current = service.category_id ? categoryMap.get(service.category_id) : undefined;

      while (current) {
        if (visited.has(current.id)) break;
        visited.add(current.id);
        rootName = current.name;
        current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
      }

      const existing = grouped.get(rootName);
      if (existing) {
        existing.push(service);
      } else {
        grouped.set(rootName, [service]);
      }
    }

    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [categoryMap, es, services]);

  // Initialize expandedCategories with first category only once
  useEffect(() => {
    if (!initializedRef.current && servicesByRootCategory.length > 0) {
      const firstCategory = servicesByRootCategory[0][0];
      setExpandedCategories(new Set([firstCategory]));
      initializedRef.current = true;
    }
  }, [servicesByRootCategory]);

  // Clear success message after 3.5 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    setVisibleRatingsCount(10);
  }, [ratings]);

  async function toggleAvailability() {
    if (!user) return;
    setSavingAvailability(true);
    const nextValue = !user.is_available;
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_available: nextValue })
      .eq('id', user.id);
    setSavingAvailability(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await refreshUser();
  }

  async function saveServices() {
    if (!user) return;
    setSavingServices(true);
    const { error: deleteError } = await supabase.from('provider_services').delete().eq('provider_id', user.id);
    if (deleteError) {
      setSavingServices(false);
      setError(deleteError.message);
      return;
    }

    if (selectedServiceIds.length > 0) {
      const { error: insertError } = await supabase.from('provider_services').insert(
        selectedServiceIds.map((serviceId) => ({ provider_id: user.id, service_id: serviceId }))
      );
      if (insertError) {
        setSavingServices(false);
        setError(insertError.message);
        return;
      }
    }

    setSavingServices(false);
    setSuccessMessage(es ? 'Servicios guardados correctamente.' : 'Services saved successfully.');
  }

  return (
    <Layout navItems={PROVIDER_NAV} title="Provider Profile">
      <div className="page-header">
        <h1 className="page-title">{es ? 'Perfil y disponibilidad' : 'Profile & Availability'}</h1>
        <p className="page-subtitle">{es ? 'Controla los servicios que ofreces y como te ven los clientes.' : 'Control the services you offer and how clients see you.'}</p>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {successMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <ProfileEditor />

            <div className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{es ? 'Suscripción del proveedor' : 'Provider subscription'}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {es
                      ? 'Inicia con Trial de 15 días y 10 solicitudes al mes, o activa PRO por USD 7.99/mes.'
                      : 'Start with a 15-day trial and 10 requests per month, or upgrade to PRO for USD 7.99/mo.'}
                  </p>
                </div>
                <Link to="/provider/subscription" className="btn-primary">
                  {es ? 'Ver suscripción' : 'See subscription'}
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="surface-muted text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{es ? 'TRIAL' : 'TRIAL'}</p>
                  <p className="mt-1">{es ? '15 días' : '15 days'}</p>
                  <p>{es ? '10 solicitudes por mes' : '10 requests per month'}</p>
                </div>
                <div className="surface-muted text-sm text-slate-600">
                  <p className="font-medium text-slate-800">PRO</p>
                  <p className="mt-1">USD 7.99/{es ? 'mes' : 'mo'}</p>
                  <p>{es ? 'Mayor visibilidad y prioridad' : 'More visibility and priority'}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{es ? 'Disponibilidad' : 'Availability'}</h2>
                  <p className="mt-1 text-sm text-slate-500">{es ? 'Los proveedores en línea pueden recibir solicitudes cercanas según disponibilidad.' : 'Online providers can receive nearby requests based on availability.'}</p>
                </div>
                <button onClick={toggleAvailability} className={user?.is_available ? 'btn-secondary' : 'btn-primary'} disabled={savingAvailability}>
                  {savingAvailability ? <LoadingSpinner size="sm" /> : user?.is_available ? (es ? 'Desconectarme' : 'Go offline') : (es ? 'Conectarme' : 'Go online')}
                </button>
              </div>
              <div className="mt-4 surface-muted text-sm text-slate-600">
                <p className="font-medium text-slate-800">{es ? 'Ubicación actual' : 'Current location'}</p>
                <p className="mt-1">
                  {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : (es ? 'GPS aún no disponible' : 'GPS not available yet')}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{es ? 'Servicios ofrecidos' : 'Offered Services'}</h2>
                  <p className="mt-1 text-sm text-slate-500">{es ? 'Selecciona todos los servicios que puedes realizar.' : 'Select every service you can fulfill.'}</p>
                </div>
                <button onClick={saveServices} className="btn-primary" disabled={savingServices}>
                  {savingServices ? <LoadingSpinner size="sm" /> : (es ? 'Guardar servicios' : 'Save services')}
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {servicesByRootCategory.map(([rootCategory, rootServices]) => {
                  const isExpanded = expandedCategories.has(rootCategory);
                  return (
                    <section key={rootCategory} className="rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          const newExpanded = new Set(expandedCategories);
                          if (isExpanded) {
                            newExpanded.delete(rootCategory);
                          } else {
                            newExpanded.add(rootCategory);
                          }
                          setExpandedCategories(newExpanded);
                        }}
                        className="w-full p-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-slate-400" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                            {rootCategory}
                          </h3>
                          <span className="text-xs text-slate-500 ml-auto flex-shrink-0">
                            ({rootServices.length})
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 grid gap-3 md:grid-cols-2 border-t border-inherit">
                          {rootServices.map((service) => {
                            const selected = selectedServiceIds.includes(service.id);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => setSelectedServiceIds((current) => selected ? current.filter((id) => id !== service.id) : [...current, service.id])}
                                className={selected ? 'rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-left mt-3' : 'rounded-xl border border-slate-200 p-4 text-left hover:border-slate-300 mt-3'}
                              >
                                <p className="font-medium text-slate-900">{service.name}</p>
                                <p className="mt-2 text-sm text-slate-500">{selected ? (es ? 'Seleccionado' : 'Selected') : (es ? 'Toca para ofrecer este servicio' : 'Tap to offer this service')}</p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card flex flex-col xl:max-h-[600px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{es ? 'Calificaciones' : 'Ratings'}</h2>
                <p className="mt-1 text-sm text-slate-500">{es ? 'Tu reputación basada en trabajos completados.' : 'Your reputation from completed jobs.'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{averageRating.toFixed(1)}</p>
                <p className="text-xs text-slate-500">{es ? 'Promedio' : 'Average rating'}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 overflow-y-auto pr-1 xl:max-h-[500px]">
              {ratings.length === 0 && (
                <p className="text-sm text-slate-400">{es ? 'Aún no hay calificaciones.' : 'No ratings yet.'}</p>
              )}
              {visibleRatings.map((rating) => (
                <div key={rating.id} className="surface-stroke">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{rating.from_user?.full_name || (es ? 'Cliente' : 'Client')}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(rating.created_at, language)}</p>
                    </div>
                    <StarRating value={rating.rating} readonly size="sm" />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{rating.comment || (es ? 'Sin comentario.' : 'No comment provided.')}</p>
                </div>
              ))}

              {hasMoreRatings && (
                <div className="sticky bottom-0 -mx-1 border-t border-slate-200 bg-white/95 px-1 pt-2 backdrop-blur">
                  <div className="flex justify-center">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setVisibleRatingsCount((current) => current + 10)}
                  >
                    {es ? 'Ver más calificaciones antiguas' : 'View older ratings'}
                  </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
