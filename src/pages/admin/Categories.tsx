import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, FolderTree, Layers } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import type { Category } from '../../types';

const ADMIN_NAV = [
  { label: 'Dashboard',  to: '/admin' },
  { label: 'Users',      to: '/admin/users' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Services',   to: '/admin/services' },
  { label: 'Requests',   to: '/admin/requests' },
  { label: 'Plans',      to: '/admin/plans' },
];

interface CategoryForm {
  name: string;
  parent_id: string;
  icon: string;
  description: string;
}

const emptyForm: CategoryForm = { name: '', parent_id: '', icon: '', description: '' };
const MAX_CATEGORY_DEPTH = 2;

export default function AdminCategories() {
  const { language } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Category | null>(null);
  const [form, setForm]             = useState<CategoryForm>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  async function fetchCategories() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (err) setError(err.message);
    else setCategories((data as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name:        cat.name,
      parent_id:   cat.parent_id ?? '',
      icon:        cat.icon ?? '',
      description: cat.description ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(language === 'es' ? 'El nombre es obligatorio.' : 'Name is required.');
      return;
    }

    if (form.parent_id) {
      const parent = categories.find((c) => c.id === form.parent_id);
      if (!parent) {
        setFormError(language === 'es' ? 'La categoria padre no es valida.' : 'Parent category is invalid.');
        return;
      }

      if (getCategoryDepth(parent.id) >= MAX_CATEGORY_DEPTH) {
        setFormError(
          language === 'es'
            ? 'Solo se permiten hasta 3 niveles (categoria > subcategoria > sub-subcategoria).'
            : 'Only up to 3 levels are allowed (category > subcategory > sub-subcategory).'
        );
        return;
      }
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      name:        form.name.trim(),
      parent_id:   form.parent_id || null,
      icon:        form.icon.trim() || null,
      description: form.description.trim() || null,
    };

    const { error: err } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload);

    setSaving(false);
    if (err) { setFormError(err.message); return; }
    setModalOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'es' ? 'Eliminar esta categoria? Las subcategorias y servicios pueden verse afectados.' : 'Delete this category? Sub-categories and services may be affected.')) return;
    const { error: err } = await supabase.from('categories').delete().eq('id', id);
    if (err) alert(err.message);
    else fetchCategories();
  };

  // Build tree
  const roots  = categories.filter((c) => !c.parent_id);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const category of categories) {
      if (!category.parent_id) continue;
      const existing = map.get(category.parent_id) ?? [];
      existing.push(category);
      map.set(category.parent_id, existing);
    }

    for (const [, list] of map) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return map;
  }, [categories]);

  const getCategoryDepth = (categoryId: string) => {
    let depth = 0;
    let current = categories.find((c) => c.id === categoryId);
    const visited = new Set<string>();

    while (current?.parent_id) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      depth += 1;
      current = categories.find((c) => c.id === current?.parent_id);
    }

    return depth;
  };

  const getCategoryPath = (categoryId: string) => {
    const path: string[] = [];
    let current = categories.find((c) => c.id === categoryId);
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      path.unshift(current.name);
      current = current.parent_id
        ? categories.find((c) => c.id === current?.parent_id)
        : undefined;
    }

    return path.join(' > ');
  };

  const invalidParentIds = useMemo(() => {
    if (!editing) return new Set<string>();

    const blocked = new Set<string>([editing.id]);
    const stack = [editing.id];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const children = childrenByParent.get(currentId) ?? [];
      for (const child of children) {
        if (blocked.has(child.id)) continue;
        blocked.add(child.id);
        stack.push(child.id);
      }
    }

    return blocked;
  }, [childrenByParent, editing]);

  const parentOptions = categories
    .filter((c) => !invalidParentIds.has(c.id) && getCategoryDepth(c.id) < MAX_CATEGORY_DEPTH)
    .sort((a, b) => a.name.localeCompare(b.name));

  const renderChildren = (parentId: string, level: number) => {
    const children = childrenByParent.get(parentId) ?? [];
    if (children.length === 0) return null;

    return (
      <ul className={level === 1 ? 'mt-3 space-y-1' : 'mt-1 ml-3 space-y-1'}>
        {children.map((child) => (
          <li key={child.id}>
            <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 group transition-colors ${
              level === 1
                ? 'bg-slate-50 hover:bg-blue-50/60'
                : 'bg-slate-100/60 hover:bg-blue-50/40'
            }`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className={`truncate ${level === 1 ? 'text-sm font-medium text-slate-700' : 'text-xs text-slate-600'}`}>
                  {child.name}
                </span>
                {child.icon && (
                  <span className="text-[10px] text-slate-400 shrink-0">({child.icon})</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                <button onClick={() => openEdit(child)} className="btn-ghost p-1">
                  <Pencil className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(child.id)} className="btn-ghost p-1 text-red-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            {renderChildren(child.id, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const es = language === 'es';

  return (
    <Layout navItems={ADMIN_NAV} title="Categories">
      <div className="page-header rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              {es ? 'Estructura del catalogo' : 'Catalog structure'}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{es ? 'Categorías' : 'Categories'}</h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">{categories.length} {es ? 'categorías en total' : 'total categories'}</p>
          </div>
          <button onClick={openCreate} className="btn-primary self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            {es ? 'Nueva categoría' : 'New Category'}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : roots.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <FolderTree className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-400">{es ? 'Aún no hay categorías.' : 'No categories yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roots.map((root) => {
            const subCount = (childrenByParent.get(root.id) ?? []).reduce((acc, sub) => {
              return acc + 1 + (childrenByParent.get(sub.id)?.length ?? 0);
            }, 0);

            return (
              <div key={root.id} className="card flex flex-col">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {root.icon && (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                        {root.icon.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{root.name}</h3>
                      {root.description && (
                        <p className="text-xs text-slate-400 truncate">{root.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => openEdit(root)} className="btn-ghost p-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(root.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-count badge */}
                {subCount > 0 && (
                  <span className="mb-2 self-start rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {subCount} {es ? 'subcategorias' : 'subcategories'}
                  </span>
                )}

                {/* Children tree */}
                {renderChildren(root.id, 1)}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? (es ? 'Editar categoría' : 'Edit Category') : (es ? 'Nueva categoría' : 'New Category')}
      >
        <div className="space-y-4">
          {formError && <ErrorMessage message={formError} />}

          <div className="form-group">
            <label className="label">{es ? 'Nombre *' : 'Name *'}</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={es ? 'ej. Plomería' : 'e.g. Plumbing'}
            />
          </div>

          <div className="form-group">
            <label className="label">{es ? 'Categoría padre' : 'Parent Category'}</label>
            <select
              className="input"
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
            >
              <option value="">{es ? 'Ninguna (categoría raíz)' : 'None (root category)'}</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>{getCategoryPath(c.id)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {es
                ? 'Máximo 3 niveles: categoría > subcategoría > sub-subcategoría.'
                : 'Max 3 levels: category > subcategory > sub-subcategory.'}
            </p>
          </div>

          <div className="form-group">
            <label className="label">{es ? 'Nombre del icono' : 'Icon name'}</label>
            <input
              className="input"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder={es ? 'ej. wrench, home, car' : 'e.g. wrench, home, car'}
            />
          </div>

          <div className="form-group">
            <label className="label">{es ? 'Descripción' : 'Description'}</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={es ? 'Descripcion corta...' : 'Short description...'}
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
