'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { adicionarVendedor, removerVendedor, getVendedoresDaConta, getLimiteVendedores } from '@/lib/auth';
import type { Plano, Perfil } from '@/lib/auth';
import Link from 'next/link';

const PLANO_LABEL: Record<Plano, string> = {
  gratuito: 'Gratuito',
  profissional: 'Profissional',
  empresarial: 'Empresarial',
};

const PLANO_COR: Record<Plano, string> = {
  gratuito: '#9ca3af',
  profissional: '#2E78B7',
  empresarial: '#3B3B4F',
};

// Estilo dos badges por cargo
const PERFIL_STYLE: Record<Perfil, { bg: string; fg: string; label: string; avatar: string }> = {
  admin:    { bg: '#eef5fb', fg: '#2E78B7', label: 'Administrador', avatar: '#2E78B7' },
  vendedor: { bg: '#eef7ec', fg: '#3d7a35', label: 'Vendedor',      avatar: '#5AAA4A' },
};

interface Membro {
  usuario: string;
  nome: string;
  perfil: Perfil;
}

export default function VendedoresPage() {
  const { conta, isAdmin } = useAuth();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [limite, setLimite] = useState(0);
  const [plano, setPlanoState] = useState<Plano>('gratuito');

  // Formulário
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [perfilSel, setPerfilSel] = useState<Perfil>('vendedor');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const v = await getVendedoresDaConta(conta);
    setMembros(v as Membro[]);
    const info = await getLimiteVendedores(conta);
    setLimite(info.limite);
    setPlanoState(info.plano);
  }, [conta]);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) return null;

  const podeAdicionar = membros.length < limite;
  const pctUsado = limite > 0 ? (membros.length / limite) * 100 : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    if (senha.length < 4) { setErro('A senha deve ter pelo menos 4 caracteres.'); return; }
    const result = await adicionarVendedor(
      conta,
      usuario.toLowerCase().replace(/\s/g, ''),
      nome,
      senha,
      perfilSel,
    );
    if (!result.ok) { setErro(result.erro || 'Erro ao adicionar.'); return; }
    const cargoLabel = PERFIL_STYLE[perfilSel].label;
    setSucesso(`${cargoLabel} "${nome}" criado com sucesso! Login: ${usuario.toLowerCase()} · Senha definida.`);
    setNome(''); setUsuario(''); setSenha(''); setPerfilSel('vendedor'); setMostrarSenha(false);
    setShowForm(false);
    await load();
  };

  const handleRemove = async (m: Membro) => {
    if (!confirm(`Remover ${PERFIL_STYLE[m.perfil].label.toLowerCase()} "${m.nome}"?`)) return;
    await removerVendedor(conta, m.usuario);
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#3B3B4F' }}>Equipe</h1>
          <p className="text-sm text-gray-400 mt-1">Administradores e vendedores da sua conta</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: PLANO_COR[plano] }}>
            Plano {PLANO_LABEL[plano]}
          </span>
          <span className="text-sm text-gray-500">
            {membros.length}/{limite} membros
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Vagas de equipe utilizadas</span>
          <span className="text-sm font-bold" style={{ color: PLANO_COR[plano] }}>
            {membros.length} de {limite}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full transition-all"
            style={{
              width: `${pctUsado}%`,
              background: PLANO_COR[plano],
            }}
          />
        </div>
        {plano === 'gratuito' && (
          <p className="text-xs text-gray-400 mt-2">
            O plano Gratuito não permite membros de equipe.{' '}
            <Link href="/site#planos" className="hover:underline" style={{ color: '#2E78B7' }}>
              Fazer upgrade →
            </Link>
          </p>
        )}
        {plano === 'profissional' && membros.length >= limite && (
          <p className="text-xs text-gray-400 mt-2">
            Limite atingido.{' '}
            <Link href="/site#planos" className="hover:underline" style={{ color: '#2E78B7' }}>
              Upgrade para Empresarial (até 5) →
            </Link>
          </p>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {membros.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <span className="text-4xl block mb-3">👥</span>
            <p className="font-medium">Nenhum membro de equipe cadastrado</p>
            <p className="text-sm mt-1">
              {limite > 0
                ? 'Adicione administradores ou vendedores para sua conta.'
                : 'Faça upgrade do plano para adicionar membros.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {membros.map(m => {
              const style = PERFIL_STYLE[m.perfil] ?? PERFIL_STYLE.vendedor;
              return (
                <div key={m.usuario} className="flex items-center justify-between px-4 md:px-5 py-4 hover:bg-gray-50 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: style.avatar }}>
                      {m.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm truncate">{m.nome}</p>
                      <p className="text-xs text-gray-400 truncate">@{m.usuario}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap"
                      style={{ background: style.bg, color: style.fg }}>
                      {style.label}
                    </span>
                    <button
                      onClick={() => handleRemove(m)}
                      className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
      {podeAdicionar && !showForm && (
        <button
          onClick={() => { setShowForm(true); setErro(''); setSucesso(''); }}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#5AAA4A' }}
        >
          + Adicionar Membro
        </button>
      )}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl shadow p-5 space-y-4">
          <h3 className="font-bold text-gray-800">Novo Membro da Equipe</h3>

          {/* Seletor de cargo */}
          <div>
            <label className="label">Cargo</label>
            <div className="grid grid-cols-2 gap-2">
              {(['vendedor', 'admin'] as const).map(p => {
                const s = PERFIL_STYLE[p];
                const ativo = perfilSel === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPerfilSel(p)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${ativo ? 'shadow-md' : 'hover:bg-gray-50'}`}
                    style={{
                      borderColor: ativo ? s.fg : '#e5e7eb',
                      background: ativo ? s.bg : '#fff',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p === 'admin' ? '👑' : '🛒'}</span>
                      <span className="font-bold text-sm" style={{ color: ativo ? s.fg : '#374151' }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                      {p === 'admin'
                        ? 'Acesso total: dashboard, vendas, valores, equipe.'
                        : 'Somente estoque e realizar vendas. Sem ver valores.'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nome</label>
              <input type="text" className="input" value={nome}
                onChange={e => setNome(e.target.value)} placeholder="Nome completo" required />
            </div>
            <div>
              <label className="label">Usuário (login)</label>
              <input type="text" className="input" value={usuario}
                onChange={e => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="Ex: maria" required />
            </div>
          </div>

          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                className="input !pr-20"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:underline"
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              O novo membro usará o <strong>usuário</strong> e <strong>senha</strong> definidos acima para entrar no sistema.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: PERFIL_STYLE[perfilSel].fg }}>
              Criar {PERFIL_STYLE[perfilSel].label}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
