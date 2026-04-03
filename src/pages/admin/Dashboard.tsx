import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, ClipboardList, CheckCircle2,
  Clock, DollarSign, Sparkles,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import { getAdminManagementText } from '../../i18n/adminManagementText';
import { formatCurrency } from '../../utils/helpers';
import type { DashboardMetrics } from '../../types';

const ADMIN_NAV = [
  { label: 'Dashboard',  to: '/admin' },
  { label: 'Users',      to: '/admin/users' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Services',   to: '/admin/services' },
  { label: 'Requests',   to: '/admin/requests' },
  { label: 'Plans',      to: '/admin/plans' },
];

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor} flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { language } = useI18n();
  const text = getAdminManagementText(language).dashboard;
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      const [usersRes, requestsRes] = await Promise.all([
        supabase.from('users').select('role'),
        supabase.from('service_requests').select('status, price'),
      ]);

      const users = usersRes.data ?? [];
      const requests = requestsRes.data ?? [];

      const completed = requests.filter((r) => r.status === 'completed');
      const totalRevenue = completed.reduce(
        (sum, r) => sum + (r.price ?? 0),
        0
      );

      setMetrics({
        totalUsers:        users.length,
        totalClients:      users.filter((u) => u.role === 'client').length,
        totalProviders:    users.filter((u) => u.role === 'provider').length,
        totalRequests:     requests.length,
        pendingRequests:   requests.filter((r) => r.status === 'pending').length,
        completedRequests: completed.length,
        totalRevenue,
      });
      setLoading(false);
    }
    fetchMetrics();
  }, []);

  return (
    <Layout navItems={ADMIN_NAV} title="Admin Dashboard">
      <div className="mb-7 rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {text.badge}
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          {text.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 md:text-base">
          {text.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : metrics && (
        <>
          <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={text.totalUsers}
              value={metrics.totalUsers}
              icon={Users}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              label={text.totalClients}
              value={metrics.totalClients}
              icon={Users}
              color="text-cyan-600"
              bgColor="bg-cyan-50"
            />
            <StatCard
              label={text.totalProviders}
              value={metrics.totalProviders}
              icon={Briefcase}
              color="text-sky-700"
              bgColor="bg-sky-50"
            />
            <StatCard
              label={text.platformRevenue}
              value={formatCurrency(metrics.totalRevenue, language)}
              icon={DollarSign}
              color="text-emerald-700"
              bgColor="bg-emerald-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label={text.totalRequests}
              value={metrics.totalRequests}
              icon={ClipboardList}
              color="text-slate-700"
              bgColor="bg-slate-100"
            />
            <StatCard
              label={text.pendingRequests}
              value={metrics.pendingRequests}
              icon={Clock}
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
            <StatCard
              label={text.completedRequests}
              value={metrics.completedRequests}
              icon={CheckCircle2}
              color="text-emerald-700"
              bgColor="bg-emerald-50"
            />
          </div>

          <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{text.quickActions}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_NAV.slice(1).map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className="btn-secondary justify-center text-sm"
                >
                  {text.manage} {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
