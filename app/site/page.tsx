'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const FEATURES = [
  {
    icon: '📦',
    title: 'Controle de Estoque',
    desc: 'Gerencie todos os seus iPhones em um só lugar. Cadastro completo com modelo, cor, GB, IMEI, bateria e fotos.',
  },
  {
    icon: '💰',
    title: 'Gestão de Vendas',
    desc: 'Registre vendas com múltiplas formas de pagamento, cálculo automático de acréscimos e lucro líquido.',
  },
  {
    icon: '📊',
    title: 'Dashboard Inteligente',
    desc: 'Acompanhe faturamento, lucro, ticket médio e estoque com filtros por mês. Tudo em tempo real.',
  },
  {
    icon: '📱',
    title: '100% Mobile',
    desc: 'Interface otimizada para celular com navegação por abas, cards responsivos e botões grandes para toque.',
  },
  {
    icon: '🔒',
    title: 'Perfis de Acesso',
    desc: 'Administrador com acesso total e vendedor com acesso limitado. Valores protegidos com um clique.',
  },
  {
    icon: '📄',
    title: 'Recibo + Garantia',
    desc: 'Gere recibos automáticos com termo de garantia incluso. Salve em PDF ou compartilhe pelo WhatsApp.',
  },
  {
    icon: '📷',
    title: 'Galeria de Fotos',
    desc: 'Adicione fotos de cada produto com compressão automática. Visualize em miniatura ou tela cheia.',
  },
  {
    icon: '🔲',
    title: 'QR Code e Código de Barras',
    desc: 'Gere QR Codes e códigos de barras para cada produto. Baixe para imprimir ou etiquetar.',
  },
];

const DIFERENCIAIS = [
  { num: '100%', label: 'Gratuito', desc: 'Sem mensalidade, sem taxa, sem limite de produtos.' },
  { num: '0', label: 'Instalação', desc: 'Funciona direto no navegador. Sem app para baixar.' },
  { num: '∞', label: 'Produtos', desc: 'Cadastre quantos aparelhos precisar, sem restrição.' },
  { num: '24/7', label: 'Disponível', desc: 'Acesse de qualquer lugar, a qualquer hora.' },
];

const DEPOIMENTOS = [
  {
    nome: 'Carlos M.',
    cargo: 'Revendedor de iPhones',
    texto: 'Antes eu controlava tudo no Excel e vivia perdendo informação. Com o sistema, meu estoque ficou organizado e sei o lucro de cada venda na hora.',
  },
  {
    nome: 'Ana P.',
    cargo: 'Loja de seminovos',
    texto: 'O recibo com termo de garantia passa muita credibilidade pro cliente. Eles ficam impressionados com o profissionalismo.',
  },
  {
    nome: 'Rafael S.',
    cargo: 'Vendedor autônomo',
    texto: 'Uso no celular o dia todo. A interface é muito rápida e os filtros por mês me ajudam demais no fechamento mensal.',
  },
];

