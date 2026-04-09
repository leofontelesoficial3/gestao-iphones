'use client';
import { useEffect, useRef, useState } from 'react';
import { Produto } from '@/types';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

interface Props {
  open: boolean;
  onClose: () => void;
  produto: Produto | null;
}

export default function CodigoModal({ open, onClose, produto }: Props) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<SVGSVGElement>(null);
  const [tipo, setTipo] = useState<'qr' | 'barcode'>('qr');

  useEffect(() => {
    if (!open || !produto) return;

    const info = [
      `Cod: ${produto.codigo}`,
      `${produto.modelo} ${produto.linha}`,
      `${produto.gb} | ${produto.cor}`,
      `IMEI: ${produto.imei || 'N/A'}`,
      `Estado: ${produto.estado} | Bat: ${produto.bateria}%`,
    ].join('\n');

    if (tipo === 'qr' && qrRef.current) {
      QRCode.toCanvas(qrRef.current, info, {
        width: 260,
        margin: 2,
        color: { dark: '#3B3B4F', light: '#ffffff' },
      });
    }

    if (tipo === 'barcode' && barRef.current) {
      try {
        JsBarcode(barRef.current, String(produto.codigo), {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10,
          lineColor: '#3B3B4F',
        });
      } catch {
        // fallback silencioso
      }
    }
  }, [open, produto, tipo]);

  if (!open || !produto) return null;

  const handleDownload = () => {
    if (tipo === 'qr' && qrRef.current) {
      const link = document.createElement('a');
      link.download = `qr-${produto.codigo}.png`;
      link.href = qrRef.current.toDataURL('image/png');
      link.click();
    }
    if (tipo === 'barcode' && barRef.current) {
      const svg = barRef.current.outerHTML;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `barcode-${produto.codigo}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Código do Produto</h2>
          <p className="text-sm text-gray-500">
            {produto.modelo} {produto.linha} — #{produto.codigo}
          </p>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          {/* Seletor */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTipo('qr')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tipo === 'qr' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setTipo('barcode')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tipo === 'barcode' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              Código de Barras
            </button>
          </div>

          {/* Código */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            {tipo === 'qr' && <canvas ref={qrRef} />}
            {tipo === 'barcode' && <svg ref={barRef} />}
          </div>

          {/* Info */}
          <div className="text-center text-xs text-gray-400">
            <p>{produto.modelo} {produto.linha} — {produto.gb} — {produto.cor}</p>
            <p>IMEI: {produto.imei || 'N/A'}</p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#2E78B7' }}
            >
              Baixar {tipo === 'qr' ? 'QR Code' : 'Código de Barras'}
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
    </div>
  );
}
