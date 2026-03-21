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
      pendingReviewDescription: 'completed request(s) waiting for your feedback.',
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
      searchPlaceholder: 'Search services, categories or keywords',
      allCategories: 'All categories',
      categoryFallback: 'Browse related services and providers near you.',
      noServices: 'No services match your filters.',
      generalCategory: 'General',
      serviceFallback: 'Trusted nearby professionals available for this service.',
      providerRatingLabel: 'Avg. rating of providers',
      providerRatingNote: 'Average across providers offering this service',
      noRatingsYet: 'No ratings yet',
      providersAvailable: 'providers available',
      requestService: 'Request Service',
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
      created: 'Created',
      statusTimeline: 'Status Timeline',
      noStatusChanges: 'No status changes recorded yet.',
      requestInfo: 'Request Info',
      address: 'Address',
      notProvided: 'Not provided',
      coordinates: 'Coordinates',
      unavailable: 'Unavailable',
      rateProvider: 'Rate Provider',
      noComment: 'No comment provided.',
      noRatingsYet: 'No ratings yet',
      shareExperience: 'Share your experience',
      submitRating: 'Submit rating',
      ratingReminderTitle: 'Your provider marked this service as completed',
      ratingReminderDescription: 'Leave a quick rating to help other clients choose with confidence.',
      ratingAvailableLater: 'Ratings become available after the request is completed.',
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
      signOut: 'Cerrar sesion',
      signIn: 'Iniciar sesion',
      createAccount: 'Crear cuenta',
      welcomeBack: 'Bienvenido de nuevo',
      controlPanel: 'Panel de control',
      currentView: 'Vista actual',
      openProfileMenu: 'Abrir menu de perfil',
      toggleMenu: 'Abrir menu',
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
      categories: 'Categorias',
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
      subscription: 'Suscripcion',
    },
    views: {
      Dashboard: 'Panel',
      'Admin Dashboard': 'Panel administrador',
      Users: 'Usuarios',
      Categories: 'Categorias',
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
      Subscription: 'Suscripcion',
    },
    myRequests: {
      title: 'Mis solicitudes',
      subtitle: 'Haz seguimiento del progreso, proveedores y precios.',
      searchPlaceholder: 'Buscar por servicio, proveedor o direccion',
      pendingReviewTitle: 'Tienes calificaciones pendientes',
      pendingReviewDescription: 'solicitud(es) completadas esperando tu opinion.',
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
        addressPending: 'Direccion pendiente',
        awaitingAcceptance: 'En espera de aceptacion',
        noRatingsYet: 'Aun sin calificaciones',
        rateNow: 'Calificar ahora',
      },
    },
    clientDashboard: {
      welcome: 'Bienvenido de nuevo,',
      there: 'amigo',
      subtitle: 'Que servicio necesitas hoy?',
      locationMissingTitle: 'Ubicacion no detectada',
      locationMissingDesc: 'Activa el acceso a ubicacion para encontrar proveedores cercanos.',
      detectLocation: 'Detectar ubicacion',
      locationDetected: 'Ubicacion detectada - los proveedores cercanos veran tus solicitudes.',
      findServiceTitle: 'Buscar servicio',
      findServiceDesc: 'Explora categorias y agenda un proveedor cerca de ti.',
      browseNow: 'Explorar ahora',
      stats: {
        total: 'Total',
        pending: 'Pendientes',
        completed: 'Completadas',
      },
      recentRequests: 'Solicitudes recientes',
      viewAll: 'Ver todas',
      noRequests: 'Aun no tienes solicitudes.',
      bookService: 'Solicitar un servicio',
    },
    clientBrowse: {
      title: 'Explorar servicios',
      subtitle: 'Explora categorias y solicita proveedores cercanos.',
      searchPlaceholder: 'Buscar servicios, categorias o palabras clave',
      allCategories: 'Todas las categorias',
      categoryFallback: 'Explora servicios relacionados y proveedores cercanos.',
      noServices: 'Ningun servicio coincide con tus filtros.',
      generalCategory: 'General',
      serviceFallback: 'Profesionales confiables cercanos disponibles para este servicio.',
      providerRatingLabel: 'Calificación prom. de proveedores',
      providerRatingNote: 'Promedio entre los proveedores que ofrecen este servicio',
      noRatingsYet: 'Aun sin calificaciones',
      providersAvailable: 'proveedores disponibles',
      requestService: 'Solicitar servicio',
    },
    clientRequestService: {
      serviceNotFound: 'Servicio no encontrado.',
      locationRequiredError: 'La ubicacion es obligatoria antes de enviar la solicitud.',
      title: 'Solicitar servicio',
      subtitle: 'Crea una solicitud y notifica a proveedores cercanos.',
      locationRequiredTitle: 'Ubicacion requerida',
      locationRequiredDesc: 'Activa el GPS para ordenar proveedores por cercania.',
      detectLocation: 'Detectar mi ubicacion',
      serviceBadge: 'Servicio',
      serviceFallback: 'Hay proveedores profesionales listos cerca de ti.',
      describeLabel: 'Describe lo que necesitas',
      describePlaceholder: 'Incluye detalles clave, urgencia y requisitos',
      budgetLabel: 'Presupuesto (opcional)',
      budgetPlaceholder: 'ej. 35',
      invalidBudget: 'Ingresa un presupuesto valido.',
      addressLabel: 'Direccion / referencia',
      addressPlaceholder: 'Apartamento, calle, punto de referencia',
      currentLocation: 'Ubicacion actual',
      waitingGps: 'Esperando acceso al GPS',
      sendRequest: 'Enviar solicitud',
      nearbyProviders: 'Proveedores cercanos',
      nearbyProvidersDesc: 'Los proveedores se ordenan por distancia y disponibilidad.',
      noProviders: 'No se encontraron proveedores en linea para este servicio cerca de tu ubicacion.',
      providerLocationFallback: 'Ubicacion disponible por GPS',
      noRatingsYet: 'Aun sin calificaciones',
      online: 'En linea',
      distanceUnavailable: 'Distancia no disponible',
    },
    clientRequestDetail: {
      serviceRequest: 'Solicitud de servicio',
      requestPrefix: 'Solicitud',
      noDescription: 'No hay descripcion adicional.',
      provider: 'Proveedor',
      awaitingProvider: 'Esperando proveedor',
      providerFallback: 'Un proveedor cercano aceptara tu solicitud.',
      budget: 'Presupuesto',
      created: 'Creada',
      statusTimeline: 'Historial de estados',
      noStatusChanges: 'Aun no hay cambios de estado registrados.',
      requestInfo: 'Informacion de la solicitud',
      address: 'Direccion',
      notProvided: 'No proporcionada',
      coordinates: 'Coordenadas',
      unavailable: 'No disponible',
      rateProvider: 'Calificar proveedor',
      noComment: 'Sin comentario.',
      noRatingsYet: 'Aun sin calificaciones',
      shareExperience: 'Comparte tu experiencia',
      submitRating: 'Enviar calificacion',
      ratingReminderTitle: 'Tu proveedor marco este servicio como completado',
      ratingReminderDescription: 'Deja una calificacion rapida para ayudar a otros clientes a elegir mejor.',
      ratingAvailableLater: 'La calificacion estara disponible cuando la solicitud este completada.',
    },
    landing: {
      badge: 'Emparejamiento inteligente en minutos',
      headline: 'Encuentra ayuda local confiable con un flujo moderno y claro.',
      description:
        'Taskly conecta clientes con proveedores verificados para servicios del hogar, belleza y tareas diarias. Publica una solicitud, compara opciones y resuelve mas rapido.',
      findService: 'Buscar servicio',
      becomeProvider: 'Ser proveedor',
      checklist: {
        noCard: 'Sin tarjeta de credito',
        verifiedCommunity: 'Comunidad de proveedores verificados',
        securePlatform: 'Plataforma segura con roles',
        liveUpdates: 'Actualizaciones en tiempo real',
      },
      stats: {
        happyClients: 'Clientes felices',
        verifiedProviders: 'Proveedores verificados',
        serviceCategories: 'Categorias de servicio',
        citiesCovered: 'Ciudades cubiertas',
      },
      liveDemandPulse: 'Demanda en vivo',
      quickResponseTitle: 'Solicitudes atendidas rapido',
      quickResponseValue: 'Menos de 10 minutos en promedio.',
      features: {
        proximity: {
          title: 'Coincidencia por cercania',
          description: 'Conecta con proveedores verificados cercanos en tiempo real.',
        },
        verified: {
          title: 'Proveedores verificados',
          description: 'Cada proveedor pasa por un proceso de revision para tu seguridad.',
        },
        ratings: {
          title: 'Calificaciones reales',
          description: 'Opiniones de clientes reales para elegir al mejor profesional.',
        },
        fastResponse: {
          title: 'Respuesta rapida',
          description: 'Recibe respuestas de proveedores disponibles en minutos.',
        },
      },
      howWorksTitle: 'Como funciona Taskly',
      howWorksSubtitle: 'Un flujo de 3 pasos rapido y claro para movil y escritorio.',
      steps: {
        browse: {
          title: 'Explora servicios',
          desc: 'Revisa categorias y elige exactamente lo que necesitas.',
        },
        send: {
          title: 'Envia solicitud',
          desc: 'Define detalles, presupuesto y ubicacion en segundos.',
        },
        matched: {
          title: 'Recibe propuestas',
          desc: 'Proveedores cercanos aceptan y comienzan el trabajo rapido.',
        },
      },
      startToday: 'Empieza hoy',
      ctaTitle: 'Lanza tu primera solicitud en menos de dos minutos',
      ctaDescription:
        'Unete a clientes y proveedores que construyen confianza local con calificaciones transparentes y actualizaciones en vivo.',
      footer: 'Todos los derechos reservados.',
    },
    login: {
      subtitle: 'Inicia sesion en tu cuenta',
      emailLabel: 'Correo electronico',
      emailPlaceholder: 'tu@correo.com',
      passwordLabel: 'Contrasena',
      hidePassword: 'Ocultar contrasena',
      showPassword: 'Mostrar contrasena',
      submit: 'Iniciar sesion',
      noAccount: 'No tienes cuenta?',
      createOne: 'Crear una',
      signInFailed: 'No se pudo iniciar sesion',
      emailNotConfirmed: 'Correo no confirmado',
      emailNotConfirmedDesc: 'Debes verificar tu correo antes de iniciar sesion.',
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
      emailLabel: 'Correo electronico',
      emailPlaceholder: 'tu@correo.com',
      passwordLabel: 'Contrasena',
      passwordPlaceholder: 'Minimo 6 caracteres',
      passwordTooShort: 'La contrasena debe tener minimo 6 caracteres.',
      submit: 'Crear cuenta',
      alreadyAccount: 'Ya tienes cuenta?',
      signIn: 'Iniciar sesion',
      successTitle: 'Revisa tu correo',
      successDescription:
        'Enviamos un enlace de confirmacion a {{email}}. Abre el enlace para activar tu cuenta y luego inicia sesion.',
      goToSignIn: 'Ir a iniciar sesion',
      registrationFailed: 'No se pudo completar el registro',
    },
    verifyEmail: {
      title: 'Verifica tu correo',
      description: 'Enviamos un correo de confirmacion. Usa el codigo de 6 digitos o abre el enlace enviado a',
      verify: 'Verificar cuenta',
      invalidCode: 'El codigo o el enlace de confirmacion es invalido o expiro. Intentalo de nuevo.',
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
