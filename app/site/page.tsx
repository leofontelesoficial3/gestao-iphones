'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const FEATURES = [
  { icon: '📦', title: 'Controle de Estoque', desc: 'Cadastro completo com modelo, cor, GB, IMEI, bateria e fotos.' },
  { icon: '💰', title: 'Gestão de Vendas', desc: 'Múltiplas formas de pagamento e cálculo automático de lucro.' },
  { icon: '📊', title: 'Dashboard Inteligente', desc: 'Faturamento, lucro e estoque com filtros por mês.' },
  { icon: '📱', title: '100% Mobile', desc: 'Interface otimizada para celular com navegação por abas.' },
  { icon: '🔒', title: 'Perfis de Acesso', desc: 'Admin e vendedor com valores protegidos.' },
  { icon: '📄', title: 'Recibo + Garantia', desc: 'Recibos automáticos com termo de garantia em PDF.' },
  { icon: '📷', title: 'Galeria de Fotos', desc: 'Fotos por produto com compressão automática.' },
  { icon: '🔲', title: 'QR Code', desc: 'QR Codes e códigos de barras para cada produto.' },
];

const DEPOIMENTOS = [
  { nome: 'Carlos M.', cargo: 'Revendedor de iPhones', texto: 'Antes eu controlava tudo no Excel. Com o sistema, meu estoque ficou organizado e sei o lucro de cada venda na hora.' },
  { nome: 'Ana P.', cargo: 'Loja de seminovos', texto: 'O recibo com termo de garantia passa muita credibilidade pro cliente. Ficam impressionados com o profissionalismo.' },
  { nome: 'Rafael S.', cargo: 'Vendedor autônomo', texto: 'Uso no celular o dia todo. A interface é muito rápida e os filtros por mês me ajudam no fechamento mensal.' },
];

