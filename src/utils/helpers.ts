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
  trial_days: { en: 'Trial period (days)', es: 'Periodo de prueba (días)' },
  no_expiration: { en: 'No expiration', es: 'Sin caducación' },
  request_window_days: { en: 'Request window (days)', es: 'Período de solicitudes (días)' },
  featured_in_search: { en: 'Featured in search', es: 'Destacado en búsqueda' },
  max_requests_per_month: { en: 'Max requests per 30-day period', es: 'Máximo de solicitudes por período de 30 días' },
  profile_boost: { en: 'Profile boost', es: 'Impulso de perfil' },
  priority_support: { en: 'Email support', es: 'Soporte por correo electrónico' },
  instant_notifications: { en: 'Timely notifications', es: 'Notificaciones oportunas' },
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

export function isManagedAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const normalized = url.trim().toLowerCase();
  if (!normalized) return false;

  // Local previews should render as image while editing profile.
  if (normalized.startsWith('data:image/') || normalized.startsWith('blob:')) {
    return true;
  }

  return extractManagedAvatarPath(url) !== null;
}

export function extractManagedAvatarPath(url: string | null | undefined): string | null {
  if (!url) return null;

  const normalized = url.trim();
  if (!normalized) return null;

  if (normalized.startsWith('data:image/') || normalized.startsWith('blob:')) {
    return null;
  }

  const lowerUrl = normalized.toLowerCase();
  const markers = [
    '/storage/v1/object/public/avatars/',
    '/storage/v1/object/sign/avatars/',
    '/storage/v1/object/authenticated/avatars/',
    '/storage/v1/render/image/public/avatars/',
  ];

  for (const marker of markers) {
    const markerIndex = lowerUrl.indexOf(marker);
    if (markerIndex >= 0) {
      const pathStart = markerIndex + marker.length;
      const pathWithQuery = normalized.slice(pathStart);
      const queryIndex = pathWithQuery.indexOf('?');
      return queryIndex >= 0 ? pathWithQuery.slice(0, queryIndex) : pathWithQuery;
    }
  }

  if (lowerUrl.startsWith('avatars/')) {
    return normalized.slice('avatars/'.length);
  }

  // Support storing just the object path, e.g. userId/avatar.png.
  if (!lowerUrl.includes('://') && !lowerUrl.startsWith('/')) {
    return normalized;
  }

  return null;
}
