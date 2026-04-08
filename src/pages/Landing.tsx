import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Navigation,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { getLandingPageText } from '../i18n/landingPageText';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { supabase } from '../lib/supabase';

type LandingStats = {
  total_clients: number;
  total_providers: number;
  total_categories: number;
  total_cities: number;
};

type LandingPlan = {
  name: 'FREE' | 'PRO';
  price: number;
  features: Record<string, unknown> | null;
};

export default function Landing() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const text = getLandingPageText(language);
  const navigate = useNavigate();
  const [landingStats, setLandingStats] = React.useState<LandingStats | null>(null);
  const [landingPlans, setLandingPlans] = React.useState<LandingPlan[]>([]);
  const [planTab, setPlanTab] = React.useState<'providers' | 'clients'>('providers');
  const [aboutExpanded, setAboutExpanded] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [navigate, user]);

  React.useEffect(() => {
    let mounted = true;

    const loadLandingStats = async () => {
      const [{ data: statsData, error: statsError }, { data: plansData, error: plansError }] = await Promise.all([
        supabase.rpc('public_landing_stats').single(),
        supabase
          .from('plans')
          .select('name, price, features')
          .in('name', ['FREE', 'PRO'])
          .order('price', { ascending: true }),
      ]);

      if (!statsError && statsData && mounted) {
        const parsed = statsData as Partial<LandingStats>;
        if (
          typeof parsed.total_clients === 'number' &&
          typeof parsed.total_providers === 'number' &&
          typeof parsed.total_categories === 'number' &&
          typeof parsed.total_cities === 'number'
        ) {
          setLandingStats(parsed as LandingStats);
        }
      }

      if (!plansError && plansData && mounted) {
        setLandingPlans((plansData as LandingPlan[]) ?? []);
      }
    };

    void loadLandingStats();

    return () => {
      mounted = false;
    };
  }, []);

  const formatCount = React.useCallback((value: number) => new Intl.NumberFormat().format(value), []);
  const formatAmount = React.useCallback(
    (value: number) => {
      const locale = language === 'es' ? 'es-419' : 'en-US';
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(value);
    },
    [language]
  );
  const getStatValue = React.useCallback(
    (value: number, fallbackKey: string) => {
      if (!landingStats) return t(fallbackKey);
      if (value <= 0) return t('landing.stats.notAvailable');
      return formatCount(value);
    },
    [formatCount, landingStats, t]
  );

  const features = React.useMemo(
    () => [
      {
        icon: MapPin,
        title: t('landing.features.proximity.title'),
        description: t('landing.features.proximity.description'),
      },
      {
        icon: Shield,
        title: t('landing.features.verified.title'),
        description: t('landing.features.verified.description'),
      },
      {
        icon: Star,
        title: t('landing.features.ratings.title'),
        description: t('landing.features.ratings.description'),
      },
      {
        icon: Zap,
        title: t('landing.features.fastResponse.title'),
        description: t('landing.features.fastResponse.description'),
      },
    ],
    [t]
  );

  const stats = React.useMemo(
    () => [
      {
        label: t('landing.stats.happyClients'),
        value: getStatValue(landingStats?.total_clients ?? 0, 'landing.stats.happyClientsValue'),
      },
      {
        label: t('landing.stats.verifiedProviders'),
        value: getStatValue(landingStats?.total_providers ?? 0, 'landing.stats.verifiedProvidersValue'),
      },
      {
        label: t('landing.stats.serviceCategories'),
        value: getStatValue(landingStats?.total_categories ?? 0, 'landing.stats.serviceCategoriesValue'),
      },
      {
        label: t('landing.stats.citiesCovered'),
        value: getStatValue(landingStats?.total_cities ?? 0, 'landing.stats.citiesCoveredValue'),
      },
    ],
    [getStatValue, landingStats, t]
  );

  const checklistItems = React.useMemo(
    () => [
      t('landing.checklist.noCard'),
      t('landing.checklist.verifiedCommunity'),
      t('landing.checklist.securePlatform'),
      t('landing.checklist.liveUpdates'),
    ],
    [t]
  );

  const steps = React.useMemo(
    () => [
      {
        step: '01',
        title: t('landing.steps.browse.title'),
        desc: t('landing.steps.browse.desc'),
      },
      {
        step: '02',
        title: t('landing.steps.send.title'),
        desc: t('landing.steps.send.desc'),
      },
      {
        step: '03',
        title: t('landing.steps.matched.title'),
        desc: t('landing.steps.matched.desc'),
      },
    ],
    [t]
  );

  const freePlan = React.useMemo(
    () => landingPlans.find((plan) => plan.name === 'FREE') ?? null,
    [landingPlans]
  );

  const proPlan = React.useMemo(
    () => landingPlans.find((plan) => plan.name === 'PRO') ?? null,
    [landingPlans]
  );

  const freePlanQuota = React.useMemo(() => {
    const features = (freePlan?.features ?? {}) as Record<string, unknown>;
    const maxRequestsRaw = features.max_requests_per_month;
    const windowDaysRaw = features.request_window_days;

    const maxRequests = typeof maxRequestsRaw === 'number'
      ? maxRequestsRaw
      : typeof maxRequestsRaw === 'string'
        ? Number(maxRequestsRaw)
        : 3;

    const windowDays = typeof windowDaysRaw === 'number'
      ? windowDaysRaw
      : typeof windowDaysRaw === 'string'
        ? Number(windowDaysRaw)
        : 1;

    const safeMaxRequests = Number.isFinite(maxRequests) ? maxRequests : 3;
    const safeWindowDays = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 1;
    const monthlyEquivalent = Math.round((safeMaxRequests / safeWindowDays) * 30);

    return {
      maxRequests: safeMaxRequests,
      windowDays: safeWindowDays,
      monthlyEquivalent,
    };
  }, [freePlan?.features]);

  if (user) return null;

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_#f8fafc_40%,_#ffffff_100%)]">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-50">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-200 blur-3xl" />
        <div className="absolute -top-10 right-0 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-amber-100 blur-3xl" />
      </div>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[80] border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="ZippyGo inicio">
            <div className="flex h-8 w-8 items-center justify-center">
              <img src="/zippy-logo.png?v=2" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-slate-900">
              Zippy<span className="text-sky-600">Go</span>
            </span>
          </Link>

          <nav className="relative z-[90] flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3">
            <Link to="/login" className="btn-secondary px-4 text-sm text-center whitespace-nowrap">
              {t('common.signIn')}
            </Link>
            <Link to="/register" className="btn-primary px-4 text-sm text-center whitespace-nowrap">
              {t('landing.startToday')}
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl justify-end px-4 pt-3 md:px-6">
        <LanguageSwitcher mode="switch" />
      </div>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="px-4 pb-16 pt-14 md:px-6 md:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left copy */}
          <div>
            {/* Pill badge */}
            <div className="reveal-up mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3.5 py-1.5 text-sm font-medium text-sky-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('landing.badge')}
            </div>

            <h1 className="reveal-up font-display text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 md:text-5xl xl:text-6xl">
              {t('landing.headline')}
            </h1>
            <p className="reveal-up mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
              {t('landing.description')}
            </p>

            {/* Launch notice */}
            <div className="reveal-up mt-4 inline-flex max-w-xl items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('landing.launchNotice')}
            </div>

            {/* CTA row */}
            <div className="reveal-up mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary px-7 py-2.5 text-base shadow-md shadow-sky-200/60">
                {t('landing.findService')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/register" className="btn-secondary px-7 py-2.5 text-base">
                <Users className="h-4 w-4" aria-hidden="true" />
                {t('landing.becomeProvider')}
              </Link>
            </div>

            {/* Checklist */}
            <ul className="reveal-up mt-7 grid gap-y-2 text-sm text-slate-600 sm:grid-cols-2">
              {checklistItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="reveal-up mt-3 text-sm text-slate-500">{t('landing.launchSecondary')}</p>
          </div>

          {/* Right stats card */}
          <div className="reveal-up relative">
            {/* Decorative accents */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-amber-100" />

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_60px_-20px_rgba(2,132,199,0.35)]">
              {/* Header strip */}
              <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t('landing.liveDemandPulse')}
                </p>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3 p-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <p className="text-xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick response banner */}
              <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 p-4 text-white">
                <div className="flex items-center gap-2 text-sky-100">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <p className="text-xs font-medium">{t('landing.quickResponseTitle')}</p>
                </div>
                <p className="mt-1 text-2xl font-semibold">{t('landing.quickResponseValue')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────── */}
      <section className="px-4 pb-10 md:px-6 md:pb-12">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.45)] md:p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {text.aboutLabel}
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            {text.aboutTitle}
          </h2>

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 md:text-base">
            <p>{text.aboutParagraph1}</p>
            <p className={aboutExpanded ? 'block' : 'hidden md:block'}>{text.aboutParagraph2}</p>
            <button
              type="button"
              onClick={() => setAboutExpanded((current) => !current)}
              className="text-sm font-medium text-sky-700 hover:text-sky-800 md:hidden"
            >
              {aboutExpanded ? text.aboutReadLess : text.aboutReadMore}
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section className="border-y border-slate-200/70 bg-white/90">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          {/* Section label */}
          <div className="mb-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {text.whyChoose}
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {features.map((f, i) => (
              <article
                key={f.title}
                className="reveal-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center">
            <h2 className="reveal-up text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              {t('landing.howWorksTitle')}
            </h2>
            <p className="reveal-up mx-auto mt-2 max-w-xl text-sm text-slate-600 md:text-base">
              {t('landing.howWorksSubtitle')}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((item, i) => (
              <div
                key={item.step}
                className="reveal-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Step number chip */}
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-600">
                  {item.step}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ──────────────────────────────────────────────── */}
      <section id="plans" className="border-y border-slate-200/70 bg-white/90 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center">
            <h2 className="reveal-up text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              {t('landing.plansTitle')}
            </h2>
            <p className="reveal-up mx-auto mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              {t('landing.plansSubtitle')}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="reveal-up mt-6 flex items-center justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setPlanTab('providers')}
                className={
                  planTab === 'providers'
                    ? 'rounded-lg bg-white px-5 py-2 text-sm font-medium text-slate-900 shadow-sm'
                    : 'rounded-lg px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700'
                }
              >
                {t('landing.plansProvidersTab')}
              </button>
              <button
                type="button"
                onClick={() => setPlanTab('clients')}
                className={
                  planTab === 'clients'
                    ? 'rounded-lg bg-white px-5 py-2 text-sm font-medium text-slate-900 shadow-sm'
                    : 'rounded-lg px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700'
                }
              >
                {t('landing.plansClientsTab')}
              </button>
            </div>
          </div>

          {planTab === 'providers' ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Trial */}
              <article className="reveal-up rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {t('landing.planTrialLabel')}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {freePlan ? `${formatAmount(freePlan.price)} USD ${text.freeNoExpiration}` : t('landing.planTrialPrice')}
                </p>
                <p className="mt-1.5 text-sm text-slate-600">
                  {text.trialIntro}
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    text.trialFeatureDay,
                    text.trialFeatureMonth,
                    t('landing.planTrialFeatureMap'),
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link to="/register" className="btn-secondary w-full py-2 text-center text-sm">
                    {t('landing.startToday')}
                  </Link>
                </div>
              </article>

              {/* Pro */}
              <article className="reveal-up relative overflow-hidden rounded-xl border border-sky-300 bg-gradient-to-br from-sky-50 to-cyan-50/60 p-6 shadow-sm">
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sky-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Pro
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600">
                  {t('landing.planProLabel')}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {proPlan ? `${formatAmount(proPlan.price)} USD / ${text.proPerMonth}` : t('landing.planProPrice')}
                </p>
                <p className="mt-1.5 text-sm text-slate-600">{t('landing.planProDescription')}</p>
                <ul className="mt-5 space-y-2">
                  {[
                    t('landing.planProFeatureRequests'),
                    t('landing.planProFeatureSearch'),
                    t('landing.planProFeaturePriority'),
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link to="/register" className="btn-primary w-full py-2 text-center text-sm">
                    {t('landing.startToday')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </div>
          ) : (
            <div className="reveal-up mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{t('landing.planClientTitle')}</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{t('landing.planClientDescription')}</p>
              <div className="mt-6">
                <Link to="/register" className="btn-primary inline-flex px-8 py-2.5 text-sm">
                  {t('landing.findService')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_60px_-20px_rgba(15,23,42,0.25)]">
          {/* Top gradient strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600" />

          <div className="px-8 py-10 text-center md:px-14 md:py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Navigation className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {t('landing.startToday')}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 md:text-base">
              {t('landing.ctaDescription')}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className="btn-primary px-8 py-2.5 text-base">
                {t('common.createAccount')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn-secondary px-8 py-2.5 text-base">
                {t('common.signIn')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/zippy-logo.png?v=2" alt="" aria-hidden="true" className="h-5 w-5 object-contain opacity-60" />
            <span className="font-medium text-slate-300">ZippyGo</span>
          </div>
          <p>© {new Date().getFullYear()} ZippyGo. {t('landing.footer')}</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/login" className="hover:text-slate-200 transition-colors">{t('common.signIn')}</Link>
            <Link to="/register" className="hover:text-slate-200 transition-colors">{t('common.createAccount')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
