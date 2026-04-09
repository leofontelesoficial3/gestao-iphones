'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-4">
            <span className="text-4xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Gestão iPhones</h1>
          <p className="text-blue-300 text-sm mt-1">Faça login para acessar o sistema</p>
        </div>

        {/* Card de login */}
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/10 space-y-5">

          {/* Erro */}
          {erro && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm text-center">
              {erro}
            </div>
          )}

          {/* Usuário */}
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1.5">Usuário</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-lg">👤</span>
              <input
                type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 text-sm"
                placeholder="Digite seu usuário"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-1.5">Senha</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-lg">🔒</span>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 text-sm"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/30 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>

          {/* Info */}
          <p className="text-center text-blue-300/60 text-xs">
            Primeiro acesso? Use <strong className="text-blue-200">admin</strong> / <strong className="text-blue-200">admin</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
