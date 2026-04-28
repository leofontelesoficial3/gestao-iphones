import { Produto, Stats, Fornecedor, TemaConta, TemaCor } from '@/types';
import { getLoggedUser } from './auth';

// ── Tema da conta ─────────────────────────────────────────────
export async function getTema(): Promise<TemaConta> {
  const res = await fetch(`/api/conta/tema?conta=${getConta()}`);
  if (!res.ok) return { cor: 'azul', logo: null };
  return res.json();
}

export async function updateTema(cor: TemaCor, logo: string | null): Promise<TemaConta> {
  const res = await fetch('/api/conta/tema', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conta: getConta(), cor, logo }),
  });
  if (!res.ok) throw new Error('Falha ao salvar tema');
  return res.json();
}

function getConta(): string {
  const user = getLoggedUser();
  return user?.conta || 'default';
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
