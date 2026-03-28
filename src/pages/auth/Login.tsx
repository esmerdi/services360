import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LogIn, MailWarning, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function Login() {
  const { signIn, user } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const es = language === 'es';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const trustPoints = React.useMemo(
    () => [
      es ? 'Acceso seguro y cifrado.' : 'Secure and encrypted access.',
      es ? 'Perfiles verificados en la plataforma.' : 'Verified profiles across the platform.',
      es ? 'Soporte para clientes y proveedores.' : 'Support for clients and providers.',
    ],
    [es]
  );

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) navigate(`/${user.role}`, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      await signIn(email, password);
      // Navigation is handled by the useEffect above after user is set
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('login.signInFailed');
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
        setUnverifiedEmail(email);
        setError(null);
      } else {
        setError(msg);
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
                {es ? 'Ingreso rápido y seguro' : 'Fast and secure sign-in'}
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{t('login.subtitle')}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {es
                  ? 'Gestiona solicitudes, mensajes y seguimiento en un solo panel.'
                  : 'Manage requests, messages, and tracking from one dashboard.'}
              </p>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {trustPoints.map((item) => (
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
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{t('login.submit')}</h1>
              <p className="mt-1 text-sm text-slate-600">{t('login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <ErrorMessage message={error} />}

              {unverifiedEmail && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">{t('login.emailNotConfirmed')}</p>
                    <p className="mt-0.5 text-amber-700">
                      {t('login.emailNotConfirmedDesc')}{' '}
                      <Link
                        to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                        className="font-semibold underline"
                      >
                        {t('login.verifyNow')}
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="label">{t('login.emailLabel')}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="label">{t('login.passwordLabel')}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input pr-10"
                    placeholder="••••••••"
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
                    <LogIn className="h-4 w-4" />
                    {t('login.submit')}
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:underline">
                {t('login.createOne')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
