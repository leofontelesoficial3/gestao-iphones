const AUTH_KEY = 'gestao_iphones_auth';
const USERS_KEY = 'gestao_iphones_users';

export type Perfil = 'admin' | 'vendedor';

export interface User {
  usuario: string;
  nome: string;
  perfil: Perfil;
  conta: string; // identificador da conta (agrupa admin+vendedores)
}

interface StoredUser {
  usuario: string;
  nome: string;
  senha: string;
  perfil: Perfil;
  conta: string;
}

function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    const padrao: StoredUser[] = [
      { usuario: 'admin', nome: 'Administrador', senha: 'admin', perfil: 'admin', conta: 'default' },
      { usuario: 'vendedor', nome: 'Vendedor', senha: 'vendedor', perfil: 'vendedor', conta: 'default' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(padrao));
    return padrao;
  }
  const users = JSON.parse(raw) as StoredUser[];
  let migrou = false;
  users.forEach(u => {
    if (!u.perfil) { u.perfil = u.usuario === 'admin' ? 'admin' : 'vendedor'; migrou = true; }
    if (!u.conta) { u.conta = 'default'; migrou = true; }
  });
  if (!users.find(u => u.usuario === 'vendedor')) {
    users.push({ usuario: 'vendedor', nome: 'Vendedor', senha: 'vendedor', perfil: 'vendedor', conta: 'default' });
    migrou = true;
  }
  if (migrou) localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

export function login(usuario: string, senha: string): User | null {
  const users = getUsers();
  const found = users.find(u => u.usuario === usuario && u.senha === senha);
  if (!found) return null;
  const user: User = { usuario: found.usuario, nome: found.nome, perfil: found.perfil, conta: found.conta };
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
  if (!user.perfil) user.perfil = 'admin';
  if (!user.conta) user.conta = 'default';
  return user;
}

export interface RegistroData {
  nomeLoja: string;
  nomeAdmin: string;
  usuario: string;
  senha: string;
}

export function registrar(data: RegistroData): { ok: boolean; erro?: string } {
  const users = getUsers();
  if (users.find(u => u.usuario === data.usuario)) {
    return { ok: false, erro: 'Esse nome de usuário já está em uso.' };
  }
  // Cria ID único para a conta
  const conta = 'conta_' + Date.now().toString(36);
  const novoAdmin: StoredUser = {
    usuario: data.usuario,
    nome: data.nomeAdmin,
    senha: data.senha,
    perfil: 'admin',
    conta,
  };
  users.push(novoAdmin);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // Inicializa storage vazio para a nova conta
  localStorage.setItem(`gestao_iphones_${conta}`, JSON.stringify([]));
  localStorage.setItem(`gestao_iphones_${conta}_version`, 'new');
  localStorage.setItem(`gestao_iphones_${conta}_loja`, data.nomeLoja);
  return { ok: true };
}

export function getNomeLoja(conta: string): string {
  if (typeof window === 'undefined') return 'iPhones Fortaleza';
  if (conta === 'default') return 'iPhones Fortaleza';
  return localStorage.getItem(`gestao_iphones_${conta}_loja`) || 'Minha Loja';
}

export function alterarSenha(usuario: string, senhaAtual: string, novaSenha: string): boolean {
  const users = getUsers();
  const idx = users.findIndex(u => u.usuario === usuario && u.senha === senhaAtual);
  if (idx === -1) return false;
  users[idx].senha = novaSenha;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}

// Adiciona vendedor à mesma conta
export function adicionarVendedor(conta: string, usuario: string, nome: string, senha: string): { ok: boolean; erro?: string } {
  const users = getUsers();
  if (users.find(u => u.usuario === usuario)) {
    return { ok: false, erro: 'Esse nome de usuário já está em uso.' };
  }
  users.push({ usuario, nome, senha, perfil: 'vendedor', conta });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { ok: true };
}
