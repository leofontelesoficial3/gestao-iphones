'use client';
import { useState, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  fotos: string[];
  onUpdate: (fotos: string[]) => void;
  produtoNome: string;
}

export default function FotosModal({ open, onClose, fotos, onUpdate, produtoNome }: Props) {
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleAddFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate([...fotos, ...data.urls]);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemover = async (idx: number) => {
    if (!confirm('Remover esta foto?')) return;
    const url = fotos[idx];

    // Tenta deletar do Blob se for URL (não base64)
    if (url.startsWith('http')) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      } catch {}
    }

    onUpdate(fotos.filter((_, i) => i !== idx));
  };

  return (
    <>
      {/* Overlay principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Fotos</h2>
              <p className="text-sm text-gray-500">{produtoNome}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>

          {/* Galeria */}
          <div className="flex-1 overflow-y-auto p-6">
            {fotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <span className="text-5xl mb-2">📷</span>
                <p className="text-sm">Nenhuma foto adicionada</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {fotos.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={src}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setAmpliada(src)}
                    />
                    <button
                      onClick={() => handleRemover(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-400">{fotos.length} foto(s)</span>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${
                uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Enviando...' : '+ Adicionar Fotos'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAddFotos}
            />
          </div>
        </div>
      </div>

      {/* Foto ampliada */}
      {ampliada && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setAmpliada(null)}
        >
          <img
            src={ampliada}
            alt="Foto ampliada"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setAmpliada(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
