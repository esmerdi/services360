import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useI18n } from '../../context/I18nContext';
import { supabase } from '../../lib/supabase';
import type { Category, Service } from '../../types';

const CLIENT_NAV = [
  { label: 'Dashboard', to: '/client' },
  { label: 'Browse', to: '/client/browse' },
  { label: 'My Requests', to: '/client/requests' },
  { label: 'Profile',     to: '/client/profile' },
];

type ServiceWithCategory = Service & { category?: Pick<Category, 'id' | 'name'> };

const CATEGORY_PALETTE = [
  { badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500', ring: 'border-violet-300 hover:border-violet-400' },
  { badge: 'bg-sky-50 text-sky-700',       dot: 'bg-sky-500',    ring: 'border-sky-300 hover:border-sky-400' },
  { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', ring: 'border-emerald-300 hover:border-emerald-400' },
  { badge: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500',  ring: 'border-amber-300 hover:border-amber-400' },
  { badge: 'bg-rose-50 text-rose-700',     dot: 'bg-rose-500',   ring: 'border-rose-300 hover:border-rose-400' },
  { badge: 'bg-teal-50 text-teal-700',     dot: 'bg-teal-500',   ring: 'border-teal-300 hover:border-teal-400' },
  { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', ring: 'border-orange-300 hover:border-orange-400' },
  { badge: 'bg-pink-50 text-pink-700',     dot: 'bg-pink-500',   ring: 'border-pink-300 hover:border-pink-400' },
] as const;

export default function ClientBrowse() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [catRes, serviceRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('services').select('*, category:categories(id, name)').order('name'),
      ]);

      if (catRes.error) {
        setError(catRes.error.message);
      } else if (serviceRes.error) {
        setError(serviceRes.error.message);
      } else {
        setCategories((catRes.data as Category[]) ?? []);
        setServices((serviceRes.data as ServiceWithCategory[]) ?? []);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const category of categories) {
      const key = category.parent_id ?? null;
      const existing = map.get(key);
      if (existing) {
        existing.push(category);
      } else {
        map.set(key, [category]);
      }
    }
    return map;
  }, [categories]);

  const getCategoryPath = useCallback((categoryId: string | null | undefined) => {
    if (!categoryId) return t('clientBrowse.generalCategory');

    const path: string[] = [];
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);

    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      path.unshift(current.name);
      current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
    }

    return path.length > 0 ? path.join(' > ') : t('clientBrowse.generalCategory');
  }, [categoryMap, t]);

  const getDescendantCategoryIds = useCallback((rootId: string) => {
    const descendants = new Set<string>();
    const stack = [rootId];

    while (stack.length > 0) {
      const currentId = stack.pop() as string;
      if (descendants.has(currentId)) continue;
      descendants.add(currentId);

      const children = childrenByParent.get(currentId) ?? [];
      for (const child of children) {
        stack.push(child.id);
      }
    }

    return descendants;
  }, [childrenByParent]);

  const countServicesForCategory = useCallback((categoryId: string) => {
    const validIds = getDescendantCategoryIds(categoryId);
    return services.filter((service) => service.category_id && validIds.has(service.category_id)).length;
  }, [getDescendantCategoryIds, services]);

  const topLevelCategories = useMemo(
    () => categories.filter((category: Category) => !category.parent_id),
    [categories]
  );

  const rootColorMap = useMemo(() => {
    const map = new Map<string, number>();
    topLevelCategories.forEach((cat, index) => {
      map.set(cat.id, index % CATEGORY_PALETTE.length);
    });
    return map;
  }, [topLevelCategories]);

  const getRootCategoryId = useCallback((categoryId: string | null | undefined): string | null => {
    if (!categoryId) return null;
    const visited = new Set<string>();
    let current = categoryMap.get(categoryId);
    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      if (!current.parent_id) return current.id;
      current = categoryMap.get(current.parent_id);
    }
    return categoryId;
  }, [categoryMap]);

  const getCategoryColor = useCallback((categoryId: string | null | undefined) => {
    const rootId = getRootCategoryId(categoryId);
    const index = rootId !== null ? (rootColorMap.get(rootId) ?? 0) : 0;
    return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
  }, [getRootCategoryId, rootColorMap]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const categoryIds = new Set<string>();

    if (selectedCategory !== 'all') {
      getDescendantCategoryIds(selectedCategory).forEach((id) => categoryIds.add(id));
    }

    return services.filter((service: ServiceWithCategory) => {
      const categoryPath = getCategoryPath(service.category_id).toLowerCase();
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.category?.name.toLowerCase().includes(query) ||
        categoryPath.includes(query);

      const matchesCategory =
        selectedCategory === 'all' || (service.category_id ? categoryIds.has(service.category_id) : false);

      return matchesSearch && matchesCategory;
    });
  }, [getCategoryPath, getDescendantCategoryIds, search, selectedCategory, services]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => getCategoryPath(a.id).localeCompare(getCategoryPath(b.id)));
  }, [categories, getCategoryPath]);

  return (
    <Layout navItems={CLIENT_NAV} title="Browse Services">
      <div className="page-header">
        <h1 className="page-title">{t('clientBrowse.title')}</h1>
        <p className="page-subtitle">{t('clientBrowse.subtitle')}</p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder={t('clientBrowse.searchPlaceholder')}
            value={search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="input"
          value={selectedCategory}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(event.target.value)}
        >
          <option value="all">{t('clientBrowse.allCategories')}</option>
          {sortedCategories.map((category: Category) => (
            <option key={category.id} value={category.id}>
              {getCategoryPath(category.id)}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {topLevelCategories.slice(0, 4).map((category: Category) => {
              const color = CATEGORY_PALETTE[(rootColorMap.get(category.id) ?? 0) % CATEGORY_PALETTE.length];
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`card text-left transition-all hover:shadow-md border-2 ${selectedCategory === category.id ? color.ring : 'border-transparent'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${color.dot}`} />
                    <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {category.description || t('clientBrowse.categoryFallback')}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    {countServicesForCategory(category.id)} {t('nav.services').toLowerCase()}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredServices.length === 0 && (
              <div className="card md:col-span-2 xl:col-span-3">
                <p className="text-center text-slate-400">{t('clientBrowse.noServices')}</p>
              </div>
            )}
            {filteredServices.map((service: ServiceWithCategory) => (
              <div key={service.id} className="card flex h-full flex-col justify-between">
                <div>
                  <span className={`badge ${getCategoryColor(service.category_id).badge}`}>
                    {getCategoryPath(service.category_id)}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{service.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {service.description || t('clientBrowse.serviceFallback')}
                  </p>
                </div>
                <Link to={`/client/request/${service.id}`} className="btn-primary mt-6 w-full justify-center">
                  {t('clientBrowse.requestService')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
