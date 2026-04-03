export const CLIENT_PAGES_TEXT = {
  es: {
    profile: {
      title: 'Mi perfil',
      subtitle: 'Gestiona tu información personal y foto de perfil.',
      accountDetails: 'Datos de la cuenta',
      accountHint: 'Mantén tu perfil actualizado para una mejor experiencia.',
    },
    myRequests: {
      filters: 'Filtros',
    },
    requestService: {
      freeQuotaTitle: 'Cupo actual de solicitudes (plan FREE)',
      nextResetLabel: 'Próximo reinicio',
      usedLabel: 'Usadas',
      inLabel: 'en',
      daySuffix: 'día(s)',
      remainingLabel: 'Restantes',
    },
  },
  en: {
    profile: {
      title: 'My profile',
      subtitle: 'Manage your personal information and profile photo.',
      accountDetails: 'Account details',
      accountHint: 'Keep your profile updated for a better experience.',
    },
    myRequests: {
      filters: 'Filters',
    },
    requestService: {
      freeQuotaTitle: 'Current request quota (FREE plan)',
      nextResetLabel: 'Next reset',
      usedLabel: 'Used',
      inLabel: 'in',
      daySuffix: 'day(s)',
      remainingLabel: 'Remaining',
    },
  },
} as const;

export function getClientPagesText(language: string) {
  return language === 'es' ? CLIENT_PAGES_TEXT.es : CLIENT_PAGES_TEXT.en;
}
