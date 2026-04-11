'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { loadProdutos, updateProduto, addProduto, getNextCodigo } from '@/lib/storage';
import { Produto } from '@/types';
import StatsCard from '@/components/StatsCard';
import VendaRapidaModal from '@/components/VendaRapidaModal';
import VendaModal, { ProdutoRecebidoData } from '@/components/VendaModal';
import ReciboModal from '@/components/ReciboModal';
import Toast from '@/components/Toast';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [todos, setTodos] = useState<Produto[]>([]);
  const [mesSel, setMesSel] = useState('TODOS');
  const [ocultarValores, setOcultarValores] = useState(false);
  const mostrar = !ocultarValores;

  // Modais de venda
  const [vendaRapidaOpen, setVendaRapidaOpen] = useState(false);
  const [vendendo, setVendendo] = useState<Produto | null>(null);
  const [reciboAberto, setReciboAberto] = useState(false);
  const [produtoRecibo, setProdutoRecibo] = useState<Produto | null>(null);
  const [toastVenda, setToastVenda] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const reload = useCallback(async () => {
    const ps = await loadProdutos();
    setTodos(ps);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAbrirVenda = (produto: Produto) => {
    setVendaRapidaOpen(false);
    setVendendo(produto);
  };

  const handleSaveVenda = async (updates: Partial<Produto>, produtoRecebido?: ProdutoRecebidoData) => {
    if (!vendendo) return;
    const valorStr = updates.valorVenda
      ? updates.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '';
    await updateProduto(vendendo.id, updates);
    if (produtoRecebido) {
      const cod = await getNextCodigo();
      await addProduto({
        ...produtoRecebido,
        codigo: cod,
        status: 'EM_ESTOQUE',
        fotos: [],
      });
    }
    const vendido: Produto = { ...vendendo, ...updates } as Produto;
    setProdutoRecibo(vendido);
    setReciboAberto(true);
    setToastMsg(`${vendendo.modelo} ${vendendo.linha} vendido por ${valorStr}!`);
    setToastVenda(true);
    await reload();
    setVendendo(null);
  };

  // Meses disponíveis com vendas
  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    todos.filter(p => p.status === 'VENDIDO' && p.dataVenda).forEach(p => {
      const [ano, mes] = p.dataVenda!.split('-');
      set.add(`${ano}-${mes}`);
    });
    return Array.from(set).sort().reverse();
  }, [todos]);

  // Produtos filtrados por mês
  const vendidos = useMemo(() => {
    return todos
      .filter(p => p.status === 'VENDIDO')
      .filter(p => {
        if (mesSel === 'TODOS') return true;
        return p.dataVenda?.startsWith(mesSel);
      })
      .sort((a, b) => (b.dataVenda ?? '').localeCompare(a.dataVenda ?? ''));
  }, [todos, mesSel]);

  const emEstoque = todos.filter(p => p.status === 'EM_ESTOQUE');

  const stats = {
    totalFaturamento: vendidos.reduce((s, p) => s + (p.valorVenda ?? 0), 0),
    totalLucro: vendidos.reduce((s, p) => s + (p.lucro ?? 0), 0),
    qtdVendidos: vendidos.length,
    qtdEmEstoque: emEstoque.length,
    valorEmEstoque: emEstoque.reduce((s, p) => s + p.valorCompra, 0),
  };

  const ultimas = vendidos.slice(0, 8);

  const formatMesLabel = (key: string) => {
    const [ano, mes] = key.split('-');
    return `${MESES[parseInt(mes) - 1]} ${ano}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#3B3B4F' }}>
          Dashboard — <span style={{ color: '#2E78B7' }}>iPhones Fortaleza</span>
        </h1>
        <div className="flex gap-2 flex-wrap">
          <select
            className="input !w-auto text-sm"
            value={mesSel}
            onChange={e => setMesSel(e.target.value)}
          >
            <option value="TODOS">Todos os meses</option>
            {mesesDisponiveis.map(m => (
              <option key={m} value={m}>{formatMesLabel(m)}</option>
            ))}
          </select>
          <button
            onClick={() => setOcultarValores(prev => !prev)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              ocultarValores
                ? 'bg-red-100 text-red-600 border border-red-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {ocultarValores ? '🔒 Valores ocultos' : '👁 Ocultar valores'}
          </button>
        </div>
      </div>

      {/* Botão grande: Realizar Venda */}
      <button
        onClick={() => setVendaRapidaOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl p-5 md:p-6 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, #2E78B7 0%, #1a5a8f 50%, #3B3B4F 100%)',
          boxShadow: '0 12px 40px rgba(46,120,183,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {/* Textura decorativa */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(90,170,74,0.2) 0%, transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-4 md:gap-5">
          {/* Ícone */}
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-[-6deg]"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-3xl md:text-4xl">💸</span>
          </div>
          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold tracking-[0.25em] uppercase text-white/60">
              Atalho rápido
            </p>
            <h2 className="text-lg md:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              Realizar Venda
            </h2>
            <p className="text-xs md:text-sm text-white/70 mt-0.5 hidden sm:block">
              Busque pelo código ou modelo · ou cadastre um produto do fornecedor
            </p>
          </div>
          {/* Arrow */}
          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all group-hover:translate-x-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Faturamento"
          value={mostrar ? fmt(stats.totalFaturamento) : '••••••'}
          sub={mesSel === 'TODOS' ? 'Todas as vendas' : formatMesLabel(mesSel)}
          color="blue"
        />
        <StatsCard
          title="Lucro"
          value={mostrar ? fmt(stats.totalLucro) : '••••••'}
          sub={`${stats.qtdVendidos} aparelhos vendidos`}
          color="green"
        />
        <StatsCard
          title="Em Estoque"
          value={`${stats.qtdEmEstoque} aparelhos`}
          sub={mostrar ? `Valor: ${fmt(stats.valorEmEstoque)}` : ''}
          color="yellow"
        />
        <StatsCard
          title="Ticket Médio"
          value={mostrar
            ? (stats.qtdVendidos > 0 ? fmt(stats.totalFaturamento / stats.qtdVendidos) : 'R$ 0')
            : '••••••'}
          sub="Por aparelho vendido"
          color="purple"
        />
      </div>

      {/* Últimas vendas */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {mesSel === 'TODOS' ? 'Últimas Vendas' : `Vendas de ${formatMesLabel(mesSel)}`}
          </h2>
          <Link href="/vendas" className="text-sm hover:underline" style={{ color: '#2E78B7' }}>
            Ver todas →
          </Link>
        </div>
        {ultimas.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhuma venda {mesSel !== 'TODOS' ? 'neste mês' : 'registrada'}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Modelo</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">GB / Cor</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Data Venda</th>
                  {mostrar && <th className="text-right py-2 px-2 text-gray-500 font-medium">Venda</th>}
                  {mostrar && <th className="text-right py-2 px-2 text-gray-500 font-medium">Lucro</th>}
                </tr>
              </thead>
              <tbody>
                {ultimas.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">
                      {p.modelo} <span className="text-gray-400">{p.linha}</span>
                    </td>
                    <td className="py-2 px-2 text-gray-500">{p.gb} · {p.cor}</td>
                    <td className="py-2 px-2 text-gray-500">
                      {p.dataVenda
                        ? new Date(p.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    {mostrar && (
                      <td className="py-2 px-2 text-right font-semibold">
                        {p.valorVenda ? fmt(p.valorVenda) : '-'}
                      </td>
                    )}
                    {mostrar && (
                      <td className={`py-2 px-2 text-right font-semibold ${
                        (p.lucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {p.lucro !== undefined ? fmt(p.lucro) : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/estoque"
          className="bg-white rounded-2xl shadow p-4 md:p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: '#eef5fb' }}>
            📦
          </div>
          <div>
            <p className="font-semibold" style={{ color: '#3B3B4F' }}>Gerenciar Estoque</p>
            <p className="text-sm text-gray-400">Cadastrar e visualizar aparelhos</p>
          </div>
        </Link>
        <Link href="/vendas"
          className="bg-white rounded-2xl shadow p-4 md:p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: '#eef7ec' }}>
            💰
          </div>
          <div>
            <p className="font-semibold" style={{ color: '#3B3B4F' }}>Ver Vendas</p>
            <p className="text-sm text-gray-400">Histórico de todas as vendas</p>
          </div>
        </Link>
      </div>

      {/* Modais de venda */}
      <VendaRapidaModal
        open={vendaRapidaOpen}
        onClose={() => setVendaRapidaOpen(false)}
        produtos={todos}
        onSelect={handleAbrirVenda}
        onFornecedorCriado={reload}
      />
      <VendaModal
        open={!!vendendo}
        onClose={() => setVendendo(null)}
        onSave={handleSaveVenda}
        produto={vendendo}
      />
      <ReciboModal
        open={reciboAberto}
        onClose={() => { setReciboAberto(false); setProdutoRecibo(null); }}
        produto={produtoRecibo}
      />
      <Toast
        open={toastVenda}
        onClose={() => setToastVenda(false)}
        tipo="venda"
        mensagem={toastMsg}
      />
    </div>
  );
}
