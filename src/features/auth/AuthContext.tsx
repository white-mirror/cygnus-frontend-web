import {
  type FC,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type AuthUser,
} from "../../api/auth";
import { UnauthorizedError, isUnauthorizedError } from "../../api/errors";

import { AuthContext, type AuthContextValue } from "./context";
export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialising, setIsInitialising] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setUser(null);
        return null;
      }
      console.error("[auth] Failed to refresh user", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    const initialise = async () => {
      try {
        await refreshUser();
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          console.error("[auth] Unable to initialise session", error);
        }
      } finally {
        if (isActive) {
          setIsInitialising(false);
        }
      }
    };

    void initialise();

    return () => {
      isActive = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      setIsInitialising(true);
      setIsAuthenticating(true);
      try {
        await loginRequest(email, password);
        const authenticatedUser = await refreshUser();

        if (!authenticatedUser) {
          throw new UnauthorizedError();
        }

        return authenticatedUser;
      } finally {
        setIsAuthenticating(false);
        setIsInitialising(false);
      }
    },
    [refreshUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        console.error("[auth] Failed to logout", error);
      }
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitialising,
      isAuthenticating,
      login,
      logout,
      refreshUser,
    }),
    [isAuthenticating, isInitialising, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
