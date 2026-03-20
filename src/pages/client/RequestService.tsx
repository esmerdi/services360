import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LocationMap from '../../components/common/LocationMap';
import type { LocationMapMarker } from '../../components/common/LocationMap';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { formatDistance, haversineDistance } from '../../utils/distance';
import type { Service, User } from '../../types';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

type ServiceDetails = Service & { category?: { id: string; name: string } };
type NearbyProvider = User & { distance_km?: number; location?: { latitude: number; longitude: number; address: string | null } };

export default function ClientRequestService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { coords, refresh, loading: locationLoading } = useLocation();

  const [service, setService] = useState<ServiceDetails | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; parent_id: string | null }>>([]);
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

  const getCategoryPath = (categoryId: string | null | undefined) => {
    if (!categoryId) return t('clientRequestService.serviceBadge');

    const path: string[] = [];
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);

    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      path.unshift(current.name);
      current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
    }

    return path.length > 0 ? path.join(' > ') : t('clientRequestService.serviceBadge');
  };

  useEffect(() => {
    if (!serviceId) {
      setError(t('clientRequestService.serviceNotFound'));
      setLoading(false);
      return;
    }

    if (!coords) {
      setLoading(false);
      return;
    }

    const currentCoords = coords;

    async function fetchData() {
      setLoading(true);
      const [serviceRes, categoriesRes] = await Promise.all([
        supabase
          .from('services')
          .select('*, category:categories(id, name)')
          .eq('id', serviceId)
          .single(),
        supabase.from('categories').select('id, name, parent_id'),
      ]);

      const serviceData = serviceRes.data;
      const serviceError = serviceRes.error;
      const categoriesData = categoriesRes.data;
      const categoriesError = categoriesRes.error;

      if (serviceError) {
        setError(serviceError.message);
        setLoading(false);
        return;
      }

      if (categoriesError) {
        setError(categoriesError.message);
        setLoading(false);
        return;
      }

      const { data: providerLinks, error: linkError } = await supabase
        .from('provider_services')
        .select('provider_id')
        .eq('service_id', serviceId);

      if (linkError) {
        setError(linkError.message);
        setLoading(false);
        return;
      }

      const providerIds = ((providerLinks as Array<{ provider_id: string }> | null) ?? []).map(
        (item: { provider_id: string }) => item.provider_id
      );
      let providerRows: NearbyProvider[] = [];

      if (providerIds.length > 0) {
        const { data: providerData, error: providerError } = await supabase
          .from('users')
          .select('*')
          .in('id', providerIds)
          .eq('role', 'provider')
          .eq('is_available', true);

        if (providerError) {
          setError(providerError.message);
          setLoading(false);
          return;
        }

        const filteredProviderIds = ((providerData as User[]) ?? []).map((provider) => provider.id);
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('user_id, latitude, longitude, address')
          .in('user_id', filteredProviderIds);

        if (locationError) {
          setError(locationError.message);
          setLoading(false);
          return;
        }

        const locationMap = new Map(
          ((locationData as Array<{ user_id: string; latitude: number; longitude: number; address: string | null }>) ?? []).map((location) => [
            location.user_id,
            location,
          ])
        );

        providerRows = ((providerData as User[]) ?? [])
          .map((provider) => ({
            ...provider,
            location: locationMap.get(provider.id),
            distance_km: locationMap.get(provider.id)
              ? haversineDistance(
                  currentCoords.latitude,
                  currentCoords.longitude,
                  locationMap.get(provider.id)!.latitude,
                  locationMap.get(provider.id)!.longitude
                )
              : undefined,
          }))
          .sort((left, right) => (left.distance_km ?? Infinity) - (right.distance_km ?? Infinity));
      }

      setService(serviceData as ServiceDetails);
      setCategories(
        ((categoriesData as Array<{ id: string; name: string; parent_id: string | null }>) ?? [])
      );
      setProviders(providerRows);
      setLoading(false);
    }

    fetchData();
  }, [serviceId, coords, t]);

  const estimatedProviders = useMemo(() => providers.slice(0, 5), [providers]);
  const providerMarkers = useMemo(() => {
    const markers: LocationMapMarker[] = estimatedProviders
      .filter((provider) => provider.location)
      .map((provider) => ({
        id: provider.id,
        latitude: provider.location!.latitude,
        longitude: provider.location!.longitude,
        label: provider.full_name || provider.email,
        description: provider.location?.address || t('clientRequestService.providerLocationFallback'),
        color: '#0f766e',
      }));

    if (coords) {
      markers.unshift({
        id: 'client-location',
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: t('clientRequestService.currentLocation'),
        description: address.trim() || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        color: '#2563eb',
        radius: 10,
      });
    }

    return markers;
  }, [address, coords, estimatedProviders, t]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !serviceId || !coords) {
      setError(t('clientRequestService.locationRequiredError'));
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
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address.trim() || null,
      })
      .select('id')
      .single();

    setSubmitting(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    navigate(`/client/requests/${data.id}`);
  }

  return (
    <Layout navItems={CLIENT_NAV} title="Request Service">
      <div className="page-header">
        <h1 className="page-title">{t('clientRequestService.title')}</h1>
        <p className="page-subtitle">{t('clientRequestService.subtitle')}</p>
      </div>

      {!coords && !locationLoading && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">{t('clientRequestService.locationRequiredTitle')}</p>
          <p className="mt-1 text-sm text-yellow-700">{t('clientRequestService.locationRequiredDesc')}</p>
          <button onClick={refresh} className="btn-secondary mt-3">
            <MapPin className="h-4 w-4" />
            {t('clientRequestService.detectLocation')}
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <span className="badge bg-blue-50 text-blue-700">{getCategoryPath(service?.category_id)}</span>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{service?.name}</h2>
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

            <div className="grid gap-4 md:grid-cols-1">
              <div className="form-group">
                <label className="label">{t('clientRequestService.addressLabel')}</label>
                <input
                  className="input"
                  placeholder={t('clientRequestService.addressPlaceholder')}
                  value={address}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddress(event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{t('clientRequestService.currentLocation')}</p>
              <p className="mt-1">
                {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : t('clientRequestService.waitingGps')}
              </p>
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={submitting || !coords}>
              {submitting ? <LoadingSpinner size="sm" /> : t('clientRequestService.sendRequest')}
            </button>
          </form>

          <div className="card">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('clientRequestService.nearbyProviders')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('clientRequestService.nearbyProvidersDesc')}</p>
            </div>
            <LocationMap markers={providerMarkers} />
            <div className="space-y-3">
              {estimatedProviders.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  {t('clientRequestService.noProviders')}
                </div>
              )}
              {estimatedProviders.map((provider) => (
                <div key={provider.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{provider.full_name || provider.email}</p>
                      <p className="mt-1 text-sm text-slate-500">{provider.location?.address || t('clientRequestService.providerLocationFallback')}</p>
                    </div>
                    <span className="badge bg-green-50 text-green-700">{t('clientRequestService.online')}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {provider.distance_km !== undefined ? formatDistance(provider.distance_km) : t('clientRequestService.distanceUnavailable')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
