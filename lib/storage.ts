import { Produto, Stats, Fornecedor, TemaConta, TemaCor, ItemListaFornecedor } from '@/types';
import { getLoggedUser } from './auth';

// ── Tema da conta ─────────────────────────────────────────────
export async function getTema(): Promise<TemaConta> {
  const res = await fetch(`/api/conta/tema?conta=${getConta()}`);
  if (!res.ok) return { cor: 'azul', logo: null, whatsapp: null };
  return res.json();
}

export async function updateTema(cor: TemaCor, logo: string | null, whatsapp: string | null): Promise<TemaConta> {
  const res = await fetch('/api/conta/tema', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conta: getConta(), cor, logo, whatsapp }),
  });
  if (!res.ok) throw new Error('Falha ao salvar tema');
  return res.json();
}

const CONTA_OVERRIDE_KEY = 'gestao_iphones_conta_override';

function getConta(): string {
  const user = getLoggedUser();
  // Superadmin nunca visualiza a conta '*' (que é só placeholder dele) —
  // sempre olha através de uma conta real, default = 'default'
  if (user?.perfil === 'superadmin') {
    if (typeof window !== 'undefined') {
      const override = localStorage.getItem(CONTA_OVERRIDE_KEY);
      if (override) return override;
    }
    return 'default';
  }
  return user?.conta || 'default';
}

export function setContaOverride(conta: string | null): void {
  if (typeof window === 'undefined') return;
  if (conta) localStorage.setItem(CONTA_OVERRIDE_KEY, conta);
  else localStorage.removeItem(CONTA_OVERRIDE_KEY);
}

export function getContaOverride(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CONTA_OVERRIDE_KEY);
}

export interface ContaInfo {
  conta: string;
  nomeLoja: string;
  plano: string;
  totalUsuarios: number;
  totalProdutos: number;
}

export async function getContas(): Promise<ContaInfo[]> {
  const res = await fetch('/api/contas');
  if (!res.ok) return [];
  return res.json();
}

// ── Lista de Fornecedor (segundo estoque) ─────────────────────
export async function getListaFornecedor(): Promise<ItemListaFornecedor[]> {
  const res = await fetch(`/api/lista-fornecedor?conta=${getConta()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function addItemListaFornecedor(item: Omit<ItemListaFornecedor, 'id'>): Promise<ItemListaFornecedor> {
  const res = await fetch('/api/lista-fornecedor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...item, conta: getConta() }),
  });
  if (!res.ok) throw new Error('Falha ao salvar item');
  return res.json();
}

export async function updateItemListaFornecedor(id: number, item: Omit<ItemListaFornecedor, 'id'>): Promise<ItemListaFornecedor> {
  const res = await fetch('/api/lista-fornecedor', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...item }),
  });
  if (!res.ok) throw new Error('Falha ao atualizar item');
  return res.json();
}

export async function deleteItemListaFornecedor(id: number): Promise<void> {
  await fetch(`/api/lista-fornecedor?id=${id}`, { method: 'DELETE' });
}

export async function getCompilacaoLista(): Promise<{ at: string | null }> {
  const res = await fetch(`/api/lista-fornecedor/compilacao?conta=${getConta()}`);
  if (!res.ok) return { at: null };
  return res.json();
}

export async function marcarCompilacaoLista(): Promise<{ at: string | null }> {
  const res = await fetch('/api/lista-fornecedor/compilacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conta: getConta() }),
  });
  if (!res.ok) return { at: null };
  return res.json();
}

// ── Fornecedores ──────────────────────────────────────────────
export async function getFornecedores(withStats = false): Promise<Fornecedor[]> {
  const qs = new URLSearchParams({ conta: getConta() });
  if (withStats) qs.set('stats', '1');
  const res = await fetch(`/api/fornecedores?${qs.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function addFornecedor(data: Omit<Fornecedor, 'id'>): Promise<Fornecedor> {
  const res = await fetch('/api/fornecedores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, conta: getConta() }),
  });
  return res.json();
}

export async function updateFornecedor(id: number, updates: Partial<Fornecedor>): Promise<Fornecedor> {
  const res = await fetch('/api/fornecedores', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  return res.json();
}

export async function deleteFornecedor(id: number): Promise<void> {
  await fetch(`/api/fornecedores?id=${id}`, { method: 'DELETE' });
}

export async function getProdutosAsync(): Promise<Produto[]> {
  const res = await fetch(`/api/produtos?conta=${getConta()}`);
  if (!res.ok) return [];
  return res.json();
}

// Versão síncrona mantida para compatibilidade (usa cache local)
let _cache: Produto[] = [];
let _cacheLoaded = false;

export function getProdutos(): Produto[] {
  return _cache;
}

export async function loadProdutos(): Promise<Produto[]> {
  _cache = await getProdutosAsync();
  _cacheLoaded = true;
  return _cache;
}

export function isLoaded(): boolean {
  return _cacheLoaded;
}

export async function addProduto(produto: Omit<Produto, 'id'>): Promise<Produto> {
  const res = await fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...produto, conta: getConta() }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Erro ao criar produto (${res.status}): ${err.slice(0, 200)}`);
  }
  const novo = await res.json();
  _cache = [..._cache, novo];
  return novo;
}

export async function updateProduto(id: string, updates: Partial<Produto>): Promise<void> {
  const res = await fetch('/api/produtos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Erro ao atualizar produto (${res.status}): ${err.slice(0, 200)}`);
  }
  _cache = _cache.map(p => p.id === id ? { ...p, ...updates } : p);
}

export async function deleteProduto(id: string): Promise<void> {
  await fetch(`/api/produtos?id=${id}`, { method: 'DELETE' });
  _cache = _cache.filter(p => p.id !== id);
}

export async function getNextCodigo(): Promise<number> {
  const res = await fetch(`/api/produtos/next-codigo?conta=${getConta()}`);
  const data = await res.json();
  return data.codigo;
}

export function getStats(): Stats {
  const produtos = _cache;
  const vendidos = produtos.filter(p => p.status === 'VENDIDO');
  const emEstoque = produtos.filter(p => p.status === 'EM_ESTOQUE');

  return {
    totalFaturamento: vendidos.reduce((sum, p) => sum + (p.valorVenda ?? 0), 0),
    totalLucro: vendidos.reduce((sum, p) => sum + (p.lucro ?? 0), 0),
    qtdEmEstoque: emEstoque.length,
    valorEmEstoque: emEstoque.reduce((sum, p) => sum + p.valorCompra, 0),
    qtdVendidos: vendidos.length,
  };
}

// Mantido para compatibilidade mas não faz nada (dados estão no banco)
export function saveProdutos(_produtos: Produto[]): void {}
