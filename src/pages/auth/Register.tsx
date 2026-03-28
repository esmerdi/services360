import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import type { UserRole } from '../../types';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function Register() {
  const { signUp, signIn, user } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const es = language === 'es';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles: { value: UserRole; label: string; description: string }[] = React.useMemo(
    () => [
      {
        value: 'client',
        label: t('register.roleClientLabel'),
        description: t('register.roleClientDescription'),
      },
      {
        value: 'provider',
        label: t('register.roleProviderLabel'),
        description: t('register.roleProviderDescription'),
      },
    ],
    [t]
  );

  const onboardingPoints = React.useMemo(
    () => [
      es ? 'Proceso de registro en menos de 2 minutos.' : 'Sign up in under 2 minutes.',
      es ? 'Perfil listo para solicitar o ofrecer servicios.' : 'Profile ready to request or offer services.',
      es ? 'Datos protegidos con seguridad de plataforma.' : 'Your data is protected with platform security.',
    ],
    [es]
  );

  React.useEffect(() => {
    if (user) navigate(`/${user.role}`, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, role, fullName);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('register.registrationFailed');
      const alreadyRegistered = message.toLowerCase().includes('already registered');

      if (alreadyRegistered) {
        try {
          await signIn(email, password, role);
          navigate(`/${role}`, { replace: true });
        } catch (signInErr) {
          setError(signInErr instanceof Error ? signInErr.message : t('login.signInFailed'));
        }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_#e0f2fe_0%,_#f8fafc_38%,_#ffffff_100%)] px-4 py-8 md:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-14 h-60 w-60 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-100 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <aside className="reveal-up hidden rounded-2xl border border-slate-200/90 bg-white/85 p-7 shadow-[0_20px_70px_-35px_rgba(2,132,199,0.45)] backdrop-blur-sm lg:flex lg:flex-col">
            <div className="flex items-center justify-between">
              <Link to="/" className="inline-flex items-center gap-2" aria-label="ZippyGo inicio">
                <div className="flex h-10 w-10 items-center justify-center">
                  <img src="/zippy-logo.png?v=2" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                </div>
                <span className="font-display text-2xl text-slate-900">
                  Zippy<span className="font-bold">Go</span>
                </span>
              </Link>
              <LanguageSwitcher mode="switch" />
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {es ? 'Tu cuenta en pocos pasos' : 'Your account in a few steps'}
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{t('register.subtitle')}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {es
                  ? 'Elige tu perfil y comienza a usar ZippyGo con experiencia completa.'
                  : 'Choose your profile and start using ZippyGo with the full experience.'}
              </p>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {onboardingPoints.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <Link to="/" className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {es ? 'Volver al inicio' : 'Back to home'}
            </Link>
          </aside>

          <div className="reveal-up w-full rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_25px_70px_-35px_rgba(2,132,199,0.45)] backdrop-blur-sm sm:p-6 md:p-7">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2" aria-label="ZippyGo inicio">
                <div className="flex h-9 w-9 items-center justify-center">
                  <img src="/zippy-logo.png?v=2" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                </div>
                <span className="font-display text-xl text-slate-900">
                  Zippy<span className="font-bold">Go</span>
                </span>
              </Link>
              <LanguageSwitcher compact />
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{t('register.submit')}</h1>
              <p className="mt-1 text-sm text-slate-600">{t('register.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <ErrorMessage message={error} />}

              <div className="form-group">
                <label className="label">{t('register.iam')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        role === r.value
                          ? 'border-sky-300 bg-sky-50/90 ring-2 ring-sky-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="fullName" className="label">{t('register.fullNameLabel')}</label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="input"
                  placeholder={t('register.fullNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="label">{t('register.emailLabel')}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder={t('register.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="label">{t('register.passwordLabel')}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="input pr-10"
                    placeholder={t('register.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary mt-2 w-full" disabled={loading}>
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {t('register.submit')}
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {t('register.alreadyAccount')}{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                {t('register.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
