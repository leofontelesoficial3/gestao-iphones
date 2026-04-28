'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TemaCor } from '@/types';
import { updateTema } from '@/lib/storage';
import { useTheme, PALETAS } from '@/components/ThemeProvider';
import { useAuth } from '@/components/AuthProvider';
import { mascaraCelular } from '@/lib/format';

const CORES_OPCOES: TemaCor[] = ['branco', 'preto', 'azul', 'vermelho', 'amarelo', 'laranja'];

export default function EstiloPage() {
  const { isAdmin, conta } = useAuth();
  const router = useRouter();
  const { tema, setTema, reload } = useTheme();
  const [corSel, setCorSel] = useState<TemaCor>(tema.cor);
  const [logo, setLogo] = useState<string | null>(tema.logo);
  const [whatsapp, setWhatsapp] = useState<string>(tema.whatsapp ?? '');
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCorSel(tema.cor);
    setLogo(tema.logo);
    setWhatsapp(tema.whatsapp ?? '');
  }, [tema]);

  const linkLoja = typeof window !== 'undefined' ? `${window.location.origin}/loja/${conta}` : '';

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkLoja);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      alert('Não foi possível copiar. Selecione e copie manualmente.');
    }
  };

  useEffect(() => {
    if (!isAdmin) router.push('/');
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setLogo(data.urls[0]);
      }
    } catch {
      alert('Erro no upload da logo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removerLogo = () => setLogo(null);

  const salvar = async () => {
    setSalvando(true);
    setMensagem('');
    try {
      const whatsappLimpo = whatsapp.replace(/\D/g, '') || null;
      const novoTema = await updateTema(corSel, logo, whatsappLimpo);
      setTema(novoTema);
      await reload();
      setMensagem('✅ Estilo salvo com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch {
      setMensagem('❌ Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  // Preview ao vivo: aplica cor selecionada antes de salvar
  const handleSelecionarCor = (c: TemaCor) => {
    setCorSel(c);
    setTema({ cor: c, logo, whatsapp: tema.whatsapp });
  };

  const paletaPreview = PALETAS[corSel];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🎨 Estilo da Página</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personalize a aparência do sistema escolhendo a cor principal e a logomarca da sua loja.
        </p>
      </div>

      {/* Cor principal */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Cor Principal</h2>
        <p className="text-xs text-gray-500 mb-4">
          A cor escolhida aparece em botões de destaque, cabeçalho, links e elementos ativos.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CORES_OPCOES.map(cor => {
            const p = PALETAS[cor];
            const sel = corSel === cor;
            return (
              <button
                key={cor}
                onClick={() => handleSelecionarCor(cor)}
                className={`relative rounded-xl p-3 border-2 transition-all ${
                  sel ? 'border-gray-800 scale-105' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div
                  className="w-full h-14 rounded-lg mb-2 flex items-center justify-center font-bold text-white"
                  style={{ background: p.primary }}
                >
                  {sel && <span className="text-2xl">✓</span>}
                </div>
                <p className="text-xs font-semibold text-center capitalize text-gray-700">{p.label}</p>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="mt-5 rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="px-4 py-3 text-white font-bold text-sm" style={{ background: paletaPreview.primary }}>
            Pré-visualização — {paletaPreview.label}
          </div>
          <div className="p-4 bg-white space-y-2">
            <button
              className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
              style={{ background: paletaPreview.primary }}
            >
              Botão de destaque
            </button>
            <p className="text-xs">
              Texto com <a className="font-semibold underline" style={{ color: paletaPreview.primary }}>link</a> e
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: paletaPreview.primaryLight, color: paletaPreview.primaryDark }}>
                badge
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Logomarca */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Logomarca</h2>
        <p className="text-xs text-gray-500 mb-4">
          Aparece no cabeçalho do sistema. Use uma imagem com fundo transparente (PNG) ou JPG quadrado.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-3xl text-gray-300">🏪</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={uploading}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${uploading ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {uploading ? 'Enviando...' : logo ? 'Trocar logo' : 'Enviar logo'}
            </button>
            {logo && (
              <button
                type="button"
                onClick={removerLogo}
                className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-200"
              >
                Remover logo
              </button>
            )}
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadLogo}
            />
          </div>
        </div>
      </div>

      {/* WhatsApp da loja */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">WhatsApp da Loja</h2>
        <p className="text-xs text-gray-500 mb-4">
          Número que receberá os pedidos da loja pública. Use formato com DDD: (85) 9 9999-9999
        </p>
        <input
          type="tel"
          inputMode="numeric"
          className="input max-w-sm"
          value={whatsapp}
          onChange={e => setWhatsapp(mascaraCelular(e.target.value))}
          placeholder="(00) 0 0000-0000"
          maxLength={16}
        />
      </div>

      {/* Link da Loja Pública */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">🛒 Loja Pública</h2>
        <p className="text-xs text-gray-500 mb-4">
          Link público que qualquer cliente pode acessar (sem login) para ver seu estoque e pedir um produto via WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={linkLoja}
            className="input flex-1 font-mono text-xs"
            onFocus={e => e.target.select()}
          />
          <button
            onClick={copiarLink}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: paletaPreview.primary }}
          >
            {linkCopiado ? '✅ Copiado!' : '📋 Copiar link'}
          </button>
          <a
            href={linkLoja}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 text-center"
          >
            Abrir
          </a>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center gap-3 justify-end">
        {mensagem && <p className="text-sm font-semibold">{mensagem}</p>}
        <button
          onClick={salvar}
          disabled={salvando}
          className="px-6 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60"
          style={{ background: paletaPreview.primary }}
        >
          {salvando ? 'Salvando...' : 'Salvar Estilo'}
        </button>
      </div>
    </div>
  );
}
