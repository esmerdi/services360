import type { SubscriptionStatus } from '../types';

export const PROVIDER_SUBSCRIPTION_TEXT = {
  es: {
    title: 'Suscripción',
    subtitle: 'Elige el plan ideal para tus solicitudes mensuales.',
    currentPlan: 'Plan actual',
    plan: 'Plan',
    status: 'Estado',
    unknown: 'Desconocido',
    quotaReset: 'Renovación del cupo',
    ends: 'Finaliza',
    noEndDate: 'Sin fecha de fin',
    periodUsage: 'Consumo del período',
    unlimitedUsage: 'Tu plan actual tiene solicitudes ilimitadas.',
    used: 'Usadas',
    remaining: 'Restantes',
    nextReset: 'Próximo reinicio',
    noDate: 'Sin fecha',
    limitPrefix: 'Límite',
    per: 'por',
    days: 'días',
    current: 'Actual',
    free: 'Gratis',
    noExpiration: 'sin caducidad',
    monthShort: 'mes',
    selected: 'Seleccionado',
    chooseFreePlan: 'Elegir plan gratis',
    goToProCheckout: 'Ir al pago de plan PRO',
  },
  en: {
    title: 'Subscription',
    subtitle: 'Pick the plan that fits your monthly requests.',
    currentPlan: 'Current plan',
    plan: 'Plan',
    status: 'Status',
    unknown: 'Unknown',
    quotaReset: 'Quota reset',
    ends: 'Ends',
    noEndDate: 'No end date',
    periodUsage: 'Current period usage',
    unlimitedUsage: 'Your current plan has unlimited requests.',
    used: 'Used',
    remaining: 'Remaining',
    nextReset: 'Next reset',
    noDate: 'No date',
    limitPrefix: 'Limit',
    per: 'per',
    days: 'days',
    current: 'Current',
    free: 'Free',
    noExpiration: 'no expiration',
    monthShort: 'mo',
    selected: 'Selected',
    chooseFreePlan: 'Choose free plan',
    goToProCheckout: 'Go to PRO checkout',
  },
} as const;

export function getProviderSubscriptionText(language: string) {
  return language === 'es' ? PROVIDER_SUBSCRIPTION_TEXT.es : PROVIDER_SUBSCRIPTION_TEXT.en;
}

export function getSubscriptionStatusLabelMap(language: string): Record<SubscriptionStatus, string> {
  if (language === 'es') {
    return {
      active: 'Activo',
      cancelled: 'Cancelado',
      trial: 'Prueba',
    };
  }

  return {
    active: 'Active',
    cancelled: 'Cancelled',
    trial: 'Trial',
  };
}