export default function SitePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="iPhones Fortaleza" width={120} height={40} className="object-contain h-8 w-auto bg-white rounded-lg px-2 py-0.5" />
            <span className="hidden sm:block text-base font-extrabold text-white">
              iPHONES <span style={{ color: '#2E78B7' }}>FORTALEZA</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#funcionalidades" className="text-sm text-gray-300 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#planos" className="text-sm text-gray-300 hover:text-white transition-colors">Planos</a>
            <a href="#depoimentos" className="text-sm text-gray-300 hover:text-white transition-colors">Depoimentos</a>
            <a href="#contato" className="text-sm text-gray-300 hover:text-white transition-colors">Contato</a>
            <Link href="/login" className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#2E78B7' }}>
              Acessar Sistema
            </Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-black/95 px-4 pb-4 flex flex-col gap-3">
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)} className="py-2 text-gray-300">Funcionalidades</a>
            <a href="#planos" onClick={() => setMenuOpen(false)} className="py-2 text-gray-300">Planos</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="py-2 text-gray-300">Depoimentos</a>
            <a href="#contato" onClick={() => setMenuOpen(false)} className="py-2 text-gray-300">Contato</a>
            <Link href="/login" className="py-2.5 rounded-lg text-sm font-semibold text-white text-center" style={{ background: '#2E78B7' }}>Acessar Sistema</Link>
          </div>
        )}
      </nav>

      {/* ═══ HERO — foto 28 (unboxing) como background ═══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image src="/unboxing.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-32 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#2E78B7' }}>
              Sistema de Gestão para Revendedores
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-white">
              Gerencie seu
              <span className="block" style={{ color: '#2E78B7' }}>negócio de iPhones</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
              Controle completo de estoque, vendas, lucros e recibos. Profissional e gratuito.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/registro" className="px-8 py-4 rounded-xl text-white font-bold text-base transition-all hover:scale-105 shadow-2xl" style={{ background: 'linear-gradient(135deg, #2E78B7, #1a5a8f)', boxShadow: '0 8px 30px rgba(46,120,183,0.4)' }}>
                Começar Grátis
              </Link>
              <a href="#funcionalidades" className="px-8 py-4 rounded-xl font-bold text-base border-2 border-white/30 text-white hover:bg-white/10 transition-all">
                Ver Funcionalidades
              </a>
            </div>
          </div>
          <div className="flex-1 hidden md:flex justify-center">
            <Image src="/hero-phones.jpg" alt="iPhones" width={400} height={500} className="object-contain drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* ═══ BANNER com foto 27 (mão segurando iPhones) ═══ */}
      <section className="relative py-20 overflow-hidden">
        <Image src="/phones-hand.jpg" alt="" fill className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Variedade que <span style={{ color: '#2E78B7' }}>impressiona</span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            De todos os modelos e cores. Gerencie cada aparelho com fotos, IMEI, estado da bateria e muito mais.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-white">64+</p>
              <p className="text-xs text-gray-400 mt-1">Produtos gerenciados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold" style={{ color: '#5AAA4A' }}>100%</p>
              <p className="text-xs text-gray-400 mt-1">Controle de lucro</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold" style={{ color: '#2E78B7' }}>24/7</p>
              <p className="text-xs text-gray-400 mt-1">Acesso online</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FUNCIONALIDADES ═══ */}
      <section id="funcionalidades" className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>
              Tudo que você precisa
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
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

      {/* ═══ SEÇÃO com foto 26 como background — Como Funciona ═══ */}
      <section className="relative py-24 overflow-hidden">
        <Image src="/hero-phones.jpg" alt="" fill className="object-cover object-top opacity-10" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #3B3B4F 0%, #1a2a40 100%)' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Simples e rápido</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Como funciona</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Cadastre seus produtos', desc: 'Adicione iPhones com modelo, cor, IMEI, bateria, fotos e valor de compra.', icon: '📝' },
              { step: '02', title: 'Registre as vendas', desc: 'Formas de pagamento, dados do cliente e cálculo automático de lucro.', icon: '🤝' },
              { step: '03', title: 'Acompanhe os resultados', desc: 'Dashboard com faturamento e lucro. Exporte recibos com garantia.', icon: '🚀' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10 hover:bg-white/15 transition-all">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: 'rgba(46,120,183,0.2)' }}>
                  {s.icon}
                </div>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#2E78B7' }}>PASSO {s.step}</p>
                <h3 className="text-lg font-bold mb-3 text-white">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLANOS ═══ */}
      <section id="planos" className="py-20 md:py-28 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Planos</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>
              Escolha o plano ideal
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Comece grátis e escale conforme seu negócio cresce.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {/* Grátis */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 mb-6">Gratuito</span>
              <div className="mb-6">
                <span className="text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>R$ 0</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Para quem está começando.</p>
              <ul className="space-y-3 mb-8">
                {['Até 20 produtos', 'Registro de vendas', 'Dashboard básico', 'Recibo de venda', '1 usuário (admin)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>{item}</li>
                ))}
                {['Vendedores', 'Termo de garantia', 'Relatórios avançados'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="mt-0.5">✗</span>{item}</li>
                ))}
              </ul>
              <Link href="/registro" className="block w-full py-3 rounded-xl text-center font-semibold text-sm border-2 hover:bg-gray-50 transition-all" style={{ borderColor: '#2E78B7', color: '#2E78B7' }}>Começar Grátis</Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl border-2 p-8 relative shadow-xl scale-[1.03]" style={{ borderColor: '#2E78B7' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white" style={{ background: 'linear-gradient(135deg, #2E78B7, #1a5a8f)' }}>Mais Popular</span>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white mb-6 mt-2" style={{ background: '#2E78B7' }}>Profissional</span>
              <div className="mb-1">
                <span className="text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>R$ 49</span>
                <span className="text-gray-400 text-sm">,90/mês</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">ou R$ 479/ano (20% off)</p>
              <p className="text-sm text-gray-500 mb-6">Para profissionalizar o negócio.</p>
              <ul className="space-y-3 mb-8">
                {['Produtos ilimitados', 'Vendas completas', 'Dashboard com filtros', 'Recibo + Garantia PDF', 'QR Code e Barras', 'Galeria de fotos', 'Até 2 vendedores', 'Ocultar valores', 'Suporte WhatsApp'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="mt-0.5" style={{ color: '#2E78B7' }}>✓</span>{item}</li>
                ))}
              </ul>
              <Link href="/registro" className="block w-full py-3 rounded-xl text-center font-bold text-sm text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #2E78B7, #1a5a8f)', boxShadow: '0 4px 15px rgba(46,120,183,0.3)' }}>Assinar Pro</Link>
            </div>

            {/* Empresarial */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white mb-6" style={{ background: '#3B3B4F' }}>Empresarial</span>
              <div className="mb-1">
                <span className="text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>R$ 99</span>
                <span className="text-gray-400 text-sm">,90/mês</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">ou R$ 959/ano (20% off)</p>
              <p className="text-sm text-gray-500 mb-6">Para lojas com equipe.</p>
              <ul className="space-y-3 mb-8">
                {['Tudo do Profissional', 'Até 5 vendedores', 'Relatórios avançados', 'Exportar Excel', 'Backup na nuvem', 'Logo no recibo', 'Multi-lojas', 'Suporte 24h', 'Consultoria'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>{item}</li>
                ))}
              </ul>
              <a href="#contato" className="block w-full py-3 rounded-xl text-center font-semibold text-sm border-2 hover:bg-gray-50 transition-all" style={{ borderColor: '#3B3B4F', color: '#3B3B4F' }}>Falar com Consultor</a>
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-10">🔒 7 dias de garantia — cancele quando quiser.</p>
        </div>
      </section>

      {/* ═══ DEPOIMENTOS — foto 28 background ═══ */}
      <section id="depoimentos" className="relative py-20 md:py-28 overflow-hidden">
        <Image src="/unboxing.jpg" alt="" fill className="object-cover opacity-5" />
        <div className="absolute inset-0 bg-white/95" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Depoimentos</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>O que dizem nossos usuários</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-shadow">
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

      {/* ═══ CTA — foto 27 background ═══ */}
      <section className="relative py-24 overflow-hidden">
        <Image src="/phones-hand.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 to-black/70" />
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white px-4">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Comece agora, <span style={{ color: '#2E78B7' }}>é grátis</span>
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
            Sem cartão de crédito, sem mensalidade. Crie sua conta e comece a gerenciar em segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registro" className="px-10 py-4 bg-white rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:scale-105" style={{ color: '#2E78B7' }}>
              Criar Conta Grátis
            </Link>
            <Link href="/login" className="px-10 py-4 rounded-xl font-bold text-lg border-2 border-white/40 text-white hover:bg-white/10 transition-all">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CONTATO ═══ */}
      <section id="contato" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#2E78B7' }}>Contato</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#3B3B4F' }}>Fale conosco</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <a href="https://wa.me/5585999999999" target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#dcfce7' }}>💬</div>
              <p className="font-bold text-gray-800 mb-1">WhatsApp</p>
              <p className="text-sm text-gray-400">(85) 9 9999-9999</p>
            </a>
            <a href="https://www.instagram.com/iphonesfortaleza" target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#fce7f3' }}>📸</div>
              <p className="font-bold text-gray-800 mb-1">Instagram</p>
              <p className="text-sm text-gray-400">@iphonesfortaleza</p>
            </a>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#eef5fb' }}>📍</div>
              <p className="font-bold text-gray-800 mb-1">Localização</p>
              <p className="text-sm text-gray-400">Fortaleza — CE</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 px-4" style={{ background: '#1a1a2e' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="iPhones Fortaleza" width={100} height={32} className="object-contain h-6 w-auto bg-white rounded-lg px-1.5 py-0.5" />
            <span className="text-white font-bold text-sm">iPHONES <span style={{ color: '#2E78B7' }}>FORTALEZA</span></span>
          </div>
          <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} iPhones Fortaleza&reg; — Todos os direitos reservados</p>
          <Link href="/login" className="text-sm hover:underline" style={{ color: '#2E78B7' }}>Acessar Sistema →</Link>
        </div>
      </footer>
    </div>
  );
}
