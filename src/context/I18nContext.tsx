/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'es';

interface TranslationMap {
  [key: string]: string | TranslationMap;
}

type TranslationNode = string | TranslationMap;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'taskly.language';

const translations: Record<Language, TranslationMap> = {
  en: {
    language: {
      label: 'Language',
      english: 'EN',
      spanish: 'ES',
    },
    common: {
      signOut: 'Sign out',
      signIn: 'Sign In',
      createAccount: 'Create Account',
      welcomeBack: 'Welcome back',
      controlPanel: 'Control panel',
      currentView: 'Current view',
      openProfileMenu: 'Open profile menu',
      toggleMenu: 'Toggle menu',
      newRequest: 'New Request',
      all: 'All',
    },
    roles: {
      admin: 'Admin',
      client: 'Client',
      provider: 'Provider',
    },
    nav: {
      dashboard: 'Dashboard',
      adminDashboard: 'Admin Dashboard',
      users: 'Users',
      categories: 'Categories',
      services: 'Services',
      requests: 'Requests',
      plans: 'Plans',
      browse: 'Browse',
      browseServices: 'Browse Services',
      myRequests: 'My Requests',
      requestService: 'Request Service',
      requestDetails: 'Request Details',
      providerDashboard: 'Provider Dashboard',
      nearbyRequests: 'Nearby Requests',
      myJobs: 'My Jobs',
      providerProfile: 'Provider Profile',
      subscription: 'Subscription',
    },
    views: {
      Dashboard: 'Dashboard',
      'Admin Dashboard': 'Admin Dashboard',
      Users: 'Users',
      Categories: 'Categories',
      Services: 'Services',
      Requests: 'Requests',
      Plans: 'Plans',
      'Browse Services': 'Browse Services',
      'My Requests': 'My Requests',
      'Request Service': 'Request Service',
      'Request Details': 'Request Details',
      'Provider Dashboard': 'Provider Dashboard',
      'Nearby Requests': 'Nearby Requests',
      'My Jobs': 'My Jobs',
      'Provider Profile': 'Provider Profile',
      Subscription: 'Subscription',
    },
    myRequests: {
      title: 'My Requests',
      subtitle: 'Track progress, providers and pricing.',
      searchPlaceholder: 'Search by service, provider or address',
      pendingReviewTitle: 'You have pending ratings',
      pendingReviewDescription: 'completed requests waiting for your feedback.',
      status: {
        pending: 'Pending',
        accepted: 'Accepted',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      table: {
        service: 'Service',
        provider: 'Provider',
        status: 'Status',
        price: 'Price',
        created: 'Created',
        noRequests: 'No requests found.',
        serviceRequest: 'Service Request',
        addressPending: 'Address pending',
        awaitingAcceptance: 'Awaiting acceptance',
        noRatingsYet: 'No ratings yet',
        rateNow: 'Rate now',
      },
    },
    clientDashboard: {
      welcome: 'Welcome back,',
      there: 'there',
      subtitle: 'What service do you need today?',
      locationMissingTitle: 'Location not detected',
      locationMissingDesc: 'Enable location access to find nearby providers.',
      detectLocation: 'Detect Location',
      locationDetected: 'Location detected - nearby providers will see your requests.',
      findServiceTitle: 'Find a Service',
      findServiceDesc: 'Browse categories and book a provider near you.',
      browseNow: 'Browse Now',
      stats: {
        total: 'Total',
        pending: 'Pending',
        completed: 'Completed',
      },
      recentRequests: 'Recent Requests',
      viewAll: 'View all',
      noRequests: 'No requests yet.',
      bookService: 'Book a Service',
    },
    clientBrowse: {
      title: 'Browse Services',
      subtitle: 'Explore categories and request nearby providers.',
      availableNow: 'Available now',
      oneNearbyProvider: '1 nearby provider',
      nearbyProvidersCount: '{{count}} nearby providers',
      visibleProvidersCount: '{{count}} currently visible on the map',
      viewAllOnMap: 'See all',
      nearbyProvidersMapTitle: 'Nearby providers on map',
      nearbyProvidersMapDesc: 'Filter by parent category to view matching providers with their category icon.',
      popupNoServiceAvailable: 'Service not available in this filter',
      popupRequestShortcut: 'Request now',
      enableLocationForMap: 'Enable location to view nearby providers on the map.',
      noMapProviders: 'No nearby providers found for this category on the map.',
      searchPlaceholder: 'Search services, categories or keywords',
      allCategories: 'All categories',
      categoryFallback: 'Browse related services and providers near you.',
      noServices: 'No services match your filters.',
      generalCategory: 'General',
      serviceFallback: 'Trusted nearby professionals available for this service.',
      providerRatingLabel: 'Provider ratings average',
      providerRatingNote: 'Average across providers offering this service',
      noRatingsYet: 'No ratings yet',
      providersAvailable: 'providers available',
      selectNearbyProvider: 'Select a nearby provider',
      noProvidersForService: 'No nearby providers available for this service right now.',
      requestModeLabel: 'How do you want to send this request?',
      requestModeDirectTitle: 'Specific provider',
      requestModeDirectDesc: 'Choose a provider and send the request directly.',
      requestModeOpenTitle: 'Open request',
      requestModeOpenDesc: 'Publish it so any available provider can accept it.',
      requestModeAutoOpenNotice: 'No providers are available for direct assignment right now. Open request mode was enabled automatically.',
      requestModeOpenHint: 'Recommended when demand is high or you need the first available provider.',
      selectedProviderLabel: 'Selected provider',
      selectProviderFirst: 'Choose a provider from the list to continue.',
      selectProviderFirstButton: 'Select a provider first',
      requestSelectedProvider: 'Request with selected provider',
      requestingProvider: 'Sending request...',
      requestOpenButton: 'Publish open request',
      requestingOpen: 'Publishing request...',
      requestService: 'Request Service',
      selectParentCategory: 'Select parent category',
      selectSubcategory: 'Select subcategory',
      selectService: 'Select service',
      noSubcategoriesAvailable: 'Select a parent category first',
      noServicesAvailable: 'No services available for this subcategory',
      requestServiceButton: 'Request this service',
    },
    chat: {
      openChat: 'Chat',
      chatSubtitle: 'Online',
      noMessagesYet: 'No messages yet. Say hi!',
      messagePlaceholder: 'Type a message…',
      sendMessage: 'Send',
      unknownUser: 'Unknown user',
    },
    clientRequestService: {
      serviceNotFound: 'Service not found.',
      locationRequiredError: 'Location is required before sending a request.',
      title: 'Request Service',
      subtitle: 'Create a request and notify nearby providers.',
      locationRequiredTitle: 'Location required',
      locationRequiredDesc: 'Enable GPS so providers can be ranked by proximity.',
      detectLocation: 'Detect my location',
      serviceBadge: 'Service',
      serviceFallback: 'Professional providers are ready nearby.',
      describeLabel: 'Describe what you need',
      describePlaceholder: 'Include key details, urgency and any requirements',
      budgetLabel: 'Budget (optional)',
      budgetPlaceholder: 'e.g. 35',
      invalidBudget: 'Enter a valid budget value.',
      addressLabel: 'Address / reference',
      addressPlaceholder: 'Apartment, street, landmark',
      currentLocation: 'Current location',
      waitingGps: 'Waiting for GPS access',
      sendRequest: 'Send request',
      nearbyProviders: 'Nearby Providers',
      nearbyProvidersDesc: 'Providers are ranked by distance and availability.',
      noProviders: 'No online providers with this service were found near your location.',
      providerLocationFallback: 'Location available from GPS',
      noRatingsYet: 'No ratings yet',
      online: 'Online',
      distanceUnavailable: 'Distance unavailable',
    },
    clientRequestDetail: {
      serviceRequest: 'Service Request',
      requestPrefix: 'Request',
      noDescription: 'No additional description provided.',
      provider: 'Provider',
      awaitingProvider: 'Awaiting provider',
      providerFallback: 'A nearby provider will accept your request.',
      budget: 'Budget',
      created: 'Creation date',
      statusTimeline: 'Status Timeline',
      noStatusChanges: 'No status changes recorded yet.',
      requestInfo: 'Request Info',
      locationMap: 'Location map',
      address: 'Address',
      notProvided: 'Not provided',
      coordinates: 'Coordinates',
      unavailable: 'Unavailable',
      rateProvider: 'Rate Provider',
      noComment: 'No comment added.',
      noRatingsYet: 'No ratings yet',
      shareExperience: 'Share your experience',
      submitRating: 'Submit rating',
      ratingReminderTitle: 'Your provider marked this service as completed',
      ratingReminderDescription: 'Leave a quick rating to help other clients choose with confidence.',
      ratingAvailableLater: 'Ratings become available after the request is completed.',
      switchOpenTitle: 'Need a faster response?',
      switchOpenDescription: 'This direct request is still pending. Publish it as an open request so any nearby provider can accept it.',
      switchOpenButton: 'Publish as open request',
      switchOpening: 'Publishing request...',
      switchOpenSuccess: 'Your request is now open for nearby providers.',
      switchOpenUnavailable: 'This request can no longer be switched to open mode.',
      switchOpenWaitHint: 'If this provider does not accept in {{minutes}} minutes, you can switch to open request mode.',
    },
    landing: {
      badge: 'Smart matching in minutes',
      headline: 'Find trusted local help with a bold, modern workflow.',
      description:
        'Taskly connects clients with verified providers for home services, beauty appointments, and everyday tasks. Post a request, compare options, and get things done faster.',
      findService: 'Find a Service',
      becomeProvider: 'Become a Provider',
      checklist: {
        noCard: 'No credit card required',
        verifiedCommunity: 'Verified provider community',
        securePlatform: 'Secure role-based platform',
        liveUpdates: 'Live request updates',
      },
      stats: {
        happyClients: 'Happy Clients',
        verifiedProviders: 'Verified Providers',
        serviceCategories: 'Service Categories',
        citiesCovered: 'Cities Covered',
      },
      liveDemandPulse: 'Live demand pulse',
      quickResponseTitle: 'Requests answered quickly',
      quickResponseValue: 'Under 10 minutes avg.',
      features: {
        proximity: {
          title: 'Proximity-Based Matching',
          description: 'Connect with nearby verified service providers in real time.',
        },
        verified: {
          title: 'Verified Providers',
          description: 'Every provider goes through a review process for your safety.',
        },
        ratings: {
          title: 'Real Ratings',
          description: 'Honest reviews from real clients help you choose the best pro.',
        },
        fastResponse: {
          title: 'Fast Response',
          description: 'Get responses from available providers within minutes.',
        },
      },
      howWorksTitle: 'How Taskly works',
      howWorksSubtitle: 'A fast 3-step flow designed for clarity on mobile and desktop.',
      steps: {
        browse: {
          title: 'Browse Services',
          desc: 'Explore categories and choose exactly what you need.',
        },
        send: {
          title: 'Send Request',
          desc: 'Set details, budget and location in seconds.',
        },
        matched: {
          title: 'Get Matched',
          desc: 'Nearby providers accept and start the job quickly.',
        },
      },
      startToday: 'Get started today',
      ctaTitle: 'Launch your first request in under two minutes',
      ctaDescription:
        'Join clients and providers building local trust with transparent ratings and live updates.',
      footer: 'All rights reserved.',
    },
    login: {
      subtitle: 'Sign in to your account',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      submit: 'Sign In',
      noAccount: "Don't have an account?",
      createOne: 'Create one',
      signInFailed: 'Sign in failed',
      emailNotConfirmed: 'Email not confirmed',
      emailNotConfirmedDesc: 'You need to verify your email before signing in.',
      verifyNow: 'Verify now',
    },
    register: {
      subtitle: 'Create your account',
      iam: 'I am a...',
      roleClientLabel: 'Client',
      roleClientDescription: 'I need to hire service providers',
      roleProviderLabel: 'Provider',
      roleProviderDescription: 'I offer services to clients',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'John Doe',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Min. 6 characters',
      passwordTooShort: 'Password must be at least 6 characters.',
      submit: 'Create Account',
      alreadyAccount: 'Already have an account?',
      signIn: 'Sign in',
      successTitle: 'Check your email',
      successDescription: "We've sent a confirmation link to",
      goToSignIn: 'Go to Sign In',
      registrationFailed: 'Registration failed',
    },
    verifyEmail: {
      title: 'Verify your email',
      description: 'We sent a confirmation email. Use the 6-digit code or open the link sent to',
      verify: 'Verify account',
      invalidCode: 'The code or confirmation link is invalid or expired. Please try again.',
      noCode: "Didn't receive the email?",
      resend: 'Resend email',
      resendIn: 'Resend in',
      wrongEmail: 'Wrong email address?',
      registerAgain: 'Register again',
    },
  },
  es: {
    language: {
      label: 'Idioma',
      english: 'EN',
      spanish: 'ES',
    },
    common: {
      signOut: 'Cerrar sesión',
      signIn: 'Iniciar sesión',
      createAccount: 'Crear cuenta',
      welcomeBack: 'Bienvenido de nuevo',
      controlPanel: 'Panel de control',
      currentView: 'Vista actual',
      openProfileMenu: 'Abrir menú de perfil',
      toggleMenu: 'Abrir menú',
      newRequest: 'Nueva solicitud',
      all: 'Todos',
    },
    roles: {
      admin: 'Administrador',
      client: 'Cliente',
      provider: 'Proveedor',
    },
    nav: {
      dashboard: 'Panel',
      adminDashboard: 'Panel administrador',
      users: 'Usuarios',
      categories: 'Categorías',
      services: 'Servicios',
      requests: 'Solicitudes',
      plans: 'Planes',
      browse: 'Explorar',
      browseServices: 'Explorar servicios',
      myRequests: 'Mis solicitudes',
      requestService: 'Solicitar servicio',
      requestDetails: 'Detalle de solicitud',
      providerDashboard: 'Panel proveedor',
      nearbyRequests: 'Solicitudes cercanas',
      myJobs: 'Mis trabajos',
      providerProfile: 'Perfil proveedor',
      subscription: 'Suscripción',
    },
    views: {
      Dashboard: 'Panel',
      'Admin Dashboard': 'Panel administrador',
      Users: 'Usuarios',
      Categories: 'Categorías',
      Services: 'Servicios',
      Requests: 'Solicitudes',
      Plans: 'Planes',
      'Browse Services': 'Explorar servicios',
      'My Requests': 'Mis solicitudes',
      'Request Service': 'Solicitar servicio',
      'Request Details': 'Detalle de solicitud',
      'Provider Dashboard': 'Panel proveedor',
      'Nearby Requests': 'Solicitudes cercanas',
      'My Jobs': 'Mis trabajos',
      'Provider Profile': 'Perfil proveedor',
      Subscription: 'Suscripción',
    },
    myRequests: {
      title: 'Mis solicitudes',
      subtitle: 'Haz seguimiento del progreso, proveedores y precios.',
      searchPlaceholder: 'Buscar por servicio, proveedor o dirección',
      pendingReviewTitle: 'Tienes calificaciones pendientes',
      pendingReviewDescription: 'solicitudes completadas que esperan tu opinión.',
      status: {
        pending: 'Pendiente',
        accepted: 'Aceptada',
        in_progress: 'En progreso',
        completed: 'Completada',
        cancelled: 'Cancelada',
      },
      table: {
        service: 'Servicio',
        provider: 'Proveedor',
        status: 'Estado',
        price: 'Precio',
        created: 'Creada',
        noRequests: 'No se encontraron solicitudes.',
        serviceRequest: 'Solicitud de servicio',
        addressPending: 'Dirección pendiente',
        awaitingAcceptance: 'En espera de aceptación',
        noRatingsYet: 'Aún sin calificaciones',
        rateNow: 'Calificar ahora',
      },
    },
    clientDashboard: {
      welcome: 'Bienvenido de nuevo,',
      there: 'amigo',
      subtitle: '¿Qué servicio necesitas hoy?',
      locationMissingTitle: 'Ubicación no detectada',
      locationMissingDesc: 'Activa el acceso a ubicación para encontrar proveedores cercanos.',
      detectLocation: 'Detectar ubicación',
      locationDetected: 'Ubicación detectada — los proveedores cercanos verán tus solicitudes.',
      findServiceTitle: 'Buscar servicio',
      findServiceDesc: 'Explora categorías y agenda un proveedor cerca de ti.',
      browseNow: 'Explorar ahora',
      stats: {
        total: 'Total',
        pending: 'Pendientes',
        completed: 'Completadas',
      },
      recentRequests: 'Solicitudes recientes',
      viewAll: 'Ver todas',
      noRequests: 'Aún no tienes solicitudes.',
      bookService: 'Solicitar un servicio',
    },
    clientBrowse: {
      title: 'Explorar servicios',
      subtitle: 'Explora categorías y solicita proveedores cercanos.',
      availableNow: 'Disponibles ahora',
      oneNearbyProvider: '1 proveedor cercano',
      nearbyProvidersCount: '{{count}} proveedores cercanos',
      visibleProvidersCount: '{{count}} visibles en el mapa',
      viewAllOnMap: 'Ver todas',
      nearbyProvidersMapTitle: 'Proveedores cercanos en el mapa',
      nearbyProvidersMapDesc: 'Filtra por categoría padre para ver proveedores con su ícono de categoría.',
      popupNoServiceAvailable: 'Servicio no disponible para este filtro',
      popupRequestShortcut: 'Solicitar ahora',
      enableLocationForMap: 'Activa tu ubicación para ver proveedores cercanos en el mapa.',
      noMapProviders: 'No hay proveedores cercanos para esta categoría en el mapa.',
      searchPlaceholder: 'Buscar servicios, categorías o palabras clave',
      allCategories: 'Todas las categorías',
      categoryFallback: 'Explora servicios relacionados y proveedores cercanos.',
      noServices: 'Ningún servicio coincide con tus filtros.',
      generalCategory: 'General',
      serviceFallback: 'Profesionales confiables cercanos disponibles para este servicio.',
      providerRatingLabel: 'Promedio de calificaciones',
      providerRatingNote: 'Promedio entre los proveedores que ofrecen este servicio',
      noRatingsYet: 'Aún sin calificaciones',
      providersAvailable: 'proveedores disponibles',
      selectNearbyProvider: 'Selecciona un proveedor cercano',
      noProvidersForService: 'No hay proveedores cercanos disponibles para este servicio en este momento.',
      requestModeLabel: '¿Cómo quieres enviar esta solicitud?',
      requestModeDirectTitle: 'Proveedor específico',
      requestModeDirectDesc: 'Elige un proveedor y envía la solicitud directamente.',
      requestModeOpenTitle: 'Solicitud abierta',
      requestModeOpenDesc: 'Publícala para que cualquier proveedor disponible pueda aceptarla.',
      requestModeAutoOpenNotice: 'No hay proveedores disponibles para asignación directa en este momento. Se activó automáticamente el modo de solicitud abierta.',
      requestModeOpenHint: 'Recomendado cuando hay alta demanda o necesitas al primer proveedor disponible.',
      selectedProviderLabel: 'Proveedor seleccionado',
      selectProviderFirst: 'Elige un proveedor de la lista para continuar.',
      selectProviderFirstButton: 'Selecciona primero un proveedor',
      requestSelectedProvider: 'Solicitar con el proveedor seleccionado',
      requestingProvider: 'Enviando solicitud...',
      requestOpenButton: 'Publicar solicitud abierta',
      requestingOpen: 'Publicando solicitud...',
      requestService: 'Solicitar servicio',
      selectParentCategory: 'Selecciona categoría principal',
      selectSubcategory: 'Selecciona subcategoría',
      selectService: 'Selecciona servicio',
      noSubcategoriesAvailable: 'Primero selecciona una categoría principal',
      noServicesAvailable: 'No hay servicios disponibles para esta subcategoría',
      requestServiceButton: 'Solicitar este servicio',
    },
    chat: {
      openChat: 'Chat',
      chatSubtitle: 'En línea',
      noMessagesYet: '¡Aún no hay mensajes. ¡Di hola!',
      messagePlaceholder: 'Escribe un mensaje…',
      sendMessage: 'Enviar',
      unknownUser: 'Usuario desconocido',
    },
    clientRequestService: {
      serviceNotFound: 'Servicio no encontrado.',
      locationRequiredError: 'La ubicación es obligatoria antes de enviar la solicitud.',
      title: 'Solicitar servicio',
      subtitle: 'Crea una solicitud y notifica a proveedores cercanos.',
      locationRequiredTitle: 'Ubicación requerida',
      locationRequiredDesc: 'Activa el GPS para ordenar proveedores por cercanía.',
      detectLocation: 'Detectar mi ubicación',
      serviceBadge: 'Servicio',
      serviceFallback: 'Hay proveedores profesionales listos cerca de ti.',
      describeLabel: 'Describe lo que necesitas',
      describePlaceholder: 'Incluye detalles clave, urgencia y requisitos',
      budgetLabel: 'Presupuesto (opcional)',
      budgetPlaceholder: 'ej. 35',
      invalidBudget: 'Ingresa un presupuesto válido.',
      addressLabel: 'Dirección / referencia',
      addressPlaceholder: 'Apartamento, calle, punto de referencia',
      currentLocation: 'Ubicación actual',
      waitingGps: 'Esperando acceso al GPS',
      sendRequest: 'Enviar solicitud',
      nearbyProviders: 'Proveedores cercanos',
      nearbyProvidersDesc: 'Los proveedores se ordenan por distancia y disponibilidad.',
      noProviders: 'No se encontraron proveedores en línea para este servicio cerca de tu ubicación.',
      providerLocationFallback: 'Ubicación disponible por GPS',
      noRatingsYet: 'Aún sin calificaciones',
      online: 'En línea',
      distanceUnavailable: 'Distancia no disponible',
    },
    clientRequestDetail: {
      serviceRequest: 'Solicitud de servicio',
      requestPrefix: 'Solicitud',
      noDescription: 'No hay descripción adicional.',
      provider: 'Proveedor',
      awaitingProvider: 'Esperando proveedor',
      providerFallback: 'Un proveedor cercano aceptará tu solicitud.',
      budget: 'Presupuesto',
      created: 'Fecha de creación',
      statusTimeline: 'Historial de estados',
      noStatusChanges: 'Aún no hay cambios de estado registrados.',
      requestInfo: 'Información de la solicitud',
      locationMap: 'Mapa de ubicación',
      address: 'Dirección',
      notProvided: 'No proporcionada',
      coordinates: 'Coordenadas',
      unavailable: 'No disponible',
      rateProvider: 'Calificar proveedor',
      noComment: 'Sin comentarios.',
      noRatingsYet: 'Aún sin calificaciones',
      shareExperience: 'Comparte tu experiencia',
      submitRating: 'Enviar calificación',
      ratingReminderTitle: 'Tu proveedor marcó este servicio como completado',
      ratingReminderDescription: 'Deja una calificación rápida para ayudar a otros clientes a elegir mejor.',
      ratingAvailableLater: 'La calificación estará disponible cuando la solicitud esté completada.',
      switchOpenTitle: '¿Necesitas una respuesta más rápida?',
      switchOpenDescription: 'Esta solicitud directa sigue pendiente. Publícala como solicitud abierta para que cualquier proveedor cercano pueda aceptarla.',
      switchOpenButton: 'Publicar como solicitud abierta',
      switchOpening: 'Publicando solicitud...',
      switchOpenSuccess: 'Tu solicitud ahora está abierta para proveedores cercanos.',
      switchOpenUnavailable: 'Esta solicitud ya no se puede cambiar a modo abierto.',
      switchOpenWaitHint: 'Si este proveedor no acepta en {{minutes}} minutos, podrás cambiar a modo de solicitud abierta.',
    },
    landing: {
      badge: 'Emparejamiento inteligente en minutos',
      headline: 'Encuentra ayuda local confiable con un flujo moderno y claro.',
      description:
        'Taskly conecta clientes con proveedores verificados para servicios del hogar, belleza y tareas diarias. Publica una solicitud, compara opciones y resuelve más rápido.',
      findService: 'Buscar servicio',
      becomeProvider: 'Ser proveedor',
      checklist: {
        noCard: 'Sin tarjeta de crédito',
        verifiedCommunity: 'Comunidad de proveedores verificados',
        securePlatform: 'Plataforma segura con roles',
        liveUpdates: 'Actualizaciones en tiempo real',
      },
      stats: {
        happyClients: 'Clientes felices',
        verifiedProviders: 'Proveedores verificados',
        serviceCategories: 'Categorías de servicio',
        citiesCovered: 'Ciudades cubiertas',
      },
      liveDemandPulse: 'Demanda en vivo',
      quickResponseTitle: 'Solicitudes atendidas rápido',
      quickResponseValue: 'Menos de 10 minutos en promedio.',
      features: {
        proximity: {
          title: 'Coincidencia por cercanía',
          description: 'Conecta con proveedores verificados cercanos en tiempo real.',
        },
        verified: {
          title: 'Proveedores verificados',
          description: 'Cada proveedor pasa por un proceso de revisión para tu seguridad.',
        },
        ratings: {
          title: 'Calificaciones reales',
          description: 'Opiniones de clientes reales para elegir al mejor profesional.',
        },
        fastResponse: {
          title: 'Respuesta rápida',
          description: 'Recibe respuestas de proveedores disponibles en minutos.',
        },
      },
      howWorksTitle: '¿Cómo funciona Taskly?',
      howWorksSubtitle: 'Un flujo de 3 pasos rápido y claro para móvil y escritorio.',
      steps: {
        browse: {
          title: 'Explora servicios',
          desc: 'Revisa categorías y elige exactamente lo que necesitas.',
        },
        send: {
          title: 'Envía solicitud',
          desc: 'Define detalles, presupuesto y ubicación en segundos.',
        },
        matched: {
          title: 'Recibe propuestas',
          desc: 'Proveedores cercanos aceptan y comienzan el trabajo rápido.',
        },
      },
      startToday: 'Empieza hoy',
      ctaTitle: 'Lanza tu primera solicitud en menos de dos minutos',
      ctaDescription:
        'Únete a clientes y proveedores que construyen confianza local con calificaciones transparentes y actualizaciones en vivo.',
      footer: 'Todos los derechos reservados.',
    },
    login: {
      subtitle: 'Inicia sesión en tu cuenta',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      passwordLabel: 'Contraseña',
      hidePassword: 'Ocultar contraseña',
      showPassword: 'Mostrar contraseña',
      submit: 'Iniciar sesión',
      noAccount: '¿No tienes cuenta?',
      createOne: 'Crear una',
      signInFailed: 'No se pudo iniciar sesión',
      emailNotConfirmed: 'Correo no confirmado',
      emailNotConfirmedDesc: 'Debes verificar tu correo antes de iniciar sesión.',
      verifyNow: 'Verificar ahora',
    },
    register: {
      subtitle: 'Crea tu cuenta',
      iam: 'Yo soy...',
      roleClientLabel: 'Cliente',
      roleClientDescription: 'Necesito contratar proveedores de servicios',
      roleProviderLabel: 'Proveedor',
      roleProviderDescription: 'Ofrezco servicios a clientes',
      fullNameLabel: 'Nombre completo',
      fullNamePlaceholder: 'Juan Perez',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      passwordTooShort: 'La contraseña debe tener mínimo 6 caracteres.',
      submit: 'Crear cuenta',
      alreadyAccount: '¿Ya tienes cuenta?',
      signIn: 'Iniciar sesión',
      successTitle: 'Revisa tu correo',
      successDescription:
        'Enviamos un enlace de confirmacion a {{email}}. Abre el enlace para activar tu cuenta y luego inicia sesion.',
      goToSignIn: 'Ir a iniciar sesion',
      registrationFailed: 'No se pudo completar el registro',
    },
    verifyEmail: {
      title: 'Verifica tu correo',
      description: 'Enviamos un correo de confirmación. Usa el código de 6 dígitos o abre el enlace enviado a',
      verify: 'Verificar cuenta',
      invalidCode: 'El código o el enlace de confirmación es inválido o expiró. Inténtalo de nuevo.',
      noCode: 'No recibiste el correo?',
      resend: 'Reenviar correo',
      resendIn: 'Reenviar en',
      wrongEmail: 'Correo incorrecto?',
      registerAgain: 'Registrarme de nuevo',
    },
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveTranslation(language: Language, key: string): string | undefined {
  const segments = key.split('.');
  let cursor: TranslationNode | undefined = translations[language];

  for (const segment of segments) {
    if (!cursor || typeof cursor === 'string') {
      return undefined;
    }

    cursor = cursor[segment];
  }

  return typeof cursor === 'string' ? cursor : undefined;
}

function getDefaultLanguage(): Language {
  if (typeof window === 'undefined') return 'es';

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved === 'es' || saved === 'en') {
    return saved;
  }

  return 'es';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getDefaultLanguage);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      document.documentElement.lang = nextLanguage;
    }
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string, fallback?: string) => {
        const translated = resolveTranslation(language, key);
        if (translated) return translated;

        const fallbackEnglish = resolveTranslation('en', key);
        if (fallbackEnglish) return fallbackEnglish;

        return fallback ?? key;
      },
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
