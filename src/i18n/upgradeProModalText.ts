export const UPGRADE_PRO_MODAL_TEXT = {
  es: {
    title: '¡Actualiza a PRO!',
    subtitle: 'Obtén acceso ilimitado y visibilidad mejorada',
    currentPlanLabel: 'Tu plan actual',
    comparePlan: 'Por solo $9.99 USD/mes',
    proceedButton: 'Ir al pago seguro',
    alreadyPro: 'Ya tienes plan PRO',
    paymentNotice: 'Tu plan se activará cuando Hotmart confirme el pago. Seguirás entrando con tu contraseña actual.',
    missingLink: 'Configura el enlace de Hotmart para continuar con el pago.',
    processingError: 'Error al procesar',
    includesTitle: 'Plan PRO incluye:',
    monthlySuffix: 'USD/mes',
    noCommitments: 'Sin compromisos. Cancela cuando quieras.',
    securityNotice: 'Pago seguro procesado por Hotmart. Tu información está protegida.',
    cancel: 'Cancelar',
    processing: 'Procesando...',
    freePlanQuota: '3 solicitudes por día / 90 por mes',
  },
  en: {
    title: 'Upgrade to PRO!',
    subtitle: 'Get unlimited access and improved visibility',
    currentPlanLabel: 'Your current plan',
    comparePlan: 'For only $9.99 USD/month',
    proceedButton: 'Go to secure payment',
    alreadyPro: 'You already have PRO plan',
    paymentNotice: 'Your plan will be activated once Hotmart confirms the payment. You will keep using your current password.',
    missingLink: 'Set the Hotmart link before continuing to checkout.',
    processingError: 'Error processing',
    includesTitle: 'PRO plan includes:',
    monthlySuffix: 'USD/mo',
    noCommitments: 'No commitments. Cancel anytime.',
    securityNotice: 'Secure payment processed by Hotmart. Your data is protected.',
    cancel: 'Cancel',
    processing: 'Processing...',
    freePlanQuota: '3 requests per day / 90 per month',
  },
} as const;

export const UPGRADE_PRO_FEATURES = {
  es: [
    'Solicitudes ilimitadas por mes',
    'Prioridad en búsquedas',
    'Perfil destacado',
    'Chat prioritario',
    'Sin comisión de la plataforma',
  ],
  en: [
    'Unlimited requests per month',
    'Priority in searches',
    'Featured profile',
    'Priority chat support',
    'No platform commission',
  ],
} as const;

export function getUpgradeProModalText(language: string) {
  return language === 'es' ? UPGRADE_PRO_MODAL_TEXT.es : UPGRADE_PRO_MODAL_TEXT.en;
}

export function getUpgradeProFeatures(language: string) {
  return language === 'es' ? UPGRADE_PRO_FEATURES.es : UPGRADE_PRO_FEATURES.en;
}
