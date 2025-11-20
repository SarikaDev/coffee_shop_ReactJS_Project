/* eslint-disable @typescript-eslint/no-explicit-any */
// // lib/supabase.ts

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  AuthResponse,
  QueryResult,
  Session,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  SupabaseMockClient,
  User,
} from "../types/supabase-mock";

const isProduction = import.meta.env.VITE_ENV === "production";

export type AppSupabaseClient =
  | ReturnType<typeof createSupabaseClient>
  | SupabaseMockClient;

export function createClient(): typeof isProduction extends true
  ? ReturnType<typeof createSupabaseClient>
  : SupabaseMockClient {
  if (isProduction) {
    return createSupabaseClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    ) as any;
  } else {
    return createLocalClient() as any;
  }
}

const createLocalClient = (): SupabaseMockClient => {
  const baseURL = import.meta.env.VITE_LOCAL_API_URL;

  // Helper function to make API calls
  const makeRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<QueryResult> => {
    const token = localStorage.getItem("authToken");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const response = await fetch(`${baseURL}/${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: data,
          status: response.status,
          statusText: response.statusText,
        };
      }

      return {
        data,
        error: null,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
        status: 500,
        statusText: "Internal Server Error",
      };
    }
  };

  return {
    auth: {
      // Supabase-compatible signUp (renamed from signUpWithEmail)
      signUpWithEmail: async ({
        email,
        password,
        full_name,
      }: SignUpWithPasswordCredentials): Promise<AuthResponse> => {
        const response = await fetch(`${baseURL}/auth/rpc/register_user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: email,
            user_password: password,
            full_name: full_name,
          }),
        });

        const signupData = await response.json();

        if (!response.ok || !signupData.user_id) {
          return {
            data: { user: null, session: null },
            error: { message: signupData.error || "Registration failed" },
          };
        }

        const user: User = {
          id: signupData.user_id,
          email: email,
          app_metadata: {},
          // user_metadata: options?.data || {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        };

        return {
          data: {
            user,
            session: null, // No auto-login on signup (Supabase behavior)
          },
          error: null,
        };
      },

      signInWithPassword: async ({
        email,
        password,
      }: SignInWithPasswordCredentials): Promise<AuthResponse> => {
        const response = await fetch(`${baseURL}/auth/rpc/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_email: email,
            p_password: password,
          }),
        });

        const loginData = await response.json();
        console.log("🚀 ~ loginData:", loginData);

        if (!response.ok || !loginData.token) {
          return {
            data: { user: null, session: null },
            error: { message: loginData.error || "Login failed" },
          };
        }

        // Store token for future requests
        localStorage.setItem("authToken", loginData.token);
        localStorage.setItem("userId", loginData.user_id);

        const user: User = {
          id: loginData.user_id,
          email: email,
          app_metadata: {},
          // user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        };

        const session: Session = {
          access_token: loginData.token,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user,
        };

        return {
          data: { user, session },
          error: null,
        };
      },

      signOut: async () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userId");
        return { error: null };
      },

      getSession: async () => {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");

        if (token && userId) {
          const user: User = {
            id: userId,
            email: "",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          };

          const session: Session = {
            access_token: token,
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user,
          };

          return {
            data: { session },
            error: null,
          };
        }
        return { data: { session: null }, error: null };
      },

      getUser: async () => {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");

        if (token && userId) {
          const user: User = {
            id: userId,
            email: "",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          };

          return {
            data: { user },
            error: null,
          };
        }
        return { data: { user: null }, error: null };
      },

      // refreshSession: async () => {
      //   // For local, just return current session
      //   return this.getSession() as any;
      // },

      // updateUser: async (attributes) => {
      //   const result = await makeRequest("auth/user", {
      //     method: "PATCH",
      //     body: JSON.stringify(attributes),
      //   });

      //   if (result.error) {
      //     return { data: { user: null }, error: result.error };
      //   }

      //   return { data: { user: result.data as User }, error: null };
      // },
    },

    from: (table: string) => {
      let queryParams = "";
      let isSingle = false;
      let isMaybeSingle = false;

      const createFilterBuilder = () => ({
        // SELECT
        select: function (columns?: string, options?: any) {
          if (columns && columns !== "*") {
            queryParams += `&select=${columns}`;
          }
          if (options?.count) {
            queryParams += `&count=${options.count}`;
          }
          return this;
        },

        // FILTERS
        eq: function (column: string, value: any) {
          queryParams += `&${column}=eq.${encodeURIComponent(value)}`;
          return this;
        },

        neq: function (column: string, value: any) {
          queryParams += `&${column}=neq.${encodeURIComponent(value)}`;
          return this;
        },

        gt: function (column: string, value: any) {
          queryParams += `&${column}=gt.${encodeURIComponent(value)}`;
          return this;
        },

        gte: function (column: string, value: any) {
          queryParams += `&${column}=gte.${encodeURIComponent(value)}`;
          return this;
        },

        lt: function (column: string, value: any) {
          queryParams += `&${column}=lt.${encodeURIComponent(value)}`;
          return this;
        },

        lte: function (column: string, value: any) {
          queryParams += `&${column}=lte.${encodeURIComponent(value)}`;
          return this;
        },

        like: function (column: string, pattern: string) {
          queryParams += `&${column}=like.${encodeURIComponent(pattern)}`;
          return this;
        },

        ilike: function (column: string, pattern: string) {
          queryParams += `&${column}=ilike.${encodeURIComponent(pattern)}`;
          return this;
        },

        is: function (column: string, value: boolean | null) {
          queryParams += `&${column}=is.${value === null ? "null" : value}`;
          return this;
        },

        in: function (column: string, values: any[]) {
          queryParams += `&${column}=in.(${values
            .map((v) => encodeURIComponent(v))
            .join(",")})`;
          return this;
        },

        contains: function (column: string, value: any) {
          queryParams += `&${column}=cs.${encodeURIComponent(
            JSON.stringify(value)
          )}`;
          return this;
        },

        // ORDER & PAGINATION
        order: function (
          column: string,
          options: { ascending?: boolean; nullsFirst?: boolean } = {}
        ) {
          const direction = options.ascending === false ? "desc" : "asc";
          let orderStr = `&order=${column}.${direction}`;
          if (options.nullsFirst !== undefined) {
            orderStr += `.nulls${options.nullsFirst ? "first" : "last"}`;
          }
          queryParams += orderStr;
          return this;
        },

        limit: function (count: number) {
          queryParams += `&limit=${count}`;
          return this;
        },

        range: function (from: number, to: number) {
          queryParams += `&offset=${from}&limit=${to - from + 1}`;
          return this;
        },

        // MODIFIERS
        single: function () {
          isSingle = true;
          return this;
        },

        maybeSingle: function () {
          isMaybeSingle = true;
          return this;
        },

        // EXECUTION
        then: async function (callback?: (result: any) => void) {
          const endpoint = queryParams
            ? `${table}?${queryParams.substring(1)}`
            : table;
          const result = await makeRequest(endpoint);

          // Handle single/maybeSingle
          if (isSingle || isMaybeSingle) {
            if (result.data && Array.isArray(result.data)) {
              if (result.data.length === 0) {
                if (isSingle) {
                  result.error = { message: "No rows found" };
                  result.data = null;
                }
              } else if (result.data.length > 1) {
                if (isSingle) {
                  result.error = { message: "Multiple rows found" };
                  result.data = null;
                }
              } else {
                result.data = result.data[0];
              }
            }
          }

          // Reset
          queryParams = "";
          isSingle = false;
          isMaybeSingle = false;

          if (callback) {
            callback(result);
          }
          return result;
        },
      });

      return {
        select: (columns?: string, options?: any) => {
          const builder = createFilterBuilder();
          return builder.select(columns, options);
        },

        insert: (data: any | any[]) => {
          const builder = createFilterBuilder();

          builder.then = async (
            callback?: (result: QueryResult) => void
          ): Promise<QueryResult> => {
            const endpoint = queryParams
              ? `${table}?${queryParams.substring(1)}`
              : table;

            const result = await makeRequest(endpoint, {
              method: "POST",
              headers: {
                Prefer: "return=representation",
              },
              body: JSON.stringify(data),
            });

            queryParams = "";
            if (callback) {
              callback(result);
            }
            return result;
          };

          return builder;
        },

        upsert: (data: any | any[], options?: any) => {
          const builder = createFilterBuilder();

          builder.then = async (
            callback?: (result: QueryResult) => void
          ): Promise<QueryResult> => {
            let endpoint = table;
            const params = [];

            if (options?.onConflict) {
              params.push(`on_conflict=${options.onConflict}`);
            }
            if (queryParams) {
              params.push(queryParams.substring(1));
            }

            if (params.length > 0) {
              endpoint += `?${params.join("&")}`;
            }

            const headers: Record<string, string> = {
              Prefer: "return=representation,resolution=merge-duplicates",
            };

            if (options?.ignoreDuplicates) {
              headers.Prefer =
                "return=representation,resolution=ignore-duplicates";
            }

            const result = await makeRequest(endpoint, {
              method: "POST",
              headers,
              body: JSON.stringify(data),
            });

            queryParams = "";
            if (callback) {
              callback(result);
            }
            return result;
          };

          return builder;
        },

        update: (data: any) => {
          let routeId: string | null = null;
          const builder = createFilterBuilder();

          const originalEq = builder.eq;
          builder.eq = function (column: string, value: any) {
            if (column === "id") {
              routeId = value;
            } else {
              originalEq.call(this, column, value);
            }
            return this;
          };

          builder.then = async (
            callback?: (result: QueryResult) => void
          ): Promise<QueryResult> => {
            let endpoint;
            if (routeId) {
              endpoint = `${table}/${routeId}`;
              if (queryParams) {
                endpoint += `?${queryParams.substring(1)}`;
              }
            } else {
              endpoint = queryParams
                ? `${table}?${queryParams.substring(1)}`
                : table;
            }

            const result = await makeRequest(endpoint, {
              method: "PATCH",
              headers: {
                Prefer: "return=representation",
              },
              body: JSON.stringify(data),
            });

            queryParams = "";
            if (callback) {
              callback(result);
            }
            return result;
          };

          return builder;
        },

        delete: () => {
          const builder = createFilterBuilder();

          builder.then = async (
            callback?: (result: QueryResult) => void
          ): Promise<QueryResult> => {
            const endpoint = queryParams
              ? `${table}?${queryParams.substring(1)}`
              : table;

            const result = await makeRequest(endpoint, {
              method: "DELETE",
              headers: {
                Prefer: "return=representation",
              },
            });

            queryParams = "";
            if (callback) {
              callback(result);
            }
            return result;
          };

          return builder;
        },
      };
    },

    rpc: (fnName: string, params?: any) => ({
      then: async (
        callback?: (result: QueryResult) => void
      ): Promise<QueryResult> => {
        const result = await makeRequest(`rpc/${fnName}`, {
          method: "POST",
          body: JSON.stringify(params),
        });

        if (callback) {
          callback(result);
        }
        return result;
      },
    }),
  };
};
