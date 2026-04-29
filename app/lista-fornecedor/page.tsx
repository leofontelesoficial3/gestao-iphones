'use client';
import { useEffect, useState, useCallback } from 'react';
import { ItemListaFornecedor, TipoLucro } from '@/types';
import { getListaFornecedor, addItemListaFornecedor, updateItemListaFornecedor, deleteItemListaFornecedor } from '@/lib/storage';
import { useAuth } from '@/components/AuthProvider';
import { corSuave } from '@/lib/cores';
import { mascaraMoedaDigitada, parseCentavos } from '@/lib/format';

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const APARELHOS = ['IPHONE 11','IPHONE 12','IPHONE 13','IPHONE 14','IPHONE 15','IPHONE 16','IPHONE 17','IPHONE SE'];
const LINHAS = ['NORMAL','PLUS','PRO','PRO MAX','AIR','MINI'];
const CAPACIDADES = ['64 GB','128 GB','256 GB','512 GB','1 TB','2 TB'];
const CORES = ['BRANCO','PRETO','AZUL','VERDE','ROSA','CINZA','GOLD','ROSE','ROXO','NATURAL','DESERT'];
const BATERIAS_SUGERIDAS = ['80%','85%','90%','95%','100%'];

interface FormState {
  aparelho: string;
  linha: string;
  capacidade: string;
  cores: string[];
  baterias: string[];
  valorFornecedor: number;
  tipoLucro: TipoLucro;
  margemLucro: number;
  observacao: string;
}

const empty = (): FormState => ({
  aparelho: 'IPHONE 16',
  linha: 'NORMAL',
  capacidade: '128 GB',
  cores: [],
  baterias: [],
  valorFornecedor: 0,
  tipoLucro: 'percentual',
  margemLucro: 15,
  observacao: '',
});

function calcularLucro(valorFornecedor: number, tipoLucro: TipoLucro, margemLucro: number) {
  if (tipoLucro === 'fixo') return margemLucro;
  return (valorFornecedor * margemLucro) / 100;
}

