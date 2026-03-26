import type { ServiceRequest } from '../../../types';

export type NearbyCoords = {
  latitude: number;
  longitude: number;
};

export type NearbyRequest = ServiceRequest & {
  client?: {
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
};

export type NearbyRequestRpcRow = {
  id: string;
  distance_km: number;
};
