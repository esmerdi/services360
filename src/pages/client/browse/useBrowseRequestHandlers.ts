import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocationMapMarker } from '../../../components/common/LocationMap';
import { createServiceRequest } from './utils';
import { formatClientQuotaError } from '../../../utils/quota';

type BrowseCoords = {
  latitude: number;
  longitude: number;
};

type UseBrowseRequestHandlersParams = {
  user: { id: string } | null;
  coords: BrowseCoords | null;
  setError: (message: string | null) => void;
  t: (key: string) => string;
  language: 'es' | 'en';
  selectedService: string | null;
  selectedProviderId: string | null;
};

export function useBrowseRequestHandlers({
  user,
  coords,
  setError,
  t,
  language,
  selectedService,
  selectedProviderId,
}: UseBrowseRequestHandlersParams) {
  const navigate = useNavigate();
  const [quickRequestingMarkerId, setQuickRequestingMarkerId] = useState<string | null>(null);

  const submitRequest = useCallback(async ({
    providerId,
    serviceId,
    loadingMarkerId,
  }: {
    providerId: string | null;
    serviceId: string;
    loadingMarkerId: string;
  }) => {
    if (!user || !coords) {
      setError(t('clientRequestService.locationRequiredError'));
      return;
    }

    setQuickRequestingMarkerId(loadingMarkerId);
    setError(null);

    const { error: requestError } = await createServiceRequest({
      clientId: user.id,
      providerId,
      serviceId,
      coords,
    });

    if (requestError) {
      setError(formatClientQuotaError(requestError.message, language));
      setQuickRequestingMarkerId(null);
      return;
    }

    setQuickRequestingMarkerId(null);
    navigate('/client/requests');
  }, [coords, language, navigate, setError, t, user]);

  const handleQuickRequest = useCallback(async (marker: LocationMapMarker) => {
    if (!marker.actionServiceId || !marker.actionProviderId) {
      setError(t('clientRequestService.locationRequiredError'));
      return;
    }

    await submitRequest({
      providerId: marker.actionProviderId,
      serviceId: marker.actionServiceId,
      loadingMarkerId: marker.id,
    });
  }, [setError, submitRequest, t]);

  const handleProviderRequest = useCallback(async () => {
    if (!selectedService || !selectedProviderId) {
      setError(t('clientRequestService.locationRequiredError'));
      return;
    }

    await submitRequest({
      providerId: selectedProviderId,
      serviceId: selectedService,
      loadingMarkerId: selectedProviderId,
    });
  }, [selectedProviderId, selectedService, setError, submitRequest, t]);

  const handleOpenRequest = useCallback(async () => {
    if (!selectedService) {
      setError(t('clientRequestService.locationRequiredError'));
      return;
    }

    await submitRequest({
      providerId: null,
      serviceId: selectedService,
      loadingMarkerId: 'open-request',
    });
  }, [selectedService, setError, submitRequest, t]);

  return {
    quickRequestingMarkerId,
    handleQuickRequest,
    handleProviderRequest,
    handleOpenRequest,
  };
}