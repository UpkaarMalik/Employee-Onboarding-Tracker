import { createContext, useContext, useState} from 'react';
import  type {ReactNode} from 'react';

interface AuthUser {
  id: string;
  fullName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  mustChangePassword: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser, mustChangePassword: boolean) => void;
  completePasswordChange: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

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
    <AuthContext.Provider value={{ user, mustChangePassword, login, completePasswordChange, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}