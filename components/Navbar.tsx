'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/estoque', label: 'Estoque' },
  { href: '/vendas', label: 'Vendas' },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center gap-8 shadow-lg">
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
  );
}
