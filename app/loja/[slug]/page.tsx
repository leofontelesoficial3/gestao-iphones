'use client';
import { useEffect, useState, useMemo, use } from 'react';
import { PALETAS } from '@/components/ThemeProvider';
import { TemaCor } from '@/types';

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
  precoPublico: number | null;
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

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// 12x sem juros (preço dividido) — usado como label de parcelamento
const parcela12x = (v: number) => v / 12;

// Ordena modelos por número (IPHONE 17 antes de IPHONE 14)
function ordemModelo(modelo: string): number {
  const m = modelo.match(/(\d+)/);
  return m ? -parseInt(m[1]) : 0;
}

// Ordem das linhas (PRO MAX antes de PRO antes de NORMAL...)
const ORDEM_LINHA: Record<string, number> = {
  'PRO MAX': 1, 'PRO': 2, 'PLUS': 3, 'AIR': 4, 'NORMAL': 5,
  'MINI': 6, 'SE': 7, 'XR': 8, 'C': 9, 'E': 10,
};

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

  // Filtra por busca e agrupa por modelo + linha
  const grupos = useMemo(() => {
    if (!data) return [] as Array<{ titulo: string; produtos: ProdutoPublico[] }>;
    const q = busca.toLowerCase().trim();
    const filtrados = q
      ? data.produtos.filter(p =>
          [p.modelo, p.linha, p.cor, p.gb, p.estado, p.descricao, String(p.codigo)]
            .filter(Boolean)
            .some(v => v!.toLowerCase().includes(q)),
        )
      : data.produtos;

    const mapa = new Map<string, ProdutoPublico[]>();
    for (const p of filtrados) {
      const titulo = `${p.modelo}${p.linha ? ' ' + p.linha : ''}`.trim();
      if (!mapa.has(titulo)) mapa.set(titulo, []);
      mapa.get(titulo)!.push(p);
    }

    // Ordena cada grupo por GB crescente
    const parseGb = (gb: string) => parseInt(gb.replace(/\D/g, '')) || 0;
    for (const arr of mapa.values()) {
      arr.sort((a, b) => parseGb(a.gb) - parseGb(b.gb));
    }

    // Ordena os grupos por modelo desc + linha
    return Array.from(mapa.entries())
      .map(([titulo, produtos]) => ({ titulo, produtos }))
      .sort((a, b) => {
        const ma = a.produtos[0].modelo;
        const mb = b.produtos[0].modelo;
        if (ordemModelo(ma) !== ordemModelo(mb)) return ordemModelo(ma) - ordemModelo(mb);
        const la = a.produtos[0].linha;
        const lb = b.produtos[0].linha;
        return (ORDEM_LINHA[la] ?? 99) - (ORDEM_LINHA[lb] ?? 99);
      });
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
  const totalDisponivel = data.produtos.length;

  const pedirViaWhatsApp = (p: ProdutoPublico) => {
    if (!data.loja.whatsapp) {
      alert('Esta loja ainda não cadastrou um WhatsApp para pedidos.');
      return;
    }
    const texto = [
      `Olá! Vi este produto no catálogo de ${data.loja.nomeLoja} e tenho interesse:`,
      ``,
      `📱 *${p.modelo} ${p.linha}*`,
      `${p.gb} · ${p.cor} · ${p.estado}`,
      p.bateria ? `Bateria: ${p.bateria}%` : '',
      p.precoPublico ? `Preço: ${fmtMoeda(p.precoPublico)}` : '',
      `Código: #${p.codigo}`,
      p.descricao ? `\nDescrição: ${p.descricao}` : '',
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/55${data.loja.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#f4f5f7' }}>
      {/* Watermark diagonal repetida ao fundo */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.04] select-none"
        style={{
          backgroundImage: `repeating-linear-gradient(-30deg, transparent 0 100px, rgba(0,0,0,0.4) 100px 101px)`,
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center"
        style={{ transform: 'rotate(-25deg) scale(1.4)' }}
      >
        <p
          className="text-[60px] md:text-[90px] font-black tracking-tight whitespace-nowrap opacity-[0.04] uppercase"
          style={{ color: paleta.primary }}
        >
          {data.loja.nomeLoja} · {data.loja.nomeLoja} · {data.loja.nomeLoja}
        </p>
      </div>

      {/* Header */}
      <header
        className="relative z-20 text-white shadow-md sticky top-0"
        style={{ background: `linear-gradient(135deg, ${paleta.primary} 0%, ${paleta.primaryDark} 100%)` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {data.loja.logo ? (
            <div className="bg-white rounded-lg p-1 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.loja.logo} alt={data.loja.nomeLoja} className="h-8 md:h-10 w-auto object-contain" />
            </div>
          ) : (
            <span className="text-2xl">🏪</span>
          )}
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight truncate flex-shrink-0">
            {data.loja.nomeLoja}
          </h1>
          <div className="flex-1 max-w-md mx-auto relative hidden sm:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={`Buscar no catálogo`}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/15 placeholder-white/60 text-sm text-white border border-white/20 focus:bg-white/25 focus:outline-none transition-colors"
            />
          </div>
          {data.loja.whatsapp && (
            <a
              href={`https://wa.me/55${data.loja.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs md:text-sm font-semibold flex items-center gap-1 backdrop-blur transition-colors flex-shrink-0"
            >
              <span>💬</span> <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
        {/* Busca mobile */}
        <div className="sm:hidden px-4 pb-3">
          <input
            type="text"
            placeholder="Buscar no catálogo"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/15 placeholder-white/60 text-sm text-white border border-white/20 focus:bg-white/25 focus:outline-none transition-colors"
          />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8 space-y-7">
        {totalDisponivel === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-lg font-bold text-gray-700">Catálogo vazio</p>
            <p className="text-sm text-gray-500 mt-1">
              Esta loja ainda não cadastrou produtos com preço público.
            </p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-700 font-semibold">Nenhum produto encontrado</p>
            <button
              onClick={() => setBusca('')}
              className="mt-3 text-sm font-semibold underline"
              style={{ color: paleta.primary }}
            >
              Limpar busca
            </button>
          </div>
        ) : (
          grupos.map((grupo, gi) => (
            <section key={grupo.titulo}>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-800 mb-3 px-1">
                {grupo.titulo}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {grupo.produtos.map((p, idx) => {
                  // Marca o primeiro produto do primeiro grupo como "MAIS VENDIDO"
                  // e o primeiro do segundo grupo como "MAIS NOVO" (heurística simples)
                  const tag = gi === 0 && idx === 0
                    ? 'MAIS VENDIDO'
                    : gi === 1 && idx === 0
                      ? 'MAIS NOVO'
                      : null;
                  return (
                    <article
                      key={p.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden flex flex-col cursor-pointer relative"
                      onClick={() => { setProdutoSel(p); setFotoIdx(0); }}
                    >
                      {tag && (
                        <div
                          className="absolute top-3 left-0 z-10 px-3 py-1 text-[9px] md:text-[10px] font-extrabold tracking-widest uppercase shadow-md"
                          style={{
                            background: '#FCD34D',
                            color: '#78350F',
                            transform: 'translateX(-4px)',
                            clipPath: 'polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%)',
                            paddingRight: '14px',
                          }}
                        >
                          {tag}
                        </div>
                      )}
                      <div className="aspect-[4/5] w-full bg-gradient-to-b from-gray-50 to-white flex items-center justify-center overflow-hidden p-3">
                        {p.fotos.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.fotos[0]} alt={p.modelo} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-6xl text-gray-300">📱</span>
                        )}
                      </div>
                      <div className="p-3 md:p-4 text-center border-t border-gray-50 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-sm md:text-base leading-tight">
                            {p.modelo} {p.linha}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500 font-medium">{p.gb}</p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{p.cor}</p>
                        </div>
                        {p.precoPublico && (
                          <div className="mt-2 space-y-0.5">
                            <p className="font-extrabold text-gray-800 text-base md:text-lg leading-none">
                              POR <span style={{ color: paleta.primary }}>{fmtMoeda(p.precoPublico)}</span>
                            </p>
                            <p className="text-[10px] md:text-[11px] text-gray-500">
                              ou 12x {fmtMoeda(parcela12x(p.precoPublico))}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Bloco de troca / atendimento */}
        {totalDisponivel > 0 && (
          <section
            className="rounded-2xl p-5 md:p-6 grid md:grid-cols-2 gap-4 items-center shadow-sm"
            style={{ background: paleta.primaryLight }}
          >
            <div>
              <h3 className="text-base md:text-lg font-extrabold mb-1" style={{ color: paleta.primaryDark }}>
                Recebemos seu iPhone usado como parte da troca.
              </h3>
              <p className="text-sm text-gray-700">
                Oferecemos produtos originais e atendimento personalizado.
                Avalie seu iPhone na hora e abata no valor do novo.
              </p>
            </div>
            {data.loja.whatsapp && (
              <a
                href={`https://wa.me/55${data.loja.whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse em fazer uma troca na ${data.loja.nomeLoja}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl text-white font-bold text-center inline-flex items-center justify-center gap-2"
                style={{ background: '#25D366' }}
              >
                💬 Falar no WhatsApp
              </a>
            )}
          </section>
        )}

        {/* Rodapé com benefícios */}
        {totalDisponivel > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { icone: '💳', titulo: 'Parcelamento', txt: 'em até 12x' },
              { icone: '🛡️', titulo: 'Originais', txt: 'com garantia' },
              { icone: '🔄', titulo: 'Aceitamos troca', txt: 'do seu usado' },
              { icone: '⭐', titulo: 'Atendimento', txt: 'personalizado' },
            ].map(b => (
              <div key={b.titulo} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="text-2xl">{b.icone}</div>
                <p className="text-xs font-bold text-gray-700 mt-1">{b.titulo}</p>
                <p className="text-[10px] text-gray-500">{b.txt}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="relative z-10 max-w-6xl mx-auto px-4 py-6 text-center">
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
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="aspect-square w-full relative overflow-hidden bg-gradient-to-b from-gray-50 to-white"
            >
              {produtoSel.fotos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={produtoSel.fotos[fotoIdx]}
                  alt={produtoSel.modelo}
                  className="w-full h-full object-contain p-6"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-7xl text-gray-300">📱</span>
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
                        className={`w-1.5 h-1.5 rounded-full ${i === fotoIdx ? 'bg-gray-700' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => setProdutoSel(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-lg backdrop-blur"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 leading-tight">
                  {produtoSel.modelo} <span className="text-gray-500 font-normal">{produtoSel.linha}</span>
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{produtoSel.gb} · {produtoSel.cor}</p>
              </div>

              {produtoSel.precoPublico && (
                <div
                  className="rounded-xl p-4 text-center"
                  style={{ background: paleta.primaryLight }}
                >
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: paleta.primaryDark }}>
                    Por
                  </p>
                  <p className="text-3xl font-extrabold" style={{ color: paleta.primary }}>
                    {fmtMoeda(produtoSel.precoPublico)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    ou 12x de <strong>{fmtMoeda(parcela12x(produtoSel.precoPublico))}</strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Estado</p>
                  <p className="font-bold text-gray-700">{produtoSel.estado || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Bateria</p>
                  <p className="font-bold text-gray-700">{produtoSel.bateria || '—'}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Código</p>
                  <p className="font-mono font-bold text-gray-700">#{produtoSel.codigo}</p>
                </div>
              </div>

              {produtoSel.descricao && (
                <div className="rounded-lg p-3 text-sm bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wide font-semibold mb-1 text-gray-500">
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
