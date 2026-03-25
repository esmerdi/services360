import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, RefreshCw } from 'lucide-react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmail() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const tokenHash = params.get('token_hash');
  const tokenType = params.get('type');
  const authCode = params.get('code');
  const authError = params.get('error_description') ?? params.get('error');

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Redirect if no email in URL
  useEffect(() => {
    if (!email && !tokenHash && !authCode) navigate('/register', { replace: true });
  }, [authCode, email, navigate, tokenHash]);

  useEffect(() => {
    if (!authError) return;
    setError(decodeURIComponent(authError.replace(/\+/g, ' ')));
  }, [authError]);

  useEffect(() => {
    let active = true;

    const verifyFromLink = async () => {
      const allowedTypes: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email', 'email_change'];
      const normalizedType = tokenType && allowedTypes.includes(tokenType as EmailOtpType)
        ? (tokenType as EmailOtpType)
        : null;

      if (!authCode && !(tokenHash && normalizedType)) return;

      setError(null);
      setVerifying(true);

      try {
        if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && normalizedType) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: normalizedType,
          });
          if (verifyError) throw verifyError;
        }

        if (!active) return;
        navigate('/dashboard', { replace: true });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t('verifyEmail.invalidCode'));
      } finally {
        if (active) setVerifying(false);
      }
    };

    void verifyFromLink();

    return () => {
      active = false;
    };
  }, [authCode, navigate, t, tokenHash, tokenType]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    // Accept only a single digit; handle paste of full OTP
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH - index);

    if (digits.length > 1) {
      // Paste scenario: fill from current index onward
      const next = [...otp];
      for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = digits[i];
      }
      setOtp(next);
      const nextFocus = Math.min(index + digits.length, OTP_LENGTH - 1);
      focusInput(nextFocus);
      return;
    }

    if (!digits) return;
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    if (index < OTP_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleVerify = useCallback(async () => {
    const token = otp.join('');
    if (token.length < OTP_LENGTH) return;

    setError(null);
    setVerifying(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    setVerifying(false);

    if (err) {
      setError(t('verifyEmail.invalidCode'));
      setOtp(Array(OTP_LENGTH).fill(''));
      focusInput(0);
      return;
    }

    navigate('/dashboard', { replace: true });
  }, [otp, email, navigate, t]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (otp.every((d) => d !== '')) {
      handleVerify();
    }
  }, [otp, handleVerify]);

  const handleResend = async () => {
    setError(null);
    setResending(true);
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
      },
    });
    setResending(false);
    if (err) {
      setError(err.message);
    } else {
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      focusInput(0);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_#e0f2fe_0%,_#f8fafc_38%,_#ffffff_100%)] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-14 h-60 w-60 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-100 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md reveal-up">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center">
              <img src="/zippy-logo.png?v=2" alt="ZippyGo logo" className="h-7 w-7 object-contain" />
            </div>
            <span className="font-display text-2xl text-slate-900">Zippy<span className="font-bold">Go</span></span>
          </Link>
        </div>

        <div className="card border-slate-200/90 bg-white/90 shadow-[0_25px_70px_-35px_rgba(2,132,199,0.45)] backdrop-blur-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <MailCheck className="h-7 w-7 text-blue-600" />
          </div>

          <h1 className="text-xl font-bold text-slate-900">{t('verifyEmail.title')}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('verifyEmail.description')}{' '}
            {email ? <span className="font-medium text-slate-700">{email}</span> : null}
          </p>

          <div className="mt-6">
            {error && <ErrorMessage message={error} className="mb-4 text-left" />}

            {/* OTP inputs */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  disabled={verifying}
                  className={`h-12 w-10 rounded-xl border-2 text-center text-lg font-bold transition-colors outline-none
                    ${digit ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-900'}
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    disabled:opacity-50`}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={verifying || otp.some((d) => !d)}
              className="btn-primary w-full mt-5"
            >
              {verifying ? <LoadingSpinner size="sm" /> : t('verifyEmail.verify')}
            </button>

            {/* Resend */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
              {t('verifyEmail.noCode')}{' '}
              {cooldown > 0 ? (
                <span className="font-medium text-slate-400">
                  {t('verifyEmail.resendIn')} {cooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline disabled:opacity-50"
                >
                  {resending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {t('verifyEmail.resend')}
                </button>
              )}
            </div>

            <p className="mt-5 text-sm text-slate-400">
              {t('verifyEmail.wrongEmail')}{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                {t('verifyEmail.registerAgain')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
