import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatusBadge from '../../components/common/StatusBadge';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import { formatDateTime, formatCurrency } from '../../utils/helpers';
import type { ServiceRequest, RequestStatus } from '../../types';

const ADMIN_NAV = [
  { label: 'Dashboard',  to: '/admin' },
  { label: 'Users',      to: '/admin/users' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Services',   to: '/admin/services' },
  { label: 'Requests',   to: '/admin/requests' },
  { label: 'Plans',      to: '/admin/plans' },
];

export default function AdminRequests() {
  const { language } = useI18n();
  const [requests, setRequests]     = useState<ServiceRequest[]>([]);
  const [filtered, setFiltered]     = useState<ServiceRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('service_requests')
        .select(`
          *,
          client:users!service_requests_client_id_fkey(id, full_name, email),
          provider:users!service_requests_provider_id_fkey(id, full_name, email),
          service:services(id, name)
        `)
        .order('created_at', { ascending: false });

      if (err) setError(err.message);
      else setRequests((data as ServiceRequest[]) ?? []);
      setLoading(false);
    }
    fetchRequests();
  }, []);

  useEffect(() => {
    let result = requests;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.client?.full_name?.toLowerCase().includes(q) ||
          r.client?.email?.toLowerCase().includes(q) ||
          r.service?.name?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [requests, statusFilter, search]);

  const es = language === 'es';
  const statusOptions = [
    { value: 'all', label: es ? 'Todos' : 'All' },
    { value: 'pending', label: es ? 'Pendiente' : 'Pending' },
    { value: 'accepted', label: es ? 'Aceptada' : 'Accepted' },
    { value: 'in_progress', label: es ? 'En progreso' : 'In Progress' },
    { value: 'completed', label: es ? 'Completada' : 'Completed' },
    { value: 'cancelled', label: es ? 'Cancelada' : 'Cancelled' },
  ];

  return (
    <Layout navItems={ADMIN_NAV} title="Requests">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">{es ? 'Solicitudes de servicio' : 'Service Requests'}</h1>
          <p className="page-subtitle">{requests.length} {es ? 'solicitudes en total' : 'total requests'}</p>
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          className="input pl-9"
          placeholder={es ? 'Buscar por cliente, servicio o direccion...' : 'Search by client, service or address...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{es ? 'Servicio' : 'Service'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{es ? 'Cliente' : 'Client'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">{es ? 'Proveedor' : 'Provider'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{es ? 'Estado' : 'Status'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 hidden md:table-cell">{es ? 'Precio' : 'Price'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 hidden xl:table-cell">{es ? 'Fecha' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      {es ? 'No se encontraron solicitudes.' : 'No requests found.'}
                    </td>
                  </tr>
                )}
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {req.service?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{req.client?.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{req.client?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {req.provider?.full_name ?? <span className="text-slate-400 italic">{es ? 'Sin asignar' : 'Unassigned'}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status as RequestStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-700 hidden md:table-cell">
                      {formatCurrency(req.price, language)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden xl:table-cell">
                      {formatDateTime(req.created_at, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
