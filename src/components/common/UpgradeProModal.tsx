/**
 * UpgradeProModal - Dialog to initiate PRO plan upgrade via Hotmart payment
 * 
 * Usage:
 * ```tsx
 * <UpgradeProModal
 *   isOpen={showUpgrade}
 *   onClose={() => setShowUpgrade(false)}
 *   currentPlan="free"
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { X, Check, Zap, AlertCircle } from 'lucide-react';
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(language === 'es' ? 'es-419' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  if (!isOpen) return null;

  const handleProceedToPayment = async () => {
    setIsLoadingPayment(true);

    try {
      // TODO: Get Hotmart affiliate link from environment variables
      // HOTMART_AFFILIATE_LINK points to your product in Hotmart sandbox/production
      const hotmartLink = import.meta.env.VITE_HOTMART_SANDBOX_AFFILIATE_LINK ||
        'https://sandbox.hotmart.com/YOUR_PRODUCT_ID'; // Replace with your Hotmart product ID

      if (hotmartLink.includes('YOUR_PRODUCT_ID')) {
        alert(content.missingLink);
        return;
      }

      // Optional: Track conversion event
      if (onProceedToPayment) {
        onProceedToPayment();
      }

      // Redirect to Hotmart payment page
      window.location.href = hotmartLink;
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      alert(content.processingError);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6" />
              <h2 className="text-2xl font-bold">{content.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-purple-100">{content.subtitle}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {currentPlan === 'pro' ? (
            // Already PRO state
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <Check className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-700">{content.alreadyPro}</p>
            </div>
          ) : (
            <>
              {/* Current Plan Display */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                  {content.currentPlanLabel}
                </p>
                <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-semibold text-gray-900">FREE</p>
                  <p className="text-xs text-gray-600 mt-1">{content.freePlanQuota}</p>
                </div>
              </div>

              {/* PRO Features */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {content.includesTitle}
                </h3>
                <ul className="space-y-3">
                  {proFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Badge */}
              <div className="mb-8 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 text-center border-2 border-purple-200">
                <p className="text-sm text-gray-600">{content.comparePlan}</p>
                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {proPrice !== null ? `$${formatPrice(proPrice)}` : '...'}
                  </span>
                  <span className="text-sm text-gray-600">{content.monthlySuffix}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{content.noCommitments}</p>
              </div>

              <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {content.paymentNotice}
              </div>

              {/* Security Notice */}
              <div className="mb-8 flex items-start gap-2 rounded-lg bg-blue-50 p-3 border-l-4 border-blue-400">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">{content.securityNotice}</p>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  {content.cancel}
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLoadingPayment}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingPayment ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {content.processing}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      {content.proceedButton}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
