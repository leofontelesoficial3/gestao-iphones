import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'iPhones Fortaleza — Gestão',
  description: 'Sistema de gestão de compra e venda — iPhones Fortaleza',
  icons: {
    icon: '/pwa-icon.jpg',
    shortcut: '/pwa-icon.jpg',
    apple: '/pwa-icon.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2a2a3d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="iPhones FTZ" />
        <meta name="application-name" content="iPhones Fortaleza" />
        <link rel="manifest" href="/manifest.json" />
        {/* Ícones para 'Adicionar à Tela de Início' — iOS e Android */}
        <link rel="icon" type="image/jpeg" href="/pwa-icon.jpg" />
        <link rel="apple-touch-icon" href="/pwa-icon.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa-icon.jpg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/pwa-icon.jpg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/pwa-icon.jpg" />
        <link rel="apple-touch-icon" sizes="120x120" href="/pwa-icon.jpg" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
