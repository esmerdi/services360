/**
 * ForcePasswordChangeModal - Required password change for PRO users on first login
 * 
 * This component appears when:
 * - User just activated PRO membership
 * - User has temporary password
 * - User must set permanent password
 * 
 * Usage in Dashboard/Layout:
 * ```tsx
 * const { mustChangePassword } = useMustChangePassword();
 * 
 * return (
 *   <>
 *     {mustChangePassword && <ForcePasswordChangeModal />}
 *     {/* rest of app */}
 *   </>
 * );
 * ```
 */

import React, { useState } from 'react';
import { Lock, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { supabase } from '../lib/supabase';

interface PasswordValidation {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function ForcePasswordChangeModal() {
  const { t, language } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordValidation: PasswordValidation = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*]/.test(newPassword),
  };

  const allValidationsPassed = Object.values(passwordValidation).every(Boolean);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error(
          language === 'es'
            ? 'Las contraseñas no coinciden'
            : 'Passwords do not match'
        );
      }

      // Validate all requirements
      if (!allValidationsPassed) {
        throw new Error(
          language === 'es'
            ? 'La contraseña no cumple con los requisitos'
            : 'Password does not meet requirements'
        );
      }

      // Call RPC to change password
      const { data, error: rpcError } = await supabase.rpc(
        'force_password_change',
        {
          p_current_password: currentPassword,
          p_new_password: newPassword,
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message || 'Failed to change password');
      }

      // Update auth user password via Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred while changing password';
      setError(message);
      console.error('Password change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const content = {
    es: {
      title: 'Cambia tu contraseña',
      subtitle: 'Establece tu contraseña permanente para tu plan PRO',
      currentPasswordLabel: 'Contraseña temporal',
      newPasswordLabel: 'Contraseña nueva',
      confirmPasswordLabel: 'Confirmar contraseña',
      requirements: 'La contraseña debe tener:',
      requirementMinLength: 'Mínimo 8 caracteres',
      requirementUpper: 'Letra mayúscula (A-Z)',
      requirementLower: 'Letra minúscula (a-z)',
      requirementNumber: 'Número (0-9)',
      requirementSpecial: 'Carácter especial (!@#$%^&*)',
      changeButton: 'Cambiar contraseña',
      successMessage: '¡Contraseña cambiada exitosamente!',
      changing: 'Cambiando...',
    },
    en: {
      title: 'Change your password',
      subtitle: 'Set your permanent password for your PRO plan',
      currentPasswordLabel: 'Temporary password',
      newPasswordLabel: 'New password',
      confirmPasswordLabel: 'Confirm password',
      requirements: 'Password must have:',
      requirementMinLength: 'Minimum 8 characters',
      requirementUpper: 'Uppercase letter (A-Z)',
      requirementLower: 'Lowercase letter (a-z)',
      requirementNumber: 'Number (0-9)',
      requirementSpecial: 'Special character (!@#$%^&*)',
      changeButton: 'Change password',
      successMessage: 'Password changed successfully!',
      changing: 'Changing...',
    },
  };

  const labels = content[language];

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="rounded-lg bg-white p-8 max-w-md text-center shadow-xl">
          <div className="flex justify-center mb-4">
            <Check className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Éxito!
          </h2>
          <p className="text-gray-600 mb-4">{labels.successMessage}</p>
          <p className="text-sm text-gray-500">
            {language === 'es'
              ? 'Reedirigiendo a tu dashboard...'
              : 'Redirecting to your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{labels.title}</h1>
          </div>
          <p className="text-blue-100">{labels.subtitle}</p>
        </div>

        {/* Body */}
        <form onSubmit={handleChangePassword} className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-3 border-l-4 border-red-400">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Current Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {labels.currentPasswordLabel}
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {labels.newPasswordLabel}
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    new: !prev.new,
                  }))
                }
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {labels.confirmPasswordLabel}
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <p className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {labels.requirements}
            </p>
            <ul className="space-y-2">
              {[
                {
                  key: 'minLength',
                  label: labels.requirementMinLength,
                },
                {
                  key: 'hasUpper',
                  label: labels.requirementUpper,
                },
                {
                  key: 'hasLower',
                  label: labels.requirementLower,
                },
                {
                  key: 'hasNumber',
                  label: labels.requirementNumber,
                },
                {
                  key: 'hasSpecial',
                  label: labels.requirementSpecial,
                },
              ].map((req) => (
                <li
                  key={req.key}
                  className={`flex items-center gap-2 text-xs ${
                    passwordValidation[req.key as keyof PasswordValidation]
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full flex items-center justify-center ${
                      passwordValidation[req.key as keyof PasswordValidation]
                        ? 'bg-green-100'
                        : 'bg-gray-200'
                    }`}
                  >
                    {passwordValidation[req.key as keyof PasswordValidation] && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  {req.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !allValidationsPassed}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-semibold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {labels.changing}
              </>
            ) : (
              labels.changeButton
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Hook to check if current user must change password
 */
export function useMustChangePassword() {
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('must_change_password');

        if (error) {
          console.error('Error checking password status:', error);
          return;
        }

        setMustChangePassword(data?.must_change || false);
      } catch (error) {
        console.error('Password status check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPasswordStatus();
  }, []);

  return { mustChangePassword, isLoading };
}
