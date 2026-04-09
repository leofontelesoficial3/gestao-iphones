'use client';
import { useRef, useState } from 'react';
import { Produto, FormaPagamento } from '@/types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  const [salvando, setSalvando] = useState('');

  if (!open || !produto || produto.status !== 'VENDIDO') return null;

  const dataVenda = produto.dataVenda
    ? new Date(produto.dataVenda + 'T12:00:00').toLocaleDateString('pt-BR')
    : '—';

  const capturar = () => {
    if (!reciboRef.current) return Promise.resolve(null);
    return html2canvas(reciboRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  };

  const handleSaveJpeg = async () => {
    try {
      setSalvando('jpeg');
      const canvas = await capturar();
      if (!canvas) return;
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `recibo-${produto.codigo}.jpg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro JPEG:', err);
      alert('Erro ao salvar JPEG.');
    } finally {
      setSalvando('');
    }
  };

  const handleSavePdf = async () => {
    try {
      setSalvando('pdf');
      const canvas = await capturar();
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/png');
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pdf = new jsPDF('p', 'mm', [pdfW, Math.max(pdfH, 297)]);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`recibo-${produto.codigo}.pdf`);
    } catch (err) {
      console.error('Erro PDF:', err);
      alert('Erro ao salvar PDF.');
    } finally {
      setSalvando('');
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

            {/* Separador */}
            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Produto */}
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Produto</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="font-bold text-gray-800">{produto.modelo} {produto.linha}</p>
              <div className="flex justify-between text-gray-600">
                <span>Armazenamento</span>
                <span>{produto.gb}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cor</span>
                <span>{produto.cor}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estado</span>
                <span>{produto.estado}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Bateria</span>
                <span>{produto.bateria}%</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IMEI</span>
                <span className="font-mono text-xs">{produto.imei || 'N/A'}</span>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Cliente */}
            {(produto.cliente || produto.contato) && (
              <>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Cliente</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {produto.cliente && (
                    <div className="flex justify-between text-gray-600">
                      <span>Nome</span>
                      <span className="font-semibold">{produto.cliente}</span>
                    </div>
                  )}
                  {produto.contato && (
                    <div className="flex justify-between text-gray-600">
                      <span>Contato</span>
                      <span>{produto.contato}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-300 my-2" />
              </>
            )}

            {/* Pagamento */}
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

            {/* Separador */}
            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Valores */}
            <div className="space-y-1.5">
              {produto.custos ? (
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Custos adicionais</span>
                  <span>{fmt(produto.custos)}</span>
                </div>
              ) : null}
              {produto.acrescimo ? (
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Taxa maquineta</span>
                  <span>{fmt(produto.acrescimo)}</span>
                </div>
              ) : null}
            </div>

            {/* Total */}
            <div className="bg-gray-800 text-white rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm font-semibold">VALOR TOTAL</span>
              <span className="text-2xl font-extrabold">
                {produto.valorVenda ? fmt(produto.valorVenda) : '—'}
              </span>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center mt-4 pt-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-400">Obrigado pela preferência!</p>
            <p className="text-[10px] text-gray-300 mt-1">iPhones Fortaleza® — Todos os direitos reservados</p>
          </div>
        </div>

        {/* Botões (fora da área do recibo) */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSavePdf}
            disabled={!!salvando}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#D94070' }}
          >
            {salvando === 'pdf' ? 'Gerando...' : 'Salvar PDF'}
          </button>
          <button
            onClick={handleSaveJpeg}
            disabled={!!salvando}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#2E78B7' }}
          >
            {salvando === 'jpeg' ? 'Gerando...' : 'Salvar JPEG'}
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
