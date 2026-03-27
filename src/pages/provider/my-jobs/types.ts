import type { RequestStatus } from '../../../types';

export type JobFilter = 'all' | RequestStatus;

export type TranslateFn = (key: string) => string;
