import type { Category, Service } from '../../../types';

export type ServiceWithCategory = Service & {
  category?: Pick<Category, 'id' | 'name'>;
  avg_rating?: number;
  ratings_count?: number;
  providers_count?: number;
};

export type NearbyProviderOfferedService = {
  id: string;
  name: string;
  root_category_id: string | null;
};

export type NearbyProviderMap = {
  id: string;
  full_name: string | null;
  email: string;
  location: { latitude: number; longitude: number; address: string | null };
  root_category_ids: string[];
  distance_km?: number;
  avatar_url?: string | null;
  avg_rating?: number;
  ratings_count?: number;
  offered_services: NearbyProviderOfferedService[];
};

export type ProviderOption = NearbyProviderMap & {
  ratingLabel: string;
  distanceLabel: string;
  displayName: string;
  avatar: string | undefined;
};