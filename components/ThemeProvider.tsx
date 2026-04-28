'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { TemaConta, TemaCor } from '@/types';
import { getTema } from '@/lib/storage';
import { useAuth } from './AuthProvider';

export interface PaletaCor {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  bg: string;
  text: string;
  label: string;
}

export const PALETAS: Record<TemaCor, PaletaCor> = {
  branco:   { primary: '#3B3B4F', primaryDark: '#1f1f2c', primaryLight: '#eef0f4', bg: '#ffffff', text: '#1a1a1a', label: 'Branco' },
  preto:    { primary: '#1a1a1a', primaryDark: '#000000', primaryLight: '#2a2a3d', bg: '#1a1a1a', text: '#f4f5f7', label: 'Preto' },
  azul:     { primary: '#2E78B7', primaryDark: '#1a5a8f', primaryLight: '#eef5fb', bg: '#f4f5f7', text: '#1a1a1a', label: 'Azul' },
  vermelho: { primary: '#DC2626', primaryDark: '#991B1B', primaryLight: '#fef2f2', bg: '#f4f5f7', text: '#1a1a1a', label: 'Vermelho' },
  amarelo:  { primary: '#EAB308', primaryDark: '#A16207', primaryLight: '#fefce8', bg: '#f4f5f7', text: '#1a1a1a', label: 'Amarelo' },
  laranja:  { primary: '#EA580C', primaryDark: '#9A3412', primaryLight: '#fff7ed', bg: '#f4f5f7', text: '#1a1a1a', label: 'Laranja' },
};

interface ThemeContextValue {
  tema: TemaConta;
  paleta: PaletaCor;
  setTema: (t: TemaConta) => void;
  reload: () => Promise<void>;
}

const TemaPadrao: TemaConta = { cor: 'azul', logo: null, whatsapp: null };

const ThemeContext = createContext<ThemeContextValue>({
  tema: TemaPadrao,
  paleta: PALETAS.azul,
  setTema: () => {},
  reload: async () => {},
});

function aplicarCssVars(paleta: PaletaCor) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', paleta.primary);
  root.style.setProperty('--brand-primary-dark', paleta.primaryDark);
  root.style.setProperty('--brand-primary-light', paleta.primaryLight);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tema, setTemaState] = useState<TemaConta>(TemaPadrao);

  const reload = useCallback(async () => {
    if (!user) return;
    try {
      const t = await getTema();
      setTemaState(t);
      aplicarCssVars(PALETAS[t.cor] ?? PALETAS.azul);
    } catch {
      /* fallback ao padrão */
    }
  }, [user]);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  const paleta = PALETAS[tema.cor] ?? PALETAS.azul;

  const setTema = (t: TemaConta) => {
    setTemaState(t);
    aplicarCssVars(PALETAS[t.cor] ?? PALETAS.azul);
  };

  return (
    <ThemeContext.Provider value={{ tema, paleta, setTema, reload }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
