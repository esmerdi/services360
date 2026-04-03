export const PROVIDER_NEARBY_REQUESTS_TEXT = {
  es: {
    title: 'Solicitudes cercanas',
    subtitle: 'Se ordenan por distancia respecto a tu ubicación actual.',
    available: 'Disponibles',
    visibleOnMap: 'Visibles en mapa',
    criteria: 'Criterio',
    closestFirst: 'Prioridad por cercanía',
    seeAllOnMap: 'Ver todas en mapa',
    refreshGps: 'Actualizar GPS',
    topNotice: 'Acepta solicitudes que coincidan con tus servicios y zona.',
    gpsWarning: 'Activa el GPS y marca tu perfil como en línea para recibir solicitudes cercanas.',
    requestsMap: 'Mapa de solicitudes',
    mapDescription: 'Visualiza tu posición y solicitudes cercanas sobre OpenStreetMap.',
    empty: 'No hay solicitudes cercanas disponibles ahora.',
    markerClient: 'Cliente',
    markerServiceRequest: 'Solicitud de servicio',
    markerClientLocation: 'Ubicación del cliente',
    markerConfirm: 'Confirmar solicitud',
    markerAccept: 'Aceptar solicitud',
    markerYourLocation: 'Tu ubicación',
  },
  en: {
    title: 'Nearby requests',
    subtitle: 'Sorted by distance from your current location.',
    available: 'Available',
    visibleOnMap: 'Visible on map',
    criteria: 'Criteria',
    closestFirst: 'Closest first',
    seeAllOnMap: 'See all on map',
    refreshGps: 'Refresh GPS',
    topNotice: 'Accept requests that match your services and area.',
    gpsWarning: 'Enable GPS and mark yourself online from your profile to receive nearby requests.',
    requestsMap: 'Requests map',
    mapDescription: 'See your position and nearby requests on OpenStreetMap.',
    empty: 'No nearby requests available right now.',
    markerClient: 'Client',
    markerServiceRequest: 'Service request',
    markerClientLocation: 'Client location',
    markerConfirm: 'Confirm request',
    markerAccept: 'Accept request',
    markerYourLocation: 'Your location',
  },
} as const;

export const NEARBY_REQUEST_CARD_TEXT = {
  es: {
    client: 'Cliente',
    serviceRequest: 'Solicitud de servicio',
    clientRequest: 'Solicitud de cliente',
    noExtraDetails: 'No hay detalles adicionales.',
    distance: 'Distancia',
    unavailable: 'No disponible',
    location: 'Ubicación',
    noAddressReference: 'Sin referencia de dirección.',
    confirmRequest: 'Confirmar solicitud',
    acceptRequest: 'Aceptar solicitud',
  },
  en: {
    client: 'Client',
    serviceRequest: 'Service request',
    clientRequest: 'Client request',
    noExtraDetails: 'No extra details provided.',
    distance: 'Distance',
    unavailable: 'Unavailable',
    location: 'Location',
    noAddressReference: 'No address reference supplied.',
    confirmRequest: 'Confirm request',
    acceptRequest: 'Accept request',
  },
} as const;

export function getProviderNearbyRequestsText(language: string) {
  return language === 'es' ? PROVIDER_NEARBY_REQUESTS_TEXT.es : PROVIDER_NEARBY_REQUESTS_TEXT.en;
}

export function getNearbyRequestCardText(es: boolean) {
  return es ? NEARBY_REQUEST_CARD_TEXT.es : NEARBY_REQUEST_CARD_TEXT.en;
}
