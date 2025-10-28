import { createContext } from "react";

import type { AuthUser } from "../../api/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  isInitialising: boolean;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
