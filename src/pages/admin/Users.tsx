import React, { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
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

export default function AdminUsers() {
  const { language } = useI18n();
  const [users, setUsers]           = useState<User[]>([]);
  const [filtered, setFiltered]     = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [saving, setSaving]         = useState(false);

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

  const es = language === 'es';

  return (
    <Layout navItems={ADMIN_NAV} title="Users">
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">{es ? 'Usuarios' : 'Users'}</h1>
          <p className="page-subtitle">{users.length} {es ? 'usuarios registrados' : 'registered users'}</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input w-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{es ? 'Todos los roles' : 'All Roles'}</option>
            <option value="client">{es ? 'Clientes' : 'Clients'}</option>
            <option value="provider">{es ? 'Proveedores' : 'Providers'}</option>
            <option value="admin">{es ? 'Administradores' : 'Admins'}</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          className="input pl-9"
          placeholder={es ? 'Buscar por nombre o correo...' : 'Search by name or email...'}
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
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{es ? 'Usuario' : 'User'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{es ? 'Rol' : 'Role'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{es ? 'Telefono' : 'Phone'}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{es ? 'Registro' : 'Joined'}</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">{es ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      {es ? 'No se encontraron usuarios.' : 'No users found.'}
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
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
                            {u.full_name || (es ? 'Sin nombre' : '—')}
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
                        {es ? 'Editar rol' : 'Edit Role'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={es ? 'Cambiar rol de usuario' : 'Change User Role'}
      >
        {editUser && (
          <div className="space-y-4">
            <p className="text-slate-600">
              {es ? 'Cambiando rol para' : 'Changing role for'} <strong>{editUser.full_name || editUser.email}</strong>
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
                    <span className="text-xs text-blue-600 font-medium">{es ? 'Actual' : 'Current'}</span>
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
