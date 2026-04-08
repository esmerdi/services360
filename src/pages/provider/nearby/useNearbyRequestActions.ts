import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { NearbyRequest } from './types';

type Setter<T> = (value: T | ((current: T) => T)) => void;

type UseNearbyRequestActionsParams = {
  userId: string | undefined;
  es: boolean;
  requests: NearbyRequest[];
  setRequests: Setter<NearbyRequest[]>;
  setError: Setter<string | null>;
  setSuccessMessage: Setter<string | null>;
  setInfoMessage: Setter<string | null>;
  setActingId: Setter<string | null>;
  onAcceptedRedirect: () => void;
};

export function useNearbyRequestActions({
  userId,
  es,
  requests,
  setRequests,
  setError,
  setSuccessMessage,
  setInfoMessage,
  setActingId,
  onAcceptedRedirect,
}: UseNearbyRequestActionsParams) {
  const sendWelcomeMessage = useCallback(async (requestId: string, clientName: string) => {
    if (!userId) return;

    const { data: existingMessage, error: existingMessageError } = await supabase
      .from('messages')
      .select('id')
      .eq('request_id', requestId)
      .eq('sender_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingMessageError) {
      console.error('Error checking welcome message:', existingMessageError.message);
      return;
    }

    if (existingMessage) return;

    const content = es
      ? `Hola, ${clientName} es un gusto atenderte. ¿En qué te puedo colaborar?`
      : `Hi ${clientName}, it is a pleasure to help you. How can I assist you?`;

    const { error: insertMessageError } = await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: userId,
      content,
    });

    if (insertMessageError) {
      console.error('Error sending welcome message:', insertMessageError.message);
    }
  }, [es, userId]);

  const acceptRequest = useCallback(async (requestId: string, redirectToJobs = false) => {
    if (!userId) return;

    const currentRequest = requests.find((request) => request.id === requestId);
    const clientName = currentRequest?.client?.full_name || currentRequest?.client?.email || (es ? 'cliente' : 'client');

    setError(null);
    setSuccessMessage(null);
    setInfoMessage(null);
    setActingId(requestId);

    const { error: updateError } = await supabase
      .from('service_requests')
      .update({ provider_id: userId, status: 'accepted' })
      .eq('id', requestId)
      .eq('status', 'pending')
      .or(`provider_id.is.null,provider_id.eq.${userId}`);

    if (updateError) {
      setActingId(null);
      if (updateError.message.includes('FREE plan request quota reached')) {
        setError(
          es
            ? 'Alcanzaste el límite de 3 solicitudes por día del plan FREE. Además, el plan FREE vence a los 30 días. Espera al próximo reinicio del cupo o actualiza a PRO.'
            : 'You reached the FREE plan limit of 3 requests per day. Also, the FREE plan expires after 30 days. Wait for the next quota reset or upgrade to PRO.'
        );
      } else {
        setError(updateError.message);
      }
      return;
    }

    const { data: acceptedRequest, error: acceptedRequestError } = await supabase
      .from('service_requests')
      .select('id')
      .eq('id', requestId)
      .eq('provider_id', userId)
      .eq('status', 'accepted')
      .maybeSingle();

    setActingId(null);

    if (acceptedRequestError) {
      setError(acceptedRequestError.message);
      return;
    }

    if (!acceptedRequest) {
      const { data: latestRequest, error: latestRequestError } = await supabase
        .from('service_requests')
        .select('id, status, provider_id')
        .eq('id', requestId)
        .maybeSingle();

      if (latestRequestError) {
        setError(latestRequestError.message);
        return;
      }

      if (latestRequest && latestRequest.status === 'pending' && latestRequest.provider_id === userId) {
        const { error: confirmError } = await supabase
          .from('service_requests')
          .update({ status: 'accepted' })
          .eq('id', requestId)
          .eq('provider_id', userId)
          .eq('status', 'pending');

        if (confirmError) {
          setError(confirmError.message);
          return;
        }

        const { data: confirmedRequest, error: confirmedRequestError } = await supabase
          .from('service_requests')
          .select('id')
          .eq('id', requestId)
          .eq('provider_id', userId)
          .eq('status', 'accepted')
          .maybeSingle();

        if (confirmedRequestError) {
          setError(confirmedRequestError.message);
          return;
        }

        if (confirmedRequest) {
          await sendWelcomeMessage(requestId, clientName);
          setRequests((current) => current.filter((request) => request.id !== requestId));
          setSuccessMessage(es ? 'Solicitud aceptada correctamente.' : 'Request accepted successfully.');

          if (redirectToJobs) {
            window.setTimeout(() => onAcceptedRedirect(), 900);
          }
          return;
        }
      }

      if (!latestRequest || latestRequest.status !== 'pending' || (latestRequest.provider_id && latestRequest.provider_id !== userId)) {
        setRequests((current) => current.filter((request) => request.id !== requestId));
        setError(es ? 'La solicitud ya fue tomada o dejó de estar disponible.' : 'This request was already taken or is no longer available.');
        return;
      }

      setError(es ? 'No tienes permiso para aceptar esta solicitud.' : 'You do not have permission to accept this request.');
      return;
    }

    await sendWelcomeMessage(requestId, clientName);
    setRequests((current) => current.filter((request) => request.id !== requestId));
    setSuccessMessage(es ? 'Solicitud aceptada correctamente.' : 'Request accepted successfully.');

    if (redirectToJobs) {
      window.setTimeout(() => onAcceptedRedirect(), 900);
    }
  }, [es, onAcceptedRedirect, requests, sendWelcomeMessage, setActingId, setError, setInfoMessage, setRequests, setSuccessMessage, userId]);

  return { acceptRequest };
}
