import React, { useEffect, useState } from 'react';
import { Search, Shield, Users as UsersIcon } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import { getAdminManagementText } from '../../i18n/adminManagementText';
import { formatDate, getInitials } from '../../utils/helpers';
import type { User, UserRole } from '../../types';

const ADMIN_NAV = [
  { label: 'Dashboard',  to: '/admin' },
  { label: 'Users',      to: '/admin/users' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Services',   to: '/admin/services' },
  { label: 'Requests',   to: '/admin/requests' },
  { label: 'Plans',      to: '/admin/plans' },
];

const ROLE_COLORS: Record<UserRole, string> = {
  admin:    'bg-purple-100 text-purple-700',
  client:   'bg-blue-100 text-blue-700',
  provider: 'bg-green-100 text-green-700',
};

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export default function AdminUsers() {
  const { language } = useI18n();
  const text = getAdminManagementText(language).users;
  const [users, setUsers]           = useState<User[]>([]);
  const [filtered, setFiltered]     = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [saving, setSaving]         = useState(false);
  const [pageSize, setPageSize]     = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchUsers() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setUsers((data as User[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [users, search, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, pageSize]);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setSaving(true);
    const { error: err } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
    setSaving(false);
    if (err) {
      alert(err.message);
      return;
    }
    setEditUser(null);
    fetchUsers();
  }

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedUsers = filtered.slice(startIndex, startIndex + pageSize);
  const visibleStart = totalRecords === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + pageSize, totalRecords);

  return (
    <Layout navItems={ADMIN_NAV} title="Users">
      <div className="page-header rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
              <UsersIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {text.badge}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{text.title}</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">{users.length} {text.totalSuffix}</p>
          </div>
          <div className="flex gap-2">
            <label htmlFor="roleFilter" className="sr-only">{text.roleFilterLabel}</label>
          <select
            id="roleFilter"
            className="input w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{text.allRoles}</option>
            <option value="client">{text.clients}</option>
            <option value="provider">{text.providers}</option>
            <option value="admin">{text.admins}</option>
          </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder={text.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="users-page-size" className="text-sm text-slate-500">
              {text.rows}
            </label>
            <select
              id="users-page-size"
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
        <div className="rounded-xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{text.colUser}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{text.colRole}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{text.colPhone}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{text.colJoined}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{text.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      {text.noResults}
                    </td>
                  </tr>
                )}
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {getInitials(u.full_name || u.email)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {u.full_name || text.noName}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ROLE_COLORS[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(u.created_at, language)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditUser(u)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {text.editRole}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {`${text.showing} ${visibleStart}-${visibleEnd} ${text.of} ${totalRecords}`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary !px-3 !py-2 text-sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                {text.previous}
              </button>
              <span className="text-sm text-slate-500">
                {`${text.page} ${safePage} ${text.of} ${totalPages}`}
              </span>
              <button
                type="button"
                className="btn-secondary !px-3 !py-2 text-sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
              >
                {text.next}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={text.changeUserRole}
      >
        {editUser && (
          <div className="space-y-4">
            <p className="text-slate-600">
              {text.changingRoleFor} <strong>{editUser.full_name || editUser.email}</strong>
            </p>
            <div className="grid gap-3">
              {(['client', 'provider', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(editUser.id, r)}
                  disabled={saving || editUser.role === r}
                  className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                    editUser.role === r
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-medium capitalize text-slate-800">{r}</span>
                  {editUser.role === r && (
                    <span className="text-xs text-blue-600 font-medium">{text.current}</span>
                  )}
                </button>
              ))}
            </div>
            {saving && (
              <div className="flex justify-center pt-2">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
