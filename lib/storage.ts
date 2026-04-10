import { Produto, Stats } from '@/types';
import { seedProdutos } from './seedData';
import { getLoggedUser } from './auth';

const SEED_VERSION = 'v3';

function getStorageKey(): string {
  const user = getLoggedUser();
  if (!user || user.conta === 'default') return 'gestao_iphones_produtos';
  return `gestao_iphones_${user.conta}`;
}

function isDefaultAccount(): boolean {
  const user = getLoggedUser();
  return !user || user.conta === 'default';
}

export function getProdutos(): Produto[] {
  if (typeof window === 'undefined') return [];
  const key = getStorageKey();

  if (isDefaultAccount()) {
    // Conta padrão (admin/vendedor): usa seed
    const versao = localStorage.getItem(key + '_version');
    if (versao !== SEED_VERSION) {
      localStorage.setItem(key, JSON.stringify(seedProdutos));
      localStorage.setItem(key + '_version', SEED_VERSION);
      return seedProdutos;
    }
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    if (isDefaultAccount()) return seedProdutos;
    return []; // Contas novas começam vazias
  }
  return JSON.parse(raw) as Produto[];
}

export function saveProdutos(produtos: Produto[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(produtos));
}

export function addProduto(produto: Omit<Produto, 'id'>): Produto {
  const produtos = getProdutos();
  const newProduto: Produto = { ...produto, id: crypto.randomUUID() };
  saveProdutos([...produtos, newProduto]);
  return newProduto;
}

export function updateProduto(id: string, updates: Partial<Produto>): void {
  const produtos = getProdutos();
  const updated = produtos.map(p => p.id === id ? { ...p, ...updates } : p);
  saveProdutos(updated);
}

export function deleteProduto(id: string): void {
  const produtos = getProdutos();
  saveProdutos(produtos.filter(p => p.id !== id));
}

export function getNextCodigo(): number {
  const produtos = getProdutos();
  if (produtos.length === 0) return 10001;
  return Math.max(...produtos.map(p => p.codigo)) + 1;
}

export function getStats(): Stats {
  const produtos = getProdutos();
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
