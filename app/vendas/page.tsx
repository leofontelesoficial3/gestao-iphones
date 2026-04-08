'use client';
import { useEffect, useState } from 'react';
import { Produto } from '@/types';
import { getProdutos } from '@/lib/storage';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function VendasPage() {
  const [vendas, setVendas] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const todos = getProdutos();
    const v = todos
      .filter(p => p.status === 'VENDIDO')
      .sort((a, b) => (b.dataVenda ?? '').localeCompare(a.dataVenda ?? ''));
    setVendas(v);
  }, []);

  const filtradas = vendas.filter(p => {
    const q = busca.toLowerCase();
    return !q || [p.modelo, p.linha, p.cor, p.cliente, p.contato, String(p.codigo)]
      .some(v => v?.toLowerCase().includes(q));
  });

  const totalFaturamento = filtradas.reduce((s, p) => s + (p.valorVenda ?? 0), 0);
  const totalLucro = filtradas.reduce((s, p) => s + (p.lucro ?? 0), 0);
  const totalCustos = filtradas.reduce((s, p) => s + (p.custos ?? 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500">Faturamento</p>
          <p className="text-xl font-bold text-blue-700">{fmt(totalFaturamento)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500">Lucro Total</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalLucro)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-400">
          <p className="text-xs text-gray-500">Total de Custos</p>
          <p className="text-xl font-bold text-red-600">{fmt(totalCustos)}</p>
        </div>
      </div>

      {/* Busca */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar modelo, cliente, contato..."
          className="input max-w-sm"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <span className="text-sm text-gray-400">{filtradas.length} venda(s)</span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
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
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-gray-400">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
              {filtradas.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
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
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
