'use client';
import { useState, useMemo } from 'react';

// Taxas baseadas na tabela GRANNCOOB / PAG SEGURO (02/09/2024)
const TAXAS: Record<string, Record<string, number>> = {
  'MASTER/VISA': {
    deb: 1.49, '1x': 3.89, '2x': 4.79, '3x': 5.47, '4x': 5.99,
    '5x': 6.67, '6x': 7.37, '7x': 7.99, '8x': 8.69, '9x': 9.29,
    '10x': 9.99, '11x': 10.69, '12x': 11.39, '13x': 11.99,
    '14x': 12.69, '15x': 13.49, '16x': 13.89, '17x': 14.59, '18x': 15.19,
  },
  ELO: {
    deb: 1.89, '1x': 4.05, '2x': 4.99, '3x': 5.99, '4x': 6.99,
    '5x': 7.99, '6x': 8.49, '7x': 8.99, '8x': 9.39, '9x': 9.49,
    '10x': 9.99, '11x': 10.69, '12x': 11.39, '13x': 13.71,
    '14x': 14.40, '15x': 15.08, '16x': 15.76, '17x': 16.45, '18x': 17.13,
  },
  HIPER: {
    deb: null as unknown as number, '1x': 4.05, '2x': 4.99, '3x': 5.99, '4x': 6.99,
    '5x': 7.99, '6x': 8.49, '7x': 8.99, '8x': 9.39, '9x': 9.49,
    '10x': 9.99, '11x': 10.69, '12x': 11.39,
  },
  AMEX: {
    '1x': 4.05, '2x': 4.99, '3x': 5.99, '4x': 6.99,
    '5x': 7.99, '6x': 8.49, '7x': 8.99, '8x': 9.39, '9x': 9.49,
    '10x': 9.99, '11x': 10.69, '12x': 11.39,
  },
};

const BANDEIRAS = Object.keys(TAXAS);

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SimulacaoPage() {
  const [valor, setValor] = useState('');
  const [bandeira, setBandeira] = useState('MASTER/VISA');
  const [parcela, setParcela] = useState('1x');

  const parcelasDisponiveis = useMemo(() => Object.keys(TAXAS[bandeira] || {}), [bandeira]);

  // Ajustar parcela se não existir na bandeira selecionada
  const parcelaAtual = parcelasDisponiveis.includes(parcela) ? parcela : parcelasDisponiveis[0] || '1x';

  const valorNum = parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
  const taxa = TAXAS[bandeira]?.[parcelaAtual];
  const taxaValida = taxa != null && taxa > 0;

  const valorTaxa = taxaValida ? valorNum * (taxa / 100) : 0;
  const valorLiquido = valorNum - valorTaxa;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#3B3B4F' }}>Simulação</h1>
        <p className="text-sm text-gray-400 mt-1">Simule os valores recebidos na máquina de cartão</p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-xl shadow p-5 space-y-5">
        {/* Valor */}
        <div>
          <label className="label">Valor da Venda (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            className="input text-2xl font-bold text-center"
            style={{ color: '#3B3B4F', letterSpacing: '0.02em' }}
            placeholder="0,00"
            value={valor}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d,\.]/g, '');
              setValor(raw);
            }}
          />
        </div>

        {/* Bandeira */}
        <div>
          <label className="label">Bandeira</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BANDEIRAS.map(b => {
              const ativo = bandeira === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBandeira(b)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    ativo ? 'text-white shadow-md' : 'bg-white hover:bg-gray-50'
                  }`}
                  style={{
                    borderColor: ativo ? '#2E78B7' : '#e5e7eb',
                    background: ativo ? '#2E78B7' : undefined,
                  }}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parcelas */}
        <div>
          <label className="label">Parcelas</label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {parcelasDisponiveis.map(p => {
              const ativo = parcelaAtual === p;
              const t = TAXAS[bandeira][p];
              const indisponivel = t == null;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={indisponivel}
                  onClick={() => setParcela(p)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    indisponivel
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : ativo
                        ? 'text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={ativo && !indisponivel ? { background: '#2E78B7' } : {}}
                >
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resultado */}
      {valorNum > 0 && taxaValida && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Resultado da Simulação</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Valor bruto */}
              <div className="rounded-xl p-4 text-center" style={{ background: '#eef5fb' }}>
                <p className="text-xs font-medium text-gray-500 mb-1">Valor Bruto</p>
                <p className="text-lg font-bold" style={{ color: '#2E78B7' }}>{fmt(valorNum)}</p>
              </div>

              {/* Taxa */}
              <div className="rounded-xl p-4 text-center" style={{ background: '#fef2f2' }}>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Taxa ({taxa.toFixed(2).replace('.', ',')}%)
                </p>
                <p className="text-lg font-bold text-red-500">- {fmt(valorTaxa)}</p>
              </div>

              {/* Valor líquido */}
              <div className="rounded-xl p-4 text-center" style={{ background: '#eef7ec' }}>
                <p className="text-xs font-medium text-gray-500 mb-1">Valor Líquido</p>
                <p className="text-lg font-bold" style={{ color: '#5AAA4A' }}>{fmt(valorLiquido)}</p>
              </div>
            </div>

            {/* Detalhes parcela */}
            {parcelaAtual !== 'deb' && parcelaAtual !== '1x' && (
              <div className="rounded-xl p-4 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 mb-2">Valor por Parcela (para o cliente)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold" style={{ color: '#3B3B4F' }}>
                    {parseInt(parcelaAtual)}x de {fmt(valorNum / parseInt(parcelaAtual))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabela completa */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">Tabela de Taxas — {bandeira}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">GRANNCOOB / PAG SEGURO</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Parcela</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Taxa</th>
                {valorNum > 0 && (
                  <>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Desconto</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Líquido</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {parcelasDisponiveis.map(p => {
                const t = TAXAS[bandeira][p];
                if (t == null) return null;
                const desc = valorNum * (t / 100);
                const liq = valorNum - desc;
                const isActive = p === parcelaAtual;
                return (
                  <tr
                    key={p}
                    className={`border-t border-gray-50 cursor-pointer transition-colors ${
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setParcela(p)}
                  >
                    <td className="px-4 py-2.5 font-semibold" style={{ color: isActive ? '#2E78B7' : '#3B3B4F' }}>
                      {p.toUpperCase()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {t.toFixed(2).replace('.', ',')}%
                    </td>
                    {valorNum > 0 && (
                      <>
                        <td className="px-4 py-2.5 text-right text-red-500 font-medium">
                          - {fmt(desc)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold" style={{ color: '#5AAA4A' }}>
                          {fmt(liq)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
