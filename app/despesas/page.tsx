'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface Despesa {
  id: number;
  tipo: 'fixa' | 'variavel';
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_fim: string | null;
  pago: boolean;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function getStatus(d: Despesa) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(d.data_vencimento + 'T00:00:00');
  if (d.pago) return { label: 'Pago', color: '#5AAA4A', bg: '#eef7ec' };
  if (venc < hoje) return { label: 'Vencida', color: '#dc2626', bg: '#fef2f2' };
  const diff = (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 3) return { label: 'Próxima', color: '#E8872D', bg: '#fff7ed' };
  return { label: 'Pendente', color: '#6b7280', bg: '#f3f4f6' };
}

// ── Card de despesa individual ──
function DespesaItem({
  d,
  onTogglePago,
  onEdit,
  onRemove,
  mostrarBadgeTipo,
}: {
  d: Despesa;
  onTogglePago: () => void;
  onEdit: () => void;
  onRemove: () => void;
  mostrarBadgeTipo: boolean;
}) {
  const status = getStatus(d);
  return (
    <div className="flex items-center justify-between px-4 md:px-5 py-4 hover:bg-gray-50 gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onTogglePago}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            d.pago ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {d.pago && <span className="text-white text-xs font-bold">✓</span>}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-sm truncate ${d.pago ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {d.descricao}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400">Vence: {fmtData(d.data_vencimento)}</span>
            {mostrarBadgeTipo && d.tipo === 'fixa' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#eef5fb', color: '#2E78B7' }}>
                Fixa
              </span>
            )}
            {mostrarBadgeTipo && d.tipo === 'variavel' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#fff7ed', color: '#E8872D' }}>
                Variável
              </span>
            )}
            {!mostrarBadgeTipo && d.tipo === 'fixa' && (
              <span className="text-[10px] text-gray-400">
                {d.data_fim ? `até ${fmtData(d.data_fim)}` : 'sem fim'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="text-right mr-1">
          <p className="font-bold text-sm" style={{ color: '#dc2626' }}>{fmt(Number(d.valor))}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
        <button
          onClick={onEdit}
          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded transition-colors"
          style={{ color: '#2E78B7' }}
          title="Editar"
        >
          ✎
        </button>
        <button
          onClick={onRemove}
          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-600 transition-colors"
          title="Remover"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Lista vazia ──
function ListaVazia({ tipo }: { tipo?: string }) {
  return (
    <div className="p-8 text-center text-gray-400">
      <span className="text-3xl block mb-2">{tipo === 'fixa' ? '🔄' : tipo === 'variavel' ? '📌' : '💸'}</span>
      <p className="font-medium text-sm">Nenhuma despesa {tipo === 'fixa' ? 'fixa' : tipo === 'variavel' ? 'variável' : ''}</p>
    </div>
  );
}

// ── Página principal ──
export default function DespesasPage() {
  const { conta, isAdmin } = useAuth();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Despesa | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'fixa' | 'variavel'>('todas');

  // Formulário
  const [tipo, setTipo] = useState<'fixa' | 'variavel'>('variavel');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/despesas?conta=${conta}`);
    const data = await res.json();
    setDespesas(data.despesas || []);
  }, [conta]);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) return null;

  const fixas = despesas.filter(d => d.tipo === 'fixa');
  const variaveis = despesas.filter(d => d.tipo === 'variavel');
  const totalFixas = fixas.reduce((s, d) => s + Number(d.valor), 0);
  const totalVariaveis = variaveis.reduce((s, d) => s + Number(d.valor), 0);
  const totalGeral = totalFixas + totalVariaveis;

  const resetForm = () => {
    setDescricao('');
    setValor('');
    setDataVencimento('');
    setDataFim('');
    setTipo('variavel');
    setEditando(null);
    setShowForm(false);
    setErro('');
    setSucesso('');
  };

  const abrirEditar = (d: Despesa) => {
    setEditando(d);
    setDescricao(d.descricao);
    setValor(String(Number(d.valor)).replace('.', ','));
    setTipo(d.tipo);
    setDataVencimento(d.data_vencimento);
    setDataFim(d.data_fim || '');
    setShowForm(true);
    setErro('');
    setSucesso('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const valorNum = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (!descricao || !valorNum || !dataVencimento) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    if (editando) {
      // Editar
      const res = await fetch('/api/despesas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editando.id,
          descricao,
          valor: valorNum,
          tipo,
          data_vencimento: dataVencimento,
          data_fim: tipo === 'fixa' ? dataFim || null : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setErro(err.error || 'Erro ao editar despesa.');
        return;
      }
      setSucesso(`Despesa "${descricao}" atualizada!`);
    } else {
      // Adicionar
      const res = await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conta,
          tipo,
          descricao,
          valor: valorNum,
          data_vencimento: dataVencimento,
          data_fim: tipo === 'fixa' ? dataFim || null : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setErro(err.error || 'Erro ao adicionar despesa.');
        return;
      }
      setSucesso(`Despesa "${descricao}" adicionada!`);
    }

    resetForm();
    await load();
  };

  const handleTogglePago = async (d: Despesa) => {
    await fetch('/api/despesas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, pago: !d.pago }),
    });
    await load();
  };

  const handleRemove = async (d: Despesa) => {
    if (!confirm(`Remover despesa "${d.descricao}"?`)) return;
    await fetch(`/api/despesas?id=${d.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#3B3B4F' }}>Despesas</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie suas despesas fixas e variáveis</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Despesas Fixas</p>
          <p className="text-xl font-bold" style={{ color: '#2E78B7' }}>{fmt(totalFixas)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{fixas.length} cadastradas</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Despesas Variáveis</p>
          <p className="text-xl font-bold" style={{ color: '#E8872D' }}>{fmt(totalVariaveis)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{variaveis.length} cadastradas</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Geral</p>
          <p className="text-xl font-bold" style={{ color: '#dc2626' }}>{fmt(totalGeral)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">/mês</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {([['todas', 'Todas'], ['fixa', 'Fixas'], ['variavel', 'Variáveis']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filtro === key ? 'text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            style={filtro === key ? { background: '#2E78B7' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ Layout: lado a lado (fixas | variáveis) ou empilhado (todas) ═══ */}
      {filtro === 'todas' ? (
        /* Empilhado — todas juntas */
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {despesas.length === 0 ? (
            <ListaVazia />
          ) : (
            <div className="divide-y divide-gray-100">
              {despesas.map(d => (
                <DespesaItem
                  key={d.id}
                  d={d}
                  onTogglePago={() => handleTogglePago(d)}
                  onEdit={() => abrirEditar(d)}
                  onRemove={() => handleRemove(d)}
                  mostrarBadgeTipo
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Lado a lado — dividido fixas | variáveis */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fixas */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <h3 className="font-bold text-sm" style={{ color: '#2E78B7' }}>
                Fixas
              </h3>
              <span className="text-xs text-gray-400 ml-auto">{fixas.length}</span>
            </div>
            {fixas.length === 0 ? (
              <ListaVazia tipo="fixa" />
            ) : (
              <div className="divide-y divide-gray-100">
                {fixas.map(d => (
                  <DespesaItem
                    key={d.id}
                    d={d}
                    onTogglePago={() => handleTogglePago(d)}
                    onEdit={() => abrirEditar(d)}
                    onRemove={() => handleRemove(d)}
                    mostrarBadgeTipo={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Variáveis */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-lg">📌</span>
              <h3 className="font-bold text-sm" style={{ color: '#E8872D' }}>
                Variáveis
              </h3>
              <span className="text-xs text-gray-400 ml-auto">{variaveis.length}</span>
            </div>
            {variaveis.length === 0 ? (
              <ListaVazia tipo="variavel" />
            ) : (
              <div className="divide-y divide-gray-100">
                {variaveis.map(d => (
                  <DespesaItem
                    key={d.id}
                    d={d}
                    onTogglePago={() => handleTogglePago(d)}
                    onEdit={() => abrirEditar(d)}
                    onRemove={() => handleRemove(d)}
                    mostrarBadgeTipo={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensagens */}
      {sucesso && (
        <div className="rounded-xl px-4 py-3 text-sm text-center bg-green-100 text-green-700 border border-green-200">
          {sucesso}
        </div>
      )}
      {erro && (
        <div className="rounded-xl px-4 py-3 text-sm text-center bg-red-100 text-red-700 border border-red-200">
          {erro}
        </div>
      )}

      {/* Botão adicionar */}
      {!showForm && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#5AAA4A' }}
        >
          + Adicionar Despesa
        </button>
      )}

      {/* Formulário (adicionar ou editar) */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 space-y-4">
          <h3 className="font-bold text-gray-800">
            {editando ? 'Editar Despesa' : 'Nova Despesa'}
          </h3>

          {/* Tipo */}
          <div>
            <label className="label">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'variavel' as const, icon: '📌', label: 'Variável', desc: 'Despesa pontual, única vez.' },
                { key: 'fixa' as const, icon: '🔄', label: 'Fixa', desc: 'Recorrente, repete mês a mês.' },
              ]).map(t => {
                const ativo = tipo === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTipo(t.key)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${ativo ? 'shadow-md' : 'hover:bg-gray-50'}`}
                    style={{
                      borderColor: ativo ? (t.key === 'fixa' ? '#2E78B7' : '#E8872D') : '#e5e7eb',
                      background: ativo ? (t.key === 'fixa' ? '#eef5fb' : '#fff7ed') : '#fff',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{t.icon}</span>
                      <span className="font-bold text-sm" style={{ color: ativo ? (t.key === 'fixa' ? '#2E78B7' : '#E8872D') : '#374151' }}>
                        {t.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-tight">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Descrição</label>
            <input type="text" className="input" value={descricao}
              onChange={e => setDescricao(e.target.value)} placeholder="Ex: Aluguel, Internet, Material..." required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={valor}
                onChange={e => setValor(e.target.value.replace(/[^\d,\.]/g, ''))}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="label">Data de Vencimento</label>
              <input type="date" className="input" value={dataVencimento}
                onChange={e => setDataVencimento(e.target.value)} required />
            </div>
          </div>

          {tipo === 'fixa' && (
            <div>
              <label className="label">Data de Fim (opcional)</label>
              <input type="date" className="input" value={dataFim}
                onChange={e => setDataFim(e.target.value)} />
              <p className="text-[11px] text-gray-400 mt-1">
                Se deixar em branco, a despesa se repetirá indefinidamente mês a mês.
                O dia de vencimento será mantido em cada mês.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: editando ? '#2E78B7' : (tipo === 'fixa' ? '#2E78B7' : '#E8872D') }}>
              {editando ? 'Salvar Alterações' : 'Adicionar Despesa'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
