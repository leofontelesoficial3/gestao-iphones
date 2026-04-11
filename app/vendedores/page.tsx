'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { adicionarVendedor, removerVendedor, getVendedoresDaConta, getLimiteVendedores, getPlano } from '@/lib/auth';
import type { Plano } from '@/lib/auth';
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

export default function VendedoresPage() {
  const { conta, isAdmin } = useAuth();
  const [vendedores, setVendedores] = useState<{ usuario: string; nome: string }[]>([]);
  const [limite, setLimite] = useState(0);
  const [plano, setPlano2] = useState<Plano>('gratuito');
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const v = await getVendedoresDaConta(conta);
    setVendedores(v.map((u: any) => ({ usuario: u.usuario, nome: u.nome })));
    const info = await getLimiteVendedores(conta);
    setLimite(info.limite);
    setPlano2(info.plano);
  }, [conta]);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) return null;

  const podeAdicionar = vendedores.length < limite;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    if (senha.length < 4) { setErro('A senha deve ter pelo menos 4 caracteres.'); return; }
    const result = await adicionarVendedor(conta, usuario.toLowerCase().replace(/\s/g, ''), nome, senha);
    if (!result.ok) { setErro(result.erro || 'Erro ao adicionar.'); return; }
    setSucesso(`Vendedor "${nome}" criado com sucesso!`);
    setNome(''); setUsuario(''); setSenha('');
    setShowForm(false);
    await load();
  };

  const handleRemove = async (usr: string, nomeV: string) => {
    if (!confirm(`Remover o vendedor "${nomeV}"?`)) return;
    await removerVendedor(conta, usr);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#3B3B4F' }}>Vendedores</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie os vendedores vinculados à sua conta</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: PLANO_COR[plano] }}>
            Plano {PLANO_LABEL[plano]}
          </span>
          <span className="text-sm text-gray-500">
            {vendedores.length}/{limite} vendedores
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Vendedores utilizados</span>
          <span className="text-sm font-bold" style={{ color: PLANO_COR[plano] }}>
            {vendedores.length} de {limite}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full transition-all"
            style={{
              width: `${limite > 0 ? (vendedores.length / limite) * 100 : 0}%`,
              background: PLANO_COR[plano],
            }}
          />
        </div>
        {plano === 'gratuito' && (
          <p className="text-xs text-gray-400 mt-2">
            O plano Gratuito não permite vendedores.{' '}
            <Link href="/site#planos" className="hover:underline" style={{ color: '#2E78B7' }}>
              Fazer upgrade →
            </Link>
          </p>
        )}
        {plano === 'profissional' && vendedores.length >= limite && (
          <p className="text-xs text-gray-400 mt-2">
            Limite atingido.{' '}
            <Link href="/site#planos" className="hover:underline" style={{ color: '#2E78B7' }}>
              Upgrade para Empresarial (até 5) →
            </Link>
          </p>
        )}
      </div>

      {/* Lista de vendedores */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {vendedores.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <span className="text-4xl block mb-3">👥</span>
            <p className="font-medium">Nenhum vendedor cadastrado</p>
            <p className="text-sm mt-1">
              {limite > 0
                ? 'Adicione vendedores para que eles acessem o estoque.'
                : 'Faça upgrade do plano para adicionar vendedores.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {vendedores.map(v => (
              <div key={v.usuario} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: '#5AAA4A' }}>
                    {v.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{v.nome}</p>
                    <p className="text-xs text-gray-400">@{v.usuario}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    Vendedor
                  </span>
                  <button
                    onClick={() => handleRemove(v.usuario, v.nome)}
                    className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-600 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
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

      {/* Botão adicionar / Formulário */}
      {podeAdicionar && !showForm && (
        <button
          onClick={() => { setShowForm(true); setErro(''); setSucesso(''); }}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#5AAA4A' }}
        >
          + Adicionar Vendedor
        </button>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl shadow p-5 space-y-4">
          <h3 className="font-bold text-gray-800">Novo Vendedor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div>
              <label className="label">Senha</label>
              <input type="password" className="input" value={senha}
                onChange={e => setSenha(e.target.value)} placeholder="Mín. 4 caracteres" required />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#5AAA4A' }}>
              Criar Vendedor
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
