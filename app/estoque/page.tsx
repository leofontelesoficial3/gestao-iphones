'use client';
import { useEffect, useState, useCallback } from 'react';
import { Produto } from '@/types';
import { loadProdutos, addProduto, updateProduto, deleteProduto, getNextCodigo } from '@/lib/storage';
import ProdutoModal from '@/components/ProdutoModal';
import VendaModal, { ProdutoRecebidoData } from '@/components/VendaModal';
import VendaRapidaModal from '@/components/VendaRapidaModal';
import FotosModal from '@/components/FotosModal';
import CodigoModal from '@/components/CodigoModal';
import Toast from '@/components/Toast';
import ReciboModal from '@/components/ReciboModal';
import { useAuth } from '@/components/AuthProvider';
import { corSuave } from '@/lib/cores';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const QrIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
    <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" rx="0.5" />
    <path d="M18 14h4v4" /><path d="M14 18h4v4" />
    <rect x="5" y="5" width="2" height="2" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="17" y="5" width="2" height="2" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="5" y="17" width="2" height="2" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

function diasEmEstoque(dataEntrada: string): number {
  const entrada = new Date(dataEntrada + 'T12:00:00');
  const hoje = new Date();
  return Math.floor((hoje.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));
}

export default function EstoquePage() {
  const { isAdmin } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'EM_ESTOQUE' | 'VENDIDO'>('EM_ESTOQUE');
  const [modalProduto, setModalProduto] = useState(false);
  const [modalVenda, setModalVenda] = useState(false);
  const [modalFotos, setModalFotos] = useState(false);
  const [modalCodigo, setModalCodigo] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [vendendo, setVendendo] = useState<Produto | null>(null);
  const [verFotos, setVerFotos] = useState<Produto | null>(null);
  const [verCodigo, setVerCodigo] = useState<Produto | null>(null);
  const [nextCodigo, setNextCodigo] = useState(10001);
  const [toastVenda, setToastVenda] = useState(false);
  const [toastEstoque, setToastEstoque] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [reciboAberto, setReciboAberto] = useState(false);
  const [produtoRecibo, setProdutoRecibo] = useState<Produto | null>(null);
  const [recebidoRecibo, setRecebidoRecibo] = useState<ProdutoRecebidoData | null>(null);
  const [ocultarValores, setOcultarValores] = useState(false);
  const [vendaRapidaOpen, setVendaRapidaOpen] = useState(false);
  /** Id do produto criado via fluxo Fornecedor (para desfazer se cancelar). */
  const [produtoTempId, setProdutoTempId] = useState<string | null>(null);

  // Mostra valores? Admin + toggle ligado
  const mostrarValores = isAdmin && !ocultarValores;

  const load = useCallback(async () => {
    const prods = await loadProdutos();
    setProdutos(prods);
    const cod = await getNextCodigo();
    setNextCodigo(cod);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = produtos.filter(p => {
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
    const q = filtro.toLowerCase();
    const matchQ = !q || [p.modelo, p.linha, p.cor, p.gb, p.imei, String(p.codigo)]
      .some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchQ;
  });

  const handleSaveProduto = async (data: Omit<Produto, 'id'>) => {
    if (editando) {
      await updateProduto(editando.id, data);
    } else {
      await addProduto(data);
      setToastMsg(`${data.modelo} ${data.linha} adicionado ao estoque!`);
      setToastEstoque(true);
    }
    await load();
    setEditando(null);
  };

  const handleSaveVenda = async (updates: Partial<Produto>, produtoRecebido?: ProdutoRecebidoData) => {
    if (vendendo) {
      const valor = updates.valorVenda ? fmt(updates.valorVenda) : '';
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
      setRecebidoRecibo(produtoRecebido ?? null);
      setReciboAberto(true);
      setToastMsg(`${vendendo.modelo} ${vendendo.linha} vendido por ${valor}!`);
      setToastVenda(true);
      await load();
      setVendendo(null);
      setProdutoTempId(null); // Venda confirmada: produto não é mais temporário
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduto(id);
      await load();
    }
  };

  const handleFotosUpdate = async (fotos: string[]) => {
    if (verFotos) {
      await updateProduto(verFotos.id, { fotos });
      setVerFotos(prev => prev ? { ...prev, fotos } : null);
      await load();
    }
  };

  const handleDesfazerVenda = async (p: Produto) => {
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
      if (escolha.trim() === '2') {
        await deleteProduto(p.id);
      } else {
        await updateProduto(p.id, limparVenda);
      }
    } else {
      if (!confirm('Desfazer venda e retornar ao estoque?')) return;
      await updateProduto(p.id, limparVenda);
    }
    await load();
  };

  const handleSelecionarVendaRapida = (p: Produto, source: 'estoque' | 'fornecedor') => {
    setVendaRapidaOpen(false);
    setVendendo(p);
    setModalVenda(true);
    setProdutoTempId(source === 'fornecedor' ? p.id : null);
  };

  const handleCancelarVenda = async () => {
    // Se a venda foi aberta via Fornecedor, desfaz o cadastro
    if (produtoTempId) {
      try { await deleteProduto(produtoTempId); } catch {}
      await load();
    }
    setProdutoTempId(null);
    setModalVenda(false);
    setVendendo(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>
        {isAdmin && (
          <button
            onClick={() => { setEditando(null); setModalProduto(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
          >
            + Novo Produto
          </button>
        )}
      </div>

      {/* Atalho rápido: Realizar Venda */}
      <button
        onClick={() => setVendaRapidaOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl p-4 md:p-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 50%, #3B3B4F 100%)',
          boxShadow: '0 10px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(90,170,74,0.2) 0%, transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-4">
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-[-6deg]"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-2xl md:text-3xl">💸</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] md:text-xs font-bold tracking-[0.25em] uppercase text-white/60">
              Atalho rápido
            </p>
            <h2 className="text-base md:text-xl font-extrabold text-white tracking-tight mt-0.5">
              Realizar Venda
            </h2>
            <p className="text-xs text-white/70 mt-0.5 hidden sm:block">
              Busque pelo código ou modelo · ou cadastre um produto do fornecedor
            </p>
          </div>
          <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all group-hover:translate-x-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar modelo, cor, IMEI, código..."
          className="input max-w-xs"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />
        <div className="flex gap-1">
          {(isAdmin ? ['TODOS', 'EM_ESTOQUE', 'VENDIDO'] as const : ['EM_ESTOQUE'] as const).map(s => (
            <button key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {s === 'TODOS' ? 'Todos' : s === 'EM_ESTOQUE' ? 'Em Estoque' : 'Vendidos'}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 self-center">{filtrados.length} resultado(s)</span>
        {isAdmin && (
          <button
            onClick={() => setOcultarValores(prev => !prev)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              ocultarValores
                ? 'bg-red-100 text-red-600 border border-red-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            title={ocultarValores ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {ocultarValores ? '🔒 Valores ocultos' : '👁 Ocultar valores'}
          </button>
        )}
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filtrados.length === 0 && (
          <p className="py-10 text-center text-gray-400">Nenhum produto encontrado.</p>
        )}
        {filtrados.map(p => (
          <div
            key={p.id}
            className="rounded-xl shadow p-4 space-y-3"
            style={{ background: corSuave(p.cor) }}
          >
            {/* Cabeçalho do card */}
            <div className="flex items-start gap-3">
              {/* Foto principal */}
              <div
                className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={() => { setVerFotos(p); setModalFotos(true); }}
              >
                {p.fotos && p.fotos.length > 0 ? (
                  <img src={p.fotos[0]} alt={p.modelo} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-300">📱</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">
                  {p.modelo} <span className="text-gray-400 font-normal text-xs">{p.linha}</span>
                </p>
                <p className="text-xs text-gray-500 truncate">{p.gb} · {p.cor}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  p.status === 'EM_ESTOQUE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {p.status === 'EM_ESTOQUE' ? 'Estoque' : 'Vendido'}
                </span>
                {p.fornecedorId && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                    Fornecedor
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 text-xs">Código</span>
                <p className="font-mono text-gray-600">{p.codigo}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Estado / Bateria</span>
                <p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.estado === 'NOVO' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{p.estado}</span>
                  <span className="ml-1 text-gray-500">{p.bateria}%</span>
                </p>
              </div>
              {mostrarValores && (
                <div>
                  <span className="text-gray-400 text-xs">Compra</span>
                  <p className="font-semibold text-gray-700">{fmt(p.valorCompra)}</p>
                </div>
              )}
              {p.status === 'VENDIDO' && mostrarValores ? (
                <div>
                  <span className="text-gray-400 text-xs">Venda</span>
                  <p className="font-semibold">{p.valorVenda ? fmt(p.valorVenda) : '—'}</p>
                </div>
              ) : p.status === 'EM_ESTOQUE' ? (
                <div>
                  <span className="text-gray-400 text-xs">Dias em estoque</span>
                  <p className="font-semibold text-orange-600">{diasEmEstoque(p.dataEntrada)} dias</p>
                </div>
              ) : null}
            </div>

            {/* Lucro e data (só vendidos, só admin) */}
            {p.status === 'VENDIDO' && mostrarValores && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Data Venda</span>
                  <p className="text-gray-600">
                    {p.dataVenda ? new Date(p.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-xs">Lucro</span>
                  <p className={`font-bold ${(p.lucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.lucro !== undefined ? fmt(p.lucro) : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2 pt-1 flex-wrap">
              <button
                onClick={() => { setVerCodigo(p); setModalCodigo(true); }}
                className="py-2 px-3 text-sm bg-indigo-100 hover:bg-indigo-200 rounded-lg text-indigo-700 font-medium"
              >
                <QrIcon />
              </button>
              <button
                onClick={() => { setVerFotos(p); setModalFotos(true); }}
                className="flex-1 py-2 text-sm bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700 font-medium"
              >
                📷{(p.fotos?.length ?? 0) > 0 ? ` (${p.fotos!.length})` : ''}
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setEditando(p); setModalProduto(true); }}
                  className="flex-1 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-medium"
                >
                  Editar
                </button>
              )}
              {p.status === 'EM_ESTOQUE' && (
                <button
                  onClick={() => { setProdutoTempId(null); setVendendo(p); setModalVenda(true); }}
                  className="flex-1 py-2 text-sm bg-green-100 hover:bg-green-200 rounded-lg text-green-700 font-medium"
                >
                  Vender
                </button>
              )}
              {isAdmin && p.status === 'VENDIDO' && (
                <button
                  onClick={() => handleDesfazerVenda(p)}
                  className="flex-1 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 rounded-lg text-yellow-700 font-medium"
                >
                  Desfazer
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="py-2 px-3 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-600 font-medium"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-2 text-gray-500 font-medium w-12"></th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Cod.</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Modelo</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">GB / Cor</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Estado / Bat.</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">IMEI</th>
                {mostrarValores && <th className="text-right py-3 px-3 text-gray-500 font-medium">Compra</th>}
                {mostrarValores && <th className="text-right py-3 px-3 text-gray-500 font-medium">Venda</th>}
                {mostrarValores && <th className="text-right py-3 px-3 text-gray-500 font-medium">Lucro</th>}
                <th className="text-center py-3 px-3 text-gray-500 font-medium">Dias</th>
                {mostrarValores && <th className="text-left py-3 px-3 text-gray-500 font-medium">Data Venda</th>}
                {isAdmin && <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>}
                <th className="py-3 px-3 text-gray-500 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-gray-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
              {filtrados.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 transition-colors"
                  style={{ background: corSuave(p.cor) }}
                >
                  <td className="py-2 px-2">
                    <div
                      className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => { setVerFotos(p); setModalFotos(true); }}
                    >
                      {p.fotos && p.fotos.length > 0 ? (
                        <img src={p.fotos[0]} alt={p.modelo} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg text-gray-300">📱</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{p.codigo}</td>
                  <td className="py-2.5 px-3 font-medium">
                    {p.modelo}
                    <span className="text-gray-400 text-xs ml-1">{p.linha}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{p.gb} · {p.cor}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.estado === 'NOVO' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{p.estado}</span>
                    <span className="ml-1 text-xs text-gray-400">{p.bateria}%</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-gray-400">
                    {p.imei || '—'}
                  </td>
                  {mostrarValores && <td className="py-2.5 px-3 text-right">{fmt(p.valorCompra)}</td>}
                  {mostrarValores && (
                    <td className="py-2.5 px-3 text-right">
                      {p.valorVenda ? fmt(p.valorVenda) : <span className="text-gray-300">—</span>}
                    </td>
                  )}
                  {mostrarValores && (
                    <td className={`py-2.5 px-3 text-right font-semibold ${
                      (p.lucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {p.lucro !== undefined ? fmt(p.lucro) : <span className="text-gray-300">—</span>}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-center">
                    {p.status === 'EM_ESTOQUE' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                        {diasEmEstoque(p.dataEntrada)}d
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  {mostrarValores && (
                    <td className="py-2.5 px-3 text-gray-500 text-xs">
                      {p.dataVenda
                        ? new Date(p.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')
                        : <span className="text-gray-300">—</span>}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === 'EM_ESTOQUE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {p.status === 'EM_ESTOQUE' ? 'Estoque' : 'Vendido'}
                        </span>
                        {p.fornecedorId && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                            Fornecedor
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => { setVerCodigo(p); setModalCodigo(true); }}
                        className="px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 rounded text-indigo-700"
                        title="QR Code / Código de Barras"
                      >
                        QR
                      </button>
                      <button
                        onClick={() => { setVerFotos(p); setModalFotos(true); }}
                        className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded text-purple-700 relative"
                        title="Ver fotos"
                      >
                        📷{(p.fotos?.length ?? 0) > 0 && (
                          <span className="ml-0.5">{p.fotos!.length}</span>
                        )}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { setEditando(p); setModalProduto(true); }}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                          title="Editar"
                        >
                          Editar
                        </button>
                      )}
                      {p.status === 'EM_ESTOQUE' && (
                        <button
                          onClick={() => { setProdutoTempId(null); setVendendo(p); setModalVenda(true); }}
                          className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded text-green-700"
                          title="Registrar venda"
                        >
                          Vender
                        </button>
                      )}
                      {isAdmin && p.status === 'VENDIDO' && (
                        <button
                          onClick={() => handleDesfazerVenda(p)}
                          className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded text-yellow-700"
                        >
                          Desfazer
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-600"
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProdutoModal
        open={modalProduto}
        onClose={() => { setModalProduto(false); setEditando(null); }}
        onSave={handleSaveProduto}
        editProduto={editando}
        nextCodigo={nextCodigo}
      />
      <VendaRapidaModal
        open={vendaRapidaOpen}
        onClose={() => setVendaRapidaOpen(false)}
        produtos={produtos}
        onSelect={handleSelecionarVendaRapida}
        onFornecedorCriado={load}
      />
      <VendaModal
        open={modalVenda}
        onClose={handleCancelarVenda}
        onSave={handleSaveVenda}
        produto={vendendo}
      />
      <FotosModal
        open={modalFotos}
        onClose={() => { setModalFotos(false); setVerFotos(null); }}
        fotos={verFotos?.fotos ?? []}
        onUpdate={handleFotosUpdate}
        produtoNome={verFotos ? `${verFotos.modelo} ${verFotos.linha} — ${verFotos.cor}` : ''}
      />
      <CodigoModal
        open={modalCodigo}
        onClose={() => { setModalCodigo(false); setVerCodigo(null); }}
        produto={verCodigo}
      />
      <ReciboModal
        open={reciboAberto}
        onClose={() => { setReciboAberto(false); setProdutoRecibo(null); setRecebidoRecibo(null); }}
        produto={produtoRecibo}
        produtoRecebido={recebidoRecibo}
      />
      <Toast
        open={toastVenda}
        onClose={() => setToastVenda(false)}
        tipo="venda"
        mensagem={toastMsg}
      />
      <Toast
        open={toastEstoque}
        onClose={() => setToastEstoque(false)}
        tipo="estoque"
        mensagem={toastMsg}
      />
    </div>
  );
}
