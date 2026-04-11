import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'iPhones Fortaleza — Gestão',
  description: 'Sistema de gestão de compra e venda — iPhones Fortaleza',
  icons: {
    icon: [
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/pwa-icon-192.png',
    apple: '/apple-touch-icon.png',
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
        {/* PNG quadrado com logo centralizado preservando a proporção original */}
        <link rel="icon" type="image/png" sizes="192x192" href="/pwa-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/pwa-icon-512.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
