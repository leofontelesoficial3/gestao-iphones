'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    setTimeout(() => {
      const ok = login(usuario, senha);
      if (ok) {
        router.push('/');
      } else {
        setErro('Usuário ou senha incorretos');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #2a2a3d 0%, #1a2a40 50%, #2a2a3d 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo + Nome */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl p-5 shadow-xl mb-5">
            <Image src="/logo.jpg" alt="iPhones Fortaleza" width={220} height={100}
              className="object-contain" priority />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            iPhones <span style={{ color: '#2E78B7' }}>Fortaleza</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Sistema de Gestão</p>
        </div>

        {/* Card de login */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl p-6 shadow-2xl border space-y-5"
          style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)' }}>

          {/* Erro */}
          {erro && (
            <div className="rounded-xl px-4 py-3 text-sm text-center"
              style={{ background: 'rgba(217,64,112,0.2)', border: '1px solid rgba(217,64,112,0.4)', color: '#f8a4c0' }}>
              {erro}
            </div>
          )}

          {/* Usuário */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8ab4d8' }}>Usuário</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8ab4d8' }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl transition-all text-sm disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #2E78B7, #3B3B4F)',
              boxShadow: '0 4px 15px rgba(46,120,183,0.3)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>

          {/* Info */}
          <p className="text-center text-xs" style={{ color: 'rgba(138,180,216,0.5)' }}>
            Primeiro acesso? Use <strong style={{ color: '#8ab4d8' }}>admin</strong> / <strong style={{ color: '#8ab4d8' }}>admin</strong>
          </p>
        </form>

        {/* Rodapé */}
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
          iPhones Fortaleza&reg; — Sistema de Gestão
        </p>
      </div>
    </div>
  );
}
