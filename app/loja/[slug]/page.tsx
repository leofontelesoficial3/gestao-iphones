'use client';
import { useEffect, useState, useMemo, use } from 'react';
import { PALETAS } from '@/components/ThemeProvider';
import { TemaCor } from '@/types';
import { corSuave } from '@/lib/cores';

interface ProdutoPublico {
  id: string;
  codigo: number;
  modelo: string;
  linha: string;
  gb: string;
  cor: string;
  estado: string;
  bateria: string;
  descricao: string | null;
  fotos: string[];
}

interface LojaInfo {
  slug: string;
  nomeLoja: string;
  cor: TemaCor;
  logo: string | null;
  whatsapp: string | null;
}

interface Resposta {
  loja: LojaInfo;
  produtos: ProdutoPublico[];
}

export default function LojaPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<Resposta | null>(null);
  const [erro, setErro] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [produtoSel, setProdutoSel] = useState<ProdutoPublico | null>(null);
  const [fotoIdx, setFotoIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/loja/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Loja não encontrada');
        return res.json();
      })
      .then(setData)
      .catch(() => setErro('Loja não encontrada'));
  }, [slug]);

  const filtrados = useMemo(() => {
    if (!data) return [];
    const q = busca.toLowerCase().trim();
    if (!q) return data.produtos;
    return data.produtos.filter(p =>
      [p.modelo, p.linha, p.cor, p.gb, p.estado, p.descricao, String(p.codigo)]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q)),
    );
  }, [data, busca]);

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-3">🏪</div>
          <p className="text-xl font-bold text-gray-700">{erro}</p>
          <p className="text-sm text-gray-500 mt-1">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  const paleta = PALETAS[data.loja.cor] ?? PALETAS.azul;

  const pedirViaWhatsApp = (p: ProdutoPublico) => {
    if (!data.loja.whatsapp) {
      alert('Esta loja ainda não cadastrou um WhatsApp para pedidos.');
      return;
    }
    const texto = [
      `Olá! Vi este produto na loja online de ${data.loja.nomeLoja} e gostaria de mais informações:`,
      ``,
      `📱 *${p.modelo} ${p.linha}*`,
      `${p.gb} · ${p.cor} · ${p.estado}`,
      p.bateria ? `Bateria: ${p.bateria}%` : '',
      `Código: #${p.codigo}`,
      p.descricao ? `\nDescrição: ${p.descricao}` : '',
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/55${data.loja.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4f5f7' }}>
      {/* Header */}
      <header
        className="text-white shadow-lg sticky top-0 z-30"
        style={{ background: `linear-gradient(135deg, ${paleta.primary} 0%, ${paleta.primaryDark} 100%)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4 flex-wrap">
          {data.loja.logo && (
            <div className="bg-white rounded-xl p-1.5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.loja.logo} alt={data.loja.nomeLoja} className="h-10 w-auto object-contain" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight truncate">{data.loja.nomeLoja}</h1>
            <p className="text-xs text-white/70">Catálogo online · {data.produtos.length} aparelhos disponíveis</p>
          </div>
          {data.loja.whatsapp && (
            <a
              href={`https://wa.me/55${data.loja.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold flex items-center gap-2 backdrop-blur transition-colors"
            >
              <span>💬</span> WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* Busca */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <input
          type="text"
          placeholder="Buscar modelo, cor, GB..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none"
          style={{ borderColor: busca ? paleta.primary : undefined }}
        />
      </div>

      {/* Grid de produtos */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {filtrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-600 font-semibold">
              {busca ? 'Nenhum produto encontrado' : 'Nenhum aparelho disponível no momento'}
            </p>
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="mt-3 text-sm font-semibold underline"
                style={{ color: paleta.primary }}
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtrados.map(p => (
              <button
                key={p.id}
                onClick={() => { setProdutoSel(p); setFotoIdx(0); }}
                className="text-left rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 active:scale-[0.98] bg-white"
              >
                <div
                  className="aspect-square w-full flex items-center justify-center overflow-hidden"
                  style={{ background: corSuave(p.cor) }}
                >
                  {p.fotos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.fotos[0]} alt={p.modelo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl text-gray-300">📱</span>
                  )}
                </div>
                <div className="p-3 space-y-0.5">
                  <p className="font-bold text-gray-800 text-sm leading-tight truncate">
                    {p.modelo} <span className="text-gray-400 font-normal text-xs">{p.linha}</span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">{p.gb} · {p.cor}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    <span className={`inline-block px-1.5 py-0.5 rounded-full font-semibold ${
                      p.estado === 'NOVO' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{p.estado}</span>
                    {p.bateria && <span className="ml-1.5">🔋 {p.bateria}%</span>}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 mt-4 text-center">
        <p className="text-xs text-gray-400">
          {data.loja.nomeLoja} · Catálogo atualizado em tempo real
        </p>
      </footer>

      {/* Modal de detalhes */}
      {produtoSel && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setProdutoSel(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Carrossel de fotos */}
            <div
              className="aspect-square w-full relative overflow-hidden"
              style={{ background: corSuave(produtoSel.cor) }}
            >
              {produtoSel.fotos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={produtoSel.fotos[fotoIdx]} alt={produtoSel.modelo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl text-gray-300">📱</span>
                </div>
              )}

              {produtoSel.fotos.length > 1 && (
                <>
                  <button
                    onClick={() => setFotoIdx(i => (i === 0 ? produtoSel.fotos.length - 1 : i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setFotoIdx(i => (i + 1) % produtoSel.fotos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {produtoSel.fotos.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i === fotoIdx ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => setProdutoSel(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 leading-tight">
                  {produtoSel.modelo} <span className="text-gray-400 font-normal">{produtoSel.linha}</span>
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Código #{produtoSel.codigo}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Armazenamento</p>
                  <p className="font-bold text-gray-700">{produtoSel.gb || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cor</p>
                  <p className="font-bold text-gray-700">{produtoSel.cor || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Estado</p>
                  <p className="font-bold text-gray-700">{produtoSel.estado || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Bateria</p>
                  <p className="font-bold text-gray-700">{produtoSel.bateria || '—'}%</p>
                </div>
              </div>

              {produtoSel.descricao && (
                <div className="rounded-lg p-3 text-sm" style={{ background: paleta.primaryLight }}>
                  <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: paleta.primaryDark }}>
                    Descrição
                  </p>
                  <p className="text-gray-700 whitespace-pre-line">{produtoSel.descricao}</p>
                </div>
              )}

              <button
                onClick={() => pedirViaWhatsApp(produtoSel)}
                className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                style={{ background: '#25D366' }}
              >
                <span className="text-lg">💬</span> Quero esse — falar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
