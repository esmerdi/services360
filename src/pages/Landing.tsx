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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

export default function Landing() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [navigate, user]);

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
      { label: t('landing.stats.happyClients'), value: '10,000+' },
      { label: t('landing.stats.verifiedProviders'), value: '2,500+' },
      { label: t('landing.stats.serviceCategories'), value: '50+' },
      { label: t('landing.stats.citiesCovered'), value: '30+' },
    ],
    [t]
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

  if (user) return null;

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_right,_#e0f2fe_0%,_#f8fafc_35%,_#fefefe_100%)]">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute -left-28 top-24 h-64 w-64 rounded-full bg-cyan-200 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-100 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-100 blur-3xl" />
      </div>

      <header className="sticky top-0 z-[80] border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 flex items-center justify-center">
              <img src="/taskly-logo.svg" alt="Taskly logo" className="h-7 w-7 object-contain drop-shadow-[0_4px_8px_rgba(15,23,42,0.24)]" />
            </div>
            <span className="font-display text-xl tracking-tight text-slate-900">Taskly</span>
          </Link>
          <div className="relative z-[90] flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
            <LanguageSwitcher compact />
            <Link to="/login" className="btn-secondary text-sm px-4 py-2 text-center">
              {t('common.signIn')}
            </Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2 text-center">
              {t('landing.startToday')}
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-12 pt-16 md:px-6 md:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="reveal-up mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-sm text-sky-700 shadow-sm">
              <Zap className="h-3.5 w-3.5" />
              {t('landing.badge')}
            </div>
            <h1 className="reveal-up font-display text-4xl font-semibold leading-[1.03] tracking-tight text-slate-900 md:text-6xl">
              {t('landing.headline')}
            </h1>
            <p className="reveal-up mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
              {t('landing.description')}
            </p>
            <div className="reveal-up mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="btn-primary px-8 py-3 text-base shadow-lg shadow-sky-200/60"
              >
                {t('landing.findService')}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="btn-secondary border-slate-300 bg-white/90 px-8 py-3 text-base"
              >
                <Users className="h-4 w-4" />
                {t('landing.becomeProvider')}
              </Link>
            </div>
            <ul className="reveal-up mt-8 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              {checklistItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative reveal-up">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-3xl border border-slate-200 bg-white/80" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-100" />
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_80px_-30px_rgba(2,132,199,0.45)]">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('landing.liveDemandPulse')}</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="font-display text-2xl text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 p-4 text-white">
                <p className="text-sm font-medium">{t('landing.quickResponseTitle')}</p>
                <p className="mt-1 text-2xl font-semibold">{t('landing.quickResponseValue')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/80">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="grid gap-5 md:grid-cols-4">
            {features.map((f, i) => (
              <article
                key={f.title}
                className="reveal-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal-up text-center font-display text-3xl text-slate-900 md:text-4xl">
            {t('landing.howWorksTitle')}
          </h2>
          <p className="reveal-up mx-auto mt-3 max-w-2xl text-center text-slate-600">
            {t('landing.howWorksSubtitle')}
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((item, i) => (
              <div
                key={item.step}
                className="reveal-up rounded-3xl border border-slate-200 bg-white p-6"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <p className="font-display text-sm tracking-[0.18em] text-sky-600">{item.step}</p>
                <h3 className="mt-2 font-display text-xl text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_70px_-35px_rgba(15,23,42,0.4)] md:p-14">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{t('landing.startToday')}</p>
          <h2 className="mt-3 font-display text-3xl text-slate-900 md:text-4xl">
            {t('landing.ctaTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            {t('landing.ctaDescription')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="btn-primary px-8 py-3 text-base"
            >
              {t('common.createAccount')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3 text-base">{t('common.signIn')}</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-8 text-center text-sm text-slate-300">
        <p>© {new Date().getFullYear()} Taskly. {t('landing.footer')}</p>
      </footer>
    </div>
  );
}
