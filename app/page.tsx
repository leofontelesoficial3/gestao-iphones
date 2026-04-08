'use client';
import { useEffect, useState } from 'react';
import { getStats, getProdutos } from '@/lib/storage';
import { Stats, Produto } from '@/types';
import StatsCard from '@/components/StatsCard';
import Link from 'next/link';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ultimas, setUltimas] = useState<Produto[]>([]);

  useEffect(() => {
    setStats(getStats());
    const vendidos = getProdutos()
      .filter(p => p.status === 'VENDIDO')
      .sort((a, b) => (b.dataVenda ?? '').localeCompare(a.dataVenda ?? ''))
      .slice(0, 8);
    setUltimas(vendidos);
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Faturamento Total"
          value={fmt(stats.totalFaturamento)}
          sub="Soma de todas as vendas"
          color="blue"
        />
        <StatsCard
          title="Lucro Total"
          value={fmt(stats.totalLucro)}
          sub={`${stats.qtdVendidos} aparelhos vendidos`}
          color="green"
        />
        <StatsCard
          title="Em Estoque"
          value={`${stats.qtdEmEstoque} aparelhos`}
          sub={`Valor: ${fmt(stats.valorEmEstoque)}`}
          color="yellow"
        />
        <StatsCard
          title="Ticket Médio"
          value={stats.qtdVendidos > 0
            ? fmt(stats.totalFaturamento / stats.qtdVendidos)
            : 'R$ 0'}
          sub="Por aparelho vendido"
          color="purple"
        />
      </div>

      {/* Últimas vendas */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Últimas Vendas</h2>
          <Link href="/vendas" className="text-sm text-blue-600 hover:underline">
            Ver todas →
          </Link>
        </div>
        {ultimas.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhuma venda registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Modelo</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">GB / Cor</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Data Venda</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Venda</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Lucro</th>
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
                    <td className="py-2 px-2 text-right font-semibold">
                      {p.valorVenda ? fmt(p.valorVenda) : '-'}
                    </td>
                    <td className={`py-2 px-2 text-right font-semibold ${
                      (p.lucro ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {p.lucro !== undefined ? fmt(p.lucro) : '-'}
                    </td>
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
          className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
            📦
          </div>
          <div>
            <p className="font-semibold text-gray-800">Gerenciar Estoque</p>
            <p className="text-sm text-gray-400">Cadastrar e visualizar aparelhos</p>
          </div>
        </Link>
        <Link href="/vendas"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
            💰
          </div>
          <div>
            <p className="font-semibold text-gray-800">Ver Vendas</p>
            <p className="text-sm text-gray-400">Histórico de todas as vendas</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
