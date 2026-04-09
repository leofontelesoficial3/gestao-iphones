const AUTH_KEY = 'gestao_iphones_auth';
const USERS_KEY = 'gestao_iphones_users';

export type Perfil = 'admin' | 'vendedor';

export interface User {
  usuario: string;
  nome: string;
  perfil: Perfil;
}

interface StoredUser {
  usuario: string;
  nome: string;
  senha: string;
  perfil: Perfil;
}

function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    const padrao: StoredUser[] = [
      { usuario: 'admin', nome: 'Administrador', senha: 'admin', perfil: 'admin' },
      { usuario: 'vendedor', nome: 'Vendedor', senha: 'vendedor', perfil: 'vendedor' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(padrao));
    return padrao;
  }
  // Migração: garante que todos os usuários tenham perfil
  const users = JSON.parse(raw) as StoredUser[];
  let migrou = false;
  users.forEach(u => {
    if (!u.perfil) {
      u.perfil = u.usuario === 'admin' ? 'admin' : 'vendedor';
      migrou = true;
    }
  });
  // Adiciona vendedor padrão se não existir
  if (!users.find(u => u.perfil === 'vendedor')) {
    users.push({ usuario: 'vendedor', nome: 'Vendedor', senha: 'vendedor', perfil: 'vendedor' });
    migrou = true;
  }
  if (migrou) localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

export function login(usuario: string, senha: string): User | null {
  const users = getUsers();
  const found = users.find(u => u.usuario === usuario && u.senha === senha);
  if (!found) return null;
  const user: User = { usuario: found.usuario, nome: found.nome, perfil: found.perfil };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getLoggedUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  const user = JSON.parse(raw) as User;
  // Migração: se não tem perfil, assume admin
  if (!user.perfil) user.perfil = 'admin';
  return user;
}

export function alterarSenha(usuario: string, senhaAtual: string, novaSenha: string): boolean {
  const users = getUsers();
  const idx = users.findIndex(u => u.usuario === usuario && u.senha === senhaAtual);
  if (idx === -1) return false;
  users[idx].senha = novaSenha;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}
