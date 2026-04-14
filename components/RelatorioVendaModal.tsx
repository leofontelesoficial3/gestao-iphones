'use client';
import { useState } from 'react';
import { Produto, FormaPagamento } from '@/types';
import { mascaraCelular } from '@/lib/format';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const FORMA_LABEL: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  PRODUTO_RECEBIDO: 'Produto Recebido',
};

const WHATSAPP_DESTINO = '5585991249124';

interface Endereco {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  numero: string;
  complemento: string;
}

const emptyEndereco = (): Endereco => ({
  cep: '', logradouro: '', bairro: '', cidade: '', uf: '',
  numero: '', complemento: '',
});

interface Props {
  open: boolean;
  onClose: () => void;
  produto: Produto | null;
}

export default function RelatorioVendaModal({ open, onClose, produto }: Props) {
  const [endereco, setEndereco] = useState<Endereco>(emptyEndereco());
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState('');

  if (!open || !produto) return null;

  const setE = (field: keyof Endereco, v: string) =>
    setEndereco(prev => ({ ...prev, [field]: v }));

  // ── Busca CEP via ViaCEP ──
  const buscarCep = async (cepRaw: string) => {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setBuscandoCep(true);
    setErroCep('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErroCep('CEP não encontrado');
      } else {
        setEndereco(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
        }));
      }
    } catch {
      setErroCep('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  };

  const mascaraCep = (v: string) => {
    const nums = v.replace(/\D/g, '').slice(0, 8);
    if (nums.length > 5) return `${nums.slice(0, 5)}-${nums.slice(5)}`;
    return nums;
  };

  // ── Monta texto do relatório ──
  const montarTexto = (): string => {
    const dataVenda = produto.dataVenda
      ? new Date(produto.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')
      : '—';

    const formas = (produto.formasPagamento ?? [])
      .map(f => {
        let label = FORMA_LABEL[f] || f;
        if (f === 'CREDITO' && produto.parcelasCredito) {
          label += ` ${produto.parcelasCredito}x`;
        }
        return label;
      })
      .join(', ');

    const enderecoTxt = endereco.logradouro
      ? `${endereco.logradouro}${endereco.numero ? `, ${endereco.numero}` : ''}${endereco.complemento ? ` - ${endereco.complemento}` : ''}\n${endereco.bairro} - ${endereco.cidade}/${endereco.uf}\nCEP: ${endereco.cep}`
      : 'Não informado';

    const entregaTxt = dataEntrega
      ? `${new Date(dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')}${horaEntrega ? ` às ${horaEntrega}` : ''}`
      : 'Não informada';

    return [
      `📋 *RELATÓRIO DE VENDA*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `📱 *Produto*`,
      `${produto.modelo} ${produto.linha}`,
      `${produto.gb} · ${produto.cor} · ${produto.estado}`,
      `Código: #${produto.codigo}`,
      ``,
      `👤 *Cliente*`,
      `Nome: ${produto.cliente || 'Não informado'}`,
      `Contato: ${produto.contato || 'Não informado'}`,
      ``,
      `📍 *Endereço de Entrega*`,
      enderecoTxt,
      ``,
      `📅 *Entrega*`,
      entregaTxt,
      ``,
      `💰 *Pagamento*`,
      `Valor: ${produto.valorVenda ? fmt(produto.valorVenda) : '—'}`,
      `Forma: ${formas || '—'}`,
      `Data da Venda: ${dataVenda}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `🏪 *iPhones Fortaleza*`,
    ].join('\n');
  };

  const enviarWhatsApp = () => {
    const texto = montarTexto();
    const url = `https://wa.me/${WHATSAPP_DESTINO}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handleClose = () => {
    setEndereco(emptyEndereco());
    setDataEntrega('');
    setHoraEntrega('');
    setErroCep('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 z-10">
          <h2 className="text-xl font-bold text-gray-800">📋 Relatório de Venda</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {produto.modelo} {produto.linha} — {produto.gb} — {produto.cor}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Resumo do produto */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Produto</p>
            <p className="text-gray-600">{produto.modelo} {produto.linha} · {produto.gb} · {produto.cor} · {produto.estado}</p>
            <p className="text-gray-400 text-xs">Código #{produto.codigo}</p>
          </div>

          {/* Cliente */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Cliente</p>
            <p className="text-gray-600">{produto.cliente || 'Não informado'}</p>
            <p className="text-gray-500 text-xs">{produto.contato || 'Contato não informado'}</p>
          </div>

          {/* Data e hora da entrega */}
          <div>
            <p className="font-semibold text-gray-700 mb-2 text-sm">Data e Hora da Entrega</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={dataEntrega}
                  onChange={e => setDataEntrega(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Hora</label>
                <input
                  type="time"
                  className="input"
                  value={horaEntrega}
                  onChange={e => setHoraEntrega(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Endereço de entrega */}
          <div>
            <p className="font-semibold text-gray-700 mb-2 text-sm">Endereço de Entrega</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="label">CEP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="00000-000"
                    value={endereco.cep}
                    onChange={e => {
                      const v = mascaraCep(e.target.value);
                      setE('cep', v);
                      if (v.replace(/\D/g, '').length === 8) buscarCep(v);
                    }}
                    maxLength={9}
                  />
                  {buscandoCep && (
                    <div className="flex items-center px-3 text-sm text-blue-500">
                      Buscando...
                    </div>
                  )}
                </div>
                {erroCep && <p className="text-xs text-red-500 mt-1">{erroCep}</p>}
              </div>

              <div>
                <label className="label">Rua / Logradouro</label>
                <input
                  type="text"
                  className="input"
                  value={endereco.logradouro}
                  onChange={e => setE('logradouro', e.target.value)}
                  placeholder="Preenchido pelo CEP"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Número</label>
                  <input
                    type="text"
                    className="input"
                    value={endereco.numero}
                    onChange={e => setE('numero', e.target.value)}
                    placeholder="Nº"
                  />
                </div>
                <div>
                  <label className="label">Complemento</label>
                  <input
                    type="text"
                    className="input"
                    value={endereco.complemento}
                    onChange={e => setE('complemento', e.target.value)}
                    placeholder="Apto, bloco..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Bairro</label>
                  <input
                    type="text"
                    className="input"
                    value={endereco.bairro}
                    onChange={e => setE('bairro', e.target.value)}
                    placeholder="Preenchido pelo CEP"
                  />
                </div>
                <div>
                  <label className="label">Cidade / UF</label>
                  <input
                    type="text"
                    className="input"
                    value={endereco.cidade ? `${endereco.cidade}/${endereco.uf}` : ''}
                    onChange={e => {
                      const parts = e.target.value.split('/');
                      setE('cidade', parts[0] || '');
                      if (parts[1]) setE('uf', parts[1]);
                    }}
                    placeholder="Preenchido pelo CEP"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Pagamento</p>
            <p className="text-gray-600">
              {produto.valorVenda ? fmt(produto.valorVenda) : '—'}
              {' — '}
              {(produto.formasPagamento ?? []).map(f => {
                let label = FORMA_LABEL[f] || f;
                if (f === 'CREDITO' && produto.parcelasCredito) label += ` ${produto.parcelasCredito}x`;
                return label;
              }).join(', ') || '—'}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={enviarWhatsApp}
              className="px-5 py-2 rounded-lg text-white font-semibold flex items-center gap-2"
              style={{ background: '#25D366' }}
            >
              <span className="text-lg">📲</span>
              Enviar via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
