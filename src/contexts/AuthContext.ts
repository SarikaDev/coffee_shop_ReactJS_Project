/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from "react";
export interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
