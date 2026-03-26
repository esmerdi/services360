import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Layers3,
  Wrench,
  ClipboardList,
  CreditCard,
  Search,
  Briefcase,
  UserCircle,
  Compass,
  Bell,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLocation as useCurrentLocation } from '../../context/LocationContext';
import { supabase } from '../../lib/supabase';
import LanguageSwitcher from '../common/LanguageSwitcher';
import UserAvatar from '../common/UserAvatar';

interface NavItem {
  label: string;
  to: string;
}

interface NavbarNotification {
  id: string;
  requestId: string;
  title: string;
  description: string;
  to: string;
  createdAt: string;
}

interface NavbarProps {
  navItems: NavItem[];
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

function getNavIcon(path: string, label: string): LucideIcon {
  const normalizedPath = path.toLowerCase();
  const normalizedLabel = label.toLowerCase();

  if (normalizedPath === '/admin' || normalizedPath === '/client' || normalizedPath === '/provider') return LayoutDashboard;
  if (normalizedPath.includes('/users')) return Users;
  if (normalizedPath.includes('/categories')) return Layers3;
  if (normalizedPath.includes('/services')) return Wrench;
  if (normalizedPath.includes('/requests')) return ClipboardList;
  if (normalizedPath.includes('/plans') || normalizedPath.includes('/subscription')) return CreditCard;
  if (normalizedPath.includes('/browse')) return Search;
  if (normalizedPath.includes('/jobs')) return Briefcase;
  if (normalizedPath.includes('/profile')) return UserCircle;
  if (normalizedPath.includes('/nearby')) return Compass;

  if (normalizedLabel.includes('dashboard')) return LayoutDashboard;
  if (normalizedLabel.includes('user')) return Users;
  if (normalizedLabel.includes('categor')) return Layers3;
  if (normalizedLabel.includes('service')) return Wrench;
  if (normalizedLabel.includes('request')) return ClipboardList;
  if (normalizedLabel.includes('plan') || normalizedLabel.includes('subscription')) return CreditCard;
  if (normalizedLabel.includes('browse')) return Search;
  if (normalizedLabel.includes('job')) return Briefcase;
  if (normalizedLabel.includes('profile')) return UserCircle;
  if (normalizedLabel.includes('nearby')) return Compass;

  return FileText;
}

function getNavTranslationKey(label: string): string | null {
  const map: Record<string, string> = {
    Dashboard: 'nav.dashboard',
    'Admin Dashboard': 'nav.adminDashboard',
    Users: 'nav.users',
    Categories: 'nav.categories',
    Services: 'nav.services',
    Requests: 'nav.requests',
    Plans: 'nav.plans',
    Browse: 'nav.browse',
    'Browse Services': 'nav.browseServices',
    'My Requests': 'nav.myRequests',
    'Request Service': 'nav.requestService',
    'Request Details': 'nav.requestDetails',
    'Provider Dashboard': 'nav.providerDashboard',
    'Nearby Requests': 'nav.nearbyRequests',
    'My Jobs': 'nav.myJobs',
    'Provider Profile': 'nav.providerProfile',
    Subscription: 'nav.subscription',
  };

  return map[label] ?? null;
}

export default function Navbar({ navItems, title, sidebarOpen, onToggleSidebar }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const { coords } = useCurrentLocation();
  const location = useRouterLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NavbarNotification[]>([]);
  const promptedCompletedRequestsRef = useRef<Set<string>>(new Set());

  const quickLinks = useMemo(() => navItems.slice(0, 2), [navItems]);

  const handleNotificationClick = useCallback((item: NavbarNotification) => {
    setNotifications((current) => current.filter((entry) => entry.id !== item.id));
    setNotificationsOpen(false);
    setMobileOpen(false);
    navigate(item.to);
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const currentUser = user;

    async function maybePromptClientRating(requestId: string) {
      if (currentUser.role !== 'client') return;
      if (!requestId || promptedCompletedRequestsRef.current.has(requestId)) return;

      const { data: existingRating, error: existingRatingError } = await supabase
        .from('ratings')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle();

      if (existingRatingError || existingRating) return;

      promptedCompletedRequestsRef.current.add(requestId);

      if (location.pathname === `/client/requests/${requestId}`) return;

      navigate(`/client/requests/${requestId}?openRating=1`);
    }

    async function loadNotifications() {
      const nextNotifications: NavbarNotification[] = [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          request_id,
          content,
          created_at,
          sender_id,
          read_at,
          request:service_requests!messages_request_id_fkey(
            id,
            client_id,
            provider_id,
            service:services(name),
            client:users!service_requests_client_id_fkey(full_name, email),
            provider:users!service_requests_provider_id_fkey(full_name, email)
          )
        `)
        .neq('sender_id', currentUser.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        const rows = ((data ?? []) as unknown[]) as Array<{
          id?: string;
          request_id?: string;
          content?: string;
          created_at?: string;
          request?: unknown;
        }>;

        const mappedMessages = rows.map((item) => {
          const requestRaw = Array.isArray(item.request) ? item.request[0] : item.request;
          const requestData = (requestRaw ?? null) as {
            id?: string;
            client?: unknown;
            provider?: unknown;
          } | null;

          const clientRaw = requestData?.client;
          const providerRaw = requestData?.provider;
          const clientData = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as { full_name?: string | null; email?: string | null } | undefined;
          const providerData = (Array.isArray(providerRaw) ? providerRaw[0] : providerRaw) as { full_name?: string | null; email?: string | null } | undefined;

          const requestId = item.request_id ?? '';
          const content = item.content ?? '';

          const senderName = currentUser.role === 'provider'
            ? clientData?.full_name || clientData?.email || t('roles.client')
            : providerData?.full_name || providerData?.email || t('roles.provider');

          const titleText = t('common.newMessageFrom').replace('{{name}}', senderName);
          const descriptionText = content.length > 90 ? `${content.slice(0, 90)}...` : content;

          const to = currentUser.role === 'client'
            ? `/client/requests/${requestId}?openChat=1`
            : currentUser.role === 'provider'
              ? `/provider/jobs?openChat=1&requestId=${requestId}`
              : '/admin/requests';

          return {
            id: item.id ?? `${requestId}-${content.slice(0, 12)}`,
            requestId,
            title: titleText,
            description: descriptionText,
            to,
            createdAt: item.created_at ?? new Date().toISOString(),
          };
        }).filter((item) => Boolean(item.requestId));

        nextNotifications.push(...mappedMessages);
      }

      if (currentUser.role === 'provider') {
        let providerCoords = coords;

        if (!providerCoords) {
          const { data: providerLocation, error: providerLocationError } = await supabase
            .from('locations')
            .select('latitude, longitude')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (!providerLocationError && providerLocation) {
            providerCoords = {
              latitude: Number(providerLocation.latitude),
              longitude: Number(providerLocation.longitude),
            };
          }
        }

        if (providerCoords) {
          const { data: nearbyRows, error: nearbyRowsError } = await supabase.rpc('get_nearby_requests', {
            provider_lat: providerCoords.latitude,
            provider_lon: providerCoords.longitude,
            p_provider_id: currentUser.id,
            radius_km: 20,
          });

          if (!nearbyRowsError) {
            const nearbyCount = ((nearbyRows as Array<{ id: string }> | null) ?? []).length;

            if (nearbyCount > 0) {
              nextNotifications.push({
                id: `provider-nearby-${currentUser.id}`,
                requestId: 'provider-nearby',
                title: t('common.nearbyRequestsTitle'),
                description: t('common.nearbyRequestsDescription').replace('{{count}}', String(nearbyCount)),
                to: '/provider/nearby',
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }

      nextNotifications.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setNotifications(nextNotifications.slice(0, 20));
    }

    void loadNotifications();

    const channel = supabase
      .channel(`navbar-notifications-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void loadNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, (payload) => {
        if (currentUser.role === 'client' && payload.eventType === 'UPDATE') {
          const updated = payload.new as Partial<{ id: string; client_id: string; status: string }>;
          if (updated?.id && updated.client_id === currentUser.id && updated.status === 'completed') {
            void maybePromptClientRating(updated.id);
          }
        }

        void loadNotifications();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coords, location.pathname, navigate, t, user]);

  const unreadCount = notifications.length;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (!target.closest('[data-profile-menu]')) {
        setProfileMenuOpen(false);
      }

      if (!target.closest('[data-notifications-menu]')) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const translatedTitle = t(`views.${title}`, title);
  const translatedRole = user?.role ? t(`roles.${user.role}`, user.role) : '';

  const getTranslatedLabel = (label: string) => {
    const key = getNavTranslationKey(label);
    return key ? t(key) : label;
  };

  return (
    <>
      <header
        className={clsx(
          'fixed right-0 top-0 z-[1200] hidden h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm md:flex',
          sidebarOpen ? 'left-72' : 'left-0'
        )}
      >
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:text-slate-900 hover:shadow-md"
            aria-label={t('common.toggleMenu')}
            title={t('common.toggleMenu')}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher mode="switch" compact />

            <div className="relative" data-notifications-menu>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileMenuOpen(false);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:text-slate-900 hover:shadow-md"
                aria-label={t('common.notifications')}
                title={t('common.notifications')}
                aria-haspopup="menu"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen && (
                <div className="fixed left-2 right-2 top-20 z-50 w-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 md:absolute md:left-auto md:right-0 md:top-12 md:mt-2 md:w-80">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{t('common.notifications')}</p>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto px-4 py-3 md:max-h-80">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-slate-500">{t('common.noNotifications')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {notifications.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => handleNotificationClick(item)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50"
                            >
                              <p className="text-sm font-medium text-slate-900">{item.title}</p>
                              {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" data-profile-menu>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm transition-all hover:shadow-md"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                aria-label={t('common.openProfileMenu')}
              >
                <UserAvatar
                  avatarUrl={user?.avatar_url}
                  name={user?.full_name || user?.email}
                  className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0"
                  fallbackClassName="text-white text-xs font-semibold"
                />
                <ChevronDown
                  className={clsx(
                    'h-4 w-4 text-slate-500 transition-transform',
                    profileMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 z-[1300] mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">{t('common.welcomeBack')}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <UserAvatar
                      avatarUrl={user?.avatar_url}
                      name={user?.full_name || user?.email}
                      className="h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-sm"
                      fallbackClassName="text-white text-sm font-semibold"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-slate-900">{user?.full_name || user?.email}</p>
                      <p className="mt-0.5 text-sm text-slate-500 capitalize">{translatedRole}</p>
                    </div>
                  </div>
                </div>

                <div className="px-2 py-2">
                  {quickLinks.map((item) => {
                    const Icon = getNavIcon(item.to, item.label);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span className="truncate">{getTranslatedLabel(item.label)}</span>
                      </Link>
                    );
                  })}
                                {user?.role !== 'admin' && (
                                  <div className="border-t border-slate-100 px-2 py-2">
                                    <Link
                                      to={user?.role === 'client' ? '/client/profile' : '/provider/profile'}
                                      onClick={() => setProfileMenuOpen(false)}
                                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                    >
                                      <UserCircle className="h-4 w-4 text-slate-500" />
                                      <span className="truncate">{getTranslatedLabel('Profile')}</span>
                                    </Link>
                                  </div>
                                )}
                </div>

                <div className="border-t border-slate-200 px-2 py-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common.signOut')}
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-[1200] border-b border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex min-h-16 items-center gap-2 px-3 py-2.5">
          <Link to="/" className="flex min-w-0 max-w-[140px] items-center gap-1.5 flex-shrink-0">
            <div className="h-7 w-7 flex shrink-0 items-center justify-center">
              <img src="/zippy-logo.png?v=2" alt="ZippyGo logo" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-base leading-none text-slate-900 min-[390px]:text-lg">Zippy<span className="font-bold">Go</span></p>
              <p className="mt-0.5 hidden truncate text-[9px] uppercase tracking-[0.12em] text-slate-500 min-[360px]:block min-[390px]:text-[10px]">{t('common.controlPanel')}</p>
            </div>
          </Link>

          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{translatedTitle}</span>

          <LanguageSwitcher mode="list" compact />

          <div className="flex items-center gap-2">
            <div className="relative" data-notifications-menu>
              <button
                type="button"
                className="btn-ghost p-2"
                aria-label={t('common.notifications')}
                title={t('common.notifications')}
                aria-haspopup="menu"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((v) => !v)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen && (
                <div className="fixed left-2 right-2 top-20 z-50 w-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{t('common.notifications')}</p>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-slate-500">{t('common.noNotifications')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {notifications.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => handleNotificationClick(item)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50"
                            >
                              <p className="text-sm font-medium text-slate-900">{item.title}</p>
                              {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileOpen((v) => !v);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm transition-all hover:shadow-md"
              aria-label={t('common.openProfileMenu')}
              aria-expanded={mobileOpen}
            >
              <UserAvatar
                avatarUrl={user?.avatar_url}
                name={user?.full_name || user?.email}
                className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0"
                fallbackClassName="text-white text-[10px] font-semibold"
              />
              <ChevronDown
                className={clsx(
                  'h-4 w-4 text-slate-500 transition-transform',
                  mobileOpen && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 flex-col border-r border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="border-b border-slate-200 px-5 py-5">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 flex items-center justify-center">
              <img src="/zippy-logo.png?v=2" alt="ZippyGo logo" className="h-7 w-7 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg leading-none text-slate-900">Zippy<span className="font-bold">Go</span></p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{t('common.controlPanel')}</p>
            </div>
          </Link>
        </div>

        <div className="px-5 pt-5">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{t('common.currentView')}</p>
          <p className="mt-1 font-display text-lg text-slate-900">{translatedTitle}</p>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = getNavIcon(item.to, item.label);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sky-50 text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {getTranslatedLabel(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4" />
      </aside>
      )}

      {mobileOpen && (
        <div className="fixed left-0 right-0 top-16 z-[1300] border-b border-slate-200 bg-white px-4 py-3 shadow-lg md:hidden space-y-1">
          {navItems.map((item) => (
            (() => {
              const Icon = getNavIcon(item.to, item.label);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    location.pathname === item.to
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {getTranslatedLabel(item.label)}
                </Link>
              );
            })()
          ))}

          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="truncate text-sm font-medium text-slate-900">{user?.full_name || user?.email}</p>
            <p className="mt-0.5 text-xs text-slate-500 capitalize">{translatedRole}</p>
            <button onClick={handleSignOut} className="btn-secondary mt-3 w-full justify-center">
              <LogOut className="h-4 w-4" />
              {t('common.signOut')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
