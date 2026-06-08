import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchProfile, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/lifelink';
import { clearTokens, getRefreshToken, saveTokens } from './tokenStorage';
import type { AuthPayload, User } from '../types';

interface AuthContextValue {
  user: User | null;
  booting: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Parameters<typeof registerRequest>[0]) => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractUser(payload: AuthPayload | { user?: User } | User): User {
  if ('user' in payload && payload.user) {
    return payload.user;
  }
  return payload as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  const persistAuth = useCallback(async (payload: AuthPayload) => {
    await saveTokens(payload.accessToken, payload.refreshToken);
    setUser(payload.user);
  }, []);

  const reloadProfile = useCallback(async () => {
    const profile = await fetchProfile();
    setUser(extractUser(profile));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await reloadProfile();
      } catch {
        await clearTokens();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [reloadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      booting,
      login: async (email, password) => {
        const payload = await loginRequest({ email, password });
        await persistAuth(payload);
      },
      register: async (payload) => {
        const response = await registerRequest(payload);
        await persistAuth(response);
      },
      logout: async () => {
        const refreshToken = await getRefreshToken();
        try {
          await logoutRequest(refreshToken || undefined);
        } finally {
          await clearTokens();
          setUser(null);
        }
      },
      reloadProfile,
    }),
    [booting, persistAuth, reloadProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
