export const LANDING_PAGE_TEXT = {
  es: {
    whyChoose: 'Por qué elegir ZippyGo',
    aboutLabel: 'Qué es ZippyGo',
    aboutTitle: 'Una forma rápida y confiable de resolver servicios en tu día a día.',
    aboutReadMore: 'Leer más',
    aboutReadLess: 'Leer menos',
    aboutParagraph1:
      'ZippyGo es una plataforma digital que conecta personas con proveedores de servicios de manera rápida, segura y eficiente. Desde la app puedes solicitar plomería, electricidad, limpieza, mantenimiento del hogar y más en cuestión de minutos.',
    aboutParagraph2:
      'Su sistema inteligente recomienda profesionales verificados, para que ahorres tiempo y encuentres soluciones confiables sin complicaciones. Además, puedes gestionar solicitudes, agendar servicios y dar seguimiento en tiempo real desde un solo lugar.',
    freeNoExpiration: '/ 30 días',
    proPerMonth: 'mes',
    trialIntro: 'Vigencia de 30 días desde la activación del plan.',
    trialFeatureDay: '3 solicitudes por día',
    trialFeatureMonth: '90 solicitudes por mes',
  },
  en: {
    whyChoose: 'Why choose ZippyGo',
    aboutLabel: 'What is ZippyGo',
    aboutTitle: 'A faster, safer way to solve everyday service needs.',
    aboutReadMore: 'Read more',
    aboutReadLess: 'Read less',
    aboutParagraph1:
      'ZippyGo is a digital platform that connects people with service providers quickly, safely, and efficiently. Through the app, users can request plumbing, electrical work, cleaning, home maintenance, and more in just minutes.',
    aboutParagraph2:
      'Its smart matching system recommends verified professionals so users save time and get reliable solutions without friction. You can also manage requests, schedule services, and track progress in real time from one place.',
    freeNoExpiration: '/ 30 days',
    proPerMonth: 'month',
    trialIntro: 'Valid for 30 days from plan activation.',
    trialFeatureDay: '3 requests per day',
    trialFeatureMonth: '90 requests per month',
  },
} as const;

export function getLandingPageText(language: string) {
  return language === 'es' ? LANDING_PAGE_TEXT.es : LANDING_PAGE_TEXT.en;
}
