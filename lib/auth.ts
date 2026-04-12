const AUTH_KEY = 'gestao_iphones_auth';

export type Perfil = 'admin' | 'vendedor';
export type Plano = 'gratuito' | 'profissional' | 'empresarial';

export interface User {
  usuario: string;
  nome: string;
  perfil: Perfil;
  conta: string;
}

export interface RegistroData {
  nomeLoja: string;
  nomeAdmin: string;
  usuario: string;
  senha: string;
}

export function getLoggedUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  const user = JSON.parse(raw) as User;
  if (!user.perfil) user.perfil = 'admin';
  if (!user.conta) user.conta = 'default';
  return user;
}

export async function login(usuario: string, senha: string): Promise<User | null> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
  if (!res.ok) return null;
  const user = await res.json() as User;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export async function registrar(data: RegistroData): Promise<{ ok: boolean; erro?: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    return { ok: false, erro: err.error };
  }
  return { ok: true };
}

export function getNomeLoja(_conta: string): string {
  return 'iPhones Fortaleza';
}

export async function alterarSenha(usuario: string, senhaAtual: string, novaSenha: string): Promise<boolean> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senhaAtual, novaSenha }),
  });
  return res.ok;
}

export function getPlano(_conta: string): Plano {
  return 'empresarial';
}

export function setPlano(_conta: string, _plano: Plano): void {}

export async function getVendedoresDaConta(conta: string): Promise<{ usuario: string; nome: string; perfil: Perfil }[]> {
  const res = await fetch(`/api/vendedores?conta=${conta}`);
  const data = await res.json();
  return data.vendedores;
}

export async function getLimiteVendedores(conta: string): Promise<{ limite: number; atual: number; plano: Plano }> {
  const res = await fetch(`/api/vendedores?conta=${conta}`);
  const data = await res.json();
  return { limite: data.limite, atual: data.atual, plano: data.plano };
}

/**
 * Adiciona um membro à equipe. `perfil` define o cargo
 * ('admin' ou 'vendedor'). Se omitido, default = 'vendedor'.
 */
export async function adicionarVendedor(
  conta: string,
  usuario: string,
  nome: string,
  senha: string,
  perfil: Perfil = 'vendedor',
): Promise<{ ok: boolean; erro?: string }> {
  const res = await fetch('/api/vendedores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conta, usuario, nome, senha, perfil }),
  });
  if (!res.ok) {
    const err = await res.json();
    return { ok: false, erro: err.error };
  }
  return { ok: true };
}

export async function removerVendedor(conta: string, usuario: string): Promise<boolean> {
  const res = await fetch(`/api/vendedores?usuario=${usuario}&conta=${conta}`, { method: 'DELETE' });
  return res.ok;
}
