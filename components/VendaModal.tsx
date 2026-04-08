'use client';
import { useState, useEffect } from 'react';
import { Produto, FormaPagamento } from '@/types';

const FORMAS: { id: FormaPagamento; label: string; icon: string }[] = [
  { id: 'DINHEIRO',          label: 'Dinheiro',          icon: '💵' },
  { id: 'PIX',               label: 'Pix',               icon: '📱' },
  { id: 'DEBITO',            label: 'Débito',            icon: '💳' },
  { id: 'CREDITO',           label: 'Crédito',           icon: '💰' },
  { id: 'PRODUTO_RECEBIDO',  label: 'Produto Recebido',  icon: '📦' },
];

const PARCELAS = Array.from({ length: 18 }, (_, i) => {
  const n = i + 1;
  return { n, pct: parseFloat((n + 2.99).toFixed(2)) };
});

const MODELOS = [
  'IPHONE 6','IPHONE 7','IPHONE 8','IPHONE X','IPHONE XR','IPHONE XS','IPHONE XS MAX',
  'IPHONE 11','IPHONE 12','IPHONE 13','IPHONE 14','IPHONE 15','IPHONE 16','IPHONE 17',
  'IPHONE SE','IPAD 9','IPAD 10','MAGIC MOUSE','MAGIC KEYBOARD','SMARTWATCH',
];
const LINHAS = ['NORMAL','PRO','PRO MAX','PLUS','AIR','MINI','XR','SE','C','E','SERIE 5','SERIE 8','SERIE 9','SERIE 10'];
const GBS    = ['','16 GB','32 GB','64 GB','128 GB','256 GB','512 GB','1024 GB','2048 GB'];
const COMP   = ['NÃO','BATERIA','CARCAÇA','TELA','BATERIA E CARCAÇA'];
const CORES  = [
  'PRETO','BRANCO','RED','ROSA','VERDE','AZUL','GOLD','GRAFITE','NATURAL','LARANJA',
  'AMARELO','ROXO','SILVER','SPACE GRAY','MIDNIGHT','STARLIGHT','CORAL',
  'DESERT TITANIUM','BLACK TITANIUM','WHITE TITANIUM','JET BLACK','ROSE GOLD',
];

export interface ProdutoRecebidoData {
  dataEntrada: string; modelo: string; linha: string; imei: string;
  possuiNota: 'SIM' | 'NÃO'; gb: string; compTrocado: string;
  cor: string; estado: 'NOVO' | 'SEMINOVO'; bateria: string; valorCompra: number;
}

const emptyRecebido = (): ProdutoRecebidoData => ({
  dataEntrada: new Date().toISOString().split('T')[0],
  modelo: 'IPHONE 16', linha: 'NORMAL', imei: '', possuiNota: 'NÃO',
  gb: '128 GB', compTrocado: 'NÃO', cor: 'PRETO', estado: 'SEMINOVO',
  bateria: '100', valorCompra: 0,
});

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Produto>, produtoRecebido?: ProdutoRecebidoData) => void;
  produto: Produto | null;
}

type Valores = Partial<Record<FormaPagamento, number>>;

