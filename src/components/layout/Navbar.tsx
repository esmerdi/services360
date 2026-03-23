import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
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
import LanguageSwitcher from '../common/LanguageSwitcher';
import UserAvatar from '../common/UserAvatar';

interface NavItem {
  label: string;
  to: string;
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
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const quickLinks = useMemo(() => navItems.slice(0, 2), [navItems]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!profileMenuRef.current) return;

      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
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
          'fixed right-0 top-0 z-40 hidden h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm md:flex',
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

          <div className="flex items-center gap-2" ref={profileMenuRef}>
            <LanguageSwitcher mode="switch" compact />

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:text-slate-900 hover:shadow-md"
              aria-label={t('common.notifications')}
              title={t('common.notifications')}
            >
              <Bell className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
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
              <div className="absolute right-0 top-12 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
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
      </header>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex h-16 items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-8 flex items-center justify-center">
              <img src="/taskly-logo.svg" alt="Taskly logo" className="h-6 w-6 object-contain drop-shadow-[0_3px_6px_rgba(15,23,42,0.25)]" />
            </div>
            <span className="font-display text-lg text-slate-900">Taskly</span>
          </Link>

          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{translatedTitle}</span>

          <LanguageSwitcher compact />

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost p-2"
              aria-label={t('common.notifications')}
              title={t('common.notifications')}
            >
              <Bell className="h-5 w-5" />
            </button>
              <UserAvatar
                avatarUrl={user?.avatar_url}
                name={user?.full_name || user?.email}
                className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center flex-shrink-0"
                fallbackClassName="text-white text-[10px] font-semibold"
              />
            <button
              className="btn-ghost p-2"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t('common.toggleMenu')}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 flex-col border-r border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="border-b border-slate-200 px-5 py-5">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 flex items-center justify-center">
              <img src="/taskly-logo.svg" alt="Taskly logo" className="h-7 w-7 object-contain drop-shadow-[0_4px_8px_rgba(15,23,42,0.25)]" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg leading-none text-slate-900">Taskly</p>
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
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1">
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
