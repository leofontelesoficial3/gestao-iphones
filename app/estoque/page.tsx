'use client';
import { useEffect, useState, useCallback } from 'react';
import { Produto } from '@/types';
import { getProdutos, addProduto, updateProduto, deleteProduto, getNextCodigo } from '@/lib/storage';
import ProdutoModal from '@/components/ProdutoModal';
import VendaModal, { ProdutoRecebidoData } from '@/components/VendaModal';
import FotosModal from '@/components/FotosModal';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'EM_ESTOQUE' | 'VENDIDO'>('EM_ESTOQUE');
  const [modalProduto, setModalProduto] = useState(false);
  const [modalVenda, setModalVenda] = useState(false);
  const [modalFotos, setModalFotos] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [vendendo, setVendendo] = useState<Produto | null>(null);
  const [verFotos, setVerFotos] = useState<Produto | null>(null);
  const [nextCodigo, setNextCodigo] = useState(10001);

  const load = useCallback(() => {
    setProdutos(getProdutos());
    setNextCodigo(getNextCodigo());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = produtos.filter(p => {
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
    const q = filtro.toLowerCase();
    const matchQ = !q || [p.modelo, p.linha, p.cor, p.gb, p.imei, String(p.codigo)]
      .some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchQ;
  });

  const handleSaveProduto = (data: Omit<Produto, 'id'>) => {
    if (editando) {
      updateProduto(editando.id, data);
    } else {
      addProduto(data);
    }
    load();
    setEditando(null);
  };

  const handleSaveVenda = (updates: Partial<Produto>, produtoRecebido?: ProdutoRecebidoData) => {
    if (vendendo) {
      updateProduto(vendendo.id, updates);
      if (produtoRecebido) {
        addProduto({
          ...produtoRecebido,
          codigo: getNextCodigo(),
          status: 'EM_ESTOQUE',
          fotos: [],
        });
      }
      load();
      setVendendo(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduto(id);
      load();
    }
  };

  const handleFotosUpdate = (fotos: string[]) => {
    if (verFotos) {
      updateProduto(verFotos.id, { fotos });
      setVerFotos(prev => prev ? { ...prev, fotos } : null);
      load();
    }
  };

  const handleDesfazerVenda = (p: Produto) => {
    if (confirm('Desfazer venda e retornar ao estoque?')) {
      updateProduto(p.id, {
        status: 'EM_ESTOQUE',
        dataVenda: undefined,
        valorVenda: undefined,
        custos: undefined,
        cliente: undefined,
        contato: undefined,
        lucro: undefined,
      });
      load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>
        <button
          onClick={() => { setEditando(null); setModalProduto(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
        >
          + Novo Produto
        </button>
      </div>

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
          {(['TODOS', 'EM_ESTOQUE', 'VENDIDO'] as const).map(s => (
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
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Cod.</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Modelo</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">GB / Cor</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Estado / Bat.</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">IMEI</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Compra</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Venda</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Lucro</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Data Venda</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>
                <th className="py-3 px-3 text-gray-500 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-gray-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
              {filtrados.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
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
                  <td className="py-2.5 px-3 text-right">{fmt(p.valorCompra)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {p.valorVenda ? fmt(p.valorVenda) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${
                    (p.lucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {p.lucro !== undefined ? fmt(p.lucro) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">
                    {p.dataVenda
                      ? new Date(p.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.status === 'EM_ESTOQUE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {p.status === 'EM_ESTOQUE' ? 'Estoque' : 'Vendido'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => { setVerFotos(p); setModalFotos(true); }}
                        className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 rounded text-purple-700 relative"
                        title="Ver fotos"
                      >
                        📷{(p.fotos?.length ?? 0) > 0 && (
                          <span className="ml-0.5">{p.fotos!.length}</span>
                        )}
                      </button>
                      <button
                        onClick={() => { setEditando(p); setModalProduto(true); }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                        title="Editar"
                      >
                        Editar
                      </button>
                      {p.status === 'EM_ESTOQUE' && (
                        <button
                          onClick={() => { setVendendo(p); setModalVenda(true); }}
                          className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded text-green-700"
                          title="Registrar venda"
                        >
                          Vender
                        </button>
                      )}
                      {p.status === 'VENDIDO' && (
                        <button
                          onClick={() => handleDesfazerVenda(p)}
                          className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded text-yellow-700"
                        >
                          Desfazer
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-600"
                        title="Excluir"
                      >
                        Excluir
                      </button>
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
      <VendaModal
        open={modalVenda}
        onClose={() => { setModalVenda(false); setVendendo(null); }}
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
    </div>
  );
}
