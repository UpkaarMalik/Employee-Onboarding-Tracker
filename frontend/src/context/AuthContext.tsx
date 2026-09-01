import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

interface AuthUser {
  id: string;
  fullName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  mustChangePassword: boolean;
  /** True while restoring the session from a stored token on first load. */
  loading: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser, mustChangePassword: boolean) => void;
  completePasswordChange: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore the session from a stored token, since `user` only ever lives in
  // memory and would otherwise reset to null on every fresh mount.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/users/me')
      .then(({ data }) => {
        setUser({ id: data.id, fullName: data.full_name, role: data.role });
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  function login(accessToken: string, refreshToken: string, u: AuthUser, mcp: boolean) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    setMustChangePassword(mcp);
  }

  function completePasswordChange() {
    setMustChangePassword(false);
  }

  async function logout() {
    try {
      // Best-effort — revokes the refresh token and blacklists the current
      // access token server-side. The local session is cleared regardless.
      await api.post('/auth/logout');
    } catch {
      // Ignored — e.g. the access token was already expired.
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setMustChangePassword(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, mustChangePassword, loading, login, completePasswordChange, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
