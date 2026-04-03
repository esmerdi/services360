export const PROVIDER_MY_JOBS_PAGE_TEXT = {
  es: {
    total: 'Total',
    activeFilter: 'Filtro activo',
    all: 'Todos',
  },
  en: {
    total: 'Total',
    activeFilter: 'Active filter',
    all: 'All',
  },
} as const;

export function getProviderMyJobsPageText(language: string) {
  return language === 'es' ? PROVIDER_MY_JOBS_PAGE_TEXT.es : PROVIDER_MY_JOBS_PAGE_TEXT.en;
}
