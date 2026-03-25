import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, MailWarning } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import type { UserRole } from '../../types';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Login() {
  const { signIn, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

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
      await signIn(email, password, role);
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_#e0f2fe_0%,_#f8fafc_38%,_#ffffff_100%)] p-4">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-14 h-60 w-60 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-100 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
        <div className="w-full reveal-up">
          <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center">
              <img src="/zippy-logo.png" alt="Zippy logo" className="h-7 w-7 object-contain" />
            </div>
            <span className="font-display text-2xl text-slate-900">Zippy</span>
          </Link>
            <p className="mt-3 text-slate-500">{t('login.subtitle')}</p>
          </div>

          <div className="card border-slate-200/90 bg-white/90 shadow-[0_25px_70px_-35px_rgba(2,132,199,0.45)] backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <ErrorMessage message={error} />}

              {unverifiedEmail && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <MailWarning className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">{t('login.emailNotConfirmed')}</p>
                    <p className="text-amber-700 mt-0.5">
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
                <label className="label">{t('register.iam')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${
                        role === r.value
                          ? 'border-sky-500 bg-sky-50'
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

              <button
                type="submit"
                className="btn-primary w-full mt-2"
                disabled={loading}
              >
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
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                {t('login.createOne')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
