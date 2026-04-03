import React, { useEffect, useState } from 'react';
import { X, Check, Zap, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { supabase } from '../../lib/supabase';
import { getUpgradeProFeatures, getUpgradeProModalText } from '../../i18n/upgradeProModalText';

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'pro';
  onProceedToPayment?: () => void;
}

export function UpgradeProModal({
  isOpen,
  onClose,
  currentPlan,
  onProceedToPayment,
}: UpgradeProModalProps) {
  const { language } = useI18n();
  const content = getUpgradeProModalText(language);
  const proFeatures = getUpgradeProFeatures(language);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [proPrice, setProPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('plans')
      .select('price')
      .eq('name', 'PRO')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProPrice(data.price as number);
      });
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(language === 'es' ? 'es-419' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  if (!isOpen) return null;

  const handleProceedToPayment = async () => {
    setIsLoadingPayment(true);
    try {
      const hotmartLink =
        import.meta.env.VITE_HOTMART_SANDBOX_AFFILIATE_LINK ||
        'https://sandbox.hotmart.com/YOUR_PRODUCT_ID';

      if (hotmartLink.includes('YOUR_PRODUCT_ID')) {
        alert(content.missingLink);
        return;
      }
      if (onProceedToPayment) onProceedToPayment();
      window.location.href = hotmartLink;
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      alert(content.processingError);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              PRO
            </span>
            <h2 id="upgrade-modal-title" className="text-base font-semibold text-slate-900 sm:text-lg">
              {content.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {currentPlan === 'pro' ? (
            /* Already PRO */
            <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm">
                <Check className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-emerald-800">{content.alreadyPro}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Subtitle */}
              <p className="text-sm text-slate-600">{content.subtitle}</p>

              {/* Current plan */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {content.currentPlanLabel}
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">FREE</p>
                  <p className="mt-0.5 text-xs text-slate-500">{content.freePlanQuota}</p>
                </div>
              </div>

              {/* PRO features */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {content.includesTitle}
                </p>
                <ul className="space-y-2">
                  {proFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
                      <span className="text-sm leading-5 text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price block */}
              <div className="rounded-xl border border-sky-200 bg-gradient-to-b from-cyan-50 to-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {content.comparePlan}
                </p>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-3xl font-bold leading-none text-sky-700">
                    {proPrice !== null ? `$${formatPrice(proPrice)}` : '…'}
                  </span>
                  <span className="pb-0.5 text-sm text-slate-500">{content.monthlySuffix}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{content.noCommitments}</p>
              </div>

              {/* Payment notice */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <p className="text-xs leading-5 text-amber-800">{content.paymentNotice}</p>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <p className="text-xs leading-5 text-slate-600">{content.securityNotice}</p>
              </div>

              {/* CTAs */}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary flex-1">
                  {content.cancel}
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLoadingPayment}
                  className="btn-primary flex-1"
                >
                  {isLoadingPayment ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {content.processing}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" aria-hidden="true" />
                      {content.proceedButton}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
