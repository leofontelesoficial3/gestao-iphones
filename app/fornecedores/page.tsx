'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Fornecedor } from '@/types';
import { getFornecedores, addFornecedor, updateFornecedor, deleteFornecedor } from '@/lib/storage';
import { mascaraCelular } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import Toast from '@/components/Toast';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Limpa número de telefone para formato E.164 BR (ex: 5585999887766)
function telefoneWhatsApp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '');
  if (!digitos) return '';
  // Se já começar com 55, usa direto; senão prefixa
  if (digitos.startsWith('55')) return digitos;
  return '55' + digitos;
}

const WhatsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export default function FornecedoresPage() {
  const { isAdmin } = useAuth();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const load = useCallback(async () => {
    setCarregando(true);
    const lista = await getFornecedores(true);
    setFornecedores(lista);
    setCarregando(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) return null;

  const filtrados = useMemo(() => {
    if (!busca.trim()) return fornecedores;
    const q = busca.toLowerCase();
    return fornecedores.filter(f =>
      f.nome.toLowerCase().includes(q) ||
      f.telefone.includes(q) ||
      f.endereco.toLowerCase().includes(q)
    );
  }, [fornecedores, busca]);

  // Ranking dos mais comprados (Top 5)
  const ranking = useMemo(() => {
    return [...fornecedores]
      .filter(f => (f.totalProdutos ?? 0) > 0)
      .sort((a, b) => (b.valorTotal ?? 0) - (a.valorTotal ?? 0))
      .slice(0, 5);
  }, [fornecedores]);

  const totalComprado = fornecedores.reduce((s, f) => s + (f.valorTotal ?? 0), 0);
  const totalProdutos = fornecedores.reduce((s, f) => s + (f.totalProdutos ?? 0), 0);

  const abrirNovo = () => {
    setEditando(null);
    setNome(''); setTelefone(''); setEndereco('');
    setModalOpen(true);
  };

  const abrirEdicao = (f: Fornecedor) => {
    setEditando(f);
    setNome(f.nome);
    setTelefone(mascaraCelular(f.telefone || ''));
    setEndereco(f.endereco || '');
    setModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      if (editando) {
        await updateFornecedor(editando.id, { nome: nome.trim(), telefone, endereco });
        setToastMsg(`Fornecedor "${nome}" atualizado!`);
      } else {
        await addFornecedor({ nome: nome.trim(), telefone, endereco });
        setToastMsg(`Fornecedor "${nome}" cadastrado!`);
      }
      setToastOpen(true);
      setModalOpen(false);
      await load();
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (f: Fornecedor) => {
    if (!confirm(`Excluir o fornecedor "${f.nome}"? Produtos vinculados ficarão sem fornecedor.`)) return;
    await deleteFornecedor(f.id);
    await load();
  };

  const handleWhatsApp = (f: Fornecedor) => {
    const numero = telefoneWhatsApp(f.telefone);
    if (!numero) { alert('Este fornecedor não tem telefone cadastrado.'); return; }
    const msg = encodeURIComponent(`Olá ${f.nome}, tudo bem?`);
    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#3B3B4F' }}>Fornecedores</h1>
          <p className="text-sm text-gray-400 mt-1">Cadastre e gerencie seus fornecedores de produtos</p>
        </div>
        <button
          onClick={abrirNovo}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#2E78B7' }}
        >
          + Novo Fornecedor
        </button>
      </div>

      {/* Dashboard de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-xl p-4 md:p-5 shadow bg-white" style={{ borderLeft: '4px solid #2E78B7' }}>
          <p className="text-xs md:text-sm font-medium text-gray-500">Fornecedores</p>
          <p className="text-lg md:text-2xl font-bold mt-1" style={{ color: '#2E78B7' }}>{fornecedores.length}</p>
          <p className="text-xs text-gray-400 mt-1">Cadastrados</p>
        </div>
        <div className="rounded-xl p-4 md:p-5 shadow bg-white" style={{ borderLeft: '4px solid #5AAA4A' }}>
          <p className="text-xs md:text-sm font-medium text-gray-500">Produtos</p>
          <p className="text-lg md:text-2xl font-bold mt-1" style={{ color: '#5AAA4A' }}>{totalProdutos}</p>
          <p className="text-xs text-gray-400 mt-1">Comprados via fornecedor</p>
        </div>
        <div className="rounded-xl p-4 md:p-5 shadow bg-white col-span-2 md:col-span-1" style={{ borderLeft: '4px solid #E8872D' }}>
          <p className="text-xs md:text-sm font-medium text-gray-500">Investimento</p>
          <p className="text-lg md:text-2xl font-bold mt-1 truncate" style={{ color: '#E8872D' }}>{fmt(totalComprado)}</p>
          <p className="text-xs text-gray-400 mt-1">Valor total de compras</p>
        </div>
      </div>

      {/* Top 5 mais comprados */}
      {ranking.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: '#3B3B4F' }}>🏆 Top fornecedores</h2>
            <span className="text-xs text-gray-400">Por valor investido</span>
          </div>
          <div className="space-y-3">
            {ranking.map((f, i) => {
              const maxValor = ranking[0].valorTotal ?? 1;
              const pct = ((f.valorTotal ?? 0) / maxValor) * 100;
              const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
              return (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="text-lg flex-shrink-0 w-8 text-center">{medalha}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{f.nome}</p>
                      <p className="text-xs font-bold text-gray-600">{fmt(f.valorTotal ?? 0)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2E78B7, #5AAA4A)' }} />
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{f.totalProdutos} produtos</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou endereço..."
          className="input flex-1"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <span className="text-sm text-gray-400 self-center whitespace-nowrap">{filtrados.length}</span>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="py-12 text-center text-gray-400 text-sm">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <div className="text-5xl mb-3">📇</div>
          <p className="text-gray-500 font-medium">
            {busca ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado ainda.'}
          </p>
          {!busca && (
            <button onClick={abrirNovo} className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#2E78B7' }}>
              Cadastrar primeiro fornecedor
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtrados.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: '#2E78B7' }}>
                    {f.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{f.nome}</p>
                    {f.telefone && <p className="text-xs text-gray-500 truncate">{mascaraCelular(f.telefone)}</p>}
                    {f.endereco && <p className="text-[10px] text-gray-400 truncate mt-0.5">📍 {f.endereco}</p>}
                  </div>
                </div>
                {((f.totalProdutos ?? 0) > 0) && (
                  <div className="flex justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <span className="text-gray-500">{f.totalProdutos} produtos</span>
                    <span className="font-semibold" style={{ color: '#E8872D' }}>{fmt(f.valorTotal ?? 0)}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWhatsApp(f)}
                    disabled={!f.telefone}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
                    style={{ background: '#25D366' }}
                  >
                    <WhatsIcon /> WhatsApp
                  </button>
                  <button onClick={() => abrirEdicao(f)} className="py-2 px-3 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-medium"><EditIcon /></button>
                  <button onClick={() => handleExcluir(f)} className="py-2 px-3 text-xs bg-red-100 hover:bg-red-200 rounded-lg text-red-600 font-medium"><TrashIcon /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Fornecedor</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Telefone</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Endereço</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Produtos</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Investido</th>
                  <th className="py-3 px-4 text-gray-500 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(f => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: '#2E78B7' }}>
                          {f.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{f.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{f.telefone ? mascaraCelular(f.telefone) : '—'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{f.endereco || '—'}</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-700">{f.totalProdutos ?? 0}</td>
                    <td className="py-3 px-4 text-right font-semibold" style={{ color: '#E8872D' }}>{fmt(f.valorTotal ?? 0)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleWhatsApp(f)}
                          disabled={!f.telefone}
                          className="px-3 py-1.5 text-xs font-semibold rounded text-white flex items-center gap-1.5 disabled:opacity-40 transition-opacity"
                          style={{ background: '#25D366' }}
                          title={f.telefone ? 'Abrir WhatsApp' : 'Sem telefone'}
                        >
                          <WhatsIcon /> WhatsApp
                        </button>
                        <button onClick={() => abrirEdicao(f)} className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600" title="Editar"><EditIcon /></button>
                        <button onClick={() => handleExcluir(f)} className="px-2 py-1.5 text-xs bg-red-100 hover:bg-red-200 rounded text-red-600" title="Excluir"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal novo/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
            </div>
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="label">Nome do fornecedor *</label>
                <input type="text" className="input" value={nome}
                  onChange={e => setNome(e.target.value)} placeholder="Ex: Distribuidora Apple Norte" required autoFocus />
              </div>
              <div>
                <label className="label">Telefone (WhatsApp)</label>
                <input type="tel" inputMode="numeric" className="input" value={telefone}
                  onChange={e => setTelefone(mascaraCelular(e.target.value))} placeholder="(85) 9 9999-9999" maxLength={16} />
              </div>
              <div>
                <label className="label">Endereço para retirada</label>
                <textarea className="input" value={endereco} rows={3}
                  onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#2E78B7' }}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast open={toastOpen} onClose={() => setToastOpen(false)} tipo="estoque" mensagem={toastMsg} />
    </div>
  );
}
