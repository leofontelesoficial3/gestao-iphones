'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Perfil, getLoggedUser, login as doLogin, logout as doLogout } from '@/lib/auth';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  perfil: Perfil | null;
  conta: string;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true, isAdmin: false, isSuperAdmin: false, perfil: null, conta: 'default',
  login: async () => false, logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getLoggedUser());
    setLoading(false);
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    const u = await doLogin(usuario, senha);
    if (u) {
      // Ao logar como superadmin sem override, define 'default' como conta inicial
      if (u.perfil === 'superadmin' && typeof window !== 'undefined') {
        if (!localStorage.getItem('gestao_iphones_conta_override')) {
          localStorage.setItem('gestao_iphones_conta_override', 'default');
        }
      }
      setUser(u);
      return true;
    }
    return false;
  };

  const logout = () => {
    doLogout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gestao_iphones_conta_override');
    }
    setUser(null);
  };

  const isSuperAdmin = user?.perfil === 'superadmin';
  // Superadmin tem todos os privilégios de admin também
  const isAdmin = user?.perfil === 'admin' || isSuperAdmin;
  const perfil = user?.perfil ?? null;
  // Para o superadmin, a conta exposta é a que ele selecionou no switcher
  // (ou 'default' como fallback) — nunca a conta '*' interna do superadmin
  let conta = user?.conta ?? 'default';
  if (isSuperAdmin) {
    if (typeof window !== 'undefined') {
      conta = localStorage.getItem('gestao_iphones_conta_override') || 'default';
    } else {
      conta = 'default';
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, perfil, conta, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
