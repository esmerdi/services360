import React, { useEffect, useState } from 'react';
import { Search, ClipboardList } from 'lucide-react';
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

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export default function AdminRequests() {
  const { language } = useI18n();
  const [requests, setRequests]     = useState<ServiceRequest[]>([]);
  const [filtered, setFiltered]     = useState<ServiceRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize, setPageSize]     = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, pageSize]);

  const es = language === 'es';
  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRequests = filtered.slice(startIndex, startIndex + pageSize);
  const visibleStart = totalRecords === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + pageSize, totalRecords);
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
      <div className="page-header rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              {es ? 'Monitoreo operativo' : 'Operations monitoring'}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{es ? 'Solicitudes de servicio' : 'Service Requests'}</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">{requests.length} {es ? 'solicitudes en total' : 'total requests'}</p>
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
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder={es ? 'Buscar por cliente, servicio o direccion...' : 'Search by client, service or address...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="requests-page-size" className="text-sm text-slate-500">
              {es ? 'Filas' : 'Rows'}
            </label>
            <select
              id="requests-page-size"
              className="input h-10 w-24"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-sm">
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{es ? 'Servicio' : 'Service'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{es ? 'Cliente' : 'Client'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hidden lg:table-cell">{es ? 'Proveedor' : 'Provider'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{es ? 'Estado' : 'Status'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hidden md:table-cell">{es ? 'Precio' : 'Price'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hidden xl:table-cell">{es ? 'Fecha' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      {es ? 'No se encontraron solicitudes.' : 'No requests found.'}
                    </td>
                  </tr>
                )}
                {paginatedRequests.map((req) => (
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

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {es
                ? `Mostrando ${visibleStart}-${visibleEnd} de ${totalRecords}`
                : `Showing ${visibleStart}-${visibleEnd} of ${totalRecords}`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary !px-3 !py-2 text-sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                {es ? 'Anterior' : 'Previous'}
              </button>
              <span className="text-sm text-slate-500">
                {es ? `Página ${safePage} de ${totalPages}` : `Page ${safePage} of ${totalPages}`}
              </span>
              <button
                type="button"
                className="btn-secondary !px-3 !py-2 text-sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
              >
                {es ? 'Siguiente' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
