import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/common/StatusBadge';
import StarRating from '../../../components/common/StarRating';
import { formatDateTime } from '../../../utils/helpers';
import type { AppLanguage } from '../../../utils/helpers';
import type { Category, ServiceRequest } from '../../../types';
import { getCategoryPath } from './utils';

type MyRequestsTableProps = {
  t: (key: string) => string;
  language: AppLanguage;
  requests: ServiceRequest[];
  ratedRequestIds: Set<string>;
  categoryMap: Map<string, Pick<Category, 'id' | 'name' | 'parent_id'>>;
};

export default function MyRequestsTable({
  t,
  language,
  requests,
  ratedRequestIds,
  categoryMap,
}: MyRequestsTableProps) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="dashboard-table">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">{t('myRequests.table.service')}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">{t('myRequests.table.provider')}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">{t('myRequests.table.status')}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 hidden lg:table-cell">{t('myRequests.table.created')}</th>
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
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {request.status === 'pending' && request.provider && (
                      <p className="mb-1 text-sm font-semibold text-slate-800">
                        {request.provider.full_name || request.provider.email}
                      </p>
                    )}
                    <Link to={`/client/requests/${request.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {request.service?.name || t('myRequests.table.serviceRequest')}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <span className="truncate">{getCategoryPath(categoryMap, request.service?.category_id, t('clientBrowse.generalCategory'))}</span>
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{request.address || t('myRequests.table.addressPending')}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {request.provider ? (
                      <p className="font-medium text-slate-700">{request.provider.full_name || request.provider.email}</p>
                    ) : (
                      t('myRequests.table.awaitingAcceptance')
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
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
    </div>
  );
}
