import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { isManagedAvatarUrl } from '../../utils/helpers';
import ErrorMessage from './ErrorMessage';
import UserAvatar from './UserAvatar';

// ─── Dial codes ───────────────────────────────────────────────────────────────
const DIAL_CODES = [
  { code: '+57',  flag: '🇨🇴', country: 'Colombia' },
  { code: '+54',  flag: '🇦🇷', country: 'Argentina' },
  { code: '+55',  flag: '🇧🇷', country: 'Brasil' },
  { code: '+56',  flag: '🇨🇱', country: 'Chile' },
  { code: '+593', flag: '🇪🇨', country: 'Ecuador' },
  { code: '+34',  flag: '🇪🇸', country: 'España' },
  { code: '+1',   flag: '🇺🇸', country: 'EE.UU. / Canadá' },
  { code: '+52',  flag: '🇲🇽', country: 'México' },
  { code: '+51',  flag: '🇵🇪', country: 'Perú' },
  { code: '+58',  flag: '🇻🇪', country: 'Venezuela' },
] as const;

type DialCode = (typeof DIAL_CODES)[number]['code'];

type AddressSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

// Try longest dial code first to avoid partial matches (+593 before +5)
const DIAL_CODES_SORTED_DESC = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length);

function parsePhone(fullPhone: string | null): { dialCode: DialCode; localNumber: string } {
  if (!fullPhone) return { dialCode: '+57', localNumber: '' };
  for (const { code } of DIAL_CODES_SORTED_DESC) {
    if (fullPhone.startsWith(code)) {
      return { dialCode: code as DialCode, localNumber: fullPhone.slice(code.length) };
    }
  }
  return { dialCode: '+57', localNumber: fullPhone };
}

