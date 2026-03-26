import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';
import { extractManagedAvatarPath } from '../../utils/helpers';
import {
  buildNearbyProviderMarkers,
  buildProviderOptions,
  createCategoryMap,
  createChildrenByParent,
  getServicesForRootCategory,
  getTopLevelCategories,
} from './browse/utils';
import BrowseMapPanel from './browse/BrowseMapPanel';
import BrowseRequestSidebar from './browse/BrowseRequestSidebar';
import { useBrowseData } from './browse/useBrowseData';
import { useBrowseRequestHandlers } from './browse/useBrowseRequestHandlers';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

export default function ClientBrowse() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { coords, refresh } = useLocation();
  const { categories, services, nearbyProviders, loading, error, setError } = useBrowseData(coords);
  const [selectedRootCategory, setSelectedRootCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [requestMode, setRequestMode] = useState<'direct' | 'open'>('direct');
  const [visibleMarkerIds, setVisibleMarkerIds] = useState<string[]>([]);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  const resolveAvatarUrl = useCallback((value: string | null | undefined): string | undefined => {
    if (!value) return undefined;

    const objectPath = extractManagedAvatarPath(value);
    if (!objectPath) {
      return value;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(objectPath);
    return data.publicUrl || value;
  }, []);

  useEffect(() => {
    // Reset service when root category changes
    setSelectedService(null);
    setSelectedProviderId(null);
  }, [selectedRootCategory]);

  useEffect(() => {
    setSelectedProviderId(null);
    setRequestMode('direct');
  }, [selectedService]);

  const categoryMap = useMemo(
    () => createCategoryMap(categories),
    [categories]
  );

  const childrenByParent = useMemo(() => createChildrenByParent(categories), [categories]);

  const topLevelCategories = useMemo(
    () => getTopLevelCategories(categories),
    [categories]
  );

  const servicesForSelectedRoot = useMemo(() => {
    return getServicesForRootCategory(services, selectedRootCategory, childrenByParent);
  }, [childrenByParent, selectedRootCategory, services]);

  const selectedServiceData = useMemo(() => {
    if (!selectedService) return null;
    return services.find((s) => s.id === selectedService) ?? null;
  }, [selectedService, services]);

  const filteredNearbyProviders = useMemo(() => {
    if (!selectedRootCategory) return nearbyProviders;
    return nearbyProviders.filter((provider) => provider.root_category_ids.includes(selectedRootCategory));
  }, [nearbyProviders, selectedRootCategory]);

  const nearbyProviderMarkers = useMemo(() => {
    return buildNearbyProviderMarkers({
      providers: filteredNearbyProviders,
      selectedRootCategoryId: selectedRootCategory,
      selectedServiceId: selectedService,
      categoryMap,
      coords,
      t,
      resolveAvatarUrl,
    });
  }, [categoryMap, coords, filteredNearbyProviders, resolveAvatarUrl, selectedRootCategory, selectedService, t]);

  const visibleProviderCount = useMemo(() => {
    const providerIds = new Set(filteredNearbyProviders.map((provider) => provider.id));
    return visibleMarkerIds.filter((markerId) => providerIds.has(markerId)).length;
  }, [filteredNearbyProviders, visibleMarkerIds]);

  const providerOptions = useMemo(() => {
    return buildProviderOptions({
      providers: filteredNearbyProviders,
      selectedServiceId: selectedService,
      t,
      resolveAvatarUrl,
    });
  }, [filteredNearbyProviders, resolveAvatarUrl, selectedService, t]);

  const selectedProviderOption = useMemo(
    () => providerOptions.find((provider) => provider.id === selectedProviderId) ?? null,
    [providerOptions, selectedProviderId]
  );

  const canUseDirectMode = providerOptions.length > 0;

  const {
    quickRequestingMarkerId,
    handleQuickRequest,
    handleProviderRequest,
    handleOpenRequest,
  } = useBrowseRequestHandlers({
    user,
    coords,
    setError,
    t,
    selectedService,
    selectedProviderId,
  });

  useEffect(() => {
    if (!selectedService) return;
    if (!canUseDirectMode) {
      setRequestMode('open');
    }
  }, [canUseDirectMode, selectedService]);

  return (
    <Layout navItems={CLIENT_NAV} title="Browse Services">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('clientBrowse.title')}</h1>
          <p className="page-subtitle">{t('clientBrowse.subtitle')}</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="card grid gap-6 lg:grid-cols-[1fr_384px]">
          <BrowseMapPanel
            t={t}
            coords={coords}
            refresh={refresh}
            filteredNearbyProvidersCount={filteredNearbyProviders.length}
            visibleProviderCount={visibleProviderCount}
            nearbyProviderMarkers={nearbyProviderMarkers}
            quickRequestingMarkerId={quickRequestingMarkerId}
            fitBoundsTrigger={fitBoundsTrigger}
            onQuickRequest={handleQuickRequest}
            onVisibleMarkerIdsChange={setVisibleMarkerIds}
            onViewAll={() => setFitBoundsTrigger((current) => current + 1)}
          />

          <BrowseRequestSidebar
            t={t}
            topLevelCategories={topLevelCategories}
            selectedRootCategory={selectedRootCategory}
            selectedService={selectedService}
            selectedServiceData={selectedServiceData}
            servicesForSelectedRoot={servicesForSelectedRoot}
            requestMode={requestMode}
            canUseDirectMode={canUseDirectMode}
            providerOptions={providerOptions}
            selectedProviderId={selectedProviderId}
            selectedProviderOption={selectedProviderOption}
            quickRequestingMarkerId={quickRequestingMarkerId}
            onRootCategoryChange={setSelectedRootCategory}
            onServiceChange={setSelectedService}
            onRequestModeChange={setRequestMode}
            onProviderSelect={setSelectedProviderId}
            onOpenRequest={handleOpenRequest}
            onProviderRequest={handleProviderRequest}
          />
        </div>
      )}
    </Layout>
  );
}
