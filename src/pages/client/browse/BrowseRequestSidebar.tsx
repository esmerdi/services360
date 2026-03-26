import { ArrowRight, CheckCircle2 } from 'lucide-react';
import StarRating from '../../../components/common/StarRating';
import type { Category } from '../../../types';
import type { ProviderOption, ServiceWithCategory } from './types';

type RequestMode = 'direct' | 'open';

type BrowseRequestSidebarProps = {
  t: (key: string) => string;
  topLevelCategories: Category[];
  selectedRootCategory: string | null;
  selectedService: string | null;
  selectedServiceData: ServiceWithCategory | null;
  servicesForSelectedRoot: ServiceWithCategory[];
  requestMode: RequestMode;
  canUseDirectMode: boolean;
  providerOptions: ProviderOption[];
  selectedProviderId: string | null;
  selectedProviderOption: ProviderOption | null;
  quickRequestingMarkerId: string | null;
  onRootCategoryChange: (categoryId: string | null) => void;
  onServiceChange: (serviceId: string | null) => void;
  onRequestModeChange: (mode: RequestMode) => void;
  onProviderSelect: (providerId: string) => void;
  onOpenRequest: () => void | Promise<void>;
  onProviderRequest: () => void | Promise<void>;
};

function ProviderAvatar({
  imageUrl,
  label,
  size,
  fallbackClassName,
}: {
  imageUrl?: string;
  label: string;
  size: 'md' | 'sm';
  fallbackClassName: string;
}) {
  const sizeClassName = size === 'md' ? 'h-10 w-10' : 'h-9 w-9';
  const initials = label.slice(0, 2).toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={label}
        className={`${sizeClassName} rounded-full border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClassName} items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-500 ${fallbackClassName}`}
    >
      {initials}
    </div>
  );
}

