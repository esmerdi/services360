import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Wrench } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import type { Service, Category } from '../../types';

const ADMIN_NAV = [
  { label: 'Dashboard',  to: '/admin' },
  { label: 'Users',      to: '/admin/users' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Services',   to: '/admin/services' },
  { label: 'Requests',   to: '/admin/requests' },
  { label: 'Plans',      to: '/admin/plans' },
];

interface ServiceForm {
  name: string;
  category_id: string;
  description: string;
}

const emptyForm: ServiceForm = { name: '', category_id: '', description: '' };
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

type ServiceWithCategory = Service & { category?: Category };

export default function AdminServices() {
  const { language } = useI18n();
  const [services, setServices]   = useState<ServiceWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<ServiceWithCategory | null>(null);
  const [form, setForm]           = useState<ServiceForm>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageSize, setPageSize]   = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  async function fetchData() {
    setLoading(true);
    const [servRes, catRes] = await Promise.all([
      supabase
        .from('services')
        .select('*, category:categories(id, name)')
        .order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (servRes.error) setError(servRes.error.message);
    else setServices((servRes.data as ServiceWithCategory[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (svc: ServiceWithCategory) => {
    setEditing(svc);
    setForm({
      name:        svc.name,
      category_id: svc.category_id ?? '',
      description: svc.description ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError(language === 'es' ? 'El nombre es obligatorio.' : 'Name is required.'); return; }

    if (form.category_id && !leafCategoryIds.has(form.category_id)) {
      setFormError(
        language === 'es'
          ? 'Selecciona una sub-subcategoria (categoria hoja) para el servicio.'
          : 'Select a leaf category (sub-subcategory) for this service.'
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      name:        form.name.trim(),
      category_id: form.category_id || null,
      description: form.description.trim() || null,
    };

    const { error: err } = editing
      ? await supabase.from('services').update(payload).eq('id', editing.id)
      : await supabase.from('services').insert(payload);

    setSaving(false);
    if (err) { setFormError(err.message); return; }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'es' ? 'Eliminar este servicio? Las solicitudes existentes pueden verse afectadas.' : 'Delete this service? Existing requests may be affected.')) return;
    const { error: err } = await supabase.from('services').delete().eq('id', id);
    if (err) alert(err.message);
    else fetchData();
  };

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories]
  );

  const leafCategoryIds = useMemo(() => {
    const parentIds = new Set(categories.filter((c) => c.parent_id).map((c) => c.parent_id as string));
    const leaves = new Set<string>();

    for (const category of categories) {
      if (!parentIds.has(category.id)) {
        leaves.add(category.id);
      }
    }

    return leaves;
  }, [categories]);

  const getCategoryPath = useCallback((categoryId: string | null | undefined) => {
    if (!categoryId) return language === 'es' ? 'Sin categoria' : 'No category';

    const path: string[] = [];
    let current = categoryMap.get(categoryId);
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      path.unshift(current.name);
      current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
    }

    return path.length > 0 ? path.join(' > ') : (language === 'es' ? 'Sin categoria' : 'No category');
  }, [categoryMap, language]);

  const leafCategories = useMemo(
    () => categories.filter((c) => leafCategoryIds.has(c.id)).sort((a, b) => getCategoryPath(a.id).localeCompare(getCategoryPath(b.id))),
    [categories, getCategoryPath, leafCategoryIds]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return services;

    return services.filter((service) => {
      const categoryPath = getCategoryPath(service.category_id).toLowerCase();
      return (
        service.name.toLowerCase().includes(query) ||
        (service.description?.toLowerCase().includes(query) ?? false) ||
        categoryPath.includes(query)
      );
    });
  }, [getCategoryPath, search, services]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const es = language === 'es';
  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedServices = filtered.slice(startIndex, startIndex + pageSize);
  const visibleStart = totalRecords === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + pageSize, totalRecords);

  return (
    <Layout navItems={ADMIN_NAV} title="Services">
      <div className="page-header rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              {es ? 'Catalogo de servicios' : 'Service catalog'}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{es ? 'Servicios' : 'Services'}</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">{services.length} {es ? 'servicios en total' : 'total services'}</p>
          </div>
          <button onClick={openCreate} className="btn-primary self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            {es ? 'Nuevo servicio' : 'New Service'}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder={es ? 'Buscar servicios...' : 'Search services...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="services-page-size" className="text-sm text-slate-500">
              {es ? 'Filas' : 'Rows'}
            </label>
            <select
              id="services-page-size"
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
          <table className="dashboard-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{es ? 'Nombre' : 'Name'}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{es ? 'Categoria' : 'Category'}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hidden md:table-cell">{es ? 'Descripcion' : 'Description'}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{es ? 'Acciones' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedServices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    {es ? 'No se encontraron servicios.' : 'No services found.'}
                  </td>
                </tr>
              )}
              {paginatedServices.map((svc) => (
                <tr key={svc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{svc.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {getCategoryPath(svc.category_id)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-xs truncate">
                    {svc.description ?? (es ? 'Sin descripcion' : '—')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(svc)} className="btn-ghost p-1.5">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(svc.id)}
                        className="btn-ghost p-1.5 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? (es ? 'Editar servicio' : 'Edit Service') : (es ? 'Nuevo servicio' : 'New Service')}
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}

          <div className="form-group">
            <label className="label">{es ? 'Nombre *' : 'Name *'}</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={es ? 'ej. Limpieza profunda del hogar' : 'e.g. Deep House Cleaning'}
            />
          </div>

          <div className="form-group">
            <label className="label">{es ? 'Categoria' : 'Category'}</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">{es ? 'Sin categoria' : 'No category'}</option>
              {leafCategories.map((c) => (
                <option key={c.id} value={c.id}>{getCategoryPath(c.id)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {es
                ? 'Solo se permiten categorias hoja (sub-subcategorias) para asociar servicios.'
                : 'Only leaf categories (sub-subcategories) can be assigned to services.'}
            </p>
          </div>

          <div className="form-group">
            <label className="label">{es ? 'Descripcion' : 'Description'}</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={es ? 'Descripcion corta del servicio...' : 'Short description of the service...'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              {es ? 'Cancelar' : 'Cancel'}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <LoadingSpinner size="sm" /> : editing ? (es ? 'Guardar cambios' : 'Save Changes') : (es ? 'Crear' : 'Create')}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
