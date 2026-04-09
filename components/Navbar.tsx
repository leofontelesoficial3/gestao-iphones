'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/estoque', label: 'Estoque', icon: '📦' },
  { href: '/vendas', label: 'Vendas', icon: '💰' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop: topo */}
      <nav className="hidden md:flex bg-gray-900 text-white px-6 py-4 items-center gap-8 shadow-lg">
        <span className="text-xl font-bold text-blue-400">Gestão iPhones</span>
        <div className="flex gap-4">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile: header simples */}
      <header className="md:hidden bg-gray-900 text-white px-4 py-3 shadow-lg">
        <span className="text-lg font-bold text-blue-400">Gestão iPhones</span>
      </header>

      {/* Mobile: barra inferior fixa */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-2 px-4 min-w-[80px] transition-colors ${
                pathname === link.href
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
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
