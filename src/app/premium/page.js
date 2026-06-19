'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

const FEATURES = [
  { free: '5 ürün takibi', premium: 'Sınırsız ürün takibi' },
  { free: 'Günde 1 alarm', premium: 'Sınırsız alarm' },
  { free: 'Temel fiyat grafiği', premium: 'Gelişmiş ML tahmin motoru' },
  { free: 'E-posta bildirimi', premium: 'SMS + Telegram + Push bildirimi' },
  { free: '—', premium: 'Öncelikli fiyat güncelleme (her 15dk)' },
  { free: '—', premium: 'Kişisel tasarruf raporu (haftalık)' },
  { free: '—', premium: 'Reklamsız deneyim' },
];

export default function PremiumPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isPremium = session?.user?.isPremium;

  const handleUpgrade = async () => {
    if (!session) { router.push('/giris'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Ödeme başlatılamadı.');
      }
    } catch {
      alert('Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ paddingTop: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💎</div>
        <h1 style={{ fontSize: '32px', fontWeight: '800' }}>
          <span className="gradient">FiyatTakip Premium</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '8px' }}>
          Tam erişim. Sınırsız takip. Akıllı tahminler.
        </p>
      </div>

      {isPremium && (
        <div style={{
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '12px', padding: '16px 20px',
          textAlign: 'center', marginBottom: '32px',
          color: '#22c55e', fontWeight: '700', fontSize: '14px',
        }}>
          ✅ Premium üyeliğiniz aktif!
        </div>
      )}

      {/* Pricing Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Free */}
        <div className="dashboard-panel" style={{ padding: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Ücretsiz</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>₺0</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Sonsuza dek</div>
          <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FEATURES.map((f, i) => (
              <li key={i} style={{ fontSize: '13px', color: f.free === '—' ? 'var(--text-muted)' : 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                <span>{f.free === '—' ? '✗' : '✓'}</span> {f.free === '—' ? f.premium : f.free}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="dashboard-panel" style={{
          padding: '28px', textAlign: 'center',
          border: '2px solid rgba(124,58,237,0.4)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #7c3aed, #1d4ed8)',
            padding: '4px 16px', borderRadius: '20px',
            fontSize: '11px', fontWeight: '700', color: '#fff',
          }}>ÖNERİLEN</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Premium</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>₺49<span style={{ fontSize: '16px', fontWeight: '500' }}>/ay</span></div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>İstediğiniz zaman iptal</div>
          <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {FEATURES.map((f, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#a78bfa', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#22c55e' }}>✓</span> {f.premium}
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={loading || isPremium}
            style={{
              width: '100%', padding: '12px',
              background: isPremium ? 'var(--gray-700)' : 'linear-gradient(135deg, #7c3aed, #1d4ed8)',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '14px', fontWeight: '700', cursor: isPremium ? 'default' : 'pointer',
            }}
          >
            {isPremium ? '✅ Aktif' : loading ? 'Yükleniyor...' : 'Premium\'a Geç →'}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>← Ana Sayfaya Dön</Link>
      </div>
    </div>
  );
}
