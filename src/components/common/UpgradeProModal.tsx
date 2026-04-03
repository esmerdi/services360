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

import React, { useState } from 'react';
import { X, Check, Zap, AlertCircle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

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
  const { t, language } = useI18n();
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  if (!isOpen) return null;

  // PRO features list
  const proFeatures = [
    {
      es: 'Solicitudes ilimitadas por mes',
      en: 'Unlimited requests per month',
    },
    {
      es: 'Prioridad en búsquedas',
      en: 'Priority in searches',
    },
    {
      es: 'Perfil destacado',
      en: 'Featured profile',
    },
    {
      es: 'Chat prioritario',
      en: 'Priority chat support',
    },
    {
      es: 'Sin comisión de la plataforma',
      en: 'No platform commission',
    },
  ];

  const handleProceedToPayment = async () => {
    setIsLoadingPayment(true);

    try {
      // TODO: Get Hotmart affiliate link from environment variables
      // HOTMART_AFFILIATE_LINK points to your product in Hotmart sandbox/production
      const hotmartLink = process.env.REACT_APP_HOTMART_AFFILIATE_LINK ||
        'https://sandbox.hotmart.com/YOUR_PRODUCT_ID'; // Replace with your Hotmart product ID

      // Optional: Track conversion event
      if (onProceedToPayment) {
        onProceedToPayment();
      }

      // Redirect to Hotmart payment page
      window.location.href = hotmartLink;
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      alert(language === 'es' ? 'Error al procesar' : 'Error processing');
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const modalContent = {
    es: {
      title: '¡Actualiza a PRO!',
      subtitle: 'Obtén acceso ilimitado y visibilidad mejorada',
      currentPlanLabel: 'Tu plan actual',
      comparePlan: 'Por solo $9.99 USD/mes',
      proceedButton: 'Ir al pago seguro',
      alreadyPro: 'Ya tienes plan PRO',
      notAvailable: 'Este cambio no está disponible',
    },
    en: {
      title: 'Upgrade to PRO!',
      subtitle: 'Get unlimited access and improved visibility',
      currentPlanLabel: 'Your current plan',
      comparePlan: 'For only $9.99 USD/month',
      proceedButton: 'Go to secure payment',
      alreadyPro: 'You already have PRO plan',
      notAvailable: 'This change is not available',
    },
  };

  const content = modalContent[language];

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
                  <p className="text-xs text-gray-600 mt-1">3 requests per day / 90 per month</p>
                </div>
              </div>

              {/* PRO Features */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {language === 'es' ? 'Plan PRO incluye:' : 'PRO plan includes:'}
                </h3>
                <ul className="space-y-3">
                  {proFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        {language === 'es' ? feature.es : feature.en}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Badge */}
              <div className="mb-8 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 text-center border-2 border-purple-200">
                <p className="text-sm text-gray-600">{content.comparePlan}</p>
                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">$9.99</span>
                  <span className="text-sm text-gray-600">USD/mes</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'es'
                    ? 'Sin compromisos. Cancela cuando quieras.'
                    : 'No commitments. Cancel anytime.'}
                </p>
              </div>

              {/* Security Notice */}
              <div className="mb-8 flex items-start gap-2 rounded-lg bg-blue-50 p-3 border-l-4 border-blue-400">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  {language === 'es'
                    ? 'Pago seguro procesado por Hotmart. Tu información está protegida.'
                    : 'Secure payment processed by Hotmart. Your data is protected.'}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLoadingPayment}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingPayment ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {language === 'es' ? 'Procesando...' : 'Processing...'}
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
