export const LANDING_PAGE_TEXT = {
  es: {
    whyChoose: 'Por qué elegir ZippyGo',
    freeNoExpiration: 'sin caducación',
    proPerMonth: 'mes',
    trialIntro: 'Incluye 3 solicitudes por día y hasta 90 solicitudes por mes.',
    trialFeatureDay: '3 solicitudes por día',
    trialFeatureMonth: '90 solicitudes por mes',
  },
  en: {
    whyChoose: 'Why choose ZippyGo',
    freeNoExpiration: 'without expiration',
    proPerMonth: 'month',
    trialIntro: 'Includes 3 requests per day and up to 90 requests per month.',
    trialFeatureDay: '3 requests per day',
    trialFeatureMonth: '90 requests per month',
  },
} as const;

export function getLandingPageText(language: string) {
  return language === 'es' ? LANDING_PAGE_TEXT.es : LANDING_PAGE_TEXT.en;
}