function getPhoneValidationError(dialCode: DialCode, localNumber: string, es: boolean): string | null {
  const digits = localNumber.replace(/\D/g, '');
  if (digits.length === 0) return null; // phone is optional
  if (dialCode === '+57') {
    if (digits.length !== 10) {
      return es
        ? 'El número colombiano debe tener exactamente 10 dígitos'
        : 'Colombian number must be exactly 10 digits';
    }
  } else if (digits.length < 7 || digits.length > 15) {
    return es
      ? 'Número inválido (debe tener entre 7 y 15 dígitos)'
      : 'Invalid number (must have 7–15 digits)';
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileEditor() {
  const { user, refreshUser } = useAuth();
  const { language } = useI18n();
  const es = language === 'es';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName]       = useState('');
  const [dialCode, setDialCode]       = useState<DialCode>('+57');
  const [localNumber, setLocalNumber] = useState('');
  const [address, setAddress]         = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [selectedAddressCoords, setSelectedAddressCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const skipAutocompleteRef = useRef(false);
  const addressWrapRef = useRef<HTMLDivElement>(null);

  // Sync form from user when user loads or changes identity
  useEffect(() => {
    if (!user) return;
    const parsed = parsePhone(user.phone);
    setFullName(user.full_name ?? '');
    setDialCode(parsed.dialCode);
    setLocalNumber(parsed.localNumber);
    setAddress(user.address ?? '');
    setSelectedAddressCoords(null);
    setAvatarPreview(isManagedAvatarUrl(user.avatar_url) ? user.avatar_url : null);
    setAvatarFile(null);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!addressWrapRef.current) return;
      if (!addressWrapRef.current.contains(event.target as Node)) {
        setAddressFocused(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  useEffect(() => {
    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }

    const query = address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      setAddressLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setAddressLoading(true);
        const languageCode = es ? 'es' : 'en';
        const params = new URLSearchParams({
          format: 'jsonv2',
          addressdetails: '0',
          limit: '5',
          'accept-language': languageCode,
          q: query,
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Address search failed: ${response.status}`);
        }

        const data = (await response.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
        const nextSuggestions = data.map((item) => ({
          id: String(item.place_id),
          label: item.display_name,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        }));

        setAddressSuggestions(nextSuggestions);
      } catch (searchError) {
        if ((searchError as Error).name !== 'AbortError') {
          setAddressSuggestions([]);
        }
      } finally {
        setAddressLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [address, es]);

  const showAddressDropdown = useMemo(
    () => addressFocused && (addressLoading || addressSuggestions.length > 0),
    [addressFocused, addressLoading, addressSuggestions.length]
  );
  const hasVerifiedAddress = useMemo(
    () => Boolean(selectedAddressCoords && address.trim().length > 0),
    [selectedAddressCoords, address]
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(es ? 'Solo se permiten imágenes' : 'Only image files are allowed');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError(es ? 'La imagen no puede superar 3 MB' : 'Image must be under 3 MB');
      return;
    }
    setError(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!user) return;
    setError(null);
    setSuccess(false);

    const phoneErr = getPhoneValidationError(dialCode, localNumber, es);
    if (phoneErr) { setError(phoneErr); return; }

    setSaving(true);

    let avatarUrl = user.avatar_url ?? null;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

      if (uploadError) {
        console.warn('Avatar upload failed (storage may be disabled locally):', uploadError.message);
        // Storage failed but continue with profile update without avatar
      } else {
        avatarUrl = path;
        setAvatarPreview(path);
      }
    }

    const digits = localNumber.replace(/\D/g, '');
    const phone = digits.length > 0 ? `${dialCode}${digits}` : null;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim() || null,
        phone,
        address: address.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (selectedAddressCoords && address.trim()) {
      const { error: locationError } = await supabase
        .from('locations')
        .upsert(
          {
            user_id: user.id,
            latitude: selectedAddressCoords.latitude,
            longitude: selectedAddressCoords.longitude,
            address: address.trim(),
          },
          { onConflict: 'user_id' }
        );

      if (locationError) {
        console.warn('Location save failed for selected address:', locationError.message);
      }
    }

    await refreshUser();
    setAvatarFile(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-900">
        {es ? 'Datos personales' : 'Personal Information'}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {es
          ? 'Mantén tu información actualizada para que otros usuarios puedan contactarte.'
          : 'Keep your information up to date so other users can reach you.'}
      </p>

      {error && <ErrorMessage message={error} className="mt-4" />}

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {es ? 'Perfil actualizado correctamente.' : 'Profile updated successfully.'}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* ── Avatar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="relative">
            <UserAvatar
              avatarUrl={avatarPreview}
              name={fullName.trim() || user?.email}
              alt={es ? 'Foto de perfil' : 'Profile photo'}
              className="h-24 w-24 overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-sm"
              fallbackClassName="text-2xl font-semibold text-white"
            />
            <button
              type="button"
              onClick={() => { setError(null); fileInputRef.current?.click(); }}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors"
              title={es ? 'Cambiar foto' : 'Change photo'}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-xs text-slate-400">{es ? 'Máx. 3 MB' : 'Max 3 MB'}</p>
        </div>

        {/* ── Fields ─────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Full name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {es ? 'Nombre completo' : 'Full name'}
            </label>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={es ? 'Tu nombre completo' : 'Your full name'}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {es ? 'Teléfono' : 'Phone'}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="input w-full sm:w-auto sm:min-w-[190px] sm:flex-shrink-0"
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value as DialCode)}
              >
                {DIAL_CODES.map(({ code, flag, country }) => (
                  <option key={code} value={code}>
                    {flag} {code} — {country}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                className="input w-full min-w-0 flex-1"
                value={localNumber}
                 onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d\s-]/g, ''))}
                placeholder={dialCode === '+57' ? '3001234567' : es ? 'Número' : 'Number'}
                inputMode="tel"
              />
            </div>
            {dialCode === '+57' && (
              <p className="mt-1 text-xs text-slate-400">
                {es
                  ? '10 dígitos para celular colombiano (ej. 3001234567)'
                  : '10 digits for a Colombian mobile (e.g. 3001234567)'}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="relative" ref={addressWrapRef}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {es ? 'Dirección' : 'Address'}
            </label>
            <input
              type="text"
              className="input"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setSelectedAddressCoords(null);
              }}
              onFocus={() => setAddressFocused(true)}
              placeholder={es ? 'Calle, barrio, ciudad' : 'Street, neighborhood, city'}
              autoComplete="street-address"
            />
            {hasVerifiedAddress && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {es ? 'Dirección verificada' : 'Verified address'}
              </div>
            )}
            {showAddressDropdown && (
              <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {addressLoading ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    {es ? 'Buscando direcciones...' : 'Searching addresses...'}
                  </div>
                ) : (
                  <ul className="py-1">
                    {addressSuggestions.map((suggestion) => (
                      <li key={suggestion.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            skipAutocompleteRef.current = true;
                            setAddress(suggestion.label);
                            setSelectedAddressCoords({ latitude: suggestion.latitude, longitude: suggestion.longitude });
                            setAddressSuggestions([]);
                            setAddressFocused(false);
                          }}
                        >
                          {suggestion.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {es ? 'Guardar cambios' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
