import Modal from '../../../components/common/Modal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import type { ServiceRequest } from '../../../types';
import type { TranslateFn } from './types';

type ReopenRequestModalProps = {
  isOpen: boolean;
  actingId: string | null;
  pendingCancelJob: ServiceRequest | null;
  t: TranslateFn;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ReopenRequestModal({
  isOpen,
  actingId,
  pendingCancelJob,
  t,
  onClose,
  onConfirm,
}: ReopenRequestModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('providerMyJobs.cancelModalTitle')} size="sm">
      <p className="text-sm text-slate-600">{t('providerMyJobs.cancelModalDescription')}</p>
      <p className="mt-2 text-xs text-slate-500">{t('providerMyJobs.cancelModalNote')}</p>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={Boolean(actingId)}>
          {t('providerMyJobs.goBack')}
        </button>
        <button type="button" className="btn-primary" onClick={onConfirm} disabled={Boolean(actingId)}>
          {actingId && pendingCancelJob && actingId === pendingCancelJob.id
            ? <LoadingSpinner size="sm" />
            : t('providerMyJobs.confirmCancellation')}
        </button>
      </div>
    </Modal>
  );
}
