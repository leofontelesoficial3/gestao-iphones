import { Produto, Stats } from '@/types';
import { seedProdutos } from './seedData';

const STORAGE_KEY = 'gestao_iphones_produtos';
const SEED_VERSION = 'v3'; // Atualize ao mudar o seedData

export function getProdutos(): Produto[] {
  if (typeof window === 'undefined') return [];
  const versao = localStorage.getItem(STORAGE_KEY + '_version');
  if (versao !== SEED_VERSION) {
    // Seed atualizado — recarrega os dados
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProdutos));
    localStorage.setItem(STORAGE_KEY + '_version', SEED_VERSION);
    return seedProdutos;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedProdutos;
  return JSON.parse(raw) as Produto[];
}

export function saveProdutos(produtos: Produto[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(produtos));
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
