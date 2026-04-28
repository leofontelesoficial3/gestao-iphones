'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import ProtectedRoute from './ProtectedRoute';
import Navbar from './Navbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isLojaPublica = pathname.startsWith('/loja/');

  // Loja pública: renderiza sem nav nem container — layout próprio
  if (isLojaPublica) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      {!isLogin && user && <Navbar />}
      {isLogin ? (
        children
      ) : (
        <main className="flex-1 container mx-auto px-4 py-4 md:py-6 max-w-7xl pb-20 md:pb-6">
          {children}
        </main>
      )}
    </ProtectedRoute>
  );
}
