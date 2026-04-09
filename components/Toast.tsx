'use client';
import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  tipo: 'venda' | 'estoque';
  mensagem?: string;
}

export default function Toast({ open, onClose, tipo, mensagem }: Props) {
  const [show, setShow] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(true);
      setFade(true);
      const timer = setTimeout(() => {
        setFade(false);
        setTimeout(() => { setShow(false); onClose(); }, 400);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!show) return null;

  const isVenda = tipo === 'venda';

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-400 ${fade ? 'opacity-100' : 'opacity-0'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={() => { setFade(false); setTimeout(() => { setShow(false); onClose(); }, 400); }} />

      {/* Card */}
      <div className={`relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all duration-400 ${fade ? 'scale-100' : 'scale-90'}`}>
        {/* Ícone animado */}
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
          isVenda ? 'bg-green-100' : 'bg-blue-100'
        }`}>
          <span className="text-5xl animate-bounce" style={{ animationDuration: '1s', animationIterationCount: '2' }}>
            {isVenda ? '🎉' : '📦'}
          </span>
        </div>

        {/* Título */}
        <h3 className={`text-xl font-bold mb-2 ${isVenda ? 'text-green-700' : 'text-blue-700'}`}>
          {isVenda ? 'Venda Realizada!' : 'Produto Cadastrado!'}
        </h3>

        {/* Mensagem */}
        <p className="text-gray-500 text-sm mb-4">
          {mensagem || (isVenda
            ? 'A venda foi registrada com sucesso. O estoque foi atualizado automaticamente.'
            : 'O produto foi adicionado ao estoque com sucesso!'
          )}
        </p>

        {/* Barra decorativa */}
        <div className={`h-1 rounded-full mx-auto w-16 ${isVenda ? 'bg-green-400' : 'bg-blue-400'}`} />

        {/* Texto iPhones Fortaleza */}
        <p className="text-[10px] text-gray-300 mt-4 tracking-widest uppercase">iPhones Fortaleza</p>
      </div>
    </div>
  );
}
