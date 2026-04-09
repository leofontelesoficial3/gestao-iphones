'use client';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ADMIN_ROUTES = ['/', '/vendas'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
    // Vendedor tentando acessar rota de admin → redireciona pro estoque
    if (!loading && user && !isAdmin && ADMIN_ROUTES.includes(pathname)) {
      router.replace('/estoque');
    }
  }, [user, loading, pathname, router, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') return null;
  if (user && !isAdmin && ADMIN_ROUTES.includes(pathname)) return null;

  return <>{children}</>;
}
