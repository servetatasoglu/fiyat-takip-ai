import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CompareProvider } from '@/contexts/CompareContext';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import CompareBar from '@/components/CompareBar';
import AIChatbot from '@/components/AIChatbot';
import AuthProvider from '@/components/AuthProvider';
import AuthNav from '@/components/AuthNav';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'FiyatTakip — Trendyol, Hepsiburada & Amazon Fiyat Karşılaştırma',
  description:
    'Trendyol, Hepsiburada ve Amazon ürünlerinin fiyat geçmişini takip edin. Gerçek indirimleri tespit edin, sahte yorumları filtreleyin, yapay zeka destekli kararlar alın.',
  keywords: ['trendyol', 'hepsiburada', 'amazon', 'fiyat takip', 'indirim', 'fiyat karşılaştırma', 'türkiye'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FiyatTakip',
  },
  openGraph: {
    title: 'FiyatTakip — Akıllı Fiyat Karşılaştırma',
    description: 'Trendyol, Hepsiburada ve Amazon fiyatlarını karşılaştırın. Gerçek indirimleri bulun.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <CompareProvider>
              <ServiceWorkerRegistrar />
              <nav className="navbar">
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <a href="/" className="logo">
                    <div className="logo-icon">📉</div>
                    <div className="logo-text">Fiyat<span>Takip</span></div>
                  </a>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <a href="/aktuel" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>🛒 Aktüel</a>
                    <a href="/compare" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>⚖️ Karşılaştır</a>
                    <a href="/alerts" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>🔔 Alarmlar</a>
                    <a href="/premium" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>💎 Premium</a>
                    <AuthNav />
                  </div>
                </div>
              </nav>
              <LiveTicker />
              <main style={{ paddingBottom: '80px', minHeight: '80vh' }}>{children}</main>
              <CompareBar />
              <AIChatbot />
              <Footer />
            </CompareProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
