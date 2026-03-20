import React from 'react';
import clsx from 'clsx';
import { useI18n } from '../../context/I18nContext';

interface LanguageSwitcherProps {
  compact?: boolean;
  mode?: 'buttons' | 'flag' | 'switch';
}

export default function LanguageSwitcher({ compact = false, mode = 'buttons' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const current = language;

  if (mode === 'switch') {
    return (
      <div
        className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        aria-label={t('language.label')}
      >
        <button
          type="button"
          className={clsx(
            'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
            current === 'es' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          )}
          onClick={() => setLanguage('es')}
        >
          ES
        </button>
        <button
          type="button"
          className={clsx(
            'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
            current === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          )}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
      </div>
    );
  }

  if (mode === 'flag') {
    const nextLanguage = current === 'en' ? 'es' : 'en';
    const currentFlag = current === 'en' ? 'US' : 'ES';

    return (
      <button
        type="button"
        onClick={() => setLanguage(nextLanguage)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md"
        aria-label={t('language.label')}
        title={t('language.label')}
      >
        <span className="text-base leading-none" aria-hidden="true">{current === 'en' ? '🇺🇸' : '🇪🇸'}</span>
        <span className="text-xs tracking-[0.08em]">{currentFlag}</span>
      </button>
    );
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-lg border border-slate-200 bg-white p-1',
        compact ? 'gap-1' : 'gap-1.5'
      )}
      aria-label={t('language.label')}
    >
      <button
        type="button"
        className={clsx(
          'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
          current === 'es' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        )}
        onClick={() => setLanguage('es')}
      >
        {t('language.spanish')}
      </button>
      <button
        type="button"
        className={clsx(
          'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
          current === 'en' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        )}
        onClick={() => setLanguage('en')}
      >
        {t('language.english')}
      </button>
    </div>
  );
}
