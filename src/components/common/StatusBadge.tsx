import React from 'react';
import clsx from 'clsx';
import type { RequestStatus } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useI18n();

  return (
    <span
      className={clsx(
        'badge',
        STATUS_COLORS[status],
        className
      )}
    >
      {t(`myRequests.status.${status}`, STATUS_LABELS[status])}
    </span>
  );
}
