import type { RequestStatus } from '../types';

export type AppLanguage = 'en' | 'es';

interface RegionalFormat {
  locale: string;
  currency: string;
}

const REGIONAL_BY_LANGUAGE: Record<AppLanguage, RegionalFormat> = {
  en: { locale: 'en-US', currency: 'USD' },
  es: { locale: 'es-CO', currency: 'COP' },
};

export function getRegionalFormat(language: AppLanguage): RegionalFormat {
  return REGIONAL_BY_LANGUAGE[language];
}

export function formatDate(dateStr: string, language: AppLanguage = 'en'): string {
  const { locale } = getRegionalFormat(language);
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string, language: AppLanguage = 'en'): string {
  const { locale } = getRegionalFormat(language);
  return new Date(dateStr).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number | null, language: AppLanguage = 'en'): string {
  if (amount === null || amount === undefined) return '—';
  const { locale, currency } = getRegionalFormat(language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(amount);
}

export function formatTimeAgo(dateStr: string, language: AppLanguage = 'en'): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const locale = getRegionalFormat(language).locale;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (seconds < 60) return rtf.format(-seconds, 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
}

const PLAN_FEATURE_LABELS: Record<string, { en: string; es: string }> = {
  featured_in_search: { en: 'Featured in search', es: 'Destacado en busqueda' },
  max_requests_per_month: { en: 'Max requests per month', es: 'Maximo de solicitudes por mes' },
  profile_boost: { en: 'Profile boost', es: 'Impulso de perfil' },
  priority_support: { en: 'Priority support', es: 'Soporte prioritario' },
  instant_notifications: { en: 'Instant notifications', es: 'Notificaciones instantaneas' },
};

export function formatPlanFeature(featureKey: string, featureValue: unknown, language: AppLanguage): string {
  const label = PLAN_FEATURE_LABELS[featureKey]?.[language] ?? featureKey.replace(/_/g, ' ');

  if (featureValue === true) return label;
  if (featureValue === false) return '';
  if (featureValue === -1) return `${label}: ${language === 'es' ? 'ilimitado' : 'unlimited'}`;

  return `${label}: ${String(featureValue)}`;
}

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  accepted:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-800',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending:     'Pending',
  accepted:    'Accepted',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
