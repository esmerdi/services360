import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Settings2, ChevronDown } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

interface LanguageSwitcherProps {
  compact?: boolean;
  mode?: 'buttons' | 'flag' | 'switch' | 'list';
}

export default function LanguageSwitcher({ compact = false, mode = 'buttons' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const current = language;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode !== 'list' || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode, open]);

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

  if (mode === 'list') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label={t('language.label')}
          title={t('language.label')}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Settings2 className="h-4 w-4" />
          <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>

        {open ? (
          <div className="absolute right-0 top-9 z-50 w-20 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg" role="menu" aria-label={t('language.label')}>
            <button
              type="button"
              className={clsx(
                'w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors',
                current === 'es' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              )}
              onClick={() => {
                setLanguage('es');
                setOpen(false);
              }}
              role="menuitem"
            >
              ES
            </button>
            <button
              type="button"
              className={clsx(
                'mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors',
                current === 'en' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              )}
              onClick={() => {
                setLanguage('en');
                setOpen(false);
              }}
              role="menuitem"
            >
              EN
            </button>
          </div>
        ) : null}
      </div>
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
