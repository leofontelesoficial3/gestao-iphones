'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Produto, Fornecedor } from '@/types';
import { addProduto, getNextCodigo, getFornecedores } from '@/lib/storage';
import { mascaraMoedaDigitada, parseCentavos } from '@/lib/format';

const MODELOS = [
  'IPHONE 6','IPHONE 7','IPHONE 8','IPHONE X','IPHONE XR','IPHONE XS','IPHONE XS MAX',
  'IPHONE 11','IPHONE 12','IPHONE 13','IPHONE 14','IPHONE 15','IPHONE 16','IPHONE 17',
  'IPHONE SE','IPAD 9','IPAD 10','MAGIC MOUSE','MAGIC KEYBOARD','SMARTWATCH',
];
const LINHAS = ['NORMAL','PRO','PRO MAX','PLUS','AIR','MINI','XR','SE','C','E','SERIE 5','SERIE 8','SERIE 9','SERIE 10'];
const GBS    = ['128 GB','256 GB','512 GB','1024 GB','2048 GB','64 GB','32 GB','16 GB'];
const CORES  = [
  'PRETO','BRANCO','RED','ROSA','VERDE','AZUL','GOLD','GRAFITE','NATURAL','LARANJA',
  'AMARELO','ROXO','SILVER','SPACE GRAY','MIDNIGHT','STARLIGHT','CORAL',
  'DESERT TITANIUM','BLACK TITANIUM','WHITE TITANIUM','JET BLACK','ROSE GOLD',
];

interface Props {
  open: boolean;
  onClose: () => void;
  produtos: Produto[];
  /** source indica se o produto veio do estoque existente ou foi recém-criado via Fornecedor */
  onSelect: (produto: Produto, source: 'estoque' | 'fornecedor') => void;
  onFornecedorCriado: () => void | Promise<void>;
}

type Aba = 'estoque' | 'fornecedor';

