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
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // `user` only ever lived in memory — any full page reload (or a fresh
  // browser tab hitting a protected route directly) wiped it back to null
  // even though the access token in localStorage was still valid, which is
  // exactly what made role-gated UI (the sidebar's Admin section) vanish
  // after a reload. Restore it from the API on mount instead.
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
        // Stored token is invalid/expired — clear it so ProtectedRoute
        // sends the user back to login instead of a broken half-state.
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

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setMustChangePassword(false);
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
