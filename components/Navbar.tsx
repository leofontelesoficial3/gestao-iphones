'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import ContaSwitcher from './ContaSwitcher';

const allLinks = [
  { href: '/', label: 'Dashboard', icon: '📊', adminOnly: true },
  { href: '/estoque', label: 'Estoque', icon: '📦', adminOnly: false },
  { href: '/vendas', label: 'Vendas', icon: '💰', adminOnly: true },
  { href: '/simulacao', label: 'Simulação', icon: '💳', adminOnly: true },
  { href: '/despesas', label: 'Despesas', icon: '📋', adminOnly: true },
  { href: '/fornecedores', label: 'Fornecedores', icon: '🚚', adminOnly: true },
  { href: '/lista-fornecedor', label: 'Lista Fornec.', icon: '📋', adminOnly: true },
  { href: '/vendedores', label: 'Equipe', icon: '👥', adminOnly: true },
  { href: '/estilo', label: 'Estilo', icon: '🎨', adminOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { paleta, tema } = useTheme();

  const links = allLinks.filter(l => !l.adminOnly || isAdmin);
  const logoSrc = tema.logo || '/logo.jpg';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Desktop: topo */}
      <nav className="hidden md:flex text-white px-6 py-3 items-center gap-8 shadow-lg"
        style={{ background: '#2a2a3d' }}>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-2 py-1 flex items-center justify-center" style={{ minWidth: 60, height: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Logo" className="object-contain h-8 w-auto max-w-[140px]" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-extrabold text-white tracking-tight">
              iPHONES <span style={{ color: paleta.primary }}>FORTALEZA</span>
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Sistema de Gestão</p>
          </div>
        </div>
        <div className="flex gap-2 flex-1 ml-4 overflow-x-auto scrollbar-hide">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              style={pathname === link.href ? { background: paleta.primary } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && <ContaSwitcher />}
          <div className="text-right">
            <span className="text-sm text-gray-400 block">{user?.nome}</span>
            <span className={`text-[10px] font-semibold ${
              isSuperAdmin ? 'text-purple-400' : isAdmin ? 'text-blue-400' : 'text-green-400'
            }`}>
              {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrador' : 'Vendedor'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Mobile: header */}
      <header className="md:hidden text-white px-4 py-3 shadow-lg flex items-center justify-between"
        style={{ background: '#2a2a3d' }}>
        <div className="flex items-center gap-2.5">
          <div className="bg-white rounded-lg px-1.5 py-0.5 flex items-center justify-center" style={{ minWidth: 36, height: 28 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Logo" className="object-contain h-6 w-auto max-w-[90px]" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-white tracking-tight">
              iPHONES <span style={{ color: paleta.primary }}>FORTALEZA</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && <ContaSwitcher />}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white px-2 py-1 rounded"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Mobile: barra inferior fixa com scroll horizontal */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div
          className="flex overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center py-2 px-3 min-w-[64px] flex-shrink-0 transition-colors"
              style={{ color: pathname === link.href ? paleta.primary : '#9ca3af' }}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
