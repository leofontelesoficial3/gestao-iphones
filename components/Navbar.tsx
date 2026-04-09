'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/estoque', label: 'Estoque', icon: '📦' },
  { href: '/vendas', label: 'Vendas', icon: '💰' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

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
          <div className="bg-white rounded-lg px-2 py-1">
            <Image src="/logo.jpg" alt="iPhones Fortaleza" width={130} height={40} className="object-contain h-8 w-auto" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-extrabold text-white tracking-tight">
              iPHONES <span style={{ color: '#2E78B7' }}>FORTALEZA</span>
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Sistema de Gestão</p>
          </div>
        </div>
        <div className="flex gap-2 flex-1 ml-4">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              style={pathname === link.href ? { background: '#2E78B7' } : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{user?.nome}</span>
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
          <div className="bg-white rounded-lg px-1.5 py-0.5">
            <Image src="/logo.jpg" alt="iPhones Fortaleza" width={90} height={28} className="object-contain h-6 w-auto" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-white tracking-tight">
              iPHONES <span style={{ color: '#2E78B7' }}>FORTALEZA</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white px-2 py-1 rounded"
        >
          Sair
        </button>
      </header>

      {/* Mobile: barra inferior fixa */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center py-2 px-4 min-w-[80px] transition-colors"
              style={{ color: pathname === link.href ? '#2E78B7' : '#9ca3af' }}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-[11px] font-semibold mt-0.5">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
