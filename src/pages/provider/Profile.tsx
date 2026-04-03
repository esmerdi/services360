import React, { useEffect, useMemo, useState } from 'react';

import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StarRating from '../../components/common/StarRating';
import ProfileEditor from '../../components/common/ProfileEditor';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { getProviderProfileText } from '../../i18n/providerProfileText';
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
  const text = getProviderProfileText(language);
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
      let rootName = text.uncategorized;
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
  }, [categoryMap, services, text.uncategorized]);

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
    setSuccessMessage(text.servicesSaved);
  }

  return (
    <Layout navItems={PROVIDER_NAV} title="Provider Profile">
      <div className="mb-5 space-y-1.5 md:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{text.title}</h1>
        <p className="text-sm text-slate-600 md:text-base">{text.subtitle}</p>
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
        <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-5">
            <ProfileEditor />

            <div className="card p-4 md:p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
                <h2 className="text-base font-semibold md:text-lg">{text.availability}</h2>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="mt-1 text-sm text-slate-500">{text.availabilityInfo}</p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {user?.is_available ? text.online : text.offline}
                  </div>
                </div>
                <button onClick={toggleAvailability} className={`${user?.is_available ? 'btn-secondary' : 'btn-primary'} shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2`} disabled={savingAvailability}>
                  {savingAvailability ? <LoadingSpinner size="sm" /> : user?.is_available ? text.goOffline : text.goOnline}
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-sky-600" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-slate-800">{text.currentLocation}</p>
                    <p className="mt-1">
                      {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : text.gpsNotAvailable}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 md:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-slate-900">
                    <Wrench className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                    <h2 className="text-base font-semibold md:text-lg">{text.offeredServices}</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{text.offeredServicesInfo}</p>
                  <p className="mt-1 text-xs text-slate-500">{`${text.selectedCount}: ${selectedServiceIds.length}`}</p>
                </div>
                <button onClick={saveServices} className="btn-primary shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2" disabled={savingServices}>
                  {savingServices ? <LoadingSpinner size="sm" /> : text.saveServices}
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {servicesByRootCategory.map(([rootCategory, rootServices]) => {
                  const isExpanded = expandedCategories.has(rootCategory);
                  return (
                    <section key={rootCategory} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                        className="flex w-full items-center justify-between gap-2 p-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                            {rootCategory}
                          </h3>
                          <span className="ml-auto flex-shrink-0 text-xs text-slate-500">
                            ({rootServices.length})
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="grid gap-2 border-t border-inherit px-3 pb-3 md:grid-cols-2">
                          {rootServices.map((service) => {
                            const selected = selectedServiceIds.includes(service.id);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => setSelectedServiceIds((current) => selected ? current.filter((id) => id !== service.id) : [...current, service.id])}
                                className={selected
                                  ? 'mt-2 rounded-xl border border-indigo-300 bg-indigo-50 p-3 text-left ring-1 ring-indigo-200'
                                  : 'mt-2 rounded-xl border border-slate-200 p-3 text-left hover:border-slate-300'
                                }
                              >
                                <p className="text-sm font-medium text-slate-900">{service.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{selected ? text.selected : text.tapToOffer}</p>
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

          <div className="card flex flex-col p-4 md:p-5 xl:max-h-[600px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-slate-900">
                  <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  <h2 className="text-base font-semibold md:text-lg">{text.ratings}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">{text.ratingsInfo}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-right">
                <p className="text-xl font-bold text-amber-700">{averageRating.toFixed(1)}</p>
                <p className="text-[11px] uppercase tracking-wide text-amber-700/80">{text.average}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2.5 overflow-y-auto pr-1 xl:max-h-[500px]">
              {ratings.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                  {text.noRatings}
                </div>
              )}
              {visibleRatings.map((rating) => (
                <div key={rating.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{rating.from_user?.full_name || text.client}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDateTime(rating.created_at, language)}
                      </p>
                    </div>
                    <StarRating value={rating.rating} readonly size="sm" />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{rating.comment || text.noComment}</p>
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
                    {text.viewOlderRatings}
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
