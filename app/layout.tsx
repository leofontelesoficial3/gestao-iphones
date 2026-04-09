import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'iPhones Fortaleza — Gestão',
  description: 'Sistema de gestão de compra e venda — iPhones Fortaleza',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2a2a3d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
