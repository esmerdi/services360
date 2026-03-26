import type { Service, User } from '../../../types';

export type ServiceDetails = Service & {
  category?: { id: string; name: string; icon?: string | null };
};

export type NearbyProvider = User & {
  distance_km?: number;
  location?: { latitude: number; longitude: number; address: string | null };
};

export type RequestServiceCategory = {
  id: string;
  name: string;
  parent_id: string | null;
};

export type RequestServiceCoords = {
  latitude: number;
  longitude: number;
};
