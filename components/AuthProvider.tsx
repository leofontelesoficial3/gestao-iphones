'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, getLoggedUser, login as doLogin, logout as doLogout } from '@/lib/auth';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (usuario: string, senha: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: () => false, logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getLoggedUser());
    setLoading(false);
  }, []);

  const login = (usuario: string, senha: string): boolean => {
    const u = doLogin(usuario, senha);
    if (u) { setUser(u); return true; }
    return false;
  };

  const logout = () => {
    doLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
