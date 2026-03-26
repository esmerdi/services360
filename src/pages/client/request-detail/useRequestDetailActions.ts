import { useCallback, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Rating, ServiceRequest } from '../../../types';

type Setter<T> = (value: T | ((current: T) => T)) => void;

type UseRequestDetailActionsParams = {
  request: ServiceRequest | null;
  userId: string | undefined;
  score: number;
  comment: string;
  t: (key: string) => string;
  setSavingRating: Setter<boolean>;
  setOpeningRequest: Setter<boolean>;
  setError: Setter<string | null>;
  setRating: Setter<Rating | null>;
  setRequest: Setter<ServiceRequest | null>;
  setSuccessMessage: Setter<string | null>;
};

export function useRequestDetailActions({
  request,
  userId,
  score,
  comment,
  t,
  setSavingRating,
  setOpeningRequest,
  setError,
  setRating,
  setRequest,
  setSuccessMessage,
}: UseRequestDetailActionsParams) {
  const submitRating = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!request || !request.provider_id || !userId) return;

    setSavingRating(true);
    const { data, error: ratingError } = await supabase
      .from('ratings')
      .insert({
        request_id: request.id,
        from_user_id: userId,
        to_user_id: request.provider_id,
        rating: score,
        comment: comment.trim() || null,
      })
      .select('*')
      .single();
    setSavingRating(false);

    if (ratingError) {
      setError(ratingError.message);
      return;
    }

    setRating(data as Rating);
  }, [comment, request, score, setError, setRating, setSavingRating, userId]);

  const switchToOpenRequest = useCallback(async () => {
    if (!request || !userId || !request.provider_id) return;

    setOpeningRequest(true);
    setError(null);
    setSuccessMessage(null);

    const { data, error: updateError } = await supabase
      .from('service_requests')
      .update({ provider_id: null, status: 'pending' })
      .eq('id', request.id)
      .eq('client_id', userId)
      .eq('status', 'pending')
      .eq('provider_id', request.provider_id)
      .select('id')
      .maybeSingle();

    setOpeningRequest(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (!data) {
      setError(t('clientRequestDetail.switchOpenUnavailable'));
      return;
    }

    setRequest((current) => (current ? { ...current, provider_id: null, provider: undefined } : current));
    setSuccessMessage(t('clientRequestDetail.switchOpenSuccess'));
  }, [request, setError, setOpeningRequest, setRequest, setSuccessMessage, t, userId]);

  return { submitRating, switchToOpenRequest };
}