function RequestModeButton({
  title,
  description,
  isActive,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  isActive: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-3 py-2 text-left transition ${
        isActive
          ? 'border-sky-400 bg-sky-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </button>
  );
}

function ProviderOptionList({
  t,
  providerOptions,
  selectedProviderId,
  onProviderSelect,
}: {
  t: (key: string) => string;
  providerOptions: ProviderOption[];
  selectedProviderId: string | null;
  onProviderSelect: (providerId: string) => void;
}) {
  if (providerOptions.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
        {t('clientBrowse.noProvidersForService')}
      </p>
    );
  }

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {providerOptions.map((provider) => {
        const isSelected = selectedProviderId === provider.id;

        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => onProviderSelect(provider.id)}
            className={`w-full rounded-xl border px-3 py-2 text-left transition ${
              isSelected
                ? 'border-sky-400 bg-sky-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <ProviderAvatar
                imageUrl={provider.avatar}
                label={provider.displayName}
                size="md"
                fallbackClassName="bg-slate-100"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{provider.displayName}</p>
                <p className="text-xs text-slate-500">{provider.ratingLabel}</p>
                <p className="text-xs text-slate-500">{provider.distanceLabel}</p>
              </div>
              {isSelected ? (
                <CheckCircle2 className="ml-auto h-4 w-4 flex-shrink-0 text-sky-600" />
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SelectedProviderCard({
  t,
  selectedProviderOption,
}: {
  t: (key: string) => string;
  selectedProviderOption: ProviderOption | null;
}) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {t('clientBrowse.selectedProviderLabel')}
      </p>
      {selectedProviderOption ? (
        <div className="mt-2 flex items-center gap-3">
          <ProviderAvatar
            imageUrl={selectedProviderOption.avatar}
            label={selectedProviderOption.displayName}
            size="sm"
            fallbackClassName="bg-white"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{selectedProviderOption.displayName}</p>
            <p className="text-xs text-slate-500">{selectedProviderOption.distanceLabel}</p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{t('clientBrowse.selectProviderFirst')}</p>
      )}
    </div>
  );
}

export default function BrowseRequestSidebar({
  t,
  topLevelCategories,
  selectedRootCategory,
  selectedService,
  selectedServiceData,
  servicesForSelectedRoot,
  requestMode,
  canUseDirectMode,
  providerOptions,
  selectedProviderId,
  selectedProviderOption,
  quickRequestingMarkerId,
  onRootCategoryChange,
  onServiceChange,
  onRequestModeChange,
  onProviderSelect,
  onOpenRequest,
  onProviderRequest,
}: BrowseRequestSidebarProps) {
  const submitButtonDisabled = requestMode === 'open'
    ? quickRequestingMarkerId === 'open-request'
    : !selectedProviderId || quickRequestingMarkerId === selectedProviderId;

  const submitButtonLabel = requestMode === 'open'
    ? quickRequestingMarkerId === 'open-request'
      ? t('clientBrowse.requestingOpen')
      : t('clientBrowse.requestOpenButton')
    : quickRequestingMarkerId === selectedProviderId
      ? t('clientBrowse.requestingProvider')
      : selectedProviderId
        ? t('clientBrowse.requestSelectedProvider')
        : t('clientBrowse.selectProviderFirstButton');

  return (
    <div className="bg-white rounded-lg p-4 h-fit lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('clientBrowse.nearbyProvidersMapTitle')}</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('clientBrowse.selectParentCategory')}
        </label>
        <select
          className="input w-full"
          value={selectedRootCategory || ''}
          onChange={(event) => onRootCategoryChange(event.target.value || null)}
        >
          <option value="">{t('common.all')}</option>
          {topLevelCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('clientBrowse.selectService')}
        </label>
        <select
          className="input w-full"
          value={selectedService || ''}
          onChange={(event) => onServiceChange(event.target.value || null)}
          disabled={!selectedRootCategory}
        >
          <option value="">
            {!selectedRootCategory || servicesForSelectedRoot.length === 0
              ? t('clientBrowse.noServicesAvailable')
              : t('clientBrowse.selectService')}
          </option>
          {servicesForSelectedRoot.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      {selectedServiceData ? (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">{selectedServiceData.name}</h3>
            <p className="text-sm text-slate-600 mt-1">{selectedServiceData.description}</p>

            {selectedServiceData.avg_rating !== undefined && selectedServiceData.ratings_count !== undefined ? (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <StarRating value={selectedServiceData.avg_rating ?? 0} readonly size="sm" />
                <span className="text-slate-600">
                  {selectedServiceData.ratings_count && selectedServiceData.ratings_count > 0
                    ? `${(selectedServiceData.avg_rating ?? 0).toFixed(1)} (${selectedServiceData.ratings_count})`
                    : t('clientBrowse.noRatingsYet')}
                </span>
              </div>
            ) : null}

            {selectedServiceData.providers_count !== undefined ? (
              <p className="text-xs text-slate-500 mt-2">
                {selectedServiceData.providers_count} {t('clientBrowse.providersAvailable')}
              </p>
            ) : null}
          </div>

          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-slate-800">{t('clientBrowse.requestModeLabel')}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <RequestModeButton
                title={t('clientBrowse.requestModeDirectTitle')}
                description={t('clientBrowse.requestModeDirectDesc')}
                isActive={requestMode === 'direct'}
                disabled={!canUseDirectMode}
                onClick={() => onRequestModeChange('direct')}
              />
              <RequestModeButton
                title={t('clientBrowse.requestModeOpenTitle')}
                description={t('clientBrowse.requestModeOpenDesc')}
                isActive={requestMode === 'open'}
                onClick={() => onRequestModeChange('open')}
              />
            </div>

            {!canUseDirectMode ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {t('clientBrowse.requestModeAutoOpenNotice')}
              </p>
            ) : null}

            {requestMode === 'open' ? (
              <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                {t('clientBrowse.requestModeOpenHint')}
              </p>
            ) : null}
          </div>

          {requestMode === 'direct' ? (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-semibold text-slate-800">{t('clientBrowse.selectNearbyProvider')}</p>
              <ProviderOptionList
                t={t}
                providerOptions={providerOptions}
                selectedProviderId={selectedProviderId}
                onProviderSelect={onProviderSelect}
              />
            </div>
          ) : null}

          {requestMode === 'direct' ? (
            <SelectedProviderCard
              t={t}
              selectedProviderOption={selectedProviderOption}
            />
          ) : null}

          <button
            type="button"
            className="btn-primary w-full justify-center"
            onClick={requestMode === 'open' ? onOpenRequest : onProviderRequest}
            disabled={submitButtonDisabled}
          >
            {submitButtonLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}