// =============================================
// types/index.ts — All shared TypeScript types
// =============================================

export type UserRole = 'admin' | 'client' | 'provider';
export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type PlanName = 'FREE' | 'PRO';
export type SubscriptionStatus = 'active' | 'cancelled' | 'trial';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  is_available: boolean;
  avatar_url: string | null;
  address: string | null;
  avg_rating?: number;
  ratings_count?: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  description: string | null;
  created_at: string;
  children?: Category[];
}

export interface Service {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  created_at: string;
  category?: Category;
}

export interface ProviderService {
  id: string;
  provider_id: string;
  service_id: string;
  created_at: string;
  service?: Service;
}

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  client_id: string;
  provider_id: string | null;
  service_id: string;
  status: RequestStatus;
  description: string | null;
  price: number | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  created_at: string;
  client?: User;
  provider?: User;
  service?: Service & { category?: Category };
  distance_km?: number;
}

export interface RequestStatusHistory {
  id: string;
  request_id: string;
  status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  request_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  from_user?: User;
}

export interface Plan {
  id: string;
  name: PlanName;
  price: number;
  features: Record<string, unknown> | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  plan?: Plan;
}

export interface DashboardMetrics {
  totalUsers: number;
  totalClients: number;
  totalProviders: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalRevenue: number;
}
