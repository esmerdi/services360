import LoadingSpinner from '../../../components/common/LoadingSpinner';
import StarRating from '../../../components/common/StarRating';
import UserAvatar from '../../../components/common/UserAvatar';
import type { ServiceRequest } from '../../../types';

type MandatoryRatingModalProps = {
  request: ServiceRequest;
  error: string | null;
  score: number;
  comment: string;
  savingRating: boolean;
  t: (key: string) => string;
  onScoreChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export default function MandatoryRatingModal({
  request,
  error,
  score,
  comment,
  savingRating,
  t,
  onScoreChange,
  onCommentChange,
  onSubmit,
}: MandatoryRatingModalProps) {
  if (!request.provider) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-t-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-6 pb-7 pt-8 text-center">
          <UserAvatar
            avatarUrl={request.provider.avatar_url}
            name={request.provider.full_name || request.provider.email}
            alt={request.provider.full_name || request.provider.email || ''}
            className="mx-auto h-20 w-20 overflow-hidden rounded-full border-4 border-white/80 shadow-lg bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center"
            fallbackClassName="text-2xl font-bold text-white"
          />
          <p className="mt-3 text-lg font-semibold text-white">
            {request.provider.full_name || request.provider.email}
          </p>
          <p className="mt-1 text-sm text-amber-100">
            {t('clientRequestDetail.ratingPopupCompletedBy')}{request.service?.name ? ` ${request.service.name}` : ''}
          </p>
        </div>

        <div className="px-6 py-5">
          <p className="text-center text-base font-semibold text-slate-900">
            {t('clientRequestDetail.ratingPopupTitle')}
          </p>
          <p className="mt-1 text-center text-sm text-slate-500">
            {t('clientRequestDetail.ratingPopupCta')}
          </p>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="flex justify-center">
              <StarRating value={score} onChange={onScoreChange} size="lg" />
            </div>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder={t('clientRequestDetail.shareExperience')}
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
            />
            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={savingRating}
            >
              {savingRating ? <LoadingSpinner size="sm" /> : t('clientRequestDetail.submitRating')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
