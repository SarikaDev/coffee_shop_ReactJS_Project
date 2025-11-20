/* eslint-disable @typescript-eslint/no-explicit-any */
// Types that mimic Supabase's interface
export interface AuthResponse {
  data: {
    user: any | null;
    session: any | null;
  };
  error: any | null;
}

export interface AuthTokenResponse {
  data: {
    user: any;
    session: any;
  };
  error: null;
}

export interface AuthErrorResponse {
  data: {
    user: null;
    session: null;
  };
  error: any;
}

export interface SignUpWithPasswordCredentials {
  email: string;
  password: string;
  full_name: string;
}

export interface SignInWithPasswordCredentials {
  email: string;
  password: string;
}

export interface QueryResult<T = any> {
  data: T | null;
  status: number;
  statusText: string;
  error: any | null;
}

export interface Session {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  app_metadata: any;
  user_metadata?: any;
  aud: "authenticated";
  created_at: string;
}
export interface QueryBuilder {
  select(columns?: string): QueryBuilder;
  eq(column: string, value: any): QueryBuilder;
  neq(column: string, value: any): QueryBuilder;
  gt(column: string, value: any): QueryBuilder;
  lt(column: string, value: any): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(count: number): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  then(callback?: (result: QueryResult) => void): Promise<QueryResult>;
}

export interface TableOperations {
  select(columns?: string): QueryBuilder;
  insert(data: any | any[]): {
    select(columns?: string): any;
    eq(column: string, value: any): any;
    then(callback?: (result: QueryResult) => void): Promise<QueryResult>;
  };
  update(data: any): QueryBuilder & {
    then(callback?: (result: QueryResult) => void): Promise<QueryResult>;
  };
  delete(): QueryBuilder & {
    then(callback?: (result: QueryResult) => void): Promise<QueryResult>;
  };
}

export interface AuthOperations {
  signUpWithEmail(
    credentials: SignUpWithPasswordCredentials
  ): Promise<AuthResponse>;
  signInWithPassword(
    credentials: SignInWithPasswordCredentials
  ): Promise<AuthResponse>;
  signOut(): Promise<{ error: any | null }>;
  getSession(): Promise<{ data: { session: any | null }; error: any | null }>;
  getUser(): Promise<{ data: { user: any | null }; error: any | null }>;
}

export interface RPCOperations {
  then(callback?: (result: QueryResult) => void): Promise<QueryResult>;
}

export interface SupabaseMockClient {
  auth: AuthOperations;
  from(table: string): TableOperations;
  rpc(fnName: string, params?: any): RPCOperations;
}
