'use client';
import { useState, useEffect, useRef } from 'react';
import { Produto, Fornecedor } from '@/types';
import { mascaraMoedaDigitada, parseCentavos } from '@/lib/format';
import { getFornecedores } from '@/lib/storage';

const MODELOS = [
  'IPHONE 6', 'IPHONE 7', 'IPHONE 8', 'IPHONE X', 'IPHONE XR', 'IPHONE XS', 'IPHONE XS MAX',
  'IPHONE 11', 'IPHONE 12', 'IPHONE 13', 'IPHONE 14', 'IPHONE 15', 'IPHONE 16', 'IPHONE 17',
  'IPHONE SE', 'IPAD 9', 'IPAD 10', 'MAGIC MOUSE', 'MAGIC KEYBOARD', 'SMARTWATCH',
];
const LINHAS = ['NORMAL', 'PRO', 'PRO MAX', 'PLUS', 'AIR', 'MINI', 'XR', 'SE', 'C', 'E', 'SERIE 5', 'SERIE 8', 'SERIE 9', 'SERIE 10'];
const GBS = ['', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1024 GB', '2048 GB'];
const COMP_TROCADO = ['NÃO', 'BATERIA', 'CARCAÇA', 'TELA', 'BATERIA E CARCAÇA'];
const CORES = [
  'PRETO', 'BRANCO', 'RED', 'ROSA', 'VERDE', 'AZUL', 'GOLD', 'GRAFITE', 'NATURAL', 'LARANJA',
  'AMARELO', 'ROXO', 'SILVER', 'SPACE GRAY', 'MIDNIGHT', 'STARLIGHT', 'CORAL',
  'DESERT TITANIUM', 'BLACK TITANIUM', 'WHITE TITANIUM', 'JET BLACK', 'ROSE GOLD',
  'ALPINE GREEN', 'SIERRA BLUE', 'DEEP PURPLE', 'PACIFIC BLUE', 'MIDNIGHT GREEN',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (produto: Omit<Produto, 'id'>) => void;
  editProduto?: Produto | null;
  nextCodigo: number;
}

const empty = (): Omit<Produto, 'id'> => ({
  dataEntrada: new Date().toISOString().split('T')[0],
  codigo: 0,
  modelo: 'IPHONE 16',
  linha: 'NORMAL',
  imei: '',
  possuiNota: 'NÃO',
  gb: '128 GB',
  compTrocado: 'NÃO',
  cor: 'PRETO',
  estado: 'SEMINOVO',
  bateria: '100',
  valorCompra: 0,
  status: 'EM_ESTOQUE',
  fotos: [],
});

export default function ProdutoModal({ open, onClose, onSave, editProduto, nextCodigo }: Props) {
  const [form, setForm] = useState<Omit<Produto, 'id'>>(empty());
  const [valorCompraTxt, setValorCompraTxt] = useState('');
  const [precoPublicoTxt, setPrecoPublicoTxt] = useState('');
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) getFornecedores().then(setFornecedores);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editProduto) {
      // Edição: carrega todos os campos do produto
      const { id: _id, ...rest } = editProduto;
      void _id;
      setForm({ ...rest, fotos: rest.fotos ?? [] });
      setValorCompraTxt(
        rest.valorCompra > 0 ? mascaraMoedaDigitada(String(Math.round(rest.valorCompra * 100))) : ''
      );
      setPrecoPublicoTxt(
        rest.precoPublico && rest.precoPublico > 0
          ? mascaraMoedaDigitada(String(Math.round(rest.precoPublico * 100)))
          : ''
      );
    } else {
      // Novo: form vazio com próximo código
      setForm({ ...empty(), codigo: nextCodigo });
      setValorCompraTxt('');
      setPrecoPublicoTxt('');
    }
  }, [editProduto, nextCodigo, open]);

  if (!open) return null;

  const set = (field: keyof Omit<Produto, 'id'>, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleAddFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        set('fotos', [...(form.fotos ?? []), ...data.urls]);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removerFoto = async (idx: number) => {
    const url = (form.fotos ?? [])[idx];
    if (url?.startsWith('http')) {
      try { await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }); } catch {}
    }
    set('fotos', (form.fotos ?? []).filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-800">
              {editProduto ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data de Entrada</label>
              <input type="date" className="input" value={form.dataEntrada}
                onChange={e => set('dataEntrada', e.target.value)} required />
            </div>
            <div>
              <label className="label">Código</label>
              <input type="number" className="input" value={form.codigo}
                onChange={e => set('codigo', Number(e.target.value))} required />
            </div>
            <div>
              <label className="label">Modelo</label>
              <select className="input" value={form.modelo} onChange={e => set('modelo', e.target.value)}>
                {MODELOS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Linha</label>
              <select className="input" value={form.linha} onChange={e => set('linha', e.target.value)}>
                {LINHAS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">IMEI / Número de Série</label>
              <input type="text" className="input" value={form.imei}
                onChange={e => set('imei', e.target.value)} placeholder="00 000000 000000 0" />
            </div>
            <div>
              <label className="label">GB</label>
              <select className="input" value={form.gb} onChange={e => set('gb', e.target.value)}>
                {GBS.map(g => <option key={g} value={g}>{g || '— (N/A)'}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Componente Trocado</label>
              <select className="input" value={form.compTrocado} onChange={e => set('compTrocado', e.target.value)}>
                {COMP_TROCADO.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cor</label>
              <select className="input" value={form.cor} onChange={e => set('cor', e.target.value)}>
                {CORES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.estado} onChange={e => set('estado', e.target.value as 'NOVO' | 'SEMINOVO')}>
                <option>SEMINOVO</option>
                <option>NOVO</option>
              </select>
            </div>
            <div>
              <label className="label">Possui Nota Fiscal?</label>
              <select className="input" value={form.possuiNota} onChange={e => set('possuiNota', e.target.value as 'SIM' | 'NÃO')}>
                <option>NÃO</option>
                <option>SIM</option>
              </select>
            </div>
            <div>
              <label className="label">Bateria (%)</label>
              <input type="text" className="input" value={form.bateria}
                onChange={e => set('bateria', e.target.value)} placeholder="100 ou VERIFICAR" />
            </div>
            <div>
              <label className="label">Valor de Compra</label>
              <input
                type="text"
                inputMode="numeric"
                className="input !font-semibold"
                value={valorCompraTxt}
                placeholder="R$ 0,00"
                onChange={e => {
                  const txt = mascaraMoedaDigitada(e.target.value);
                  setValorCompraTxt(txt);
                  set('valorCompra', parseCentavos(txt));
                }}
                required
              />
            </div>
            <div>
              <label className="label">
                Preço na Loja Pública
                <span className="text-gray-400 text-xs font-normal ml-1">(opcional)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="input !font-semibold"
                value={precoPublicoTxt}
                placeholder="R$ 0,00"
                onChange={e => {
                  const txt = mascaraMoedaDigitada(e.target.value);
                  setPrecoPublicoTxt(txt);
                  const valor = parseCentavos(txt);
                  set('precoPublico', valor > 0 ? valor : undefined);
                }}
              />
              <p className="text-[10px] text-gray-400 mt-1">Sem preço, o produto não aparece no catálogo público.</p>
            </div>
            <div className="col-span-2">
              <label className="label">Fornecedor <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
              <select
                className="input"
                value={form.fornecedorId ?? ''}
                onChange={e => set('fornecedorId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">— Sem fornecedor —</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Descrição <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
              <textarea
                className="input"
                rows={3}
                value={form.descricao ?? ''}
                onChange={e => set('descricao', e.target.value)}
                placeholder="Observações sobre o aparelho (ex: acompanha carregador, caixa, fone...)"
              />
            </div>

            {/* Seção de Fotos */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Fotos do Produto</label>
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={uploading}
                  className={`text-sm font-medium ${uploading ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {uploading ? 'Enviando...' : '+ Adicionar fotos'}
                </button>
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddFotos}
                />
              </div>

              {(form.fotos ?? []).length === 0 ? (
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => inputFotoRef.current?.click()}
                >
                  <span className="text-3xl">📷</span>
                  <p className="text-sm text-gray-400 mt-1">Clique para adicionar fotos</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {(form.fotos ?? []).map((src, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setFotoAmpliada(src)}
                      />
                      <button
                        type="button"
                        onClick={() => removerFoto(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => inputFotoRef.current?.click()}
                  >
                    <span className="text-2xl text-gray-300">+</span>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-2 flex gap-3 mt-2 justify-end">
              <button type="button" onClick={onClose}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
                {editProduto ? 'Salvar Alterações' : 'Adicionar Produto'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <img src={fotoAmpliada} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setFotoAmpliada(null)}>✕</button>
        </div>
      )}
    </>
  );
}