export default function VendaRapidaModal({ open, onClose, produtos, onSelect, onFornecedorCriado }: Props) {
  const [aba, setAba] = useState<Aba>('estoque');
  const [busca, setBusca] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Formulário fornecedor
  const [fModelo, setFModelo] = useState('IPHONE 16');
  const [fLinha, setFLinha]   = useState('NORMAL');
  const [fGb, setFGb]         = useState('128 GB');
  const [fCor, setFCor]       = useState('PRETO');
  const [fEstado, setFEstado] = useState<'NOVO' | 'SEMINOVO'>('SEMINOVO');
  const [fBateria, setFBateria] = useState('100');
  const [fImei, setFImei]     = useState('');
  const [fValorCompra, setFValorCompra] = useState(0);
  const [fValorCompraTxt, setFValorCompraTxt] = useState('');
  const [fFornecedorId, setFFornecedorId] = useState<number | ''>('');
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (open) {
      setBusca('');
      setAba('estoque');
      setErro('');
      setTimeout(() => inputRef.current?.focus(), 50);
      getFornecedores().then(setFornecedores);
    }
  }, [open]);

  // Fecha no ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Filtro com ranking: match por código exato > começa com busca > contém
  const resultados = useMemo(() => {
    const emEstoque = produtos.filter(p => p.status === 'EM_ESTOQUE');
    if (!busca.trim()) return emEstoque.slice(0, 50);
    const q = busca.toLowerCase().trim();
    const scored = emEstoque.map(p => {
      const haystack = [String(p.codigo), p.modelo, p.linha, p.cor, p.gb, p.imei]
        .filter(Boolean).map(x => x.toLowerCase()).join(' ');
      let score = 0;
      if (String(p.codigo) === q) score = 1000;
      else if (String(p.codigo).startsWith(q)) score = 800;
      else if (p.modelo.toLowerCase().startsWith(q)) score = 600;
      else if (haystack.includes(q)) score = 300;
      return { p, score };
    }).filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map(r => r.p);
    return scored;
  }, [produtos, busca]);

  if (!open) return null;

  const handleSelectEstoque = (p: Produto) => {
    onSelect(p, 'estoque');
  };

  const handleCriarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!fValorCompra || fValorCompra <= 0) {
      setErro('Informe o valor de compra do fornecedor.');
      return;
    }
    setSalvando(true);
    try {
      const cod = await getNextCodigo();
      const novo = await addProduto({
        dataEntrada: new Date().toISOString().split('T')[0],
        codigo: cod,
        modelo: fModelo,
        linha: fLinha,
        imei: fImei,
        possuiNota: 'NÃO',
        gb: fGb,
        compTrocado: 'NÃO',
        cor: fCor,
        estado: fEstado,
        bateria: fBateria,
        valorCompra: fValorCompra,
        status: 'EM_ESTOQUE',
        fotos: [],
        fornecedorId: fFornecedorId ? Number(fFornecedorId) : undefined,
      });
      await onFornecedorCriado();
      onSelect(novo, 'fornecedor');
      // Reset
      setFImei(''); setFValorCompra(0); setFValorCompraTxt(''); setFFornecedorId('');
    } catch {
      setErro('Erro ao cadastrar produto do fornecedor.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ background: 'linear-gradient(135deg, #3B3B4F 0%, #1a2a40 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#8ab4d8' }}>
                Nova operação
              </p>
              <h2 className="text-xl font-extrabold tracking-tight text-white mt-0.5">
                Realizar Venda
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <button
              onClick={() => setAba('estoque')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                aba === 'estoque' ? 'text-white shadow-lg' : 'text-white/50 hover:text-white/80'
              }`}
              style={aba === 'estoque' ? { background: '#2E78B7' } : {}}
            >
              📦 Do Estoque
            </button>
            <button
              onClick={() => setAba('fornecedor')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                aba === 'fornecedor' ? 'text-white shadow-lg' : 'text-white/50 hover:text-white/80'
              }`}
              style={aba === 'fornecedor' ? { background: '#5AAA4A' } : {}}
            >
              🚚 Do Fornecedor
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto">
          {aba === 'estoque' ? (
            <div className="p-5">
              {/* Busca */}
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Código ou modelo (ex: 10023 ou iphone 16)"
                  className="w-full pl-11 pr-4 py-3 text-base rounded-xl border-2 bg-gray-50 focus:bg-white focus:outline-none transition-all"
                  style={{
                    borderColor: busca ? '#2E78B7' : '#e5e7eb',
                  }}
                  autoComplete="off"
                />
              </div>

              {/* Contador */}
              <p className="text-xs text-gray-400 mb-2 px-1">
                {resultados.length} produto(s) {busca ? 'encontrado(s)' : 'em estoque'}
              </p>

              {/* Lista */}
              {resultados.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="text-gray-400 text-sm">Nenhum produto encontrado</p>
                  <p className="text-gray-300 text-xs mt-1">Tente outro código ou modelo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {resultados.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectEstoque(p)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 transition-all text-left group"
                    >
                      {/* Foto */}
                      <div className="w-11 h-11 rounded-lg bg-white flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                        {p.fotos && p.fotos.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.fotos[0]} alt={p.modelo} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg text-gray-300">📱</span>
                        )}
                      </div>
                      {/* Info: linha 1 = modelo (inteiro), linha 2 = cod · gb · cor */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm leading-tight truncate">
                          {p.modelo} <span className="text-gray-400 font-normal">{p.linha}</span>
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5 leading-tight">
                          <span className="font-mono font-semibold" style={{ color: '#2E78B7' }}>#{p.codigo}</span>
                          <span className="text-gray-300 mx-1">·</span>
                          <span className="font-medium">{p.gb}</span>
                          <span className="text-gray-300 mx-1">·</span>
                          <span>{p.cor}</span>
                        </p>
                      </div>
                      {/* Arrow */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 group-hover:stroke-blue-500 group-hover:translate-x-0.5 transition-all">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // ──────────── ABA FORNECEDOR ────────────
            <form onSubmit={handleCriarFornecedor} className="p-5 space-y-4">
              <div className="rounded-xl p-3 text-xs" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                <p className="font-semibold mb-1">🚚 Venda com fornecedor</p>
                <p>Cadastre rapidamente o produto que está sendo vendido — ele entra no estoque e você segue direto para a venda.</p>
              </div>

              {erro && (
                <div className="rounded-xl px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200">
                  {erro}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Modelo</label>
                  <select className="input" value={fModelo} onChange={e => setFModelo(e.target.value)}>
                    {MODELOS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Linha</label>
                  <select className="input" value={fLinha} onChange={e => setFLinha(e.target.value)}>
                    {LINHAS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">GB</label>
                  <select className="input" value={fGb} onChange={e => setFGb(e.target.value)}>
                    {GBS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cor</label>
                  <select className="input" value={fCor} onChange={e => setFCor(e.target.value)}>
                    {CORES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={fEstado} onChange={e => setFEstado(e.target.value as 'NOVO' | 'SEMINOVO')}>
                    <option>SEMINOVO</option>
                    <option>NOVO</option>
                  </select>
                </div>
                <div>
                  <label className="label">Bateria (%)</label>
                  <input className="input" value={fBateria} onChange={e => setFBateria(e.target.value)} placeholder="100" />
                </div>
                <div className="col-span-2">
                  <label className="label">IMEI (opcional)</label>
                  <input className="input" value={fImei} onChange={e => setFImei(e.target.value)} placeholder="00 000000 000000 0" />
                </div>
                <div className="col-span-2">
                  <label className="label">Valor de compra do fornecedor *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input !text-lg !font-bold"
                    value={fValorCompraTxt}
                    onChange={e => {
                      const txt = mascaraMoedaDigitada(e.target.value);
                      setFValorCompraTxt(txt);
                      setFValorCompra(parseCentavos(txt));
                    }}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Fornecedor <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
                  <select
                    className="input"
                    value={fFornecedorId}
                    onChange={e => setFFornecedorId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">— Nenhum —</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                  {fornecedores.length === 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Cadastre fornecedores em Fornecedores no menu
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #5AAA4A, #3d7a35)',
                  boxShadow: '0 8px 20px rgba(90,170,74,0.35)',
                }}
              >
                {salvando ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    Cadastrar e Vender
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
