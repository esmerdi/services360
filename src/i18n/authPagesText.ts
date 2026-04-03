export const AUTH_PAGES_TEXT = {
  es: {
    login: {
      badge: 'Ingreso rápido y seguro',
      supportingCopy: 'Gestiona solicitudes, mensajes y seguimiento en un solo panel.',
      trustPoints: [
        'Acceso seguro y cifrado.',
        'Perfiles verificados en la plataforma.',
        'Soporte para clientes y proveedores.',
      ],
      backHome: 'Volver al inicio',
    },
    register: {
      badge: 'Tu cuenta en pocos pasos',
      supportingCopy: 'Elige tu perfil y comienza a usar ZippyGo con experiencia completa.',
      onboardingPoints: [
        'Proceso de registro en menos de 2 minutos.',
        'Perfil listo para solicitar o ofrecer servicios.',
        'Datos protegidos con seguridad de plataforma.',
      ],
      backHome: 'Volver al inicio',
    },
  },
  en: {
    login: {
      badge: 'Fast and secure sign-in',
      supportingCopy: 'Manage requests, messages, and tracking from one dashboard.',
      trustPoints: [
        'Secure and encrypted access.',
        'Verified profiles across the platform.',
        'Support for clients and providers.',
      ],
      backHome: 'Back to home',
    },
    register: {
      badge: 'Your account in a few steps',
      supportingCopy: 'Choose your profile and start using ZippyGo with the full experience.',
      onboardingPoints: [
        'Sign up in under 2 minutes.',
        'Profile ready to request or offer services.',
        'Your data is protected with platform security.',
      ],
      backHome: 'Back to home',
    },
  },
} as const;

export function getAuthPagesText(language: string) {
  return language === 'es' ? AUTH_PAGES_TEXT.es : AUTH_PAGES_TEXT.en;
}