export default function SitePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="iPhones Fortaleza" width={120} height={40} className="object-contain h-8 w-auto" />
            <span className="hidden sm:block text-lg font-extrabold" style={{ color: '#3B3B4F' }}>
              iPHONES <span style={{ color: '#2E78B7' }}>FORTALEZA</span>
            </span>
          </div>
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#funcionalidades" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#planos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Planos</a>
            <a href="#diferenciais" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Diferenciais</a>
            <a href="#depoimentos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Depoimentos</a>
            <a href="#contato" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contato</a>
            <Link href="/login" className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#2E78B7' }}>
              Acessar Sistema
            </Link>
          </div>
          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 flex flex-col gap-3">
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)} className="py-2 text-gray-600">Funcionalidades</a>
            <a href="#planos" onClick={() => setMenuOpen(false)} className="py-2 text-gray-600">Planos</a>
            <a href="#diferenciais" onClick={() => setMenuOpen(false)} className="py-2 text-gray-600">Diferenciais</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="py-2 text-gray-600">Depoimentos</a>
            <a href="#contato" onClick={() => setMenuOpen(false)} className="py-2 text-gray-600">Contato</a>
            <Link href="/login" className="py-2.5 rounded-lg text-sm font-semibold text-white text-center" style={{ background: '#2E78B7' }}>
              Acessar Sistema
            </Link>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef5fb 100%)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#2E78B7' }}>
              Sistema de Gestão para Revendedores
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6" style={{ color: '#3B3B4F' }}>
              Gerencie seu estoque de
              <span className="block" style={{ color: '#2E78B7' }}>iPhones com facilidade</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto md:mx-0">
              Controle completo de estoque, vendas, lucros e recibos em um sistema profissional feito para quem vende iPhones.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/login" className="px-8 py-3.5 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 shadow-lg" style={{ background: 'linear-gradient(135deg, #2E78B7, #1a5a8f)', boxShadow: '0 8px 25px rgba(46,120,183,0.3)' }}>
                Acessar Sistema Grátis
              </Link>
              <a href="#funcionalidades" className="px-8 py-3.5 rounded-xl font-bold text-base border-2 transition-all hover:bg-gray-50" style={{ borderColor: '#2E78B7', color: '#2E78B7' }}>
                Ver Funcionalidades
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2E78B7 0%, #3B3B4F 100%)' }}>
                <div className="bg-white rounded-2xl p-6 shadow-2xl">
                  <Image src="/logo.jpg" alt="iPhones Fortaleza" width={250} height={120} className="object-contain" />
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <div><p className="text-xs text-gray-400">Lucro do mês</p><p className="font-bold text-green-600 text-sm">+ R$ 12.500</p></div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <div><p className="text-xs text-gray-400">Em estoque</p><p className="font-bold text-sm" style={{ color: '#2E78B7' }}>42 aparelhos</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FUNCIONALIDADES ═══ */}
      <section id="funcionalidades" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Ferramentas completas para gerenciar seu negócio de iPhones do início ao fim.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-100 transition-all group">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform" style={{ background: '#eef5fb' }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLANOS ═══ */}
      <section id="planos" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Planos</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>
              Escolha o plano ideal para você
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Do iniciante ao profissional. Comece grátis e escale conforme seu negócio cresce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">

            {/* Plano Grátis */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                  Gratuito
                </span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>R$ 0</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Ideal para quem está começando a revender iPhones.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Até 20 produtos no estoque',
                  'Registro de vendas',
                  'Dashboard básico',
                  'Recibo de venda',
                  '1 usuário (admin)',
                  'Acesso pelo navegador',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
                {[
                  'Múltiplos usuários',
                  'Termo de garantia no PDF',
                  'Relatórios avançados',
                  'Suporte prioritário',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-0.5 flex-shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full py-3 rounded-xl text-center font-semibold text-sm border-2 transition-all hover:bg-gray-50" style={{ borderColor: '#2E78B7', color: '#2E78B7' }}>
                Começar Grátis
              </Link>
            </div>

            {/* Plano Pro — destaque */}
            <div className="bg-white rounded-2xl border-2 p-8 relative shadow-xl scale-[1.03]" style={{ borderColor: '#2E78B7' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white" style={{ background: 'linear-gradient(135deg, #2E78B7, #1a5a8f)' }}>
                  Mais Popular
                </span>
              </div>
              <div className="mb-6 mt-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white" style={{ background: '#2E78B7' }}>
                  Profissional
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>R$ 49</span>
                <span className="text-gray-400 text-sm">,90/mês</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">ou R$ 479,00/ano (20% off)</p>
              <p className="text-sm text-gray-500 mb-6">Para revendedores que querem profissionalizar o negócio.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Produtos ilimitados',
                  'Registro de vendas completo',
                  'Dashboard com filtros por mês',
                  'Recibo + Termo de Garantia em PDF',
                  'QR Code e Código de Barras',
                  'Galeria de fotos por produto',
                  '3 usuários (admin + vendedores)',
                  'Ocultar valores com 1 clique',
                  'Múltiplas formas de pagamento',
                  'Suporte por WhatsApp',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: '#2E78B7' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full py-3 rounded-xl text-center font-bold text-sm text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #2E78B7, #1a5a8f)', boxShadow: '0 4px 15px rgba(46,120,183,0.3)' }}>
                Assinar Plano Pro
              </Link>
            </div>

            {/* Plano Empresarial */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white" style={{ background: '#3B3B4F' }}>
                  Empresarial
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>R$ 99</span>
                <span className="text-gray-400 text-sm">,90/mês</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">ou R$ 959,00/ano (20% off)</p>
              <p className="text-sm text-gray-500 mb-6">Para lojas com equipe e múltiplos pontos de venda.</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Tudo do plano Profissional',
                  'Usuários ilimitados',
                  'Relatórios avançados (mensal/anual)',
                  'Exportar dados em Excel',
                  'Histórico de alterações',
                  'Backup automático na nuvem',
                  'Logo personalizada no recibo',
                  'Multi-lojas (filiais)',
                  'Suporte prioritário 24h',
                  'Consultoria de implantação',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#contato" className="block w-full py-3 rounded-xl text-center font-semibold text-sm border-2 transition-all hover:bg-gray-50" style={{ borderColor: '#3B3B4F', color: '#3B3B4F' }}>
                Falar com Consultor
              </a>
            </div>

          </div>

          {/* Garantia */}
          <div className="text-center mt-10">
            <p className="text-sm text-gray-400">
              🔒 Todos os planos possuem <strong className="text-gray-600">7 dias de garantia</strong> — cancele quando quiser, sem burocracia.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ DIFERENCIAIS ═══ */}
      <section id="diferenciais" className="py-16 md:py-24 px-4" style={{ background: '#3B3B4F' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Por que escolher</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Diferenciais do sistema
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {DIFERENCIAIS.map((d, i) => (
              <div key={i} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-4xl md:text-5xl font-extrabold mb-2" style={{ color: '#2E78B7' }}>{d.num}</p>
                <p className="text-white font-bold mb-1">{d.label}</p>
                <p className="text-gray-400 text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMO FUNCIONA ═══ */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Simples e rápido</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>
              Como funciona
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Cadastre seus produtos', desc: 'Adicione iPhones ao estoque com todos os detalhes: modelo, cor, IMEI, bateria, fotos e valor de compra.', icon: '📝' },
              { step: '02', title: 'Registre as vendas', desc: 'Quando vender, registre com formas de pagamento, dados do cliente e o sistema calcula o lucro automaticamente.', icon: '🤝' },
              { step: '03', title: 'Acompanhe os resultados', desc: 'Dashboard com faturamento, lucro e estoque. Filtre por mês, exporte recibos e tenha controle total.', icon: '🚀' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: '#eef5fb' }}>
                  {s.icon}
                </div>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#2E78B7' }}>PASSO {s.step}</p>
                <h3 className="text-lg font-bold mb-3" style={{ color: '#3B3B4F' }}>{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DEPOIMENTOS ═══ */}
      <section id="depoimentos" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Depoimentos</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>
              O que dizem nossos usuários
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-lg">★</span>)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">&ldquo;{d.texto}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#2E78B7' }}>
                    {d.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{d.nome}</p>
                    <p className="text-xs text-gray-400">{d.cargo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-16 md:py-24 px-4" style={{ background: 'linear-gradient(135deg, #2E78B7 0%, #1a5a8f 100%)' }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Comece a gerenciar seu negócio agora
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Sistema 100% gratuito, sem cadastro de cartão, sem mensalidade. Acesse e comece a usar em segundos.
          </p>
          <Link href="/login" className="inline-block px-10 py-4 bg-white rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:scale-105" style={{ color: '#2E78B7' }}>
            Acessar Sistema Grátis
          </Link>
        </div>
      </section>

      {/* ═══ CONTATO ═══ */}
      <section id="contato" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Contato</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>
              Fale conosco
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <a href="https://wa.me/5585999999999" target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#dcfce7' }}>
                💬
              </div>
              <p className="font-bold text-gray-800 mb-1">WhatsApp</p>
              <p className="text-sm text-gray-400">(85) 9 9999-9999</p>
            </a>
            <a href="https://www.instagram.com/iphonesfortaleza" target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#fce7f3' }}>
                📸
              </div>
              <p className="font-bold text-gray-800 mb-1">Instagram</p>
              <p className="text-sm text-gray-400">@iphonesfortaleza</p>
            </a>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#eef5fb' }}>
                📍
              </div>
              <p className="font-bold text-gray-800 mb-1">Localização</p>
              <p className="text-sm text-gray-400">Fortaleza — CE</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 px-4" style={{ background: '#3B3B4F' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg px-2 py-1">
              <Image src="/logo.jpg" alt="iPhones Fortaleza" width={100} height={32} className="object-contain h-6 w-auto" />
            </div>
            <span className="text-white font-bold text-sm">
              iPHONES <span style={{ color: '#2E78B7' }}>FORTALEZA</span>
            </span>
          </div>
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} iPhones Fortaleza&reg; — Todos os direitos reservados
          </p>
          <Link href="/login" className="text-sm hover:underline" style={{ color: '#2E78B7' }}>
            Acessar Sistema →
          </Link>
        </div>
      </footer>
    </div>
  );
}
