/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, ReactNode } from "react";

import { createClient } from "../lib/supabase";
import AuthContext, { AuthContextType } from "../contexts/AuthContext";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setToken(data.session.access_token);
        setUser(data.session.user);
      }
    } catch (err) {
      console.error("Session check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error("No session received");

    setToken(data.session.access_token);
    setUser(data.session.user);
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    token,
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
