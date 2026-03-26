import type { Category, RequestStatus, ServiceRequest } from '../../../types';

export function getCategoryPath(
  categoryMap: Map<string, Pick<Category, 'id' | 'name' | 'parent_id'>>,
  categoryId: string | null | undefined,
  fallbackLabel: string
): string {
  if (!categoryId) return fallbackLabel;

  const path: string[] = [];
  const visited = new Set<string>();
  let current = categoryMap.get(categoryId);

  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    path.unshift(current.name);
    current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
  }

  return path.length > 0 ? path.join(' > ') : fallbackLabel;
}

type FilterRequestsParams = {
  requests: ServiceRequest[];
  status: 'all' | RequestStatus;
  query: string;
  fallbackCategoryLabel: string;
  categoryMap: Map<string, Pick<Category, 'id' | 'name' | 'parent_id'>>;
};

export function filterRequests({
  requests,
  status,
  query,
  fallbackCategoryLabel,
  categoryMap,
}: FilterRequestsParams): ServiceRequest[] {
  const normalizedQuery = query.trim().toLowerCase();

  return requests.filter((request) => {
    const categoryPath = getCategoryPath(categoryMap, request.service?.category_id, fallbackCategoryLabel).toLowerCase();
    const matchesStatus = status === 'all' || request.status === status;
    const matchesSearch =
      !normalizedQuery ||
      request.service?.name?.toLowerCase().includes(normalizedQuery) ||
      request.provider?.full_name?.toLowerCase().includes(normalizedQuery) ||
      request.address?.toLowerCase().includes(normalizedQuery) ||
      request.description?.toLowerCase().includes(normalizedQuery) ||
      categoryPath.includes(normalizedQuery);

    return matchesStatus && matchesSearch;
  });
}
