export function formatClientQuotaError(message: string, language: 'es' | 'en') {
  if (!message.includes('CLIENT_FREE_QUOTA_REACHED')) {
    return message;
  }

  const nextAvailableMatch = message.match(/Next available time:\s*(.*?)(?:\.|$)/i);
  const nextAvailable = nextAvailableMatch?.[1]?.trim();

  if (language === 'es') {
    if (nextAvailable) {
      return `Ya consumiste tu cuota del plan FREE. Podrás crear una nueva solicitud a partir de ${nextAvailable}, o cambiarte a PRO para solicitudes ilimitadas.`;
    }
    return 'Ya consumiste tu cuota del plan FREE. Espera al siguiente ciclo o cámbiate a PRO para solicitudes ilimitadas.';
  }

  if (nextAvailable) {
    return `You already consumed your FREE plan quota. You can create a new request starting at ${nextAvailable}, or upgrade to PRO for unlimited requests.`;
  }

  return 'You already consumed your FREE plan quota. Wait for the next cycle or upgrade to PRO for unlimited requests.';
}
