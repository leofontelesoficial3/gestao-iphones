'use client';
import { useEffect, useState, useMemo } from 'react';
import { Produto } from '@/types';
import { corSuave } from '@/lib/cores';
import { loadProdutos, updateProduto, deleteProduto } from '@/lib/storage';
import VendaModal from '@/components/VendaModal';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function VendasPage() {
  const [vendas, setVendas] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [mesSel, setMesSel] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ordem, setOrdem] = useState<'recente' | 'antiga'>('recente');
  const [desfazendo, setDesfazendo] = useState<string | null>(null);
  const [editando, setEditando] = useState<Produto | null>(null);

  async function handleSalvarEdicao(updates: Partial<Produto>) {
    if (!editando) return;
    // Ao editar, nunca criamos produto recebido novo (já foi criado na venda original)
    await updateProduto(editando.id, updates);
    const atualizado: Produto = { ...editando, ...updates } as Produto;
    setVendas(prev => prev.map(v => v.id === editando.id ? atualizado : v));
    setEditando(null);
  }

  async function handleDesfazerVenda(p: Produto) {
    const limparVenda = {
      status: 'EM_ESTOQUE' as const,
      dataVenda: undefined,
      valorVenda: undefined,
      custos: undefined,
      cliente: undefined,
      contato: undefined,
      lucro: undefined,
      formasPagamento: undefined,
      parcelasCredito: undefined,
      acrescimo: undefined,
    };

    if (p.fornecedorId) {
      const escolha = prompt(
        `Desfazer venda: "${p.modelo} ${p.gb} ${p.cor}"\n\nEste produto veio de um fornecedor.\n\nDigite:\n  1 — Manter no estoque\n  2 — Apagar do estoque\n\nOu cancele para voltar.`
      );
      if (!escolha) return;
      setDesfazendo(p.id);
      try {
        if (escolha.trim() === '2') {
          await deleteProduto(p.id);
        } else {
          await updateProduto(p.id, limparVenda);
        }
        setVendas(prev => prev.filter(v => v.id !== p.id));
      } catch {
        alert('Erro ao desfazer venda. Tente novamente.');
      } finally {
        setDesfazendo(null);
      }
    } else {
      const ok = confirm(
        `Deseja desfazer a venda do produto "${p.modelo} ${p.gb} ${p.cor}"?\n\nO produto voltará para o estoque.`
      );
      if (!ok) return;
      setDesfazendo(p.id);
      try {
        await updateProduto(p.id, limparVenda);
        setVendas(prev => prev.filter(v => v.id !== p.id));
      } catch {
        alert('Erro ao desfazer venda. Tente novamente.');
      } finally {
        setDesfazendo(null);
      }
    }
  }

  useEffect(() => {
    loadProdutos().then(todos => {
      const v = todos
        .filter(p => p.status === 'VENDIDO')
        .sort((a, b) => (b.dataVenda ?? '').localeCompare(a.dataVenda ?? ''));
      setVendas(v);
    });
  }, []);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    vendas.filter(p => p.dataVenda).forEach(p => {
      const [ano, mes] = p.dataVenda!.split('-');
      set.add(`${ano}-${mes}`);
    });
    return Array.from(set).sort().reverse();
  }, [vendas]);

  const formatMesLabel = (key: string) => {
    const [ano, mes] = key.split('-');
    return `${MESES[parseInt(mes) - 1]} ${ano}`;
  };

  const filtradas = useMemo(() => {
    const list = vendas.filter(p => {
      const matchMes = mesSel === 'TODOS' || p.dataVenda?.startsWith(mesSel);
      const matchInicio = !dataInicio || (p.dataVenda ?? '') >= dataInicio;
      const matchFim = !dataFim || (p.dataVenda ?? '') <= dataFim;
      const q = busca.toLowerCase();
      const matchQ = !q || [p.modelo, p.linha, p.cor, p.cliente, p.contato, String(p.codigo)]
        .some(v => v?.toLowerCase().includes(q));
      return matchMes && matchInicio && matchFim && matchQ;
    });
    return list.sort((a, b) =>
      ordem === 'recente'
        ? (b.dataVenda ?? '').localeCompare(a.dataVenda ?? '')
        : (a.dataVenda ?? '').localeCompare(b.dataVenda ?? '')
    );
  }, [vendas, mesSel, dataInicio, dataFim, busca, ordem]);

  const totalFaturamento = filtradas.reduce((s, p) => s + (p.valorVenda ?? 0), 0);
  const totalLucro = filtradas.reduce((s, p) => s + (p.lucro ?? 0), 0);
  const totalCustos = filtradas.reduce((s, p) => s + (p.custos ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
        <div className="flex items-center gap-2 flex-wrap">
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
          <select
            className="input !w-auto text-sm"
            value={ordem}
            onChange={e => setOrdem(e.target.value as 'recente' | 'antiga')}
          >
            <option value="recente">Mais recente</option>
            <option value="antiga">Mais antiga</option>
          </select>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-white rounded-xl shadow p-2.5 md:p-4 border-l-4 border-blue-500 overflow-hidden">
          <p className="text-[10px] md:text-xs text-gray-500">Faturamento</p>
          <p className="text-sm md:text-xl font-bold text-blue-700 truncate">{fmt(totalFaturamento)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-2.5 md:p-4 border-l-4 border-green-500 overflow-hidden">
          <p className="text-[10px] md:text-xs text-gray-500">Lucro Total</p>
          <p className="text-sm md:text-xl font-bold text-green-700 truncate">{fmt(totalLucro)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-2.5 md:p-4 border-l-4 border-red-400 overflow-hidden">
          <p className="text-[10px] md:text-xs text-gray-500">Custos</p>
          <p className="text-sm md:text-xl font-bold text-red-600 truncate">{fmt(totalCustos)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-end">
        <input
          type="text"
          placeholder="Buscar modelo, cliente..."
          className="input flex-1 md:max-w-xs"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <div>
            <label className="text-[10px] text-gray-400 block">De</label>
            <input type="date" className="input !w-auto text-sm !py-1.5" value={dataInicio}
              onChange={e => setDataInicio(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block">Até</label>
            <input type="date" className="input !w-auto text-sm !py-1.5" value={dataFim}
              onChange={e => setDataFim(e.target.value)} />
          </div>
          {(dataInicio || dataFim) && (
            <button
              onClick={() => { setDataInicio(''); setDataFim(''); }}
              className="text-xs text-red-500 hover:text-red-700 self-end pb-1.5"
            >
              Limpar
            </button>
          )}
        </div>
        <span className="text-sm text-gray-400 whitespace-nowrap self-end pb-1">{filtradas.length} venda(s)</span>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filtradas.length === 0 && (
          <p className="py-10 text-center text-gray-400">Nenhuma venda encontrada.</p>
        )}
        {filtradas.map(p => (
          <div
            key={p.id}
            className="rounded-xl shadow p-3 space-y-2"
            style={{ background: corSuave(p.cor) }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-800 text-sm truncate">
                  {p.modelo} <span className="text-gray-400 font-normal text-xs">{p.linha}</span>
                </p>
                <p className="text-xs text-gray-500 truncate">{p.gb} · {p.cor}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {p.dataVenda ? new Date(p.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                  p.estado === 'NOVO' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{p.estado}</span>
                {p.fornecedorId && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 mt-1">
                    Fornecedor
                  </span>
                )}
              </div>
            </div>

            {(p.cliente || p.contato) && (
              <div className="text-xs text-gray-500 truncate">
                {p.cliente && <span>{p.cliente}</span>}
                {p.contato && <span className="ml-2 text-gray-400">{p.contato}</span>}
              </div>
            )}

            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-2">
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Compra</p>
                <p className="text-xs font-semibold text-gray-600">{fmt(p.valorCompra)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Venda</p>
                <p className="text-xs font-bold">{p.valorVenda ? fmt(p.valorVenda) : '—'}</p>
              </div>
              {p.custos ? (
                <div className="text-center">
                  <p className="text-[9px] text-gray-400">Custos</p>
                  <p className="text-xs font-semibold text-red-500">{fmt(p.custos)}</p>
                </div>
              ) : null}
              <div className="text-center">
                <p className="text-[9px] text-gray-400">Lucro</p>
                <p className={`text-xs font-bold ${(p.lucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.lucro !== undefined ? fmt(p.lucro) : '—'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditando(p)}
                className="flex-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDesfazerVenda(p)}
                disabled={desfazendo === p.id}
                className="flex-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                {desfazendo === p.id ? 'Desfazendo...' : '↩ Desfazer'}
              </button>
            </div>
          </div>
        ))}

        {/* Totais mobile */}
        {filtradas.length > 0 && (
          <div className="bg-gray-800 text-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-400 mb-2 font-semibold">TOTAIS</p>
            <div className="flex justify-between">
              <div className="text-center">
                <p className="text-[10px] text-gray-400">Compra</p>
                <p className="text-sm font-bold">{fmt(filtradas.reduce((s, p) => s + p.valorCompra, 0))}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400">Faturamento</p>
                <p className="text-sm font-bold text-blue-400">{fmt(totalFaturamento)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400">Custos</p>
                <p className="text-sm font-bold text-red-400">{fmt(totalCustos)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400">Lucro</p>
                <p className="text-sm font-bold text-green-400">{fmt(totalLucro)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Data Venda</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Código</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Produto</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">GB / Cor</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Estado</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Cliente</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Contato</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Compra</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Custos</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Venda</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Lucro</th>
                <th className="text-center py-3 px-3 text-gray-500 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-gray-400">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
              {filtradas.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 transition-colors"
                  style={{ background: corSuave(p.cor) }}
                >
                  <td className="py-2.5 px-3 text-gray-600">
                    {p.dataVenda
                      ? new Date(p.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-gray-400">{p.codigo}</td>
                  <td className="py-2.5 px-3 font-medium">
                    {p.modelo} <span className="text-gray-400">{p.linha}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{p.gb} · {p.cor}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.estado === 'NOVO' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{p.estado}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{p.cliente || '—'}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{p.contato || '—'}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{fmt(p.valorCompra)}</td>
                  <td className="py-2.5 px-3 text-right text-red-500">
                    {p.custos ? fmt(p.custos) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {p.valorVenda ? fmt(p.valorVenda) : '—'}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${
                    (p.lucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {p.lucro !== undefined ? fmt(p.lucro) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setEditando(p)}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDesfazerVenda(p)}
                        disabled={desfazendo === p.id}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 transition-colors disabled:opacity-50"
                      >
                        {desfazendo === p.id ? '...' : '↩ Desfazer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtradas.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={7} className="py-3 px-3 font-semibold text-gray-600">TOTAL</td>
                  <td className="py-3 px-3 text-right font-semibold text-gray-700">
                    {fmt(filtradas.reduce((s, p) => s + p.valorCompra, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-red-600">
                    {fmt(totalCustos)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-blue-700">
                    {fmt(totalFaturamento)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-green-700">
                    {fmt(totalLucro)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <VendaModal
        open={!!editando}
        onClose={() => setEditando(null)}
        onSave={handleSalvarEdicao}
        produto={editando}
      />
    </div>
  );
}
