'use client';
import { useRef } from 'react';
import { Produto, FormaPagamento } from '@/types';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const FORMA_LABEL: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  PRODUTO_RECEBIDO: 'Produto Recebido',
};

interface Props {
  open: boolean;
  onClose: () => void;
  produto: Produto | null;
}

export default function ReciboModal({ open, onClose, produto }: Props) {
  const reciboRef = useRef<HTMLDivElement>(null);

  if (!open || !produto || produto.status !== 'VENDIDO') return null;

  const dataVenda = produto.dataVenda
    ? new Date(produto.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')
    : '—';

  // Salvar PDF via window.print (funciona em qualquer navegador/dispositivo)
  const handleSavePdf = () => {
    const conteudo = reciboRef.current;
    if (!conteudo) return;
    const janela = window.open('', '_blank');
    if (!janela) { alert('Permita pop-ups para salvar o PDF.'); return; }
    janela.document.write(`
      <!DOCTYPE html>
      <html><head>
        <meta charset="utf-8">
        <title>Recibo #${produto.codigo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #3B3B4F; padding-bottom: 16px; margin-bottom: 16px; }
          .brand { font-size: 22px; font-weight: 800; color: #3B3B4F; }
          .brand span { color: #2E78B7; }
          .subtitle { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
          .row .label { color: #888; }
          .row .value { font-weight: 600; }
          .section-title { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 2px; margin: 12px 0 6px; font-weight: 600; }
          .box { background: #f9f9f9; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
          .box .name { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
          .sep { border-top: 1px dashed #ddd; margin: 10px 0; }
          .total-box { background: #2a2a3d; color: white; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
          .total-label { font-size: 14px; font-weight: 600; }
          .total-value { font-size: 24px; font-weight: 800; }
          .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #bbb; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>
        <div class="header">
          <div class="brand">iPHONES <span>FORTALEZA</span></div>
          <div class="subtitle">Comprovante de Venda</div>
        </div>
        <div class="row"><span class="label">N° do Recibo</span><span class="value">#${produto.codigo}</span></div>
        <div class="row"><span class="label">Data da Venda</span><span class="value">${dataVenda}</span></div>
        <div class="sep"></div>
        <div class="section-title">Produto</div>
        <div class="box">
          <div class="name">${produto.modelo} ${produto.linha}</div>
          <div class="row"><span class="label">Armazenamento</span><span>${produto.gb}</span></div>
          <div class="row"><span class="label">Cor</span><span>${produto.cor}</span></div>
          <div class="row"><span class="label">Estado</span><span>${produto.estado}</span></div>
          <div class="row"><span class="label">Bateria</span><span>${produto.bateria}%</span></div>
          <div class="row"><span class="label">IMEI</span><span style="font-family:monospace;font-size:12px">${produto.imei || 'N/A'}</span></div>
        </div>
        ${produto.cliente || produto.contato ? `
          <div class="sep"></div>
          <div class="section-title">Cliente</div>
          <div class="box">
            ${produto.cliente ? `<div class="row"><span class="label">Nome</span><span class="value">${produto.cliente}</span></div>` : ''}
            ${produto.contato ? `<div class="row"><span class="label">Contato</span><span>${produto.contato}</span></div>` : ''}
          </div>
        ` : ''}
        <div class="sep"></div>
        <div class="section-title">Pagamento</div>
        <div class="box">
          ${produto.formasPagamento && produto.formasPagamento.length > 0
            ? produto.formasPagamento.map(f =>
              `<div class="row"><span>${FORMA_LABEL[f]}</span>${f === 'CREDITO' && produto.parcelasCredito ? `<span style="color:#999;font-size:12px">${produto.parcelasCredito}x</span>` : '<span></span>'}</div>`
            ).join('')
            : '<div style="color:#999">Não informado</div>'
          }
        </div>
        <div class="sep"></div>
        ${produto.custos ? `<div class="row"><span class="label">Custos adicionais</span><span>${fmt(produto.custos)}</span></div>` : ''}
        ${produto.acrescimo ? `<div class="row"><span class="label">Taxa maquineta</span><span>${fmt(produto.acrescimo)}</span></div>` : ''}
        <div class="total-box">
          <span class="total-label">VALOR TOTAL</span>
          <span class="total-value">${produto.valorVenda ? fmt(produto.valorVenda) : '—'}</span>
        </div>
        <div class="footer">
          <div>Obrigado pela preferência!</div>
          <div style="margin-top:4px">iPhones Fortaleza® — Todos os direitos reservados</div>
        </div>
      </body></html>
    `);
    janela.document.close();
    setTimeout(() => { janela.print(); }, 500);
  };

  // Compartilhar / salvar como imagem (funciona bem no mobile)
  const handleShare = async () => {
    const conteudo = reciboRef.current;
    if (!conteudo) return;
    // Tenta usar a API de compartilhamento nativa (mobile)
    const texto = [
      `📱 RECIBO - iPHONES FORTALEZA`,
      `N° ${produto.codigo} | ${dataVenda}`,
      ``,
      `${produto.modelo} ${produto.linha}`,
      `${produto.gb} | ${produto.cor} | ${produto.estado}`,
      `IMEI: ${produto.imei || 'N/A'}`,
      ``,
      produto.cliente ? `Cliente: ${produto.cliente}` : '',
      produto.contato ? `Contato: ${produto.contato}` : '',
      ``,
      `Pagamento: ${produto.formasPagamento?.map(f => FORMA_LABEL[f]).join(', ') || 'N/A'}`,
      ``,
      `💰 VALOR TOTAL: ${produto.valorVenda ? fmt(produto.valorVenda) : '—'}`,
      ``,
      `Obrigado pela preferência!`,
      `iPhones Fortaleza®`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: `Recibo #${produto.codigo}`, text: texto });
      } catch { /* cancelou */ }
    } else {
      await navigator.clipboard.writeText(texto);
      alert('Recibo copiado para a área de transferência!');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">

        {/* Área do recibo */}
        <div ref={reciboRef} className="bg-white p-6">
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: '#3B3B4F' }}>
              iPHONES <span style={{ color: '#2E78B7' }}>FORTALEZA</span>
            </h2>
            <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">Comprovante de Venda</p>
          </div>

          {/* Info da venda */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">N° do Recibo</span>
              <span className="font-mono font-bold">#{produto.codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data da Venda</span>
              <span className="font-semibold">{dataVenda}</span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Produto</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="font-bold text-gray-800">{produto.modelo} {produto.linha}</p>
              <div className="flex justify-between text-gray-600">
                <span>Armazenamento</span><span>{produto.gb}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cor</span><span>{produto.cor}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estado</span><span>{produto.estado}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Bateria</span><span>{produto.bateria}%</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IMEI</span>
                <span className="font-mono text-xs">{produto.imei || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            {(produto.cliente || produto.contato) && (
              <>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Cliente</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {produto.cliente && (
                    <div className="flex justify-between text-gray-600">
                      <span>Nome</span><span className="font-semibold">{produto.cliente}</span>
                    </div>
                  )}
                  {produto.contato && (
                    <div className="flex justify-between text-gray-600">
                      <span>Contato</span><span>{produto.contato}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-300 my-2" />
              </>
            )}

            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Pagamento</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {produto.formasPagamento && produto.formasPagamento.length > 0 ? (
                produto.formasPagamento.map(f => (
                  <div key={f} className="flex justify-between text-gray-600">
                    <span>{FORMA_LABEL[f]}</span>
                    {f === 'CREDITO' && produto.parcelasCredito && (
                      <span className="text-xs text-gray-400">{produto.parcelasCredito}x</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Não informado</p>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            {produto.custos ? (
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Custos adicionais</span><span>{fmt(produto.custos)}</span>
              </div>
            ) : null}
            {produto.acrescimo ? (
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Taxa maquineta</span><span>{fmt(produto.acrescimo)}</span>
              </div>
            ) : null}

            <div className="bg-gray-800 text-white rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm font-semibold">VALOR TOTAL</span>
              <span className="text-2xl font-extrabold">
                {produto.valorVenda ? fmt(produto.valorVenda) : '—'}
              </span>
            </div>
          </div>

          <div className="text-center mt-4 pt-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-400">Obrigado pela preferência!</p>
            <p className="text-[10px] text-gray-300 mt-1">iPhones Fortaleza® — Todos os direitos reservados</p>
          </div>
        </div>

        {/* Botões */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSavePdf}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#D94070' }}
          >
            Salvar PDF
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#2E78B7' }}
          >
            Compartilhar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