export default function VendaModal({ open, onClose, onSave, produto }: Props) {
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0]);
  const [valorVenda, setValorVenda] = useState(0);
  const [custos, setCustos]   = useState(0);
  const [cliente, setCliente] = useState('');
  const [contato, setContato] = useState('');
  const [formas, setFormas]   = useState<FormaPagamento[]>([]);
  const [parcelas, setParcelas] = useState(1);
  const [valores, setValores]   = useState<Valores>({});
  const [recebido, setRecebido] = useState<ProdutoRecebidoData>(emptyRecebido());

  useEffect(() => {
    if (!open || !produto) return;
    setDataVenda(produto.dataVenda || new Date().toISOString().split('T')[0]);
    setValorVenda(produto.valorVenda ?? 0);
    setCustos(produto.custos ?? 0);
    setCliente(produto.cliente ?? '');
    setContato(produto.contato ?? '');
    setFormas(produto.formasPagamento ?? []);
    setParcelas(produto.parcelasCredito ?? 1);
    setValores({});
    setRecebido(emptyRecebido());
  }, [produto, open]);

  // Sincroniza o valor do Produto Recebido com o valorCompra estimado
  useEffect(() => {
    if (formas.includes('PRODUTO_RECEBIDO')) {
      setValores(prev => ({ ...prev, PRODUTO_RECEBIDO: recebido.valorCompra }));
    }
  }, [recebido.valorCompra, formas]);

  if (!open || !produto) return null;

  // ── Cálculos ────────────────────────────────────────────────────
  const valorProdutoRecebido = formas.includes('PRODUTO_RECEBIDO') ? (recebido.valorCompra || 0) : 0;

  // Acréscimo calculado sobre o valor de CADA método com taxa
  const acrescimoDebito  = (valores.DEBITO  || 0) * 0.0299;
  const acrescimoCredito = (valores.CREDITO || 0) * (parcelas + 2.99) / 100;
  const totalAcrescimo   = parseFloat((acrescimoDebito + acrescimoCredito).toFixed(2));

  // Soma de valores informados (exceto Produto Recebido, que é automático)
  const totalInformado = FORMAS.reduce((sum, f) => {
    if (f.id === 'PRODUTO_RECEBIDO') return sum;
    return sum + (formas.includes(f.id) ? (valores[f.id] || 0) : 0);
  }, 0);

  const totalComRecebido = totalInformado + valorProdutoRecebido;
  const saldo = parseFloat((valorVenda - totalComRecebido).toFixed(2)); // deve ser 0

  // Lucro: exclui o valor do produto recebido (ele vai pro estoque, não é dinheiro)
  const lucro = parseFloat((totalInformado - produto.valorCompra - custos - totalAcrescimo).toFixed(2));

  // ── Handlers ────────────────────────────────────────────────────
  const toggleForma = (f: FormaPagamento) => {
    if (formas.includes(f)) {
      setFormas(prev => prev.filter(x => x !== f));
      setValores(prev => { const n = { ...prev }; delete n[f]; return n; });
    } else {
      setFormas(prev => [...prev, f]);
      if (f !== 'PRODUTO_RECEBIDO') {
        // Pré-preenche com o saldo restante
        const jaAlocado = Object.entries(valores).reduce((s, [k, v]) =>
          k !== 'PRODUTO_RECEBIDO' ? s + (v || 0) : s, 0);
        const restante = Math.max(0, parseFloat((valorVenda - valorProdutoRecebido - jaAlocado).toFixed(2)));
        setValores(prev => ({ ...prev, [f]: restante }));
      }
    }
  };

  const setValor = (f: FormaPagamento, v: number) => {
    setValores(prev => {
      const novo = { ...prev, [f]: v };
      // Auto-ajusta a última forma cash para o saldo restante
      const cash = formas.filter(x => x !== 'PRODUTO_RECEBIDO');
      if (cash.length >= 2 && f !== cash[cash.length - 1]) {
        const ultima = cash[cash.length - 1];
        const somaOutras = cash.filter(x => x !== ultima).reduce((s, x) => s + (novo[x] || 0), 0);
        novo[ultima] = Math.max(0, parseFloat((valorVenda - valorProdutoRecebido - somaOutras).toFixed(2)));
      }
      return novo;
    });
  };

  const setR = (field: keyof ProdutoRecebidoData, v: string | number) =>
    setRecebido(prev => ({ ...prev, [field]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formas.length === 0) { alert('Selecione ao menos uma forma de pagamento.'); return; }
    if (Math.abs(saldo) > 0.05) {
      alert(`O total das formas de pagamento (${fmt(totalComRecebido)}) deve ser igual ao valor de venda (${fmt(valorVenda)}).`);
      return;
    }
    onSave(
      { status: 'VENDIDO', dataVenda, valorVenda, custos, cliente, contato, lucro,
        formasPagamento: formas, parcelasCredito: formas.includes('CREDITO') ? parcelas : undefined,
        acrescimo: totalAcrescimo },
      formas.includes('PRODUTO_RECEBIDO') ? recebido : undefined,
    );
    onClose();
  };

  const usaProdutoRecebido = formas.includes('PRODUTO_RECEBIDO');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 z-10">
          <h2 className="text-xl font-bold text-gray-800">Registrar Venda</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {produto.modelo} {produto.linha} — {produto.gb} — {produto.cor}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

          {/* Data e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data da Venda</label>
              <input type="date" className="input" value={dataVenda}
                onChange={e => setDataVenda(e.target.value)} required />
            </div>
            <div>
              <label className="label">Valor de Venda (R$)</label>
              <input type="number" className="input" value={valorVenda} min={0} step="0.01"
                onChange={e => {
                  const novo = parseFloat(e.target.value) || 0;
                  setValorVenda(novo);
                  // Recalcula a última forma cash
                  const cash = formas.filter(x => x !== 'PRODUTO_RECEBIDO');
                  if (cash.length >= 2) {
                    const ultima = cash[cash.length - 1];
                    const somaOutras = cash.filter(x => x !== ultima).reduce((s, x) => s + (valores[x] || 0), 0);
                    const restante = Math.max(0, parseFloat((novo - valorProdutoRecebido - somaOutras).toFixed(2)));
                    setValores(prev => ({ ...prev, [ultima]: restante }));
                  }
                }} required />
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <label className="label">Formas de Pagamento</label>
            <div className="flex flex-col gap-2 mt-1">
              {FORMAS.map(f => {
                const sel = formas.includes(f.id);
                const isProdRecebido = f.id === 'PRODUTO_RECEBIDO';
                const val = isProdRecebido ? valorProdutoRecebido : (valores[f.id] || 0);

                // Acréscimo desta forma
                let acrescimoForma = 0;
                let pctLabel = '';
                if (f.id === 'DEBITO' && sel) {
                  acrescimoForma = val * 0.0299;
                  pctLabel = '2,99%';
                }
                if (f.id === 'CREDITO' && sel) {
                  acrescimoForma = val * (parcelas + 2.99) / 100;
                  pctLabel = `${(parcelas + 2.99).toFixed(2)}%`;
                }

                return (
                  <div key={f.id}
                    className={`rounded-xl border-2 transition-colors ${sel ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>

                    {/* Linha do checkbox */}
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                      <input type="checkbox" checked={sel} onChange={() => toggleForma(f.id)}
                        className="w-4 h-4 accent-blue-600" />
                      <span className="text-lg">{f.icon}</span>
                      <span className={`font-medium text-sm flex-1 ${sel ? 'text-blue-700' : 'text-gray-700'}`}>
                        {f.label}
                        {pctLabel && <span className="ml-1 text-xs text-orange-500 font-normal">(+{pctLabel})</span>}
                      </span>
                      {/* Seletor de parcelas do crédito */}
                      {f.id === 'CREDITO' && sel && (
                        <select
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
                          value={parcelas}
                          onChange={e => setParcelas(Number(e.target.value))}
                          onClick={e => e.stopPropagation()}
                        >
                          {PARCELAS.map(p => (
                            <option key={p.n} value={p.n}>{p.n}x — {p.pct.toFixed(2)}%</option>
                          ))}
                        </select>
                      )}
                    </label>

                    {/* Linha de valor (só quando selecionado) */}
                    {sel && (
                      <div className="px-4 pb-3 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">Valor nesta forma</label>
                          {isProdRecebido ? (
                            // Produto recebido: valor vem do formulário abaixo, read-only aqui
                            <div className="input bg-gray-100 text-gray-600 font-semibold cursor-not-allowed">
                              {fmt(valorProdutoRecebido)}
                              <span className="text-xs text-gray-400 ml-2">(valor estimado do produto)</span>
                            </div>
                          ) : (
                            <input
                              type="number" min={0} step="0.01"
                              className="input"
                              value={val}
                              onChange={e => setValor(f.id, parseFloat(e.target.value) || 0)}
                            />
                          )}
                        </div>
                        {/* Acréscimo da forma */}
                        {acrescimoForma > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Acréscimo</p>
                            <p className="text-sm font-semibold text-orange-600">+{fmt(acrescimoForma)}</p>
                          </div>
                        )}
                        {/* Indicador de sem acréscimo */}
                        {acrescimoForma === 0 && !isProdRecebido && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Acréscimo</p>
                            <p className="text-sm font-semibold text-green-600">sem taxa</p>
                          </div>
                        )}
                        {isProdRecebido && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Dedução</p>
                            <p className="text-sm font-semibold text-purple-600">-{fmt(valorProdutoRecebido)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Indicador de saldo */}
            {formas.length > 0 && (
              <div className={`mt-2 px-4 py-2 rounded-lg text-sm font-semibold flex justify-between ${
                Math.abs(saldo) <= 0.05
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                <span>
                  {Math.abs(saldo) <= 0.05
                    ? '✓ Total confere com o valor de venda'
                    : saldo > 0
                      ? `Faltam ${fmt(saldo)} para completar o pagamento`
                      : `Excedeu ${fmt(Math.abs(saldo))} o valor de venda`}
                </span>
                <span>{fmt(totalComRecebido)} / {fmt(valorVenda)}</span>
              </div>
            )}
          </div>

          {/* ── Formulário Produto Recebido ── */}
          {usaProdutoRecebido && (
            <div className="border-2 border-blue-200 rounded-2xl p-4 bg-blue-50 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="font-bold text-blue-800">Produto Recebido → Estoque</h3>
              </div>
              <p className="text-xs text-blue-600 -mt-2">
                Preencha os dados do produto recebido. Ele será cadastrado no estoque automaticamente.
                O valor estimado será deduzido do lucro desta venda.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data de Entrada</label>
                  <input type="date" className="input" value={recebido.dataEntrada}
                    onChange={e => setR('dataEntrada', e.target.value)} />
                </div>
                <div>
                  <label className="label">Valor Estimado (R$)</label>
                  <input type="number" className="input" value={recebido.valorCompra} min={0} step="0.01"
                    onChange={e => setR('valorCompra', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="label">Modelo</label>
                  <select className="input" value={recebido.modelo} onChange={e => setR('modelo', e.target.value)}>
                    {MODELOS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Linha</label>
                  <select className="input" value={recebido.linha} onChange={e => setR('linha', e.target.value)}>
                    {LINHAS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">IMEI / Nº de Série</label>
                  <input type="text" className="input" value={recebido.imei}
                    onChange={e => setR('imei', e.target.value)} placeholder="00 000000 000000 0" />
                </div>
                <div>
                  <label className="label">GB</label>
                  <select className="input" value={recebido.gb} onChange={e => setR('gb', e.target.value)}>
                    {GBS.map(g => <option key={g} value={g}>{g || '— (N/A)'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cor</label>
                  <select className="input" value={recebido.cor} onChange={e => setR('cor', e.target.value)}>
                    {CORES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={recebido.estado}
                    onChange={e => setR('estado', e.target.value as 'NOVO' | 'SEMINOVO')}>
                    <option>SEMINOVO</option><option>NOVO</option>
                  </select>
                </div>
                <div>
                  <label className="label">Bateria (%)</label>
                  <input type="text" className="input" value={recebido.bateria}
                    onChange={e => setR('bateria', e.target.value)} placeholder="100 ou VERIFICAR" />
                </div>
                <div>
                  <label className="label">Comp. Trocado</label>
                  <select className="input" value={recebido.compTrocado}
                    onChange={e => setR('compTrocado', e.target.value)}>
                    {COMP.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Possui Nota?</label>
                  <select className="input" value={recebido.possuiNota}
                    onChange={e => setR('possuiNota', e.target.value as 'SIM' | 'NÃO')}>
                    <option>NÃO</option><option>SIM</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome do Cliente</label>
              <input type="text" className="input" value={cliente}
                onChange={e => setCliente(e.target.value)} placeholder="Nome" />
            </div>
            <div>
              <label className="label">Contato (WhatsApp)</label>
              <input type="text" className="input" value={contato}
                onChange={e => setContato(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          {/* Custos extras */}
          <div>
            <label className="label">Custos Extras (R$)</label>
            <input type="number" className="input" value={custos} min={0} step="0.01"
              onChange={e => setCustos(parseFloat(e.target.value) || 0)} />
          </div>

          {/* Resumo financeiro */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1.5">
            <p className="font-semibold text-gray-700 mb-2">Resumo Financeiro</p>

            {/* Entradas por forma */}
            {FORMAS.filter(f => formas.includes(f.id)).map(f => {
              const v = f.id === 'PRODUTO_RECEBIDO' ? valorProdutoRecebido : (valores[f.id] || 0);
              let acr = 0;
              if (f.id === 'DEBITO') acr = v * 0.0299;
              if (f.id === 'CREDITO') acr = v * (parcelas + 2.99) / 100;
              return (
                <div key={f.id} className="flex justify-between text-gray-600">
                  <span>{f.icon} {f.label}{acr > 0 ? ` (−${fmt(acr)} taxa)` : ''}</span>
                  <span className={f.id === 'PRODUTO_RECEBIDO' ? 'text-purple-600' : ''}>
                    {f.id === 'PRODUTO_RECEBIDO' ? `−${fmt(v)}` : fmt(v)}
                  </span>
                </div>
              );
            })}

            <div className="border-t border-gray-200 pt-2 space-y-1">
              <div className="flex justify-between text-red-500">
                <span>(-) Custo de compra</span>
                <span>-{fmt(produto.valorCompra)}</span>
              </div>
              {custos > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>(-) Custos extras</span>
                  <span>-{fmt(custos)}</span>
                </div>
              )}
              {totalAcrescimo > 0 && (
                <div className="flex justify-between text-orange-500">
                  <span>(-) Taxa da maquineta</span>
                  <span>-{fmt(totalAcrescimo)}</span>
                </div>
              )}
              {valorProdutoRecebido > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>(-) Valor produto recebido</span>
                  <span>-{fmt(valorProdutoRecebido)}</span>
                </div>
              )}
            </div>

            <div className={`flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2 ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Lucro Líquido</span>
              <span>{fmt(lucro)}</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700">
              Confirmar Venda{usaProdutoRecebido ? ' + Entrada' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
