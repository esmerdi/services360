export const PROFILE_EDITOR_TEXT = {
  es: {
    imageOnlyError: 'Solo se permiten imágenes',
    imageSizeError: 'La imagen no puede superar 3 MB',
    personalInfoTitle: 'Datos personales',
    personalInfoSubtitle: 'Mantén tu información actualizada para que otros usuarios puedan contactarte.',
    successMessage: 'Perfil actualizado correctamente.',
    avatarAlt: 'Foto de perfil',
    changePhoto: 'Cambiar foto',
    maxSize: 'Máx. 3 MB',
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'Tu nombre completo',
    phone: 'Teléfono',
    numberPlaceholder: 'Número',
    colombiaPhoneHint: '10 dígitos para celular colombiano (ej. 3001234567)',
    address: 'Dirección',
    addressPlaceholder: 'Calle, barrio, ciudad',
    saveChanges: 'Guardar cambios',
  },
  en: {
    imageOnlyError: 'Only image files are allowed',
    imageSizeError: 'Image must be under 3 MB',
    personalInfoTitle: 'Personal Information',
    personalInfoSubtitle: 'Keep your information up to date so other users can reach you.',
    successMessage: 'Profile updated successfully.',
    avatarAlt: 'Profile photo',
    changePhoto: 'Change photo',
    maxSize: 'Max 3 MB',
    fullName: 'Full name',
    fullNamePlaceholder: 'Your full name',
    phone: 'Phone',
    numberPlaceholder: 'Number',
    colombiaPhoneHint: '10 digits for a Colombian mobile (e.g. 3001234567)',
    address: 'Address',
    addressPlaceholder: 'Street, neighborhood, city',
    saveChanges: 'Save changes',
  },
} as const;

export function getProfileEditorText(language: string) {
  return language === 'es' ? PROFILE_EDITOR_TEXT.es : PROFILE_EDITOR_TEXT.en;
}
