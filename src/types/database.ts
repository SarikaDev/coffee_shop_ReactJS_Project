// Base types for database models
export interface BaseModel {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// Auth schema models
export interface AuthUsers extends BaseModel {
  email: string;
  encrypted_password: string;
  profiles?: Profiles | null;
  users?: AppUsers | null;
  dev_sessions?: DevSessions[];
}

export interface DevSessions extends BaseModel {
  auth_user_id: string;
  token: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  metadata?: null; // JSON type
  users?: AuthUsers;
}

// App schema models
export interface AppUsers extends BaseModel {
  id: string; // References auth_users.id
  full_name?: string | null;
  role: string;
  users?: AuthUsers;
}

export interface Profiles {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferences: {
    app_role: "app_admin" | "app_user"; // Specific roles
  };
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
  notification_preferences: {
    sms: boolean;
    push: boolean;
    email: boolean;
  };
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}
export interface ProfilesUpdate {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  notification_preferences?: {
    sms?: boolean;
    push?: boolean;
    email?: boolean;
  };
}

// Combined user types for frontend usage
export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role?: string;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Response types for API calls
export interface LoginResponse {
  token: string;
  user_id: string;
  expires_at: string;
  user?: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Session types
export interface Session {
  access_token: string;
  expires_at: string;
  user?: User;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface ProfileFormData {
  full_name?: string;
  phone?: string;
  email?: string;
}

// Select option types for forms
export interface SelectOption {
  value: string;
  label: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