export default function ListaFornecedorPage() {
  const { isAdmin } = useAuth();
  const [itens, setItens] = useState<ItemListaFornecedor[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty());
  const [bateriaInput, setBateriaInput] = useState('');
  const [lucroFixoTxt, setLucroFixoTxt] = useState('');
  const [valorFornecedorTxt, setValorFornecedorTxt] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [filtroAparelho, setFiltroAparelho] = useState('');

  const load = useCallback(async () => {
    const lista = await getListaFornecedor();
    setItens(lista);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) return null;

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleCor = (c: string) => {
    const lista = form.cores.includes(c) ? form.cores.filter(x => x !== c) : [...form.cores, c];
    set('cores', lista);
  };

  const toggleBateria = (b: string) => {
    const lista = form.baterias.includes(b) ? form.baterias.filter(x => x !== b) : [...form.baterias, b];
    set('baterias', lista);
  };

  const addBateriaCustom = () => {
    const v = bateriaInput.trim().replace(/\D/g, '');
    if (!v) return;
    const formatted = `${v}%`;
    if (!form.baterias.includes(formatted)) set('baterias', [...form.baterias, formatted]);
    setBateriaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (form.cores.length === 0) { setErro('Selecione ao menos uma cor.'); return; }
    setSalvando(true);
    try {
      const payload = {
        aparelho: form.aparelho,
        linha: form.linha,
        capacidade: form.capacidade,
        cores: form.cores,
        baterias: form.baterias,
        valorFornecedor: form.valorFornecedor,
        tipoLucro: form.tipoLucro,
        margemLucro: form.margemLucro,
        observacao: form.observacao || undefined,
      };
      if (editandoId) {
        await updateItemListaFornecedor(editandoId, payload);
      } else {
        await addItemListaFornecedor(payload);
      }
      await load();
      setForm(empty());
      setValorFornecedorTxt('');
      setLucroFixoTxt('');
      setEditandoId(null);
      setShowForm(false);
    } catch {
      setErro('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const handleEdit = (item: ItemListaFornecedor) => {
    setForm({
      aparelho: item.aparelho,
      linha: item.linha,
      capacidade: item.capacidade,
      cores: [...item.cores],
      baterias: [...item.baterias],
      valorFornecedor: item.valorFornecedor,
      tipoLucro: item.tipoLucro,
      margemLucro: item.margemLucro,
      observacao: item.observacao || '',
    });
    setValorFornecedorTxt(
      item.valorFornecedor > 0 ? mascaraMoedaDigitada(String(Math.round(item.valorFornecedor * 100))) : ''
    );
    setLucroFixoTxt(
      item.tipoLucro === 'fixo' && item.margemLucro > 0
        ? mascaraMoedaDigitada(String(Math.round(item.margemLucro * 100)))
        : ''
    );
    setEditandoId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este item da lista do fornecedor?')) return;
    await deleteItemListaFornecedor(id);
    await load();
  };

  const itensFiltrados = filtroAparelho
    ? itens.filter(i => i.aparelho === filtroAparelho)
    : itens;

  const aparelhosDisponiveis = Array.from(new Set(itens.map(i => i.aparelho)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Lista do Fornecedor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Catálogo de aparelhos disponíveis no fornecedor (segundo estoque) com margem de lucro desejada.
          </p>
        </div>
        <button
          onClick={() => { setEditandoId(null); setForm(empty()); setValorFornecedorTxt(''); setLucroFixoTxt(''); setShowForm(s => !s); }}
          className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
          style={{ background: 'var(--brand-primary)' }}
        >
          {showForm ? '✕ Fechar' : '+ Novo item'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Aparelho</label>
              <select className="input" value={form.aparelho} onChange={e => set('aparelho', e.target.value)}>
                {APARELHOS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Linha</label>
              <select className="input" value={form.linha} onChange={e => set('linha', e.target.value)}>
                {LINHAS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Capacidade</label>
              <select className="input" value={form.capacidade} onChange={e => set('capacidade', e.target.value)}>
                {CAPACIDADES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Cores multi-select */}
          <div>
            <label className="label">Cores disponíveis <span className="text-gray-400 text-xs font-normal">(selecione uma ou mais)</span></label>
            <div className="flex flex-wrap gap-2">
              {CORES.map(c => {
                const sel = form.cores.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCor(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                      sel
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                    style={sel ? {} : { background: corSuave(c) }}
                  >
                    {sel && '✓ '}{c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baterias multi-select */}
          <div>
            <label className="label">% de Bateria <span className="text-gray-400 text-xs font-normal">(selecione ou adicione)</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {BATERIAS_SUGERIDAS.map(b => {
                const sel = form.baterias.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBateria(b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
                      sel ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {sel && '✓ '}🔋 {b}
                  </button>
                );
              })}
              {form.baterias.filter(b => !BATERIAS_SUGERIDAS.includes(b)).map(b => (
                <span
                  key={b}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border-2 border-green-600 flex items-center gap-1"
                >
                  ✓ 🔋 {b}
                  <button type="button" onClick={() => toggleBateria(b)} className="ml-1 text-green-700 hover:text-red-600">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={bateriaInput}
                onChange={e => setBateriaInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBateriaCustom(); } }}
                placeholder="Outra %, ex: 87"
                className="input !w-auto text-sm"
                maxLength={3}
              />
              <button
                type="button"
                onClick={addBateriaCustom}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Adicionar %
              </button>
            </div>
          </div>

          {/* Valor do Fornecedor */}
          <div>
            <label className="label">Valor cobrado pelo Fornecedor (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              className="input !font-bold"
              value={valorFornecedorTxt}
              placeholder="R$ 0,00"
              onChange={e => {
                const txt = mascaraMoedaDigitada(e.target.value);
                setValorFornecedorTxt(txt);
                set('valorFornecedor', parseCentavos(txt));
              }}
            />
            <p className="text-[10px] text-gray-400 mt-1">Base sobre a qual o lucro será calculado.</p>
          </div>

          {/* Tipo de lucro */}
          <div>
            <label className="label">Lucro Desejado</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => set('tipoLucro', 'percentual')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${
                  form.tipoLucro === 'percentual'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                % Percentual
              </button>
              <button
                type="button"
                onClick={() => set('tipoLucro', 'fixo')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${
                  form.tipoLucro === 'fixo'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                R$ Valor fixo
              </button>
            </div>

            {form.tipoLucro === 'percentual' ? (
              <input
                type="number"
                step="0.5"
                className="input !font-bold"
                value={form.margemLucro}
                onChange={e => set('margemLucro', Number(e.target.value))}
                placeholder="15"
              />
            ) : (
              <input
                type="text"
                inputMode="numeric"
                className="input !font-bold"
                value={lucroFixoTxt}
                placeholder="R$ 0,00"
                onChange={e => {
                  const txt = mascaraMoedaDigitada(e.target.value);
                  setLucroFixoTxt(txt);
                  set('margemLucro', parseCentavos(txt));
                }}
              />
            )}

            {/* Resumo do cálculo */}
            {form.valorFornecedor > 0 && form.margemLucro > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Custo fornecedor</span>
                  <span className="font-semibold">{fmtMoeda(form.valorFornecedor)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>
                    + Lucro {form.tipoLucro === 'percentual' ? `(${form.margemLucro}%)` : '(fixo)'}
                  </span>
                  <span className="font-semibold">
                    +{fmtMoeda(calcularLucro(form.valorFornecedor, form.tipoLucro, form.margemLucro))}
                  </span>
                </div>
                <div className="flex justify-between text-gray-800 font-bold pt-1 border-t border-green-300 mt-1">
                  <span>Preço de venda sugerido</span>
                  <span>
                    {fmtMoeda(form.valorFornecedor + calcularLucro(form.valorFornecedor, form.tipoLucro, form.margemLucro))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label">Observação <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
            <input
              type="text"
              className="input"
              value={form.observacao}
              onChange={e => set('observacao', e.target.value)}
              placeholder="Ex: lacrado, anatel, etc."
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditandoId(null); setForm(empty()); setValorFornecedorTxt(''); setLucroFixoTxt(''); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
              style={{ background: 'var(--brand-primary)' }}
            >
              {salvando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Adicionar à Lista'}
            </button>
          </div>
        </form>
      )}

      {/* Filtro */}
      {itens.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFiltroAparelho('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              filtroAparelho === ''
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todos ({itens.length})
          </button>
          {aparelhosDisponiveis.map(a => (
            <button
              key={a}
              onClick={() => setFiltroAparelho(a)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                filtroAparelho === a
                  ? 'bg-gray-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Listagem */}
      {itens.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-lg font-bold text-gray-700">Lista vazia</p>
          <p className="text-sm text-gray-500 mt-1">
            Adicione os aparelhos disponíveis no seu fornecedor para gerenciá-los aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {itensFiltrados.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-gray-800 truncate">
                    {item.aparelho} <span className="font-normal text-gray-500">{item.linha}</span>
                  </p>
                  <p className="text-sm text-gray-500">{item.capacidade}</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary-dark)' }}
                >
                  {item.tipoLucro === 'fixo' ? `+${fmtMoeda(item.margemLucro)}` : `+${item.margemLucro}%`}
                </span>
              </div>

              {/* Valores */}
              {item.valorFornecedor > 0 && (
                <div className="bg-gray-50 rounded-lg p-2.5 text-xs space-y-1">
                  <div className="flex justify-between text-gray-500">
                    <span>Custo fornecedor</span>
                    <span className="font-semibold">{fmtMoeda(item.valorFornecedor)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>+ Lucro</span>
                    <span className="font-semibold">
                      +{fmtMoeda(calcularLucro(item.valorFornecedor, item.tipoLucro, item.margemLucro))}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-800 font-bold pt-1 border-t border-gray-200">
                    <span>Preço sugerido</span>
                    <span>
                      {fmtMoeda(item.valorFornecedor + calcularLucro(item.valorFornecedor, item.tipoLucro, item.margemLucro))}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Cores</p>
                <div className="flex flex-wrap gap-1">
                  {item.cores.map(c => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-gray-200"
                      style={{ background: corSuave(c) }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {item.baterias.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Bateria</p>
                  <div className="flex flex-wrap gap-1">
                    {item.baterias.map(b => (
                      <span key={b} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        🔋 {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.observacao && (
                <p className="text-xs text-gray-500 italic">📝 {item.observacao}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-semibold"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 py-1.5 text-xs bg-red-50 hover:bg-red-100 rounded-lg text-red-600 font-semibold"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
