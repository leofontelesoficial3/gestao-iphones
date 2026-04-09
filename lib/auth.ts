const AUTH_KEY = 'gestao_iphones_auth';
const USERS_KEY = 'gestao_iphones_users';

export interface User {
  usuario: string;
  nome: string;
}

interface StoredUser {
  usuario: string;
  nome: string;
  senha: string;
}

function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    // Cria usuário padrão no primeiro acesso
    const padrao: StoredUser[] = [
      { usuario: 'admin', nome: 'Administrador', senha: 'admin' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(padrao));
    return padrao;
  }
  return JSON.parse(raw) as StoredUser[];
}

export function login(usuario: string, senha: string): User | null {
  const users = getUsers();
  const found = users.find(u => u.usuario === usuario && u.senha === senha);
  if (!found) return null;
  const user: User = { usuario: found.usuario, nome: found.nome };
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
  return JSON.parse(raw) as User;
}

export function alterarSenha(usuario: string, senhaAtual: string, novaSenha: string): boolean {
  const users = getUsers();
  const idx = users.findIndex(u => u.usuario === usuario && u.senha === senhaAtual);
  if (idx === -1) return false;
  users[idx].senha = novaSenha;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}
