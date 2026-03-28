import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/common/StatusBadge';
import StarRating from '../../../components/common/StarRating';
import { formatDateTime } from '../../../utils/helpers';
import type { AppLanguage } from '../../../utils/helpers';
import type { Category, ServiceRequest } from '../../../types';
import { getCategoryPath } from './utils';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

type MyRequestsTableProps = {
  t: (key: string) => string;
  language: AppLanguage;
  requests: ServiceRequest[];
  totalRequests: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  ratedRequestIds: Set<string>;
  categoryMap: Map<string, Pick<Category, 'id' | 'name' | 'parent_id'>>;
};

export default function MyRequestsTable({
  t,
  language,
  requests,
  totalRequests,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  ratedRequestIds,
  categoryMap,
}: MyRequestsTableProps) {
  const visibleStart = useMemo(
    () => (totalRequests === 0 ? 0 : (currentPage - 1) * pageSize + 1),
    [currentPage, pageSize, totalRequests]
  );

  const visibleEnd = useMemo(
    () => Math.min(currentPage * pageSize, totalRequests),
    [currentPage, pageSize, totalRequests]
  );

  const pageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const boundedPages = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((left, right) => left - right);

    const items: Array<number | 'ellipsis'> = [];
    for (let index = 0; index < boundedPages.length; index += 1) {
      const page = boundedPages[index];
      const previous = boundedPages[index - 1];

      if (index > 0 && page - previous > 1) {
        items.push('ellipsis');
      }

      items.push(page);
    }

    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {t('myRequests.table.showingResults')
            .replace('{{start}}', String(visibleStart))
            .replace('{{end}}', String(visibleEnd))
            .replace('{{total}}', String(totalRequests))}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="my-requests-page-size" className="text-sm text-slate-500">
            {t('myRequests.table.rowsPerPage')}
          </label>
          <select
            id="my-requests-page-size"
            className="input h-10 w-24"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="dashboard-table">
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{t('myRequests.table.service')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{t('myRequests.table.provider')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{t('myRequests.table.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hidden lg:table-cell">{t('myRequests.table.created')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  {t('myRequests.table.noRequests')}
                </td>
              </tr>
            )}
            {requests.map((request) => (
              <React.Fragment key={request.id}>
                <tr className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    {request.status === 'pending' && request.provider && (
                      <p className="mb-1 text-sm font-semibold text-slate-800">
                        {request.provider.full_name || request.provider.email}
                      </p>
                    )}
                    <Link to={`/client/requests/${request.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600">
                      {request.service?.name || t('myRequests.table.serviceRequest')}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <span className="truncate">{getCategoryPath(categoryMap, request.service?.category_id, t('clientBrowse.generalCategory'))}</span>
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{request.address || t('myRequests.table.addressPending')}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {request.provider ? (
                      <p className="font-medium text-slate-700">{request.provider.full_name || request.provider.email}</p>
                    ) : (
                      t('myRequests.table.awaitingAcceptance')
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 hidden lg:table-cell">
                    {formatDateTime(request.created_at, language)}
                  </td>
                </tr>

                {request.provider && (
                  (request.provider.ratings_count ?? 0) > 0 ||
                  (request.status === 'completed' && !ratedRequestIds.has(request.id))
                ) && (
                  <tr className="bg-slate-50/60">
                    <td colSpan={4} className="px-4 pb-3 pt-0">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {t('myRequests.table.providerRating')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <StarRating value={request.provider.avg_rating ?? 0} readonly size="sm" />
                          <span>
                            {request.provider.ratings_count && request.provider.ratings_count > 0
                              ? `${(request.provider.avg_rating ?? 0).toFixed(1)} (${request.provider.ratings_count})`
                              : t('myRequests.table.noRatingsYet')}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {t('myRequests.table.pageIndicator')
            .replace('{{current}}', String(currentPage))
            .replace('{{total}}', String(totalPages))}
        </p>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="btn-secondary !px-3 !py-2 text-sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            {t('common.previous')}
          </button>

          <div className="flex items-center gap-1">
            {pageItems.map((item, index) => {
              if (item === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 text-sm text-slate-400">
                    ...
                  </span>
                );
              }

              const isActive = item === currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  className={isActive
                    ? 'btn-primary !px-3 !py-2 text-sm'
                    : 'btn-secondary !px-3 !py-2 text-sm'}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn-secondary !px-3 !py-2 text-sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalRequests === 0}
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
