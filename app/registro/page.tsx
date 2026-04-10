'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { registrar, login } from '@/lib/auth';

export default function RegistroPage() {
  const router = useRouter();
  const [nomeLoja, setNomeLoja] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (senha.length < 4) {
      setErro('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = registrar({ nomeLoja, nomeAdmin, usuario, senha });
      if (!result.ok) {
        setErro(result.erro || 'Erro ao criar conta.');
        setLoading(false);
        return;
      }
      // Faz login automático
      login(usuario, senha);
      router.push('/');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #2a2a3d 0%, #1a2a40 50%, #2a2a3d 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white rounded-2xl p-4 shadow-xl mb-4">
            <Image src="/logo.jpg" alt="iPhones Fortaleza" width={180} height={80}
              className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Criar Nova Conta
          </h1>
          <p className="text-gray-400 text-sm mt-1">Comece a gerenciar seu negócio do zero</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl p-6 shadow-2xl border space-y-4"
          style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)' }}>

          {erro && (
            <div className="rounded-xl px-4 py-3 text-sm text-center"
              style={{ background: 'rgba(217,64,112,0.2)', border: '1px solid rgba(217,64,112,0.4)', color: '#f8a4c0' }}>
              {erro}
            </div>
          )}

          {/* Nome da Loja */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8ab4d8' }}>
              Nome da sua loja / negócio
            </label>
            <input
              type="text"
              value={nomeLoja}
              onChange={e => setNomeLoja(e.target.value)}
              className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              placeholder="Ex: iPhone Store Fortaleza"
              required
            />
          </div>

          {/* Nome do Administrador */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8ab4d8' }}>
              Seu nome
            </label>
            <input
              type="text"
              value={nomeAdmin}
              onChange={e => setNomeAdmin(e.target.value)}
              className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          {/* Usuário */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8ab4d8' }}>
              Nome de usuário (para login)
            </label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              placeholder="Ex: joaostore"
              autoComplete="username"
              required
            />
          </div>

          {/* Senha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#8ab4d8' }}>
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                placeholder="Mín. 4 caracteres"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#8ab4d8' }}>
                Confirmar
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(46,120,183,0.15)', color: '#8ab4d8' }}>
            <p>Sua conta será criada como <strong>Administrador</strong> com acesso total.</p>
            <p className="mt-1">Depois de entrar, você poderá adicionar vendedores ao seu negócio.</p>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl transition-all text-sm disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #5AAA4A, #3d7a35)',
              boxShadow: '0 4px 15px rgba(90,170,74,0.3)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando conta...
              </span>
            ) : 'Criar Conta e Começar'}
          </button>

          {/* Link para login */}
          <p className="text-center text-xs" style={{ color: 'rgba(138,180,216,0.5)' }}>
            Já tem conta?{' '}
            <Link href="/login" className="hover:underline" style={{ color: '#8ab4d8' }}>
              Fazer login
            </Link>
          </p>
        </form>

        {/* Voltar */}
        <div className="text-center mt-5">
          <Link href="/site" className="text-sm hover:underline transition-colors" style={{ color: 'rgba(138,180,216,0.6)' }}>
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
