import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, ClipboardList, CheckCircle2,
  Clock, DollarSign,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="mt-3">
        <p className="font-display text-2xl text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { language } = useI18n();
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

  const es = language === 'es';

  return (
    <Layout navItems={ADMIN_NAV} title="Admin Dashboard">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50 p-6">
        <h1 className="font-display text-3xl text-slate-900">{es ? 'Panel' : 'Dashboard'}</h1>
        <p className="text-slate-600 mt-2">{es ? 'Resumen de la plataforma y metricas clave' : 'Platform overview and key metrics'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              label={es ? 'Usuarios totales' : 'Total Users'}
              value={metrics.totalUsers}
              icon={Users}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              label={es ? 'Clientes totales' : 'Total Clients'}
              value={metrics.totalClients}
              icon={Users}
              color="text-cyan-600"
              bgColor="bg-cyan-50"
            />
            <StatCard
              label={es ? 'Proveedores totales' : 'Total Providers'}
              value={metrics.totalProviders}
              icon={Briefcase}
              color="text-sky-700"
              bgColor="bg-sky-50"
            />
            <StatCard
              label={es ? 'Ingresos de la plataforma' : 'Platform Revenue'}
              value={formatCurrency(metrics.totalRevenue, language)}
              icon={DollarSign}
              color="text-emerald-700"
              bgColor="bg-emerald-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label={es ? 'Solicitudes totales' : 'Total Requests'}
              value={metrics.totalRequests}
              icon={ClipboardList}
              color="text-slate-700"
              bgColor="bg-slate-100"
            />
            <StatCard
              label={es ? 'Solicitudes pendientes' : 'Pending Requests'}
              value={metrics.pendingRequests}
              icon={Clock}
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
            <StatCard
              label={es ? 'Solicitudes completadas' : 'Completed Requests'}
              value={metrics.completedRequests}
              icon={CheckCircle2}
              color="text-emerald-700"
              bgColor="bg-emerald-50"
            />
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl text-slate-900 mb-4">{es ? 'Acciones rapidas' : 'Quick Actions'}</h2>
            <div className="flex flex-wrap gap-3">
              {ADMIN_NAV.slice(1).map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  className="btn-secondary text-sm"
                >
                  {es ? 'Gestionar' : 'Manage'} {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
